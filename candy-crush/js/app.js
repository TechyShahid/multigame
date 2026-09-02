/**
 * Candy Crush — Main Application
 * Bootstraps the game, connects screens, handles navigation
 */

import { GameEngine } from './game.js';
import { Renderer } from './renderer.js';
import { Storage } from './storage.js';
import { Audio } from './audio.js';
import { LEVELS, getLevelConfig } from './levels.js';

class CandyCrushApp {
  constructor() {
    this.engine = new GameEngine();
    this.renderer = null;
    this.currentLevel = 1;

    this._cacheDOM();
    this._bindEvents();
    this._initAudio();
    this._renderLevelMap();
    this._createBgParticles();
  }

  _cacheDOM() {
    this.screens = {
      start: document.getElementById('screen-start'),
      game: document.getElementById('screen-game')
    };
    this.modals = {
      victory: document.getElementById('modal-victory'),
      gameover: document.getElementById('modal-gameover')
    };
    this.totalStarsEl = document.getElementById('total-stars-count');
    this.levelMapEl = document.getElementById('level-map');
    this.shuffleMsg = document.getElementById('shuffle-msg');
  }

  _bindEvents() {
    // Level map clicks
    this.levelMapEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.level-btn');
      if (!btn || btn.classList.contains('level-locked')) return;
      Audio.playClick();
      const levelId = parseInt(btn.dataset.level);
      this.startGame(levelId);
    });

    // Back to menu
    document.getElementById('btn-back').addEventListener('click', () => {
      Audio.playClick();
      this.showScreen('start');
      this._renderLevelMap();
    });

    // Victory modal buttons
    document.getElementById('btn-next-level').addEventListener('click', () => {
      Audio.playClick();
      this.closeAllModals();
      const nextLevel = Math.min(this.currentLevel + 1, 30);
      this.startGame(nextLevel);
    });
    document.getElementById('btn-victory-replay').addEventListener('click', () => {
      Audio.playClick();
      this.closeAllModals();
      this.startGame(this.currentLevel);
    });
    document.getElementById('btn-victory-menu').addEventListener('click', () => {
      Audio.playClick();
      this.closeAllModals();
      this.showScreen('start');
      this._renderLevelMap();
    });

    // Game over modal buttons
    document.getElementById('btn-gameover-retry').addEventListener('click', () => {
      Audio.playClick();
      this.closeAllModals();
      this.startGame(this.currentLevel);
    });
    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      Audio.playClick();
      this.closeAllModals();
      this.showScreen('start');
      this._renderLevelMap();
    });

    // Shuffle button
    document.getElementById('btn-shuffle').addEventListener('click', () => {
      Audio.playClick();
      this.engine.shuffleBoard();
      this.renderer.renderBoard();
      this.shuffleMsg.classList.add('hidden');
    });

    // Sound toggles
    const sfxBtn = document.getElementById('btn-sfx-toggle');
    const musicBtn = document.getElementById('btn-music-toggle');

    sfxBtn.addEventListener('click', () => {
      const enabled = !Storage.getSfxEnabled();
      Storage.setSfxEnabled(enabled);
      Audio.setSfxEnabled(enabled);
      sfxBtn.classList.toggle('toggled-off', !enabled);
      if (enabled) Audio.playClick();
    });

    musicBtn.addEventListener('click', () => {
      Audio.playClick();
      const enabled = !Storage.getMusicEnabled();
      Storage.setMusicEnabled(enabled);
      Audio.setMusicEnabled(enabled);
      musicBtn.classList.toggle('toggled-off', !enabled);
    });

    // Init toggle states
    sfxBtn.classList.toggle('toggled-off', !Storage.getSfxEnabled());
    musicBtn.classList.toggle('toggled-off', !Storage.getMusicEnabled());
  }

  _initAudio() {
    // Initialize audio on first user interaction
    const initOnInteraction = () => {
      Audio.init();
      Audio.setSfxEnabled(Storage.getSfxEnabled());
      Audio.setMusicEnabled(Storage.getMusicEnabled());
      document.removeEventListener('click', initOnInteraction);
      document.removeEventListener('touchstart', initOnInteraction);
    };
    document.addEventListener('click', initOnInteraction);
    document.addEventListener('touchstart', initOnInteraction);
  }

  /**
   * Render the level selection map
   */
  _renderLevelMap() {
    const maxUnlocked = Storage.getMaxLevel();
    this.totalStarsEl.textContent = Storage.getTotalStars();

    this.levelMapEl.innerHTML = '';

    let currentWorld = '';
    for (const level of LEVELS) {
      // World header
      if (level.world !== currentWorld) {
        currentWorld = level.world;
        const worldHeader = document.createElement('div');
        worldHeader.className = 'world-header';
        worldHeader.innerHTML = `<h3>${currentWorld}</h3>`;
        this.levelMapEl.appendChild(worldHeader);
      }

      const btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.dataset.level = level.id;

      const isLocked = level.id > maxUnlocked;
      const result = Storage.getLevelResult(level.id);

      if (isLocked) {
        btn.classList.add('level-locked');
        btn.innerHTML = `
          <span class="level-num">${level.id}</span>
          <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
        `;
      } else {
        btn.classList.add('level-unlocked');
        if (level.id === maxUnlocked && !result) {
          btn.classList.add('level-current');
        }

        const starsHtml = result ? this._renderStarIcons(result.stars) : this._renderStarIcons(0);

        btn.innerHTML = `
          <span class="level-num">${level.id}</span>
          <div class="level-stars">${starsHtml}</div>
        `;
      }

      this.levelMapEl.appendChild(btn);
    }
  }

  _renderStarIcons(count) {
    let html = '';
    for (let i = 0; i < 3; i++) {
      html += `<span class="star-sm ${i < count ? 'star-earned' : 'star-empty'}">★</span>`;
    }
    return html;
  }

  /**
   * Start a game at the given level
   */
  startGame(levelId) {
    this.currentLevel = levelId;
    this.closeAllModals();

    // Initialize engine
    const level = this.engine.initLevel(levelId);

    // Switch screen
    this.showScreen('game');

    // Create renderer (or reconnect)
    this.renderer = new Renderer(this.engine);

    // Override level complete/game over to save progress
    const originalOnComplete = this.engine.onLevelComplete;
    this.engine.onLevelComplete = (score, stars) => {
      Storage.saveLevelResult(levelId, score, stars);
      if (originalOnComplete) originalOnComplete(score, stars);
    };

    // Render
    this.renderer.renderBoard();
    this.renderer.updateHUD();

    // Check for valid moves
    this._checkValidMoves();
  }

  _checkValidMoves() {
    if (!this.engine.hasValidMoves()) {
      this.shuffleMsg.classList.remove('hidden');
    } else {
      this.shuffleMsg.classList.add('hidden');
    }
  }

  /**
   * Screen management
   */
  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('screen-active'));
    if (this.screens[name]) {
      this.screens[name].classList.add('screen-active');
    }
  }

  closeAllModals() {
    Object.values(this.modals).forEach(m => m.classList.remove('modal-open'));
  }

  /**
   * Create ambient background particles
   */
  _createBgParticles() {
    const container = document.getElementById('bg-particles');
    const candies = ['🍬', '🍭', '🍫', '⭐', '🍩', '🧁', '🍪', '🎂'];

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('span');
      particle.className = 'bg-candy-particle';
      particle.textContent = candies[Math.floor(Math.random() * candies.length)];
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.fontSize = `${14 + Math.random() * 18}px`;
      particle.style.animationDuration = `${15 + Math.random() * 20}s`;
      particle.style.animationDelay = `${Math.random() * 15}s`;
      particle.style.opacity = `${0.15 + Math.random() * 0.2}`;
      container.appendChild(particle);
    }
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CandyCrushApp();
});
