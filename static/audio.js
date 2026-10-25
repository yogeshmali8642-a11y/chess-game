// Web Audio API Procedural Chess Sound Synthesizer
// Provides 100% offline, zero-latency realistic chess audio effects

class ChessAudio {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('knightfall-sound') !== 'false';
    this.unlocked = false;
    this._armUnlock();
  }

  _armUnlock() {
    const unlock = () => {
      this.unlocked = true;
      this.ensureContext();
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((type) => {
      document.addEventListener(type, unlock, { once: true, capture: true });
    });
  }

  ensureContext() {
    // Chrome blocks AudioContext until a user gesture. Do not create or resume
    // it on page load — that logs autoplay warnings and never actually plays.
    if (!this.unlocked) return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return !!this.ctx;
  }

  toggleSound() {
    this.enabled = !this.enabled;
    localStorage.setItem('knightfall-sound', this.enabled ? 'true' : 'false');
    if (this.enabled) {
      this.playMove();
    }
    return this.enabled;
  }

  playMove() {
    if (!this.enabled) return;
    if (!this.ensureContext()) return;

    const t = this.ctx.currentTime;
    
    // Crisp wooden tap (low body + sharp transient)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    // Filtered noise click for surface impact
    const bufferSize = this.ctx.sampleRate * 0.025;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.025);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    try {
      osc.start(t);
      osc.stop(t + 0.1);
      noise.start(t);
    } catch (_) {
      // Autoplay policy can still reject start() if resume has not completed.
    }
  }

  playCapture() {
    if (!this.enabled) return;
    if (!this.ensureContext()) return;

    const t = this.ctx.currentTime;

    // Heavy wooden collision thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.14);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    // Impact crack
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, t);
    filter.Q.setValueAtTime(1.8, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    try {
      osc.start(t);
      osc.stop(t + 0.15);
      noise.start(t);
    } catch (_) {}
  }

  playCheck() {
    if (!this.enabled) return;
    if (!this.ensureContext()) return;

    const t = this.ctx.currentTime;
    
    // Crystal alert bell chime (dual harmonic)
    [587.33, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.99, t + 0.35);

      const delay = idx * 0.04;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.setValueAtTime(0.18, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      try {
        osc.start(t + delay);
        osc.stop(t + delay + 0.36);
      } catch (_) {}
    });
  }

  playCastle() {
    this.playMove();
    setTimeout(() => this.playMove(), 110);
  }

  playGameEnd(isWin) {
    if (!this.enabled) return;
    if (!this.ensureContext()) return;

    const t = this.ctx.currentTime;
    const notes = isWin ? [523.25, 659.25, 783.99, 1046.50] : [440, 392, 349.23, 293.66];
    
    notes.forEach((freq, i) => {
      const start = t + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = isWin ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      try {
        osc.start(start);
        osc.stop(start + 0.5);
      } catch (_) {}
    });
  }
}

window.chessAudio = new ChessAudio();
