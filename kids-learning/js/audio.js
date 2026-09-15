/**
 * Kids Learning Adventure — Audio & Voice System
 * Web Audio API synthesizer for child-friendly SFX & procedural animal calls
 * Web Speech API wrapper for gentle narration and pronunciation
 */

window.AudioSystem = (function () {
  'use strict';

  let audioCtx = null;
  let soundEnabled = true;
  let voiceEnabled = true;
  let preferredVoice = null;
  let speechRate = parseFloat(localStorage.getItem('kids_speech_rate')) || 0.82;

  // Initialize Web Audio context on user gesture
  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Helper: Strip emojis and symbol clutter from spoken text so TTS sounds natural and human
  function cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      // Remove emojis
      .replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
      // Remove extra whitespace & hyphens
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Score available voices to find the most real, human, and cheerful child-friendly voice
  function scoreVoice(v) {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();

    // 1. Strictly avoid robotic / novelty / scary synthesizers
    const roboticBlacklist = [
      'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos',
      'deranged', 'fred', 'good news', 'hysterical', 'jester', 'junior',
      'organ', 'superstar', 'ralph', 'trinoids', 'whisper', 'zarvox', 'wobble',
      'sin-ji', 'ting-ting', 'yuna', 'kyoko'
    ];
    if (roboticBlacklist.some(r => name.includes(r))) return -200;

    // Must be English
    if (!lang.startsWith('en')) return -100;

    let score = 20;

    // Highest preference: Google Neural / Chrome Natural voices
    if (name.includes('google uk english female')) score += 90;
    if (name.includes('google us english')) score += 80;
    if (name.includes('natural') || name.includes('neural')) score += 75;
    if (name.includes('enhanced') || name.includes('premium')) score += 70;

    // Cheerful, expressive macOS & iOS voices
    if (name.includes('samantha')) score += 65;
    if (name.includes('flo')) score += 65;
    if (name.includes('sandy')) score += 62;
    if (name.includes('shelley')) score += 62;
    if (name.includes('karen')) score += 55;
    if (name.includes('tessa')) score += 52;
    if (name.includes('victoria')) score += 50;
    if (name.includes('daniel')) score += 48;
    if (name.includes('moira')) score += 45;
    if (name.includes('zira')) score += 42;
    if (name.includes('ava')) score += 60;
    if (name.includes('zoe')) score += 60;

    // Regional preference for clear English
    if (lang === 'en-us' || lang === 'en_us') score += 10;
    if (lang === 'en-gb' || lang === 'en_gb') score += 10;

    return score;
  }

  // Pick best English voice for preschool children
  function initVoices() {
    if (!('speechSynthesis' in window)) return;

    function selectVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Check saved voice preference from localStorage
      const savedURI = localStorage.getItem('kids_preferred_voice_uri');
      if (savedURI) {
        const found = voices.find(v => v.voiceURI === savedURI);
        if (found) {
          preferredVoice = found;
          return;
        }
      }

      // Rank all available voices
      const scored = voices
        .map(v => ({ voice: v, score: scoreVoice(v) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        preferredVoice = scored[0].voice;
      } else {
        // Fallback: any English voice
        preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }
    }

    selectVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = selectVoice;
    }
  }

  initVoices();

  // Get curated list of friendly voices for child/parent selector
  function getFriendlyVoices() {
    if (!('speechSynthesis' in window)) return [];
    const voices = window.speechSynthesis.getVoices();
    return voices
      .map(v => ({ voice: v, score: scoreVoice(v) }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.voice);
  }

  function setVoiceByURI(voiceURI) {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const found = voices.find(v => v.voiceURI === voiceURI);
    if (found) {
      preferredVoice = found;
      localStorage.setItem('kids_preferred_voice_uri', voiceURI);
      speak("Hi! I am your friendly learning buddy!");
    }
  }

  // Speak text with natural, real human prosody (pitch = 1.0 removes all metallic/robotic distortion)
  function speak(text, onEnd) {
    if (!voiceEnabled || !('speechSynthesis' in window)) {
      if (typeof onEnd === 'function') setTimeout(onEnd, 300);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Cancel current utterance
      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) {
        if (typeof onEnd === 'function') onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      // Pitch = 1.0 preserves the true organic human acoustic formant without DSP robot artifacts
      utterance.pitch = 1.0;
      // Gentle, clear, unhurried pace suitable for preschool children (3-6 years)
      utterance.rate = speechRate;
      utterance.volume = 1.0;

      if (typeof onEnd === 'function') {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (typeof onEnd === 'function') onEnd();
    }
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /* -------------------------------------------------------------
     WEB AUDIO API PROCEDURAL SOUND EFFECTS
     ------------------------------------------------------------- */

  // Reusable beep helper
  function playTone(freq, type, duration, startTime = 0, gainLevel = 0.25) {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    const t = audioCtx.currentTime + startTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(gainLevel, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }

  // 1. Bubble click sound
  function playClick() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // 2. Delightful success chime (C5 -> E5 -> G5 -> C6)
  function playCorrect() {
    if (!soundEnabled) return;
    initAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      playTone(freq, 'triangle', 0.28, idx * 0.07, 0.25);
    });
  }

  // 3. Gentle try-again sound (soft playful marimba double boing, never harsh)
  function playWrong() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    const t = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(320, t);
    osc1.frequency.exponentialRampToValueAtTime(240, t + 0.18);

    gain1.gain.setValueAtTime(0.2, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);

    osc1.start(t);
    osc1.stop(t + 0.2);

    // Second soft tap
    setTimeout(() => {
      if (!soundEnabled || !audioCtx) return;
      const t2 = audioCtx.currentTime;
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(280, t2);
      osc2.frequency.exponentialRampToValueAtTime(200, t2 + 0.22);

      gain2.gain.setValueAtTime(0.18, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.22);

      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);

      osc2.start(t2);
      osc2.stop(t2 + 0.24);
    }, 120);
  }

  // 4. Star sparkle chime
  function playStar() {
    if (!soundEnabled) return;
    initAudioContext();
    const notes = [880, 1174.66, 1318.51, 1567.98, 2093.00];
    notes.forEach((f, i) => {
      playTone(f, 'sine', 0.35, i * 0.05, 0.2);
    });
  }

  // 5. Celebration victory fanfare
  function playCelebration() {
    if (!soundEnabled) return;
    initAudioContext();
    const notes = [
      { f: 523.25, d: 0.12, wait: 0 },
      { f: 659.25, d: 0.12, wait: 0.12 },
      { f: 783.99, d: 0.12, wait: 0.24 },
      { f: 1046.50, d: 0.35, wait: 0.36 },
      { f: 880.00, d: 0.15, wait: 0.55 },
      { f: 1046.50, d: 0.50, wait: 0.70 }
    ];
    notes.forEach(n => {
      playTone(n.f, 'triangle', n.d, n.wait, 0.3);
    });
  }

  // 6. Badge unlock fanfare
  function playBadge() {
    if (!soundEnabled) return;
    initAudioContext();
    const notes = [
      { f: 440, wait: 0 },
      { f: 554.37, wait: 0.1 },
      { f: 659.25, wait: 0.2 },
      { f: 880, wait: 0.32 },
      { f: 880, wait: 0.44 },
      { f: 1108.73, wait: 0.6 }
    ];
    notes.forEach(n => playTone(n.f, 'sine', 0.28, n.wait, 0.25));
  }

  /* -------------------------------------------------------------
     PROCEDURAL ANIMAL SOUND SYNTHESIZER (100% Offline)
     ------------------------------------------------------------- */
  function playAnimalSound(type, onComplete) {
    initAudioContext();
    if (!soundEnabled || !audioCtx) {
      // Voice fallback
      speak(type, onComplete);
      return;
    }

    const t = audioCtx.currentTime;

    switch (type) {
      case 'dog': {
        // Two woofs
        for (let i = 0; i < 2; i++) {
          const st = t + i * 0.22;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(260, st);
          osc.frequency.exponentialRampToValueAtTime(140, st + 0.12);

          const filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, st);

          gain.gain.setValueAtTime(0.35, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.14);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(st);
          osc.stop(st + 0.15);
        }
        break;
      }
      case 'cat': {
        // "Meeeee-oww"
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.linearRampToValueAtTime(750, t + 0.25);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.65);

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.7);
        break;
      }
      case 'cow': {
        // Deep resonant "Moooo"
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.linearRampToValueAtTime(120, t + 0.4);
        osc.frequency.exponentialRampToValueAtTime(95, t + 0.9);

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.95);
        break;
      }
      case 'duck': {
        // "Quack Quack"
        for (let i = 0; i < 2; i++) {
          const st = t + i * 0.25;
          const osc = audioCtx.createOscillator();
          const filter = audioCtx.createBiquadFilter();
          const gain = audioCtx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(360, st);
          osc.frequency.exponentialRampToValueAtTime(260, st + 0.16);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(900, st);
          filter.Q.value = 4.0;

          gain.gain.setValueAtTime(0.35, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.18);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(st);
          osc.stop(st + 0.19);
        }
        break;
      }
      case 'sheep': {
        // "Baaaa" with vibrato
        const osc = audioCtx.createOscillator();
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, t);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(7, t); // 7Hz vibrato
        lfoGain.gain.setValueAtTime(25, t);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        lfo.start(t);
        osc.start(t);
        lfo.stop(t + 0.75);
        osc.stop(t + 0.75);
        break;
      }
      case 'lion': {
        // Low rumble "Roaaar"
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.linearRampToValueAtTime(70, t + 0.8);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.9);
        break;
      }
      case 'bird': {
        // Bright chirps
        for (let i = 0; i < 3; i++) {
          const st = t + i * 0.12;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1800 + i * 200, st);
          osc.frequency.exponentialRampToValueAtTime(2800 + i * 200, st + 0.08);

          gain.gain.setValueAtTime(0.22, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.09);

          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(st);
          osc.stop(st + 0.1);
        }
        break;
      }
      case 'pig': {
        // Oink oink
        for (let i = 0; i < 2; i++) {
          const st = t + i * 0.2;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(160, st);
          osc.frequency.exponentialRampToValueAtTime(120, st + 0.12);

          const filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, st);

          gain.gain.setValueAtTime(0.25, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.14);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(st);
          osc.stop(st + 0.15);
        }
        break;
      }
      default: {
        // Fallback: speak the animal name / sound
        speak(type);
        break;
      }
    }

    if (typeof onComplete === 'function') {
      setTimeout(onComplete, 950);
    }
  }

  return {
    init: initAudioContext,
    speak,
    stopSpeaking,
    playClick,
    playCorrect,
    playWrong,
    playStar,
    playCelebration,
    playBadge,
    playAnimalSound,
    getFriendlyVoices,
    setVoiceByURI,
    get preferredVoiceName() { return preferredVoice ? preferredVoice.name : 'Default Voice'; },
    get speechRate() { return speechRate; },
    set speechRate(val) {
      speechRate = parseFloat(val) || 0.82;
      localStorage.setItem('kids_speech_rate', speechRate);
    },
    get soundEnabled() { return soundEnabled; },
    set soundEnabled(val) { soundEnabled = !!val; },
    get voiceEnabled() { return voiceEnabled; },
    set voiceEnabled(val) { voiceEnabled = !!val; }
  };
})();
