import React, { useState } from 'react';
import { JarvisSettings } from '../config/constants';
import { CameraDeviceOption, SimulatorPoseMode } from './WebcamHandTracker';
import { RefreshCw, X } from 'lucide-react';

interface SettingsDrawerProps {
  open: boolean;
  settings: JarvisSettings;
  cameraDevices: CameraDeviceOption[];
  simMode: SimulatorPoseMode;
  wsConnected: boolean;
  fps: number;
  onUpdateSettings: (partial: Partial<JarvisSettings>) => void;
  onRetryCamera: () => void;
  onChangeSimMode: (mode: SimulatorPoseMode) => void;
  onToggleWsConnect: () => void;
  onRunTypedVoiceCommand: (text: string) => void;
  onClose: () => void;
}

const SHORTCUT_LIST: Array<{ keys: string; action: string }> = [
  { keys: '1 – 5', action: 'Switch model' },
  { keys: 'Arrow keys', action: 'Rotate model' },
  { keys: '+ / -', action: 'Zoom in / out' },
  { keys: 'E', action: 'Explode view' },
  { keys: 'R', action: 'Back to default' },
  { keys: 'M', action: 'Hologram mode' },
  { keys: '[ / ]', action: 'Pyramid size' },
  { keys: 'H', action: 'Camera preview' },
  { keys: 'S', action: 'Mute sound' },
  { keys: 'V', action: 'Voice push-to-talk' },
  { keys: 'F', action: 'Fullscreen' },
  { keys: ',', action: 'Settings' },
  { keys: '? or T', action: 'Help & gesture guide' },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  settings,
  cameraDevices,
  simMode,
  wsConnected,
  fps,
  onUpdateSettings,
  onRetryCamera,
  onChangeSimMode,
  onToggleWsConnect,
  onRunTypedVoiceCommand,
  onClose,
}) => {
  const [typedCmd, setTypedCmd] = useState('');

  if (!open) return null;

  const handleCmdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedCmd.trim()) return;
    onRunTypedVoiceCommand(typedCmd.trim());
    setTypedCmd('');
  };

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label="Settings"
      className="fixed top-16 right-4 bottom-20 z-30 w-[340px] max-w-[calc(100vw-2rem)] glass-surface flex flex-col overflow-hidden transition-transform duration-150 ease-out"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
        <h2 className="text-[16px] font-semibold text-[var(--text)]">Settings</h2>
        <button
          type="button"
          onClick={onClose}
          title="Close settings (Esc)"
          aria-label="Close settings"
          className="w-8 h-8 rounded-full hover:bg-[var(--raised)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-[14px]">
        {/* 1. Camera */}
        <section className="space-y-3">
          <h3 className="text-[12px] font-semibold text-[var(--muted)]">Camera</h3>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-camera-select" className="text-[14px] text-[var(--text)]">
                Device
              </label>
              <button
                type="button"
                onClick={onRetryCamera}
                className="px-2.5 py-1 rounded-full bg-[var(--raised)] hover:bg-white/15 border border-[var(--border)] text-[12px] font-medium text-[var(--text)] flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
            <select
              id="settings-camera-select"
              value={settings.cameraId}
              onChange={(e) => onUpdateSettings({ cameraId: e.target.value })}
              className="w-full px-3 py-1.5 rounded-[12px] bg-[#14161a] border border-[var(--border)] text-[14px] text-[var(--text)]"
            >
              <option value="">Default camera</option>
              {cameraDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[var(--text)]">Mirror preview</span>
            <input
              type="checkbox"
              checked={settings.mirrorPreview}
              onChange={(e) => onUpdateSettings({ mirrorPreview: e.target.checked })}
              className="w-4 h-4 accent-[#7dd3fc]"
            />
          </label>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-sensitivity" className="text-[var(--text)]">
                Hand sensitivity
              </label>
              <span className="text-[12px] text-[var(--muted)] tabular-nums">
                {settings.handSensitivity.toFixed(2)}×
              </span>
            </div>
            <input
              id="settings-sensitivity"
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={settings.handSensitivity}
              onChange={(e) => onUpdateSettings({ handSensitivity: Number(e.target.value) })}
              className="w-full accent-[#7dd3fc] cursor-pointer"
            />
          </div>
        </section>

        {/* 2. Voice */}
        <section className="space-y-3 pt-4 border-t border-[var(--border)]">
          <h3 className="text-[12px] font-semibold text-[var(--muted)]">Voice</h3>

          <div className="space-y-1">
            <span className="block text-[var(--text)]">Mode</span>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[12px] bg-[var(--surface)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => onUpdateSettings({ voiceMode: 'push-to-talk' })}
                className={`py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${
                  settings.voiceMode === 'push-to-talk'
                    ? 'bg-[var(--raised)] text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                Push-to-talk (V)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ voiceMode: 'hands-free' })}
                className={`py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${
                  settings.voiceMode === 'hands-free'
                    ? 'bg-[var(--raised)] text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                Hands-free
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="settings-voice-lang" className="text-[var(--text)]">
              Language
            </label>
            <select
              id="settings-voice-lang"
              value={settings.voiceLang}
              onChange={(e) =>
                onUpdateSettings({ voiceLang: e.target.value as 'en-IN' | 'hi-IN' })
              }
              className="px-2.5 py-1 rounded-[8px] bg-[#14161a] border border-[var(--border)] text-[12px] text-[var(--text)]"
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (India)</option>
            </select>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[var(--text)]">Spoken replies</span>
            <input
              type="checkbox"
              checked={settings.spokenReplies}
              onChange={(e) => onUpdateSettings({ spokenReplies: e.target.checked })}
              className="w-4 h-4 accent-[#7dd3fc]"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[var(--text)]">Presenter mode (6 hands)</span>
            <input
              type="checkbox"
              checked={settings.presenterMode}
              onChange={(e) => onUpdateSettings({ presenterMode: e.target.checked })}
              className="w-4 h-4 accent-[#7dd3fc]"
            />
          </label>

          <form onSubmit={handleCmdSubmit} className="flex items-center gap-1.5">
            <label htmlFor="settings-typed-command" className="sr-only">
              Type a command
            </label>
            <input
              id="settings-typed-command"
              type="text"
              value={typedCmd}
              onChange={(e) => setTypedCmd(e.target.value)}
              placeholder="Type a command (e.g. show heart)…"
              className="flex-1 px-3 py-1.5 rounded-[12px] bg-[#14161a] border border-[var(--border)] text-[12px] text-[var(--text)] placeholder:text-[var(--faint)]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-[12px] bg-[var(--raised)] hover:bg-white/15 border border-[var(--border)] text-[12px] font-medium text-[var(--text)]"
            >
              Run
            </button>
          </form>
        </section>

        {/* 3. Sound */}
        <section className="space-y-3 pt-4 border-t border-[var(--border)]">
          <h3 className="text-[12px] font-semibold text-[var(--muted)]">Sound</h3>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[var(--text)]">Mute sound (S)</span>
            <input
              type="checkbox"
              checked={settings.muted}
              onChange={(e) => onUpdateSettings({ muted: e.target.checked })}
              className="w-4 h-4 accent-[#7dd3fc]"
            />
          </label>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-volume" className="text-[var(--text)]">
                Volume
              </label>
              <span className="text-[12px] text-[var(--muted)] tabular-nums">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              id="settings-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => onUpdateSettings({ volume: Number(e.target.value) })}
              className="w-full accent-[#7dd3fc] cursor-pointer"
            />
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[var(--text)]">Ambient hum</span>
            <input
              type="checkbox"
              checked={settings.ambientHum}
              onChange={(e) => onUpdateSettings({ ambientHum: e.target.checked })}
              className="w-4 h-4 accent-[#7dd3fc]"
            />
          </label>
        </section>

        {/* 4. Hologram pyramid */}
        <section className="space-y-3 pt-4 border-t border-[var(--border)]">
          <h3 className="text-[12px] font-semibold text-[var(--muted)]">Hologram pyramid</h3>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-pyramid-size" className="text-[var(--text)]">
                Cell size ([ / ])
              </label>
              <span className="text-[12px] text-[var(--muted)] tabular-nums">
                {Math.round(settings.pyramidSize * 100)}%
              </span>
            </div>
            <input
              id="settings-pyramid-size"
              type="range"
              min={0.18}
              max={0.45}
              step={0.01}
              value={settings.pyramidSize}
              onChange={(e) => onUpdateSettings({ pyramidSize: Number(e.target.value) })}
              className="w-full accent-[#7dd3fc] cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-pyramid-gap" className="text-[var(--text)]">
                Distance from centre
              </label>
              <span className="text-[12px] text-[var(--muted)] tabular-nums">
                {settings.pyramidGap.toFixed(2)}×
              </span>
            </div>
            <input
              id="settings-pyramid-gap"
              type="range"
              min={0.6}
              max={1.3}
              step={0.02}
              value={settings.pyramidGap}
              onChange={(e) => onUpdateSettings({ pyramidGap: Number(e.target.value) })}
              className="w-full accent-[#7dd3fc] cursor-pointer"
            />
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[var(--text)]">Flip 180°</span>
            <input
              type="checkbox"
              checked={settings.pyramidFlip180}
              onChange={(e) => onUpdateSettings({ pyramidFlip180: e.target.checked })}
              className="w-4 h-4 accent-[#7dd3fc]"
            />
          </label>
        </section>

        {/* 5. Shortcuts list */}
        <section className="space-y-2 pt-4 border-t border-[var(--border)]">
          <h3 className="text-[12px] font-semibold text-[var(--muted)]">Shortcuts</h3>
          <div className="space-y-1.5 text-[12px]">
            {SHORTCUT_LIST.map((item) => (
              <div key={item.keys} className="flex items-center justify-between">
                <span className="text-[var(--muted)]">{item.action}</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] tabular-nums">
                  {item.keys}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Developer */}
        <section className="space-y-3 pt-4 border-t border-[var(--border)]">
          <h3 className="text-[12px] font-semibold text-[var(--muted)]">Developer</h3>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[var(--text)]">
              Show FPS {settings.showFps ? `(${fps} / ${settings.targetFps} FPS)` : ''}
            </span>
            <input
              type="checkbox"
              checked={settings.showFps}
              onChange={(e) => onUpdateSettings({ showFps: e.target.checked })}
              className="w-4 h-4 accent-[#7dd3fc]"
            />
          </label>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--text)]">Render pace</span>
            <div className="flex items-center gap-1.5">
              {([45, 60] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onUpdateSettings({ targetFps: rate })}
                  className={`px-2.5 py-1 rounded-[8px] text-[12px] font-medium border transition-colors ${
                    settings.targetFps === rate
                      ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {rate} FPS
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[var(--text)]">Live NASA &amp; ISS telemetry</span>
            <input
              type="checkbox"
              checked={settings.liveNasaData}
              onChange={(e) => onUpdateSettings({ liveNasaData: e.target.checked })}
              className="w-4 h-4 accent-[#7dd3fc]"
            />
          </label>

          <div className="space-y-1">
            <label htmlFor="settings-nasa-key" className="block text-[12px] text-[var(--muted)]">
              NASA Open API key (default: DEMO_KEY)
            </label>
            <input
              id="settings-nasa-key"
              type="text"
              value={settings.nasaApiKey}
              onChange={(e) => onUpdateSettings({ nasaApiKey: e.target.value })}
              placeholder="DEMO_KEY"
              className="w-full px-2.5 py-1.5 rounded-[8px] bg-[#14161a] border border-[var(--border)] text-[12px] text-[var(--text)]"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-[12px] text-[var(--muted)]">Simulator poses</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'NONE', label: 'Off' },
                { id: 'OPEN_ROTATE', label: 'Rotate' },
                { id: 'PINCH_ZOOM', label: 'Pinch' },
                { id: 'POINT_INSPECT', label: 'Point' },
                { id: 'TWO_HAND_EXPLODE', label: 'Explode' },
                { id: 'HOLD_RESET', label: 'Reset 2s' },
              ].map((pose) => (
                <button
                  key={pose.id}
                  type="button"
                  onClick={() => onChangeSimMode(pose.id as SimulatorPoseMode)}
                  className={`px-2 py-1.5 rounded-[8px] text-[12px] font-medium border transition-colors ${
                    simMode === pose.id
                      ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {pose.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label htmlFor="settings-ws-url" className="block text-[12px] text-[var(--muted)]">
              Remote bridge WebSocket
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="settings-ws-url"
                type="text"
                value={settings.wsUrl}
                onChange={(e) => onUpdateSettings({ wsUrl: e.target.value })}
                className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-[#14161a] border border-[var(--border)] text-[12px] text-[var(--text)]"
              />
              <button
                type="button"
                onClick={onToggleWsConnect}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium border transition-colors ${
                  wsConnected
                    ? 'bg-[var(--raised)] border-[var(--accent)] text-[var(--accent)]'
                    : 'bg-[var(--raised)] border-[var(--border)] text-[var(--text)]'
                }`}
              >
                {wsConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
};
