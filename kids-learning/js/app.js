/**
 * Kids Learning Adventure — Main App Coordinator & Router
 * Manages screen transitions, confetti particle engine, audio toggles, and parent gate.
 */

window.App = (function () {
  'use strict';

  let currentScreenId = 'screen-splash';
  let historyStack = [];
  let confettiParticles = [];
  let confettiAnimFrame = null;

  function init() {
    // 1. Initialize data & storage
    if (window.RewardSystem) window.RewardSystem.load();
    if (window.Buddy) window.Buddy.init();

    // 2. Initialize drawing canvases
    if (window.DrawingEngine) {
      window.DrawingEngine.setCanvas('draw-letter-canvas');
    }

    // 3. Setup global event listeners
    setupNavigationEvents();
    setupAudioToggleEvents();
    setupParentGateEvents();
    setupDrawingToolbars();
    setupConfettiCanvas();

    // 4. Start at splash screen
    showScreen('screen-splash', false);
  }

  function showScreen(screenId, addToHistory = true) {
    if (addToHistory && currentScreenId && currentScreenId !== screenId && currentScreenId !== 'screen-splash') {
      historyStack.push(currentScreenId);
    }

    document.querySelectorAll('.app-screen').forEach(screen => {
      screen.classList.remove('active-screen');
    });

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active-screen');
      currentScreenId = screenId;
    }

    // Header visibility & back button
    const header = document.getElementById('global-header');
    const backBtn = document.getElementById('btn-header-back');
    const homeBtn = document.getElementById('btn-header-home');

    if (screenId === 'screen-splash') {
      if (header) header.style.display = 'none';
    } else {
      if (header) header.style.display = 'flex';
      if (screenId === 'screen-home') {
        if (backBtn) backBtn.style.display = 'none';
        if (homeBtn) homeBtn.style.display = 'none';
      } else {
        if (backBtn) backBtn.style.display = 'inline-flex';
        if (homeBtn) homeBtn.style.display = 'inline-flex';
      }
    }

    // Route actions on entering screen
    onScreenEnter(screenId);
  }

  function goBack() {
    if (window.AudioSystem) window.AudioSystem.playClick();
    if (historyStack.length > 0) {
      const prev = historyStack.pop();
      showScreen(prev, false);
    } else {
      showScreen('screen-home', false);
    }
  }

  function onScreenEnter(screenId) {
    window.scrollTo(0, 0);

    switch (screenId) {
      case 'screen-home':
        if (window.Buddy) {
          window.Buddy.greet();
        }
        break;

      case 'screen-learn-abc':
        if (window.GamesManager) {
          window.GamesManager.LearnABC.init();
        }
        break;

      case 'screen-draw-abc':
        if (window.DrawingEngine) {
          window.DrawingEngine.loadLetter('A');
        }
        break;

      case 'screen-words':
        if (window.GamesManager) {
          window.GamesManager.WordDrawer.init();
        }
        break;

      case 'screen-animal-sounds':
        if (window.GamesManager) {
          window.GamesManager.AnimalSoundGame.init();
        }
        break;

      case 'screen-numbers':
        if (window.GamesManager) {
          window.GamesManager.NumbersGame.init();
        }
        break;

      case 'screen-matching':
        if (window.GamesManager) {
          window.GamesManager.MatchingGame.init();
        }
        break;

      case 'screen-memory':
        if (window.GamesManager) {
          window.GamesManager.MemoryGame.init();
        }
        break;
    }
  }

  function setupNavigationEvents() {
    // Splash Play Button
    const btnStart = document.getElementById('btn-splash-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (window.AudioSystem) {
          window.AudioSystem.init();
          window.AudioSystem.playCelebration();
        }
        showScreen('screen-home');
      });
    }

    // Header Back & Home
    const btnBack = document.getElementById('btn-header-back');
    if (btnBack) btnBack.addEventListener('click', goBack);

    const btnHome = document.getElementById('btn-header-home');
    if (btnHome) {
      btnHome.addEventListener('click', () => {
        if (window.AudioSystem) window.AudioSystem.playClick();
        historyStack = [];
        showScreen('screen-home', false);
      });
    }

    // Home Grid Category Buttons
    document.querySelectorAll('.category-card, [data-route]').forEach(card => {
      card.addEventListener('click', () => {
        const route = card.getAttribute('data-route');
        const quizCat = card.getAttribute('data-quiz-category');

        if (window.AudioSystem) window.AudioSystem.playClick();

        if (quizCat && window.GamesManager) {
          showScreen('screen-quiz');
          window.GamesManager.QuizEngine.start(quizCat);
        } else if (route) {
          showScreen(route);
        }
      });
    });

    // Learn ABC Nav
    const btnAbcNext = document.getElementById('btn-abc-next');
    const btnAbcPrev = document.getElementById('btn-abc-prev');
    const btnAbcSpeak = document.getElementById('btn-abc-speak');
    const btnAbcOpenPicker = document.getElementById('btn-abc-open-picker');

    if (btnAbcNext) btnAbcNext.addEventListener('click', () => window.GamesManager.LearnABC.next());
    if (btnAbcPrev) btnAbcPrev.addEventListener('click', () => window.GamesManager.LearnABC.prev());
    if (btnAbcSpeak) btnAbcSpeak.addEventListener('click', () => window.GamesManager.LearnABC.speakCurrent());
    if (btnAbcOpenPicker) {
      btnAbcOpenPicker.addEventListener('click', () => {
        const modal = document.getElementById('modal-abc-picker');
        if (modal) modal.classList.add('visible');
      });
    }

    // Close ABC picker modal
    const btnCloseAbcPicker = document.getElementById('btn-close-abc-picker');
    if (btnCloseAbcPicker) {
      btnCloseAbcPicker.addEventListener('click', () => {
        const modal = document.getElementById('modal-abc-picker');
        if (modal) modal.classList.remove('visible');
      });
    }

    // Animal Sound Play Again
    const btnPlaySound = document.getElementById('btn-play-animal-sound');
    if (btnPlaySound) {
      btnPlaySound.addEventListener('click', () => {
        if (window.GamesManager) window.GamesManager.AnimalSoundGame.playSound();
      });
    }

    // Rewards modal open/close
    const btnOpenRewards = document.getElementById('btn-open-rewards');
    const btnCloseRewards = document.getElementById('btn-close-rewards');
    const modalRewards = document.getElementById('modal-rewards');

    if (btnOpenRewards) {
      btnOpenRewards.addEventListener('click', () => {
        if (window.AudioSystem) window.AudioSystem.playClick();
        if (window.RewardSystem) window.RewardSystem.renderRewardsModal();
        if (modalRewards) modalRewards.classList.add('visible');
      });
    }
    if (btnCloseRewards) {
      btnCloseRewards.addEventListener('click', () => {
        if (window.AudioSystem) window.AudioSystem.playClick();
        if (modalRewards) modalRewards.classList.remove('visible');
      });
    }

    // Tracing Success Modal Actions
    const btnTracingNext = document.getElementById('btn-tracing-next');
    if (btnTracingNext) {
      btnTracingNext.addEventListener('click', () => {
        const modal = document.getElementById('modal-tracing-success');
        if (modal) modal.classList.remove('visible');

        if (currentScreenId === 'screen-draw-abc') {
          // Advance to next letter
          const current = window.DrawingEngine.currentTargetLetter;
          const idx = window.GameData.alphabets.findIndex(a => a.letter === current);
          const nextIdx = (idx + 1) % window.GameData.alphabets.length;
          const nextLetter = window.GameData.alphabets[nextIdx].letter;
          window.DrawingEngine.loadLetter(nextLetter);
        }
      });
    }

    // Word Assembly Modal Close
    const btnCloseAssembly = document.getElementById('btn-close-word-assembly');
    if (btnCloseAssembly) {
      btnCloseAssembly.addEventListener('click', () => {
        const modal = document.getElementById('modal-word-assembly');
        if (modal) modal.classList.remove('visible');
        if (window.GamesManager) window.GamesManager.WordDrawer.next();
      });
    }

    // Daily Challenge Button on Home
    const btnDailyChallenge = document.getElementById('btn-daily-challenge');
    if (btnDailyChallenge) {
      btnDailyChallenge.addEventListener('click', () => {
        if (window.AudioSystem) window.AudioSystem.playClick();
        showScreen('screen-daily');
        if (window.GamesManager) window.GamesManager.DailyChallenge.init();
      });
    }

    const btnCloseDailyModal = document.getElementById('btn-close-daily-modal');
    if (btnCloseDailyModal) {
      btnCloseDailyModal.addEventListener('click', () => {
        const modal = document.getElementById('modal-daily-complete');
        if (modal) modal.classList.remove('visible');
        showScreen('screen-home');
      });
    }
  }

  function setupAudioToggleEvents() {
    const btnVoice = document.getElementById('btn-toggle-voice');
    const btnSound = document.getElementById('btn-toggle-sound');

    if (btnVoice) {
      btnVoice.addEventListener('click', () => {
        if (window.AudioSystem) {
          window.AudioSystem.voiceEnabled = !window.AudioSystem.voiceEnabled;
          btnVoice.classList.toggle('active', window.AudioSystem.voiceEnabled);
          btnVoice.textContent = window.AudioSystem.voiceEnabled ? '🗣️ Voice' : '🔇 Mute';
          if (window.AudioSystem.voiceEnabled) {
            window.AudioSystem.speak('Voice is on!');
          } else {
            window.AudioSystem.stopSpeaking();
          }
        }
      });
    }

    if (btnSound) {
      btnSound.addEventListener('click', () => {
        if (window.AudioSystem) {
          window.AudioSystem.soundEnabled = !window.AudioSystem.soundEnabled;
          btnSound.classList.toggle('active', window.AudioSystem.soundEnabled);
          btnSound.textContent = window.AudioSystem.soundEnabled ? '🔔 Sounds' : '🔕 Off';
          if (window.AudioSystem.soundEnabled) {
            window.AudioSystem.playClick();
          }
        }
      });
    }

    // Voice Chooser Modal
    const btnChooseVoice = document.getElementById('btn-choose-voice');
    const modalVoicePicker = document.getElementById('modal-voice-picker');
    const btnCloseVoicePicker = document.getElementById('btn-close-voice-picker');
    const voiceListContainer = document.getElementById('voice-picker-list');

    function renderVoicePickerList() {
      if (!voiceListContainer || !window.AudioSystem) return;
      const voices = window.AudioSystem.getFriendlyVoices();
      const currentVoiceName = window.AudioSystem.preferredVoiceName;

      if (voices.length === 0) {
        voiceListContainer.innerHTML = `<p style="padding:16px;color:#64748B;">Standard browser voice is active.</p>`;
        return;
      }

      voiceListContainer.innerHTML = voices.map(v => {
        const isActive = v.name === currentVoiceName;
        let avatarEmoji = '👩';
        const lower = v.name.toLowerCase();
        if (lower.includes('daniel') || lower.includes('male') || lower.includes('rishi') || lower.includes('eddy') || lower.includes('reed')) {
          avatarEmoji = '👨';
        } else if (lower.includes('flo') || lower.includes('sandy') || lower.includes('shelley') || lower.includes('tessa')) {
          avatarEmoji = '👧';
        }

        return `
          <div class="voice-item-card ${isActive ? 'active-voice' : ''}" data-uri="${v.voiceURI}">
            <div class="voice-info-wrap">
              <span class="voice-avatar-emoji">${avatarEmoji}</span>
              <div>
                <div class="voice-name-text">${v.name}</div>
                <div class="voice-sub-text">${v.lang} ${isActive ? '• Active ⭐' : ''}</div>
              </div>
            </div>
            <button class="voice-select-btn">${isActive ? 'Active' : 'Choose'}</button>
          </div>
        `;
      }).join('');

      voiceListContainer.querySelectorAll('.voice-item-card').forEach(card => {
        card.addEventListener('click', () => {
          const uri = card.getAttribute('data-uri');
          if (window.AudioSystem) {
            window.AudioSystem.setVoiceByURI(uri);
            renderVoicePickerList();
          }
        });
      });
    }

    // Speaking Pace buttons
    const speedButtons = document.querySelectorAll('.btn-speed-choice');
    function updateSpeedButtonsUI() {
      const curSpeed = window.AudioSystem ? window.AudioSystem.speechRate : 0.82;
      speedButtons.forEach(btn => {
        const s = parseFloat(btn.getAttribute('data-speed'));
        const isActive = Math.abs(s - curSpeed) < 0.05;
        btn.style.background = isActive ? '#10B981' : '#E2E8F0';
        btn.style.color = isActive ? '#ffffff' : '#334155';
      });
    }

    speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const s = parseFloat(btn.getAttribute('data-speed'));
        if (window.AudioSystem) {
          window.AudioSystem.speechRate = s;
          updateSpeedButtonsUI();
          window.AudioSystem.speak("This is my gentle speaking pace!");
        }
      });
    });

    if (btnChooseVoice) {
      btnChooseVoice.addEventListener('click', () => {
        renderVoicePickerList();
        updateSpeedButtonsUI();
        if (modalVoicePicker) modalVoicePicker.classList.add('visible');
      });
    }

    if (btnCloseVoicePicker) {
      btnCloseVoicePicker.addEventListener('click', () => {
        if (modalVoicePicker) modalVoicePicker.classList.remove('visible');
      });
    }
  }

  function setupParentGateEvents() {
    const btnOpenParent = document.getElementById('btn-open-parent-zone');
    const modalGate = document.getElementById('modal-parent-gate');
    const modalParentZone = document.getElementById('modal-parent-zone');
    const btnCloseGate = document.getElementById('btn-close-parent-gate');
    const btnCloseZone = document.getElementById('btn-close-parent-zone');
    const gateQuestionEl = document.getElementById('parent-gate-question');
    const gateOptionsEl = document.getElementById('parent-gate-options');

    let gateAnswer = 10;

    function generateMathGate() {
      const a = Math.floor(Math.random() * 5) + 3; // 3 to 7
      const b = Math.floor(Math.random() * 5) + 2; // 2 to 6
      gateAnswer = a + b;

      if (gateQuestionEl) {
        gateQuestionEl.textContent = `Parents Only: What is ${a} + ${b}?`;
      }

      const opts = [gateAnswer, gateAnswer - 1, gateAnswer + 2].sort(() => Math.random() - 0.5);
      if (gateOptionsEl) {
        gateOptionsEl.innerHTML = opts.map(val => `
          <button class="gate-opt-btn" data-val="${val}">${val}</button>
        `).join('');

        gateOptionsEl.querySelectorAll('.gate-opt-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = parseInt(btn.getAttribute('data-val'), 10);
            if (val === gateAnswer) {
              if (modalGate) modalGate.classList.remove('visible');
              if (window.RewardSystem) window.RewardSystem.renderParentZoneStats();
              if (modalParentZone) modalParentZone.classList.add('visible');
            } else {
              btn.classList.add('wrong');
              setTimeout(() => generateMathGate(), 600);
            }
          });
        });
      }
    }

    if (btnOpenParent) {
      btnOpenParent.addEventListener('click', () => {
        generateMathGate();
        if (modalGate) modalGate.classList.add('visible');
      });
    }

    if (btnCloseGate) {
      btnCloseGate.addEventListener('click', () => {
        if (modalGate) modalGate.classList.remove('visible');
      });
    }

    if (btnCloseZone) {
      btnCloseZone.addEventListener('click', () => {
        if (modalParentZone) modalParentZone.classList.remove('visible');
      });
    }

    // Reset Progress Button in Parent Zone
    const btnResetProgress = document.getElementById('btn-parent-reset-progress');
    if (btnResetProgress) {
      btnResetProgress.addEventListener('click', () => {
        const confirmed = confirm('Are you sure you want to reset all learning stars, badges, and progress?');
        if (confirmed && window.RewardSystem) {
          window.RewardSystem.resetAllProgress();
          alert('Progress has been cleanly reset.');
        }
      });
    }
  }

  function setupDrawingToolbars() {
    // Palette buttons
    document.querySelectorAll('.draw-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        document.querySelectorAll('.draw-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.DrawingEngine) window.DrawingEngine.setColor(color);
      });
    });

    // Clear & Undo
    const btnClear = document.getElementById('btn-draw-clear');
    const btnUndo = document.getElementById('btn-draw-undo');
    const btnWordsClear = document.getElementById('btn-words-clear');
    const btnWordsUndo = document.getElementById('btn-words-undo');

    if (btnClear) btnClear.addEventListener('click', () => window.DrawingEngine && window.DrawingEngine.clearCanvas());
    if (btnUndo) btnUndo.addEventListener('click', () => window.DrawingEngine && window.DrawingEngine.undoLastStroke());
    if (btnWordsClear) btnWordsClear.addEventListener('click', () => window.DrawingEngine && window.DrawingEngine.clearCanvas());
    if (btnWordsUndo) btnWordsUndo.addEventListener('click', () => window.DrawingEngine && window.DrawingEngine.undoLastStroke());

    // Next / Prev Letter buttons in Drawing Screen
    const btnDrawNextLtr = document.getElementById('btn-draw-next-letter');
    const btnDrawPrevLtr = document.getElementById('btn-draw-prev-letter');

    if (btnDrawNextLtr) {
      btnDrawNextLtr.addEventListener('click', () => {
        const current = window.DrawingEngine.currentTargetLetter;
        const idx = window.GameData.alphabets.findIndex(a => a.letter === current);
        const nextLetter = window.GameData.alphabets[(idx + 1) % window.GameData.alphabets.length].letter;
        window.DrawingEngine.loadLetter(nextLetter);
      });
    }

    if (btnDrawPrevLtr) {
      btnDrawPrevLtr.addEventListener('click', () => {
        const current = window.DrawingEngine.currentTargetLetter;
        const idx = window.GameData.alphabets.findIndex(a => a.letter === current);
        const prevLetter = window.GameData.alphabets[(idx - 1 + window.GameData.alphabets.length) % window.GameData.alphabets.length].letter;
        window.DrawingEngine.loadLetter(prevLetter);
      });
    }
  }

  /* -------------------------------------------------------------
     CONFETTI PARTICLE ENGINE (Pure HTML5 Canvas)
     ------------------------------------------------------------- */
  function setupConfettiCanvas() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
  }

  function launchConfetti(count = 70) {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = ['#FF4D6D', '#FFB703', '#06D6A0', '#118AB2', '#8338EC', '#FF70A6', '#FFD166'];

    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 50,
        w: Math.random() * 12 + 8,
        h: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: Math.random() * 4 + 3,
        vx: (Math.random() - 0.5) * 4,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }

    if (!confettiAnimFrame) {
      renderConfetti();
    }
  }

  function renderConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.y += p.vy;
      p.x += p.vx;
      p.rot += p.rotSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();

      if (p.y > canvas.height + 20) {
        confettiParticles.splice(i, 1);
      }
    }

    if (confettiParticles.length > 0) {
      confettiAnimFrame = requestAnimationFrame(renderConfetti);
    } else {
      confettiAnimFrame = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    showScreen,
    goBack,
    launchConfetti
  };
})();
