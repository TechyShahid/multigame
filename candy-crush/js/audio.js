/**
 * Candy Crush — Web Audio Sound Effects
 * Synthesized sounds with zero external dependencies
 */

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxEnabled = true;
let musicEnabled = true;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.15;
    musicGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', gainVal = 0.3, detune = 0) {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, gainVal = 0.1) {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.5;
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + duration);
}

export const Audio = {
  init() {
    getCtx();
  },

  setSfxEnabled(enabled) {
    sfxEnabled = enabled;
  },

  setMusicEnabled(enabled) {
    musicEnabled = enabled;
    if (musicGain) musicGain.gain.value = enabled ? 0.15 : 0;
  },

  /** Candy select / tap */
  playSelect() {
    playTone(880, 0.08, 'sine', 0.2);
  },

  /** Candy swap whoosh */
  playSwap() {
    playTone(440, 0.12, 'sine', 0.15);
    setTimeout(() => playTone(660, 0.1, 'sine', 0.15), 50);
  },

  /** Invalid swap — error buzz */
  playInvalid() {
    playTone(150, 0.15, 'square', 0.15);
    setTimeout(() => playTone(120, 0.15, 'square', 0.12), 80);
  },

  /** Match pop — pitch increases with chain level */
  playMatch(chainLevel = 0) {
    const baseFreq = 523 + chainLevel * 80; // C5 + pitch up per chain
    playTone(baseFreq, 0.12, 'sine', 0.25);
    setTimeout(() => playTone(baseFreq * 1.25, 0.1, 'sine', 0.2), 40);
    setTimeout(() => playTone(baseFreq * 1.5, 0.08, 'sine', 0.15), 80);
    playNoise(0.06, 0.05);
  },

  /** Special candy created */
  playSpecialCreate() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.15, 'sine', 0.2), i * 60);
    });
    playNoise(0.1, 0.08);
  },

  /** Special candy activated — big explosion */
  playSpecialActivate() {
    playTone(200, 0.3, 'sawtooth', 0.15);
    playTone(100, 0.4, 'sine', 0.2);
    playNoise(0.25, 0.12);
    setTimeout(() => {
      playTone(800, 0.2, 'sine', 0.2);
      playTone(1200, 0.15, 'sine', 0.15);
    }, 100);
  },

  /** Color bomb activation */
  playColorBomb() {
    const freqs = [261, 329, 392, 523, 659, 784, 1047];
    freqs.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, 'sine', 0.18, Math.random() * 20), i * 40);
    });
    playNoise(0.3, 0.1);
  },

  /** Cascade / chain combo */
  playCascade(level) {
    const freq = 400 + level * 100;
    playTone(freq, 0.1, 'triangle', 0.2);
    setTimeout(() => playTone(freq * 1.33, 0.08, 'triangle', 0.15), 50);
  },

  /** Level complete fanfare */
  playVictory() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1318];
    const durations = [0.15, 0.15, 0.15, 0.3, 0.1, 0.15, 0.4];
    let time = 0;
    melody.forEach((f, i) => {
      setTimeout(() => {
        playTone(f, durations[i], 'sine', 0.25);
        playTone(f * 0.5, durations[i], 'triangle', 0.1);
      }, time);
      time += durations[i] * 600;
    });
  },

  /** Game over sound */
  playGameOver() {
    const notes = [392, 349, 330, 262]; // G4, F4, E4, C4 descending
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.25, 'sine', 0.2), i * 200);
    });
  },

  /** Button click */
  playClick() {
    playTone(1000, 0.05, 'sine', 0.15);
  },

  /** Star earned */
  playStar() {
    playTone(1047, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(1318, 0.15, 'sine', 0.25), 80);
  }
};
