/**
 * Neon Pong — Web Audio Synthesizer
 * 100% synthesized sound effects & ambient music loop using Web Audio API.
 * Zero external audio assets required.
 */

let audioCtx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;

let sfxEnabled = true;
let musicEnabled = false; // default off for quiet start, toggleable
let musicPlaying = false;
let musicTimer = null;

function getCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(audioCtx.destination);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.8;
    sfxGain.connect(masterGain);

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.25;
    musicGain.connect(masterGain);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SoundEngine = {
  init() {
    try {
      const savedSfx = localStorage.getItem('pong_sfx');
      if (savedSfx !== null) sfxEnabled = savedSfx === 'true';
      const savedMusic = localStorage.getItem('pong_music');
      if (savedMusic !== null) musicEnabled = savedMusic === 'true';
    } catch (_) {}
  },

  isSfxEnabled() {
    return sfxEnabled;
  },

  isMusicEnabled() {
    return musicEnabled;
  },

  toggleSfx() {
    sfxEnabled = !sfxEnabled;
    try { localStorage.setItem('pong_sfx', sfxEnabled); } catch (_) {}
    return sfxEnabled;
  },

  toggleMusic() {
    musicEnabled = !musicEnabled;
    try { localStorage.setItem('pong_music', musicEnabled); } catch (_) {}
    if (musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return musicEnabled;
  },

  // Paddle hit: pitch rises as rally increases (C4 up to C6)
  playPaddleHit(rally = 1) {
    if (!sfxEnabled) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Scale pitch based on rally (260Hz up to 750Hz)
    const baseFreq = 260 + Math.min(rally * 22, 520);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  },

  // Wall bounce: crisp metallic ping
  playWallBounce() {
    if (!sfxEnabled) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  },

  // Goal scored: sub-bass impact & retro drop
  playScore() {
    if (!sfxEnabled) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.45);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  },

  // Power-up spawn chime
  playPowerupSpawn() {
    if (!sfxEnabled) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(time);
      osc.stop(time + 0.15);
    });
  },

  // Power-up collected chime
  playPowerupCollect() {
    if (!sfxEnabled) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(time);
      osc.stop(time + 0.2);
    });
  },

  // Countdown beep
  playCountdown(isFinal = false) {
    if (!sfxEnabled) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const freq = isFinal ? 880 : 440;
    osc.frequency.setValueAtTime(freq, now);

    const dur = isFinal ? 0.35 : 0.15;
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + dur);
  },

  // Match victory fanfare
  playWin() {
    if (!sfxEnabled) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 0.12 },
      { f: 783.99, d: 0.15, t: 0.24 },
      { f: 1046.5, d: 0.45, t: 0.4 }
    ];

    melody.forEach(m => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + m.t;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(m.f, startTime);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + m.d);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(startTime);
      osc.stop(startTime + m.d);
    });
  },

  // Match defeat sound
  playLose() {
    if (!sfxEnabled) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const melody = [
      { f: 440, d: 0.18, t: 0 },
      { f: 392, d: 0.18, t: 0.18 },
      { f: 349.23, d: 0.4, t: 0.36 }
    ];

    melody.forEach(m => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + m.t;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(m.f, startTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + m.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGain);

      osc.start(startTime);
      osc.stop(startTime + m.d);
    });
  },

  startMusic() {
    if (!musicEnabled || musicPlaying) return;
    musicPlaying = true;
    const ctx = getCtx();

    let step = 0;
    const bassline = [110, 110, 130.81, 98];

    const tick = () => {
      if (!musicPlaying || !musicEnabled) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const freq = bassline[step % bassline.length];
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.22);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicGain);

      osc.start(now);
      osc.stop(now + 0.25);

      step++;
      musicTimer = setTimeout(tick, 280);
    };

    tick();
  },

  stopMusic() {
    musicPlaying = false;
    if (musicTimer) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  }
};
