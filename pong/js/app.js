/**
 * Neon Pong — Application Controller & DOM Glue
 * Binds UI modals, difficulty settings, theme selection, audio controls,
 * and game state events.
 */

import { SoundEngine } from './audio.js';
import { PongGame, GAME_MODES, THEMES } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  SoundEngine.init();

  const canvas = document.getElementById('pong-canvas');
  const game = new PongGame(canvas);

  // DOM Elements
  const startModal = document.getElementById('modal-start');
  const pauseModal = document.getElementById('modal-pause');
  const gameoverModal = document.getElementById('modal-gameover');
  const statsModal = document.getElementById('modal-stats');
  const crtOverlay = document.getElementById('crt-overlay');

  // HUD
  const scoreLeftEl = document.getElementById('score-left');
  const scoreRightEl = document.getElementById('score-right');
  const rallyCountEl = document.getElementById('hud-rally');
  const rallyModeHud = document.getElementById('rally-mode-hud');
  const rallyScoreEl = document.getElementById('rally-score');
  const rallyLivesEl = document.getElementById('rally-lives');
  const labelLeftEl = document.getElementById('label-p1');
  const labelRightEl = document.getElementById('label-p2');

  // Controls & Buttons
  const btnStartMatch = document.getElementById('btn-start-match');
  const btnResume = document.getElementById('btn-resume');
  const btnRestart = document.getElementById('btn-restart');
  const btnQuit = document.getElementById('btn-quit');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnStatsOpen = document.getElementById('btn-stats-open');
  const btnStatsClose = document.getElementById('btn-stats-close');
  const btnPauseToggle = document.getElementById('btn-pause-toggle');
  const btnSfxToggle = document.getElementById('btn-sfx-toggle');
  const btnMusicToggle = document.getElementById('btn-music-toggle');
  const themeSelect = document.getElementById('select-theme');

  // Match Configuration state
  let selectedMode = GAME_MODES.PVP_AI;
  let selectedDifficulty = 'pro';
  let selectedTargetScore = 7;
  let powerupsEnabled = true;

  // Mode tabs
  const modeButtons = document.querySelectorAll('.mode-btn');
  const difficultySection = document.getElementById('difficulty-section');
  const targetScoreSection = document.getElementById('target-score-section');

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;

      if (selectedMode === GAME_MODES.SOLO_RALLY) {
        difficultySection.style.display = 'none';
        targetScoreSection.style.display = 'none';
      } else if (selectedMode === GAME_MODES.PVP_LOCAL) {
        difficultySection.style.display = 'none';
        targetScoreSection.style.display = 'block';
      } else {
        difficultySection.style.display = 'block';
        targetScoreSection.style.display = 'block';
      }
    });
  });

  // Difficulty tabs
  const diffButtons = document.querySelectorAll('.diff-btn');
  diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      diffButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.diff;
    });
  });

  // Target points tabs
  const scoreButtons = document.querySelectorAll('.score-btn');
  scoreButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      scoreButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTargetScore = parseInt(btn.dataset.score, 10);
    });
  });

  // Power-up toggle
  const powerupToggle = document.getElementById('toggle-powerups');
  if (powerupToggle) {
    powerupToggle.addEventListener('change', (e) => {
      powerupsEnabled = e.target.checked;
    });
  }

  // Audio UI Sync
  function syncAudioButtons() {
    if (btnSfxToggle) {
      btnSfxToggle.classList.toggle('active', SoundEngine.isSfxEnabled());
      btnSfxToggle.setAttribute('aria-pressed', SoundEngine.isSfxEnabled());
    }
    if (btnMusicToggle) {
      btnMusicToggle.classList.toggle('active', SoundEngine.isMusicEnabled());
      btnMusicToggle.setAttribute('aria-pressed', SoundEngine.isMusicEnabled());
    }
  }
  syncAudioButtons();

  if (btnSfxToggle) {
    btnSfxToggle.addEventListener('click', () => {
      SoundEngine.toggleSfx();
      syncAudioButtons();
    });
  }

  if (btnMusicToggle) {
    btnMusicToggle.addEventListener('click', () => {
      SoundEngine.toggleMusic();
      syncAudioButtons();
    });
  }

  // Theme Switcher
  function applyTheme(themeKey) {
    game.setTheme(themeKey);
    document.body.dataset.theme = themeKey;
    if (crtOverlay) {
      crtOverlay.style.display = themeKey === 'crt' ? 'block' : 'none';
    }
    try { localStorage.setItem('pong_theme', themeKey); } catch (_) {}
  }

  const savedTheme = localStorage.getItem('pong_theme') || 'neon';
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  }
  applyTheme(savedTheme);

  // Start match
  btnStartMatch.addEventListener('click', () => {
    startModal.classList.add('hidden');
    pauseModal.classList.add('hidden');
    gameoverModal.classList.add('hidden');

    // Update player labels in HUD
    if (selectedMode === GAME_MODES.PVP_AI) {
      labelLeftEl.textContent = 'PLAYER';
      labelRightEl.textContent = `AI (${selectedDifficulty.toUpperCase()})`;
      rallyModeHud.classList.add('hidden');
      document.getElementById('pvp-scores').classList.remove('hidden');
    } else if (selectedMode === GAME_MODES.PVP_LOCAL) {
      labelLeftEl.textContent = 'PLAYER 1 (W/S)';
      labelRightEl.textContent = 'PLAYER 2 (UP/DOWN)';
      rallyModeHud.classList.add('hidden');
      document.getElementById('pvp-scores').classList.remove('hidden');
    } else {
      rallyModeHud.classList.remove('hidden');
      document.getElementById('pvp-scores').classList.add('hidden');
    }

    game.startMatch(selectedMode, selectedDifficulty, selectedTargetScore, powerupsEnabled);
    if (SoundEngine.isMusicEnabled()) {
      SoundEngine.startMusic();
    }
  });

  // Pause & Resume
  if (btnPauseToggle) {
    btnPauseToggle.addEventListener('click', () => {
      if (game.state === 'playing') {
        game.pause();
      } else if (game.state === 'paused') {
        game.resume();
      }
    });
  }

  btnResume.addEventListener('click', () => {
    pauseModal.classList.add('hidden');
    game.resume();
  });

  btnRestart.addEventListener('click', () => {
    pauseModal.classList.add('hidden');
    game.startMatch(selectedMode, selectedDifficulty, selectedTargetScore, powerupsEnabled);
  });

  btnQuit.addEventListener('click', () => {
    pauseModal.classList.add('hidden');
    startModal.classList.remove('hidden');
    game.state = 'idle';
  });

  btnPlayAgain.addEventListener('click', () => {
    gameoverModal.classList.add('hidden');
    startModal.classList.remove('hidden');
  });

  // Game state callback
  game.onStateChange = (state) => {
    if (state === 'paused') {
      pauseModal.classList.remove('hidden');
    } else if (state === 'playing') {
      pauseModal.classList.add('hidden');
    } else if (state === 'gameover') {
      showGameOverModal();
    }
  };

  // Score update callback
  game.onScoreUpdate = () => {
    scoreLeftEl.textContent = game.paddleLeft.score;
    scoreRightEl.textContent = game.paddleRight.score;
    rallyCountEl.textContent = game.rally;

    if (selectedMode === GAME_MODES.SOLO_RALLY) {
      rallyScoreEl.textContent = game.rallyPoints;
      rallyLivesEl.textContent = '❤️'.repeat(Math.max(0, game.rallyLives));
    }
  };

  // Keep HUD rally updated in tick
  setInterval(() => {
    if (game.state === 'playing') {
      rallyCountEl.textContent = game.rally;
    }
  }, 100);

  function showGameOverModal() {
    const titleEl = document.getElementById('gameover-title');
    const subtitleEl = document.getElementById('gameover-subtitle');
    const finalScoreEl = document.getElementById('gameover-final-score');
    const maxRallyStat = document.getElementById('stat-max-rally');
    const topSpeedStat = document.getElementById('stat-top-speed');

    maxRallyStat.textContent = game.maxRally;
    topSpeedStat.textContent = `${game.topBallSpeed} px/f`;

    if (game.mode === GAME_MODES.SOLO_RALLY) {
      titleEl.textContent = 'RALLY COMPLETE';
      subtitleEl.textContent = `Score: ${game.rallyPoints} Points`;
      finalScoreEl.textContent = `Max Rally: ${game.maxRally}`;
    } else {
      const p1Won = game.winner === 'p1';
      if (game.mode === GAME_MODES.PVP_AI) {
        titleEl.textContent = p1Won ? 'VICTORY!' : 'DEFEAT';
        subtitleEl.textContent = p1Won ? 'You defeated the AI!' : 'The AI claimed victory!';
      } else {
        titleEl.textContent = p1Won ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
        subtitleEl.textContent = 'A thrilling match on the court!';
      }
      finalScoreEl.textContent = `${game.paddleLeft.score} - ${game.paddleRight.score}`;
    }

    gameoverModal.classList.remove('hidden');
  }

  // Career Statistics modal
  function renderStats() {
    try {
      const stats = JSON.parse(localStorage.getItem('pong_stats') || '{}');
      document.getElementById('stat-played').textContent = stats.gamesPlayed || 0;
      document.getElementById('stat-wins').textContent = stats.winsP1 || 0;
      document.getElementById('stat-best-rally').textContent = stats.bestRally || 0;
      document.getElementById('stat-record-speed').textContent = stats.topSpeed ? `${stats.topSpeed} px/f` : '0';
      document.getElementById('stat-high-rally').textContent = stats.highScoreRally || 0;
    } catch (_) {}
  }

  if (btnStatsOpen) {
    btnStatsOpen.addEventListener('click', () => {
      renderStats();
      statsModal.classList.remove('hidden');
    });
  }

  if (btnStatsClose) {
    btnStatsClose.addEventListener('click', () => {
      statsModal.classList.add('hidden');
    });
  }

  // Fullscreen button
  const btnFullscreen = document.getElementById('btn-fullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        btnFullscreen.classList.add('active');
      } else {
        document.exitFullscreen().catch(() => {});
        btnFullscreen.classList.remove('active');
      }
    });
    document.addEventListener('fullscreenchange', () => {
      if (btnFullscreen) {
        btnFullscreen.classList.toggle('active', !!document.fullscreenElement);
      }
    });
  }

  // Rotate hint dismiss
  const btnDismissRotate = document.getElementById('btn-dismiss-rotate');
  const rotateHint = document.getElementById('rotate-hint');
  if (btnDismissRotate && rotateHint) {
    btnDismissRotate.addEventListener('click', () => {
      rotateHint.style.display = 'none';
    });
  }

  // Mobile Touch Controls Wiring
  const ctrlsP2 = document.getElementById('ctrls-p2');
  const trackP1 = document.getElementById('touch-track-p1');
  const handleP1 = document.getElementById('touch-handle-p1');
  const trackP2 = document.getElementById('touch-track-p2');
  const handleP2 = document.getElementById('touch-handle-p2');

  function updateMobileControlsMode() {
    if (!ctrlsP2) return;
    if (selectedMode === GAME_MODES.PVP_LOCAL) {
      ctrlsP2.classList.remove('hidden');
    } else {
      ctrlsP2.classList.add('hidden');
    }
  }

  // Hook into mode buttons to update mobile controls
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      updateMobileControlsMode();
    });
  });
  updateMobileControlsMode();

  // Vertical slider drag handler helper
  function setupSliderTrack(trackEl, handleEl, isLeft) {
    if (!trackEl || !handleEl) return;

    function handleTrackMove(e) {
      const rect = trackEl.getBoundingClientRect();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      // Move visual handle vertically
      const trackHeight = rect.height;
      const handleHeight = handleEl.offsetHeight || 30;
      const topPx = Math.max(0, Math.min(trackHeight - handleHeight, ratio * (trackHeight - handleHeight)));
      handleEl.style.top = `${topPx}px`;

      game.setPaddleNormalizedY(isLeft, ratio);
    }

    trackEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleTrackMove(e);
    }, { passive: false });

    trackEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleTrackMove(e);
    }, { passive: false });

    trackEl.addEventListener('mousedown', (e) => {
      handleTrackMove(e);
      const onMove = (ev) => handleTrackMove(ev);
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  function syncHandleFromPaddle(isLeft) {
    const handle = isLeft ? handleP1 : handleP2;
    const track = isLeft ? trackP1 : trackP2;
    const paddle = isLeft ? game.paddleLeft : game.paddleRight;
    if (!handle || !track || !paddle) return;

    const ratio = Math.max(0, Math.min(1, (paddle.y - 35) / (game.courtHeight - 70)));
    const trackHeight = track.clientHeight || 120;
    const handleHeight = handle.offsetHeight || 30;
    const topPx = Math.max(0, Math.min(trackHeight - handleHeight, ratio * (trackHeight - handleHeight)));
    handle.style.top = `${topPx}px`;
  }

  setupSliderTrack(trackP1, handleP1, true);
  setupSliderTrack(trackP2, handleP2, false);

  // Button continuous press helper
  function setupPressButton(btnId, isLeft, dir) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    let repeatTimer = null;

    const startAction = (e) => {
      e.preventDefault();
      game.movePaddleStep(isLeft, dir);
      syncHandleFromPaddle(isLeft);
      if (repeatTimer) clearInterval(repeatTimer);
      repeatTimer = setInterval(() => {
        game.movePaddleStep(isLeft, dir);
        syncHandleFromPaddle(isLeft);
      }, 70);
    };

    const stopAction = (e) => {
      if (repeatTimer) {
        clearInterval(repeatTimer);
        repeatTimer = null;
      }
    };

    btn.addEventListener('touchstart', startAction, { passive: false });
    btn.addEventListener('touchend', stopAction, { passive: false });
    btn.addEventListener('touchcancel', stopAction, { passive: false });
    btn.addEventListener('mousedown', startAction);
    btn.addEventListener('mouseup', stopAction);
    btn.addEventListener('mouseleave', stopAction);
  }

  setupPressButton('btn-touch-up-p1', true, -1);
  setupPressButton('btn-touch-down-p1', true, 1);
  setupPressButton('btn-touch-up-p2', false, -1);
  setupPressButton('btn-touch-down-p2', false, 1);

  // Start initial render loop
  game.start();
});
