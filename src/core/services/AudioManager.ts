type SoundKey =
  | 'move'
  | 'correct'
  | 'error'
  | 'victory'
  | 'tick'
  | 'fanfare'
  | 'hover'
  | 'click'
  | 'defeat'
  | 'timeout'
  | 'round_start'
  | 'start';

class AudioManager {
  private sounds: Partial<Record<SoundKey, HTMLAudioElement>> = {};
  private globalVolume: number = 0.8;
  private ctx: AudioContext | null = null;

  // Normalized base volumes
  private baseVolumes: Record<SoundKey, number> = {
    move: 0.5,
    correct: 0.75,
    error: 0.65,
    victory: 0.85,
    tick: 0.4,
    fanfare: 0.7,
    hover: 0.15,
    click: 0.3,
    defeat: 0.75,
    timeout: 0.75,
    round_start: 0.75,
    start: 0.8,
  };

  // Map key → file path
  private filePaths: Record<SoundKey, string> = {
    move: '/sounds/move_new.mp3',
    correct: '/sounds/correct.mp3',
    error: '/sounds/error_new.ogg',
    victory: '/sounds/victory_new.mp3',
    tick: '/sounds/tick.mp3',
    fanfare: '/sounds/fanfare.mp3',
    hover: '/sounds/hover.ogg',
    click: '/sounds/click.ogg',
    defeat: '/sounds/defeat.ogg',
    timeout: '/sounds/timeout.ogg',
    round_start: '/sounds/round_start.mp3',
    start: '/sounds/round_start.mp3', // alias
  };

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    (Object.keys(this.filePaths) as SoundKey[]).forEach((key) => {
      const audio = new Audio(this.filePaths[key]);
      audio.preload = 'auto';
      audio.volume = this.baseVolumes[key] * this.globalVolume;
      this.sounds[key] = audio;
    });
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  // ─── Synthesized sounds via Web Audio API ────────────────────────────────

  /** 21 – Tournament start: rising fanfare chord */
  public synth_start() {
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      const freqs = [261.63, 329.63, 392.0, 523.25]; // C4 E4 G4 C5
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.1);
        gain.gain.setValueAtTime(0, t + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.22 * this.globalVolume, t + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.1);
        osc.stop(t + i * 0.1 + 0.7);
      });
    } catch (_) {}
  }

  /** 22 – Correct answer: bright ascending ding */
  public synth_correct() {
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      [[523.25, 0], [659.25, 0.12], [783.99, 0.24]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + delay);
        gain.gain.setValueAtTime(0.28 * this.globalVolume, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.45);
      });
    } catch (_) {}
  }

  /** 23 – Error: Soft dull thud instead of harsh buzzer */
  public synth_error() {
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(250, t + 0.15);
      gain.gain.setValueAtTime(0.35 * this.globalVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    } catch (_) {}
  }

  /** 24 – Tick (last 10 seconds): Soft pop instead of sharp click */
  public synth_tick() {
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      gain.gain.setValueAtTime(0.2 * this.globalVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch (_) {}
  }

  /** 25 – Victory: triumphant ascending chord burst */
  public synth_victory() {
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      const melody = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      melody.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === melody.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t + i * 0.09);
        gain.gain.setValueAtTime(0, t + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.25 * this.globalVolume, t + i * 0.09 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.09);
        osc.stop(t + i * 0.09 + 0.9);
      });
    } catch (_) {}
  }

  /** 26 – Move: soft dry click */
  public synth_move() {
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.05);
      gain.gain.setValueAtTime(0.5 * this.globalVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch (_) {}
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  public setVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    Object.keys(this.sounds).forEach((key) => {
      const k = key as SoundKey;
      if (this.sounds[k]) {
        this.sounds[k]!.volume = this.baseVolumes[k] * this.globalVolume;
      }
    });
  }

  public getVolume() {
    return this.globalVolume;
  }

  /**
   * Play a sound. Falls back to Web Audio synth if the file is unavailable.
   * Synth keys: 'start', 'correct', 'error', 'tick', 'victory', 'move'
   */
  public play(key: string, isMuted: boolean = false) {
    if (isMuted || this.globalVolume === 0) return;

    // Try synth first for the key events (excluding ones with new custom audio files)
    const synthMap: Record<string, () => void> = {
      start: () => this.synth_start(),
      round_start: () => this.synth_start(),
      correct: () => this.synth_correct(),
      tick: () => this.synth_tick(),
      fanfare: () => this.synth_victory(),
    };

    if (synthMap[key]) {
      synthMap[key]();
      return;
    }

    // Fallback to file
    const audio = this.sounds[key as SoundKey];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  public stop(key: string) {
    const audio = this.sounds[key as SoundKey];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  public unlock() {
    // Resume AudioContext on first user interaction
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    // Also unlock HTML audio elements
    Object.values(this.sounds).forEach((audio) => {
      audio
        ?.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {});
    });
  }
}

export const audioManager = new AudioManager();
