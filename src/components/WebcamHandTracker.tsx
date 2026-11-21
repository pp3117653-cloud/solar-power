import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import {
  createSyntheticHandLandmarks,
  HandObservation,
  Landmark3D,
} from '../logic/gestureEngine';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

export type TrackerStatus =
  | 'starting'
  | 'loading-model'
  | 'tracking'
  | 'camera-denied'
  | 'no-camera'
  | 'model-failed';

export type SimulatorPoseMode =
  | 'NONE'
  | 'OPEN_ROTATE'
  | 'PINCH_ZOOM'
  | 'POINT_INSPECT'
  | 'TWO_HAND_EXPLODE'
  | 'HOLD_RESET';

export interface CameraDeviceOption {
  deviceId: string;
  label: string;
}

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

export const STATUS_MESSAGES: Record<TrackerStatus, string> = {
  starting: 'Starting camera…',
  'loading-model': 'Initializing tracking…',
  tracking: 'Tracking',
  'camera-denied': 'Camera blocked. Allow it in the address bar, then press Retry.',
  'no-camera': 'No camera found. Check the connection and press Retry.',
  'model-failed': 'Hand tracking failed to load. Press Retry.',
};

type VideoWithRVFC = Omit<
  HTMLVideoElement,
  'requestVideoFrameCallback' | 'cancelVideoFrameCallback'
> & {
  requestVideoFrameCallback?: (
    callback: (now: DOMHighResTimeStamp, metadata: unknown) => void
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

interface WebcamHandTrackerProps {
  visible: boolean;
  hiddenByHologram: boolean;
  cameraId: string;
  mirrorPreview: boolean;
  presenterMode: boolean;
  simMode: SimulatorPoseMode;
  retryNonce: number;
  onToggleVisible: () => void;
  onStatusChange: (status: TrackerStatus) => void;
  onDevicesChange: (devices: CameraDeviceOption[]) => void;
  onHandsFrame: (hands: HandObservation[], nowMs: number, aspect: number) => void;
  externalPoseTrigger?: {
    mode: SimulatorPoseMode;
    timestamp: number;
  };
}

export const WebcamHandTracker: React.FC<WebcamHandTrackerProps> = ({
  visible,
  hiddenByHologram,
  cameraId,
  mirrorPreview,
  presenterMode,
  simMode,
  retryNonce,
  onToggleVisible,
  onStatusChange,
  onDevicesChange,
  onHandsFrame,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<TrackerStatus>('starting');
  const [videoAspect, setVideoAspect] = useState<number>(4 / 3);
  const [internalRetry, setInternalRetry] = useState<number>(0);

  const statusRef = useRef<TrackerStatus>('starting');
  const simModeRef = useRef<SimulatorPoseMode>(simMode);
  const mirrorRef = useRef<boolean>(mirrorPreview);
  const aspectRef = useRef<number>(4 / 3);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  const onHandsFrameRef = useRef(onHandsFrame);
  const onStatusChangeRef = useRef(onStatusChange);
  const onDevicesChangeRef = useRef(onDevicesChange);

  useEffect(() => {
    onHandsFrameRef.current = onHandsFrame;
  }, [onHandsFrame]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    onDevicesChangeRef.current = onDevicesChange;
  }, [onDevicesChange]);

  useEffect(() => {
    simModeRef.current = simMode;
  }, [simMode]);

  useEffect(() => {
    mirrorRef.current = mirrorPreview;
  }, [mirrorPreview]);

  const updateStatus = useCallback((next: TrackerStatus) => {
    statusRef.current = next;
    setStatus(next);
    onStatusChangeRef.current(next);
  }, []);

  const triggerRetry = useCallback(() => {
    setInternalRetry((c) => c + 1);
  }, []);

  // 2.7: ResizeObserver sizes canvas to client size * devicePixelRatio so skeleton aligns 1:1
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || typeof ResizeObserver === 'undefined') return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    updateCanvasSize();
    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [visible, videoAspect]);

  // 2.2 & 2.5: Processing loop starts on mount, independent of camera/model initialization
  useEffect(() => {
    let isCancelled = false;
    let rafId = 0;
    let rvfcId = 0;
    let usingRvfc = false;
    let lastVideoTime = -1;
    let lastTimestampMs = 0;
    let lastInferenceMs = 0;
    const inferenceIntervalMs = 1000 / 30;

    const getStrictlyIncreasingNow = (): number => {
      const raw = performance.now();
      const next = raw > lastTimestampMs ? raw : lastTimestampMs + 0.01;
      lastTimestampMs = next;
      return next;
    };

    const drawHandSkeleton = (hands: HandObservation[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      // 2.6: Transparent overlay canvas: only clearRect and draw skeleton
      ctx.clearRect(0, 0, w, h);

      // 3-Presenter Spatial Zone Guides (Left P1 | Center P2 | Right P3)
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(w / 3, 0); ctx.lineTo(w / 3, h);
      ctx.moveTo((2 * w) / 3, 0); ctx.lineTo((2 * w) / 3, h);
      ctx.stroke();
      ctx.restore();

      if (hands.length === 0) return;

      const isMirrored = mirrorRef.current;

      hands.forEach((hand) => {
        const lms: Landmark3D[] = hand.landmarks;
        if (!lms || lms.length < 21) return;

        ctx.strokeStyle = 'rgba(232, 224, 208, 0.72)';
        ctx.lineWidth = Math.max(1.5, w * 0.01);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
          const a = lms[startIdx];
          const b = lms[endIdx];
          const ax = (isMirrored ? 1 - a.x : a.x) * w;
          const ay = a.y * h;
          const bx = (isMirrored ? 1 - b.x : b.x) * w;
          const by = b.y * h;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        lms.forEach((pt, idx) => {
          const px = (isMirrored ? 1 - pt.x : pt.x) * w;
          const py = pt.y * h;
          const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
          ctx.beginPath();
          ctx.arc(px, py, isTip ? Math.max(3, w * 0.018) : Math.max(2, w * 0.012), 0, Math.PI * 2);
          ctx.fillStyle = isTip ? '#f2eee5' : '#c8a96b';
          ctx.fill();
        });
      });
    };

    const generateSimulatedHands = (nowMs: number): HandObservation[] => {
      const mode = simModeRef.current;
      const t = nowMs * 0.001;
      if (mode === 'NONE') return [];

      if (mode === 'OPEN_ROTATE') {
        const cx = 0.5 + Math.sin(t * 1.6) * 0.18;
        const cy = 0.54 + Math.cos(t * 1.1) * 0.08;
        return [
          {
            handedness: 'Right',
            landmarks: createSyntheticHandLandmarks('OPEN_PALM', cx, cy),
          },
        ];
      }

      if (mode === 'PINCH_ZOOM') {
        const cy = 0.52 + Math.sin(t * 1.8) * 0.14;
        return [
          {
            handedness: 'Right',
            landmarks: createSyntheticHandLandmarks('PINCH', 0.48, cy, 0.02),
          },
        ];
      }

      if (mode === 'POINT_INSPECT') {
        const cx = 0.5 + Math.cos(t * 1.3) * 0.14;
        const cy = 0.5 + Math.sin(t * 1.7) * 0.12;
        return [
          {
            handedness: 'Right',
            landmarks: createSyntheticHandLandmarks('POINTING', cx, cy),
          },
        ];
      }

      if (mode === 'TWO_HAND_EXPLODE') {
        const halfSpread = 0.12 + (Math.sin(t * 1.4) * 0.5 + 0.5) * 0.22;
        return [
          {
            handedness: 'Left',
            landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.5 + halfSpread, 0.54),
          },
          {
            handedness: 'Right',
            landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.5 - halfSpread, 0.54),
          },
        ];
      }

      if (mode === 'HOLD_RESET') {
        return [
          {
            handedness: 'Right',
            landmarks: createSyntheticHandLandmarks('OPEN_PALM', 0.5, 0.54),
          },
        ];
      }

      return [];
    };

    const processStep = () => {
      if (isCancelled) return;

      if (typeof document !== 'undefined' && document.hidden) {
        scheduleNext();
        return;
      }

      const nowMs = getStrictlyIncreasingNow();
      const currentAspect = aspectRef.current;

      if (simModeRef.current !== 'NONE') {
        const simHands = generateSimulatedHands(nowMs);
        drawHandSkeleton(simHands);
        onHandsFrameRef.current(simHands, nowMs, currentAspect);
        scheduleNext();
        return;
      }

      const video = videoRef.current;
      const landmarker = handLandmarkerRef.current;

      if (landmarker && video && video.readyState >= 2) {
        if (nowMs - lastInferenceMs < inferenceIntervalMs) {
          scheduleNext();
          return;
        }
        if (video.currentTime !== lastVideoTime) {
          lastInferenceMs = nowMs;
          lastVideoTime = video.currentTime;
          try {
            const result = landmarker.detectForVideo(video, nowMs);
            const observations: HandObservation[] = (result.landmarks || []).map(
              (lms, idx) => {
                const cat = result.handednesses?.[idx]?.[0]?.categoryName;
                return {
                  handedness: cat === 'Left' ? 'Left' : 'Right',
                  landmarks: lms.map((p) => ({ x: p.x, y: p.y, z: p.z })),
                };
              }
            );
            drawHandSkeleton(observations);
            onHandsFrameRef.current(observations, nowMs, currentAspect);
          } catch {
            // Ignore transient frame inference error
          }
        }
      } else {
        drawHandSkeleton([]);
        onHandsFrameRef.current([], nowMs, currentAspect);
      }

      scheduleNext();
    };

    const scheduleNext = () => {
      if (isCancelled) return;
      const video = videoRef.current as VideoWithRVFC | null;
      if (
        simModeRef.current === 'NONE' &&
        video &&
        video.readyState >= 2 &&
        !video.paused &&
        typeof video.requestVideoFrameCallback === 'function'
      ) {
        usingRvfc = true;
        rvfcId = video.requestVideoFrameCallback(() => {
          usingRvfc = false;
          processStep();
        });
      } else {
        usingRvfc = false;
        rafId = requestAnimationFrame(processStep);
      }
    };

    scheduleNext();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(rafId);
      const video = videoRef.current as VideoWithRVFC | null;
      if (usingRvfc && video && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(rvfcId);
      }
    };
  }, []);

  // 2.3 & 2.4: Camera stream and MediaPipe HandLandmarker initialization & hot-plug recovery
  useEffect(() => {
    let isCancelled = false;
    let mediaStream: MediaStream | null = null;
    let retryTimer = 0;

    const stopCurrentStream = () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => {
          t.onended = null;
          t.stop();
        });
        mediaStream = null;
      }
    };

    const scheduleAutoRetry = () => {
      if (isCancelled) return;
      clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => {
        if (!isCancelled && statusRef.current === 'no-camera') {
          setInternalRetry((c) => c + 1);
        }
      }, 3000);
    };

    const refreshDeviceList = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        const list = await navigator.mediaDevices.enumerateDevices();
        if (isCancelled) return;
        const cameras: CameraDeviceOption[] = list
          .filter((d) => d.kind === 'videoinput')
          .map((d, idx) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${idx + 1}`,
          }));
        onDevicesChangeRef.current(cameras);
      } catch {
        // Ignore device enumeration errors
      }
    };

    const requestStreamWithTimeout = async (
      constraints: MediaStreamConstraints
    ): Promise<MediaStream> => {
      return new Promise<MediaStream>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          const timeoutErr = new Error('Camera request timed out');
          timeoutErr.name = 'TimeoutError';
          reject(timeoutErr);
        }, 15000);

        navigator.mediaDevices
          .getUserMedia(constraints)
          .then((stream) => {
            clearTimeout(timer);
            resolve(stream);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
    };

    const createLandmarkerWithDelegate = async (
      wasmUrl: string,
      modelUrl: string
    ): Promise<HandLandmarker> => {
      const vision = await FilesetResolver.forVisionTasks(wasmUrl);
      const commonOpts = {
        runningMode: 'VIDEO' as const,
        numHands: presenterMode ? 6 : 2,
        minHandDetectionConfidence: 0.85,
        minHandPresenceConfidence: 0.85,
        minTrackingConfidence: 0.85,
      };
      try {
        return await HandLandmarker.createFromOptions(vision, {
          ...commonOpts,
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate: 'GPU',
          },
        });
      } catch {
        return await HandLandmarker.createFromOptions(vision, {
          ...commonOpts,
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate: 'CPU',
          },
        });
      }
    };

    const init = async () => {
      updateStatus('starting');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        updateStatus('no-camera');
        return;
      }

      let savedCameraId = cameraId;
      if (!savedCameraId) {
        try {
          savedCameraId = window.localStorage.getItem('jarvis.cameraId') || '';
        } catch {
          savedCameraId = '';
        }
      }

      const baseVideo: MediaTrackConstraints = {
        width: { ideal: 320, max: 320 },
        height: { ideal: 240, max: 240 },
        frameRate: { ideal: 30, max: 30 },
      };

      const primaryConstraints: MediaStreamConstraints = {
        audio: false,
        video: savedCameraId
          ? { ...baseVideo, deviceId: { exact: savedCameraId } }
          : { ...baseVideo, facingMode: { ideal: 'user' } },
      };

      try {
        try {
          mediaStream = await requestStreamWithTimeout(primaryConstraints);
        } catch (err) {
          const errName = err instanceof Error ? err.name : '';
          if (
            savedCameraId &&
            (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError' || errName === 'NotFoundError')
          ) {
            mediaStream = await requestStreamWithTimeout({
              audio: false,
              video: { ...baseVideo, facingMode: { ideal: 'user' } },
            });
          } else {
            throw err;
          }
        }
      } catch (err) {
        if (isCancelled) return;
        const errName = err instanceof Error ? err.name : '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errName === 'SecurityError') {
          updateStatus('camera-denied');
        } else {
          updateStatus('no-camera');
          scheduleAutoRetry();
        }
        return;
      }

      if (isCancelled) {
        stopCurrentStream();
        return;
      }

      // Listen for track end (camera unplugged)
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (isCancelled) return;
          updateStatus('no-camera');
          scheduleAutoRetry();
        };
      }

      await refreshDeviceList();
      if (isCancelled) {
        stopCurrentStream();
        return;
      }

      const video = videoRef.current;
      if (video) {
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const nextAspect = video.videoWidth / video.videoHeight;
            aspectRef.current = nextAspect;
            setVideoAspect(nextAspect);
          }
        };
        await video.play().catch(() => {});
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const nextAspect = video.videoWidth / video.videoHeight;
          aspectRef.current = nextAspect;
          setVideoAspect(nextAspect);
        }
      }

      if (isCancelled) {
        stopCurrentStream();
        return;
      }

      // Initialize MediaPipe HandLandmarker if not already loaded
      if (!handLandmarkerRef.current) {
        updateStatus('loading-model');
        const baseUrl = import.meta.env.BASE_URL || '/';
        const localWasm = `${baseUrl}mediapipe/wasm`;
        const localModel = `${baseUrl}models/hand_landmarker.task`;
        const cdnWasm = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
        const cdnModel =
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

        let landmarker: HandLandmarker | null = null;
        try {
          landmarker = await createLandmarkerWithDelegate(localWasm, localModel);
        } catch {
          try {
            landmarker = await createLandmarkerWithDelegate(cdnWasm, cdnModel);
          } catch {
            landmarker = null;
          }
        }

        if (isCancelled) {
          if (landmarker) landmarker.close();
          stopCurrentStream();
          return;
        }

        if (!landmarker) {
          updateStatus('model-failed');
          return;
        }

        handLandmarkerRef.current = landmarker;
      }

      updateStatus('tracking');
    };

    const handleDeviceChange = () => {
      if (isCancelled) return;
      refreshDeviceList();
      const activeTrack = mediaStream?.getVideoTracks()[0];
      if (!activeTrack || activeTrack.readyState === 'ended') {
        updateStatus('no-camera');
        scheduleAutoRetry();
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    init();

    return () => {
      isCancelled = true;
      clearTimeout(retryTimer);
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
      stopCurrentStream();
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, [cameraId, retryNonce, internalRetry, presenterMode, updateStatus]);

  // Close landmarker on component unmount
  useEffect(() => {
    return () => {
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, []);

  if (hiddenByHologram) {
    return null;
  }

  if (!visible) {
    return (
      <button
        type="button"
        onClick={onToggleVisible}
        title="Show camera preview (H)"
        aria-label="Show camera preview"
        className="fixed bottom-4 left-4 z-20 w-10 h-10 glass-surface flex items-center justify-center text-[var(--text)] hover:bg-[var(--raised)] transition-colors duration-150"
      >
        <Camera className="w-4 h-4" />
      </button>
    );
  }

  const showRetry =
    status === 'camera-denied' || status === 'no-camera' || status === 'model-failed';

  return (
    <aside
      aria-label="Camera preview"
      className="fixed bottom-4 left-4 z-20 w-44 glass-surface overflow-hidden transition-opacity duration-150"
    >
      <div
        ref={containerRef}
        style={{ aspectRatio: String(videoAspect) }}
        className={`relative w-full overflow-hidden ${
          simMode !== 'NONE' ? 'bg-black' : 'bg-black'
        }`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${
            mirrorPreview ? '-scale-x-100' : ''
          } ${status === 'tracking' && simMode === 'NONE' ? 'opacity-100' : 'opacity-0'}`}
        />

        <canvas
          ref={canvasRef}
          data-testid="hand-skeleton-canvas"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Collapse button in corner */}
        <button
          type="button"
          onClick={onToggleVisible}
          title="Hide camera preview (H)"
          aria-label="Hide camera preview"
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/50 hover:bg-black/75 border border-white/10 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <CameraOff className="w-3 h-3" />
        </button>

        {/* Status message overlay when not tracking (and simulator is off) */}
        {status !== 'tracking' && simMode === 'NONE' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-5 px-3.5 pb-2 text-center">
            <p className="text-[11.5px] leading-snug text-[var(--muted)]">
              {STATUS_MESSAGES[status]}
            </p>
            {showRetry && (
              <button
                type="button"
                onClick={triggerRetry}
                className="mt-2 px-2.5 py-1 rounded-full bg-[var(--raised)] hover:bg-white/15 border border-[var(--border)] text-[12px] font-medium text-[var(--text)] flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
