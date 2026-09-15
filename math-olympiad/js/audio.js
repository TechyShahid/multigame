// Audio Synthesizer and Preschool Teacher-Style Storytelling Narration

class SoundService {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.speechEnabled = true;
    this.musicEnabled = false;
    this.musicInterval = null;
    this.femaleVoice = null;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoice();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoice();
      };
    }
  }

  // Find the highest quality warm, natural female voice available on the device
  initVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Ordered ranking of best realistic natural female teacher voices
    const preferredNames = [
      // Chrome Google Natural Female
      'Google US English',
      'Google UK English Female',
      // Edge Natural Online voices
      'Microsoft Jenny Online (Natural)',
      'Microsoft Aria Online (Natural)',
      'Microsoft Sonia Online (Natural)',
      // macOS / iOS High-Quality Natural Female (Samantha is warm & friendly)
      'Samantha (Enhanced)',
      'Samantha',
      'Ava (Premium)',
      'Ava (Enhanced)',
      'Ava',
      'Karen',
      'Shelley (English (US))',
      'Flo (English (US))',
      'Sandy (English (US))',
      'Victoria',
      'Moira',
      'Tessa',
    ];

    for (const name of preferredNames) {
      const match = voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
      if (match) {
        this.femaleVoice = match;
        return;
      }
    }

    // Secondary search for any female English voice
    const femaleMatch = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('karen'))
    );
    if (femaleMatch) {
      this.femaleVoice = femaleMatch;
      return;
    }

    // Avoid robotic voices (zarvox, trinoids, albert, fred, etc.)
    const naturalEn = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        !['zarvox', 'trinoids', 'albert', 'fred', 'ralph', 'bad news', 'bahh', 'cellos', 'wobble', 'jester', 'whisper', 'organ'].some(
          (bad) => v.name.toLowerCase().includes(bad)
        )
    );
    this.femaleVoice = naturalEn || voices[0] || null;
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  setSpeechEnabled(enabled) {
    this.speechEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (enabled) this.startMusic();
    else this.stopMusic();
  }

  playClick() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {}
  }

  playCorrect() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.36);
      });
    } catch (e) {}
  }

  playEncourage() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(329.63, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch (e) {}
  }

  playVictory() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const melody = [
        { f: 523.25, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.3 },
        { f: 587.33, d: 0.15 },
        { f: 783.99, d: 0.45 },
      ];
      let t = ctx.currentTime;
      melody.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + note.d);
        t += note.d + 0.04;
      });
    } catch (e) {}
  }

  startMusic() {
    if (this.musicInterval) return;
    const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    this.musicInterval = setInterval(() => {
      if (!this.musicEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;
      try {
        const note = notes[Math.floor(Math.random() * notes.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.3);
      } catch (e) {}
    }, 1200);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Friendly names for visual items for preschool children (handles singular and plural)
  getItemFriendlyName(emoji, count = 2) {
    const singleMap = {
      '🍎': 'sweet apple',
      '🍌': 'sweet banana',
      '⭐': 'twinkling star',
      '🐶': 'playful puppy',
      '🐱': 'cute kitten',
      '🚗': 'zoomy car',
      '🚙': 'blue car',
      '🎈': 'party balloon',
      '🌸': 'pretty flower',
      '🐟': 'little fish',
      '🐥': 'baby duck',
      '🧁': 'sweet cupcake',
      '🍪': 'crunchy cookie',
      '🍬': 'sweet candy',
      '🍓': 'sweet strawberry',
      '🦋': 'fluttering butterfly',
      '🐝': 'busy bee',
      '💎': 'shiny diamond',
      '🐸': 'jumping frog',
      '⚽': 'soccer ball',
      '🍦': 'ice cream cone',
      '☀️': 'sunny sun',
      '🧸': 'teddy bear',
      '🍩': 'sweet donut',
      '🍭': 'lollipop',
      '🔵': 'blue circle',
      '🔴': 'red circle',
      '🟢': 'green circle',
      '🟡': 'yellow circle',
      '🔺': 'triangle',
      '🟦': 'blue square',
      '🟩': 'green square',
      '⏹️': 'square',
      '⭕': 'circle',
      '💖': 'sweet heart',
    };
    const pluralMap = {
      '🍎': 'red apples',
      '🍌': 'sweet bananas',
      '⭐': 'twinkling stars',
      '🐶': 'playful puppies',
      '🐱': 'cute kittens',
      '🚗': 'zoomy cars',
      '🚙': 'blue cars',
      '🎈': 'party balloons',
      '🌸': 'pretty flowers',
      '🐟': 'little fish',
      '🐥': 'baby ducks',
      '🧁': 'sweet cupcakes',
      '🍪': 'crunchy cookies',
      '🍬': 'sweet candies',
      '🍓': 'sweet strawberries',
      '🦋': 'fluttering butterflies',
      '🐝': 'busy bees',
      '💎': 'shiny diamonds',
      '🐸': 'jumping frogs',
      '⚽': 'soccer balls',
      '🍦': 'ice cream cones',
      '☀️': 'sunny suns',
      '🧸': 'teddy bears',
      '🍩': 'sweet donuts',
      '🍭': 'lollipops',
      '🔵': 'blue circles',
      '🔴': 'red circles',
      '🟢': 'green circles',
      '🟡': 'yellow circles',
      '🔺': 'triangles',
      '🟦': 'blue squares',
      '🟩': 'green squares',
      '⏹️': 'squares',
      '⭕': 'circles',
      '💖': 'sweet hearts',
    };
    if (count === 1) return singleMap[emoji] || 'item';
    return pluralMap[emoji] || 'items';
  }

  extractAdditionDetails(question) {
    let countA = 0;
    let countB = 0;
    let emoji = null;

    if (question.visualData?.countA) countA = question.visualData.countA;
    if (question.visualData?.countB) countB = question.visualData.countB;
    if (question.visualData?.emojiA) emoji = question.visualData.emojiA;

    if ((!countA || !countB) && question.visualData?.items && question.visualData.items.length >= 3) {
      const first = String(question.visualData.items[0] || '');
      const second = String(question.visualData.items[2] || '');

      const numA = parseInt(first, 10);
      const numB = parseInt(second, 10);
      if (!isNaN(numA) && !isNaN(numB) && first.match(/^\d+$/)) {
        countA = numA;
        countB = numB;
      } else {
        const charsA = Array.from(first.trim());
        const charsB = Array.from(second.trim());
        if (charsA.length > 0) {
          countA = charsA.length;
          if (!emoji) emoji = charsA[0];
        }
        if (charsB.length > 0) {
          countB = charsB.length;
          if (!emoji) emoji = charsB[0];
        }
      }
    }

    if (!countA || !countB) {
      const text = question.questionText || '';
      const numMatch = text.match(/(\d+)\s*\+\s*(\d+)/);
      if (numMatch) {
        countA = parseInt(numMatch[1], 10);
        countB = parseInt(numMatch[2], 10);
      } else if (text.includes('+')) {
        const parts = text.split('+');
        const charsA = Array.from(parts[0].trim());
        const charsB = Array.from((parts[1] || '').split('=')[0].trim());
        if (charsA.length > 0) {
          countA = charsA.length;
          if (!emoji) emoji = charsA[0];
        }
        if (charsB.length > 0) {
          countB = charsB.length;
          if (!emoji) emoji = charsB[0];
        }
      }
    }

    if (!countA) countA = 2;
    if (!countB) countB = 3;
    if (!emoji && !question.questionText?.match(/\d+/)) emoji = '🍎';

    const sum = parseInt(question.correctAnswer, 10) || (countA + countB);
    return { countA, countB, emoji, sum };
  }

  extractSubtractionDetails(question) {
    let startCount = 0;
    let takeAwayCount = 0;
    let remainingCount = 0;
    let emoji = null;

    if (question.visualData?.countA) startCount = question.visualData.countA;
    if (question.visualData?.subtractionCrossCount) takeAwayCount = question.visualData.subtractionCrossCount;
    if (question.visualData?.emojiA) emoji = question.visualData.emojiA;

    if (question.visualData?.items && Array.isArray(question.visualData.items)) {
      const items = question.visualData.items;
      const crossed = items.filter((it) => it === '❌' || it === '💥');
      const normal = items.filter((it) => it !== '❌' && it !== '💥' && it !== '-' && it !== '=');

      if (normal.length > 0 && crossed.length > 0) {
        if (!emoji) emoji = normal[0];
        if (!remainingCount) remainingCount = normal.length;
        if (!takeAwayCount) takeAwayCount = crossed.length;
        if (!startCount) startCount = remainingCount + takeAwayCount;
      } else if (items.includes('-') && items.length >= 3) {
        const numA = parseInt(items[0], 10);
        const numB = parseInt(items[2], 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          startCount = numA;
          takeAwayCount = numB;
          remainingCount = startCount - takeAwayCount;
        }
      }
    }

    if (!startCount || !takeAwayCount) {
      const text = question.questionText || question.narrationText || '';
      const numMatch = text.match(/(\d+)[^\d\-–]*[\-–]\s*(\d+)/);
      const takeAwayMatch = text.match(/(?:take away|swam away|ate|popped|leaves)\s*(\d+)/i);
      if (numMatch) {
        startCount = parseInt(numMatch[1], 10);
        takeAwayCount = parseInt(numMatch[2], 10);
      } else if (takeAwayMatch && question.correctAnswer) {
        takeAwayCount = parseInt(takeAwayMatch[1], 10);
      }
      const emojiMatch = text.match(/[🍎🍌⭐🐶🐱🚗🎈🐟🌸🐥🧁🍪🍬🍓🦋🐸⚽🍦🧸🍩🍭]/u);
      if (emojiMatch && !emoji) emoji = emojiMatch[0];
    }

    if (!remainingCount) {
      const ansNum = parseInt(question.correctAnswer, 10);
      if (!isNaN(ansNum)) {
        remainingCount = ansNum;
        if (startCount && !takeAwayCount) takeAwayCount = startCount - remainingCount;
        if (!startCount && takeAwayCount) startCount = remainingCount + takeAwayCount;
      }
    }

    if (!startCount) startCount = 5;
    if (!takeAwayCount) takeAwayCount = 2;
    if (!remainingCount) remainingCount = Math.max(1, startCount - takeAwayCount);
    if (!emoji && !question.questionText?.match(/\d+/)) emoji = '🐟';

    return { startCount, takeAwayCount, remainingCount, emoji };
  }

  // Generates warm, interactive preschool teacher speech directly teaching a 4-year-old child
  generatePreschoolTeacherLesson(question, fallbackText) {
    if (!question) {
      return fallbackText ? fallbackText.replace(/[🍎🍌⭐🐶🐱🚗🎈🐟🌸🐥🧁🍪🍬🔴🔵🟢🟡🔺⏹️⭕❓]/gu, '') : '';
    }

    const { category, questionType, visualData, correctAnswer, options, questionText } = question;

    // 1. VISUAL COUNTING for 4-year-olds
    if (questionType === 'visual-counting' && visualData?.items) {
      const count = visualData.items.length;
      const emoji = visualData.items[0];
      const itemName = this.getItemFriendlyName(emoji, count);

      const countingWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
      const sequence = countingWords.slice(0, Math.min(count, 12)).join(', , ');

      return `Hello little explorer! Look at the lovely ${itemName} on your screen! Put your magic finger on them, and let's count together! Ready? , , ${sequence}! , , How many ${itemName} are there in total? Can you find the button with number ${correctAnswer}, and tap it for me?`;
    }

    // 2. PICTURE ADDITION for 4-year-olds
    if (questionType === 'picture-addition') {
      const { countA, countB, emoji, sum } = this.extractAdditionDetails(question);
      if (emoji) {
        const itemA = this.getItemFriendlyName(emoji, countA);
        const itemB = this.getItemFriendlyName(emoji, countB);
        const joinPhrase = countB === 1 ? 'Here comes 1 more' : `Here come ${countB} more`;

        return `Let's play a magic math game! On this side, we have ${countA} ${itemA}. And look! ${joinPhrase} ${itemB} to join the party! If we put all of them together into one big basket... let's count: ${countA}, plus, ${countB}, makes, ${sum}! Can you find the number ${sum}? Tap it!`;
      } else {
        return `Let's play a magic math game! What is ${countA} plus ${countB}? If we add them together, that makes ${sum}! Can you tap number ${sum}?`;
      }
    }

    // 3. PICTURE SUBTRACTION for 4-year-olds
    if (questionType === 'picture-subtraction') {
      const { startCount, takeAwayCount, remainingCount, emoji } = this.extractSubtractionDetails(question);
      const namePlural = emoji ? this.getItemFriendlyName(emoji, 2) : 'items';

      if (emoji === '🐟') {
        return `Splish splash! There were ${startCount} little fish playing happily together. But look! ${takeAwayCount} of them swam away! How many little fish are still left with us? Let's count what remains! That leaves, ${remainingCount}! Can you tap number ${remainingCount}?`;
      } else if (emoji === '🎈') {
        const balloonStart = this.getItemFriendlyName(emoji, startCount);
        const popPhrase = takeAwayCount === 1 ? '1 balloon popped' : `${takeAwayCount} balloons popped`;
        return `Up in the sky, there were ${startCount} ${balloonStart} floating happily! But pop! ${popPhrase}! How many party balloons are still floating? Let's count what remains! That leaves, ${remainingCount}! Can you tap number ${remainingCount}?`;
      } else if (emoji === '🧁' || emoji === '🍪' || emoji === '🍎' || emoji === '🍬' || emoji === '🍓' || emoji === '🍩') {
        const foodStart = this.getItemFriendlyName(emoji, startCount);
        const eatPhrase = takeAwayCount === 1 ? '1 yummy treat was eaten' : `${takeAwayCount} yummy treats were eaten`;
        return `Yum yum! Look at your screen, we had ${startCount} ${foodStart}! But look! ${eatPhrase}! How many ${namePlural} are still left? Let's count what remains! That leaves, ${remainingCount}! Can you tap number ${remainingCount}?`;
      } else if (emoji) {
        const itemStart = this.getItemFriendlyName(emoji, startCount);
        const awayPhrase = takeAwayCount === 1 ? '1 went away to play' : `${takeAwayCount} went away to play`;
        return `Look at your screen! There were ${startCount} ${itemStart} playing happily together. But look! ${awayPhrase}! How many ${namePlural} are still left with us? Let's count what remains! That leaves, ${remainingCount}! Can you tap number ${remainingCount}?`;
      } else {
        return `Let's solve our math puzzle! We have ${startCount}, and we take away ${takeAwayCount}. Let's count what remains: ${startCount}, minus, ${takeAwayCount}, leaves, ${remainingCount}! Can you tap number ${remainingCount}?`;
      }
    }

    // 4. BIGGER OR SMALLER for 4-year-olds
    if (questionType === 'bigger-smaller') {
      const [optA, optB] = options || ['7', '4'];
      const text = (questionText || '').toLowerCase();
      if (text.includes('bigger') || text.includes('more') || text.includes('greater')) {
        return `Let's see who has more! Look at ${optA}, and ${optB}. Which one is bigger? Tap the bigger one for me!`;
      } else {
        return `Let's look for the smaller one with fewer pieces! Look at ${optA}, and ${optB}. Which one is smaller? Tap the smaller one for me!`;
      }
    }

    // 5. SHAPES HUNT for 4-year-olds
    if (questionType === 'shape-recognition') {
      if (questionText.toLowerCase().includes('triangle') || correctAnswer.toLowerCase().includes('triangle')) {
        return `Let's go on a shape treasure hunt! Can you help me find the triangle? A triangle has three pointy corners, just like a yummy slice of pizza or a party hat! Point to the triangle!`;
      } else if (questionText.toLowerCase().includes('circle') || correctAnswer.toLowerCase().includes('circle')) {
        return `Can you find the circle? A circle is completely round with no sharp corners at all, just like a rolling ball or a giant cookie! Point to the round circle!`;
      } else if (questionText.toLowerCase().includes('square') || correctAnswer.toLowerCase().includes('square')) {
        return `We are looking for a square! A square has four straight sides that are all the exact same length, like a toy building block! Can you tap the square?`;
      } else if (questionText.toLowerCase().includes('star') || correctAnswer.toLowerCase().includes('star')) {
        return `Twinkle twinkle! Which shape looks like a bright star in the night sky with pointy tips? Point to the star!`;
      } else if (questionText.toLowerCase().includes('heart') || correctAnswer.toLowerCase().includes('heart')) {
        return `Which shape looks like a sweet heart full of love and warm hugs? Point to the heart!`;
      } else {
        return `Let's look at the shapes! ${questionText.replace(/[🔴🔺🟦⭕⏹️⭐💖📐]/gu, '')}. Which one is the right shape?`;
      }
    }

    // 6. PATTERNS for 4-year-olds
    if (questionType === 'pattern') {
      if (visualData?.items) {
        const patternItems = visualData.items.filter((it) => it !== '❓' && it !== '?');
        if (patternItems.length > 0) {
          const names = patternItems.map((it) => this.getItemFriendlyName(it, 1)).join(', ');
          return `Listen to our fun repeating pattern! ${names}! What should come next in our rhythm train? Give it a tap!`;
        }
      }
      if (question.narrationText) {
        return `Listen to our fun repeating pattern! ${question.narrationText.replace(/[❓?]/g, '')}. What should come next? Give it a tap!`;
      }
      return `Listen to our fun repeating pattern! What should come next in our rhythm train? Give it a tap!`;
    }

    // 7. ODD ONE OUT / LOGIC for 4-year-olds
    if (questionType === 'odd-one-out' || category === 'logic') {
      return `Put on your detective glasses! Look closely at all four pictures. Three of them are good buddies that match, but one friend is different! Can you spot the odd one out? Tap the one that doesn't belong!`;
    }

    // 8. MISSING NUMBER
    if (questionType === 'missing-number') {
      return `Let's sing our counting song! Look at the missing spot in the train: ${questionText.replace('?', 'and then, what?').replace(/[❓]/gu, '')}. What number comes next? Can you tap the missing number?`;
    }

    // 9. POSITION
    if (questionType === 'position') {
      return `Look carefully with your eyes! ${questionText.replace(/[🐦🌳📦🧸🐸🐰⬆️⬇️➡️]/gu, '')}. Where is it located? Tap your answer!`;
    }

    // 10. MEMORY
    if (questionType === 'memory') {
      return `Look closely with your super detective eyes! Look at the pictures before they hide! In three, two, one... poof! They're hidden! Can you remember which friend was on the screen?`;
    }

    // General fallback formatted like a warm teacher
    let clean = (question.narrationText || question.questionText || fallbackText || '')
      .replace(/[🍎]/gu, ' apple ')
      .replace(/[⭐]/gu, ' star ')
      .replace(/[🚗]/gu, ' car ')
      .replace(/[🌸]/gu, ' flower ')
      .replace(/[🎈]/gu, ' balloon ')
      .replace(/[🐟]/gu, ' fish ')
      .replace(/[🧁]/gu, ' cupcake ')
      .replace(/[🍪]/gu, ' cookie ')
      .replace(/[🍌⭐🐶🐱🚙🐥🍬🔴🔵🟢🟡🔺⏹️⭕❓💎🐸⚽🍦🕊️🦜🦋🐞🦄🐝]/gu, '')
      .replace(/₹(\d+)/g, '$1 rupees')
      .replace(/\s*\+\s*/g, ', plus, ')
      .replace(/\s*-\s*(?!\w)/g, ', minus, ')
      .replace(/\s*(?:×|\*)\s*/g, ', times, ')
      .replace(/\s*=\s*/g, ', equals, ')
      .replace(/\s*\?\s*$/g, '?')
      .trim();

    return `Let's explore together! ${clean}`;
  }

  // Teacher narration: Speaks like a loving kindergarten teacher sitting right with the child
  speakText(text, question) {
    if (!this.speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();

      if (!this.femaleVoice) {
        this.initVoice();
      }

      // Generate the warm storytelling lesson script for a 4-year-old child
      const lessonScript = this.generatePreschoolTeacherLesson(question, text);
      if (!lessonScript) return;

      const utterance = new SpeechSynthesisUtterance(lessonScript);

      if (this.femaleVoice) {
        utterance.voice = this.femaleVoice;
      }

      // Preschool teacher speech settings:
      // 0.83x rate gives small children time to look at the screen and process
      // 1.08x pitch is warm, loving, maternal, and cheerful
      utterance.pitch = 1.08;
      utterance.rate = 0.83;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  stopNarration() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.stopMusic();
  }
}

export const audio = new SoundService();
