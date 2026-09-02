/**
 * Candy Crush — DOM Renderer & Animation Controller
 * Handles board rendering, drag/swipe, and CSS animation orchestration
 */

import { CANDY_TYPES, SPECIAL_TYPES } from './levels.js';
import { Audio } from './audio.js';
import { Haptics } from './haptics.js';

// Candy visual representations using SVG shapes
const CANDY_SHAPES = [
  // Red - Circle with heart
  `<svg viewBox="0 0 40 40"><defs><radialGradient id="g0" cx="35%" cy="35%"><stop offset="0%" stop-color="#ff9aa2"/><stop offset="100%" stop-color="#ff4757"/></radialGradient></defs><circle cx="20" cy="20" r="16" fill="url(#g0)" stroke="#c0392b" stroke-width="1.5"/><path d="M20 28 C14 22 12 18 15 15 C17 13 20 15 20 17 C20 15 23 13 25 15 C28 18 26 22 20 28Z" fill="rgba(255,255,255,0.6)"/></svg>`,
  // Orange - Pentagon/Lollipop
  `<svg viewBox="0 0 40 40"><defs><radialGradient id="g1" cx="35%" cy="35%"><stop offset="0%" stop-color="#ffbe76"/><stop offset="100%" stop-color="#ffa502"/></radialGradient></defs><circle cx="20" cy="17" r="13" fill="url(#g1)" stroke="#e67e22" stroke-width="1.5"/><rect x="18.5" y="28" width="3" height="8" rx="1.5" fill="#e67e22"/><circle cx="16" cy="14" r="3" fill="rgba(255,255,255,0.35)"/></svg>`,
  // Yellow - Star
  `<svg viewBox="0 0 40 40"><defs><radialGradient id="g2" cx="35%" cy="35%"><stop offset="0%" stop-color="#fff200"/><stop offset="100%" stop-color="#ffd32a"/></radialGradient></defs><polygon points="20,4 24.5,14.5 36,16 27.5,24 30,36 20,30 10,36 12.5,24 4,16 15.5,14.5" fill="url(#g2)" stroke="#f9ca24" stroke-width="1"/><circle cx="17" cy="15" r="2.5" fill="rgba(255,255,255,0.4)"/></svg>`,
  // Green - Diamond
  `<svg viewBox="0 0 40 40"><defs><radialGradient id="g3" cx="35%" cy="35%"><stop offset="0%" stop-color="#7bed9f"/><stop offset="100%" stop-color="#2ed573"/></radialGradient></defs><rect x="8" y="8" width="24" height="24" rx="6" fill="url(#g3)" stroke="#27ae60" stroke-width="1.5" transform="rotate(0,20,20)"/><circle cx="16" cy="15" r="3" fill="rgba(255,255,255,0.35)"/><circle cx="14" cy="12" r="1.5" fill="rgba(255,255,255,0.2)"/></svg>`,
  // Blue - Hexagon
  `<svg viewBox="0 0 40 40"><defs><radialGradient id="g4" cx="35%" cy="35%"><stop offset="0%" stop-color="#70a1ff"/><stop offset="100%" stop-color="#3742fa"/></radialGradient></defs><polygon points="20,4 34,12 34,28 20,36 6,28 6,12" fill="url(#g4)" stroke="#2c3e9c" stroke-width="1.5"/><circle cx="16" cy="14" r="3" fill="rgba(255,255,255,0.3)"/></svg>`,
  // Purple - Triangle
  `<svg viewBox="0 0 40 40"><defs><radialGradient id="g5" cx="35%" cy="35%"><stop offset="0%" stop-color="#d291ff"/><stop offset="100%" stop-color="#a55eea"/></radialGradient></defs><circle cx="20" cy="20" r="16" fill="url(#g5)" stroke="#8854d0" stroke-width="1.5"/><path d="M15 14 Q20 8 25 14 Q28 20 20 26 Q12 20 15 14Z" fill="rgba(255,255,255,0.25)"/><circle cx="16" cy="15" r="2.5" fill="rgba(255,255,255,0.3)"/></svg>`
];

// Special candy overlay icons
const SPECIAL_OVERLAYS = {
  [SPECIAL_TYPES.STRIPED_H]: `<svg viewBox="0 0 40 40" class="special-overlay"><line x1="4" y1="15" x2="36" y2="15" stroke="rgba(255,255,255,0.8)" stroke-width="2"/><line x1="4" y1="20" x2="36" y2="20" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/><line x1="4" y1="25" x2="36" y2="25" stroke="rgba(255,255,255,0.8)" stroke-width="2"/></svg>`,
  [SPECIAL_TYPES.STRIPED_V]: `<svg viewBox="0 0 40 40" class="special-overlay"><line x1="15" y1="4" x2="15" y2="36" stroke="rgba(255,255,255,0.8)" stroke-width="2"/><line x1="20" y1="4" x2="20" y2="36" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/><line x1="25" y1="4" x2="25" y2="36" stroke="rgba(255,255,255,0.8)" stroke-width="2"/></svg>`,
  [SPECIAL_TYPES.WRAPPED]: `<svg viewBox="0 0 40 40" class="special-overlay"><rect x="8" y="8" width="24" height="24" rx="4" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-dasharray="4,3"/><line x1="8" y1="20" x2="32" y2="20" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/><line x1="20" y1="8" x2="20" y2="32" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/></svg>`,
  [SPECIAL_TYPES.COLOR_BOMB]: `<svg viewBox="0 0 40 40" class="special-overlay"><circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/><circle cx="20" cy="20" r="8" fill="rgba(255,255,255,0.3)"/><line x1="20" y1="4" x2="20" y2="10" stroke="white" stroke-width="2"/><line x1="20" y1="30" x2="20" y2="36" stroke="white" stroke-width="2"/><line x1="4" y1="20" x2="10" y2="20" stroke="white" stroke-width="2"/><line x1="30" y1="20" x2="36" y2="20" stroke="white" stroke-width="2"/><line x1="9" y1="9" x2="13" y2="13" stroke="white" stroke-width="1.5"/><line x1="27" y1="9" x2="31" y2="13" stroke="white" stroke-width="1.5" transform="rotate(90,29,11)"/></svg>`
};

export class Renderer {
  constructor(engine) {
    this.engine = engine;
    this.boardEl = document.getElementById('game-board');
    this.scoreEl = document.getElementById('score-value');
    this.movesEl = document.getElementById('moves-value');
    this.targetEl = document.getElementById('target-value');
    this.progressBar = document.getElementById('progress-fill');
    this.levelNameEl = document.getElementById('level-name');
    this.levelNumEl = document.getElementById('level-number');

    this.selectedCell = null;
    this.isDragging = false;
    this.dragStart = null;
    this.cellElements = [];

    this._setupInputHandlers();
    this._connectEngineCallbacks();
  }

  /**
   * Render the full board
   */
  renderBoard() {
    this.boardEl.innerHTML = '';
    this.boardEl.style.setProperty('--board-cols', this.engine.cols);
    this.boardEl.style.setProperty('--board-rows', this.engine.rows);
    this.cellElements = [];

    for (let r = 0; r < this.engine.rows; r++) {
      this.cellElements[r] = [];
      for (let c = 0; c < this.engine.cols; c++) {
        const cell = this._createCellElement(r, c);
        this.boardEl.appendChild(cell);
        this.cellElements[r][c] = cell;
      }
    }

    // Animate initial board appearance
    const allCells = this.boardEl.querySelectorAll('.candy-cell');
    allCells.forEach((cell, i) => {
      cell.style.animationDelay = `${i * 15}ms`;
      cell.classList.add('candy-spawn');
    });
  }

  /**
   * Create a single cell DOM element
   */
  _createCellElement(r, c) {
    const candy = this.engine.getCandy(r, c);
    const cell = document.createElement('div');
    cell.className = 'candy-cell';
    cell.dataset.row = r;
    cell.dataset.col = c;

    if (candy) {
      cell.classList.add(`candy-type-${candy.type}`);
      cell.innerHTML = CANDY_SHAPES[candy.type] || '';

      if (candy.special !== SPECIAL_TYPES.NONE) {
        cell.classList.add('candy-special', `candy-${candy.special}`);
        if (SPECIAL_OVERLAYS[candy.special]) {
          cell.innerHTML += SPECIAL_OVERLAYS[candy.special];
        }
      }
    }

    return cell;
  }

  /**
   * Update a single cell
   */
  _updateCell(r, c) {
    const candy = this.engine.getCandy(r, c);
    const cell = this.cellElements[r][c];
    if (!cell) return;

    // Remove old classes
    cell.className = 'candy-cell';
    cell.innerHTML = '';

    if (candy) {
      cell.classList.add(`candy-type-${candy.type}`);
      cell.innerHTML = CANDY_SHAPES[candy.type] || '';

      if (candy.special !== SPECIAL_TYPES.NONE) {
        cell.classList.add('candy-special', `candy-${candy.special}`);
        if (SPECIAL_OVERLAYS[candy.special]) {
          cell.innerHTML += SPECIAL_OVERLAYS[candy.special];
        }
      }
    }
  }

  /**
   * Update HUD elements
   */
  updateHUD() {
    const level = this.engine.level;
    if (!level) return;

    this.scoreEl.textContent = this.engine.score.toLocaleString();
    this.movesEl.textContent = this.engine.movesLeft;
    this.targetEl.textContent = level.targetScore.toLocaleString();
    this.levelNameEl.textContent = level.name;
    this.levelNumEl.textContent = `Level ${level.id}`;

    const progress = this.engine.getProgress();
    this.progressBar.style.width = `${progress * 100}%`;

    // Animate moves counter when low
    if (this.engine.movesLeft <= 5) {
      this.movesEl.parentElement.classList.add('moves-warning');
    } else {
      this.movesEl.parentElement.classList.remove('moves-warning');
    }
  }

  /**
   * Setup mouse and touch input handlers
   */
  _setupInputHandlers() {
    // Mouse events
    this.boardEl.addEventListener('mousedown', (e) => this._onPointerDown(e));
    this.boardEl.addEventListener('mousemove', (e) => this._onPointerMove(e));
    this.boardEl.addEventListener('mouseup', (e) => this._onPointerUp(e));
    this.boardEl.addEventListener('mouseleave', () => this._cancelDrag());

    // Touch events
    this.boardEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._onPointerDown(e.touches[0]);
    }, { passive: false });
    this.boardEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this._onPointerMove(e.touches[0]);
    }, { passive: false });
    this.boardEl.addEventListener('touchend', (e) => {
      e.preventDefault();
      this._onPointerUp(e.changedTouches[0]);
    }, { passive: false });
  }

  _getCellFromEvent(e) {
    const target = e.target.closest('.candy-cell');
    if (!target) return null;
    return {
      r: parseInt(target.dataset.row),
      c: parseInt(target.dataset.col)
    };
  }

  _onPointerDown(e) {
    if (this.engine.isProcessing) return;
    const cell = this._getCellFromEvent(e);
    if (!cell) return;

    this.isDragging = true;
    this.dragStart = cell;

    // Select the candy
    this._clearSelection();
    const cellEl = this.cellElements[cell.r][cell.c];
    cellEl.classList.add('candy-selected');
    this.selectedCell = cell;
    Audio.playSelect();
    Haptics.light();
  }

  _onPointerMove(e) {
    if (!this.isDragging || !this.dragStart || this.engine.isProcessing) return;

    const boardRect = this.boardEl.getBoundingClientRect();
    const cellSize = boardRect.width / this.engine.cols;
    const x = (e.clientX || e.pageX) - boardRect.left;
    const y = (e.clientY || e.pageY) - boardRect.top;

    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);

    if (r < 0 || r >= this.engine.rows || c < 0 || c >= this.engine.cols) return;
    if (r === this.dragStart.r && c === this.dragStart.c) return;

    // Only allow adjacent swaps
    if (this.engine.areAdjacent(this.dragStart.r, this.dragStart.c, r, c)) {
      this.isDragging = false;
      this._trySwap(this.dragStart.r, this.dragStart.c, r, c);
    }
  }

  _onPointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    const cell = this._getCellFromEvent(e);
    if (!cell || !this.dragStart) return;

    // If released on a different adjacent cell, try swap
    if (!(cell.r === this.dragStart.r && cell.c === this.dragStart.c)) {
      if (this.engine.areAdjacent(this.dragStart.r, this.dragStart.c, cell.r, cell.c)) {
        this._trySwap(this.dragStart.r, this.dragStart.c, cell.r, cell.c);
        return;
      }
    }

    // Tap mode: if there was a previously selected cell, try swap
    if (this.selectedCell && this.dragStart &&
      !(this.selectedCell.r === this.dragStart.r && this.selectedCell.c === this.dragStart.c)) {
      // This case is handled differently — on second tap
    }
  }

  _cancelDrag() {
    this.isDragging = false;
    this.dragStart = null;
  }

  _clearSelection() {
    const selected = this.boardEl.querySelectorAll('.candy-selected');
    selected.forEach(el => el.classList.remove('candy-selected'));
  }

  /**
   * Attempt swap with animations
   */
  async _trySwap(r1, c1, r2, c2) {
    this._clearSelection();

    const cell1 = this.cellElements[r1][c1];
    const cell2 = this.cellElements[r2][c2];

    // Animate swap
    const dr = r2 - r1;
    const dc = c2 - c1;
    cell1.style.setProperty('--swap-x', `${dc * 100}%`);
    cell1.style.setProperty('--swap-y', `${dr * 100}%`);
    cell2.style.setProperty('--swap-x', `${-dc * 100}%`);
    cell2.style.setProperty('--swap-y', `${-dr * 100}%`);
    cell1.classList.add('candy-swapping');
    cell2.classList.add('candy-swapping');

    Audio.playSwap();
    Haptics.medium();

    await this._wait(250);

    cell1.classList.remove('candy-swapping');
    cell2.classList.remove('candy-swapping');
    cell1.style.removeProperty('--swap-x');
    cell1.style.removeProperty('--swap-y');
    cell2.style.removeProperty('--swap-x');
    cell2.style.removeProperty('--swap-y');

    const success = await this.engine.trySwap(r1, c1, r2, c2);

    if (!success) {
      // Animate swap back
      Audio.playInvalid();
      Haptics.error();
      cell1.classList.add('candy-shake');
      cell2.classList.add('candy-shake');
      await this._wait(400);
      cell1.classList.remove('candy-shake');
      cell2.classList.remove('candy-shake');
    }

    this.dragStart = null;
    this.selectedCell = null;
  }

  /**
   * Connect to engine callbacks
   */
  _connectEngineCallbacks() {
    this.engine.onScoreChanged = (score) => {
      this.scoreEl.textContent = score.toLocaleString();
      const progress = this.engine.getProgress();
      this.progressBar.style.width = `${progress * 100}%`;
    };

    this.engine.onMovesChanged = (moves) => {
      this.movesEl.textContent = moves;
      if (moves <= 5) {
        this.movesEl.parentElement.classList.add('moves-warning');
      }
    };

    this.engine.onMatchFound = (matches, chainLevel, points) => {
      Audio.playMatch(chainLevel);
      Haptics.pop();

      // Show floating score for each match
      for (const match of matches) {
        const midCell = match.cells[Math.floor(match.cells.length / 2)];
        this._showFloatingScore(midCell.r, midCell.c, points);
      }

      if (chainLevel > 1) {
        this._showComboText(chainLevel);
      }
    };

    this.engine.onCandiesRemoved = async (cells) => {
      for (const cell of cells) {
        const el = this.cellElements[cell.r][cell.c];
        if (el) {
          el.classList.add('candy-pop');
          // Create particle burst
          this._createPopParticles(cell.r, cell.c, cell.type);
        }
      }
      await this._wait(300);

      // Clear the popped cells visually
      for (const cell of cells) {
        const el = this.cellElements[cell.r][cell.c];
        if (el) {
          el.classList.remove('candy-pop');
          el.className = 'candy-cell candy-empty';
          el.innerHTML = '';
        }
      }
    };

    this.engine.onSpecialCreated = (spec) => {
      Audio.playSpecialCreate();
      Haptics.special();
    };

    this.engine.onSpecialActivated = (activations) => {
      for (const act of activations) {
        if (act.special === SPECIAL_TYPES.COLOR_BOMB) {
          Audio.playColorBomb();
          Haptics.special();
          this._screenFlash();
        } else {
          Audio.playSpecialActivate();
        }
      }
    };

    this.engine.onCandiesDropped = async (drops) => {
      // Rebuild cell elements to match new board state
      this._rebuildBoard();
      // Animate the drops
      for (const drop of drops) {
        const el = this.cellElements[drop.r][drop.c];
        if (el) {
          const distance = drop.r - drop.fromR;
          el.style.setProperty('--drop-distance', `${-distance * 100}%`);
          el.classList.add('candy-drop');
        }
      }
      await this._wait(350);
      // Remove animation class
      for (const drop of drops) {
        const el = this.cellElements[drop.r][drop.c];
        if (el) {
          el.classList.remove('candy-drop');
          el.style.removeProperty('--drop-distance');
        }
      }
    };

    this.engine.onCandiesSpawned = async (spawned) => {
      this._rebuildBoard();
      for (const s of spawned) {
        const el = this.cellElements[s.r][s.c];
        if (el) {
          el.classList.add('candy-spawn');
        }
      }
      await this._wait(350);
      for (const s of spawned) {
        const el = this.cellElements[s.r][s.c];
        if (el) {
          el.classList.remove('candy-spawn');
        }
      }
    };

    this.engine.onCascade = (level) => {
      Audio.playCascade(level);
      Haptics.combo(level);
    };

    this.engine.onLevelComplete = (score, stars) => {
      setTimeout(() => {
        Audio.playVictory();
        Haptics.victory();
        this._showVictoryModal(score, stars);
      }, 600);
    };

    this.engine.onGameOver = (score) => {
      setTimeout(() => {
        Audio.playGameOver();
        Haptics.gameOver();
        this._showGameOverModal(score);
      }, 600);
    };
  }

  /**
   * Rebuild the board DOM from engine state (used after gravity + spawn)
   */
  _rebuildBoard() {
    for (let r = 0; r < this.engine.rows; r++) {
      for (let c = 0; c < this.engine.cols; c++) {
        this._updateCell(r, c);
      }
    }
  }

  /**
   * Show floating score text
   */
  _showFloatingScore(r, c, points) {
    const cell = this.cellElements[r][c];
    if (!cell) return;

    const float = document.createElement('div');
    float.className = 'floating-score';
    float.textContent = `+${points}`;
    cell.appendChild(float);

    setTimeout(() => float.remove(), 1000);
  }

  /**
   * Show combo text
   */
  _showComboText(level) {
    const comboEl = document.getElementById('combo-text');
    if (!comboEl) return;

    const texts = ['', '', 'SWEET!', 'TASTY!', 'DELICIOUS!', 'DIVINE!', 'SUGAR RUSH!', 'INCREDIBLE!'];
    comboEl.textContent = texts[Math.min(level, texts.length - 1)] || `${level}x COMBO!`;
    comboEl.classList.remove('combo-animate');
    void comboEl.offsetWidth; // force reflow
    comboEl.classList.add('combo-animate');
  }

  /**
   * Create pop particle effects
   */
  _createPopParticles(r, c, type) {
    const cell = this.cellElements[r][c];
    if (!cell) return;

    const color = CANDY_TYPES[type]?.color || '#fff';
    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('div');
      particle.className = 'pop-particle';
      particle.style.setProperty('--particle-color', color);
      particle.style.setProperty('--particle-angle', `${(i * 60) + Math.random() * 30}deg`);
      particle.style.setProperty('--particle-distance', `${30 + Math.random() * 20}px`);
      cell.appendChild(particle);
      setTimeout(() => particle.remove(), 600);
    }
  }

  /**
   * Screen flash effect for big specials
   */
  _screenFlash() {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  /**
   * Show victory modal
   */
  _showVictoryModal(score, stars) {
    const modal = document.getElementById('modal-victory');
    const starsEl = document.getElementById('victory-stars');
    const scoreEl = document.getElementById('victory-score');

    scoreEl.textContent = score.toLocaleString();

    // Render stars
    starsEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.className = `star ${i < stars ? 'star-earned' : 'star-empty'}`;
      star.textContent = '★';
      star.style.animationDelay = `${i * 200 + 300}ms`;
      starsEl.appendChild(star);
    }

    modal.classList.add('modal-open');

    // Play star sounds
    for (let i = 0; i < stars; i++) {
      setTimeout(() => Audio.playStar(), i * 200 + 300);
    }
  }

  /**
   * Show game over modal
   */
  _showGameOverModal(score) {
    const modal = document.getElementById('modal-gameover');
    const scoreEl = document.getElementById('gameover-score');
    scoreEl.textContent = score.toLocaleString();
    modal.classList.add('modal-open');
  }

  /**
   * Utility: wait for ms
   */
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
