/**
 * Kids Learning Adventure — Games & Activity Controllers
 * 12+ child-friendly preschool educational game modes
 */

window.GamesManager = (function () {
  'use strict';

  // --- Utilities ---
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickRandom(array, count, excludeItem) {
    const pool = array.filter(item => item !== excludeItem);
    const shuffled = shuffle(pool);
    return shuffled.slice(0, count);
  }

  /* =============================================================
     1. LEARN ABC CONTROLLER
     ============================================================= */
  const LearnABC = {
    currentIndex: 0,

    init() {
      this.currentIndex = 0;
      this.render();
      this.renderAlphabetGrid();
    },

    render() {
      const item = window.GameData.alphabets[this.currentIndex];
      if (!item) return;

      const letterEl = document.getElementById('abc-card-letter');
      const emojiEl = document.getElementById('abc-card-emoji');
      const wordEl = document.getElementById('abc-card-word');
      const phonicsEl = document.getElementById('abc-card-phonics');
      const counterEl = document.getElementById('abc-card-counter');

      if (letterEl) {
        letterEl.textContent = item.letter;
        letterEl.style.color = item.color;
      }
      if (emojiEl) emojiEl.textContent = item.emoji;
      if (wordEl) wordEl.textContent = item.word;
      if (phonicsEl) phonicsEl.textContent = item.phonics;
      if (counterEl) counterEl.textContent = `${this.currentIndex + 1} / 26`;

      // Auto-narrate letter and word
      this.speakCurrent();

      if (window.RewardSystem) {
        window.RewardSystem.recordProgress('abc_explorer');
      }
    },

    speakCurrent() {
      const item = window.GameData.alphabets[this.currentIndex];
      if (!item || !window.AudioSystem) return;

      const speechText = `${item.letter}... ${item.word}! ... ${item.phonics}`;
      window.AudioSystem.speak(speechText);
      if (window.Buddy) {
        window.Buddy.say(`${item.letter} is for ${item.word}! 🌟`, false);
      }
    },

    next() {
      this.currentIndex = (this.currentIndex + 1) % window.GameData.alphabets.length;
      this.render();
      if (window.AudioSystem) window.AudioSystem.playClick();
    },

    prev() {
      this.currentIndex = (this.currentIndex - 1 + window.GameData.alphabets.length) % window.GameData.alphabets.length;
      this.render();
      if (window.AudioSystem) window.AudioSystem.playClick();
    },

    goToLetter(letter) {
      const idx = window.GameData.alphabets.findIndex(a => a.letter === letter);
      if (idx !== -1) {
        this.currentIndex = idx;
        this.render();
      }
    },

    renderAlphabetGrid() {
      const grid = document.getElementById('abc-picker-grid');
      if (!grid) return;

      grid.innerHTML = window.GameData.alphabets.map(item => `
        <button class="abc-picker-btn" data-letter="${item.letter}" style="--btn-accent:${item.color}">
          <span class="picker-letter">${item.letter}</span>
          <span class="picker-emoji">${item.emoji}</span>
        </button>
      `).join('');

      grid.querySelectorAll('.abc-picker-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const ltr = btn.getAttribute('data-letter');
          this.goToLetter(ltr);
          const modal = document.getElementById('modal-abc-picker');
          if (modal) modal.classList.remove('visible');
        });
      });
    }
  };

  /* =============================================================
     2. DRAW 3-LETTER WORDS CONTROLLER
     ============================================================= */
  const WordDrawer = {
    currentWordIndex: 0,

    init() {
      this.currentWordIndex = 0;
      this.renderWordPicker();
      this.loadCurrentWord();
    },

    loadCurrentWord() {
      const item = window.GameData.threeLetterWords[this.currentWordIndex];
      if (!item) return;

      const titleEl = document.getElementById('draw-word-title');
      const emojiEl = document.getElementById('draw-word-emoji');
      if (titleEl) titleEl.textContent = item.word;
      if (emojiEl) emojiEl.textContent = item.emoji;

      // Update active state in chip list
      const list = document.getElementById('words-quick-list');
      if (list) {
        list.querySelectorAll('.word-chip-btn').forEach(b => {
          if (b.getAttribute('data-word') === item.word) {
            b.classList.add('active');
            b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } else {
            b.classList.remove('active');
          }
        });
      }

      if (window.DrawingEngine) {
        window.DrawingEngine.loadWord(item.word);
      }
    },

    goToWord(word) {
      const idx = window.GameData.threeLetterWords.findIndex(w => w.word === word);
      if (idx !== -1) {
        this.currentWordIndex = idx;
        this.loadCurrentWord();
        if (window.AudioSystem) window.AudioSystem.playClick();
      }
    },

    next() {
      this.currentWordIndex = (this.currentWordIndex + 1) % window.GameData.threeLetterWords.length;
      this.loadCurrentWord();
      if (window.AudioSystem) window.AudioSystem.playClick();
    },

    prev() {
      this.currentWordIndex = (this.currentWordIndex - 1 + window.GameData.threeLetterWords.length) % window.GameData.threeLetterWords.length;
      this.loadCurrentWord();
      if (window.AudioSystem) window.AudioSystem.playClick();
    },

    renderWordPicker() {
      const list = document.getElementById('words-quick-list');
      if (!list) return;

      list.innerHTML = window.GameData.threeLetterWords.map((w, idx) => `
        <button class="word-chip-btn ${idx === this.currentWordIndex ? 'active' : ''}" data-word="${w.word}">
          <span class="word-chip-emoji">${w.emoji}</span>
          <span class="word-chip-text">${w.word}</span>
        </button>
      `).join('');

      list.querySelectorAll('.word-chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-word');
          this.goToWord(target);
        });
      });
    }
  };

  /* =============================================================
     3. MULTIPLE CHOICE QUIZ ENGINE (Animals, Fruits, Veggies, Colors, Shapes, GK)
     ============================================================= */
  const QuizEngine = {
    currentCategory: 'animals',
    currentQuestion: null,
    answered: false,
    scoreInStreak: 0,

    start(category) {
      this.currentCategory = category;
      this.scoreInStreak = 0;
      this.nextQuestion();
    },

    nextQuestion() {
      this.answered = false;
      const question = this.generateQuestion(this.currentCategory);
      this.currentQuestion = question;
      this.renderQuestion(question);
    },

    generateQuestion(cat) {
      let title = '';
      let prompt = '';
      let displayEmoji = '';
      let options = [];
      let badgeId = '';

      switch (cat) {
        case 'animals': {
          badgeId = 'animal_expert';
          const target = window.GameData.animals[Math.floor(Math.random() * window.GameData.animals.length)];
          const distractors = pickRandom(window.GameData.animals, 2, target);
          title = '🐾 Who is this?';
          prompt = 'What animal is this?';
          displayEmoji = target.emoji;
          options = shuffle([
            { text: target.name, emoji: target.emoji, correct: true },
            { text: distractors[0].name, emoji: distractors[0].emoji, correct: false },
            { text: distractors[1].name, emoji: distractors[1].emoji, correct: false }
          ]);
          break;
        }
        case 'fruits': {
          badgeId = 'fruit_friend';
          const target = window.GameData.fruits[Math.floor(Math.random() * window.GameData.fruits.length)];
          const distractors = pickRandom(window.GameData.fruits, 2, target);
          title = '🍎 Sweet Fruits!';
          prompt = 'What fruit is this?';
          displayEmoji = target.emoji;
          options = shuffle([
            { text: target.name, emoji: target.emoji, correct: true },
            { text: distractors[0].name, emoji: distractors[0].emoji, correct: false },
            { text: distractors[1].name, emoji: distractors[1].emoji, correct: false }
          ]);
          break;
        }
        case 'vegetables': {
          badgeId = 'veggie_hero';
          const target = window.GameData.vegetables[Math.floor(Math.random() * window.GameData.vegetables.length)];
          const distractors = pickRandom(window.GameData.vegetables, 2, target);
          title = '🥕 Tasty Veggies!';
          prompt = 'What vegetable is this?';
          displayEmoji = target.emoji;
          options = shuffle([
            { text: target.name, emoji: target.emoji, correct: true },
            { text: distractors[0].name, emoji: distractors[0].emoji, correct: false },
            { text: distractors[1].name, emoji: distractors[1].emoji, correct: false }
          ]);
          break;
        }
        case 'colors': {
          badgeId = 'color_master';
          const target = window.GameData.colors[Math.floor(Math.random() * window.GameData.colors.length)];
          const distractors = pickRandom(window.GameData.colors, 2, target);
          title = '🎨 Colorful Fun!';
          prompt = `Which one is ${target.name.toUpperCase()}?`;
          displayEmoji = target.items.split(' ')[0] || target.emoji;
          options = shuffle([
            { text: target.name, colorHex: target.hex, emoji: target.emoji, correct: true },
            { text: distractors[0].name, colorHex: distractors[0].hex, emoji: distractors[0].emoji, correct: false },
            { text: distractors[1].name, colorHex: distractors[1].hex, emoji: distractors[1].emoji, correct: false }
          ]);
          break;
        }
        case 'shapes': {
          badgeId = 'shape_wizard';
          const target = window.GameData.shapes[Math.floor(Math.random() * window.GameData.shapes.length)];
          const distractors = pickRandom(window.GameData.shapes, 2, target);
          title = '🔺 Super Shapes!';
          prompt = `Find the ${target.name}!`;
          displayEmoji = target.emoji;
          options = shuffle([
            { text: target.name, emoji: target.emoji, correct: true },
            { text: distractors[0].name, emoji: distractors[0].emoji, correct: false },
            { text: distractors[1].name, emoji: distractors[1].emoji, correct: false }
          ]);
          break;
        }
        case 'gk': {
          badgeId = 'little_genius';
          const target = window.GameData.gkQuestions[Math.floor(Math.random() * window.GameData.gkQuestions.length)];
          title = '🧠 Little Genius GK';
          prompt = target.question;
          displayEmoji = target.emoji;
          options = shuffle(target.options);
          break;
        }
      }

      return { title, prompt, displayEmoji, options, badgeId, category: cat };
    },

    renderQuestion(q) {
      const titleEl = document.getElementById('quiz-title');
      const promptEl = document.getElementById('quiz-prompt');
      const displayEl = document.getElementById('quiz-display-emoji');
      const optionsContainer = document.getElementById('quiz-options-grid');

      if (titleEl) titleEl.textContent = q.title;
      if (promptEl) promptEl.textContent = q.prompt;
      if (displayEl) displayEl.textContent = q.displayEmoji;

      if (window.AudioSystem) {
        window.AudioSystem.speak(q.prompt);
      }

      if (optionsContainer) {
        optionsContainer.innerHTML = q.options.map((opt, idx) => `
          <button class="quiz-option-btn" data-index="${idx}" ${opt.colorHex ? `style="--opt-color:${opt.colorHex}"` : ''}>
            ${opt.emoji ? `<span class="quiz-opt-emoji">${opt.emoji}</span>` : ''}
            <span class="quiz-opt-text">${opt.text}</span>
          </button>
        `).join('');

        optionsContainer.querySelectorAll('.quiz-option-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            this.handleChoice(btn, q.options[idx]);
          });
        });
      }
    },

    handleChoice(btnEl, option) {
      if (this.answered && option.correct) return;

      if (option.correct) {
        this.answered = true;
        btnEl.classList.add('correct-choice');

        if (window.AudioSystem) {
          window.AudioSystem.playCorrect();
          setTimeout(() => {
            window.AudioSystem.speak(`Yes! That is ${option.text}!`);
          }, 350);
        }

        if (window.Buddy) {
          window.Buddy.celebrate();
        }

        if (window.RewardSystem) {
          window.RewardSystem.addStars(1);
          window.RewardSystem.recordProgress(this.currentQuestion.badgeId);
        }

        this.scoreInStreak++;

        // Next question after friendly delay
        setTimeout(() => {
          this.nextQuestion();
        }, 1600);
      } else {
        // Soft encouraging wobble
        btnEl.classList.add('wrong-choice');
        setTimeout(() => btnEl.classList.remove('wrong-choice'), 600);

        if (window.AudioSystem) {
          window.AudioSystem.playWrong();
        }

        if (window.Buddy) {
          window.Buddy.tryAgain();
        }
      }
    }
  };

  /* =============================================================
     4. ANIMAL SOUNDS GAME CONTROLLER
     ============================================================= */
  const AnimalSoundGame = {
    currentTarget: null,
    answered: false,

    init() {
      this.nextRound();
    },

    nextRound() {
      this.answered = false;
      const target = window.GameData.animals[Math.floor(Math.random() * window.GameData.animals.length)];
      const distractors = pickRandom(window.GameData.animals, 2, target);
      this.currentTarget = target;

      const options = shuffle([
        { text: target.name, emoji: target.emoji, correct: true },
        { text: distractors[0].name, emoji: distractors[0].emoji, correct: false },
        { text: distractors[1].name, emoji: distractors[1].emoji, correct: false }
      ]);

      this.render(options);
      // Play animal call
      setTimeout(() => this.playSound(), 500);
    },

    playSound() {
      if (!this.currentTarget || !window.AudioSystem) return;
      const soundBtn = document.getElementById('btn-play-animal-sound');
      if (soundBtn) soundBtn.classList.add('pulse-playing');

      window.AudioSystem.playAnimalSound(this.currentTarget.soundType, () => {
        if (soundBtn) soundBtn.classList.remove('pulse-playing');
      });
    },

    render(options) {
      const optionsContainer = document.getElementById('sound-options-grid');
      if (!optionsContainer) return;

      optionsContainer.innerHTML = options.map((opt, idx) => `
        <button class="sound-option-btn" data-index="${idx}">
          <span class="sound-opt-emoji">${opt.emoji}</span>
          <span class="sound-opt-text">${opt.text}</span>
        </button>
      `).join('');

      optionsContainer.querySelectorAll('.sound-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          this.handleChoice(btn, options[idx]);
        });
      });
    },

    handleChoice(btnEl, option) {
      if (this.answered && option.correct) return;

      if (option.correct) {
        this.answered = true;
        btnEl.classList.add('correct-choice');

        if (window.AudioSystem) {
          window.AudioSystem.playCorrect();
          setTimeout(() => {
            window.AudioSystem.speak(`Yes! That is a ${this.currentTarget.name}! ${this.currentTarget.soundName}!`);
          }, 400);
        }

        if (window.Buddy) {
          window.Buddy.celebrate(`Wonderful! ${this.currentTarget.name} says ${this.currentTarget.soundName}! 🐾`);
        }

        if (window.RewardSystem) {
          window.RewardSystem.addStars(2);
          window.RewardSystem.recordProgress('sound_master');
        }

        setTimeout(() => this.nextRound(), 2000);
      } else {
        btnEl.classList.add('wrong-choice');
        setTimeout(() => btnEl.classList.remove('wrong-choice'), 600);

        if (window.AudioSystem) window.AudioSystem.playWrong();
        if (window.Buddy) window.Buddy.tryAgain();
      }
    }
  };

  /* =============================================================
     5. NUMBERS & COUNTING GAME CONTROLLER
     ============================================================= */
  const NumbersGame = {
    currentMode: 'count', // 'count' or 'sequence'
    targetNumber: 5,
    answered: false,

    init() {
      this.nextQuestion();
    },

    nextQuestion() {
      this.answered = false;
      this.currentMode = Math.random() > 0.4 ? 'count' : 'sequence';

      if (this.currentMode === 'count') {
        this.setupCountMode();
      } else {
        this.setupSequenceMode();
      }
    },

    setupCountMode() {
      // Numbers 1 to 10 for counting
      const num = Math.floor(Math.random() * 8) + 2; // 2 to 9
      this.targetNumber = num;

      const emojis = ['⭐', '🍎', '🎈', '🍓', '🐶', '🐥', '🍬', '🚗'];
      const pickedEmoji = emojis[Math.floor(Math.random() * emojis.length)];

      const displayContainer = document.getElementById('numbers-display-area');
      const promptEl = document.getElementById('numbers-prompt');

      if (promptEl) promptEl.textContent = 'How many can you count?';

      if (displayContainer) {
        displayContainer.innerHTML = Array.from({ length: num }).map((_, i) => `
          <span class="counting-item" style="animation-delay:${i * 0.08}s">${pickedEmoji}</span>
        `).join('');
      }

      // Voice instruction
      if (window.AudioSystem) {
        window.AudioSystem.speak('How many can you count? Let us count them!');
      }

      // Generate options
      const dist1 = num + (Math.random() > 0.5 ? 1 : -1);
      const dist2 = num + (dist1 > num ? -1 : 2);
      const options = shuffle([
        { val: num, correct: true },
        { val: Math.max(1, dist1), correct: false },
        { val: Math.max(1, dist2), correct: false }
      ]);

      this.renderOptions(options);
    },

    setupSequenceMode() {
      // Which number comes next? e.g. 1 -> 2 -> 3 -> ?
      const start = Math.floor(Math.random() * 6) + 1; // 1 to 6
      const seq = [start, start + 1, start + 2];
      const target = start + 3;
      this.targetNumber = target;

      const displayContainer = document.getElementById('numbers-display-area');
      const promptEl = document.getElementById('numbers-prompt');

      if (promptEl) promptEl.textContent = 'Which number comes next?';

      if (displayContainer) {
        displayContainer.innerHTML = `
          <div class="number-sequence-row">
            ${seq.map(n => `<span class="sequence-num-box">${n}</span>`).join('<span class="sequence-arrow">➔</span>')}
            <span class="sequence-arrow">➔</span>
            <span class="sequence-num-box mystery-box">?</span>
          </div>
        `;
      }

      if (window.AudioSystem) {
        window.AudioSystem.speak(`What comes next? ${seq.join(', ')}?`);
      }

      const options = shuffle([
        { val: target, correct: true },
        { val: target - 1, correct: false },
        { val: target + 1, correct: false }
      ]);

      this.renderOptions(options);
    },

    renderOptions(options) {
      const container = document.getElementById('numbers-options-grid');
      if (!container) return;

      container.innerHTML = options.map((opt, idx) => `
        <button class="number-option-btn" data-index="${idx}">
          ${opt.val}
        </button>
      `).join('');

      container.querySelectorAll('.number-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          this.handleChoice(btn, options[idx]);
        });
      });
    },

    handleChoice(btnEl, option) {
      if (this.answered && option.correct) return;

      if (option.correct) {
        this.answered = true;
        btnEl.classList.add('correct-choice');

        if (window.AudioSystem) {
          window.AudioSystem.playCorrect();
          // Count aloud up to the number!
          let countWords = [];
          for (let i = 1; i <= this.targetNumber; i++) {
            const found = window.GameData.numbers.find(n => n.num === i);
            countWords.push(found ? found.word : `${i}`);
          }
          const speech = `${countWords.join(', ')}! Great! There are ${this.targetNumber}!`;
          setTimeout(() => window.AudioSystem.speak(speech), 300);
        }

        if (window.Buddy) {
          window.Buddy.celebrate(`Super counting! That is ${this.targetNumber}! ⭐`);
        }

        if (window.RewardSystem) {
          window.RewardSystem.addStars(1);
          window.RewardSystem.recordProgress('number_star');
        }

        setTimeout(() => this.nextQuestion(), 2400);
      } else {
        btnEl.classList.add('wrong-choice');
        setTimeout(() => btnEl.classList.remove('wrong-choice'), 600);

        if (window.AudioSystem) window.AudioSystem.playWrong();
        if (window.Buddy) window.Buddy.tryAgain();
      }
    }
  };

  /* =============================================================
     6. MATCHING & CONNECTING GAME
     ============================================================= */
  const MatchingGame = {
    pairs: [],
    selectedLeft: null,
    matchedCount: 0,

    init() {
      this.selectedLeft = null;
      this.matchedCount = 0;
      this.setupPairs();
      this.render();
    },

    setupPairs() {
      // Pick 4 diverse pairs
      const allPool = [
        { left: '🐶', right: 'Dog', label: 'Dog' },
        { left: '🐱', right: 'Cat', label: 'Cat' },
        { left: '🍎', right: 'Apple', label: 'Apple' },
        { left: '🍌', right: 'Banana', label: 'Banana' },
        { left: '🥕', right: 'Carrot', label: 'Carrot' },
        { left: '🔺', right: 'Triangle', label: 'Triangle' },
        { left: '⭐', right: 'Star', label: 'Star' },
        { left: '⚪', right: 'Circle', label: 'Circle' },
        { left: '3', right: '⭐⭐⭐', label: 'Three' },
        { left: '2', right: '🍎🍎', label: 'Two' }
      ];

      const chosen = shuffle(allPool).slice(0, 4);
      this.pairs = chosen;
    },

    render() {
      const leftCol = document.getElementById('match-left-col');
      const rightCol = document.getElementById('match-right-col');
      if (!leftCol || !rightCol) return;

      const leftItems = this.pairs.map((p, i) => ({ id: i, text: p.left }));
      const rightItems = shuffle(this.pairs.map((p, i) => ({ id: i, text: p.right })));

      leftCol.innerHTML = leftItems.map(item => `
        <button class="match-card match-left" data-id="${item.id}">
          <span class="match-content">${item.text}</span>
        </button>
      `).join('');

      rightCol.innerHTML = rightItems.map(item => `
        <button class="match-card match-right" data-id="${item.id}">
          <span class="match-content">${item.text}</span>
        </button>
      `).join('');

      // Wire listeners
      leftCol.querySelectorAll('.match-left').forEach(btn => {
        btn.addEventListener('click', () => this.handleLeftClick(btn));
      });

      rightCol.querySelectorAll('.match-right').forEach(btn => {
        btn.addEventListener('click', () => this.handleRightClick(btn));
      });

      if (window.AudioSystem) {
        window.AudioSystem.speak('Tap a card on the left, then find its match on the right!');
      }
    },

    handleLeftClick(btn) {
      if (btn.classList.contains('matched')) return;

      document.querySelectorAll('.match-left').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      this.selectedLeft = btn;

      if (window.AudioSystem) window.AudioSystem.playClick();
    },

    handleRightClick(btn) {
      if (btn.classList.contains('matched') || !this.selectedLeft) return;

      const leftId = this.selectedLeft.getAttribute('data-id');
      const rightId = btn.getAttribute('data-id');

      if (leftId === rightId) {
        // Correct match!
        this.selectedLeft.classList.remove('selected');
        this.selectedLeft.classList.add('matched');
        btn.classList.add('matched');

        const matchedItem = this.pairs[parseInt(leftId, 10)];
        if (window.AudioSystem) {
          window.AudioSystem.playCorrect();
          window.AudioSystem.speak(`${matchedItem.label}! Match!`);
        }

        this.selectedLeft = null;
        this.matchedCount++;

        if (this.matchedCount === this.pairs.length) {
          // All matched!
          setTimeout(() => {
            if (window.AudioSystem) window.AudioSystem.playCelebration();
            if (window.Buddy) window.Buddy.celebrate('Incredible matching! You matched all pairs! 🎉');
            if (window.RewardSystem) window.RewardSystem.addStars(4);
            if (window.App && window.App.launchConfetti) window.App.launchConfetti();

            setTimeout(() => this.init(), 2800);
          }, 600);
        }
      } else {
        // Wrong match
        btn.classList.add('wrong-choice');
        setTimeout(() => btn.classList.remove('wrong-choice'), 600);
        if (window.AudioSystem) window.AudioSystem.playWrong();
        if (window.Buddy) window.Buddy.tryAgain();
      }
    }
  };

  /* =============================================================
     7. MEMORY FLIP CARDS GAME
     ============================================================= */
  const MemoryGame = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    isLockBoard: false,

    init() {
      this.flippedCards = [];
      this.matchedPairs = 0;
      this.isLockBoard = false;
      this.setupBoard();
    },

    setupBoard() {
      // 4 pairs = 8 cards (perfect for 3-6 age group)
      const emojiPool = ['🐶', '🐱', '🍎', '🥕', '⭐', '🎈', '🚗', '🦁', '🍓', '🍌'];
      const chosen = shuffle(emojiPool).slice(0, 4);
      const cardList = [];

      chosen.forEach((emoji, idx) => {
        cardList.push({ id: idx, emoji });
        cardList.push({ id: idx, emoji });
      });

      this.cards = shuffle(cardList);
      this.render();
    },

    render() {
      const grid = document.getElementById('memory-cards-grid');
      if (!grid) return;

      grid.innerHTML = this.cards.map((card, idx) => `
        <div class="memory-card" data-index="${idx}" data-id="${card.id}">
          <div class="memory-card-inner">
            <div class="memory-card-front">
              <span class="memory-star-pattern">⭐</span>
            </div>
            <div class="memory-card-back">
              <span class="memory-emoji">${card.emoji}</span>
            </div>
          </div>
        </div>
      `).join('');

      grid.querySelectorAll('.memory-card').forEach(cardEl => {
        cardEl.addEventListener('click', () => this.flipCard(cardEl));
      });

      if (window.AudioSystem) {
        window.AudioSystem.speak('Find the matching pairs!');
      }
    },

    flipCard(cardEl) {
      if (this.isLockBoard) return;
      if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

      cardEl.classList.add('flipped');
      if (window.AudioSystem) window.AudioSystem.playClick();

      this.flippedCards.push(cardEl);

      if (this.flippedCards.length === 2) {
        this.checkForMatch();
      }
    },

    checkForMatch() {
      const [card1, card2] = this.flippedCards;
      const id1 = card1.getAttribute('data-id');
      const id2 = card2.getAttribute('data-id');

      if (id1 === id2) {
        // Matched!
        card1.classList.add('matched');
        card2.classList.add('matched');
        this.flippedCards = [];
        this.matchedPairs++;

        if (window.AudioSystem) window.AudioSystem.playCorrect();

        if (this.matchedPairs === 4) {
          // Completed game!
          setTimeout(() => {
            if (window.AudioSystem) window.AudioSystem.playCelebration();
            if (window.Buddy) window.Buddy.celebrate('You found all the matching cards! Superstar! 🌟');
            if (window.RewardSystem) window.RewardSystem.addStars(4);
            if (window.App && window.App.launchConfetti) window.App.launchConfetti();

            setTimeout(() => this.init(), 3000);
          }, 600);
        }
      } else {
        // Not a match: flip back gently
        this.isLockBoard = true;
        if (window.AudioSystem) window.AudioSystem.playWrong();

        setTimeout(() => {
          card1.classList.remove('flipped');
          card2.classList.remove('flipped');
          this.flippedCards = [];
          this.isLockBoard = false;
        }, 1100);
      }
    }
  };

  /* =============================================================
     8. TODAY'S DAILY 5-CHALLENGE
     ============================================================= */
  const DailyChallenge = {
    currentStep: 0,
    steps: [],
    answered: false,

    init() {
      this.currentStep = 0;
      this.generate5Steps();
      this.loadStep();
    },

    generate5Steps() {
      this.steps = [
        { cat: 'animals', label: 'Mission 1: Find the Animal' },
        { cat: 'fruits', label: 'Mission 2: Delicious Fruits' },
        { cat: 'colors', label: 'Mission 3: Spot the Color' },
        { cat: 'shapes', label: 'Mission 4: Super Shapes' },
        { cat: 'gk', label: 'Mission 5: Little Genius' }
      ];
    },

    loadStep() {
      this.answered = false;
      const step = this.steps[this.currentStep];
      if (!step) {
        this.completeChallenge();
        return;
      }

      const progressEl = document.getElementById('daily-challenge-progress-fill');
      const stepIndicator = document.getElementById('daily-challenge-step-text');
      const titleEl = document.getElementById('daily-step-title');
      const promptEl = document.getElementById('daily-step-prompt');
      const emojiEl = document.getElementById('daily-step-emoji');
      const optionsContainer = document.getElementById('daily-step-options');

      if (progressEl) progressEl.style.width = `${((this.currentStep + 1) / 5) * 100}%`;
      if (stepIndicator) stepIndicator.textContent = `Mission ${this.currentStep + 1} of 5`;

      const q = QuizEngine.generateQuestion(step.cat);
      if (titleEl) titleEl.textContent = step.label;
      if (promptEl) promptEl.textContent = q.prompt;
      if (emojiEl) emojiEl.textContent = q.displayEmoji;

      if (window.AudioSystem) {
        window.AudioSystem.speak(q.prompt);
      }

      if (optionsContainer) {
        optionsContainer.innerHTML = q.options.map((opt, idx) => `
          <button class="quiz-option-btn" data-index="${idx}" ${opt.colorHex ? `style="--opt-color:${opt.colorHex}"` : ''}>
            ${opt.emoji ? `<span class="quiz-opt-emoji">${opt.emoji}</span>` : ''}
            <span class="quiz-opt-text">${opt.text}</span>
          </button>
        `).join('');

        optionsContainer.querySelectorAll('.quiz-option-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (this.answered) return;
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            const opt = q.options[idx];

            if (opt.correct) {
              this.answered = true;
              btn.classList.add('correct-choice');
              if (window.AudioSystem) {
                window.AudioSystem.playCorrect();
                window.AudioSystem.speak(`Yes! That is ${opt.text}!`);
              }
              if (window.Buddy) window.Buddy.celebrate();
              if (window.RewardSystem) window.RewardSystem.addStars(1);

              setTimeout(() => {
                this.currentStep++;
                if (this.currentStep < 5) {
                  this.loadStep();
                } else {
                  this.completeChallenge();
                }
              }, 1600);
            } else {
              btn.classList.add('wrong-choice');
              setTimeout(() => btn.classList.remove('wrong-choice'), 600);
              if (window.AudioSystem) window.AudioSystem.playWrong();
              if (window.Buddy) window.Buddy.tryAgain();
            }
          });
        });
      }
    },

    completeChallenge() {
      if (window.AudioSystem) {
        window.AudioSystem.playCelebration();
        window.AudioSystem.playBadge();
      }
      if (window.Buddy) {
        window.Buddy.celebrate("Hooray! You completed Today's Challenge! ⭐ +10 Stars!");
      }
      if (window.RewardSystem) {
        window.RewardSystem.addStars(10);
      }
      if (window.App && window.App.launchConfetti) {
        window.App.launchConfetti();
      }

      const modal = document.getElementById('modal-daily-complete');
      if (modal) modal.classList.add('visible');
    }
  };

  return {
    LearnABC,
    WordDrawer,
    QuizEngine,
    AnimalSoundGame,
    NumbersGame,
    MatchingGame,
    MemoryGame,
    DailyChallenge
  };
})();
