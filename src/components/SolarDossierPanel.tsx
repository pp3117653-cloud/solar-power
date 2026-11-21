import React, { useMemo, useState } from 'react';
import {
  JUDGE_QUIZ_QUESTIONS,
  PLANETARY_DOSSIERS,
  PlanetaryDossier,
} from '../data/planetaryDossiers';
import { soundEngine } from '../audio/soundEngine';

export type SolarVisualMode = 'standard' | 'cross-section' | 'infrared';

export interface SolarExhibitionState {
  selectedPlanetPartId: string;
  visualMode: SolarVisualMode;
  sizeScaleActive: boolean;
  timelineYear: number;
  timelineOpen: boolean;
  orbitalAudioActive: boolean;
  trajectoryOpen: boolean;
  quizOpen: boolean;
  tourActive: boolean;
  gravityWellActive: boolean;
  habitableZoneActive: boolean;
  rulerActive: boolean;
  lightPulseNonce: number;
  quizPunchNonce: number;
}

interface SolarDossierPanelProps {
  exhibition: SolarExhibitionState;
  onSelectPlanet: (partId: string) => void;
  onSetVisualMode: (mode: SolarVisualMode) => void;
  onToggleSizeScale: () => void;
  onChangeTimelineYear: (year: number) => void;
  onToggleOrbitalAudio: () => void;
  onToggleTrajectory: () => void;
  onToggleQuiz: () => void;
  onToggleTour: () => void;
  onToggleGravityWell: () => void;
  onToggleHabitableZone: () => void;
  onFireLightPulse: () => void;
  onToggleRuler: () => void;
}

const HOHMANN_MISSIONS: Array<{
  id: string;
  target: string;
  deltaVKmS: string;
  transitDays: string;
  windowNote: string;
}> = [
  { id: 'solar-venus', target: 'Earth → Venus', deltaVKmS: '6.0 km/s', transitDays: '~146 days', windowNote: 'Every 19 months' },
  { id: 'solar-mars', target: 'Earth → Mars', deltaVKmS: '5.6 km/s', transitDays: '~259 days', windowNote: 'Every 26 months' },
  { id: 'solar-jupiter', target: 'Earth → Jupiter', deltaVKmS: '14.4 km/s', transitDays: '~997 days', windowNote: 'Every 13 months' },
  { id: 'solar-saturn', target: 'Earth → Saturn', deltaVKmS: '15.7 km/s', transitDays: '~2,200 days', windowNote: 'Gravity-assist optimal' },
  { id: 'solar-pluto', target: 'Earth → Pluto', deltaVKmS: '16.2 km/s', transitDays: '~3,460 days', windowNote: 'New Horizons direct (9.5 yrs)' },
];

export const SolarDossierPanel: React.FC<SolarDossierPanelProps> = ({
  exhibition,
  onSelectPlanet,
  onSetVisualMode,
  onToggleSizeScale,
  onChangeTimelineYear,
  onToggleOrbitalAudio,
  onToggleTrajectory,
  onToggleQuiz,
  onToggleTour,
  onToggleGravityWell,
  onToggleHabitableZone,
  onFireLightPulse,
  onToggleRuler,
}) => {
  const [visitorWeightKg, setVisitorWeightKg] = useState<number>(60);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);

  const activeDossier: PlanetaryDossier = useMemo(() => {
    return (
      PLANETARY_DOSSIERS.find((p) => p.partId === exhibition.selectedPlanetPartId) ??
      PLANETARY_DOSSIERS[3] // Default Earth
    );
  }, [exhibition.selectedPlanetPartId]);

  const visitorWeightOnBody = useMemo(() => {
    return ((visitorWeightKg * activeDossier.gravityMs2) / 9.8).toFixed(1);
  }, [visitorWeightKg, activeDossier.gravityMs2]);

  const currentQuestion = JUDGE_QUIZ_QUESTIONS[quizIndex % JUDGE_QUIZ_QUESTIONS.length];

  // React to Fist-Punch gesture in Quiz Mode by auto-advancing / selecting option
  React.useEffect(() => {
    if (!exhibition.quizOpen || exhibition.quizPunchNonce === 0) return;
    if (quizSelected === null) {
      setQuizSelected(currentQuestion.correctIndex);
      setQuizScore((s) => s + 1);
    } else {
      setQuizSelected(null);
      setQuizIndex((i) => (i + 1) % JUDGE_QUIZ_QUESTIONS.length);
    }
  }, [exhibition.quizPunchNonce]);

  const handleToggleAudio = () => {
    const next = !exhibition.orbitalAudioActive;
    soundEngine.setOrbitalResonanceEnabled(
      next,
      PLANETARY_DOSSIERS.slice(0, 5).map((p) => p.harmonicHz)
    );
    onToggleOrbitalAudio();
  };

  return (
    <div className="space-y-4 text-[12px]">
      {/* Celestial Body Selector (Sun + 8 Planets + Pluto) */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">
          Celestial Bodies (Sun · 8 Planets · Pluto)
        </div>
        <div className="flex flex-wrap gap-1">
          {PLANETARY_DOSSIERS.map((body) => {
            const active = body.partId === activeDossier.partId;
            return (
              <button
                key={body.id}
                type="button"
                onClick={() => onSelectPlanet(body.partId)}
                className={`px-2 py-1 rounded-[8px] text-[11px] border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)] font-semibold'
                    : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {body.id === 'sun' ? 'Sun' : body.id === 'pluto' ? 'Pluto (9th)' : body.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Spectral / Structural View Mode */}
      <div className="grid grid-cols-3 gap-1">
        {(
          [
            { id: 'standard', label: 'Orbit' },
            { id: 'cross-section', label: '3D Core' },
            { id: 'infrared', label: 'JWST IR' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSetVisualMode(m.id)}
            className={`py-1.5 rounded-[8px] text-[11px] border transition-colors cursor-pointer ${
              exhibition.visualMode === m.id
                ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Active Planet Astrophysics Dossier */}
      <div className="p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[14px] font-semibold text-[var(--text)]">{activeDossier.name}</div>
            <div className="text-[11px] text-[var(--muted)]">{activeDossier.classification}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40 border border-white/10 text-[var(--accent)] tabular-nums">
            {activeDossier.distanceAu === 0 ? '0 AU (Center)' : `${activeDossier.distanceAu} AU`}
          </span>
        </div>

        <p className="text-[11.5px] text-[var(--muted)] leading-relaxed">{activeDossier.factSummary}</p>

        {/* Physical Telemetry Grid */}
        <div className="grid grid-cols-2 gap-1.5 tabular-nums text-[11px]">
          <div className="p-2 rounded-[8px] bg-black/30 border border-white/5">
            <div className="text-[var(--faint)] text-[10px]">Gravity / Temp</div>
            <div className="text-[var(--text)] font-medium">
              {activeDossier.gravityMs2} m/s² · {activeDossier.meanTempC} °C
            </div>
          </div>
          <div className="p-2 rounded-[8px] bg-black/30 border border-white/5">
            <div className="text-[var(--faint)] text-[10px]">Mass / Area</div>
            <div className="text-[var(--text)] font-medium truncate">{activeDossier.massKg}</div>
          </div>
          <div className="p-2 rounded-[8px] bg-black/30 border border-white/5">
            <div className="text-[var(--faint)] text-[10px]">Orbital Speed</div>
            <div className="text-[var(--text)] font-medium">
              {activeDossier.orbitalVelocityKmS} km/s · {activeDossier.inclinationDeg}°
            </div>
          </div>
          <div className="p-2 rounded-[8px] bg-black/30 border border-white/5">
            <div className="text-[var(--faint)] text-[10px]">Surface Area</div>
            <div className="text-[var(--text)] font-medium">{activeDossier.surfaceAreaKm2}</div>
          </div>
        </div>

        {/* Visitor Weight Calculator */}
        <div className="p-2.5 rounded-[10px] bg-black/35 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--muted)]">Your Earth Mass: {visitorWeightKg} kg</span>
            <span className="text-[var(--accent)] font-semibold tabular-nums">
              On {activeDossier.name}: {visitorWeightOnBody} kg
            </span>
          </div>
          <input
            type="range"
            min={25}
            max={130}
            value={visitorWeightKg}
            onChange={(e) => setVisitorWeightKg(Number(e.target.value))}
            aria-label="Visitor mass in kilograms"
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        {/* Elemental Composition Breakdown */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-[var(--muted)]">Elemental Composition</div>
          {activeDossier.elements.map((el) => (
            <div key={el.symbol} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text)]">
                  {el.element} <span className="text-[var(--faint)]">({el.symbol})</span>
                </span>
                <span className="tabular-nums font-medium text-[var(--text)]">{el.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, el.pct)}%`, backgroundColor: el.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Layered 3D Internal Cross-Section */}
        <div className="space-y-1.5 pt-1 border-t border-white/10">
          <div className="text-[11px] font-medium text-[var(--muted)]">Internal Cross-Section Layers</div>
          <div className="space-y-1">
            {activeDossier.internalLayers.map((layer) => (
              <div
                key={layer.name}
                className="flex items-center justify-between px-2 py-1 rounded bg-black/25 border border-white/5 text-[11px]"
              >
                <span className="flex items-center gap-1.5 text-[var(--text)]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layer.color }} />
                  {layer.name}
                </span>
                <span className="text-[10px] text-[var(--muted)]">{layer.tempOrNote}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Surface Topology Pins */}
        <div className="space-y-1.5 pt-1 border-t border-white/10">
          <div className="text-[11px] font-medium text-[var(--muted)]">Surface Topology Pins</div>
          <div className="space-y-1">
            {activeDossier.topologyPins.map((pin) => (
              <div key={pin.name} className="px-2 py-1.5 rounded bg-black/25 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#7dd3fc] font-medium">{pin.name}</span>
                  <span className="text-[10px] text-[var(--faint)] tabular-nums">
                    {pin.latDeg}°, {pin.lonDeg}°
                  </span>
                </div>
                <div className="text-[10.5px] text-[var(--muted)]">{pin.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exhibition Showstopper Modes */}
      <div className="p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
        <div className="text-[11px] font-semibold text-[var(--text)] uppercase tracking-wider">
          Exhibition Showstopper Modes
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onToggleSizeScale}
            className={`px-2 py-1.5 rounded-[8px] text-[11px] border cursor-pointer ${
              exhibition.sizeScaleActive
                ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Size Scale Lineup
          </button>
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`px-2 py-1.5 rounded-[8px] text-[11px] border cursor-pointer ${
              exhibition.orbitalAudioActive
                ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Orbital Audio {exhibition.orbitalAudioActive ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={onToggleTrajectory}
            className={`px-2 py-1.5 rounded-[8px] text-[11px] border cursor-pointer ${
              exhibition.trajectoryOpen
                ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Hohmann Planner
          </button>
          <button
            type="button"
            onClick={onToggleQuiz}
            className={`px-2 py-1.5 rounded-[8px] text-[11px] border cursor-pointer ${
              exhibition.quizOpen
                ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Judge Quiz Mode
          </button>
          <button
            type="button"
            onClick={onToggleTour}
            className={`px-2 py-1.5 rounded-[8px] text-[11px] border cursor-pointer ${
              exhibition.tourActive
                ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Guided Tour {exhibition.tourActive ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={onToggleGravityWell}
            className={`px-2 py-1.5 rounded-[8px] text-[11px] border cursor-pointer ${
              exhibition.gravityWellActive
                ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Gravity Well
          </button>
          <button
            type="button"
            onClick={onToggleHabitableZone}
            className={`px-2 py-1.5 rounded-[8px] text-[11px] border cursor-pointer ${
              exhibition.habitableZoneActive
                ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Goldilocks Zone
          </button>
          <button
            type="button"
            onClick={onFireLightPulse}
            className="px-2 py-1.5 rounded-[8px] text-[11px] border bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
          >
            Photon Pulse (c)
          </button>
          <button
            type="button"
            onClick={onToggleRuler}
            className={`col-span-2 px-2 py-1.5 rounded-[8px] text-[11px] border cursor-pointer ${
              exhibition.rulerActive
                ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-black/25 border-white/10 text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Laser Distance Ruler ({activeDossier.distanceAu} AU ≈ {(activeDossier.distanceAu * 149.6).toFixed(1)}M km)
          </button>
        </div>

        {/* Historical Alignment Timeline Slider */}
        <div className="pt-2 border-t border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--muted)]">Historical Alignment Timeline</span>
            <span className="text-[var(--accent)] font-semibold tabular-nums">Year {exhibition.timelineYear}</span>
          </div>
          <input
            type="range"
            min={1950}
            max={2100}
            value={exhibition.timelineYear}
            onChange={(e) => onChangeTimelineYear(Number(e.target.value))}
            aria-label="Historical planetary alignment year"
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        {/* Spacecraft Hohmann Transfer Planner */}
        {exhibition.trajectoryOpen && (
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="text-[11px] font-medium text-[#7dd3fc]">Hohmann Transfer Trajectories</div>
            {HOHMANN_MISSIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectPlanet(m.id)}
                className="w-full text-left px-2 py-1.5 rounded bg-black/30 border border-white/5 hover:border-[var(--accent)] cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text)] font-medium">{m.target}</span>
                  <span className="text-[var(--accent)] tabular-nums">{m.deltaVKmS}</span>
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  {m.transitDays} · {m.windowNote}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Judge Quiz Mode (Answerable via Tap or Fist-Punch Gesture) */}
        {exhibition.quizOpen && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#fbbf24] font-semibold">
                Judge Quiz ({quizIndex + 1}/{JUDGE_QUIZ_QUESTIONS.length})
              </span>
              <span className="text-[#22c55e] tabular-nums font-medium">Score: {quizScore}</span>
            </div>
            <div className="text-[11.5px] text-[var(--text)] font-medium">{currentQuestion.question}</div>
            <div className="space-y-1">
              {currentQuestion.options.map((opt, idx) => {
                const chosen = quizSelected === idx;
                const isCorrect = idx === currentQuestion.correctIndex;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (quizSelected === null) {
                        setQuizSelected(idx);
                        if (isCorrect) setQuizScore((s) => s + 1);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[8px] border text-[11px] cursor-pointer ${
                      quizSelected !== null && isCorrect
                        ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#bbf7d0]'
                        : chosen && !isCorrect
                          ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#fecaca]'
                          : 'bg-black/30 border-white/10 text-[var(--text)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {quizSelected !== null && (
              <div className="space-y-1.5">
                <div className="text-[10.5px] text-[var(--muted)]">{currentQuestion.explanation}</div>
                <button
                  type="button"
                  onClick={() => {
                    setQuizSelected(null);
                    setQuizIndex((i) => (i + 1) % JUDGE_QUIZ_QUESTIONS.length);
                  }}
                  className="w-full py-1.5 rounded-[8px] bg-[var(--accent)] text-[#0a0b0d] font-semibold text-[11px] cursor-pointer"
                >
                  Next Question (or Fist-Punch)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
