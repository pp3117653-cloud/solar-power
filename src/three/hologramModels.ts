import * as THREE from 'three';
import { ModelId, SCIENCE_MODELS, SubPartInfo } from '../config/constants';
import { LiveSpaceTelemetry } from '../services/nasaDataService';
import { AnatomyLayerKey, AnatomyScaleMode } from '../data/humanAnatomyBook';
import { buildHumanBodyModel } from './humanBodyModel';

export interface BuiltHologramModel {
  id: ModelId;
  rootGroup: THREE.Group;
  explodableParts: THREE.Object3D[];
  raycastTargets: THREE.Mesh[];
  setAnatomyState?: (
    layers: Record<AnatomyLayerKey, boolean>,
    scaleMode: AnatomyScaleMode
  ) => void;
  update: (
    elapsed: number,
    dt: number,
    bpm: number,
    explodeAmount: number,
    liveTelemetry?: LiveSpaceTelemetry | null
  ) => void;
}

function hash2(x: number, y: number, seed = 1): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * 100% True-Color 1024x512 Procedural Planetary Surface Texture Factory
 */
function createTrueColorPlanetTexture(
  planetId: string,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (planetId === 'mercury') {
    ctx.fillStyle = '#8d877f';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) {
      const x = hash2(i, 1, 3) * w;
      const y = 14 + hash2(i, 2, 7) * (h - 28);
      const r = 1.8 + Math.pow(hash2(i, 3, 11), 2.4) * 28;
      ctx.fillStyle = `rgba(60, 57, 53, ${0.22 + hash2(i, 4, 13) * 0.32})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(218, 212, 204, ${0.22 + hash2(i, 5, 17) * 0.24})`;
      ctx.lineWidth = Math.max(0.8, r * 0.12);
      ctx.stroke();
    }
  } else if (planetId === 'venus') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#cbb07b');
    g.addColorStop(0.22, '#e6d2a4');
    g.addColorStop(0.5, '#f2e4c2');
    g.addColorStop(0.78, '#dec28d');
    g.addColorStop(1, '#bfa26c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(255, 250, 236, ${0.06 + Math.abs(Math.sin(y * 0.045)) * 0.14})`;
      ctx.fillRect(0, y, w, 2);
    }
    for (let i = 0; i < 60; i++) {
      const x = hash2(i, 1, 19) * w;
      const y = 30 + hash2(i, 2, 23) * (h - 60);
      ctx.fillStyle = 'rgba(176, 132, 68, 0.12)';
      ctx.beginPath();
      ctx.ellipse(x, y, 130, 14, (y - h / 2) * 0.0012, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (planetId === 'earth') {
    // Offline true-color fallback (upgraded automatically to NASA Blue Marble when online)
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#0a2744');
    ocean.addColorStop(0.5, '#0e477a');
    ocean.addColorStop(1, '#081f38');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2d6334';
    ctx.fillRect(140, 80, 150, 130);
    ctx.fillRect(250, 240, 85, 190);
    ctx.fillRect(465, 75, 390, 155);
    ctx.fillStyle = '#b89458';
    ctx.fillRect(465, 170, 140, 200);
    ctx.fillRect(790, 315, 115, 75);
    ctx.fillStyle = '#e5eef6';
    ctx.fillRect(0, 0, w, 24);
    ctx.fillRect(0, h - 26, w, 26);
  } else if (planetId === 'mars') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f4efea');
    g.addColorStop(0.06, '#b7522c');
    g.addColorStop(0.48, '#d46b3e');
    g.addColorStop(0.94, '#a64320');
    g.addColorStop(1, '#f4efea');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 220; i++) {
      const x = hash2(i, 1, 21) * w;
      const y = 36 + hash2(i, 2, 23) * (h - 72);
      const rx = 16 + hash2(i, 3, 29) * 86;
      const ry = 10 + hash2(i, 4, 31) * 40;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(82, 34, 18, 0.3)' : 'rgba(228, 138, 84, 0.22)';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, hash2(i, 5, 37), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(66, 22, 10, 0.72)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(255, 274);
    ctx.bezierCurveTo(335, 264, 420, 286, 512, 270);
    ctx.stroke();
    ctx.fillStyle = 'rgba(235, 165, 118, 0.45)';
    ctx.beginPath();
    ctx.arc(170, 205, 22, 0, Math.PI * 2);
    ctx.fill();
  } else if (planetId === 'jupiter') {
    const bands = [
      '#a89074', '#e6dac4', '#c58452', '#f1e7d5', '#9c5732',
      '#e4d2ae', '#bd7644', '#f2e9d6', '#965432', '#d8be98', '#b49472',
    ];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    bands.forEach((b, i) => g.addColorStop(i / (bands.length - 1), b));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(255, 248, 238, ${Math.abs(Math.sin(y * 0.14)) * 0.14})`;
      ctx.fillRect(0, y, w, 2);
    }
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = 'rgba(248, 242, 232, 0.55)';
      ctx.beginPath();
      ctx.ellipse((i * 68 + 40) % w, 365 + (i % 2) * 14, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const grs = ctx.createRadialGradient(340, 326, 4, 340, 326, 56);
    grs.addColorStop(0, '#9a2810');
    grs.addColorStop(0.48, '#d44b1e');
    grs.addColorStop(0.8, '#e87c44');
    grs.addColorStop(1, 'rgba(232,124,68,0)');
    ctx.fillStyle = grs;
    ctx.beginPath();
    ctx.ellipse(340, 326, 62, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (planetId === 'saturn') {
    const bands = [
      '#8e9aa6', '#ccb98c', '#e6d7ae', '#cfb98a', '#f2e4c2',
      '#d6c192', '#e8d8b2', '#bfa87a', '#d9c79a', '#a89268',
    ];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    bands.forEach((b, i) => g.addColorStop(i / (bands.length - 1), b));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = `rgba(255, 250, 235, ${Math.abs(Math.cos(y * 0.09)) * 0.1})`;
      ctx.fillRect(0, y, w, 2);
    }
  } else if (planetId === 'uranus') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c8f4fa');
    g.addColorStop(0.22, '#9be7f2');
    g.addColorStop(0.55, '#7dd9e8');
    g.addColorStop(1, '#68c8dc');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (planetId === 'pluto') {
    ctx.fillStyle = '#c8b6a2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(110, 72, 54, 0.55)';
    ctx.fillRect(80, 210, 320, 110);
    // Sputnik Planitia heart-shaped nitrogen ice plain
    ctx.fillStyle = 'rgba(242, 236, 228, 0.88)';
    ctx.beginPath();
    ctx.ellipse(520, 245, 76, 62, -0.15, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Neptune
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2748b8');
    g.addColorStop(0.3, '#3b6ee8');
    g.addColorStop(0.58, '#2d5ad6');
    g.addColorStop(0.82, '#3b6ee8');
    g.addColorStop(1, '#1e3a9a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(18, 34, 96, 0.52)';
    ctx.beginPath();
    ctx.ellipse(420, 304, 56, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(224, 240, 255, 0.45)';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect((i * 63) % w, 95 + (i * 21) % 310, 78, 2.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createSaturnRingTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 16;
  const ctx = c.getContext('2d')!;
  for (let x = 0; x < 512; x++) {
    const t = x / 512;
    let a = 0;
    let col: [number, number, number] = [232, 214, 178];
    if (t > 0.04 && t < 0.21) {
      a = 0.22;
      col = [178, 160, 130];
    } else if (t >= 0.21 && t < 0.58) {
      a = 0.8 + Math.sin(t * 150) * 0.14;
      col = [242, 226, 192];
    } else if (t >= 0.58 && t < 0.65) {
      a = 0.03; // Cassini Division
    } else if (t >= 0.65 && t < 0.86) {
      a = 0.6 + Math.sin(t * 190) * 0.1;
      col = [216, 200, 168];
    } else if (t >= 0.86 && t < 0.88) {
      a = 0.05; // Encke Gap
    } else if (t >= 0.88 && t < 0.93) {
      a = 0.52;
      col = [212, 198, 170];
    } else if (t >= 0.95 && t < 0.97) {
      a = 0.4;
      col = [234, 222, 198];
    }
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(2)})`;
    ctx.fillRect(x, 0, 1, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createEarthCloudTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  for (let i = 0; i < 360; i++) {
    const x = hash2(i, 1, 41) * 512;
    const y = 16 + hash2(i, 2, 43) * 224;
    const rx = 12 + hash2(i, 3, 47) * 38;
    const ry = 4 + hash2(i, 4, 53) * 10;
    const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
    g.addColorStop(0, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (hash2(i, 5, 59) - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAtmosphereRimMaterial(colorHex: number, intensity = 1.2): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uIntensity: { value: intensity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 3.0);
        gl_FragColor = vec4(uColor, fresnel * uIntensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

function registerSubPart(
  partGroup: THREE.Group,
  partInfo: SubPartInfo,
  explodableParts: THREE.Object3D[],
  raycastTargets: THREE.Mesh[]
): void {
  partGroup.userData.partInfo = partInfo;
  partGroup.userData.basePosition = partGroup.position.clone();
  partGroup.userData.explodeVector = new THREE.Vector3(...partInfo.explodeVector);
  explodableParts.push(partGroup);

  partGroup.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.userData.partInfo = partInfo;
      mesh.userData.parentPartGroup = partGroup;
      raycastTargets.push(mesh);
    }
  });
}

/**
 * COMPLETE PHOTOREALISTIC HELIOCENTRIC SOLAR SYSTEM
 * Animated GLSL Plasma Sun + All 8 True-Color Planets + Crisp Color-Matched Orbits +
 * Galilean Moons + Saturn Cassini/Encke Rings + Titan + Retrograde Triton + 1,200-Asteroid Belt
 */
function buildSolarSystemModel(maxAnisotropy: number): BuiltHologramModel {
  const spec = SCIENCE_MODELS.find((m) => m.id === 'solar')!;
  const rootGroup = new THREE.Group();
  const explodableParts: THREE.Object3D[] = [];
  const raycastTargets: THREE.Mesh[] = [];

  // Part 0: Animated GLSL Solar Photosphere + Volumetric Corona
  const sunGroup = new THREE.Group();
  const sunUniforms = { uTime: { value: 0 } };
  const sunShaderMat = new THREE.ShaderMaterial({
    uniforms: sunUniforms,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vView;
      void main() {
        vPos = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vView;
      float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
          f.z
        );
      }
      void main() {
        vec3 p = normalize(vPos) * 7.2;
        float n = noise(p + vec3(uTime * 0.14, 0.0, uTime * 0.09)) * 0.58
                + noise(p * 2.5 - vec3(0.0, uTime * 0.22, 0.0)) * 0.42;
        float limb = max(0.0, dot(normalize(vNormal), normalize(vView)));
        vec3 hot = vec3(1.0, 0.97, 0.82);
        vec3 mid = vec3(1.0, 0.62, 0.12);
        vec3 dark = vec3(0.76, 0.2, 0.03);
        vec3 col = mix(dark, mix(mid, hot, smoothstep(0.45, 0.86, n)), smoothstep(0.16, 0.74, n));
        col *= (0.7 + 0.45 * pow(limb, 0.45));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(0.58, 56, 42), sunShaderMat);
  sunGroup.add(sunMesh);
  sunGroup.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.76, 40, 32),
      createAtmosphereRimMaterial(0xffa526, 1.32)
    )
  );
  // Layered corona shells create a soft, solar-scale falloff without a costly
  // post-processing bloom pass. Each shell has a different fresnel profile.
  sunGroup.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.88, 32, 24),
      createAtmosphereRimMaterial(0xff6b1a, 0.48)
    )
  );
  sunGroup.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(1.04, 28, 20),
      createAtmosphereRimMaterial(0xffc04a, 0.22)
    )
  );
  const solarFlareRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.88, 0.012, 8, 96),
    new THREE.MeshBasicMaterial({
      color: 0xff9f2d,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  solarFlareRing.rotation.x = Math.PI * 0.28;
  sunGroup.add(solarFlareRing);
  sunGroup.add(new THREE.PointLight(0xfff7e8, 3.8, 16, 1.1));
  rootGroup.add(sunGroup);
  registerSubPart(sunGroup, spec.parts[0], explodableParts, raycastTargets);

  // Days since J2000.0 for real heliocentric starting longitudes
  const daysSinceJ2000 = (Date.now() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;

  const planetConfigs = [
    { idx: 1, id: 'mercury', radius: 0.92, size: 0.085, speed: 1.55, tilt: 0.04, axialTilt: 0.03, periodDays: 87.97, L0: 252.25, orbitCol: 0x9ca3af },
    { idx: 2, id: 'venus', radius: 1.22, size: 0.132, speed: 1.2, tilt: 0.06, axialTilt: 3.09, periodDays: 224.7, L0: 181.98, orbitCol: 0xe5cf9c },
    { idx: 3, id: 'earth', radius: 1.56, size: 0.148, speed: 0.95, tilt: 0.08, axialTilt: 0.41, periodDays: 365.256, L0: 100.46, orbitCol: 0x38bdf8 },
    { idx: 4, id: 'mars', radius: 1.9, size: 0.112, speed: 0.78, tilt: 0.1, axialTilt: 0.44, periodDays: 686.98, L0: 355.45, orbitCol: 0xea580c },
    { idx: 5, id: 'jupiter', radius: 2.52, size: 0.285, speed: 0.48, tilt: 0.05, axialTilt: 0.05, periodDays: 4332.59, L0: 34.4, orbitCol: 0xd97706 },
    { idx: 6, id: 'saturn', radius: 3.12, size: 0.235, speed: 0.36, tilt: 0.12, axialTilt: 0.47, periodDays: 10759.22, L0: 49.94, orbitCol: 0xeab308 },
    { idx: 7, id: 'uranus', radius: 3.62, size: 0.172, speed: 0.26, tilt: 0.15, axialTilt: 1.71, periodDays: 30688.5, L0: 313.23, orbitCol: 0x67e8f9 },
    { idx: 8, id: 'neptune', radius: 4.06, size: 0.168, speed: 0.2, tilt: 0.08, axialTilt: 0.49, periodDays: 60182, L0: 304.88, orbitCol: 0x3b82f6 },
    { idx: 9, id: 'pluto', radius: 4.58, size: 0.082, speed: 0.14, tilt: 1.35, axialTilt: 2.13, periodDays: 90560, L0: 238.93, orbitCol: 0x94a3b8 },
  ];

  // 600 GPU-instanced, dark irregular rocks between Mars and Jupiter.
  const asteroidCount = 600;
  const asteroidBelt = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.015, 0),
    new THREE.MeshStandardMaterial({ color: 0x353b43, roughness: 0.95, metalness: 0.05 }),
    asteroidCount
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < asteroidCount; i++) {
    const a = (i / asteroidCount) * Math.PI * 2 + hash2(i, 1, 201) * 0.35;
    const r = 2.08 + hash2(i, 2, 203) * 0.26;
    const y = (hash2(i, 3, 205) - 0.5) * 0.09;
    dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    dummy.rotation.set(hash2(i, 4, 207) * 6, hash2(i, 5, 209) * 6, 0);
    // Base radius 0.015 -> 0.010..0.030 world units.
    dummy.scale.setScalar(2 / 3 + hash2(i, 6, 211) * 4 / 3);
    dummy.updateMatrix();
    asteroidBelt.setMatrixAt(i, dummy.matrix);
  }
  asteroidBelt.instanceMatrix.needsUpdate = true;
  rootGroup.add(asteroidBelt);

  const planetOrbitData: Array<{
    group: THREE.Group;
    mesh: THREE.Mesh;
    radius: number;
    speed: number;
    phase: number;
    tilt: number;
    clouds?: THREE.Mesh;
    moon?: THREE.Mesh;
    titan?: THREE.Mesh;
    triton?: THREE.Mesh;
    galilean?: Array<{ mesh: THREE.Mesh; r: number; spd: number; phase: number }>;
  }> = [];

  planetConfigs.forEach((cfg) => {
    // Crisp 256-segment color-matched orbit line
    const orbitPts: THREE.Vector3[] = [];
    for (let s = 0; s < 256; s++) {
      const th = (s / 256) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(Math.cos(th) * cfg.radius, 0, Math.sin(th) * cfg.radius));
    }
    const orbitLine = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(orbitPts),
      new THREE.LineBasicMaterial({ color: 0x8a94a6, transparent: true, opacity: 0.45 })
    );
    rootGroup.add(orbitLine);

    const pGroup = new THREE.Group();
    const phase = THREE.MathUtils.degToRad((cfg.L0 + (360 / cfg.periodDays) * daysSinceJ2000) % 360);
    pGroup.position.set(Math.cos(phase) * cfg.radius, 0, Math.sin(phase) * cfg.radius);

    const pTex = createTrueColorPlanetTexture(cfg.id, maxAnisotropy);
    const pMat = new THREE.MeshStandardMaterial({
      map: pTex,
      roughness: cfg.id === 'jupiter' || cfg.id === 'saturn' ? 0.6 : 0.82,
      metalness: 0.05,
    });

    // Stream real NASA Blue Marble texture for Earth when online
    if (cfg.id === 'earth') {
      try {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg', (nasaMap) => {
          nasaMap.colorSpace = THREE.SRGBColorSpace;
          nasaMap.anisotropy = maxAnisotropy;
          pMat.map = nasaMap;
          pMat.roughness = 0.56;
          pMat.needsUpdate = true;
        });
      } catch {
        // Keep procedural Earth offline
      }
    }

    const pMesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.size, 44, 32), pMat);
    pMesh.rotation.z = cfg.axialTilt;
    pGroup.add(pMesh);

    const item: (typeof planetOrbitData)[number] = {
      group: pGroup,
      mesh: pMesh,
      radius: cfg.radius,
      speed: cfg.speed,
      phase,
      tilt: cfg.tilt,
    };

    if (cfg.id === 'earth') {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(cfg.size * 1.022, 32, 24),
        new THREE.MeshBasicMaterial({ map: createEarthCloudTexture(), transparent: true, opacity: 0.55, depthWrite: false })
      );
      pGroup.add(clouds);
      item.clouds = clouds;

      pGroup.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(cfg.size * 1.09, 32, 24),
          createAtmosphereRimMaterial(0x52b6ff, 1.18)
        )
      );

      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 18, 14),
        new THREE.MeshStandardMaterial({ color: 0xb8bdc6, roughness: 0.92 })
      );
      pGroup.add(moon);
      item.moon = moon;
    }

    if (cfg.id === 'jupiter') {
      item.galilean = [
        { r: cfg.size * 1.45, sz: 0.022, col: 0xeab308, spd: 2.2 },
        { r: cfg.size * 1.72, sz: 0.02, col: 0xe2e8f0, spd: 1.5 },
        { r: cfg.size * 2.02, sz: 0.028, col: 0x9ca3af, spd: 1.0 },
        { r: cfg.size * 2.34, sz: 0.025, col: 0x6b7280, spd: 0.65 },
      ].map((m, i) => {
        const mm = new THREE.Mesh(
          new THREE.SphereGeometry(m.sz, 14, 10),
          new THREE.MeshStandardMaterial({ color: m.col, roughness: 0.8 })
        );
        pGroup.add(mm);
        return { mesh: mm, r: m.r, spd: m.spd, phase: i * 1.6 };
      });
    }

    if (cfg.id === 'saturn') {
      const rGeo = new THREE.RingGeometry(cfg.size * 1.24, cfg.size * 2.44, 96);
      const pos = rGeo.attributes.position;
      const uv = rGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const len = Math.sqrt(pos.getX(i) ** 2 + pos.getY(i) ** 2);
        uv.setXY(i, (len - cfg.size * 1.24) / (cfg.size * (2.44 - 1.24)), 0.5);
      }
      const ringMesh = new THREE.Mesh(
        rGeo,
        new THREE.MeshStandardMaterial({
          map: createSaturnRingTexture(),
          side: THREE.DoubleSide,
          transparent: true,
          roughness: 0.72,
        })
      );
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.rotation.y = THREE.MathUtils.degToRad(26.73);
      pGroup.add(ringMesh);

      const titan = new THREE.Mesh(
        new THREE.SphereGeometry(0.036, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xdca55c, roughness: 0.72 })
      );
      pGroup.add(titan);
      item.titan = titan;
    }

    if (cfg.id === 'uranus') {
      const uRing = new THREE.Mesh(
        new THREE.RingGeometry(cfg.size * 1.45, cfg.size * 1.68, 48),
        new THREE.MeshBasicMaterial({ color: 0xb8f2fa, side: THREE.DoubleSide, transparent: true, opacity: 0.28 })
      );
      uRing.rotation.y = Math.PI * 0.15;
      pGroup.add(uRing);
    }

    if (cfg.id === 'neptune') {
      const triton = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 14, 10),
        new THREE.MeshStandardMaterial({ color: 0xd8c8c4, roughness: 0.85 })
      );
      pGroup.add(triton);
      item.triton = triton;
    }

    rootGroup.add(pGroup);
    registerSubPart(pGroup, spec.parts[cfg.idx], explodableParts, raycastTargets);
    planetOrbitData.push(item);
  });

  rootGroup.rotation.x = 0.36;

  return {
    id: 'solar',
    rootGroup,
    explodableParts,
    raycastTargets,
    update: (elapsed, _dt, _bpm, explodeAmount) => {
      sunUniforms.uTime.value = elapsed;
      sunMesh.rotation.y = elapsed * 0.16;
      solarFlareRing.rotation.z = elapsed * 0.08;
      solarFlareRing.scale.setScalar(1 + Math.sin(elapsed * 1.7) * 0.018);
      asteroidBelt.rotation.y = elapsed * 0.06;

      for (const p of planetOrbitData) {
        const angle = p.phase + elapsed * p.speed * 0.32;
        const basePos = p.group.userData.basePosition as THREE.Vector3;
        basePos.set(
          Math.cos(angle) * p.radius,
          Math.sin(angle) * p.tilt,
          Math.sin(angle) * p.radius
        );
        if (explodeAmount < 0.01) {
          p.group.position.copy(basePos);
        }
        p.mesh.rotation.y = elapsed * 0.85;
        if (p.clouds) p.clouds.rotation.y = elapsed * 1.05;
        if (p.moon) {
          const ma = elapsed * 1.6;
          p.moon.position.set(Math.cos(ma) * 0.28, Math.sin(ma) * 0.03, Math.sin(ma) * 0.28);
        }
        if (p.titan) {
          const ta = elapsed * 0.85;
          p.titan.position.set(Math.cos(ta) * 0.68, 0.04, Math.sin(ta) * 0.68);
        }
        if (p.triton) {
          const na = -elapsed * 1.1;
          p.triton.position.set(Math.cos(na) * 0.32, Math.sin(na) * 0.06, Math.sin(na) * 0.32);
        }
        if (p.galilean) {
          for (const m of p.galilean) {
            const ga = elapsed * 0.9 * m.spd + m.phase;
            m.mesh.position.set(Math.cos(ga) * m.r, 0, Math.sin(ga) * m.r);
          }
        }
      }
    },
  };
}

/**
 * Builds a 3D Holographic "THANK YOU" Easter Egg Ring Assembly
 */
export function buildThankYouHologram(maxAnisotropy = 4): THREE.Group {
  const group = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(2, 16, 36, 0.88)';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 1000, 232);

  ctx.fillStyle = '#7dd3fc';
  ctx.font = '600 72px "Inter Variable", Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Thank you', 512, 108);

  ctx.fillStyle = '#eceef1';
  ctx.font = '500 28px "Inter Variable", Inter, system-ui, sans-serif';
  ctx.fillText('Jarvis · 3D NASA Solar System', 512, 180);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  group.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.85),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
    )
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.95, 0.025, 16, 72),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
  );
  ring.rotation.x = Math.PI * 0.35;
  group.add(ring);
  return group;
}

export function createAllHologramModels(
  maxAnisotropy = 4
): Record<ModelId, BuiltHologramModel> {
  return {
    solar: buildSolarSystemModel(maxAnisotropy),
    'human-body': buildHumanBodyModel(maxAnisotropy),
  };
}
