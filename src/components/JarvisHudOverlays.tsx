import React, { useEffect, useState } from 'react';
import {
  Menu,
  Settings,
  HelpCircle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Box,
  Mic,
  MicOff,
  X,
  MoreHorizontal,
  HeartPulse,
  EyeOff,
} from 'lucide-react';
import {
  GESTURE_GUIDE_ITEMS,
  SCIENCE_MODELS,
  ModelId,
  SubPartInfo,
} from '../config/constants';
import { ActiveGestureType } from '../logic/gestureEngine';
import { SensorVerificationSnapshot } from '../logic/sensorTelemetry';
import { HoveredPartOverlay } from '../three/HologramCanvas';
import {
  DEEP_SPACE_PROBES,
  fetchNasaMediaGallery,
  LiveSpaceTelemetry,
  LUNAR_MISSION_SITES,
  NasaMediaCategory,
  NasaMediaItem,
  resolveNasaVideoUrl,
} from '../services/nasaDataService';
import { SimulatorPoseMode, TrackerStatus } from './WebcamHandTracker';
import { AnatomyLayerKey, AnatomyScaleMode, DEFAULT_ANATOMY_LAYERS } from '../data/humanAnatomyBook';
import { AnatomyAtlasPanel, NarrationUiState } from './AnatomyAtlasPanel';
import { SolarDossierPanel, SolarExhibitionState, SolarVisualMode } from './SolarDossierPanel';
import { AnatomyMediaCategory } from '../services/anatomyMediaService';

function useViewportWidth(): number {
  const [width, setWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}

export const StartScreenCard: React.FC<{
  onStart: () => void;
}> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="glass-surface max-w-sm w-full p-6 flex flex-col items-start gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
          <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--text)]">
            Jarvis
          </h1>
        </div>
        <p className="text-[13px] leading-[1.45] text-[var(--muted)]">
          Control a 3D model with your hands. Allow camera access when asked.
        </p>
        <button
          type="button"
          onClick={onStart}
          data-testid="start-button"
          className="w-full h-10 rounded-[12px] bg-[var(--accent)] text-[#0a0b0d] font-medium text-[13px] hover:opacity-90 transition-opacity cursor-pointer"
        >
          Start
        </button>
      </div>
    </div>
  );
};

interface TopHeaderBarProps {
  activeModelId: ModelId;
  cameraStatus: TrackerStatus;
  handCount: number;
  fps: number;
  showFps: boolean;
  infoOpen: boolean;
  onToggleInfo: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  cleanPresentation: boolean;
  onToggleCleanPresentation: () => void;
}

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  activeModelId,
  cameraStatus,
  handCount,
  fps,
  showFps,
  infoOpen,
  onToggleInfo,
  onOpenSettings,
  onOpenHelp,
  cleanPresentation,
  onToggleCleanPresentation,
}) => {
  const activeModel =
    SCIENCE_MODELS.find((m) => m.id === activeModelId) ?? SCIENCE_MODELS[0];

  let statusDotClass = 'bg-[#f59e0b]';
  let statusText = 'Ready';

  if (cameraStatus === 'starting') {
    statusDotClass = 'bg-[#f59e0b]';
    statusText = 'Starting camera…';
  } else if (cameraStatus === 'loading-model') {
    statusDotClass = 'bg-[#f59e0b]';
    statusText = 'Loading hand tracking…';
  } else if (cameraStatus === 'camera-denied') {
    statusDotClass = 'bg-[#ef4444]';
    statusText = 'Camera blocked';
  } else if (cameraStatus === 'no-camera') {
    statusDotClass = 'bg-[#ef4444]';
    statusText = 'Camera off';
  } else if (cameraStatus === 'model-failed') {
    statusDotClass = 'bg-[#ef4444]';
    statusText = 'Hand tracking offline';
  } else if (handCount > 0) {
    statusDotClass = 'bg-[#22c55e]';
    statusText =
      handCount >= 3 ? `Co-Op · ${handCount} hands (274/s)` : handCount === 1 ? 'Tracking · 1 hand' : `Tracking · ${handCount} hands`;
  } else {
    statusDotClass = 'bg-[#f59e0b]';
    statusText = '6-Hand Ready';
  }

  return (
    <header className="fixed top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
      {/* Top-left wordmark + active model name */}
      <div className="pointer-events-auto glass-surface px-3.5 h-10 flex items-center gap-2.5">
        <span className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--text)]">
          Jarvis
        </span>
        <span className="text-[var(--faint)]">·</span>
        <span
          className="text-[13px] text-[var(--muted)]"
          data-testid="active-model-title"
        >
          {activeModel.name}
        </span>
      </div>

      {/* Top-right status pill + Info, Settings, Help icon buttons */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div
          aria-live="polite"
          data-testid="status-pill"
          className="glass-pill px-3.5 h-10 flex items-center gap-2 text-[12px] text-[var(--text)]"
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass}`} />
          <span>{statusText}</span>
          {showFps && (
            <span
              className="text-[var(--muted)] tabular-nums ml-1"
              data-testid="fps-counter"
            >
              · {fps} FPS
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleInfo}
          aria-label="Open Solar System menu"
          title="Solar System details (3-line menu)"
          data-testid="toggle-info-button"
          className={`w-10 h-10 rounded-[12px] flex items-center justify-center border transition-colors cursor-pointer ${
            infoOpen
              ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
              : 'glass-surface text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings (,)"
          title="Settings (,)"
          data-testid="open-settings-button"
          className="w-10 h-10 rounded-[12px] glass-surface flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleCleanPresentation}
          aria-label="Clean presentation mode"
          title="Clean presentation mode"
          className={`w-10 h-10 rounded-[12px] flex items-center justify-center border transition-colors cursor-pointer ${cleanPresentation ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]' : 'glass-surface text-[var(--muted)] hover:text-[var(--text)]'}`}
        >
          <EyeOff className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenHelp}
          aria-label="Help (?)"
          title="Help (?)"
          data-testid="open-help-button"
          className="w-10 h-10 rounded-[12px] glass-surface flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

interface InfoDrawerProps {
  open: boolean;
  activeModelId: ModelId;
  selectedPartId: string | null;
  heartBpm: number;
  liveTelemetry?: LiveSpaceTelemetry | null;
  sensorSnapshot?: SensorVerificationSnapshot | null;
  onRefreshNasa?: () => void;
  onClose: () => void;
  anatomyLayers?: Record<AnatomyLayerKey, boolean>;
  anatomyScaleMode?: AnatomyScaleMode;
  narrationState?: NarrationUiState;
  syncedMediaCategory?: AnatomyMediaCategory;
  onStartNarration?: () => void;
  onPauseResumeNarration?: () => void;
  onStopNarration?: () => void;
  onNextNarrationChapter?: () => void;
  onToggleAnatomyLayer?: (key: AnatomyLayerKey) => void;
  onApplyAnatomyPreset?: (preset: 'all' | 'organs' | 'skeleton' | 'neuro-vascular') => void;
  onChangeAnatomyScaleMode?: (mode: AnatomyScaleMode) => void;
  onSelectPart: (part: SubPartInfo) => void;
  onChangeHeartBpm: (bpm: number) => void;
  solarExhibition?: SolarExhibitionState;
  onSolarSelectPlanet?: (partId: string) => void;
  onSolarSetVisualMode?: (mode: SolarVisualMode) => void;
  onSolarToggleSizeScale?: () => void;
  onSolarChangeTimelineYear?: (year: number) => void;
  onSolarToggleOrbitalAudio?: () => void;
  onSolarToggleTrajectory?: () => void;
  onSolarToggleQuiz?: () => void;
  onSolarToggleTour?: () => void;
  onSolarToggleGravityWell?: () => void;
  onSolarToggleHabitableZone?: () => void;
  onSolarFireLightPulse?: () => void;
  onSolarToggleRuler?: () => void;
}

export const InfoDrawer: React.FC<InfoDrawerProps> = ({
  open,
  activeModelId,
  selectedPartId,
  heartBpm,
  liveTelemetry,
  sensorSnapshot,
  onRefreshNasa,
  onClose,
  anatomyLayers = DEFAULT_ANATOMY_LAYERS,
  anatomyScaleMode = 'organism',
  narrationState,
  syncedMediaCategory,
  onStartNarration,
  onPauseResumeNarration,
  onStopNarration,
  onNextNarrationChapter,
  onToggleAnatomyLayer,
  onApplyAnatomyPreset,
  onChangeAnatomyScaleMode,
  onSelectPart,
  onChangeHeartBpm,
  solarExhibition,
  onSolarSelectPlanet,
  onSolarSetVisualMode,
  onSolarToggleSizeScale,
  onSolarChangeTimelineYear,
  onSolarToggleOrbitalAudio,
  onSolarToggleTrajectory,
  onSolarToggleQuiz,
  onSolarToggleTour,
  onSolarToggleGravityWell,
  onSolarToggleHabitableZone,
  onSolarFireLightPulse,
  onSolarToggleRuler,
}) => {
  const [mediaCategory, setMediaCategory] = useState<NasaMediaCategory>('voyager');
  const [mediaItems, setMediaItems] = useState<NasaMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');

  useEffect(() => {
    if (!open || activeModelId !== 'solar') return;
    let cancelled = false;
    setMediaLoading(true);
    fetchNasaMediaGallery(mediaCategory, 6).then((items) => {
      if (!cancelled) {
        setMediaItems(items);
        setMediaLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, activeModelId, mediaCategory]);

  if (!open) return null;

  const model =
    SCIENCE_MODELS.find((m) => m.id === activeModelId) ?? SCIENCE_MODELS[0];

  const handleOpenMedia = async (item: NasaMediaItem) => {
    if (item.mediaType === 'video') {
      const mp4 = await resolveNasaVideoUrl(item.collectionJsonUrl);
      if (mp4) {
        setActiveVideoTitle(item.title);
        setActiveVideoUrl(mp4);
      }
    } else {
      window.open(item.thumbnailUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <aside
      aria-label="Model details"
      data-testid="info-drawer"
      className="fixed top-16 right-4 bottom-20 w-[340px] max-w-[calc(100vw-32px)] z-30 glass-surface flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--text)]">
            {model.name}
          </h2>
          <p className="text-[12px] text-[var(--muted)]">{model.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close information drawer"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-[13px] leading-[1.45]">
        <div>
          <div className="text-[12px] font-medium text-[var(--muted)] mb-1">
            What it teaches
          </div>
          <p className="text-[var(--text)]">{model.whatItTeaches}</p>
        </div>

        {/* Measured hand-landmark throughput and multi-presenter verification */}
        {sensorSnapshot && (
          <div className="p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] space-y-2 text-[11px] tabular-nums">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text)]">Hand Sensor Telemetry</span>
              <span className="text-[#22c55e] font-semibold">
                {sensorSnapshot.measuredSensorsPerSec} points/sec
              </span>
            </div>
            <div className="text-[var(--muted)]">
              Observed from {sensorSnapshot.totalHands} hand{sensorSnapshot.totalHands === 1 ? '' : 's'} at {sensorSnapshot.sampleRateHz} Hz · benchmark {sensorSnapshot.targetSensorsPerSec} points/sec
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-2 rounded-[8px] bg-black/30 border border-white/5">
                <div className="text-[#38bdf8] font-medium">You · {sensorSnapshot.operator1.handCount} hands</div>
                <div className="text-[var(--text)] mt-0.5">{sensorSnapshot.operator1.direction}</div>
                <div className="text-[var(--muted)]">{sensorSnapshot.operator1.velocityCmPerSec} cm/s · {sensorSnapshot.operator1.stabilityPct}%</div>
              </div>
              <div className="p-2 rounded-[8px] bg-black/30 border border-white/5">
                <div className="text-[#fbbf24] font-medium">Friend · {sensorSnapshot.operator2.handCount} hands</div>
                <div className="text-[var(--text)] mt-0.5">{sensorSnapshot.operator2.direction}</div>
                <div className="text-[var(--muted)]">{sensorSnapshot.operator2.velocityCmPerSec} cm/s · {sensorSnapshot.operator2.stabilityPct}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[var(--muted)] pt-0.5">
              <span>Action: <strong className="text-[var(--text)]">{sensorSnapshot.overallAction}</strong></span>
              <span>{sensorSnapshot.totalLandmarks} 3D pts</span>
            </div>
          </div>
        )}

        {/* Stage 2: Complete Human Body Anatomy Atlas */}
        {activeModelId === 'human-body' && (
          <AnatomyAtlasPanel
            selectedPartId={selectedPartId}
            heartBpm={heartBpm}
            anatomyLayers={anatomyLayers}
            anatomyScaleMode={anatomyScaleMode}
            narrationState={narrationState}
            syncedMediaCategory={syncedMediaCategory}
            onStartNarration={onStartNarration}
            onPauseResumeNarration={onPauseResumeNarration}
            onStopNarration={onStopNarration}
            onNextNarrationChapter={onNextNarrationChapter}
            onChangeHeartBpm={onChangeHeartBpm}
            onToggleLayer={(k) => onToggleAnatomyLayer?.(k)}
            onApplyLayerPreset={(pr) => onApplyAnatomyPreset?.(pr)}
            onChangeScaleMode={(m) => onChangeAnatomyScaleMode?.(m)}
            onSelectPart={onSelectPart}
          />
        )}

        {/* Stage 1: Astrophysics Planetary Dossiers & Exhibition Showstoppers */}
        {activeModelId === 'solar' && solarExhibition && (
          <SolarDossierPanel
            exhibition={solarExhibition}
            onSelectPlanet={(pid) => onSolarSelectPlanet?.(pid)}
            onSetVisualMode={(m) => onSolarSetVisualMode?.(m)}
            onToggleSizeScale={() => onSolarToggleSizeScale?.()}
            onChangeTimelineYear={(y) => onSolarChangeTimelineYear?.(y)}
            onToggleOrbitalAudio={() => onSolarToggleOrbitalAudio?.()}
            onToggleTrajectory={() => onSolarToggleTrajectory?.()}
            onToggleQuiz={() => onSolarToggleQuiz?.()}
            onToggleTour={() => onSolarToggleTour?.()}
            onToggleGravityWell={() => onSolarToggleGravityWell?.()}
            onToggleHabitableZone={() => onSolarToggleHabitableZone?.()}
            onFireLightPulse={() => onSolarFireLightPulse?.()}
            onToggleRuler={() => onSolarToggleRuler?.()}
          />
        )}

        {/* Real-time NASA, ISS & Apollo Telemetry */}
        {activeModelId === 'solar' && liveTelemetry && (
          <div className="p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    liveTelemetry.status === 'live'
                      ? 'bg-[#22c55e]'
                      : liveTelemetry.status === 'partial'
                        ? 'bg-[#f59e0b]'
                        : 'bg-[#94a3b8]'
                  }`}
                />
                NASA Live Telemetry
              </span>
              {onRefreshNasa && (
                <button
                  type="button"
                  onClick={onRefreshNasa}
                  className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Refresh
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="p-2 rounded-[8px] bg-black/30 border border-[var(--border)]">
                <div className="text-[var(--muted)]">Data state</div>
                <div className="text-[var(--text)] font-medium uppercase tracking-[0.08em]">
                  {liveTelemetry.status === 'live' ? 'Live' : liveTelemetry.status === 'partial' ? 'Partial' : 'Offline reference'}
                </div>
              </div>
              <div className="p-2 rounded-[8px] bg-black/30 border border-[var(--border)]">
                <div className="text-[var(--muted)]">Last checked</div>
                <div className="text-[var(--text)] font-medium">
                  {new Date(liveTelemetry.lastUpdatedIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
            <p className="text-[10px] leading-relaxed text-[var(--faint)]">
              Sources: NASA EPIC, NASA NeoWs, NASA DONKI, and live ISS position feed. “Offline reference” values are illustrative fallbacks and are never live observations.
            </p>

            {activeModelId === 'solar' && (
              <div className="space-y-2 text-[11px] tabular-nums">
                <div className="p-2 rounded-[8px] bg-black/30 border border-[var(--border)]">
                  <div className="text-[var(--muted)] font-medium">NASA NeoWs Asteroids ({liveTelemetry.neo.live ? 'Live' : 'Ref'})</div>
                  <div className="text-[var(--text)] mt-0.5">
                    {liveTelemetry.neo.countToday} NEOs today · {liveTelemetry.neo.hazardousCount} hazardous
                  </div>
                  <div className="text-[var(--muted)]">
                    Closest: {liveTelemetry.neo.closestName} ({liveTelemetry.neo.closestDistanceKm.toLocaleString()} km)
                  </div>
                </div>

                <div className="p-2 rounded-[8px] bg-black/30 border border-[var(--border)]">
                  <div className="text-[var(--muted)] font-medium">NASA DONKI Solar Weather ({liveTelemetry.solar.live ? 'Live' : 'Ref'})</div>
                  <div className="text-[var(--text)] mt-0.5">
                    Flare Class {liveTelemetry.solar.latestFlareClass} · {liveTelemetry.solar.activeRegion}
                  </div>
                  <div className="text-[var(--muted)]">{liveTelemetry.solar.peakTime}</div>
                </div>

                <div className="pt-1">
                  <div className="text-[var(--muted)] font-medium mb-1.5">Deep-Space &amp; Planetary Probes</div>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {DEEP_SPACE_PROBES.map((probe) => (
                      <div key={probe.id} className="px-2 py-1 rounded bg-black/25 border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[#7dd3fc] font-medium">{probe.name}</span>
                          <span className="text-[10px] text-[var(--faint)]">{probe.agency}</span>
                        </div>
                        <div className="text-[10px] text-[var(--muted)]">{probe.target}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Real NASA & Probe Images / Playable Videos Gallery */}
            <div className="pt-2 border-t border-[var(--border)] space-y-2">
              <div className="text-[11px] font-medium text-[var(--muted)]">
                Real NASA &amp; Probe Images / Videos (images.nasa.gov)
              </div>
              <div className="flex flex-wrap gap-1">
                {([
                  { id: 'earth', label: 'Earth' },
                  { id: 'apollo', label: 'Apollo' },
                  { id: 'chandrayaan', label: 'Chandrayaan' },
                  { id: 'voyager', label: 'Voyager' },
                  { id: 'probes', label: 'Probes' },
                ] as const).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveVideoUrl(null);
                      setMediaCategory(cat.id);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10.5px] border cursor-pointer ${
                      mediaCategory === cat.id
                        ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                        : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {activeVideoUrl && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-[var(--text)] truncate pr-2">{activeVideoTitle}</span>
                    <button
                      type="button"
                      onClick={() => setActiveVideoUrl(null)}
                      className="text-[var(--accent)] cursor-pointer shrink-0"
                    >
                      Close
                    </button>
                  </div>
                  <video
                    src={activeVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full rounded-[8px] bg-black border border-white/10"
                  />
                </div>
              )}

              {mediaLoading ? (
                <div className="text-[11px] text-[var(--muted)] py-2">Loading NASA archive…</div>
              ) : mediaItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {mediaItems.map((item) => (
                    <button
                      key={item.nasaId}
                      type="button"
                      onClick={() => handleOpenMedia(item)}
                      className="group relative rounded-[8px] overflow-hidden border border-white/10 bg-black/40 text-left cursor-pointer"
                      title={item.title}
                    >
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <div className="p-1.5 text-[10px] leading-tight text-[var(--text)] line-clamp-2">
                        {item.mediaType === 'video' ? '▶ ' : ''}
                        {item.title}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-[var(--faint)]">
                  Connect online to stream live NASA Earth, Apollo, Chandrayaan &amp; Voyager media.
                </div>
              )}
            </div>
          </div>
        )}



        {/* 3 Key facts */}
        <div>
          <div className="text-[12px] font-medium text-[var(--muted)] mb-2">
            Key facts
          </div>
          <ul className="space-y-2">
            {model.facts.map((fact, idx) => (
              <li
                key={idx}
                className="p-2.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] text-[12px] text-[var(--text)]"
              >
                {fact}
              </li>
            ))}
          </ul>
        </div>

        {/* Clickable parts list */}
        <div>
          <div className="text-[12px] font-medium text-[var(--muted)] mb-2">
            Parts (click or point to inspect)
          </div>
          <div className="space-y-1.5">
            {model.parts.map((part) => {
              const isSelected = selectedPartId === part.id;
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => onSelectPart(part)}
                  data-testid={`part-chip-${part.id}`}
                  className={`w-full text-left p-2.5 rounded-[12px] border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--text)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--raised)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[13px]">{part.name}</span>
                    {part.metric && (
                      <span className="text-[11px] text-[var(--accent)] tabular-nums shrink-0">
                        {part.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--muted)] mt-1">
                    {part.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};

interface BottomWorkspaceControlsProps {
  activeModelId: ModelId;
  handCount: number;
  activeGesture: ActiveGestureType;
  explodeTarget: number;
  voiceListening: boolean;
  voiceNotice: string | null;
  onSelectModel: (id: ModelId) => void;
  onToggleExplode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleHologramMode: () => void;
  onTriggerVoice: () => void;
}

export const BottomWorkspaceControls: React.FC<BottomWorkspaceControlsProps> = ({
  activeModelId,
  handCount,
  explodeTarget,
  voiceListening,
  voiceNotice,
  onSelectModel,
  onToggleExplode,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleHologramMode,
  onTriggerVoice,
}) => {
  const viewportWidth = useViewportWidth();
  const [hintText, setHintText] = useState<string>('Raise your hand to begin');
  const [hintVisible, setHintVisible] = useState<boolean>(true);
  const [moreMenuOpen, setMoreMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const nextHint =
      handCount > 0
        ? 'Open hand: rotate · Pinch and slide up or down: zoom · Two hands apart: explode'
        : 'Raise your hand to begin';
    setHintText(nextHint);
    setHintVisible(true);
    const timer = window.setTimeout(() => {
      setHintVisible(false);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [handCount]);

  const isExploded = explodeTarget > 0.35;

  const renderActionButtons = () => (
    <>
      <button
        type="button"
        onClick={onToggleExplode}
        aria-label={isExploded ? 'Assemble model (E)' : 'Explode model (E)'}
        title={isExploded ? 'Assemble model (E)' : 'Explode model (E)'}
        data-testid="explode-button"
        className={`w-10 h-10 rounded-[12px] flex items-center justify-center border transition-colors cursor-pointer ${
          isExploded
            ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
            : 'glass-surface text-[var(--muted)] hover:text-[var(--text)]'
        }`}
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Zoom out (-)"
        title="Zoom out (-)"
        data-testid="zoom-out-button"
        className="w-10 h-10 rounded-[12px] glass-surface flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Zoom in (+)"
        title="Zoom in (+)"
        data-testid="zoom-in-button"
        className="w-10 h-10 rounded-[12px] glass-surface flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onResetView}
        aria-label="Reset view (R)"
        title="Reset view (R)"
        data-testid="reset-view-button"
        className="w-10 h-10 rounded-[12px] glass-surface flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onToggleHologramMode}
        aria-label="Hologram pyramid mode (M)"
        title="Hologram pyramid mode (M)"
        data-testid="hologram-mode-button"
        className="w-10 h-10 rounded-[12px] glass-surface flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
      >
        <Box className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onTriggerVoice}
        aria-label="Voice command (V)"
        title="Voice command (V)"
        data-testid="voice-mic-button"
        className={`relative w-10 h-10 rounded-[12px] flex items-center justify-center border transition-colors cursor-pointer ${
          voiceListening
            ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
            : 'glass-surface text-[var(--muted)] hover:text-[var(--text)]'
        }`}
      >
        {voiceListening ? (
          <>
            <Mic className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          </>
        ) : (
          <MicOff className="w-4 h-4" />
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Center column: hint line + voice notice + segmented model switcher + stacked controls on 640..899px */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none max-w-[calc(100vw-24px)]">
        {/* Voice toast notice when active */}
        {voiceNotice && (
          <div
            role="status"
            data-testid="voice-toast"
            className="glass-surface px-3 py-1.5 text-[12px] text-[var(--text)] flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <span>{voiceNotice}</span>
          </div>
        )}

        {/* Bottom-centre segmented model switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <nav
            aria-label="3D models"
            data-testid="model-switcher"
            className="glass-surface p-1 flex items-center gap-1 overflow-x-auto max-w-[calc(100vw-88px)]"
          >
            {SCIENCE_MODELS.map((model, idx) => {
              const active = model.id === activeModelId;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => onSelectModel(model.id)}
                  title={`${model.name} (Key ${idx + 1})`}
                  data-testid={`model-tab-${model.id}`}
                  className={`group relative px-3.5 h-8 rounded-[8px] text-[13px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[var(--accent)] text-[#0a0b0d]'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{model.shortName}</span>
                  <span
                    className={`ml-1.5 text-[11px] opacity-0 group-hover:opacity-80 transition-opacity ${
                      active ? 'text-[#0a0b0d]/80' : 'text-[var(--muted)]'
                    }`}
                  >
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* < 640px: "More" button beside switcher */}
          {viewportWidth < 640 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen((v) => !v)}
                aria-label="More controls"
                title="More controls"
                data-testid="more-controls-button"
                className="w-10 h-10 rounded-[12px] glass-surface flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {moreMenuOpen && (
                <div className="absolute bottom-12 right-0 glass-surface p-1.5 flex items-center gap-1.5">
                  {renderActionButtons()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 640px to <900px: action toolbar stacked cleanly below switcher */}
        {viewportWidth >= 640 && viewportWidth < 900 && (
          <div
            data-testid="action-toolbar"
            className="pointer-events-auto flex items-center gap-1.5"
          >
            {renderActionButtons()}
          </div>
        )}
      </div>

      {/* >= 900px: Bottom-right icon-only action toolbar */}
      {viewportWidth >= 900 && (
        <div
          data-testid="action-toolbar"
          className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5"
        >
          {renderActionButtons()}
        </div>
      )}
    </>
  );
};

interface FloatingPartCalloutAndCursorProps {
  inspectedPart: HoveredPartOverlay | null;
  pointerCursor: { x: number; y: number } | null;
  palmCursor: { x: number; y: number } | null;
  resetProgress: number;
}

export const FloatingPartCalloutAndCursor: React.FC<
  FloatingPartCalloutAndCursorProps
> = ({ inspectedPart, pointerCursor, palmCursor, resetProgress }) => {
  let cardX = 0;
  let cardY = 0;
  if (inspectedPart) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
    const offsetLeft = inspectedPart.screenX > vw * 0.62 ? -256 : 36;
    cardX = Math.max(16, Math.min(vw - 256, inspectedPart.screenX + offsetLeft));
    cardY = Math.max(68, Math.min(vh - 140, inspectedPart.screenY - 44));
  }

  const lineTargetX =
    inspectedPart && cardX < inspectedPart.screenX ? cardX + 240 : cardX;
  const lineTargetY = cardY + 24;

  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const normalizedReset = Math.max(0, Math.min(1, (resetProgress - 0.25) / 0.75));

  return (
    <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
      {/* Leader line + <=240px floating part callout */}
      {inspectedPart && (
        <>
          <svg className="fixed inset-0 w-full h-full pointer-events-none">
            <line
              x1={inspectedPart.screenX}
              y1={inspectedPart.screenY}
              x2={lineTargetX}
              y2={lineTargetY}
              stroke="rgba(125, 211, 252, 0.55)"
              strokeWidth="1.25"
            />
            <circle
              cx={inspectedPart.screenX}
              cy={inspectedPart.screenY}
              r="3.5"
              fill="#7dd3fc"
            />
          </svg>

          <div
            data-testid="part-callout"
            style={{
              transform: `translate3d(${Math.round(cardX)}px, ${Math.round(cardY)}px, 0)`,
            }}
            className="fixed top-0 left-0 w-[240px] max-w-[240px] glass-surface p-3"
          >
            <div className="text-[13px] font-semibold text-[var(--text)] leading-snug">
              {inspectedPart.part.name}
            </div>
            {inspectedPart.part.metric && (
              <div className="text-[11px] font-medium text-[var(--accent)] tabular-nums mt-0.5">
                {inspectedPart.part.metric}
              </div>
            )}
            <p className="text-[12px] leading-[1.4] text-[var(--muted)] mt-1">
              {inspectedPart.part.summary}
            </p>
          </div>
        </>
      )}

      {/* Index finger pointing cursor */}
      {pointerCursor && (
        <div
          style={{
            left: `${pointerCursor.x * 100}%`,
            top: `${pointerCursor.y * 100}%`,
          }}
          className="fixed -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-[var(--accent)] bg-[#7dd3fc]/20 flex items-center justify-center"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        </div>
      )}

      {/* Reset hold progress ring around palm cursor when holding open hand still */}
      {palmCursor && resetProgress > 0.25 && (
        <div
          data-testid="reset-progress-ring"
          style={{
            left: `${palmCursor.x * 100}%`,
            top: `${palmCursor.y * 100}%`,
          }}
          className="fixed -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
        >
          <svg width="44" height="44" className="-rotate-90">
            <circle
              cx="22"
              cy="22"
              r={ringRadius}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2.5"
            />
            <circle
              cx="22"
              cy="22"
              r={ringRadius}
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="2.5"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - normalizedReset)}
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[11px] text-[var(--text)] bg-[#0a0b0d]/85 px-2 py-0.5 rounded border border-[var(--border)]">
            Hold still to reset
          </span>
        </div>
      )}
    </div>
  );
};

interface HelpGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gestures and keyboard shortcuts"
      data-testid="help-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="glass-surface max-w-xl w-full p-5 space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--text)]">
            How to control Jarvis
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            data-testid="close-help-button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="text-[12px] font-medium text-[var(--muted)]">
            Hand gestures
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GESTURE_GUIDE_ITEMS.map((item) => (
              <div
                key={item.gesture}
                className="p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[var(--text)]">
                    {item.gesture}
                  </span>
                  <span className="text-[11px] text-[var(--accent)] shrink-0">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[12px] text-[var(--muted)] mt-1">
                  {item.howTo}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[12px] font-medium text-[var(--muted)]">
            Mouse, touch and keyboard
          </div>
          <p className="text-[12px] text-[var(--muted)]">
            Drag with left mouse button or one finger to rotate. Drag with right
            mouse button or Shift+drag to move. Use the scroll wheel to zoom, or
            click a part to inspect it.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[12px]">
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] flex justify-between">
              <span className="text-[var(--muted)]">Models</span>
              <span className="text-[var(--text)] font-medium">1 – 5</span>
            </div>
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] flex justify-between">
              <span className="text-[var(--muted)]">Explode</span>
              <span className="text-[var(--text)] font-medium">E</span>
            </div>
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] flex justify-between">
              <span className="text-[var(--muted)]">Reset</span>
              <span className="text-[var(--text)] font-medium">R</span>
            </div>
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] flex justify-between">
              <span className="text-[var(--muted)]">Hologram</span>
              <span className="text-[var(--text)] font-medium">M</span>
            </div>
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] flex justify-between">
              <span className="text-[var(--muted)]">Voice</span>
              <span className="text-[var(--text)] font-medium">V</span>
            </div>
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] flex justify-between">
              <span className="text-[var(--muted)]">Settings</span>
              <span className="text-[var(--text)] font-medium">,</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HologramModeOverlayProps {
  active: boolean;
}

export const HologramModeOverlay: React.FC<HologramModeOverlayProps> = ({
  active,
}) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowHint(false);
      return;
    }
    setShowHint(true);
    const timer = window.setTimeout(() => {
      setShowHint(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div
      aria-live="polite"
      data-testid="hologram-exit-hint"
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-3.5 py-1.5 rounded-[12px] bg-white/[0.08] text-[var(--text)] text-[12px] transition-opacity duration-500 ${
        showHint ? 'opacity-100' : 'opacity-0'
      }`}
    >
      Press Esc to exit
    </div>
  );
};

export const DeveloperSimulatorBar: React.FC<{
  simMode: SimulatorPoseMode;
  onChangeSimMode: (mode: SimulatorPoseMode) => void;
}> = ({ simMode, onChangeSimMode }) => {
  const options: { id: SimulatorPoseMode; label: string }[] = [
    { id: 'NONE', label: 'Off' },
    { id: 'OPEN_ROTATE', label: 'Rotate' },
    { id: 'PINCH_ZOOM', label: 'Pinch zoom' },
    { id: 'POINT_INSPECT', label: 'Point' },
    { id: 'TWO_HAND_EXPLODE', label: 'Explode' },
    { id: 'HOLD_RESET', label: 'Reset 2s' },
  ];

  return (
    <div
      data-testid="debug-simulator-bar"
      className="fixed top-16 left-4 z-30 glass-surface p-1.5 flex items-center gap-1"
    >
      <span className="text-[11px] text-[var(--muted)] px-2">Sim:</span>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChangeSimMode(opt.id)}
          data-testid={`debug-sim-${opt.id}`}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            simMode === opt.id
              ? 'bg-[var(--accent)] text-[#0a0b0d]'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
