import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ModelId, SubPartInfo, TUNING_CONFIG } from '../config/constants';
import {
  BuiltHologramModel,
  buildThankYouHologram,
  createAllHologramModels,
} from './hologramModels';
import { soundEngine } from '../audio/soundEngine';
import { LiveSpaceTelemetry } from '../services/nasaDataService';
import { AnatomyLayerKey, AnatomyScaleMode, DEFAULT_ANATOMY_LAYERS } from '../data/humanAnatomyBook';

export interface TransformTargetState {
  rotX: number;
  rotY: number;
  zoom: number;
  posX: number;
  posY: number;
  explode: number;
}

export interface HoveredPartOverlay {
  part: SubPartInfo;
  screenX: number;
  screenY: number;
}

interface HologramCanvasProps {
  activeModelId: ModelId;
  heartBpm: number;
  hologramMode: boolean;
  pyramidFourView: boolean;
  pyramidSize: number;
  pyramidGap: number;
  pyramidFlip180: boolean;
  infoDrawerOpen: boolean;
  attractMode: boolean;
  thankYouActive: boolean;
  scanPulseTrigger: number;
  transformRef: React.MutableRefObject<TransformTargetState>;
  pointerNormalizedRef: React.MutableRefObject<{ x: number; y: number } | null>;
  selectedPartId: string | null;
  onPartHoverOrSelect: (overlay: HoveredPartOverlay | null) => void;
  targetFps?: 45 | 60;
  liveTelemetry?: LiveSpaceTelemetry | null;
  anatomyLayers?: Record<AnatomyLayerKey, boolean>;
  anatomyScaleMode?: AnatomyScaleMode;
  onFpsUpdate: (fps: number, particleCount: number) => void;
}

const _vec3 = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _earthCenter = new THREE.Vector3();
const _surfaceNormal = new THREE.Vector3();
const _toCam = new THREE.Vector3();

function createSoftParticleSprite(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.45, 'rgba(125, 211, 252, 0.7)');
  grad.addColorStop(1, 'rgba(125, 211, 252, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const HologramCanvas: React.FC<HologramCanvasProps> = ({
  activeModelId,
  heartBpm,
  hologramMode,
  pyramidFourView,
  pyramidSize,
  pyramidGap,
  pyramidFlip180,
  infoDrawerOpen,
  attractMode,
  thankYouActive,
  scanPulseTrigger,
  transformRef,
  pointerNormalizedRef,
  selectedPartId,
  onPartHoverOrSelect,
  targetFps = 45,
  liveTelemetry = null,
  anatomyLayers = DEFAULT_ANATOMY_LAYERS,
  anatomyScaleMode = 'organism',
  onFpsUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState<boolean>(false);

  const propsRef = useRef({
    activeModelId,
    heartBpm,
    hologramMode,
    pyramidFourView,
    pyramidSize,
    pyramidGap,
    pyramidFlip180,
    infoDrawerOpen,
    attractMode,
    thankYouActive,
    selectedPartId,
    onPartHoverOrSelect,
    targetFps,
    liveTelemetry,
    anatomyLayers,
    anatomyScaleMode,
    onFpsUpdate,
  });

  useEffect(() => {
    propsRef.current = {
      activeModelId,
      heartBpm,
      hologramMode,
      pyramidFourView,
      pyramidSize,
      pyramidGap,
      pyramidFlip180,
      infoDrawerOpen,
      attractMode,
      thankYouActive,
      selectedPartId,
      onPartHoverOrSelect,
      targetFps,
      liveTelemetry,
      anatomyLayers,
      anatomyScaleMode,
      onFpsUpdate,
    };
  }, [
    activeModelId,
    heartBpm,
    hologramMode,
    pyramidFourView,
    pyramidSize,
    pyramidGap,
    pyramidFlip180,
    infoDrawerOpen,
    attractMode,
    thankYouActive,
    selectedPartId,
    onPartHoverOrSelect,
    targetFps,
    liveTelemetry,
    anatomyLayers,
    anatomyScaleMode,
      onFpsUpdate,
  ]);

  const scanWaveTimeRef = useRef<number>(0);
  useEffect(() => {
    if (scanPulseTrigger > 0) {
      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reducedMotion) {
        scanWaveTimeRef.current = 1.0;
      }
    }
  }, [scanPulseTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 5.1: Enable preserveDrawingBuffer only with ?capture=1
    const captureEnabled =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('capture') === '1';

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: captureEnabled,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.setAttribute('data-testid', 'jarvis-webgl-canvas');
    // 5.3: touch-action: none on the canvas
    renderer.domElement.style.touchAction = 'none';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgDefaultColor = new THREE.Color(0x000000);
    const bgHoloColor = new THREE.Color(0x000000);
    scene.background = bgDefaultColor;
    scene.fog = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 6.2);
    camera.lookAt(0, 0, 0);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0xe8e0d0, 0x080808, 0.45);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.45);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9fbad0, 0.8);
    fillLight.position.set(-4, 2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xd9e2ec, 1.1);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    // Emitter Base Platform
    const emitterGroup = new THREE.Group();
    emitterGroup.position.set(0, -2.15, 0);

    const baseRingGeo = new THREE.RingGeometry(1.4, 1.44, 64);
    const baseRingMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = Math.PI / 2;
    emitterGroup.add(baseRing);

    const innerRingGeo = new THREE.RingGeometry(0.75, 0.77, 48);
    const innerRing = new THREE.Mesh(innerRingGeo, baseRingMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.02;
    emitterGroup.add(innerRing);

    const discGeo = new THREE.CircleGeometry(1.8, 48);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.rotation.x = -Math.PI / 2;
    emitterGroup.add(discMesh);
    scene.add(emitterGroup);

    // Vertical Laser Scanning Ring
    const scanRingGeo = new THREE.TorusGeometry(2.1, 0.018, 12, 72);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
    scanRing.rotation.x = Math.PI / 2;
    scene.add(scanRing);

    // 5.2: Particles: at most 260, soft round sprites (radial-gradient CanvasTexture), size 0.035, opacity 0.35
    const maxParticles = Math.min(260, TUNING_CONFIG.HIGH_PARTICLE_COUNT);
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(maxParticles * 3);
    for (let i = 0; i < maxParticles; i++) {
      const r = 2.2 + Math.random() * 3.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleSpriteTex = createSoftParticleSprite();
    const particleMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      map: particleSpriteTex,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const modelsMap: Record<ModelId, BuiltHologramModel> = createAllHologramModels(maxAnisotropy);
    const thankYouGroup = buildThankYouHologram(maxAnisotropy);
    thankYouGroup.visible = false;

    const stageGroup = new THREE.Group();
    // 5.7: Set stageGroup.rotation.order = 'ZXY' once
    stageGroup.rotation.order = 'ZXY';
    scene.add(stageGroup);
    stageGroup.add(thankYouGroup);

    (Object.keys(modelsMap) as ModelId[]).forEach((id) => {
      const m = modelsMap[id];
      m.rootGroup.visible = id === propsRef.current.activeModelId;
      stageGroup.add(m.rootGroup);
    });

    // Fit the largest model once at startup so outer planets and anatomy layers
    // remain visible with a small breathing margin instead of sitting under HUDs.
    const sceneBounds = new THREE.Box3().setFromObject(stageGroup);
    const sceneSphere = sceneBounds.getBoundingSphere(new THREE.Sphere());
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const fitDistance = (sceneSphere.radius * 1.15) / Math.max(0.01, Math.tan(verticalHalfFov));
    camera.position.set(
      sceneSphere.center.x,
      sceneSphere.center.y + sceneSphere.radius * 0.04,
      Math.max(6.2, fitDistance)
    );
    camera.far = Math.max(100, camera.position.z + sceneSphere.radius * 4);
    camera.lookAt(sceneSphere.center);
    camera.updateProjectionMatrix();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 5.6: Store and restore emissive intensity per material using a WeakMap
    const savedEmissiveMap = new WeakMap<THREE.Material, number>();
    const raycaster = new THREE.Raycaster();
    const mouseNdc = new THREE.Vector2(-999, -999);
    let activePointerId: number | null = null;
    let isDragging = false;
    let isShiftDrag = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let lastRaycastMs = 0;
    let highlightedGroup: THREE.Object3D | null = null;

    // 5.5: Callout throttling and 250ms clear timer
    let lastCalloutPartId: string | null = null;
    let lastCalloutX = -9999;
    let lastCalloutY = -9999;
    let lastCalloutEmitMs = 0;
    let clearCalloutTimer: number | null = null;
    let hadNormalizedPointer = false;

    const cancelClearCalloutTimer = () => {
      if (clearCalloutTimer !== null) {
        window.clearTimeout(clearCalloutTimer);
        clearCalloutTimer = null;
      }
    };

    const setHighlightOnGroup = (group: THREE.Object3D | null, active: boolean) => {
      if (!group) return;
      group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (stdMat.emissive !== undefined) {
            if (active) {
              if (!savedEmissiveMap.has(stdMat)) {
                savedEmissiveMap.set(stdMat, stdMat.emissiveIntensity);
              }
              stdMat.emissiveIntensity = 1.85;
            } else {
              const orig = savedEmissiveMap.get(stdMat);
              if (orig !== undefined) {
                stdMat.emissiveIntensity = orig;
              }
            }
          }
        }
      });
    };

    const clearHighlightAndCalloutNow = () => {
      cancelClearCalloutTimer();
      if (highlightedGroup) {
        setHighlightOnGroup(highlightedGroup, false);
        highlightedGroup = null;
      }
      if (lastCalloutPartId !== null) {
        lastCalloutPartId = null;
        lastCalloutX = -9999;
        lastCalloutY = -9999;
        propsRef.current.onPartHoverOrSelect(null);
      }
    };

    const scheduleClearHighlightAndCallout = () => {
      if (clearCalloutTimer !== null) return;
      clearCalloutTimer = window.setTimeout(() => {
        clearCalloutTimer = null;
        if (!propsRef.current.selectedPartId && !pointerNormalizedRef.current) {
          clearHighlightAndCalloutNow();
        }
      }, 250);
    };

    const emitCalloutIfChanged = (
      partInfo: SubPartInfo,
      screenX: number,
      screenY: number,
      nowMs: number
    ) => {
      cancelClearCalloutTimer();
      const idChanged = partInfo.id !== lastCalloutPartId;
      const distMoved = Math.hypot(screenX - lastCalloutX, screenY - lastCalloutY);
      if (!idChanged && distMoved < 6) return;
      if (!idChanged && nowMs - lastCalloutEmitMs < 50) return;

      lastCalloutPartId = partInfo.id;
      lastCalloutX = screenX;
      lastCalloutY = screenY;
      lastCalloutEmitMs = nowMs;
      propsRef.current.onPartHoverOrSelect({
        part: partInfo,
        screenX,
        screenY,
      });
    };

    const performRaycast = (ndcX: number, ndcY: number, nowMs: number) => {
      const currentModel = modelsMap[propsRef.current.activeModelId];
      if (!currentModel || propsRef.current.thankYouActive) return;

      mouseNdc.set(ndcX, ndcY);
      raycaster.setFromCamera(mouseNdc, camera);
      const hits = raycaster.intersectObjects(currentModel.raycastTargets, false);

      if (hits.length > 0) {
        // 5.6: Take first hit that is not (transparent && opacity < 0.5); fall back to first hit
        const chosenHit =
          hits.find((h) => {
            const mat = (h.object as THREE.Mesh).material as THREE.Material | undefined;
            if (!mat || Array.isArray(mat)) return true;
            return !(mat.transparent && mat.opacity < 0.5);
          }) ?? hits[0];

        const hitMesh = chosenHit.object as THREE.Mesh;
        const partInfo = hitMesh.userData.partInfo as SubPartInfo | undefined;
        const parentGroup = hitMesh.userData.parentPartGroup as THREE.Object3D | undefined;

        if (highlightedGroup !== parentGroup) {
          setHighlightOnGroup(highlightedGroup, false);
          highlightedGroup = parentGroup || null;
          setHighlightOnGroup(highlightedGroup, true);
        }

        if (partInfo && parentGroup) {
          parentGroup.getWorldPosition(_projVec);
          _projVec.project(camera);
          const rect = renderer.domElement.getBoundingClientRect();
          const screenX = ((_projVec.x + 1) / 2) * rect.width;
          const screenY = (-(_projVec.y - 1) / 2) * rect.height;
          emitCalloutIfChanged(partInfo, screenX, screenY, nowMs);
        }
      } else if (!propsRef.current.selectedPartId) {
        scheduleClearHighlightAndCallout();
      }
    };

    const domEl = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      // 5.3: Ignore pointer events that start on UI
      if (e.target !== domEl) return;
      isDragging = true;
      activePointerId = e.pointerId;
      isShiftDrag = e.shiftKey || e.button === 2;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      try {
        domEl.setPointerCapture(e.pointerId);
      } catch {
        // Ignore synthetic pointer capture error
      }
      soundEngine.unlockAudio();

      const rect = domEl.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      performRaycast(ndcX, ndcY, performance.now());
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = domEl.getBoundingClientRect();
      if (isDragging && (activePointerId === null || e.pointerId === activePointerId)) {
        const dx = (e.clientX - prevPointerX) / Math.max(1, rect.width);
        const dy = (e.clientY - prevPointerY) / Math.max(1, rect.height);
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;

        if (isShiftDrag) {
          transformRef.current.posX = THREE.MathUtils.clamp(
            transformRef.current.posX + dx * 5.0,
            -2.5,
            2.5
          );
          transformRef.current.posY = THREE.MathUtils.clamp(
            transformRef.current.posY - dy * 4.0,
            -1.8,
            1.8
          );
        } else {
          transformRef.current.rotY += dx * 4.2;
          transformRef.current.rotX = THREE.MathUtils.clamp(
            transformRef.current.rotX + dy * 3.2,
            -Math.PI * 0.48,
            Math.PI * 0.48
          );
        }
        return;
      }

      if (e.target !== domEl) return;

      const now = performance.now();
      if (now - lastRaycastMs >= 50) {
        lastRaycastMs = now;
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        performRaycast(ndcX, ndcY, now);
      }
    };

    const endPointerDrag = (e: PointerEvent) => {
      if (activePointerId !== null && e.pointerId === activePointerId) {
        try {
          if (domEl.hasPointerCapture(e.pointerId)) {
            domEl.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Ignore release capture error
        }
        activePointerId = null;
      }
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0012;
      transformRef.current.zoom = THREE.MathUtils.clamp(
        transformRef.current.zoom + delta,
        TUNING_CONFIG.MIN_ZOOM,
        TUNING_CONFIG.MAX_ZOOM
      );
    };

    // 5.4: WebGL context lost / restored handling
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };

    const onContextRestored = () => {
      setContextLost(false);
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerup', endPointerDrag);
    domEl.addEventListener('pointercancel', endPointerDrag);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('webglcontextlost', onContextLost);
    domEl.addEventListener('webglcontextrestored', onContextRestored);

    // 5.4: ResizeObserver on container + pixel ratio update
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(w, h);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // 5.1: Replace THREE.Clock with THREE.Timer
    const timer = new THREE.Timer();
    timer.connect(document);

    let frameId = 0;
    let isDisposed = false;

    let curRotX = 0;
    let curRotY = 0;
    let curZoom = 1;
    let curPosX = 0;
    let curPosY = 0;
    let curExplode = 0;

    let framesInWindow = 0;
    let lastFpsCheckMs = performance.now();
    let lastRenderedMs = 0;
    let activeParticleCount = maxParticles;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick(timestamp?: number) {
      if (isDisposed) return;
      const nowMs = typeof timestamp === 'number' ? timestamp : performance.now();
      const p = propsRef.current;

      // Smooth frame-paced loop (default 45 FPS for thermal stability + buttery motion)
      if (!isSoftwareGl && p.targetFps && p.targetFps < 60) {
        const minInterval = 1000 / p.targetFps;
        if (lastRenderedMs > 0 && nowMs - lastRenderedMs < minInterval - 1.5) {
          frameId = requestAnimationFrame(tick);
          return;
        }
        lastRenderedMs = nowMs;
      }

      timer.update(timestamp);
      const dt = Math.min(timer.getDelta(), 0.05);
      const elapsed = timer.getElapsed();

      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      framesInWindow++;
      if (nowMs - lastFpsCheckMs >= 650) {
        const measuredFps = Math.round((framesInWindow * 1000) / (nowMs - lastFpsCheckMs));
        framesInWindow = 0;
        lastFpsCheckMs = nowMs;

        if (measuredFps < TUNING_CONFIG.LOW_FPS_THRESHOLD && !isSoftwareGl) {
          activeParticleCount = Math.min(maxParticles, TUNING_CONFIG.LOW_PARTICLE_COUNT);
        } else if (measuredFps >= 32) {
          activeParticleCount = maxParticles;
        }
        particleGeo.setDrawRange(0, activeParticleCount);
        p.onFpsUpdate(measuredFps, activeParticleCount);
      }

      thankYouGroup.visible = p.thankYouActive;
      (Object.keys(modelsMap) as ModelId[]).forEach((id) => {
        modelsMap[id].rootGroup.visible = !p.thankYouActive && id === p.activeModelId;
      });

      // 7.5: Respect prefers-reduced-motion (no attract rotation or scan ring)
      if (p.attractMode && !isDragging && !reducedMotion) {
        transformRef.current.rotY += dt * 0.35;
      }

      const lambda = TUNING_CONFIG.TRANSFORM_DAMPING_LAMBDA;
      curRotX = THREE.MathUtils.damp(curRotX, transformRef.current.rotX, lambda, dt);
      curRotY = THREE.MathUtils.damp(curRotY, transformRef.current.rotY, lambda, dt);
      curZoom = THREE.MathUtils.damp(curZoom, transformRef.current.zoom, lambda, dt);
      curPosX = THREE.MathUtils.damp(curPosX, transformRef.current.posX, lambda, dt);
      curPosY = THREE.MathUtils.damp(curPosY, transformRef.current.posY, lambda, dt);
      curExplode = THREE.MathUtils.damp(curExplode, transformRef.current.explode, lambda, dt);

      stageGroup.rotation.set(curRotX, curRotY, 0);
      stageGroup.scale.setScalar(curZoom);
      stageGroup.position.set(curPosX, curPosY, 0);

      const activeModel = modelsMap[p.activeModelId];
      if (activeModel && !p.thankYouActive) {
        activeModel.setAnatomyState?.(p.anatomyLayers, p.anatomyScaleMode);
        activeModel.update(elapsed, dt, p.heartBpm, curExplode, p.liveTelemetry);

        for (const partObj of activeModel.explodableParts) {
          const basePos = partObj.userData.basePosition as THREE.Vector3;
          const explodeVec = partObj.userData.explodeVector as THREE.Vector3;
          _vec3.copy(basePos).addScaledVector(explodeVec, curExplode);
          partObj.position.copy(_vec3);
        }
      }

      // 5.5: Raycast from pointing cursor, or track selected part, or clear after 250ms
      const ptr = pointerNormalizedRef.current;
      if (ptr) {
        hadNormalizedPointer = true;
        const ndcX = ptr.x * 2 - 1;
        const ndcY = -(ptr.y * 2 - 1);
        performRaycast(ndcX, ndcY, nowMs);
      } else {
        if (hadNormalizedPointer && !p.selectedPartId) {
          hadNormalizedPointer = false;
          scheduleClearHighlightAndCallout();
        }
        if (p.selectedPartId && activeModel) {
          const targetGroup = activeModel.explodableParts.find(
            (g) => (g.userData.partInfo as SubPartInfo)?.id === p.selectedPartId
          );
          if (targetGroup) {
            if (highlightedGroup !== targetGroup) {
              setHighlightOnGroup(highlightedGroup, false);
              highlightedGroup = targetGroup;
              setHighlightOnGroup(highlightedGroup, true);
            }
            targetGroup.getWorldPosition(_projVec);
            _projVec.project(camera);
            const rect = domEl.getBoundingClientRect();
            emitCalloutIfChanged(
              targetGroup.userData.partInfo as SubPartInfo,
              ((_projVec.x + 1) / 2) * rect.width,
              (-(_projVec.y - 1) / 2) * rect.height,
              nowMs
            );
          }
        } else if (!p.selectedPartId && highlightedGroup && !isDragging && clearCalloutTimer === null) {
          // If deselected from Info drawer, clear immediately
          if (lastCalloutPartId !== null && !hadNormalizedPointer) {
            // Keep mouse hover working unless explicitly cleared
          }
        }
      }

      if (scanWaveTimeRef.current > 0 && !reducedMotion && !p.hologramMode) {
        scanWaveTimeRef.current = Math.max(0, scanWaveTimeRef.current - dt * 0.9);
        const prog = 1 - scanWaveTimeRef.current;
        scanRing.position.y = (0.5 - prog) * 3.8;
        scanRingMat.opacity = 0;
        const s = 0.6 + Math.sin(prog * Math.PI) * 0.65;
        scanRing.scale.setScalar(s);
      } else {
        scanRingMat.opacity = 0;
      }

      particleSystem.rotation.y = elapsed * 0.04;
      particleSystem.visible = !p.hologramMode;
      emitterGroup.visible = false;
      const canvasW = domEl.clientWidth || window.innerWidth;
      const canvasH = domEl.clientHeight || window.innerHeight;

      if (p.hologramMode) {
        scene.background = bgHoloColor;
        renderer.setClearColor(0x000000, 1);
      } else {
        scene.background = bgDefaultColor;
        renderer.setClearColor(0x000000, 1);
      }

      if (p.hologramMode && p.pyramidFourView) {
        camera.clearViewOffset();
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, canvasW, canvasH);
        renderer.clear();

        renderer.setScissorTest(true);

        const minDim = Math.min(canvasW, canvasH);
        const safeSize = Math.min(0.45, Math.max(0.18, p.pyramidSize || 0.31));
        const safeGap = Math.min(1.4, Math.max(0.5, p.pyramidGap || 0.96));
        const cellSize = Math.floor(minDim * safeSize);
        const cx = Math.floor(canvasW / 2);
        const cy = Math.floor(canvasH / 2);
        const offset = Math.floor(cellSize * safeGap);
        const flipOffset = p.pyramidFlip180 ? Math.PI : 0;

        // 5.7: Cell rolls with model's top pointing away from pyramid centre:
        // Note: WebGL setViewport y=0 is at the bottom of the canvas!
        // So y = cy + offset - cellSize/2 is the TOP cell on screen, and y = cy - offset - cellSize/2 is the BOTTOM cell on screen.
        const views = [
          { x: cx - cellSize / 2, y: cy + offset - cellSize / 2, roll: 0 + flipOffset },            // Top cell
          { x: cx - cellSize / 2, y: cy - offset - cellSize / 2, roll: Math.PI + flipOffset },      // Bottom cell
          { x: cx - offset - cellSize / 2, y: cy - cellSize / 2, roll: Math.PI / 2 + flipOffset },  // Left cell
          { x: cx + offset - cellSize / 2, y: cy - cellSize / 2, roll: -Math.PI / 2 + flipOffset }, // Right cell
        ];

        const savedAspect = camera.aspect;
        const savedCamZ = camera.position.z;
        camera.aspect = 1;
        camera.position.z = 7.8;
        camera.updateProjectionMatrix();

        for (const v of views) {
          renderer.setViewport(v.x, v.y, cellSize, cellSize);
          renderer.setScissor(v.x, v.y, cellSize, cellSize);
          stageGroup.rotation.z = v.roll;
          // 5.7: Rotate the pan offset (posX, posY) by the same roll per cell
          const cosR = Math.cos(v.roll);
          const sinR = Math.sin(v.roll);
          stageGroup.position.set(
            curPosX * cosR - curPosY * sinR,
            curPosX * sinR + curPosY * cosR,
            0
          );
          renderer.render(scene, camera);
        }

        stageGroup.rotation.z = 0;
        stageGroup.position.set(curPosX, curPosY, 0);
        camera.position.z = savedCamZ;
        camera.aspect = savedAspect;
        camera.updateProjectionMatrix();
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, canvasW, canvasH);
      } else {
        // 7.3: When Info drawer (340 px on right) is open, shift view with camera.setViewOffset
        if (!p.hologramMode && p.infoDrawerOpen && canvasW >= 768) {
          camera.setViewOffset(canvasW, canvasH, 170, 0, canvasW, canvasH);
        } else {
          camera.clearViewOffset();
        }
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, canvasW, canvasH);
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // 5.4: Dispose all geometries, materials, textures, and renderer on unmount
    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      cancelClearCalloutTimer();
      timer.dispose();

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }

      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', endPointerDrag);
      domEl.removeEventListener('pointercancel', endPointerDrag);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('webglcontextlost', onContextLost);
      domEl.removeEventListener('webglcontextrestored', onContextRestored);

      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const std = m as THREE.MeshStandardMaterial;
            if (std.map) std.map.dispose();
            if (std.emissiveMap) std.emissiveMap.dispose();
            if (std.bumpMap) std.bumpMap.dispose();
            if (std.roughnessMap) std.roughnessMap.dispose();
            m.dispose();
          }
        }
      });

      particleSpriteTex.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, [transformRef, pointerNormalizedRef]);

  // Clear callout immediately when selectedPartId becomes null
  useEffect(() => {
    if (!selectedPartId && !pointerNormalizedRef.current) {
      onPartHoverOrSelect(null);
    }
  }, [selectedPartId, pointerNormalizedRef, onPartHoverOrSelect]);

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 w-full h-full overflow-hidden ${
        hologramMode ? 'bg-black' : 'bg-[#0a0b0d]'
      }`}
      aria-label="Interactive 3D viewport"
    >
      {contextLost && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0b0d]/95 p-6 text-center">
          <p className="text-[16px] font-medium text-[var(--text)] mb-4">
            Graphics stopped. Reload the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-full bg-[var(--accent)] text-[#0a0b0d] text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            Reload
          </button>
        </div>
      )}
    </div>
  );
};
