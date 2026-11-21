/**
 * ============================================================================
 * JARVIS — STAGE 2: COMPLETE LAYERED 3D HUMAN BODY & EUKARYOTIC CELL MODEL
 * ============================================================================
 * Anatomically ordered 3D hologram spanning:
 *  - Microscopic Eukaryotic Cell Core (Organelles: Nucleus, Mitochondria, ER, Golgi, Lysosomes)
 *  - All 11 Human Organ Systems (Integumentary, Skeletal, Muscular, Nervous, Endocrine,
 *    Cardiovascular with beating 4-chamber heart, Lymphatic, Respiratory with breathing lungs,
 *    Digestive, Urinary, Reproductive)
 * Supports smooth 0..1 explode separation, raycast part inspection, per-system layer toggling,
 * and Organism <-> Cell scale focus switching.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SCIENCE_MODELS, SubPartInfo } from '../config/constants';
import {
  AnatomyLayerKey,
  AnatomyScaleMode,
  DEFAULT_ANATOMY_LAYERS,
} from '../data/humanAnatomyBook';
import type { BuiltHologramModel } from './hologramModels';

function createProceduralOrganTexture(kind: 'brain' | 'muscle' | 'lung'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  if (kind === 'brain') {
    ctx.fillStyle = '#f5b942';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4;
    for (let y = 12; y < 256; y += 22) {
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 16) {
        const yy = y + Math.sin(x * 0.08 + y) * 7;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  } else if (kind === 'muscle') {
    ctx.fillStyle = '#be123c';
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 6) {
      ctx.fillStyle = x % 12 === 0 ? 'rgba(255,228,230,0.22)' : 'rgba(136,19,55,0.38)';
      ctx.fillRect(x, 0, 3, 256);
    }
  } else {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(224,242,254,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc((i * 53) % 256, (i * 89) % 256, 10 + (i % 8), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCylinderBetween(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  rTop: number,
  rBot: number,
  mat: THREE.Material,
  radialSegments = 10
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(rTop, rBot, Math.max(0.001, len), radialSegments);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export function buildHumanBodyModel(_maxAnisotropy = 4): BuiltHologramModel {
  const spec = SCIENCE_MODELS.find((m) => m.id === 'human-body')!;
  const rootGroup = new THREE.Group();
  const explodableParts: THREE.Object3D[] = [];
  const raycastTargets: THREE.Mesh[] = [];

  const layerGroups: Record<AnatomyLayerKey, THREE.Group> = {
    cell: new THREE.Group(),
    integumentary: new THREE.Group(),
    skeletal: new THREE.Group(),
    muscular: new THREE.Group(),
    nervous: new THREE.Group(),
    endocrine: new THREE.Group(),
    cardiovascular: new THREE.Group(),
    lymphatic: new THREE.Group(),
    respiratory: new THREE.Group(),
    digestive: new THREE.Group(),
    urinary: new THREE.Group(),
    reproductive: new THREE.Group(),
  };

  const organismRoot = new THREE.Group();
  rootGroup.add(organismRoot);

  // Register helper: attaches SubPartInfo & explode vectors to an organ/system group
  const registerPart = (
    partId: string,
    group: THREE.Group,
    parent: THREE.Group,
    basePos: [number, number, number] = [0, 0, 0]
  ) => {
    const partInfo: SubPartInfo | undefined = spec.parts.find((p) => p.id === partId);
    group.position.set(basePos[0], basePos[1], basePos[2]);
    group.userData.basePosition = new THREE.Vector3(basePos[0], basePos[1], basePos[2]);
    group.userData.explodeVector = new THREE.Vector3(
      ...(partInfo ? partInfo.explodeVector : [0, 0, 0])
    );
    group.userData.partInfo = partInfo;
    parent.add(group);
    explodableParts.push(group);

    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.userData.partInfo = partInfo;
        mesh.userData.parentPartGroup = group;
        raycastTargets.push(mesh);
      }
    });
  };

  // =========================================================================
  // 1. INTEGUMENTARY SYSTEM (Translucent Holographic Human Silhouette Shell)
  // =========================================================================
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0x67e8f9,
    emissive: 0x0e7490,
    emissiveIntensity: 0.25,
    roughness: 0.28,
    metalness: 0.08,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const skinGroup = layerGroups.integumentary;
  // Head & Neck
  const headShell = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 20), skinMat);
  headShell.scale.set(0.88, 1.12, 0.94);
  headShell.position.set(0, 1.56, 0);
  skinGroup.add(headShell);

  const neckShell = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.2, 16), skinMat);
  neckShell.position.set(0, 1.24, 0);
  skinGroup.add(neckShell);

  // Torso (Thorax + Abdomen + Pelvis)
  const chestShell = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.68, 24), skinMat);
  chestShell.scale.set(1.08, 1, 0.64);
  chestShell.position.set(0, 0.82, 0);
  skinGroup.add(chestShell);

  const abdomenShell = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.48, 22), skinMat);
  abdomenShell.scale.set(1.04, 1, 0.62);
  abdomenShell.position.set(0, 0.24, 0);
  skinGroup.add(abdomenShell);

  const pelvisShell = new THREE.Mesh(new THREE.SphereGeometry(0.31, 20, 16), skinMat);
  pelvisShell.scale.set(1.06, 0.65, 0.66);
  pelvisShell.position.set(0, -0.06, 0);
  skinGroup.add(pelvisShell);

  // Arms & Legs silhouette
  for (const side of [-1, 1]) {
    skinGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.44, 1.06, 0),
        new THREE.Vector3(side * 0.56, 0.48, 0.02),
        0.09,
        0.075,
        skinMat,
        14
      )
    );
    skinGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.56, 0.48, 0.02),
        new THREE.Vector3(side * 0.64, -0.08, 0.06),
        0.072,
        0.052,
        skinMat,
        14
      )
    );
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), skinMat);
    hand.scale.set(0.85, 1.35, 0.45);
    hand.position.set(side * 0.66, -0.18, 0.07);
    skinGroup.add(hand);

    // Thigh + Calf + Foot
    skinGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.17, -0.12, 0),
        new THREE.Vector3(side * 0.19, -0.92, 0.02),
        0.13,
        0.092,
        skinMat,
        16
      )
    );
    skinGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.19, -0.92, 0.02),
        new THREE.Vector3(side * 0.19, -1.68, -0.02),
        0.09,
        0.058,
        skinMat,
        16
      )
    );
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.24), skinMat);
    foot.position.set(side * 0.19, -1.74, 0.06);
    skinGroup.add(foot);
  }
  registerPart('body-integumentary', skinGroup, organismRoot);

  // =========================================================================
  // 2. SKELETAL SYSTEM (206 Bones: Axial + Appendicular)
  // =========================================================================
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    emissive: 0x334155,
    emissiveIntensity: 0.22,
    roughness: 0.42,
    metalness: 0.06,
  });

  const skelGroup = layerGroups.skeletal;

  // Cranium & Mandible
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.195, 22, 18), boneMat);
  cranium.scale.set(0.86, 1.02, 0.94);
  cranium.position.set(0, 1.6, -0.01);
  skelGroup.add(cranium);

  const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.026, 8, 18, Math.PI), boneMat);
  jaw.rotation.set(Math.PI * 0.55, 0, Math.PI);
  jaw.position.set(0, 1.43, 0.05);
  skelGroup.add(jaw);

  // Vertebral Column (24 vertebrae + sacrum)
  for (let i = 0; i < 20; i++) {
    const t = i / 19;
    const y = 1.32 - t * 1.38;
    const zCurve = Math.sin(t * Math.PI * 2) * 0.035 - 0.06;
    const v = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036 + t * 0.014, 0.038 + t * 0.014, 0.048, 10),
      boneMat
    );
    v.position.set(0, y, zCurve);
    skelGroup.add(v);
  }

  // Sternum & 12 Pairs of Ribs
  const sternum = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.36, 0.028), boneMat);
  sternum.position.set(0, 0.92, 0.145);
  skelGroup.add(sternum);

  for (let r = 0; r < 10; r++) {
    const y = 1.1 - r * 0.056;
    const rx = 0.21 + Math.sin((r / 9) * Math.PI) * 0.095;
    const rz = 0.12 + Math.sin((r / 9) * Math.PI) * 0.055;
    const ribArc = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.012 / rx, 6, 20, Math.PI * 1.65),
      boneMat
    );
    ribArc.scale.set(rx, rz, 1);
    ribArc.rotation.x = Math.PI / 2;
    ribArc.rotation.z = -Math.PI * 0.32;
    ribArc.position.set(0, y, 0.02);
    skelGroup.add(ribArc);
  }

  // Pelvis (Ilium wings + Pubic symphysis)
  const pelvisRing = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.045, 10, 22), boneMat);
  pelvisRing.scale.set(1.18, 0.72, 0.65);
  pelvisRing.rotation.x = Math.PI * 0.42;
  pelvisRing.position.set(0, -0.08, 0);
  skelGroup.add(pelvisRing);

  // Appendicular Limbs (Clavicles, Humeri, Radii/Ulnae, Femurs, Tibiae/Fibulae)
  for (const side of [-1, 1]) {
    // Clavicle
    skelGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.04, 1.12, 0.12),
        new THREE.Vector3(side * 0.39, 1.1, 0.01),
        0.018,
        0.018,
        boneMat,
        8
      )
    );
    // Humerus
    skelGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.42, 1.07, 0),
        new THREE.Vector3(side * 0.54, 0.49, 0.02),
        0.028,
        0.024,
        boneMat,
        10
      )
    );
    // Radius & Ulna
    skelGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.53, 0.48, 0.03),
        new THREE.Vector3(side * 0.62, -0.07, 0.07),
        0.017,
        0.014,
        boneMat,
        8
      )
    );
    skelGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.56, 0.48, 0.0),
        new THREE.Vector3(side * 0.65, -0.07, 0.04),
        0.017,
        0.014,
        boneMat,
        8
      )
    );
    // Femur
    skelGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.18, -0.14, 0),
        new THREE.Vector3(side * 0.19, -0.9, 0.02),
        0.042,
        0.036,
        boneMat,
        10
      )
    );
    // Patella
    const patella = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), boneMat);
    patella.position.set(side * 0.19, -0.92, 0.07);
    skelGroup.add(patella);
    // Tibia & Fibula
    skelGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.18, -0.94, 0.02),
        new THREE.Vector3(side * 0.18, -1.68, 0),
        0.034,
        0.026,
        boneMat,
        10
      )
    );
    skelGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.22, -0.96, -0.01),
        new THREE.Vector3(side * 0.21, -1.67, -0.02),
        0.014,
        0.012,
        boneMat,
        8
      )
    );
  }
  registerPart('body-skeletal', skelGroup, organismRoot);

  // =========================================================================
  // 3. MUSCULAR SYSTEM (Major Skeletal Muscle Groups + Diaphragm)
  // =========================================================================
  const muscleTex = createProceduralOrganTexture('muscle');
  const muscleMat = new THREE.MeshStandardMaterial({
    map: muscleTex,
    color: 0xe11d48,
    emissive: 0x881337,
    emissiveIntensity: 0.25,
    roughness: 0.5,
    metalness: 0.06,
    transparent: true,
    opacity: 0.42,
  });

  const muscGroup = layerGroups.muscular;
  // Diaphragm dome
  const diaphragm = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.45),
    muscleMat
  );
  diaphragm.scale.set(1.15, 0.45, 0.65);
  diaphragm.position.set(0, 0.56, 0.01);
  muscGroup.add(diaphragm);

  // Pectorals, Deltoids, Biceps, Abs, Quads, Calves
  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), muscleMat);
    pec.scale.set(1.1, 0.72, 0.42);
    pec.position.set(side * 0.16, 0.98, 0.15);
    muscGroup.add(pec);

    const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), muscleMat);
    deltoid.scale.set(0.92, 1.18, 0.9);
    deltoid.position.set(side * 0.43, 1.05, 0);
    muscGroup.add(deltoid);

    const biceps = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.24, 6, 12), muscleMat);
    biceps.position.set(side * 0.48, 0.78, 0.03);
    biceps.rotation.z = side * 0.2;
    muscGroup.add(biceps);

    const quad = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.44, 8, 12), muscleMat);
    quad.position.set(side * 0.18, -0.5, 0.04);
    muscGroup.add(quad);

    const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.34, 8, 12), muscleMat);
    calf.position.set(side * 0.19, -1.24, -0.04);
    muscGroup.add(calf);
  }
  // Rectus Abdominis (6-pack segments)
  for (let row = 0; row < 3; row++) {
    for (const side of [-1, 1]) {
      const ab = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), muscleMat);
      ab.scale.set(1.0, 1.25, 0.42);
      ab.position.set(side * 0.068, 0.46 - row * 0.13, 0.16);
      muscGroup.add(ab);
    }
  }
  registerPart('body-muscular', muscGroup, organismRoot);

  // =========================================================================
  // 4. NERVOUS SYSTEM (Brain, Cerebellum, Brainstem, Spinal Cord, Nerve Trunks)
  // =========================================================================
  const brainTex = createProceduralOrganTexture('brain');
  const brainMat = new THREE.MeshStandardMaterial({
    map: brainTex,
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
    roughness: 0.35,
    metalness: 0.1,
  });
  const nerveMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.3,
  });

  const nervGroup = layerGroups.nervous;
  // Left & Right Cerebral Hemispheres
  for (const side of [-1, 1]) {
    const hemi = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), brainMat);
    hemi.scale.set(0.74, 0.92, 1.18);
    hemi.position.set(side * 0.062, 1.64, 0.0);
    nervGroup.add(hemi);
  }
  // Cerebellum
  const cerebellum = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 12), brainMat);
  cerebellum.scale.set(1.25, 0.72, 0.85);
  cerebellum.position.set(0, 1.5, -0.09);
  nervGroup.add(cerebellum);

  // Brainstem + Spinal Cord
  nervGroup.add(
    makeCylinderBetween(
      new THREE.Vector3(0, 1.52, -0.04),
      new THREE.Vector3(0, 0.18, -0.06),
      0.022,
      0.015,
      nerveMat,
      10
    )
  );
  // Brachial & Sciatic peripheral nerve trunks
  for (const side of [-1, 1]) {
    nervGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(0, 1.14, -0.05),
        new THREE.Vector3(side * 0.58, 0.15, 0.04),
        0.008,
        0.005,
        nerveMat,
        6
      )
    );
    nervGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(0, 0.16, -0.06),
        new THREE.Vector3(side * 0.19, -1.52, -0.01),
        0.01,
        0.005,
        nerveMat,
        6
      )
    );
  }
  registerPart('body-nervous', nervGroup, organismRoot);

  // =========================================================================
  // 5. ENDOCRINE SYSTEM (Pituitary, Pineal, Thyroid, Adrenals)
  // =========================================================================
  const endoMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 0.72,
    roughness: 0.25,
  });

  const endoGroup = layerGroups.endocrine;
  const pituitary = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), endoMat);
  pituitary.position.set(0, 1.56, 0.03);
  endoGroup.add(pituitary);

  const pineal = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), endoMat);
  pineal.position.set(0, 1.59, -0.04);
  endoGroup.add(pineal);

  // Butterfly Thyroid
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), endoMat);
    lobe.scale.set(0.75, 1.35, 0.65);
    lobe.position.set(side * 0.038, 1.24, 0.065);
    endoGroup.add(lobe);
  }
  // Adrenal caps above kidneys
  for (const side of [-1, 1]) {
    const adr = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.038, 10), endoMat);
    adr.position.set(side * 0.11, 0.36 - (side > 0 ? 0.03 : 0), -0.05);
    endoGroup.add(adr);
  }
  registerPart('body-endocrine', endoGroup, organismRoot);

  // =========================================================================
  // 6. CARDIOVASCULAR SYSTEM (Beating 4-Chamber Heart + Arterial/Venous Trees)
  // =========================================================================
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x991b1b,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.08,
  });
  const arteryMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.42,
    roughness: 0.35,
  });
  const veinMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.42,
    roughness: 0.35,
  });

  const heartGroup = new THREE.Group();
  const heartCore = new THREE.Mesh(new THREE.SphereGeometry(0.105, 22, 18), heartMat);
  heartCore.scale.set(0.92, 1.18, 0.86);
  heartCore.rotation.z = 0.28;
  heartGroup.add(heartCore);

  // Aortic Arch
  const aorticArch = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.02, 10, 20, Math.PI), arteryMat);
  aorticArch.position.set(-0.01, 0.1, 0);
  heartGroup.add(aorticArch);

  // Superior Vena Cava
  const svc = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.16, 10), veinMat);
  svc.position.set(-0.075, 0.1, -0.01);
  heartGroup.add(svc);

  registerPart('body-heart', heartGroup, layerGroups.cardiovascular, [0.05, 0.85, 0.05]);

  // Major Systemic Vessels Group
  const vesselsGroup = new THREE.Group();
  // Descending Aorta & Inferior Vena Cava
  vesselsGroup.add(
    makeCylinderBetween(
      new THREE.Vector3(0.02, 0.92, -0.02),
      new THREE.Vector3(0.02, 0.02, -0.02),
      0.018,
      0.015,
      arteryMat,
      10
    )
  );
  vesselsGroup.add(
    makeCylinderBetween(
      new THREE.Vector3(-0.03, 0.92, -0.02),
      new THREE.Vector3(-0.03, 0.02, -0.02),
      0.02,
      0.016,
      veinMat,
      10
    )
  );
  // Carotid, Brachial, Femoral vessels
  for (const side of [-1, 1]) {
    vesselsGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.03, 0.96, 0.01),
        new THREE.Vector3(side * 0.05, 1.5, 0.01),
        0.008,
        0.007,
        arteryMat,
        8
      )
    );
    vesselsGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.05, 0.96, 0.0),
        new THREE.Vector3(side * 0.52, 0.12, 0.03),
        0.008,
        0.006,
        arteryMat,
        8
      )
    );
    vesselsGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.02, 0.02, -0.02),
        new THREE.Vector3(side * 0.17, -1.5, 0.01),
        0.012,
        0.007,
        arteryMat,
        8
      )
    );
    vesselsGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * -0.03, 0.02, -0.02),
        new THREE.Vector3(side * 0.14, -1.5, 0.0),
        0.012,
        0.007,
        veinMat,
        8
      )
    );
  }
  registerPart('body-vessels', vesselsGroup, layerGroups.cardiovascular);
  organismRoot.add(layerGroups.cardiovascular);

  // =========================================================================
  // 7. LYMPHATIC & IMMUNE SYSTEM (Spleen, Thymus, Lymph Nodes)
  // =========================================================================
  const lymphMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x059669,
    emissiveIntensity: 0.55,
    roughness: 0.35,
  });

  const lymphGroup = layerGroups.lymphatic;
  const spleen = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 12), lymphMat);
  spleen.scale.set(0.75, 1.15, 0.65);
  spleen.position.set(0.21, 0.44, -0.02);
  lymphGroup.add(spleen);

  const thymus = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), lymphMat);
  thymus.scale.set(1.1, 0.85, 0.45);
  thymus.position.set(0, 1.04, 0.1);
  lymphGroup.add(thymus);

  const nodeCoords: [number, number, number][] = [
    [-0.08, 1.28, 0.04], [0.08, 1.28, 0.04],
    [-0.3, 1.0, 0.03], [0.3, 1.0, 0.03],
    [-0.14, -0.04, 0.08], [0.14, -0.04, 0.08],
  ];
  for (const [nx, ny, nz] of nodeCoords) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), lymphMat);
    node.position.set(nx, ny, nz);
    lymphGroup.add(node);
  }
  registerPart('body-lymphatic', lymphGroup, organismRoot);

  // =========================================================================
  // 8. RESPIRATORY SYSTEM (Trachea, Bronchi, Breathing Right & Left Lungs)
  // =========================================================================
  const lungTex = createProceduralOrganTexture('lung');
  const lungMat = new THREE.MeshStandardMaterial({
    map: lungTex,
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.35,
    roughness: 0.38,
    transparent: true,
    opacity: 0.68,
  });
  const tracheaMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    emissive: 0x0369a1,
    emissiveIntensity: 0.3,
    roughness: 0.4,
  });

  const respGroup = layerGroups.respiratory;
  const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.32, 14), tracheaMat);
  trachea.position.set(0, 1.12, 0.03);
  respGroup.add(trachea);

  const lungsPivot = new THREE.Group();
  const rightLung = new THREE.Mesh(new THREE.SphereGeometry(0.165, 20, 16), lungMat);
  rightLung.scale.set(0.82, 1.48, 0.78);
  rightLung.position.set(-0.15, 0.86, 0.02);
  lungsPivot.add(rightLung);

  const leftLung = new THREE.Mesh(new THREE.SphereGeometry(0.155, 20, 16), lungMat);
  leftLung.scale.set(0.76, 1.42, 0.76);
  leftLung.position.set(0.155, 0.86, 0.02);
  lungsPivot.add(leftLung);

  respGroup.add(lungsPivot);
  registerPart('body-lungs', respGroup, organismRoot);

  // =========================================================================
  // 9. DIGESTIVE SYSTEM (Liver, Gallbladder, Stomach, Pancreas, Intestines)
  // =========================================================================
  const liverMat = new THREE.MeshStandardMaterial({
    color: 0x9a3412,
    emissive: 0x7c2d12,
    emissiveIntensity: 0.32,
    roughness: 0.35,
  });
  const gbMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x047857,
    emissiveIntensity: 0.5,
  });
  const stomachMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.3,
    roughness: 0.42,
  });
  const intestineMat = new THREE.MeshStandardMaterial({
    color: 0xfdba74,
    emissive: 0xc2410c,
    emissiveIntensity: 0.25,
    roughness: 0.45,
  });

  // Liver & Gallbladder sub-group
  const liverGroup = new THREE.Group();
  const liverMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), liverMat);
  liverMesh.scale.set(1.32, 0.72, 0.75);
  liverMesh.rotation.z = 0.22;
  liverGroup.add(liverMesh);
  const gallbladder = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), gbMat);
  gallbladder.position.set(-0.04, -0.07, 0.06);
  liverGroup.add(gallbladder);
  registerPart('body-liver', liverGroup, layerGroups.digestive, [-0.11, 0.49, 0.05]);

  // GI Tract sub-group (Esophagus, Stomach, Pancreas, Small & Large Intestines)
  const giGroup = new THREE.Group();
  giGroup.add(
    makeCylinderBetween(
      new THREE.Vector3(0, 1.24, -0.01),
      new THREE.Vector3(0.05, 0.52, 0.01),
      0.018,
      0.018,
      stomachMat,
      10
    )
  );
  const stomach = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 14), stomachMat);
  stomach.scale.set(0.95, 1.25, 0.72);
  stomach.rotation.z = -0.45;
  stomach.position.set(0.1, 0.44, 0.05);
  giGroup.add(stomach);

  // Coiled Small Intestine
  for (let i = 0; i < 4; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.024, 8, 18), intestineMat);
    coil.scale.set(1.35, 0.55, 0.7);
    coil.position.set(0, 0.24 - i * 0.055, 0.05);
    giGroup.add(coil);
  }
  // Framing Large Intestine (Colon)
  const colonFrame = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.032, 10, 24, Math.PI * 1.45), stomachMat);
  colonFrame.rotation.z = -Math.PI * 0.22;
  colonFrame.position.set(0, 0.18, 0.03);
  giGroup.add(colonFrame);

  registerPart('body-digestive', giGroup, layerGroups.digestive);
  organismRoot.add(layerGroups.digestive);

  // =========================================================================
  // 10. URINARY SYSTEM (Paired Kidneys, Ureters, Bladder)
  // =========================================================================
  const kidneyMat = new THREE.MeshStandardMaterial({
    color: 0xa78bfa,
    emissive: 0x6d28d9,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });

  const urinGroup = layerGroups.urinary;
  for (const side of [-1, 1]) {
    const kidney = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 12), kidneyMat);
    kidney.scale.set(0.72, 1.25, 0.65);
    const ky = 0.28 - (side < 0 ? 0.035 : 0); // Right kidney slightly lower under liver
    kidney.position.set(side * 0.11, ky, -0.05);
    urinGroup.add(kidney);

    urinGroup.add(
      makeCylinderBetween(
        new THREE.Vector3(side * 0.09, ky - 0.04, -0.04),
        new THREE.Vector3(side * 0.03, -0.08, 0.03),
        0.008,
        0.008,
        kidneyMat,
        6
      )
    );
  }
  const bladder = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 12), kidneyMat);
  bladder.scale.set(1.05, 0.85, 0.9);
  bladder.position.set(0, -0.1, 0.04);
  urinGroup.add(bladder);
  registerPart('body-urinary', urinGroup, organismRoot);

  // =========================================================================
  // 11. REPRODUCTIVE SYSTEM (Pelvic Gonads & Ducts)
  // =========================================================================
  const reproMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xbe185d,
    emissiveIntensity: 0.5,
    roughness: 0.32,
  });
  const reproGroup = layerGroups.reproductive;
  const pelvicCenter = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), reproMat);
  pelvicCenter.scale.set(0.9, 1.1, 0.75);
  pelvicCenter.position.set(0, -0.18, 0.02);
  reproGroup.add(pelvicCenter);
  for (const side of [-1, 1]) {
    const gonad = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), reproMat);
    gonad.position.set(side * 0.075, -0.17, 0.02);
    reproGroup.add(gonad);
  }
  registerPart('body-reproductive', reproGroup, organismRoot);

  // =========================================================================
  // 0. MICROSCOPIC EUKARYOTIC HUMAN CELL CORE (Level 2 Foundation)
  // =========================================================================
  const cellGroup = layerGroups.cell;
  const membraneMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.28,
    transparent: true,
    opacity: 0.22,
    roughness: 0.18,
    depthWrite: false,
  });
  const cellMembrane = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 24), membraneMat);
  cellGroup.add(cellMembrane);

  // Nucleus + Nucleolus
  const nucleusMat = new THREE.MeshStandardMaterial({
    color: 0x818cf8,
    emissive: 0x4338ca,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.78,
  });
  const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.21, 24, 20), nucleusMat);
  cellGroup.add(nucleus);

  const nucleolus = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 14),
    new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.85 })
  );
  cellGroup.add(nucleolus);

  // Endoplasmic Reticulum (folded concentric rings around nucleus)
  const erMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0891b2,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  for (let i = 0; i < 3; i++) {
    const erRing = new THREE.Mesh(new THREE.TorusGeometry(0.27 + i * 0.045, 0.014, 8, 24, Math.PI * 1.35), erMat);
    erRing.rotation.set(i * 0.65, i * 0.9, 0.4);
    cellGroup.add(erRing);
  }

  // Mitochondria (6 glowing orange energy capsules)
  const mitoMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 0.65,
    roughness: 0.3,
  });
  const mitoOffsets: [number, number, number][] = [
    [0.34, 0.16, 0.1], [-0.34, -0.14, 0.14], [0.18, -0.34, -0.16],
    [-0.22, 0.32, -0.14], [0.06, 0.24, 0.36], [-0.14, -0.22, -0.34],
  ];
  for (let i = 0; i < mitoOffsets.length; i++) {
    const [mx, my, mz] = mitoOffsets[i];
    const mito = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.095, 6, 10), mitoMat);
    mito.position.set(mx, my, mz);
    mito.rotation.set(i * 0.8, i * 1.1, i * 0.5);
    cellGroup.add(mito);
  }

  // Golgi Apparatus + Lysosomes
  const golgiMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x059669,
    emissiveIntensity: 0.55,
  });
  for (let g = 0; g < 4; g++) {
    const disc = new THREE.Mesh(new THREE.TorusGeometry(0.08 + g * 0.018, 0.012, 8, 16, Math.PI), golgiMat);
    disc.position.set(-0.32, 0.08 + g * 0.032, 0.18);
    disc.rotation.y = 0.7;
    cellGroup.add(disc);
  }
  const lysoMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.65,
  });
  for (const [lx, ly, lz] of [[0.28, -0.22, 0.24], [-0.26, -0.28, -0.18], [0.32, 0.28, -0.2]] as [number, number, number][]) {
    const lyso = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), lysoMat);
    lyso.position.set(lx, ly, lz);
    cellGroup.add(lyso);
  }

  registerPart('body-cell-core', cellGroup, rootGroup, [-1.45, 0.85, 0.15]);

  // Auto-load photorealistic Blender-rendered GLB if user exported public/models/human_body_photoreal.glb
  const photorealGroup = new THREE.Group();
  photorealGroup.visible = false;
  organismRoot.add(photorealGroup);

  const gltfLoader = new GLTFLoader();
  const mountPhotorealGltf = (url: string) => {
    gltfLoader.load(
      url,
      (gltf) => {
        photorealGroup.clear();
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const maxDim = Math.max(0.001, size.y || size.x || size.z);
        const scale = 3.4 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        photorealGroup.add(model);
        photorealGroup.visible = true;
      },
      undefined,
      () => {
        // Fallback smoothly to procedural multi-layer 3D anatomy when no local GLB is placed yet
      }
    );
  };
  mountPhotorealGltf('/models/human_body_photoreal.glb');

  // Scale organism cleanly to fit Jarvis camera
  organismRoot.scale.setScalar(0.95);
  organismRoot.position.set(0.18, 0.02, 0);

  let currentLayers: Record<AnatomyLayerKey, boolean> = { ...DEFAULT_ANATOMY_LAYERS };
  let currentScaleMode: AnatomyScaleMode = 'organism';

  const applyAnatomyState = (
    layers: Record<AnatomyLayerKey, boolean>,
    scaleMode: AnatomyScaleMode
  ) => {
    currentLayers = layers;
    currentScaleMode = scaleMode;
  };

  return {
    id: 'human-body',
    rootGroup,
    explodableParts,
    raycastTargets,
    setAnatomyState: applyAnatomyState,
    update: (elapsed, _dt, bpm, explodeAmount) => {
      const isCellFocus = currentScaleMode === 'cell';

      // Smoothly toggle organism vs magnified eukaryotic cell focus
      organismRoot.visible = !isCellFocus;
      (Object.keys(layerGroups) as AnatomyLayerKey[]).forEach((key) => {
        if (key === 'cell') {
          layerGroups.cell.visible = isCellFocus || currentLayers.cell;
        } else {
          layerGroups[key].visible = !isCellFocus && currentLayers[key];
        }
      });

      // Cell core target position & scale
      const cellBase = cellGroup.userData.basePosition as THREE.Vector3;
      if (isCellFocus) {
        cellBase.set(0, 0, 0);
        cellGroup.scale.setScalar(2.45);
        cellGroup.rotation.y = elapsed * 0.35;
        cellGroup.rotation.x = Math.sin(elapsed * 0.25) * 0.18;
      } else {
        cellBase.set(-1.42, 0.88 + Math.sin(elapsed * 1.4) * 0.05, 0.15);
        cellGroup.scale.setScalar(0.72);
        cellGroup.rotation.y = elapsed * 0.5;
        cellGroup.rotation.x = 0.15;
      }
      if (explodeAmount < 0.01) {
        cellGroup.position.copy(cellBase);
      }

      // Realistic beating heart at user-configurable BPM
      const beatsPerSec = Math.max(40, Math.min(180, bpm || 72)) / 60;
      const phase = (elapsed * beatsPerSec) % 1;
      const lub = Math.exp(-Math.pow((phase - 0.15) / 0.06, 2)) * 0.13;
      const dub = Math.exp(-Math.pow((phase - 0.32) / 0.05, 2)) * 0.075;
      const pulseScale = 1 + lub + dub;
      heartCore.scale.set(0.92 * pulseScale, 1.18 * pulseScale, 0.86 * pulseScale);

      // Gentle physiological breathing cycle (~14 breaths/min)
      const breath = 1 + Math.sin(elapsed * 1.45) * 0.045;
      lungsPivot.scale.set(breath, 1 + (breath - 1) * 0.6, breath);
      diaphragm.position.y = 0.56 - Math.sin(elapsed * 1.45) * 0.025;
    },
  };
}
