// Web Audio API sound generator for scanner feedback

class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1); // E6
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.18);

      if (navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playLate() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.setValueAtTime(520, now + 0.1);
      
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.25);

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {
      // Ignore audio error
    }
  }

  playDuplicate() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.12);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.3);

      if (navigator.vibrate) {
        navigator.vibrate([150, 80, 200]);
      }
    } catch {
      // Ignore audio error
    }
  }
}

export const soundEffects = new SoundEffects();
