import { useCallback, useEffect, useRef, useState } from 'react';
import {
  JarvisSettings,
  loadSettings,
  ModelId,
  saveSettings,
  SCIENCE_MODELS,
  SubPartInfo,
  TUNING_CONFIG,
} from './config/constants';
import {
  ActiveGestureType,
  GestureStateMachine,
  HandObservation,
} from './logic/gestureEngine';
import { parseVoiceTranscript } from './logic/voiceCommands';
import { SensorVerificationEngine, SensorVerificationSnapshot } from './logic/sensorTelemetry';
import { AnatomyLayerKey, AnatomyScaleMode, DEFAULT_ANATOMY_LAYERS } from './data/humanAnatomyBook';
import { HUMAN_BODY_NARRATION_CHAPTERS, TOTAL_NARRATION_SECONDS } from './data/humanBodyNarration';
import { AnatomyMediaCategory } from './services/anatomyMediaService';
import { NarrationUiState } from './components/AnatomyAtlasPanel';
import { SolarExhibitionState, SolarVisualMode } from './components/SolarDossierPanel';
import { PLANETARY_DOSSIERS } from './data/planetaryDossiers';
import { soundEngine } from './audio/soundEngine';
import {
  fetchLiveIssPosition,
  fetchLiveSpaceTelemetry,
  getFallbackSpaceTelemetry,
  LiveSpaceTelemetry,
} from './services/nasaDataService';
import {
  HologramCanvas,
  HoveredPartOverlay,
  TransformTargetState,
} from './three/HologramCanvas';
import {
  CameraDeviceOption,
  SimulatorPoseMode,
  TrackerStatus,
  WebcamHandTracker,
} from './components/WebcamHandTracker';
import {
  BottomWorkspaceControls,
  DeveloperSimulatorBar,
  FloatingPartCalloutAndCursor,
  HelpGuideModal,
  HologramModeOverlay,
  InfoDrawer,
  StartScreenCard,
  TopHeaderBar,
} from './components/JarvisHudOverlays';
import { SettingsDrawer } from './components/SettingsDrawer';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const INITIAL_TRANSFORM: TransformTargetState = {
  rotX: 0,
  rotY: 0,
  zoom: TUNING_CONFIG.DEFAULT_ZOOM,
  posX: 0,
  posY: 0,
  explode: 0,
};

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';
  const isDebugUrl =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1';

  const [started, setStarted] = useState<boolean>(true);
  const [settings, setSettings] = useState<JarvisSettings>(() =>
    loadSettings()
  );

  const [activeModelId, setActiveModelId] = useState<ModelId>('solar');
  const [thankYouActive, setThankYouActive] = useState<boolean>(false);
  const [hologramMode, setHologramMode] = useState<boolean>(false);
  const [cleanPresentation, setCleanPresentation] = useState<boolean>(false);
  const [cameraVisible, setCameraVisible] = useState<boolean>(true);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);

  const [cameraStatus, setCameraStatus] = useState<TrackerStatus>('starting');
  const [cameraDevices, setCameraDevices] = useState<CameraDeviceOption[]>([]);
  const [retryNonce, setRetryNonce] = useState<number>(0);

  const [handCount, setHandCount] = useState<number>(0);
  const [activeGesture, setActiveGesture] =
    useState<ActiveGestureType>('IDLE');
  const [fps, setFps] = useState<number>(45);
  const sensorEngineRef = useRef<SensorVerificationEngine>(new SensorVerificationEngine());
  const [sensorSnapshot, setSensorSnapshot] = useState<SensorVerificationSnapshot | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<LiveSpaceTelemetry>(() =>
    getFallbackSpaceTelemetry()
  );

  const refreshNasaTelemetry = useCallback(() => {
    if (!settings.liveNasaData) {
      setLiveTelemetry(getFallbackSpaceTelemetry());
      return;
    }
    fetchLiveSpaceTelemetry(settings.nasaApiKey).then((data) => {
      setLiveTelemetry(data);
    });
  }, [settings.liveNasaData, settings.nasaApiKey]);

  useEffect(() => {
    refreshNasaTelemetry();
    if (!settings.liveNasaData) return;

    const issTimer = window.setInterval(() => {
      fetchLiveIssPosition().then((iss) => {
        if (iss) {
          setLiveTelemetry((prev) => ({
            ...prev,
            iss,
            lastUpdatedIso: new Date().toISOString(),
          }));
        }
      });
    }, 10000);

    const nasaTimer = window.setInterval(() => {
      refreshNasaTelemetry();
    }, 300000);

    return () => {
      window.clearInterval(issTimer);
      window.clearInterval(nasaTimer);
    };
  }, [settings.liveNasaData, refreshNasaTelemetry]);
  const [explodeUiState, setExplodeUiState] = useState<number>(0);
  const [attractMode, setAttractMode] = useState<boolean>(true);
  const [scanPulseTrigger, setScanPulseTrigger] = useState<number>(0);

  const [inspectedPart, setInspectedPart] =
    useState<HoveredPartOverlay | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [solarExhibition, setSolarExhibition] = useState<SolarExhibitionState>({
    selectedPlanetPartId: 'solar-earth',
    visualMode: 'standard',
    sizeScaleActive: false,
    timelineYear: 2026,
    timelineOpen: false,
    orbitalAudioActive: false,
    trajectoryOpen: false,
    quizOpen: false,
    tourActive: false,
    gravityWellActive: false,
    habitableZoneActive: false,
    rulerActive: false,
    lightPulseNonce: 0,
    quizPunchNonce: 0,
  });
  const [heartBpm, setHeartBpm] = useState<number>(72);
  const [anatomyLayers, setAnatomyLayers] = useState<Record<AnatomyLayerKey, boolean>>(() => ({
    ...DEFAULT_ANATOMY_LAYERS,
  }));
  const [anatomyScaleMode, setAnatomyScaleMode] = useState<AnatomyScaleMode>('organism');

  const [narrationState, setNarrationState] = useState<NarrationUiState>({
    active: false,
    paused: false,
    chapterIndex: 0,
    elapsedSec: 0,
  });
  const [syncedMediaCategory, setSyncedMediaCategory] = useState<AnatomyMediaCategory>('body');
  const narrationActiveRef = useRef<boolean>(false);
  const narrationPausedRef = useRef<boolean>(false);
  const narrationTimerRef = useRef<number | null>(null);
  const layerPresetIndexRef = useRef<number>(0);

  const stopHumanBodyNarration = useCallback(() => {
    narrationActiveRef.current = false;
    narrationPausedRef.current = false;
    if (narrationTimerRef.current !== null) {
      window.clearInterval(narrationTimerRef.current);
      narrationTimerRef.current = null;
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Ignore speech synthesis errors
    }
    setNarrationState({ active: false, paused: false, chapterIndex: 0, elapsedSec: 0 });
  }, []);

  const playNarrationChapter = useCallback((idx: number) => {
    if (idx >= HUMAN_BODY_NARRATION_CHAPTERS.length) {
      stopHumanBodyNarration();
      return;
    }
    const ch = HUMAN_BODY_NARRATION_CHAPTERS[idx];
    setActiveModelId('human-body');
    setAnatomyScaleMode(ch.scaleMode);
    setSyncedMediaCategory(ch.mediaCategory);
    setSelectedPartId(ch.part3dId);
    transformRef.current.explode = ch.explodeTarget;
    setExplodeUiState(ch.explodeTarget);

    const nextLayers: Record<AnatomyLayerKey, boolean> = {
      cell: false,
      integumentary: false,
      skeletal: false,
      muscular: false,
      nervous: false,
      endocrine: false,
      cardiovascular: false,
      lymphatic: false,
      respiratory: false,
      digestive: false,
      urinary: false,
      reproductive: false,
    };
    ch.activeLayers.forEach((k) => {
      nextLayers[k] = true;
    });
    setAnatomyLayers(nextLayers);
    setNarrationState((prev) => ({ ...prev, active: true, paused: false, chapterIndex: idx }));

    try {
      window.speechSynthesis?.cancel();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(ch.speechText);
        utter.rate = 0.98;
        utter.pitch = 1.0;
        utter.lang = 'en-IN';
        utter.onend = () => {
          if (narrationActiveRef.current && !narrationPausedRef.current) {
            playNarrationChapter(idx + 1);
          }
        };
        utter.onerror = () => {
          if (narrationActiveRef.current && !narrationPausedRef.current) {
            window.setTimeout(() => {
              if (narrationActiveRef.current && !narrationPausedRef.current) {
                playNarrationChapter(idx + 1);
              }
            }, ch.durationSec * 1000);
          }
        };
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // Fallback timer handled by chapter click/skip
    }
  }, [stopHumanBodyNarration]);

  const startHumanBodyNarration = useCallback(() => {
    stopHumanBodyNarration();
    narrationActiveRef.current = true;
    narrationPausedRef.current = false;
    setInfoDrawerOpen(true);
    setNarrationState({ active: true, paused: false, chapterIndex: 0, elapsedSec: 0 });
    narrationTimerRef.current = window.setInterval(() => {
      if (narrationActiveRef.current && !narrationPausedRef.current) {
        setNarrationState((prev) => ({
          ...prev,
          elapsedSec: Math.min(TOTAL_NARRATION_SECONDS, prev.elapsedSec + 1),
        }));
      }
    }, 1000);
    playNarrationChapter(0);
  }, [playNarrationChapter, stopHumanBodyNarration]);

  const togglePauseHumanBodyNarration = useCallback(() => {
    if (!narrationActiveRef.current) return;
    if (narrationPausedRef.current) {
      narrationPausedRef.current = false;
      try { window.speechSynthesis?.resume(); } catch {}
      setNarrationState((prev) => ({ ...prev, paused: false }));
    } else {
      narrationPausedRef.current = true;
      try { window.speechSynthesis?.pause(); } catch {}
      setNarrationState((prev) => ({ ...prev, paused: true }));
    }
  }, []);

  const nextNarrationChapter = useCallback(() => {
    if (!narrationActiveRef.current) return;
    playNarrationChapter(narrationState.chapterIndex + 1);
  }, [narrationState.chapterIndex, playNarrationChapter]);

  const handleToggleAnatomyLayer = useCallback((key: AnatomyLayerKey) => {
    setAnatomyLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleApplyAnatomyPreset = useCallback(
    (preset: 'all' | 'organs' | 'skeleton' | 'neuro-vascular') => {
      setAnatomyScaleMode('organism');
      if (preset === 'all') {
        setAnatomyLayers({ ...DEFAULT_ANATOMY_LAYERS });
      } else if (preset === 'organs') {
        setAnatomyLayers({
          cell: true,
          integumentary: false,
          skeletal: false,
          muscular: false,
          nervous: true,
          endocrine: true,
          cardiovascular: true,
          lymphatic: true,
          respiratory: true,
          digestive: true,
          urinary: true,
          reproductive: true,
        });
      } else if (preset === 'skeleton') {
        setAnatomyLayers({
          cell: false,
          integumentary: true,
          skeletal: true,
          muscular: false,
          nervous: false,
          endocrine: false,
          cardiovascular: false,
          lymphatic: false,
          respiratory: false,
          digestive: false,
          urinary: false,
          reproductive: false,
        });
      } else {
        setAnatomyLayers({
          cell: false,
          integumentary: true,
          skeletal: false,
          muscular: false,
          nervous: true,
          endocrine: true,
          cardiovascular: true,
          lymphatic: true,
          respiratory: false,
          digestive: false,
          urinary: false,
          reproductive: false,
        });
      }
    },
    []
  );

  const [pointerCursor, setPointerCursor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [palmCursor, setPalmCursor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [resetProgress, setResetProgress] = useState<number>(0);

  const [simMode, setSimMode] = useState<SimulatorPoseMode>('NONE');
  const [wsEnabled, setWsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(new URLSearchParams(window.location.search).get('ws'));
  });
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const [voiceListening, setVoiceListening] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [hologramCursorHidden, setHologramCursorHidden] =
    useState<boolean>(false);

  // High-frequency mutable refs (no per-frame React state updates)
  const transformRef = useRef<TransformTargetState>({ ...INITIAL_TRANSFORM });
  const gestureMachineRef = useRef<GestureStateMachine>(
    new GestureStateMachine()
  );
  const attractModeRef = useRef<boolean>(true);
  const lastHandSeenTimeRef = useRef<number>(0);
  const pointerNormalizedRef = useRef<{ x: number; y: number } | null>(null);
  const thankYouTimerRef = useRef<number | null>(null);
  const voiceNoticeTimerRef = useRef<number | null>(null);

  const handleUpdateSettings = useCallback(
    (patch: Partial<JarvisSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  // Sync audio settings with soundEngine
  useEffect(() => {
    soundEngine.setMuted(settings.muted);
    soundEngine.setVolume(settings.volume);
    soundEngine.setAmbientHumEnabled(settings.ambientHum);
    soundEngine.setSpokenRepliesEnabled(settings.spokenReplies);
  }, [
    settings.muted,
    settings.volume,
    settings.ambientHum,
    settings.spokenReplies,
  ]);

  // Screen Wake Lock
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          lock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // WakeLock not supported or disallowed by permissions policy
      }
    };
    requestWakeLock();
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (lock) {
        lock.release().catch(() => {});
      }
    };
  }, []);

  // Hide mouse cursor in hologram mode after 2s idle movement
  useEffect(() => {
    if (!hologramMode) {
      setHologramCursorHidden(false);
      return;
    }
    let timer = window.setTimeout(() => {
      setHologramCursorHidden(true);
    }, 2000);

    const handleMove = () => {
      setHologramCursorHidden(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setHologramCursorHidden(true);
      }, 2000);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [hologramMode]);

  const showVoiceToast = useCallback((msg: string) => {
    setVoiceNotice(msg);
    if (voiceNoticeTimerRef.current !== null) {
      window.clearTimeout(voiceNoticeTimerRef.current);
    }
    voiceNoticeTimerRef.current = window.setTimeout(() => {
      setVoiceNotice(null);
    }, 3200);
  }, []);

  const switchModel = useCallback((nextId: ModelId) => {
    if (thankYouTimerRef.current !== null) {
      window.clearTimeout(thankYouTimerRef.current);
      thankYouTimerRef.current = null;
    }
    setThankYouActive(false);
    setActiveModelId(nextId);
    setSelectedPartId(null);
    setInspectedPart(null);
    // Silent under Strict Voice-Only Talk-Back Rule
  }, []);

  const cycleModel = useCallback((direction: 'next' | 'prev') => {
    setThankYouActive(false);
    setActiveModelId((current) => {
      const idx = SCIENCE_MODELS.findIndex((m) => m.id === current);
      const step = direction === 'next' ? 1 : -1;
      const nextIdx =
        (idx + step + SCIENCE_MODELS.length) % SCIENCE_MODELS.length;
      const nextModel = SCIENCE_MODELS[nextIdx];
      setSelectedPartId(null);
      setInspectedPart(null);
      // Silent under Strict Voice-Only Talk-Back Rule
      return nextModel.id;
    });
  }, []);

  const triggerThankYouEasterEgg = useCallback(() => {
    setThankYouActive(true);
    transformRef.current.rotX = 0;
    transformRef.current.rotY = 0;
    transformRef.current.posX = 0;
    transformRef.current.posY = 0;
    transformRef.current.explode = 0;
    setExplodeUiState(0);
    // Silent under Strict Voice-Only Talk-Back Rule
    soundEngine.speakJarvis('You are welcome.');

    if (thankYouTimerRef.current !== null) {
      window.clearTimeout(thankYouTimerRef.current);
    }
    thankYouTimerRef.current = window.setTimeout(() => {
      setThankYouActive(false);
      thankYouTimerRef.current = null;
    }, 5000);
  }, []);

  const handleResetView = useCallback(() => {
    transformRef.current.rotX = INITIAL_TRANSFORM.rotX;
    transformRef.current.rotY = INITIAL_TRANSFORM.rotY;
    transformRef.current.zoom = INITIAL_TRANSFORM.zoom;
    transformRef.current.posX = INITIAL_TRANSFORM.posX;
    transformRef.current.posY = INITIAL_TRANSFORM.posY;
    transformRef.current.explode = INITIAL_TRANSFORM.explode;
    setExplodeUiState(0);
    setSelectedPartId(null);
    setInspectedPart(null);
    // Silent under Strict Voice-Only Talk-Back Rule
  }, []);

  const handleToggleExplode = useCallback(() => {
    const next = transformRef.current.explode > 0.35 ? 0 : 1;
    transformRef.current.explode = next;
    setExplodeUiState(next);
    if (next > 0.5) {
      // Silent under Strict Voice-Only Talk-Back Rule
    } else {
      // Silent under Strict Voice-Only Talk-Back Rule
    }
  }, []);

  const handleZoomBy = useCallback((delta: number) => {
    transformRef.current.zoom = Math.max(
      TUNING_CONFIG.MIN_ZOOM,
      Math.min(TUNING_CONFIG.MAX_ZOOM, transformRef.current.zoom + delta)
    );
    // Silent under Strict Voice-Only Talk-Back Rule
  }, []);

  // Voice execution kept in a ref so SpeechRecognition and WebSocket never reconnect on state changes
  const executeVoicePhrase = useCallback(
    (rawTranscript: string, forceNoWakeWord = false) => {
      if (soundEngine.shouldIgnoreSpeechTranscript(rawTranscript)) {
        return;
      }

      const requireWakeWord =
        !forceNoWakeWord && settings.voiceMode === 'hands-free';
      const parsed = parseVoiceTranscript(rawTranscript, requireWakeWord);

      if (!parsed.recognized || !parsed.action) {
        if (!requireWakeWord && rawTranscript.trim().length > 0) {
          showVoiceToast(`Heard "${rawTranscript.trim()}"`);
        }
        return;
      }

      showVoiceToast(parsed.jarvisReply || rawTranscript.trim());
      attractModeRef.current = false;
      setAttractMode(false);
      lastHandSeenTimeRef.current = performance.now();

      const act = parsed.action;
      if (act.type === 'THANK_YOU_EASTER_EGG') {
        triggerThankYouEasterEgg();
        return;
      }

      if (act.type === 'START_HUMAN_BODY_NARRATION') {
        startHumanBodyNarration();
        return;
      }
      if (act.type === 'STOP_HUMAN_BODY_NARRATION') {
        stopHumanBodyNarration();
        return;
      }
      if (act.type === 'RESUME_HUMAN_BODY_NARRATION') {
        togglePauseHumanBodyNarration();
        return;
      }
      if (act.type === 'NEXT_NARRATION_CHAPTER') {
        nextNarrationChapter();
        return;
      }
      if (act.type === 'SET_ANATOMY_SCALE') {
        setActiveModelId('human-body');
        setAnatomyScaleMode(act.scaleMode);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }
      if (act.type === 'APPLY_ANATOMY_PRESET') {
        setActiveModelId('human-body');
        handleApplyAnatomyPreset(act.preset);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }
      if (act.type === 'ISOLATE_ANATOMY_LAYER') {
        setActiveModelId('human-body');
        setAnatomyScaleMode('organism');
        setAnatomyLayers({
          cell: false,
          integumentary: true,
          skeletal: act.layerKey === 'skeletal',
          muscular: act.layerKey === 'muscular',
          nervous: act.layerKey === 'nervous',
          endocrine: act.layerKey === 'endocrine',
          cardiovascular: act.layerKey === 'cardiovascular',
          lymphatic: act.layerKey === 'lymphatic',
          respiratory: act.layerKey === 'respiratory',
          digestive: act.layerKey === 'digestive',
          urinary: act.layerKey === 'urinary',
          reproductive: act.layerKey === 'reproductive',
        });
        setInfoDrawerOpen(true);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }
      if (act.type === 'ADJUST_HEART_BPM') {
        setHeartBpm((b) => Math.max(40, Math.min(180, act.absolute ?? b + act.delta)));
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }
      if (act.type === 'OPEN_ANATOMY_MEDIA') {
        setActiveModelId('human-body');
        setSyncedMediaCategory(act.category);
        setInfoDrawerOpen(true);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }
      if (act.type === 'TOGGLE_MENU') {
        setInfoDrawerOpen((v) => (typeof act.open === 'boolean' ? act.open : !v));
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }
      if (act.type === 'ROTATE_STEP') {
        transformRef.current.rotY += act.direction === 'left' ? -0.65 : 0.65;
        return;
      }
      if (act.type === 'SELECT_MODEL') {
        switchModel(act.modelId);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'EXPLODE') {
        transformRef.current.explode = 1;
        setExplodeUiState(1);
        // Silent under Strict Voice-Only Talk-Back Rule
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'ASSEMBLE') {
        transformRef.current.explode = 0;
        setExplodeUiState(0);
        // Silent under Strict Voice-Only Talk-Back Rule
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'RESET') {
        handleResetView();
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'ZOOM_IN') {
        handleZoomBy(0.35);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'ZOOM_OUT') {
        handleZoomBy(-0.35);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'HOLOGRAM_MODE') {
        if (typeof act.enabled === 'boolean') {
          setHologramMode(act.enabled);
        } else {
          setHologramMode((v) => !v);
        }
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_CAMERA') {
        setCameraVisible((v) => !v);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'SELECT_PLANET') {
        setActiveModelId('solar');
        setSelectedPartId(act.partId);
        setSolarExhibition((prev) => ({ ...prev, selectedPlanetPartId: act.partId }));
        setInfoDrawerOpen(true);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'SHOW_ELEMENTS') {
        setActiveModelId('solar');
        setInfoDrawerOpen(true);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_CROSS_SECTION') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({
          ...prev,
          visualMode: prev.visualMode === 'cross-section' ? 'standard' : 'cross-section',
        }));
        setInfoDrawerOpen(true);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_INFRARED') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({
          ...prev,
          visualMode: prev.visualMode === 'infrared' ? 'standard' : 'infrared',
        }));
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_SIZE_SCALE') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({ ...prev, sizeScaleActive: !prev.sizeScaleActive }));
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_TIMELINE') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({ ...prev, timelineOpen: !prev.timelineOpen }));
        setInfoDrawerOpen(true);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_ORBITAL_AUDIO') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => {
          const next = !prev.orbitalAudioActive;
          soundEngine.setOrbitalResonanceEnabled(
            next,
            PLANETARY_DOSSIERS.slice(0, 5).map((p) => p.harmonicHz)
          );
          return { ...prev, orbitalAudioActive: next };
        });
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_TRAJECTORY') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({ ...prev, trajectoryOpen: !prev.trajectoryOpen }));
        setInfoDrawerOpen(true);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_QUIZ') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({ ...prev, quizOpen: !prev.quizOpen }));
        setInfoDrawerOpen(true);
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_TOUR') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({ ...prev, tourActive: !prev.tourActive }));
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_GRAVITY_WELL') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({ ...prev, gravityWellActive: !prev.gravityWellActive }));
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_HABITABLE_ZONE') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({ ...prev, habitableZoneActive: !prev.habitableZoneActive }));
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'FIRE_LIGHT_PULSE') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({ ...prev, lightPulseNonce: prev.lightPulseNonce + 1 }));
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'TOGGLE_RULER') {
        setActiveModelId('solar');
        setSolarExhibition((prev) => ({ ...prev, rulerActive: !prev.rulerActive }));
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'INTRODUCE_JUDGES') {
        soundEngine.speakJarvis(parsed.jarvisReply);
        return;
      }

      if (act.type === 'HELP_GUIDE') {
        setHelpOpen((v) => !v);
        soundEngine.speakJarvis(parsed.jarvisReply);
      }
    },
    [
      settings.voiceMode,
      showVoiceToast,
      triggerThankYouEasterEgg,
      switchModel,
      handleResetView,
      handleZoomBy,
      startHumanBodyNarration,
      stopHumanBodyNarration,
      togglePauseHumanBodyNarration,
    ]
  );

  const executeVoicePhraseRef = useRef(executeVoicePhrase);
  useEffect(() => {
    executeVoicePhraseRef.current = executeVoicePhrase;
  }, [executeVoicePhrase]);

  // High-frequency hand frame handler kept in a ref so WebcamHandTracker never restarts
  const handleHandsFrame = useCallback(
    (hands: HandObservation[], nowMs: number, aspect: number = 4 / 3) => {
      if (hands.length > 0) {
        if (attractModeRef.current) {
          attractModeRef.current = false;
          setAttractMode(false);
          setScanPulseTrigger((c) => c + 1);
          // Silent under Strict Voice-Only Talk-Back Rule
        }
        lastHandSeenTimeRef.current = nowMs;
      } else if (
        !attractModeRef.current &&
        nowMs - lastHandSeenTimeRef.current >
          TUNING_CONFIG.ATTRACT_MODE_IDLE_MS
      ) {
        attractModeRef.current = true;
        setAttractMode(true);
      }

      const output = gestureMachineRef.current.processFrame(
        hands,
        nowMs,
        aspect,
        settings.handSensitivity
      );
      setSensorSnapshot(sensorEngineRef.current.verifyFrame(hands, output.activeGesture, nowMs));

      if (output.pinchJustStarted) {
        // Silent under Strict Voice-Only Talk-Back Rule
      }
      if (output.fistPunchTriggered) {
        // Silent under Strict Voice-Only Talk-Back Rule
        setSolarExhibition((prev) =>
          prev.quizOpen
            ? { ...prev, quizPunchNonce: prev.quizPunchNonce + 1 }
            : prev
        );
        setInfoDrawerOpen((v) => (solarExhibition.quizOpen ? true : !v));
      }
      if (output.peaceNarrationTriggered) {
        // Silent under Strict Voice-Only Talk-Back Rule
        if (narrationActiveRef.current) {
          togglePauseHumanBodyNarration();
          showVoiceToast('✌️ Peace Gesture: Toggled 4-Min Explanation');
        } else {
          startHumanBodyNarration();
          showVoiceToast('✌️ Peace Gesture: Started 4-Min Human Body Explanation');
        }
      }
      if (output.threeFingerPresetTriggered) {
        // Silent under Strict Voice-Only Talk-Back Rule
        const presets: Array<'all' | 'organs' | 'skeleton' | 'neuro-vascular'> = ['all', 'organs', 'skeleton', 'neuro-vascular'];
        layerPresetIndexRef.current = (layerPresetIndexRef.current + 1) % presets.length;
        const chosen = presets[layerPresetIndexRef.current];
        setActiveModelId('human-body');
        handleApplyAnatomyPreset(chosen);
        showVoiceToast(`3 Fingers: Layer Preset → ${chosen.toUpperCase()}`);
      }
      if (output.shakaScaleTriggered) {
        // Silent under Strict Voice-Only Talk-Back Rule
        setActiveModelId('human-body');
        setAnatomyScaleMode((m) => {
          const next = m === 'organism' ? 'cell' : 'organism';
          showVoiceToast(`🤙 Shaka Gesture: ${next === 'cell' ? 'Eukaryotic Cell View' : 'Full Human Body View'}`);
          return next;
        });
      }
      if (output.twoFistHologramTriggered) {
        // Silent under Strict Voice-Only Talk-Back Rule
        setHologramMode((v) => !v);
        showVoiceToast('✊✊ Two Fists: Toggled 4-Sided Hologram Mode');
      }

      const t = transformRef.current;
      t.rotX = Math.max(
        -1.35,
        Math.min(1.35, t.rotX + output.deltaRotationX)
      );
      t.rotY += output.deltaRotationY;
      t.zoom = Math.max(
        TUNING_CONFIG.MIN_ZOOM,
        Math.min(TUNING_CONFIG.MAX_ZOOM, t.zoom + output.deltaZoom)
      );
      t.posX = Math.max(-1.6, Math.min(1.6, t.posX + output.deltaMoveX));
      t.posY = Math.max(-1.2, Math.min(1.2, t.posY + output.deltaMoveY));

      if (output.targetExplode !== null) {
        const prevExplode = t.explode;
        t.explode = output.targetExplode;
        if (Math.abs(prevExplode - output.targetExplode) > 0.25) {
          setExplodeUiState(output.targetExplode);
        }
      }

      if (output.triggeredReset) {
        handleResetView();
      }

      if (output.swipeTriggered) {
        cycleModel(output.swipeTriggered);
      }

      if (output.pointerScreen && output.activeGesture === 'POINT') {
        pointerNormalizedRef.current = {
          x: output.pointerScreen.x,
          y: output.pointerScreen.y,
        };
      } else {
        pointerNormalizedRef.current = null;
      }

      setHandCount((prev) =>
        prev !== output.handsCount ? output.handsCount : prev
      );
      setActiveGesture((prev) =>
        prev !== output.activeGesture ? output.activeGesture : prev
      );

      const roundedReset =
        output.resetProgress > 0.25
          ? Math.round(output.resetProgress * 25) / 25
          : 0;
      setResetProgress((prev) => (prev !== roundedReset ? roundedReset : prev));

      if (roundedReset > 0.25 && output.palmScreen) {
        setPalmCursor({
          x: output.palmScreen.x,
          y: output.palmScreen.y,
        });
      } else {
        setPalmCursor((prev) => (prev !== null ? null : prev));
      }

      if (output.pointerScreen && output.activeGesture === 'POINT') {
        const px = Math.round(output.pointerScreen.x * 200) / 200;
        const py = Math.round(output.pointerScreen.y * 200) / 200;
        setPointerCursor((prev) =>
          !prev || prev.x !== px || prev.y !== py ? { x: px, y: py } : prev
        );
      } else {
        setPointerCursor((prev) => (prev !== null ? null : prev));
      }
    },
    [settings.handSensitivity, handleResetView, cycleModel]
  );

  const handleHandsFrameRef = useRef(handleHandsFrame);
  useEffect(() => {
    handleHandsFrameRef.current = handleHandsFrame;
  }, [handleHandsFrame]);

  const stableOnHandsFrame = useCallback(
    (hands: HandObservation[], nowMs: number, aspect: number) => {
      handleHandsFrameRef.current(hands, nowMs, aspect);
    },
    []
  );

  // Web Speech API management (Push-to-talk vs Hands-free)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const pttSilenceTimerRef = useRef<number | null>(null);
  const handsFreeRestartTimerRef = useRef<number | null>(null);
  const handsFreeBackoffRef = useRef<number>(300);
  const voiceFatalBlockedRef = useRef<boolean>(false);

  const stopVoiceRecognition = useCallback(() => {
    if (pttSilenceTimerRef.current !== null) {
      window.clearTimeout(pttSilenceTimerRef.current);
      pttSilenceTimerRef.current = null;
    }
    if (handsFreeRestartTimerRef.current !== null) {
      window.clearTimeout(handsFreeRestartTimerRef.current);
      handsFreeRestartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    setVoiceListening(false);
  }, []);

  const startVoiceRecognition = useCallback(
    (mode: 'push-to-talk' | 'hands-free') => {
      const win = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const SpeechRec =
        win.SpeechRecognition || win.webkitSpeechRecognition;

      if (!SpeechRec) {
        showVoiceToast('Voice commands are not supported in this browser.');
        return;
      }

      stopVoiceRecognition();
      voiceFatalBlockedRef.current = false;

      const recognition = new SpeechRec();
      recognition.continuous = mode === 'hands-free';
      recognition.interimResults = false;
      recognition.lang = settings.voiceLang;

      let gotFinalResult = false;

      recognition.onstart = () => {
        setVoiceListening(true);
        if (mode === 'push-to-talk') {
          showVoiceToast('Listening… speak a command');
          pttSilenceTimerRef.current = window.setTimeout(() => {
            stopVoiceRecognition();
          }, 8000);
        }
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result.isFinal && result[0]) {
            gotFinalResult = true;
            handsFreeBackoffRef.current = 300;
            const transcript = result[0].transcript;
            executeVoicePhraseRef.current(transcript, mode === 'push-to-talk');
            if (mode === 'push-to-talk') {
              stopVoiceRecognition();
              break;
            }
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (
          event.error === 'not-allowed' ||
          event.error === 'service-not-allowed'
        ) {
          voiceFatalBlockedRef.current = true;
          showVoiceToast('Microphone is blocked in the browser.');
          stopVoiceRecognition();
        } else if (event.error === 'network') {
          voiceFatalBlockedRef.current = true;
          showVoiceToast(
            'Speech recognition needs an internet connection in this browser.'
          );
          stopVoiceRecognition();
        }
      };

      recognition.onend = () => {
        setVoiceListening(false);
        if (
          mode === 'hands-free' &&
          !voiceFatalBlockedRef.current &&
          settings.voiceMode === 'hands-free'
        ) {
          const delay = gotFinalResult ? 300 : handsFreeBackoffRef.current;
          handsFreeBackoffRef.current = Math.min(3000, delay * 1.6);
          handsFreeRestartTimerRef.current = window.setTimeout(() => {
            if (
              settings.voiceMode === 'hands-free' &&
              !voiceFatalBlockedRef.current
            ) {
              startVoiceRecognition('hands-free');
            }
          }, delay);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setVoiceListening(false);
      }
    },
    [settings.voiceLang, settings.voiceMode, showVoiceToast, stopVoiceRecognition]
  );

  // Auto-start or stop hands-free mode when setting changes
  useEffect(() => {
    if (!started) return;
    if (settings.voiceMode === 'hands-free') {
      startVoiceRecognition('hands-free');
    } else {
      stopVoiceRecognition();
    }
    return () => {
      stopVoiceRecognition();
    };
  }, [
    started,
    settings.voiceMode,
    settings.voiceLang,
    startVoiceRecognition,
    stopVoiceRecognition,
  ]);

  const handleTriggerVoiceButton = useCallback(() => {
    soundEngine.unlockAudio();
    if (voiceListening) {
      if (settings.voiceMode === 'hands-free') {
        handleUpdateSettings({ voiceMode: 'push-to-talk' });
      }
      stopVoiceRecognition();
    } else {
      startVoiceRecognition(settings.voiceMode);
    }
  }, [
    voiceListening,
    settings.voiceMode,
    handleUpdateSettings,
    stopVoiceRecognition,
    startVoiceRecognition,
  ]);

  // Optional external WebSocket bridge with exponential backoff reconnect
  useEffect(() => {
    const wsParamUrl =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('ws')
        : null;
    const activeWsUrl =
      wsParamUrl || (wsEnabled ? settings.wsUrl.trim() : '');

    if (!activeWsUrl) {
      setWsConnected(false);
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let backoffMs = 500;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      try {
        ws = new WebSocket(activeWsUrl);
      } catch {
        setWsConnected(false);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        backoffMs = 500;
        setWsConnected(true);
      };

      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(String(evt.data));
          if (Array.isArray(payload.hands)) {
            handleHandsFrameRef.current(
              payload.hands,
              performance.now(),
              payload.aspect ?? 4 / 3
            );
          } else if (typeof payload.voice === 'string') {
            executeVoicePhraseRef.current(payload.voice, true);
          }
        } catch {
          // Ignore malformed WS packets
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        scheduleReconnect();
      };

      ws.onerror = () => {
        try {
          ws?.close();
        } catch {
          // Ignore
        }
      };
    };

    const scheduleReconnect = () => {
      if (disposed) return;
      reconnectTimer = window.setTimeout(() => {
        backoffMs = Math.min(8000, backoffMs * 1.8);
        connect();
      }, backoffMs);
    };

    connect();

    return () => {
      disposed = true;
      setWsConnected(false);
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      try {
        ws?.close();
      } catch {
        // Ignore
      }
    };
  }, [wsEnabled, settings.wsUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      soundEngine.unlockAudio();

      if (e.key === 'Escape') {
        if (hologramMode) {
          setHologramMode(false);
          return;
        }
        if (helpOpen) {
          setHelpOpen(false);
          return;
        }
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        if (infoDrawerOpen) {
          setInfoDrawerOpen(false);
          return;
        }
        return;
      }

      // 1-5 select models
      if (e.key >= '1' && e.key <= '5') {
        const index = Number(e.key) - 1;
        const model = SCIENCE_MODELS[index];
        if (model) {
          switchModel(model.id);
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        transformRef.current.rotY -= 0.18;
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        transformRef.current.rotY += 0.18;
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        transformRef.current.rotX = Math.max(
          -1.35,
          transformRef.current.rotX - 0.15
        );
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        transformRef.current.rotX = Math.min(
          1.35,
          transformRef.current.rotX + 0.15
        );
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomBy(0.22);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomBy(-0.22);
        return;
      }

      if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        const delta = e.key === ']' ? 0.02 : -0.02;
        handleUpdateSettings({
          pyramidSize: Math.max(
            0.18,
            Math.min(0.45, Number((settings.pyramidSize + delta).toFixed(2)))
          ),
        });
        return;
      }

      const lower = e.key.toLowerCase();
      if (lower === 'e') {
        e.preventDefault();
        handleToggleExplode();
      } else if (lower === 'r') {
        e.preventDefault();
        handleResetView();
      } else if (lower === 'm') {
        e.preventDefault();
        setHologramMode((v) => !v);
      } else if (lower === 'h') {
        e.preventDefault();
        setCameraVisible((v) => !v);
      } else if (lower === 's') {
        e.preventDefault();
        handleUpdateSettings({ muted: !settings.muted });
      } else if (lower === 'v') {
        e.preventDefault();
        handleTriggerVoiceButton();
      } else if (lower === 'f') {
        e.preventDefault();
        try {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        } catch {
          // Ignore fullscreen API errors in restricted iframes
        }
      } else if (e.key === ',') {
        e.preventDefault();
        setSettingsOpen((v) => {
          const next = !v;
          if (next) setInfoDrawerOpen(false);
          return next;
        });
      } else if (e.key === '?' || lower === 't') {
        e.preventDefault();
        setHelpOpen((v) => !v);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    hologramMode,
    helpOpen,
    settingsOpen,
    infoDrawerOpen,
    settings.pyramidSize,
    settings.muted,
    switchModel,
    handleZoomBy,
    handleUpdateSettings,
    handleToggleExplode,
    handleResetView,
    handleTriggerVoiceButton,
  ]);

  const handleStart = useCallback(() => {
    soundEngine.unlockAudio();
    // Silent under Strict Voice-Only Talk-Back Rule
    setStarted(true);
  }, []);

  const handlePartSelectFromDrawer = useCallback((part: SubPartInfo) => {
    setSelectedPartId((prev) => (prev === part.id ? null : part.id));
    // Silent under Strict Voice-Only Talk-Back Rule
  }, []);

  const handlePartHoverOrSelect = useCallback(
    (overlay: HoveredPartOverlay | null) => {
      setInspectedPart(overlay);
    },
    []
  );

  const handleFpsUpdate = useCallback((measuredFps: number) => {
    setFps(measuredFps);
  }, []);

  return (
    <div
      onClick={() => { if (cleanPresentation) setCleanPresentation(false); }}
      className={`relative w-screen h-screen overflow-hidden select-none ${
        hologramMode ? 'bg-black' : 'bg-[#0a0b0d]'
      } ${hologramMode && hologramCursorHidden ? 'cursor-none' : ''}`}
    >
      {/* 3D Hologram Canvas */}
      <HologramCanvas
        activeModelId={activeModelId}
        heartBpm={heartBpm}
        hologramMode={hologramMode}
        pyramidFourView={true}
        pyramidSize={settings.pyramidSize}
        pyramidGap={settings.pyramidGap}
        pyramidFlip180={settings.pyramidFlip180}
        infoDrawerOpen={infoDrawerOpen && !hologramMode}
        attractMode={attractMode}
        thankYouActive={thankYouActive}
        scanPulseTrigger={scanPulseTrigger}
        transformRef={transformRef}
        pointerNormalizedRef={pointerNormalizedRef}
        selectedPartId={selectedPartId}
        onPartHoverOrSelect={handlePartHoverOrSelect}
        targetFps={settings.targetFps}
        liveTelemetry={liveTelemetry}
        anatomyLayers={anatomyLayers}
        anatomyScaleMode={anatomyScaleMode}
        onFpsUpdate={handleFpsUpdate}
      />

      {/* Hologram mode pure-black overlay hint ("Press Esc to exit" fades after 3s) */}
      <HologramModeOverlay active={hologramMode} />

      {/* Standard workspace UI (hidden in Hologram pyramid mode) */}
      {!hologramMode && !cleanPresentation && (
        <>
          <TopHeaderBar
            activeModelId={activeModelId}
            cameraStatus={cameraStatus}
            handCount={handCount}
            fps={fps}
            showFps={settings.showFps}
            infoOpen={infoDrawerOpen}
            onToggleInfo={() => {
              setInfoDrawerOpen((v) => {
                const next = !v;
                if (next) setSettingsOpen(false);
                return next;
              });
            }}
            onOpenSettings={() => {
              setInfoDrawerOpen(false);
              setSettingsOpen((v) => !v);
            }}
            onOpenHelp={() => setHelpOpen(true)}
            cleanPresentation={cleanPresentation}
            onToggleCleanPresentation={() => setCleanPresentation((v) => !v)}
          />

          {isDebugUrl && (
            <DeveloperSimulatorBar
              simMode={simMode}
              onChangeSimMode={setSimMode}
            />
          )}

          <FloatingPartCalloutAndCursor
            inspectedPart={inspectedPart}
            pointerCursor={pointerCursor}
            palmCursor={palmCursor}
            resetProgress={resetProgress}
          />

          <InfoDrawer
            open={infoDrawerOpen}
            activeModelId={activeModelId}
            selectedPartId={selectedPartId}
            heartBpm={heartBpm}
            liveTelemetry={liveTelemetry}
            sensorSnapshot={sensorSnapshot}
            onRefreshNasa={refreshNasaTelemetry}
            onClose={() => setInfoDrawerOpen(false)}
            anatomyLayers={anatomyLayers}
            anatomyScaleMode={anatomyScaleMode}
            narrationState={narrationState}
            syncedMediaCategory={syncedMediaCategory}
            onStartNarration={startHumanBodyNarration}
            onPauseResumeNarration={togglePauseHumanBodyNarration}
            onStopNarration={stopHumanBodyNarration}
            onNextNarrationChapter={nextNarrationChapter}
            onToggleAnatomyLayer={handleToggleAnatomyLayer}
            onApplyAnatomyPreset={handleApplyAnatomyPreset}
            onChangeAnatomyScaleMode={setAnatomyScaleMode}
            onSelectPart={handlePartSelectFromDrawer}
            onChangeHeartBpm={setHeartBpm}
            solarExhibition={solarExhibition}
            onSolarSelectPlanet={(pid) => {
              setSelectedPartId(pid);
              setSolarExhibition((prev) => ({ ...prev, selectedPlanetPartId: pid }));
            }}
            onSolarSetVisualMode={(mode: SolarVisualMode) =>
              setSolarExhibition((prev) => ({ ...prev, visualMode: mode }))
            }
            onSolarToggleSizeScale={() =>
              setSolarExhibition((prev) => ({ ...prev, sizeScaleActive: !prev.sizeScaleActive }))
            }
            onSolarChangeTimelineYear={(year) =>
              setSolarExhibition((prev) => ({ ...prev, timelineYear: year }))
            }
            onSolarToggleOrbitalAudio={() =>
              setSolarExhibition((prev) => ({ ...prev, orbitalAudioActive: !prev.orbitalAudioActive }))
            }
            onSolarToggleTrajectory={() =>
              setSolarExhibition((prev) => ({ ...prev, trajectoryOpen: !prev.trajectoryOpen }))
            }
            onSolarToggleQuiz={() =>
              setSolarExhibition((prev) => ({ ...prev, quizOpen: !prev.quizOpen }))
            }
            onSolarToggleTour={() =>
              setSolarExhibition((prev) => ({ ...prev, tourActive: !prev.tourActive }))
            }
            onSolarToggleGravityWell={() =>
              setSolarExhibition((prev) => ({ ...prev, gravityWellActive: !prev.gravityWellActive }))
            }
            onSolarToggleHabitableZone={() =>
              setSolarExhibition((prev) => ({ ...prev, habitableZoneActive: !prev.habitableZoneActive }))
            }
            onSolarFireLightPulse={() =>
              setSolarExhibition((prev) => ({ ...prev, lightPulseNonce: prev.lightPulseNonce + 1 }))
            }
            onSolarToggleRuler={() =>
              setSolarExhibition((prev) => ({ ...prev, rulerActive: !prev.rulerActive }))
            }
          />

          <BottomWorkspaceControls
            activeModelId={activeModelId}
            handCount={handCount}
            activeGesture={activeGesture}
            explodeTarget={explodeUiState}
            voiceListening={voiceListening}
            voiceNotice={voiceNotice}
            onSelectModel={switchModel}
            onToggleExplode={handleToggleExplode}
            onZoomIn={() => handleZoomBy(0.25)}
            onZoomOut={() => handleZoomBy(-0.25)}
            onResetView={handleResetView}
            onToggleHologramMode={() => setHologramMode(true)}
            onTriggerVoice={handleTriggerVoiceButton}
          />
        </>
      )}

      {/* Camera tracker remains mounted so gestures work even in Hologram mode */}
      <WebcamHandTracker
        visible={cameraVisible}
        hiddenByHologram={hologramMode}
        cameraId={settings.cameraId}
        mirrorPreview={settings.mirrorPreview}
        presenterMode={settings.presenterMode}
        simMode={simMode}
        retryNonce={retryNonce}
        onToggleVisible={() => setCameraVisible((v) => !v)}
        onStatusChange={setCameraStatus}
        onDevicesChange={setCameraDevices}
        onHandsFrame={stableOnHandsFrame}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        open={settingsOpen}
        settings={settings}
        cameraDevices={cameraDevices}
        simMode={simMode}
        wsConnected={wsConnected}
        fps={fps}
        onUpdateSettings={handleUpdateSettings}
        onRetryCamera={() => setRetryNonce((n) => n + 1)}
        onChangeSimMode={setSimMode}
        onToggleWsConnect={() => setWsEnabled((v) => !v)}
        onRunTypedVoiceCommand={(text) => executeVoicePhrase(text, true)}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Help Modal */}
      <HelpGuideModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Start Screen Card */}
      {!started && <StartScreenCard onStart={handleStart} />}
    </div>
  );
}
