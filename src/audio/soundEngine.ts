/**
 * ============================================================================
 * JARVIS — PROCEDURAL WEB AUDIO SYNTHESIZER & SPEECH ENGINE
 * ============================================================================
 */

class JarvisSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private isMuted = false;
  private volume = 0.6;
  private ambientEnabled = false;
  private spokenRepliesEnabled = false;

  private ambientOsc: OscillatorNode | null = null;
  private ambientSubOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private lastHeartbeatMs = 0;

  // 4.4: Self-hearing guard state
  private lastSpeechEndMs = 0;
  private lastSpokenReply = '';
  private unlockListenersBound = false;

  constructor() {
    this.bindFirstInteractionUnlock();
  }

  private bindFirstInteractionUnlock(): void {
    if (this.unlockListenersBound || typeof window === 'undefined') return;
    this.unlockListenersBound = true;

    const unlock = () => {
      this.unlockAudio();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  public unlockAudio(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (this.ambientEnabled && !this.isMuted) {
      this.startAmbientHum();
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.isMuted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getOutputNode(): AudioNode | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    return this.masterGain ?? ctx.destination;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.08
      );
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(
        muted || !this.ambientEnabled ? 0 : 0.018,
        this.ctx.currentTime,
        0.12
      );
    }
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.min(1, Math.max(0, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime,
        0.08
      );
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setAmbientHumEnabled(enabled: boolean): void {
    this.ambientEnabled = enabled;
    if (enabled && !this.isMuted) {
      this.startAmbientHum();
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(
        enabled && !this.isMuted ? 0.018 : 0,
        this.ctx.currentTime,
        0.15
      );
    }
  }

  public setSpokenRepliesEnabled(enabled: boolean): void {
    this.spokenRepliesEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private resonanceOscs: OscillatorNode[] = [];
  private resonanceGain: GainNode | null = null;
  private resonanceActive = false;

  public setOrbitalResonanceEnabled(enabled: boolean, frequencies: number[] = [126.22, 194.18, 221.23, 282.54]): void {
    this.resonanceActive = enabled;
    const ctx = this.ensureContext();
    const out = this.getOutputNode();
    this.resonanceOscs.forEach((o) => { try { o.stop(); o.disconnect(); } catch {} });
    this.resonanceOscs = [];
    if (this.resonanceGain) { try { this.resonanceGain.disconnect(); } catch {} this.resonanceGain = null; }
    if (!enabled || !ctx || !out || this.isMuted) return;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.035, ctx.currentTime);
    g.connect(out);
    this.resonanceGain = g;

    frequencies.slice(0, 5).forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const individualGain = ctx.createGain();
      individualGain.gain.setValueAtTime(0.18 / (idx + 1), ctx.currentTime);
      osc.connect(individualGain);
      individualGain.connect(g);
      osc.start();
      this.resonanceOscs.push(osc);
    });
  }

  public isOrbitalResonanceEnabled(): boolean {
    return this.resonanceActive;
  }

  public startAmbientHum(): void {
    if (!this.ambientEnabled || this.isMuted) return;
    const ctx = this.ensureContext();
    const out = this.getOutputNode();
    if (!ctx || !out) return;

    if (this.ambientOsc && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(0.018, ctx.currentTime, 0.15);
      return;
    }

    try {
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(58, ctx.currentTime);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(116, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(135, ctx.currentTime);

      gain.gain.setValueAtTime(0.018, ctx.currentTime);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gain);
      gain.connect(out);

      osc.start();
      subOsc.start();
      this.ambientOsc = osc;
      this.ambientSubOsc = subOsc;
      this.ambientGain = gain;
    } catch {
      // Ignore autoplay restriction errors before user interaction
    }
  }

  public playHandDetectedWow(): void {
    const ctx = this.ensureContext();
    const out = this.getOutputNode();
    if (!ctx || !out) return;

    const now = ctx.currentTime;
    const freqs = [220, 329.63, 440, 659.25];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f * 0.9, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(f, now + idx * 0.04 + 0.22);

      // Peak <= 0.04
      const peak = Math.min(0.032, 0.032 / (idx * 0.35 + 1));
      gain.gain.setValueAtTime(0.0001, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(peak, now + idx * 0.04 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.42);

      osc.connect(gain);
      gain.connect(out);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.45);
    });
  }

  public playPinchClick(): void {
    const ctx = this.ensureContext();
    const out = this.getOutputNode();
    if (!ctx || !out) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1320, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.05);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playSwipeWhoosh(direction: 'next' | 'prev' = 'next'): void {
    const ctx = this.ensureContext();
    const out = this.getOutputNode();
    if (!ctx || !out) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const startFreq = direction === 'next' ? 180 : 520;
    const endFreq = direction === 'next' ? 580 : 170;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.24);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(1100, now + 0.14);
    filter.Q.setValueAtTime(2.4, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.036, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playExplodeTone(): void {
    const ctx = this.ensureContext();
    const out = this.getOutputNode();
    if (!ctx || !out) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.36);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playAssembleTone(): void {
    const ctx = this.ensureContext();
    const out = this.getOutputNode();
    if (!ctx || !out) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(230, now + 0.32);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.034, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * 6.3: Plays only while heart model is active, sound is on, and tab is visible.
   */
  public playHeartbeatLubDub(nowMs: number, bpm = 72): void {
    if (this.isMuted || (typeof document !== 'undefined' && document.hidden)) return;
    const intervalMs = (60 / Math.max(40, Math.min(180, bpm))) * 1000;
    if (nowMs - this.lastHeartbeatMs < intervalMs) return;
    this.lastHeartbeatMs = nowMs;

    const ctx = this.ensureContext();
    const out = this.getOutputNode();
    if (!ctx || !out) return;

    const now = ctx.currentTime;
    const pulses = [
      { delay: 0, freq: 58, dur: 0.085, amp: 0.038 },
      { delay: 0.17, freq: 48, dur: 0.075, amp: 0.028 },
    ];

    pulses.forEach((p) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq * 1.25, now + p.delay);
      osc.frequency.exponentialRampToValueAtTime(p.freq, now + p.delay + p.dur);

      gain.gain.setValueAtTime(0.0001, now + p.delay);
      gain.gain.exponentialRampToValueAtTime(p.amp, now + p.delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.delay + p.dur);

      osc.connect(gain);
      gain.connect(out);
      osc.start(now + p.delay);
      osc.stop(now + p.delay + p.dur + 0.02);
    });
  }

  /**
   * 4.4 & 6.4: Speaks only if spokenRepliesEnabled is true and not muted.
   */
  public speakJarvis(text: string): void {
    this.lastSpokenReply = text.trim().toLowerCase();
    if (
      !this.spokenRepliesEnabled ||
      this.isMuted ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.04;
      utterance.pitch = 0.98;
      utterance.volume = Math.min(1, this.volume);
      utterance.onend = () => {
        this.lastSpeechEndMs = performance.now();
      };
      utterance.onerror = () => {
        this.lastSpeechEndMs = performance.now();
      };
      this.lastSpeechEndMs = performance.now();
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors on headless browsers
    }
  }

  /**
   * 4.4: Self-hearing guard check
   */
  public shouldIgnoreSpeechTranscript(transcript: string): boolean {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        this.lastSpeechEndMs = performance.now();
        return true;
      }
      if (
        this.lastSpeechEndMs > 0 &&
        performance.now() - this.lastSpeechEndMs < 1200
      ) {
        return true;
      }
    }
    const cleanT = transcript.trim().toLowerCase();
    if (cleanT && this.lastSpokenReply && this.lastSpokenReply.includes(cleanT)) {
      return true;
    }
    return false;
  }
}

export const soundEngine = new JarvisSoundEngine();
