import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Layers,
  Microscope,
  Pause,
  Play,
  Search,
  SkipForward,
  Square,
  User,
  Volume2,
} from 'lucide-react';
import {
  AnatomyLayerKey,
  AnatomyScaleMode,
  HUMAN_ANATOMY_BOOK,
  STRUCTURAL_LEVELS,
  TOTAL_ANATOMY_STRUCTURES,
} from '../data/humanAnatomyBook';
import {
  HUMAN_BODY_NARRATION_CHAPTERS,
  TOTAL_NARRATION_SECONDS,
} from '../data/humanBodyNarration';
import {
  AnatomyMediaCategory,
  AnatomyMediaItem,
  computePhysiologicalTelemetry,
  fetchLiveAnatomyMedia,
  fetchLiveAnatomySummary,
  LiveAnatomySummary,
} from '../services/anatomyMediaService';
import { SCIENCE_MODELS, SubPartInfo } from '../config/constants';
import { OPEN_3D_ANATOMY_SOURCES, searchSketchfabAnatomyModels, SketchfabAnatomyModel } from '../services/openAnatomyApis';

export interface NarrationUiState {
  active: boolean;
  paused: boolean;
  chapterIndex: number;
  elapsedSec: number;
}

interface AnatomyAtlasPanelProps {
  selectedPartId: string | null;
  heartBpm: number;
  anatomyLayers: Record<AnatomyLayerKey, boolean>;
  anatomyScaleMode: AnatomyScaleMode;
  narrationState?: NarrationUiState;
  syncedMediaCategory?: AnatomyMediaCategory;
  onStartNarration?: () => void;
  onPauseResumeNarration?: () => void;
  onStopNarration?: () => void;
  onNextNarrationChapter?: () => void;
  onChangeHeartBpm: (bpm: number) => void;
  onToggleLayer: (key: AnatomyLayerKey) => void;
  onApplyLayerPreset: (preset: 'all' | 'organs' | 'skeleton' | 'neuro-vascular') => void;
  onChangeScaleMode: (mode: AnatomyScaleMode) => void;
  onSelectPart: (part: SubPartInfo) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const AnatomyAtlasPanel: React.FC<AnatomyAtlasPanelProps> = ({
  selectedPartId,
  heartBpm,
  anatomyLayers,
  anatomyScaleMode,
  narrationState,
  syncedMediaCategory,
  onStartNarration,
  onPauseResumeNarration,
  onStopNarration,
  onNextNarrationChapter,
  onChangeHeartBpm,
  onToggleLayer,
  onApplyLayerPreset,
  onChangeScaleMode,
  onSelectPart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLevels, setShowLevels] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'chapter-cell-tissues': true,
    'sys-cardiovascular': true,
  });

  // Real-time Wikimedia Commons images/videos + Wikipedia live data
  const [mediaCategory, setMediaCategory] = useState<AnatomyMediaCategory>('body');
  const [mediaItems, setMediaItems] = useState<AnatomyMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);
  const [wikiSummary, setWikiSummary] = useState<LiveAnatomySummary | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');
  const [sketchfabModels, setSketchfabModels] = useState<SketchfabAnatomyModel[]>([]);
  const [sketchfabQuery, setSketchfabQuery] = useState<string>('human anatomy heart');
  const [activeSketchfabEmbed, setActiveSketchfabEmbed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchSketchfabAnatomyModels(sketchfabQuery, 4).then((models) => {
      if (!cancelled) setSketchfabModels(models);
    });
    return () => { cancelled = true; };
  }, [sketchfabQuery]);

  useEffect(() => {
    if (syncedMediaCategory) {
      setMediaCategory(syncedMediaCategory);
    }
  }, [syncedMediaCategory]);

  useEffect(() => {
    let cancelled = false;
    setMediaLoading(true);
    Promise.all([
      fetchLiveAnatomyMedia(mediaCategory, 6),
      fetchLiveAnatomySummary(mediaCategory),
    ]).then(([items, summary]) => {
      if (!cancelled) {
        setMediaItems(items);
        setWikiSummary(summary);
        setMediaLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mediaCategory]);

  const physio = useMemo(() => computePhysiologicalTelemetry(heartBpm), [heartBpm]);
  const humanModel = SCIENCE_MODELS.find((m) => m.id === 'human-body');
  const partMap = useMemo(() => {
    const map = new Map<string, SubPartInfo>();
    humanModel?.parts.forEach((p) => map.set(p.id, p));
    return map;
  }, [humanModel]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredChapters = useMemo(() => {
    if (!normalizedQuery) return HUMAN_ANATOMY_BOOK;
    return HUMAN_ANATOMY_BOOK.map((ch) => {
      const chapterMatches =
        ch.name.toLowerCase().includes(normalizedQuery) ||
        ch.summary.toLowerCase().includes(normalizedQuery) ||
        ch.keyMetric.toLowerCase().includes(normalizedQuery);
      const matchedStructures = ch.structures.filter(
        (s) =>
          s.name.toLowerCase().includes(normalizedQuery) ||
          (s.latinOrAlt && s.latinOrAlt.toLowerCase().includes(normalizedQuery)) ||
          s.region.toLowerCase().includes(normalizedQuery) ||
          s.summary.toLowerCase().includes(normalizedQuery)
      );
      if (chapterMatches) return ch;
      if (matchedStructures.length > 0) {
        return { ...ch, structures: matchedStructures };
      }
      return null;
    }).filter((c): c is NonNullable<typeof c> => c !== null);
  }, [normalizedQuery]);

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentNarrChapter =
    narrationState && narrationState.active
      ? HUMAN_BODY_NARRATION_CHAPTERS[narrationState.chapterIndex]
      : null;

  return (
    <div className="space-y-4 text-[12px]">
      {/* 3–5 Minute Guided Voice Explanation Card */}
      <div className="p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--accent)]/40 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-[var(--text)] flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[var(--accent)]" />
            Guided Voice Tour (Cell → Body)
          </span>
          <span className="text-[10.5px] text-[var(--accent)] tabular-nums">
            {narrationState?.active
              ? `${formatTime(narrationState.elapsedSec)} / ${formatTime(TOTAL_NARRATION_SECONDS)}`
              : `~4 min (14 Chapters)`}
          </span>
        </div>

        <p className="text-[11px] text-[var(--muted)] leading-snug">
          Say <strong className="text-[var(--text)]">“Continue explaining the human body”</strong> or press Start for a complete 4-minute synchronized 3D narration.
        </p>

        {!narrationState?.active ? (
          <button
            type="button"
            onClick={onStartNarration}
            className="w-full h-8 rounded-[8px] bg-[var(--accent)] text-[#0a0b0d] font-semibold text-[11.5px] flex items-center justify-center gap-1.5 hover:opacity-90 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Continue Explaining Human Body (~4 min)
          </button>
        ) : (
          <div className="space-y-2">
            {currentNarrChapter && (
              <div className="p-2 rounded-[8px] bg-black/35 border border-white/10">
                <div className="text-[11px] font-semibold text-[var(--accent)]">
                  Ch. {narrationState.chapterIndex + 1}/{HUMAN_BODY_NARRATION_CHAPTERS.length} · {currentNarrChapter.title}
                </div>
                <p className="text-[10.5px] text-[var(--text)] mt-1 leading-snug line-clamp-3">
                  {currentNarrChapter.speechText}
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={onPauseResumeNarration}
                className="h-7 rounded-[8px] bg-black/40 border border-white/15 text-[11px] text-[var(--text)] flex items-center justify-center gap-1 cursor-pointer"
              >
                {narrationState.paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {narrationState.paused ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={onNextNarrationChapter}
                className="h-7 rounded-[8px] bg-black/40 border border-white/15 text-[11px] text-[var(--text)] flex items-center justify-center gap-1 cursor-pointer"
              >
                <SkipForward className="w-3 h-3" />
                Next
              </button>
              <button
                type="button"
                onClick={onStopNarration}
                className="h-7 rounded-[8px] bg-rose-500/20 border border-rose-500/40 text-[11px] text-rose-300 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Physiological Telemetry + Heart Rate BPM */}
      <div className="p-2.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-[var(--text)] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#ef4444]" />
            Live Human Physiology (OpenStax)
          </span>
          <span className="text-[11.5px] font-semibold text-[#ef4444] tabular-nums">
            {heartBpm} BPM
          </span>
        </div>
        <input
          type="range"
          min={40}
          max={180}
          step={1}
          value={heartBpm}
          onChange={(e) => onChangeHeartBpm(Number(e.target.value))}
          aria-label="Heart rate BPM"
          className="w-full accent-[#ef4444] cursor-pointer"
        />
        <div className="grid grid-cols-2 gap-1.5 text-[10.5px] tabular-nums">
          <div className="p-1.5 rounded-[8px] bg-black/30 border border-white/5">
            <div className="text-[var(--muted)]">Cardiac Output</div>
            <div className="text-[var(--text)] font-semibold">{physio.cardiacOutputLMin} L/min</div>
          </div>
          <div className="p-1.5 rounded-[8px] bg-black/30 border border-white/5">
            <div className="text-[var(--muted)]">Stroke Volume · EF</div>
            <div className="text-[var(--text)] font-semibold">{physio.strokeVolumeMl} mL · {physio.ejectionFractionPct}%</div>
          </div>
          <div className="p-1.5 rounded-[8px] bg-black/30 border border-white/5">
            <div className="text-[var(--muted)]">Blood Pressure</div>
            <div className="text-[var(--text)] font-semibold">{physio.bloodPressure}</div>
          </div>
          <div className="p-1.5 rounded-[8px] bg-black/30 border border-white/5">
            <div className="text-[var(--muted)]">Kidney GFR · RBF</div>
            <div className="text-[var(--text)] font-semibold">{physio.gfrMlMin} · {physio.renalBloodFlowMlMin} mL/m</div>
          </div>
        </div>
      </div>

      {/* Real-Time Human Body Images, Playable Videos & Live Wikipedia Data */}
      <div className="p-2.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-[var(--text)] flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[var(--accent)]" />
            Real-Time Anatomy Images &amp; Videos
          </span>
          <span className="text-[10px] text-[#22c55e]">
            {wikiSummary?.live ? 'Live Wikimedia' : 'Ref'}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {(
            [
              { id: 'cell', label: 'Cell' },
              { id: 'body', label: 'Body' },
              { id: 'skeleton', label: 'Skeleton' },
              { id: 'brain', label: 'Brain' },
              { id: 'heart', label: 'Heart' },
              { id: 'lungs', label: 'Lungs' },
              { id: 'digestive', label: 'Digestive' },
              { id: 'videos', label: '▶ Videos' },
            ] as const
          ).map((cat) => (
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

        {wikiSummary && wikiSummary.extract && (
          <div className="p-2 rounded-[8px] bg-black/30 border border-white/5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[11px] text-[var(--text)]">{wikiSummary.title}</span>
              <a
                href={wikiSummary.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[var(--accent)] hover:underline inline-flex items-center gap-0.5"
              >
                Wiki <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <p className="text-[10.5px] text-[var(--muted)] leading-snug line-clamp-3">
              {wikiSummary.extract}
            </p>
          </div>
        )}

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
              className="w-full rounded-[8px] bg-black border border-white/10 max-h-44"
            />
          </div>
        )}

        {mediaLoading ? (
          <div className="text-[11px] text-[var(--muted)] py-1.5">Streaming real-time anatomy media…</div>
        ) : mediaItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
            {mediaItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.mediaType === 'video') {
                    setActiveVideoTitle(item.title);
                    setActiveVideoUrl(item.fullUrl);
                  } else {
                    window.open(item.sourcePageUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="group rounded-[8px] overflow-hidden border border-white/10 bg-black/40 text-left cursor-pointer"
                title={item.title}
              >
                {item.mediaType === 'video' ? (
                  <div className="w-full h-16 bg-slate-900 flex items-center justify-center text-[var(--accent)] text-[11px] font-semibold">
                    ▶ Play Medical Video
                  </div>
                ) : (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-16 object-cover bg-white/90 group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                )}
                <div className="p-1.5 text-[10px] leading-tight text-[var(--text)] line-clamp-2">
                  {item.title}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[10.5px] text-[var(--faint)]">
            Connect online to stream live Wikimedia Commons anatomical plates and videos.
          </div>
        )}
      </div>

      {/* Open 3D Anatomy & Blender Photorealistic Pipeline Hub */}
      <div className="p-2.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-[var(--text)]">
            Photorealistic 3D Anatomy APIs &amp; Blender Hub
          </span>
          <span className="text-[10px] text-[var(--accent)]">CC-Licensed</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {['human anatomy heart', 'human skeleton', 'human brain', 'human organs'].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => { setActiveSketchfabEmbed(null); setSketchfabQuery(q); }}
              className={`px-2 py-0.5 rounded-full text-[10px] border cursor-pointer ${
                sketchfabQuery === q ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]' : 'bg-black/25 border-white/10 text-[var(--muted)]'
              }`}
            >
              {q.replace('human ', '')}
            </button>
          ))}
        </div>
        {activeSketchfabEmbed && (
          <div className="space-y-1">
            <div className="flex justify-end">
              <button type="button" onClick={() => setActiveSketchfabEmbed(null)} className="text-[10px] text-[var(--accent)] cursor-pointer">Close 3D Viewer</button>
            </div>
            <iframe
              src={activeSketchfabEmbed}
              title="Sketchfab 3D Anatomy Model"
              allow="autoplay; fullscreen; xr-spatial-tracking"
              className="w-full h-44 rounded-[8px] border border-white/10 bg-black"
            />
          </div>
        )}
        {sketchfabModels.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {sketchfabModels.map((m) => (
              <button
                key={m.uid}
                type="button"
                onClick={() => setActiveSketchfabEmbed(m.embedUrl)}
                className="rounded-[8px] overflow-hidden border border-white/10 bg-black/40 text-left cursor-pointer hover:border-[var(--accent)]"
              >
                {m.thumbnailUrl && <img src={m.thumbnailUrl} alt={m.name} className="w-full h-14 object-cover" loading="lazy" />}
                <div className="p-1.5">
                  <div className="text-[10px] font-medium text-[var(--text)] truncate">{m.name}</div>
                  <div className="text-[9.5px] text-[var(--muted)] truncate">{m.licenseLabel}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="space-y-1 pt-1 border-t border-white/10 max-h-36 overflow-y-auto pr-0.5">
          {OPEN_3D_ANATOMY_SOURCES.map((src) => (
            <a
              key={src.id}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-1.5 rounded-[8px] bg-black/30 border border-white/5 hover:border-[var(--accent)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-semibold text-[var(--text)]">{src.name}</span>
                <span className="text-[9.5px] text-[var(--accent)] shrink-0">{src.license}</span>
              </div>
              <div className="text-[9.5px] text-[var(--muted)]">{src.formats} · {src.provider}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Scale Switcher: Complete Human Body vs. Microscopic Eukaryotic Cell */}
      <div className="p-2.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-[var(--text)] flex items-center gap-1.5">
            <Microscope className="w-3.5 h-3.5 text-[var(--accent)]" />
            Structural Scale View
          </span>
          <span className="text-[10.5px] text-[var(--muted)]">Cell → Organism</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeScaleMode('organism')}
            className={`h-8 rounded-[8px] px-2 text-[11.5px] font-medium flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
              anatomyScaleMode === 'organism'
                ? 'bg-[var(--accent)] text-[#0a0b0d] border-[var(--accent)]'
                : 'bg-black/30 text-[var(--muted)] border-white/10 hover:text-[var(--text)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Human Body
          </button>
          <button
            type="button"
            onClick={() => onChangeScaleMode('cell')}
            className={`h-8 rounded-[8px] px-2 text-[11.5px] font-medium flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
              anatomyScaleMode === 'cell'
                ? 'bg-[var(--accent)] text-[#0a0b0d] border-[var(--accent)]'
                : 'bg-black/30 text-[var(--muted)] border-white/10 hover:text-[var(--text)]'
            }`}
          >
            <Microscope className="w-3.5 h-3.5" />
            Eukaryotic Cell
          </button>
        </div>
      </div>

      {/* 3D System Layer Visibility Controls */}
      <div className="p-2.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-[var(--text)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
            3D Anatomical Layers (11 Systems + Cell)
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              { id: 'all', label: 'All Layers' },
              { id: 'organs', label: 'Internal Organs' },
              { id: 'skeleton', label: 'Skeleton' },
              { id: 'neuro-vascular', label: 'Neuro-Vascular' },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyLayerPreset(preset.id)}
              className="px-2 py-0.5 rounded-full text-[10.5px] bg-black/35 border border-white/10 text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1 pt-0.5">
          {HUMAN_ANATOMY_BOOK.map((ch) => {
            const visible = anatomyLayers[ch.layerKey];
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onToggleLayer(ch.layerKey)}
                className={`flex items-center justify-between px-2 py-1 rounded-[8px] border text-[11px] transition-colors cursor-pointer ${
                  visible
                    ? 'bg-black/35 border-white/15 text-[var(--text)]'
                    : 'bg-black/15 border-white/5 text-[var(--faint)]'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: visible ? ch.accentColor : '#475569' }}
                  />
                  <span className="truncate">{ch.shortName}</span>
                </span>
                {visible ? (
                  <Eye className="w-3 h-3 shrink-0 text-[var(--accent)]" />
                ) : (
                  <EyeOff className="w-3 h-3 shrink-0 text-[var(--faint)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 Levels of Structural Organization */}
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLevels((v) => !v)}
          className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white/[0.03] cursor-pointer"
        >
          <span className="text-[11.5px] font-semibold text-[var(--text)] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
            6 Levels of Structural Organization
          </span>
          {showLevels ? (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)]" />
          )}
        </button>
        {showLevels && (
          <div className="px-3 pb-3 space-y-2 border-t border-[var(--border)] pt-2">
            {STRUCTURAL_LEVELS.map((lvl) => (
              <div
                key={lvl.id}
                className="p-2 rounded-[8px] bg-black/30 border border-white/5 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text)] text-[11.5px]">
                    {lvl.name}
                  </span>
                  <span className="text-[10px] text-[var(--accent)] shrink-0">
                    {lvl.scaleRange}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-snug">
                  {lvl.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Searchable Anatomy Book Taxonomy */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[var(--text)]">
            Complete Anatomy Atlas ({TOTAL_ANATOMY_STRUCTURES} Entries)
          </span>
          <span className="text-[10.5px] text-[var(--muted)]">OpenStax A&amp;P 2e</span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cell, bone, nerve, heart, lobe…"
            aria-label="Search human anatomy structures"
            className="w-full h-8 pl-8 pr-3 rounded-[10px] bg-black/40 border border-[var(--border)] text-[12px] text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="space-y-2">
          {filteredChapters.map((ch) => {
            const isOpen = normalizedQuery.length > 0 || Boolean(expandedChapters[ch.id]);
            return (
              <div
                key={ch.id}
                className="rounded-[12px] bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleChapter(ch.id)}
                  className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-white/[0.03] cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: ch.accentColor }}
                      />
                      <span className="font-semibold text-[12px] text-[var(--text)] truncate">
                        {ch.name}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-[var(--muted)] mt-0.5 truncate">
                      {ch.chapterCode} · {ch.keyMetric}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-2.5 pb-2.5 pt-1.5 border-t border-[var(--border)] space-y-1.5">
                    <div className="space-y-1">
                      {ch.structures.map((st) => {
                        const isSelected = selectedPartId === st.part3dId;
                        const target3d = partMap.get(st.part3dId);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              if (ch.layerKey === 'cell') onChangeScaleMode('cell');
                              else if (anatomyScaleMode === 'cell') onChangeScaleMode('organism');
                              if (target3d) onSelectPart(target3d);
                            }}
                            className={`w-full text-left p-2 rounded-[8px] border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--raised)] border-[var(--accent)]'
                                : 'bg-black/30 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-[11.5px] text-[var(--text)] leading-tight">
                                {st.name}
                              </span>
                              {st.countOrMetric && (
                                <span className="text-[10px] text-[var(--accent)] shrink-0 tabular-nums">
                                  {st.countOrMetric}
                                </span>
                              )}
                            </div>
                            {st.latinOrAlt && (
                              <div className="text-[10px] text-[#94a3b8] mt-0.5">
                                {st.latinOrAlt}
                              </div>
                            )}
                            <p className="text-[10.5px] text-[var(--muted)] mt-1 leading-snug">
                              {st.summary}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <a
                      href={ch.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-1 pt-1 text-[10.5px] text-[var(--accent)] hover:underline"
                    >
                      <span>Source: {ch.sourceTitle}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
