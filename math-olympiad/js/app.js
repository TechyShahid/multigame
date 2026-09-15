// Math & Reasoning Olympiad Adventure — Vanilla Controller
import { WORLDS } from './worlds.js';
import { BADGES, MASCOTS } from './badges.js';
import { storage } from './storage.js';
import { audio } from './audio.js';
import { getQuestionsForSession } from './generator.js';
import { launchConfetti } from './confetti.js';

// Application State
let profile = storage.getProfile();
let currentScreen = 'screen-home';
let selectedGrade = profile.grade || 'lkg';

// Active gameplay state
let activeWorld = null;
let activeLevelNum = 1;
let activeMode = 'adventure'; // 'adventure' | 'olympiad' | 'practice' | 'daily'
let activePracticeCategory = 'counting';
let activePracticeDifficulty = 'easy';
let questions = [];
let currentQIndex = 0;
let isAnswered = false;
let sessionScore = 0;
let sessionCorrectCount = 0;
let remainingHints = 3;
let tappedItems = [];
let questionStartTime = Date.now();

// Olympiad state
let olyQuestions = [];
let olyIndex = 0;
let olyScore = 0;
let olyCorrect = 0;
let olyMissedTopics = [];
let olySeconds = 0;
let olyTimer = null;
let lastOlympiadResult = null;

// Parent Gate state
let gateNumA = 7;
let gateNumB = 8;
let gateInput = '';

// DOM Elements
const screenHome = document.getElementById('screen-home');
const screenWorlds = document.getElementById('screen-worlds');
const screenGame = document.getElementById('screen-game');
const screenOlympiad = document.getElementById('screen-olympiad');
const screenPractice = document.getElementById('screen-practice');
const screenDaily = document.getElementById('screen-daily');
const screenBadges = document.getElementById('screen-badges');
const screenParent = document.getElementById('screen-parent');

// Modals
const modalHint = document.getElementById('modal-hint');
const modalReward = document.getElementById('modal-reward');
const modalParentGate = document.getElementById('modal-parent-gate');
const modalCertificate = document.getElementById('modal-certificate');

// Initialize
function init() {
  audio.setSpeechEnabled(profile.speechEnabled);
  audio.setSoundEnabled(profile.soundEnabled);
  audio.setMusicEnabled(profile.musicEnabled);
  updateHeaderStats();
  updateAudioUI();
  renderHomeScreen();
  bindGlobalEvents();
}

function showScreen(screenId) {
  audio.playClick();
  const screens = [
    screenHome,
    screenWorlds,
    screenGame,
    screenOlympiad,
    screenPractice,
    screenDaily,
    screenBadges,
    screenParent,
  ];
  screens.forEach((s) => s.classList.remove('screen-active'));

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('screen-active');
    currentScreen = screenId;
  }

  // Update back button visibility
  const btnBack = document.getElementById('btn-header-back');
  btnBack.style.display = screenId === 'screen-home' ? 'none' : 'flex';

  // Screen-specific render calls
  if (screenId === 'screen-home') renderHomeScreen();
  if (screenId === 'screen-worlds') renderWorldsScreen();
  if (screenId === 'screen-practice') renderPracticeScreen();
  if (screenId === 'screen-badges') renderBadgesScreen();
  if (screenId === 'screen-parent') renderParentScreen();
}

function updateHeaderStats() {
  document.getElementById('stat-stars').textContent = profile.stars;
  document.getElementById('stat-gems').textContent = profile.gems;
  document.getElementById('stat-streak').textContent = `${profile.currentStreak}d`;
}

function updateAudioUI() {
  const isMuted = !profile.speechEnabled && !profile.soundEnabled;
  const btnGameMute = document.getElementById('btn-game-mute');
  if (btnGameMute) {
    btnGameMute.textContent = isMuted ? '🔇' : '🔊';
    btnGameMute.title = isMuted ? 'Unmute Audio (Turn Voice & Sounds On)' : 'Mute Audio (Silence Voice & Sounds)';
    btnGameMute.classList.toggle('muted', isMuted);
    btnGameMute.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
  }

  const btnSpeech = document.getElementById('btn-toggle-speech');
  if (btnSpeech) {
    btnSpeech.textContent = profile.speechEnabled ? '🔊' : '🔇';
    btnSpeech.classList.toggle('active', profile.speechEnabled);
    btnSpeech.title = profile.speechEnabled ? 'Voice Narration is ON (Click to mute)' : 'Voice Narration is OFF (Click to turn on)';
  }

  const btnSound = document.getElementById('btn-toggle-sound');
  if (btnSound) {
    btnSound.textContent = profile.soundEnabled ? '🔔' : '🔕';
    btnSound.classList.toggle('active', profile.soundEnabled);
    btnSound.title = profile.soundEnabled ? 'Sound Effects are ON (Click to mute)' : 'Sound Effects are OFF (Click to turn on)';
  }

  const btnMusic = document.getElementById('btn-toggle-music');
  if (btnMusic) {
    btnMusic.classList.toggle('active', profile.musicEnabled);
  }
}

function toggleGameMute() {
  const willMute = profile.speechEnabled || profile.soundEnabled;
  if (willMute) {
    profile.speechEnabled = false;
    profile.soundEnabled = false;
    profile.musicEnabled = false;
    audio.setSpeechEnabled(false);
    audio.setSoundEnabled(false);
    audio.setMusicEnabled(false);
    audio.stopNarration();
    document.getElementById('game-mascot-msg').textContent = 'Audio muted 🔇 Tap 🔊 anytime to turn it back on!';
  } else {
    profile.speechEnabled = true;
    profile.soundEnabled = true;
    audio.setSpeechEnabled(true);
    audio.setSoundEnabled(true);
    audio.playClick();
    document.getElementById('game-mascot-msg').textContent = 'Audio turned on! 🔊';
  }
  storage.saveProfile(profile);
  updateAudioUI();
}

// -------------------------------------------------------------
// Screen 1: Home Page
// -------------------------------------------------------------
function renderHomeScreen() {
  updateHeaderStats();
  document.getElementById('home-child-name').textContent = profile.childName;
  document.getElementById('overview-stars').textContent = profile.stars;
  document.getElementById('overview-trophies').textContent = profile.trophies;
  document.getElementById('overview-streak').textContent = `${profile.currentStreak} Days`;

  const completedCount = Object.keys(profile.completedLevels).length;
  document.getElementById('overview-levels').textContent = `${completedCount} / 50`;

  const mascot = MASCOTS.find((m) => m.id === profile.mascot) || MASCOTS[0];
  document.getElementById('home-mascot-avatar').textContent = mascot.emoji;
  document.getElementById('header-title').textContent = 'Olympiad Quest';
  document.getElementById('header-subtitle').textContent = 'Math & Reasoning Adventure';
}

// -------------------------------------------------------------
// Screen 2: Worlds Map
// -------------------------------------------------------------
function renderWorldsScreen() {
  updateHeaderStats();
  const isLkg = selectedGrade === 'lkg';
  document.getElementById('header-title').textContent = isLkg ? 'LKG Worlds' : 'Class 1 Worlds';
  document.getElementById('header-subtitle').textContent = 'Adventure Map';
  document.getElementById('worlds-map-title').textContent = isLkg ? 'LKG Adventure Worlds 🗺️' : 'Class 1 Adventure Worlds 🗺️';
  document.getElementById('worlds-total-stars').textContent = `${profile.stars} Stars`;

  const container = document.getElementById('worlds-list');
  container.innerHTML = '';

  WORLDS.forEach((world, idx) => {
    const isUnlocked = idx === 0 || profile.unlockedWorlds.includes(world.id) || idx <= profile.unlockedWorlds.length;

    let worldStars = 0;
    for (let l = 1; l <= world.levelsCount; l++) {
      const key = `${selectedGrade}-${world.id}-${l}`;
      if (profile.completedLevels[key]) worldStars += profile.completedLevels[key].stars;
    }

    const card = document.createElement('div');
    card.className = `world-card ${isUnlocked ? '' : 'locked'}`;
    card.style.background = isUnlocked ? world.gradient : '#cbd5e1';

    let levelsHtml = '';
    for (let l = 1; l <= world.levelsCount; l++) {
      const key = `${selectedGrade}-${world.id}-${l}`;
      const comp = profile.completedLevels[key];
      const prevKey = `${selectedGrade}-${world.id}-${l - 1}`;
      const levelUnlocked = isUnlocked && (l === 1 || profile.completedLevels[prevKey]);

      let starsTxt = '';
      if (comp) {
        starsTxt = '⭐'.repeat(comp.stars);
      }

      levelsHtml += `
        <button class="btn-level-pin" data-world="${world.id}" data-level="${l}" ${levelUnlocked ? '' : 'disabled'}>
          <span>${l}</span>
          ${comp ? `<span class="pin-stars">${starsTxt}</span>` : ''}
        </button>
      `;
    }

    card.innerHTML = `
      <div class="world-header">
        <div class="world-title-group">
          <div class="world-emoji">${world.emoji}</div>
          <div class="world-titles">
            <span style="font-size: 0.75rem; font-weight: 900; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 999px;">WORLD ${world.order}</span>
            <h3>${world.title}</h3>
            <p>${world.subtitle}</p>
          </div>
        </div>
        <div class="world-stars-badge">
          <span>⭐</span> <span>${worldStars} / ${world.levelsCount * 3}</span>
        </div>
      </div>
      <div class="levels-row">
        ${levelsHtml}
      </div>
    `;

    container.appendChild(card);
  });

  // Attach level clicks
  container.querySelectorAll('.btn-level-pin').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wId = btn.dataset.world;
      const lNum = parseInt(btn.dataset.level, 10);
      const w = WORLDS.find((x) => x.id === wId);
      if (w) startAdventureLevel(w, lNum);
    });
  });
}

// -------------------------------------------------------------
// Gameplay Loop (Adventure, Daily, Practice)
// -------------------------------------------------------------
function startAdventureLevel(world, levelNum) {
  activeWorld = world;
  activeLevelNum = levelNum;
  activeMode = 'adventure';

  const diff = levelNum <= 2 ? 'easy' : levelNum <= 4 ? 'medium' : 'hard';
  questions = getQuestionsForSession(selectedGrade, world.category, 5, diff);
  startSession();
}

function startDailyChallenge() {
  activeWorld = null;
  activeMode = 'daily';
  questions = getQuestionsForSession(selectedGrade, undefined, 10);
  startSession();
}

function startPracticeSession(grade, category, difficulty) {
  selectedGrade = grade;
  activeWorld = null;
  activeMode = 'practice';
  activePracticeCategory = category;
  activePracticeDifficulty = difficulty;
  questions = getQuestionsForSession(grade, category, 5, difficulty);
  startSession();
}

function startSession() {
  currentQIndex = 0;
  sessionScore = 0;
  sessionCorrectCount = 0;
  remainingHints = 3;
  showScreen('screen-game');
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  isAnswered = false;
  tappedItems = [];
  questionStartTime = Date.now();
  updateAudioUI();

  const q = questions[currentQIndex];
  if (!q) {
    handleLevelCompleted();
    return;
  }

  // Header and progress
  const modeTitle = activeWorld
    ? `${activeWorld.title} - L${activeLevelNum}`
    : activeMode === 'daily'
    ? '🌟 Daily Quest'
    : '🎯 Practice Gym';
  document.getElementById('header-title').textContent = modeTitle;
  document.getElementById('header-subtitle').textContent = `Question ${currentQIndex + 1} of ${questions.length}`;

  const pct = Math.round(((currentQIndex) / questions.length) * 100);
  document.getElementById('game-progress-fill').style.width = `${Math.max(10, pct)}%`;
  document.getElementById('game-progress-text').textContent = `Question ${currentQIndex + 1} / ${questions.length}`;
  document.getElementById('game-score-badge').textContent = `+${sessionScore} pts`;
  document.getElementById('btn-game-hint').textContent = `💡 Hint (${remainingHints})`;

  // Question text
  document.getElementById('game-q-text').textContent = q.questionText;

  // Speak question
  if (profile.speechEnabled) {
    audio.speakText(q.narrationText || q.questionText, q);
  }

  // Visual Arena
  const arena = document.getElementById('game-visual-arena');
  arena.innerHTML = '';

  if (q.questionType === 'visual-counting' && q.visualData?.items) {
    const wrap = document.createElement('div');
    wrap.className = 'visual-items-wrap';
    q.visualData.items.forEach((emoji, idx) => {
      const itemBtn = document.createElement('button');
      itemBtn.className = 'visual-tap-item';
      itemBtn.innerHTML = `<span>${emoji}</span>`;
      itemBtn.addEventListener('click', () => {
        if (isAnswered) return;
        audio.playClick();
        if (tappedItems.includes(idx)) {
          tappedItems = tappedItems.filter((i) => i !== idx);
          itemBtn.classList.remove('tapped');
          const badge = itemBtn.querySelector('.tap-badge');
          if (badge) badge.remove();
        } else {
          tappedItems.push(idx);
          itemBtn.classList.add('tapped');
          const badge = document.createElement('span');
          badge.className = 'tap-badge';
          badge.textContent = tappedItems.length;
          itemBtn.appendChild(badge);
        }
      });
      wrap.appendChild(itemBtn);
    });
    arena.appendChild(wrap);

    const tip = document.createElement('p');
    tip.style.fontSize = '0.8rem';
    tip.style.fontWeight = '700';
    tip.style.color = '#92400e';
    tip.textContent = '💡 Tip: Tap the items to count them!';
    arena.appendChild(tip);
  } else if (q.questionType === 'memory' && q.visualData?.items) {
    const memWrap = document.createElement('div');
    memWrap.style.display = 'flex';
    memWrap.style.gap = '10px';
    q.visualData.items.forEach((it) => {
      const pill = document.createElement('div');
      pill.className = 'visual-card-pill';
      pill.textContent = it;
      memWrap.appendChild(pill);
    });
    arena.appendChild(memWrap);

    const timerLabel = document.createElement('span');
    timerLabel.style.fontSize = '0.85rem';
    timerLabel.style.fontWeight = '800';
    timerLabel.style.color = '#7c3aed';
    timerLabel.textContent = '👀 Look carefully! Memorize the items!';
    arena.appendChild(timerLabel);
  } else if (q.visualData?.items) {
    const wrap = document.createElement('div');
    wrap.className = 'visual-items-wrap';
    q.visualData.items.forEach((it) => {
      const pill = document.createElement('div');
      pill.className = 'visual-card-pill';
      pill.textContent = it;
      wrap.appendChild(pill);
    });
    arena.appendChild(wrap);
  }

  // Answer buttons
  const answersGrid = document.getElementById('game-answers-grid');
  answersGrid.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = `btn-answer opt-${idx % 4}`;
    btn.innerHTML = `
      <span class="opt-letter">${letters[idx]}</span>
      <span>${opt}</span>
    `;
    btn.addEventListener('click', () => handleAnswerSelect(opt, btn));
    answersGrid.appendChild(btn);
  });

  // Hide feedback box
  document.getElementById('game-feedback-box').style.display = 'none';

  // Mascot message
  const mascot = MASCOTS.find((m) => m.id === profile.mascot) || MASCOTS[0];
  document.getElementById('game-mascot-avatar').textContent = mascot.emoji;
  document.getElementById('game-mascot-msg').textContent = 'Take your time, tap the answer when you are ready!';
}

function handleAnswerSelect(selectedAnswer, clickedBtn) {
  if (isAnswered) return;
  isAnswered = true;

  const q = questions[currentQIndex];
  const isCorrect = selectedAnswer === q.correctAnswer;
  const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

  // Save analytics
  profile = storage.recordQuestionAnswer(q.category, isCorrect, timeSpent);
  updateHeaderStats();

  const allBtns = document.querySelectorAll('.btn-answer');
  allBtns.forEach((b) => (b.disabled = true));

  if (isCorrect) {
    audio.playCorrect();
    sessionScore += q.points;
    sessionCorrectCount += 1;
    clickedBtn.classList.add('correct');
  } else {
    audio.playEncourage();
    clickedBtn.classList.add('wrong');
    // Highlight correct button
    allBtns.forEach((b) => {
      if (b.textContent.includes(q.correctAnswer)) b.classList.add('correct');
    });
  }

  // Show Feedback
  const feedbackBox = document.getElementById('game-feedback-box');
  feedbackBox.className = `feedback-box ${isCorrect ? 'correct' : 'wrong'}`;
  document.getElementById('feedback-icon').textContent = isCorrect ? '🎉' : '💡';
  document.getElementById('feedback-title').textContent = isCorrect ? 'Awesome Job! ⭐' : "Good try! Let's look carefully 👀";
  document.getElementById('feedback-desc').textContent = q.explanation;
  feedbackBox.style.display = 'flex';
  feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Update mascot
  const cheerMsg = isCorrect
    ? 'Super job! Keep up the brilliant thinking! ⭐'
    : 'Good try! You learn something new every time! 💡';
  document.getElementById('game-mascot-msg').textContent = cheerMsg;

  // Teacher speaks explanation
  if (profile.speechEnabled) {
    const feedbackSpoken = isCorrect
      ? `Yay! Wonderful job! ${q.explanation.replace(/[🍎🍌⭐🐶🐱🚗🎈🐟🌸🐥🧁🍪🍬🔴🔵🟢🟡🔺⏹️⭕❓]/gu, '')}`
      : `Good try, little star! Let's look carefully. ${q.explanation.replace(/[🍎🍌⭐🐶🐱🚗🎈🐟🌸🐥🧁🍪🍬🔴🔵🟢🟡🔺⏹️⭕❓]/gu, '')}`;
    setTimeout(() => {
      audio.speakText(feedbackSpoken);
    }, 400);
  }
}

function handleLevelCompleted() {
  audio.playVictory();
  launchConfetti();

  const ratio = sessionCorrectCount / questions.length;
  let starsEarned = 1;
  if (ratio >= 0.8) starsEarned = 3;
  else if (ratio >= 0.5) starsEarned = 2;

  if (activeMode === 'adventure' && activeWorld) {
    profile = storage.completeLevel(activeWorld.id, activeLevelNum, selectedGrade, starsEarned, sessionScore);
  } else if (activeMode === 'daily') {
    profile = storage.completeLevel('daily-quest', 1, selectedGrade, starsEarned, sessionScore);
  }

  updateHeaderStats();

  document.getElementById('reward-modal-title').textContent = 'Level Completed! 🌟';
  document.getElementById('reward-modal-subtitle').textContent = activeWorld
    ? `${activeWorld.title} • Level ${activeLevelNum}`
    : 'Daily Quest Complete!';
  document.getElementById('reward-modal-stars').textContent = '⭐'.repeat(starsEarned);
  document.getElementById('reward-modal-score').textContent = `+${sessionScore}`;
  document.getElementById('reward-modal-gems').textContent = '+10 💎';

  modalReward.style.display = 'flex';
}

// -------------------------------------------------------------
// Olympiad Exam Mode
// -------------------------------------------------------------
function startOlympiadMode() {
  const isLkg = selectedGrade === 'lkg';
  const count = isLkg ? 20 : 25;
  document.getElementById('oly-intro-count').textContent = `${count} Challenges`;

  document.getElementById('olympiad-intro').style.display = 'flex';
  document.getElementById('olympiad-results').style.display = 'none';
  showScreen('screen-olympiad');
}

function beginOlympiadExam() {
  const isLkg = selectedGrade === 'lkg';
  const count = isLkg ? 20 : 25;

  activeMode = 'olympiad';
  questions = getQuestionsForSession(selectedGrade, undefined, count);
  currentQIndex = 0;
  sessionScore = 0;
  sessionCorrectCount = 0;
  remainingHints = 3;
  olyMissedTopics = [];

  showScreen('screen-game');
  renderCurrentQuestion();
}

// -------------------------------------------------------------
// Practice Mode
// -------------------------------------------------------------
function renderPracticeScreen() {
  const topics = [
    { id: 'counting', label: 'Visual Counting', emoji: '🔢' },
    { id: 'addition', label: 'Addition Fun', emoji: '➕' },
    { id: 'subtraction', label: 'Subtraction Valley', emoji: '➖' },
    { id: 'shapes', label: 'Shapes & Geometry', emoji: '📐' },
    { id: 'patterns', label: 'Patterns & Sequences', emoji: '🪐' },
    { id: 'logic', label: 'Logic & Odd One Out', emoji: '🧩' },
  ];

  const grid = document.getElementById('practice-topics-grid');
  grid.innerHTML = '';

  topics.forEach((t) => {
    const btn = document.createElement('button');
    const isSelected = activePracticeCategory === t.id;
    btn.style.cssText = `
      padding: 12px; border-radius: 14px; border: 2px solid ${isSelected ? '#10b981' : '#e2e8f0'};
      background: ${isSelected ? '#ecfdf5' : 'white'}; font-weight: 800; font-size: 0.95rem;
      text-align: left; display: flex; align-items: center; gap: 8px; color: #1e293b;
    `;
    btn.innerHTML = `<span style="font-size: 1.5rem;">${t.emoji}</span> <span>${t.label}</span>`;
    btn.addEventListener('click', () => {
      audio.playClick();
      activePracticeCategory = t.id;
      renderPracticeScreen();
    });
    grid.appendChild(btn);
  });
}

// -------------------------------------------------------------
// Badges & Mascots Screen
// -------------------------------------------------------------
function renderBadgesScreen() {
  document.getElementById('input-child-name').value = profile.childName;

  const currentMascot = MASCOTS.find((m) => m.id === profile.mascot) || MASCOTS[0];
  document.getElementById('badges-mascot-avatar').textContent = currentMascot.emoji;

  // Render mascots
  const picker = document.getElementById('mascots-picker-grid');
  picker.innerHTML = '';
  MASCOTS.forEach((m) => {
    const isSelected = profile.mascot === m.id;
    const btn = document.createElement('button');
    btn.style.cssText = `
      padding: 12px; border-radius: 16px; border: 2px solid ${isSelected ? '#ec4899' : '#e2e8f0'};
      background: ${isSelected ? '#fdf2f8' : 'white'}; text-align: center; display: flex; flex-direction: column;
      align-items: center; gap: 4px;
    `;
    btn.innerHTML = `
      <span style="font-size: 2.2rem;">${m.emoji}</span>
      <strong style="font-size: 0.95rem; color: #1e293b;">${m.name}</strong>
      <span style="font-size: 0.75rem; color: #64748b;">${m.desc}</span>
      ${isSelected ? '<span style="font-size: 0.7rem; font-weight: 900; background: #ec4899; color: white; padding: 2px 8px; border-radius: 999px;">ACTIVE</span>' : ''}
    `;
    btn.addEventListener('click', () => {
      audio.playClick();
      profile = storage.setMascot(m.id);
      audio.speakText(`Hi! I am your companion, ${m.name}!`);
      renderBadgesScreen();
    });
    picker.appendChild(btn);
  });

  // Render Badges
  const badgesGrid = document.getElementById('badges-showcase-grid');
  badgesGrid.innerHTML = '';
  BADGES.forEach((b) => {
    const isEarned = profile.badges.includes(b.id) || profile.stars >= 20;
    const card = document.createElement('div');
    card.style.cssText = `
      padding: 12px; border-radius: 14px; border: 2px solid ${isEarned ? '#fde68a' : '#e2e8f0'};
      background: ${isEarned ? '#fffbeb' : '#f8fafc'}; display: flex; align-items: center; gap: 10px;
      opacity: ${isEarned ? '1' : '0.6'};
    `;
    card.innerHTML = `
      <div style="width: 44px; height: 44px; border-radius: 12px; background: ${isEarned ? '#fef3c7' : '#e2e8f0'}; display: flex; align-items: center; justify-content: center; font-size: 24px;">
        ${isEarned ? b.icon : '🔒'}
      </div>
      <div>
        <strong style="font-size: 0.9rem; color: #1e293b; display: block;">${b.title}</strong>
        <span style="font-size: 0.75rem; color: #64748b;">${b.description}</span>
      </div>
    `;
    badgesGrid.appendChild(card);
  });
}

// -------------------------------------------------------------
// Parent Zone Dashboard
// -------------------------------------------------------------
function openParentGate() {
  gateNumA = Math.floor(Math.random() * 5) + 6;
  gateNumB = Math.floor(Math.random() * 5) + 4;
  gateInput = '';
  document.getElementById('parent-gate-question').textContent = `${gateNumA} × ${gateNumB} = ?`;
  document.getElementById('parent-gate-input').textContent = '--';
  modalParentGate.style.display = 'flex';
}

function renderParentScreen() {
  document.getElementById('parent-student-name').textContent = profile.childName;
  document.getElementById('parent-grade-label').textContent = `Grade: ${profile.grade === 'lkg' ? 'Lower Kindergarten (LKG)' : 'Class 1'}`;

  const { totalQuestions, correctQuestions, totalTimeSeconds, topicStats } = profile.analytics;
  const mins = Math.round(totalTimeSeconds / 60);
  document.getElementById('parent-learning-time').textContent = `${mins} mins`;

  const acc = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
  document.getElementById('parent-stat-acc').textContent = `${acc}%`;

  // Strong & weak topics
  let strong = 'Counting ⭐';
  let weak = 'Patterns 📚';
  let high = -1;
  let low = 101;

  Object.entries(topicStats).forEach(([cat, s]) => {
    if (s.attempted >= 2) {
      const a = Math.round((s.correct / s.attempted) * 100);
      if (a > high) { high = a; strong = cat.toUpperCase(); }
      if (a < low) { low = a; weak = cat.toUpperCase(); }
    }
  });

  document.getElementById('parent-stat-strong').textContent = strong;
  document.getElementById('parent-stat-weak').textContent = weak;

  // Bars
  const barsContainer = document.getElementById('parent-topics-bars');
  barsContainer.innerHTML = '';

  Object.entries(topicStats).forEach(([cat, s]) => {
    const tAcc = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0;
    const row = document.createElement('div');
    row.style.cssText = 'padding: 8px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;';
    row.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 800; text-transform: capitalize; margin-bottom: 4px;">
        <span>${cat}</span>
        <span style="color: ${tAcc >= 75 ? '#059669' : '#d97706'};">${tAcc}% (${s.correct}/${s.attempted})</span>
      </div>
      <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
        <div style="width: ${tAcc}%; height: 100%; background: ${tAcc >= 75 ? '#10b981' : '#f59e0b'}; border-radius: 999px;"></div>
      </div>
    `;
    barsContainer.appendChild(row);
  });
}

// -------------------------------------------------------------
// Global Event Listeners
// -------------------------------------------------------------
function bindGlobalEvents() {
  // Header Back
  document.getElementById('btn-header-back').addEventListener('click', () => {
    if (currentScreen === 'screen-game') {
      if (activeMode === 'adventure') showScreen('screen-worlds');
      else showScreen('screen-home');
    } else {
      showScreen('screen-home');
    }
  });

  // Arcade Exit: Stop narration cleanly when exiting to multigame arcade
  const handleArcadeExit = () => {
    audio.stopNarration();
  };
  const btnArcadeExit = document.getElementById('btn-arcade-exit');
  if (btnArcadeExit) btnArcadeExit.addEventListener('click', handleArcadeExit);
  const btnHomeExit = document.getElementById('btn-home-exit');
  if (btnHomeExit) btnHomeExit.addEventListener('click', handleArcadeExit);

  // Game Mute Button (In-Game Audio Toggle)
  const btnGameMute = document.getElementById('btn-game-mute');
  if (btnGameMute) {
    btnGameMute.addEventListener('click', () => {
      toggleGameMute();
    });
  }

  // Audio Toggles in Header
  const btnSpeech = document.getElementById('btn-toggle-speech');
  const btnSound = document.getElementById('btn-toggle-sound');
  const btnMusic = document.getElementById('btn-toggle-music');

  btnSpeech.addEventListener('click', () => {
    profile.speechEnabled = !profile.speechEnabled;
    storage.saveProfile(profile);
    audio.setSpeechEnabled(profile.speechEnabled);
    updateAudioUI();
    if (profile.speechEnabled) audio.speakText('Voice narration is on!');
  });

  btnSound.addEventListener('click', () => {
    profile.soundEnabled = !profile.soundEnabled;
    storage.saveProfile(profile);
    audio.setSoundEnabled(profile.soundEnabled);
    updateAudioUI();
    if (profile.soundEnabled) audio.playClick();
  });

  btnMusic.addEventListener('click', () => {
    profile.musicEnabled = !profile.musicEnabled;
    storage.saveProfile(profile);
    audio.setMusicEnabled(profile.musicEnabled);
    updateAudioUI();
  });

  // Home Grade Buttons
  document.getElementById('btn-play-lkg').addEventListener('click', () => {
    selectedGrade = 'lkg';
    profile = storage.setGrade('lkg');
    showScreen('screen-worlds');
  });

  document.getElementById('btn-play-class1').addEventListener('click', () => {
    selectedGrade = 'class1';
    profile = storage.setGrade('class1');
    showScreen('screen-worlds');
  });

  // Home Quick Modes
  document.getElementById('btn-mode-daily').addEventListener('click', () => showScreen('screen-daily'));
  document.getElementById('btn-mode-olympiad').addEventListener('click', () => startOlympiadMode());
  document.getElementById('btn-mode-practice').addEventListener('click', () => showScreen('screen-practice'));
  document.getElementById('btn-mode-badges').addEventListener('click', () => showScreen('screen-badges'));
  document.getElementById('btn-mode-parent').addEventListener('click', () => openParentGate());

  // Game Next Question
  document.getElementById('btn-game-next').addEventListener('click', () => {
    audio.playClick();
    currentQIndex += 1;
    if (currentQIndex < questions.length) {
      renderCurrentQuestion();
    } else {
      if (activeMode === 'olympiad') {
        showOlympiadResults();
      } else {
        handleLevelCompleted();
      }
    }
  });

  // Game Read Aloud (Unmutes voice narration if currently muted)
  document.getElementById('btn-game-speak').addEventListener('click', () => {
    if (!profile.speechEnabled) {
      profile.speechEnabled = true;
      storage.saveProfile(profile);
      audio.setSpeechEnabled(true);
      updateAudioUI();
    }
    const q = questions[currentQIndex];
    if (q) audio.speakText(q.narrationText || q.questionText, q);
  });

  // Hint Button
  document.getElementById('btn-game-hint').addEventListener('click', () => {
    if (remainingHints <= 0) return;
    audio.playClick();
    const q = questions[currentQIndex];
    if (q) {
      remainingHints -= 1;
      document.getElementById('btn-game-hint').textContent = `💡 Hint (${remainingHints})`;
      document.getElementById('hint-modal-text').textContent = q.hint;
      audio.speakText(q.hint);
      modalHint.style.display = 'flex';
    }
  });

  document.getElementById('btn-close-hint').addEventListener('click', () => {
    audio.playClick();
    modalHint.style.display = 'none';
  });

  document.getElementById('btn-hint-confirm').addEventListener('click', () => {
    audio.playClick();
    modalHint.style.display = 'none';
  });

  // Reward Modal Buttons
  document.getElementById('btn-reward-next-level').addEventListener('click', () => {
    modalReward.style.display = 'none';
    if (activeMode === 'adventure' && activeWorld && activeLevelNum < activeWorld.levelsCount) {
      startAdventureLevel(activeWorld, activeLevelNum + 1);
    } else {
      showScreen('screen-worlds');
    }
  });

  document.getElementById('btn-reward-world-map').addEventListener('click', () => {
    modalReward.style.display = 'none';
    showScreen('screen-worlds');
  });

  // Olympiad Start Button
  document.getElementById('btn-start-olympiad-exam').addEventListener('click', () => {
    beginOlympiadExam();
  });

  // Daily Challenge Start Button
  document.getElementById('btn-start-daily-quest').addEventListener('click', () => {
    startDailyChallenge();
  });

  // Practice Gym Controls
  document.getElementById('practice-grade-lkg').addEventListener('click', () => {
    document.getElementById('practice-grade-lkg').style.opacity = '1';
    document.getElementById('practice-grade-class1').style.opacity = '0.6';
    selectedGrade = 'lkg';
  });

  document.getElementById('practice-grade-class1').addEventListener('click', () => {
    document.getElementById('practice-grade-class1').style.opacity = '1';
    document.getElementById('practice-grade-lkg').style.opacity = '0.6';
    selectedGrade = 'class1';
  });

  ['diff-easy', 'diff-medium', 'diff-hard'].forEach((id) => {
    document.getElementById(id).addEventListener('click', (e) => {
      document.querySelectorAll('#screen-practice .btn-icon-toggle').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      activePracticeDifficulty = id.replace('diff-', '');
    });
  });

  document.getElementById('btn-start-practice-run').addEventListener('click', () => {
    startPracticeSession(selectedGrade, activePracticeCategory, activePracticeDifficulty);
  });

  // Badges Name Editor
  document.getElementById('btn-save-child-name').addEventListener('click', () => {
    const val = document.getElementById('input-child-name').value.trim();
    if (val) {
      audio.playClick();
      profile = storage.setChildName(val);
      audio.speakText(`Hello ${val}! Profile saved!`);
      renderBadgesScreen();
    }
  });

  // Parent Gate Keypad
  document.querySelectorAll('.btn-gate-key').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.playClick();
      if (gateInput.length < 3) {
        gateInput += btn.dataset.digit;
        document.getElementById('parent-gate-input').textContent = gateInput;
      }
    });
  });

  document.getElementById('btn-gate-clear').addEventListener('click', () => {
    audio.playClick();
    gateInput = '';
    document.getElementById('parent-gate-input').textContent = '--';
  });

  document.getElementById('btn-gate-submit').addEventListener('click', () => {
    const ans = parseInt(gateInput, 10);
    if (ans === gateNumA * gateNumB) {
      audio.playCorrect();
      modalParentGate.style.display = 'none';
      showScreen('screen-parent');
    } else {
      audio.playEncourage();
      gateInput = '';
      document.getElementById('parent-gate-input').textContent = 'Try!';
      setTimeout(() => {
        document.getElementById('parent-gate-input').textContent = '--';
      }, 700);
    }
  });

  document.getElementById('btn-close-parent-gate').addEventListener('click', () => {
    audio.playClick();
    modalParentGate.style.display = 'none';
  });

  // Parent Reset Progress
  document.getElementById('btn-parent-reset').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all game progress and stars?')) {
      audio.playClick();
      profile = storage.resetProgress();
      showScreen('screen-home');
    }
  });

  // Certificate Modal View & Print
  document.getElementById('btn-view-certificate').addEventListener('click', () => {
    audio.playClick();
    if (lastOlympiadResult) {
      document.getElementById('cert-child-name').textContent = profile.childName;
      document.getElementById('cert-grade-title').textContent = lastOlympiadResult.grade === 'lkg' ? 'Lower Kindergarten (LKG)' : 'Class 1';
      document.getElementById('cert-score-val').textContent = `${lastOlympiadResult.score} pts`;
      document.getElementById('cert-honor-val').textContent = lastOlympiadResult.rankTitle;
      document.getElementById('cert-date-val').textContent = lastOlympiadResult.date;
    }
    modalCertificate.style.display = 'flex';
  });

  document.getElementById('btn-close-cert').addEventListener('click', () => {
    audio.playClick();
    modalCertificate.style.display = 'none';
  });

  document.getElementById('btn-dismiss-cert').addEventListener('click', () => {
    audio.playClick();
    modalCertificate.style.display = 'none';
  });

  document.getElementById('btn-print-certificate').addEventListener('click', () => {
    audio.playClick();
    window.print();
  });

  document.getElementById('btn-oly-back-home').addEventListener('click', () => {
    showScreen('screen-home');
  });
}

function showOlympiadResults() {
  audio.playVictory();
  launchConfetti();

  const totalQ = questions.length;
  const acc = Math.round((sessionCorrectCount / totalQ) * 100);
  let stars = 1;
  let rank = 'Junior Math Explorer';
  if (acc >= 90) {
    stars = 3;
    rank = selectedGrade === 'lkg' ? 'Grand Math Prodigy 🏆' : 'Olympiad Gold Master 🏆';
  } else if (acc >= 70) {
    stars = 2;
    rank = selectedGrade === 'lkg' ? 'Super Thinker ⭐' : 'Distinction Scholar ⭐';
  }

  lastOlympiadResult = {
    id: `oly-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    grade: selectedGrade,
    score: sessionScore,
    totalQuestions: totalQ,
    correctAnswers: sessionCorrectCount,
    stars,
    rankTitle: rank,
    topicsToPractice: ['Patterns', 'Subtraction'],
    timeSeconds: 180,
  };

  profile = storage.completeOlympiad(lastOlympiadResult);
  updateHeaderStats();

  document.getElementById('oly-res-rank').textContent = rank;
  document.getElementById('oly-res-score').textContent = `${sessionScore} pts`;
  document.getElementById('oly-res-acc').textContent = `${acc}%`;
  document.getElementById('oly-res-correct').textContent = `${sessionCorrectCount} / ${totalQ}`;

  document.getElementById('olympiad-intro').style.display = 'none';
  document.getElementById('olympiad-results').style.display = 'flex';
  showScreen('screen-olympiad');
}

// Start
document.addEventListener('DOMContentLoaded', init);
