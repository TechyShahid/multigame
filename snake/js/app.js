/**
 * Neon Snake - Application Controller & UI Manager
 * Handles DOM events, HUD updates, modals, touch/swipe controls, virtual D-pad, and persistent stats.
 */

class App {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.game = new SnakeGame(this.canvas);
    window.app = this;

    // Career stats stored in localStorage
    this.stats = this.loadStats();

    // Elements
    this.scoreEl = document.getElementById('hud-score');
    this.highScoreEl = document.getElementById('hud-high-score');
    this.lengthEl = document.getElementById('hud-length');
    this.comboBadge = document.getElementById('combo-badge');
    this.comboVal = document.getElementById('combo-val');
    this.powerUpHud = document.getElementById('powerup-hud');
    this.powerUpName = document.getElementById('powerup-name');
    this.powerUpBar = document.getElementById('powerup-bar-fill');
    this.timeAttackHud = document.getElementById('timeattack-hud');
    this.timeAttackVal = document.getElementById('timeattack-val');

    // Modals
    this.modalGameOver = document.getElementById('modal-gameover');
    this.modalStats = document.getElementById('modal-stats');
    this.modalSettings = document.getElementById('modal-settings');
    this.modalPause = document.getElementById('modal-pause');
    this.startOverlay = document.getElementById('start-overlay');

    // Controls
    this.themeSelect = document.getElementById('select-theme');
    this.modeSelect = document.getElementById('select-mode');
    this.btnSfx = document.getElementById('btn-sfx-toggle');
    this.btnMusic = document.getElementById('btn-music-toggle');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    this.btnPause = document.getElementById('btn-pause-toggle');

    this.init();
  }

  loadStats() {
    const defaultStats = {
      gamesPlayed: 0,
      highScoreClassic: 0,
      highScoreArcade: 0,
      highScoreMaze: 0,
      highScoreTimeAttack: 0,
      totalFoodEaten: 0,
      totalGoldenEaten: 0,
      maxLength: 4,
      bestCombo: 1
    };
    try {
      const saved = localStorage.getItem('snake_career_stats');
      return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    } catch (_) {
      return defaultStats;
    }
  }

  saveStats() {
    try {
      localStorage.setItem('snake_career_stats', JSON.stringify(this.stats));
    } catch (_) {}
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindEvents();
    this.bindTouch();
    this.loadPreferences();
    this.updateHUD();

    // Start game loop
    this.game.startLoop();
  }

  resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 560);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;

    this.game.cellSize = (size * dpr) / this.game.gridWidth;
  }

  loadPreferences() {
    // Theme
    const savedTheme = localStorage.getItem('snake_theme') || 'neon';
    this.setTheme(savedTheme);
    if (this.themeSelect) this.themeSelect.value = savedTheme;

    // Difficulty
    const savedDiff = localStorage.getItem('snake_diff') || 'normal';
    this.game.setDifficulty(savedDiff);
    const diffSelect = document.getElementById('setting-difficulty');
    if (diffSelect) diffSelect.value = savedDiff;

    // Map
    const savedMap = localStorage.getItem('snake_map') || 'open';
    this.game.setMap(savedMap);
    const mapSelect = document.getElementById('setting-map');
    if (mapSelect) mapSelect.value = savedMap;

    // Solid walls
    const savedWalls = localStorage.getItem('snake_walls');
    if (savedWalls !== null) {
      this.game.wallsSolid = savedWalls === 'true';
      const wallCheck = document.getElementById('setting-walls');
      if (wallCheck) wallCheck.checked = this.game.wallsSolid;
    }

    // Audio button states
    if (this.btnSfx) {
      this.btnSfx.classList.toggle('active', window.soundManager.sfxEnabled);
    }
    if (this.btnMusic) {
      this.btnMusic.classList.toggle('active', window.soundManager.musicEnabled);
    }

    // High score for current mode
    this.updateHighScoreDisplay();
  }

  setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    this.game.setTheme(themeName);
    localStorage.setItem('snake_theme', themeName);

    const crtOverlay = document.getElementById('crt-overlay');
    if (crtOverlay) {
      crtOverlay.style.display = themeName === 'crt' ? 'block' : 'none';
    }
  }

  updateHighScoreDisplay() {
    let modeKey = 'highScoreClassic';
    if (this.game.mode === 'arcade') modeKey = 'highScoreArcade';
    else if (this.game.mode === 'maze') modeKey = 'highScoreMaze';
    else if (this.game.mode === 'timeattack') modeKey = 'highScoreTimeAttack';

    this.game.highScore = this.stats[modeKey] || 0;
    if (this.highScoreEl) this.highScoreEl.textContent = this.game.highScore;
  }

  bindEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling on arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.code === 'Space') {
        if (this.game.state === 'MENU' || this.game.state === 'GAMEOVER') {
          this.startGame();
          return;
        } else {
          this.togglePause();
          return;
        }
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.togglePause();
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        this.toggleSfx();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.game.handleInput(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.game.handleInput(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.game.handleInput(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.game.handleInput(1, 0);
          break;
      }
    });

    // Theme selector
    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
      });
    }

    // Mode selector
    if (this.modeSelect) {
      this.modeSelect.addEventListener('change', (e) => {
        this.game.setMode(e.target.value);
        this.updateHighScoreDisplay();
        if (this.game.state === 'PLAYING') {
          this.startGame();
        }
      });
    }

    // Audio toggles
    if (this.btnSfx) {
      this.btnSfx.addEventListener('click', () => this.toggleSfx());
    }
    if (this.btnMusic) {
      this.btnMusic.addEventListener('click', () => this.toggleMusic());
    }

    // Fullscreen
    if (this.btnFullscreen) {
      this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    }

    // Pause button
    if (this.btnPause) {
      this.btnPause.addEventListener('click', () => this.togglePause());
    }

    // Resume button
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => this.togglePause());
    }

    // Play button on start overlay
    const btnPlayStart = document.getElementById('btn-start-game');
    if (btnPlayStart) {
      btnPlayStart.addEventListener('click', () => this.startGame());
    }

    // Restart buttons
    const btnRestartGameOver = document.getElementById('btn-restart-gameover');
    if (btnRestartGameOver) {
      btnRestartGameOver.addEventListener('click', () => this.startGame());
    }
    const btnRestartPause = document.getElementById('btn-restart-pause');
    if (btnRestartPause) {
      btnRestartPause.addEventListener('click', () => this.startGame());
    }

    // Stats modal
    const btnStatsOpen = document.getElementById('btn-stats-open');
    const btnStatsClose = document.getElementById('btn-stats-close');
    if (btnStatsOpen) {
      btnStatsOpen.addEventListener('click', () => this.openStatsModal());
    }
    if (btnStatsClose) {
      btnStatsClose.addEventListener('click', () => this.closeStatsModal());
    }

    // Settings modal
    const btnSettingsOpen = document.getElementById('btn-settings-open');
    const btnSettingsClose = document.getElementById('btn-settings-close');
    if (btnSettingsOpen) {
      btnSettingsOpen.addEventListener('click', () => this.openSettingsModal());
    }
    if (btnSettingsClose) {
      btnSettingsClose.addEventListener('click', () => this.closeSettingsModal());
    }

    // Setting inputs change
    const settingDiff = document.getElementById('setting-difficulty');
    if (settingDiff) {
      settingDiff.addEventListener('change', (e) => {
        this.game.setDifficulty(e.target.value);
        localStorage.setItem('snake_diff', e.target.value);
      });
    }

    const settingMap = document.getElementById('setting-map');
    if (settingMap) {
      settingMap.addEventListener('change', (e) => {
        this.game.setMap(e.target.value);
        localStorage.setItem('snake_map', e.target.value);
      });
    }

    const settingWalls = document.getElementById('setting-walls');
    if (settingWalls) {
      settingWalls.addEventListener('change', (e) => {
        this.game.wallsSolid = e.target.checked;
        localStorage.setItem('snake_walls', e.target.checked);
      });
    }

    // Close modals on outside click
    [this.modalStats, this.modalSettings, this.modalGameOver].forEach(modal => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });

    // Periodic HUD update loop
    setInterval(() => this.updateHUD(), 80);
  }

  bindTouch() {
    // Touch swipe gestures
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const deltaTime = performance.now() - touchStartTime;

        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (dist > 25 && deltaTime < 600) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) this.game.handleInput(1, 0);
            else this.game.handleInput(-1, 0);
          } else {
            // Vertical swipe
            if (deltaY > 0) this.game.handleInput(0, 1);
            else this.game.handleInput(0, -1);
          }
        }
      }
    }, { passive: true });

    // On-screen D-Pad buttons with haptic feedback
    const dpadButtons = [
      { id: 'dpad-up', x: 0, y: -1 },
      { id: 'dpad-down', x: 0, y: 1 },
      { id: 'dpad-left', x: -1, y: 0 },
      { id: 'dpad-right', x: 1, y: 0 }
    ];

    dpadButtons.forEach(({ id, x, y }) => {
      const btn = document.getElementById(id);
      if (btn) {
        const trigger = (e) => {
          e.preventDefault();
          if (this.game.state === 'MENU' || this.game.state === 'GAMEOVER') {
            this.startGame();
          }
          this.game.handleInput(x, y);
          if (navigator.vibrate) {
            navigator.vibrate(15);
          }
        };
        btn.addEventListener('touchstart', trigger, { passive: false });
        btn.addEventListener('mousedown', trigger);
      }
    });
  }

  toggleSfx() {
    const nextState = !window.soundManager.sfxEnabled;
    window.soundManager.setSfx(nextState);
    if (this.btnSfx) this.btnSfx.classList.toggle('active', nextState);
  }

  toggleMusic() {
    window.soundManager.init();
    const nextState = !window.soundManager.musicEnabled;
    window.soundManager.setMusic(nextState);
    if (this.btnMusic) this.btnMusic.classList.toggle('active', nextState);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  togglePause() {
    if (this.game.state === 'MENU') return;
    this.game.pause();
    if (this.modalPause) {
      this.modalPause.classList.toggle('hidden', this.game.state !== 'PAUSED');
    }
    if (this.btnPause) {
      this.btnPause.textContent = this.game.state === 'PAUSED' ? '▶️' : '⏸️';
    }
  }

  startGame() {
    this.modalGameOver.classList.add('hidden');
    this.modalPause.classList.add('hidden');
    this.startOverlay.classList.add('hidden');
    this.updateHighScoreDisplay();
    this.game.start();
    if (this.btnPause) this.btnPause.textContent = '⏸️';
  }

  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = this.game.score;
    if (this.lengthEl) this.lengthEl.textContent = this.game.snake.length;

    // High Score
    if (this.game.score > this.game.highScore) {
      this.game.highScore = this.game.score;
      if (this.highScoreEl) this.highScoreEl.textContent = this.game.highScore;
    }

    // Combo
    if (this.comboBadge) {
      if (this.game.combo > 1) {
        this.comboBadge.classList.remove('hidden');
        if (this.comboVal) this.comboVal.textContent = `×${this.game.combo}`;
      } else {
        this.comboBadge.classList.add('hidden');
      }
    }

    // Active Power-up bar
    if (this.powerUpHud) {
      if (this.game.activePowerUp) {
        this.powerUpHud.classList.remove('hidden');
        const p = this.game.activePowerUp;
        const pct = Math.max(0, (p.duration / p.maxDuration) * 100);
        if (this.powerUpBar) this.powerUpBar.style.width = `${pct}%`;

        let label = 'POWER-UP';
        if (p.type === 'ghost') label = '👻 GHOST PHASE';
        else if (p.type === 'slow') label = '❄️ CRYO SLOW';
        else if (p.type === 'magnet') label = '🧲 ORB MAGNET';
        else if (p.type === 'speed') label = '⚡ TURBO SURGE';
        if (this.powerUpName) this.powerUpName.textContent = label;
      } else {
        this.powerUpHud.classList.add('hidden');
      }
    }

    // Time Attack Hud
    if (this.timeAttackHud) {
      if (this.game.mode === 'timeattack') {
        this.timeAttackHud.classList.remove('hidden');
        if (this.timeAttackVal) {
          const secs = Math.ceil(this.game.timeAttackRemaining);
          const mins = Math.floor(secs / 60);
          const rem = secs % 60;
          this.timeAttackVal.textContent = `${mins}:${rem < 10 ? '0' : ''}${rem}`;
        }
      } else {
        this.timeAttackHud.classList.add('hidden');
      }
    }
  }

  onGameOver(reason, stats) {
    // Update career stats
    this.stats.gamesPlayed++;
    this.stats.totalFoodEaten += stats.foodEaten;
    this.stats.totalGoldenEaten += stats.goldenEaten;
    if (stats.length > this.stats.maxLength) {
      this.stats.maxLength = stats.length;
    }

    let modeKey = 'highScoreClassic';
    if (this.game.mode === 'arcade') modeKey = 'highScoreArcade';
    else if (this.game.mode === 'maze') modeKey = 'highScoreMaze';
    else if (this.game.mode === 'timeattack') modeKey = 'highScoreTimeAttack';

    const isNewHigh = stats.score > (this.stats[modeKey] || 0);
    if (isNewHigh) {
      this.stats[modeKey] = stats.score;
    }
    this.saveStats();

    // Populate Game Over modal
    const reasonEl = document.getElementById('gameover-reason');
    const finalScoreEl = document.getElementById('gameover-score');
    const finalLengthEl = document.getElementById('gameover-length');
    const finalFoodEl = document.getElementById('gameover-food');
    const highNoticeEl = document.getElementById('gameover-high-notice');

    if (reasonEl) reasonEl.textContent = reason;
    if (finalScoreEl) finalScoreEl.textContent = stats.score;
    if (finalLengthEl) finalLengthEl.textContent = stats.length;
    if (finalFoodEl) finalFoodEl.textContent = stats.foodEaten + stats.goldenEaten;
    if (highNoticeEl) {
      highNoticeEl.style.display = isNewHigh ? 'block' : 'none';
    }

    this.modalGameOver.classList.remove('hidden');
  }

  openStatsModal() {
    const fields = [
      { id: 'stat-games-played', val: this.stats.gamesPlayed },
      { id: 'stat-high-classic', val: this.stats.highScoreClassic },
      { id: 'stat-high-arcade', val: this.stats.highScoreArcade },
      { id: 'stat-high-maze', val: this.stats.highScoreMaze },
      { id: 'stat-high-timeattack', val: this.stats.highScoreTimeAttack },
      { id: 'stat-total-food', val: this.stats.totalFoodEaten },
      { id: 'stat-total-golden', val: this.stats.totalGoldenEaten },
      { id: 'stat-max-length', val: this.stats.maxLength }
    ];

    fields.forEach(({ id, val }) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    this.modalStats.classList.remove('hidden');
  }

  closeStatsModal() {
    this.modalStats.classList.add('hidden');
  }

  openSettingsModal() {
    this.modalSettings.classList.remove('hidden');
  }

  closeSettingsModal() {
    this.modalSettings.classList.add('hidden');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
