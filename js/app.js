/**
 * Zen Sudoku — Main Application Controller
 */

import { SudokuEngine } from './sudoku-engine.js';
import { AudioManager } from './audio.js';
import { StorageManager } from './storage.js';
import { ConfettiCannon } from './confetti.js';

class SudokuApp {
  constructor() {
    this.audio = new AudioManager();
    this.confetti = new ConfettiCannon(document.getElementById('confetti-canvas'));
    this.settings = StorageManager.loadSettings();

    // Game state
    this.difficulty = 'medium';
    this.initialGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.solutionGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.currentGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.notesGrid = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));

    this.selectedCell = null; // { row, col }
    this.selectedDigit = null; // 1-9 for number-first mode
    this.inputMode = this.settings.inputMode || 'cell-first';
    this.notesMode = false;
    this.mistakes = 0;
    this.maxMistakes = 3;
    this.score = 1000;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isPaused = false;
    this.isGameOver = false;
    this.isWon = false;

    this.historyStack = [];
    this.redoStack = [];
    this.activeHint = null;

    // DOM Elements Cache
    this.dom = {
      grid: document.getElementById('sudoku-grid'),
      timerDisplay: document.getElementById('timer-display'),
      mistakesBadge: document.getElementById('mistakes-badge'),
      mistakesContainer: document.getElementById('mistakes-container'),
      scoreBadge: document.getElementById('score-badge'),
      diffBadge: document.getElementById('current-diff-badge'),
      btnPause: document.getElementById('btn-pause'),
      pauseOverlay: document.getElementById('pause-overlay'),
      btnResume: document.getElementById('btn-resume'),

      // Dropdown
      btnNewGameDropdown: document.getElementById('btn-new-game-dropdown'),
      difficultyMenu: document.getElementById('difficulty-menu'),

      // Controls
      btnUndo: document.getElementById('btn-undo'),
      btnRedo: document.getElementById('btn-redo'),
      btnErase: document.getElementById('btn-erase'),
      btnNotes: document.getElementById('btn-notes'),
      notesBadge: document.getElementById('notes-badge'),
      btnHint: document.getElementById('btn-hint'),
      btnAutoNotes: document.getElementById('btn-auto-notes'),

      // Hint Banner
      hintBanner: document.getElementById('hint-banner'),
      hintText: document.getElementById('hint-text'),
      btnApplyHint: document.getElementById('btn-apply-hint'),
      btnCloseHint: document.getElementById('btn-close-hint'),

      // Keypad
      keypad: document.getElementById('game-keypad'),
      keypadBtns: document.querySelectorAll('.keypad-btn'),

      // Mode toggles
      btnModeCell: document.getElementById('btn-mode-cell'),
      btnModeDigit: document.getElementById('btn-mode-digit'),
      btnPrint: document.getElementById('btn-print-puzzle'),

      // Top action buttons
      btnStats: document.getElementById('btn-stats'),
      btnRules: document.getElementById('btn-rules'),
      btnSettings: document.getElementById('btn-settings'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      btnThemeToggle: document.getElementById('btn-theme-toggle'),

      // Modals
      modalVictory: document.getElementById('modal-victory'),
      modalGameOver: document.getElementById('modal-gameover'),
      modalStats: document.getElementById('modal-stats'),
      modalSettings: document.getElementById('modal-settings'),
      modalRules: document.getElementById('modal-rules'),
      modalCustom: document.getElementById('modal-custom'),

      // Toast
      toastContainer: document.getElementById('toast-container')
    };

    this.init();
  }

  init() {
    this.applyTheme(this.settings.theme || 'dark');
    this.audio.enabled = this.settings.sound !== false;
    this.updateSoundIcon();

    this.buildBoardDOM();
    this.setupEventListeners();
    this.setupModals();

    // Check if there is an active saved game
    const saved = StorageManager.loadActiveGame();
    if (saved && saved.currentGrid && saved.solutionGrid) {
      this.restoreSavedGame(saved);
    } else {
      this.startNewGame(this.difficulty);
    }
  }

  /**
   * Generates DOM elements for 81 cells inside the 9x9 grid
   */
  buildBoardDOM() {
    this.dom.grid.innerHTML = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}`);

        // Pencil notes 3x3 container
        const notesGrid = document.createElement('div');
        notesGrid.className = 'notes-grid hidden';
        for (let n = 1; n <= 9; n++) {
          const noteSpan = document.createElement('span');
          noteSpan.className = 'note-num';
          noteSpan.dataset.note = n;
          notesGrid.appendChild(noteSpan);
        }
        cell.appendChild(notesGrid);

        // Value text span
        const valSpan = document.createElement('span');
        valSpan.className = 'cell-value';
        cell.appendChild(valSpan);

        cell.addEventListener('click', () => this.handleCellClick(r, c));
        this.dom.grid.appendChild(cell);
      }
    }
  }

  /**
   * Starts a brand new game with the given difficulty
   */
  startNewGame(diffKey) {
    this.stopTimer();
    this.difficulty = diffKey;
    this.dom.diffBadge.textContent = SudokuEngine.DIFFICULTIES[diffKey]?.name || 'Medium';

    // Update active state in difficulty dropdown
    document.querySelectorAll('.dropdown-item[data-diff]').forEach(item => {
      item.classList.toggle('active', item.dataset.diff === diffKey);
    });

    this.showToast(`Generating ${SudokuEngine.DIFFICULTIES[diffKey]?.name} puzzle...`);

    // Procedural generation
    setTimeout(() => {
      const puzzle = SudokuEngine.generate(diffKey);
      this.initialGrid = puzzle.initial.map(row => [...row]);
      this.solutionGrid = puzzle.solution.map(row => [...row]);
      this.currentGrid = puzzle.initial.map(row => [...row]);
      this.notesGrid = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));

      this.selectedCell = null;
      this.selectedDigit = null;
      this.historyStack = [];
      this.redoStack = [];
      this.mistakes = 0;
      this.score = 1000;
      this.timerSeconds = 0;
      this.isPaused = false;
      this.isGameOver = false;
      this.isWon = false;
      this.activeHint = null;

      this.hideHintBanner();
      this.updateMistakesUI();
      this.updateScoreUI();
      this.renderBoard();
      this.updateKeypadCounts();
      this.startTimer();
      this.saveCurrentGame();

      StorageManager.recordGameStart(diffKey);
    }, 20);
  }

  /**
   * Restores an active game from LocalStorage
   */
  restoreSavedGame(saved) {
    this.difficulty = saved.difficulty || 'medium';
    this.dom.diffBadge.textContent = SudokuEngine.DIFFICULTIES[this.difficulty]?.name || 'Medium';
    this.initialGrid = saved.initialGrid;
    this.solutionGrid = saved.solutionGrid;
    this.currentGrid = saved.currentGrid;
    this.notesGrid = saved.notesGrid.map(row => row.map(cellArray => new Set(cellArray)));
    this.mistakes = saved.mistakes || 0;
    this.score = saved.score || 1000;
    this.timerSeconds = saved.timerSeconds || 0;
    this.historyStack = saved.historyStack || [];
    this.redoStack = [];

    this.updateMistakesUI();
    this.updateScoreUI();
    this.renderBoard();
    this.updateKeypadCounts();
    this.startTimer();
  }

  /**
   * Persists the active game to LocalStorage
   */
  saveCurrentGame() {
    if (this.isWon || this.isGameOver) {
      StorageManager.clearActiveGame();
      return;
    }
    const serializedNotes = this.notesGrid.map(row => row.map(cellSet => Array.from(cellSet)));
    StorageManager.saveActiveGame({
      difficulty: this.difficulty,
      initialGrid: this.initialGrid,
      solutionGrid: this.solutionGrid,
      currentGrid: this.currentGrid,
      notesGrid: serializedNotes,
      mistakes: this.mistakes,
      score: this.score,
      timerSeconds: this.timerSeconds,
      historyStack: this.historyStack.slice(-30)
    });
  }

  /**
   * Renders values and notes across the 81 cells
   */
  renderBoard() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellEl = this.getCellElement(r, c);
        const valSpan = cellEl.querySelector('.cell-value');
        const notesGrid = cellEl.querySelector('.notes-grid');

        const isGiven = this.initialGrid[r][c] !== 0;
        const currentVal = this.currentGrid[r][c];

        cellEl.className = 'sudoku-cell';
        if (isGiven) {
          cellEl.classList.add('given');
          valSpan.textContent = currentVal;
          notesGrid.classList.add('hidden');
        } else if (currentVal !== 0) {
          cellEl.classList.add('user-input');
          valSpan.textContent = currentVal;
          notesGrid.classList.add('hidden');

          // Check if error conflict highlight is enabled
          if (this.settings.highlightDuplicates && currentVal !== this.solutionGrid[r][c]) {
            cellEl.classList.add('error');
          }
        } else {
          // Empty cell: render candidate notes
          valSpan.textContent = '';
          const notes = this.notesGrid[r][c];
          if (notes && notes.size > 0) {
            notesGrid.classList.remove('hidden');
            for (let n = 1; n <= 9; n++) {
              const span = notesGrid.querySelector(`[data-note="${n}"]`);
              span.textContent = notes.has(n) ? n : '';
            }
          } else {
            notesGrid.classList.add('hidden');
          }
        }
      }
    }
    this.updateHighlights();
  }

  /**
   * Updates cell selection and contextual row/col/box/peer highlights
   */
  updateHighlights() {
    const cells = this.dom.grid.querySelectorAll('.sudoku-cell');
    cells.forEach(el => {
      el.classList.remove('selected', 'highlight-peer', 'highlight-same');
    });

    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    const selectedEl = this.getCellElement(row, col);
    if (selectedEl) selectedEl.classList.add('selected');

    const selectedVal = this.currentGrid[row][col];
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);

    cells.forEach(el => {
      const r = parseInt(el.dataset.row, 10);
      const c = parseInt(el.dataset.col, 10);
      const b = parseInt(el.dataset.box, 10);
      const val = this.currentGrid[r][c];

      // Highlight matching numbers across board
      if (this.settings.highlightSameNumbers && selectedVal !== 0 && val === selectedVal) {
        el.classList.add('highlight-same');
      }

      // Highlight peer cells (same row, col, or 3x3 block)
      if (this.settings.highlightPeers && (r === row || c === col || b === box) && !(r === row && c === col)) {
        el.classList.add('highlight-peer');
      }
    });
  }

  /**
   * Updates remaining number counts on keypad
   */
  updateKeypadCounts() {
    const counts = Array(10).fill(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = this.currentGrid[r][c];
        if (val >= 1 && val <= 9) {
          counts[val]++;
        }
      }
    }

    this.dom.keypadBtns.forEach(btn => {
      const digit = parseInt(btn.dataset.num, 10);
      const placed = counts[digit];
      const remaining = Math.max(0, 9 - placed);
      const countEl = btn.querySelector('.key-count');
      if (countEl) {
        countEl.textContent = remaining > 0 ? remaining : '✓';
      }

      if (remaining === 0) {
        btn.classList.add('completed');
      } else {
        btn.classList.remove('completed');
      }

      if (this.inputMode === 'number-first' && this.selectedDigit === digit) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Handles user tapping/clicking a cell
   */
  handleCellClick(row, col) {
    if (this.isPaused || this.isGameOver || this.isWon) return;

    if (this.inputMode === 'number-first' && this.selectedDigit !== null) {
      this.selectedCell = { row, col };
      this.inputDigit(this.selectedDigit);
      this.updateHighlights();
      return;
    }

    this.selectedCell = { row, col };
    this.audio.playClick();
    this.updateHighlights();
  }

  /**
   * Inputs a digit into the currently selected cell
   */
  inputDigit(digit) {
    if (!this.selectedCell || this.isPaused || this.isGameOver || this.isWon) return;
    const { row, col } = this.selectedCell;

    // Cannot modify initial given numbers
    if (this.initialGrid[row][col] !== 0) return;

    if (this.notesMode) {
      // Toggle candidate note
      this.toggleNote(row, col, digit);
      return;
    }

    const currentVal = this.currentGrid[row][col];
    if (currentVal === digit) {
      // Tapping same digit again erases it
      this.eraseCell(row, col);
      return;
    }

    // Save previous state for undo
    const prevVal = currentVal;
    const prevNotes = new Set(this.notesGrid[row][col]);

    // Check conflict against solution
    const isCorrect = digit === this.solutionGrid[row][col];
    if (!isCorrect) {
      this.audio.playError();
      this.mistakes++;
      this.score = Math.max(0, this.score - 40);
      this.updateMistakesUI();
      this.updateScoreUI();

      if (this.settings.mistakeLimit && this.mistakes >= this.maxMistakes) {
        this.triggerGameOver();
        return;
      }
    } else {
      this.audio.playClick();
      this.score += 25;
      this.updateScoreUI();
    }

    this.currentGrid[row][col] = digit;
    this.notesGrid[row][col].clear();

    // Auto-remove notes in peers if enabled
    const clearedPeerNotes = [];
    if (this.settings.autoRemoveNotes && isCorrect) {
      const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
          if ((r === row || c === col || b === box) && !(r === row && c === col)) {
            if (this.notesGrid[r][c].has(digit)) {
              clearedPeerNotes.push({ r, c, digit });
              this.notesGrid[r][c].delete(digit);
            }
          }
        }
      }
    }

    // Push to undo history
    this.historyStack.push({
      type: 'place',
      row,
      col,
      prevVal,
      newVal: digit,
      prevNotes,
      clearedPeerNotes
    });
    this.redoStack = [];

    this.renderBoard();
    this.updateKeypadCounts();
    this.saveCurrentGame();
    this.checkGameCompletion();
  }

  /**
   * Toggles a pencil candidate note in cell (row, col)
   */
  toggleNote(row, col, digit) {
    // If cell already has a placed value, clear it first or ignore
    if (this.currentGrid[row][col] !== 0) {
      this.currentGrid[row][col] = 0;
    }

    const prevNotes = new Set(this.notesGrid[row][col]);
    if (this.notesGrid[row][col].has(digit)) {
      this.notesGrid[row][col].delete(digit);
    } else {
      this.notesGrid[row][col].add(digit);
    }

    this.audio.playNote();
    this.historyStack.push({
      type: 'note',
      row,
      col,
      prevNotes,
      newNotes: new Set(this.notesGrid[row][col])
    });
    this.redoStack = [];

    this.renderBoard();
    this.saveCurrentGame();
  }

  /**
   * Erases value or notes in the selected cell
   */
  eraseCell(r = null, c = null) {
    if (this.isPaused || this.isGameOver || this.isWon) return;
    const row = r !== null ? r : (this.selectedCell ? this.selectedCell.row : null);
    const col = c !== null ? c : (this.selectedCell ? this.selectedCell.col : null);

    if (row === null || col === null) return;
    if (this.initialGrid[row][col] !== 0) return; // Cannot erase given

    const prevVal = this.currentGrid[row][col];
    const prevNotes = new Set(this.notesGrid[row][col]);

    if (prevVal === 0 && prevNotes.size === 0) return; // Already empty

    this.audio.playErase();
    this.currentGrid[row][col] = 0;
    this.notesGrid[row][col].clear();

    this.historyStack.push({
      type: 'erase',
      row,
      col,
      prevVal,
      prevNotes
    });
    this.redoStack = [];

    this.renderBoard();
    this.updateKeypadCounts();
    this.saveCurrentGame();
  }

  /**
   * Undoes the last move
   */
  undo() {
    if (this.historyStack.length === 0 || this.isPaused || this.isGameOver) return;
    const action = this.historyStack.pop();
    this.redoStack.push(action);

    if (action.type === 'place') {
      this.currentGrid[action.row][action.col] = action.prevVal;
      this.notesGrid[action.row][action.col] = new Set(action.prevNotes);
      if (action.clearedPeerNotes) {
        action.clearedPeerNotes.forEach(({ r, c, digit }) => {
          this.notesGrid[r][c].add(digit);
        });
      }
    } else if (action.type === 'note') {
      this.notesGrid[action.row][action.col] = new Set(action.prevNotes);
    } else if (action.type === 'erase') {
      this.currentGrid[action.row][action.col] = action.prevVal;
      this.notesGrid[action.row][action.col] = new Set(action.prevNotes);
    } else if (action.type === 'auto-notes') {
      this.notesGrid = action.prevNotesGrid.map(row => row.map(s => new Set(s)));
    }

    this.selectedCell = { row: action.row, col: action.col };
    this.audio.playClick();
    this.renderBoard();
    this.updateKeypadCounts();
    this.saveCurrentGame();
  }

  /**
   * Redoes the last undone move
   */
  redo() {
    if (this.redoStack.length === 0 || this.isPaused || this.isGameOver) return;
    const action = this.redoStack.pop();
    this.historyStack.push(action);

    if (action.type === 'place') {
      this.currentGrid[action.row][action.col] = action.newVal;
      this.notesGrid[action.row][action.col].clear();
      if (action.clearedPeerNotes) {
        action.clearedPeerNotes.forEach(({ r, c, digit }) => {
          this.notesGrid[r][c].delete(digit);
        });
      }
    } else if (action.type === 'note') {
      this.notesGrid[action.row][action.col] = new Set(action.newNotes);
    } else if (action.type === 'erase') {
      this.currentGrid[action.row][action.col] = 0;
      this.notesGrid[action.row][action.col].clear();
    }

    this.selectedCell = { row: action.row, col: action.col };
    this.audio.playClick();
    this.renderBoard();
    this.updateKeypadCounts();
    this.saveCurrentGame();
  }

  /**
   * Auto-fills candidate pencil marks for every empty cell on the board
   */
  autoFillCandidates() {
    if (this.isPaused || this.isGameOver || this.isWon) return;
    
    // Save current notes snapshot for undo
    const prevNotesSnapshot = this.notesGrid.map(row => row.map(s => new Set(s)));
    let addedCount = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.currentGrid[r][c] === 0) {
          const validCandidates = SudokuEngine.getCandidates(this.currentGrid, r, c);
          this.notesGrid[r][c] = new Set(validCandidates);
          addedCount++;
        }
      }
    }

    this.historyStack.push({
      type: 'auto-notes',
      row: 0,
      col: 0,
      prevNotesGrid: prevNotesSnapshot
    });
    this.redoStack = [];

    this.audio.playNote();
    this.renderBoard();
    this.saveCurrentGame();
    this.showToast(`Auto-filled candidates across ${addedCount} empty cells!`);
  }

  /**
   * Requests a smart hint from the engine
   */
  requestHint() {
    if (this.isPaused || this.isGameOver || this.isWon) return;

    const hint = SudokuEngine.getSmartHint(this.currentGrid, this.solutionGrid);
    if (!hint) {
      this.showToast('No hints available or board is already solved!');
      return;
    }

    this.activeHint = hint;
    this.audio.playHint();
    this.selectedCell = { row: hint.row, col: hint.col };

    // Highlight target cell
    const cellEl = this.getCellElement(hint.row, hint.col);
    if (cellEl) cellEl.classList.add('hint-target');

    this.dom.hintText.textContent = hint.message;
    this.dom.hintBanner.classList.remove('hidden');

    this.updateHighlights();
  }

  /**
   * Applies the current active hint to the board
   */
  applyActiveHint() {
    if (!this.activeHint) return;
    const { row, col, value } = this.activeHint;

    this.selectedCell = { row, col };
    this.currentGrid[row][col] = value;
    this.notesGrid[row][col].clear();

    this.audio.playClick();
    this.hideHintBanner();
    this.renderBoard();
    this.updateKeypadCounts();
    this.saveCurrentGame();
    this.checkGameCompletion();
  }

  hideHintBanner() {
    this.dom.hintBanner.classList.add('hidden');
    this.activeHint = null;
    const target = this.dom.grid.querySelector('.hint-target');
    if (target) target.classList.remove('hint-target');
  }

  /**
   * Verifies if all 81 cells are correctly filled
   */
  checkGameCompletion() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.currentGrid[r][c] !== this.solutionGrid[r][c]) {
          return false;
        }
      }
    }
    // Victory!
    this.triggerVictory();
    return true;
  }

  /**
   * Trigger victory celebratory flow
   */
  triggerVictory() {
    this.isWon = true;
    this.stopTimer();
    this.audio.playVictory();
    this.confetti.start(5000);

    // Save career statistics
    StorageManager.recordGameWin(this.difficulty, this.timerSeconds);
    StorageManager.clearActiveGame();

    // Populate victory modal
    document.getElementById('vstat-diff').textContent = SudokuEngine.DIFFICULTIES[this.difficulty]?.name || 'Medium';
    document.getElementById('vstat-time').textContent = this.formatTime(this.timerSeconds);
    document.getElementById('vstat-mistakes').textContent = this.mistakes;
    document.getElementById('vstat-score').textContent = this.score.toLocaleString();

    this.dom.modalVictory.classList.remove('hidden');
  }

  /**
   * Trigger Game Over modal
   */
  triggerGameOver() {
    this.isGameOver = true;
    this.stopTimer();
    this.audio.playError();
    StorageManager.recordGameLoss(this.difficulty);
    StorageManager.clearActiveGame();
    this.dom.modalGameOver.classList.remove('hidden');
  }

  /**
   * Timer management
   */
  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (!this.isPaused && !this.isGameOver && !this.isWon) {
        this.timerSeconds++;
        this.dom.timerDisplay.textContent = this.formatTime(this.timerSeconds);
        // Save progress occasionally
        if (this.timerSeconds % 10 === 0) {
          this.saveCurrentGame();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  togglePause() {
    if (this.isGameOver || this.isWon) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.dom.pauseOverlay.classList.remove('hidden');
    } else {
      this.dom.pauseOverlay.classList.add('hidden');
    }
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateMistakesUI() {
    if (this.settings.mistakeLimit) {
      this.dom.mistakesContainer.style.display = 'flex';
      this.dom.mistakesBadge.textContent = `${this.mistakes} / ${this.maxMistakes}`;
      if (this.mistakes > 0) {
        this.dom.mistakesBadge.style.color = 'var(--danger-color)';
      } else {
        this.dom.mistakesBadge.style.color = 'var(--text-primary)';
      }
    } else {
      this.dom.mistakesBadge.textContent = `${this.mistakes} (Casual)`;
      this.dom.mistakesBadge.style.color = 'var(--text-secondary)';
    }
  }

  updateScoreUI() {
    this.dom.scoreBadge.textContent = this.score.toLocaleString();
  }

  getCellElement(r, c) {
    return this.dom.grid.querySelector(`.sudoku-cell[data-row="${r}"][data-col="${c}"]`);
  }

  /**
   * Event Listeners & Keyboard Navigation
   */
  setupEventListeners() {
    // New game dropdown toggle
    this.dom.btnNewGameDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      const mobileMenu = document.getElementById('mobile-menu-dropdown');
      if (mobileMenu) mobileMenu.classList.remove('show');
      this.dom.difficultyMenu.classList.toggle('show');
    });

    // Mobile More Menu
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const mobileMenuDropdown = document.getElementById('mobile-menu-dropdown');
    if (mobileMenuBtn && mobileMenuDropdown) {
      mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dom.difficultyMenu.classList.remove('show');
        mobileMenuDropdown.classList.toggle('show');
      });

      document.getElementById('btn-mobile-stats')?.addEventListener('click', () => {
        mobileMenuDropdown.classList.remove('show');
        this.openStatsModal();
      });

      document.getElementById('btn-mobile-rules')?.addEventListener('click', () => {
        mobileMenuDropdown.classList.remove('show');
        this.dom.modalRules.classList.remove('hidden');
      });

      document.getElementById('btn-mobile-settings')?.addEventListener('click', () => {
        mobileMenuDropdown.classList.remove('show');
        this.openSettingsModal();
      });

      document.getElementById('btn-mobile-custom')?.addEventListener('click', () => {
        mobileMenuDropdown.classList.remove('show');
        this.dom.modalCustom.classList.remove('hidden');
      });

      document.getElementById('btn-mobile-auto-notes')?.addEventListener('click', () => {
        mobileMenuDropdown.classList.remove('show');
        this.autoFillCandidates();
      });
    }

    document.addEventListener('click', (e) => {
      if (!this.dom.btnNewGameDropdown.contains(e.target) && !this.dom.difficultyMenu.contains(e.target)) {
        this.dom.difficultyMenu.classList.remove('show');
      }
      if (mobileMenuBtn && !mobileMenuBtn.contains(e.target) && !mobileMenuDropdown.contains(e.target)) {
        mobileMenuDropdown.classList.remove('show');
      }
    });

    // Difficulty menu choices
    this.dom.difficultyMenu.querySelectorAll('.dropdown-item[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.difficultyMenu.classList.remove('show');
        this.startNewGame(btn.dataset.diff);
      });
    });

    // Custom Board Trigger
    document.getElementById('btn-custom-board-trigger').addEventListener('click', () => {
      this.dom.difficultyMenu.classList.remove('show');
      this.dom.modalCustom.classList.remove('hidden');
    });

    // Pause / Resume buttons
    this.dom.btnPause.addEventListener('click', () => this.togglePause());
    this.dom.btnResume.addEventListener('click', () => this.togglePause());

    // Game Action Controls
    this.dom.btnUndo.addEventListener('click', () => this.undo());
    this.dom.btnRedo.addEventListener('click', () => this.redo());
    this.dom.btnErase.addEventListener('click', () => this.eraseCell());
    this.dom.btnNotes.addEventListener('click', () => this.toggleNotesMode());
    this.dom.btnHint.addEventListener('click', () => this.requestHint());
    this.dom.btnAutoNotes.addEventListener('click', () => this.autoFillCandidates());

    // Hint banner actions
    this.dom.btnApplyHint.addEventListener('click', () => this.applyActiveHint());
    this.dom.btnCloseHint.addEventListener('click', () => this.hideHintBanner());

    // Keypad digits
    this.dom.keypadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const digit = parseInt(btn.dataset.num, 10);
        if (this.inputMode === 'number-first') {
          this.selectedDigit = (this.selectedDigit === digit) ? null : digit;
          this.updateKeypadCounts();
          this.updateHighlights();
        } else {
          this.inputDigit(digit);
        }
      });
    });

    // Input mode pills
    this.dom.btnModeCell.addEventListener('click', () => {
      this.setInputMode('cell-first');
    });
    this.dom.btnModeDigit.addEventListener('click', () => {
      this.setInputMode('number-first');
    });

    // Print puzzle
    this.dom.btnPrint.addEventListener('click', () => {
      window.print();
    });

    // Top Header Buttons
    this.dom.btnSoundToggle.addEventListener('click', () => {
      this.settings.sound = !this.settings.sound;
      this.audio.enabled = this.settings.sound;
      StorageManager.saveSettings(this.settings);
      this.updateSoundIcon();
      this.showToast(this.settings.sound ? 'Sound enabled' : 'Sound muted');
    });

    this.dom.btnThemeToggle.addEventListener('click', () => {
      const themes = ['dark', 'light', 'emerald'];
      const currentIdx = themes.indexOf(this.settings.theme || 'dark');
      const nextTheme = themes[(currentIdx + 1) % themes.length];
      this.applyTheme(nextTheme);
      this.showToast(`Theme: ${nextTheme.toUpperCase()}`);
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  setInputMode(mode) {
    this.inputMode = mode;
    this.settings.inputMode = mode;
    StorageManager.saveSettings(this.settings);

    this.dom.btnModeCell.classList.toggle('active', mode === 'cell-first');
    this.dom.btnModeDigit.classList.toggle('active', mode === 'number-first');

    if (mode === 'cell-first') {
      this.selectedDigit = null;
      this.updateKeypadCounts();
    }
  }

  toggleNotesMode() {
    this.notesMode = !this.notesMode;
    this.dom.btnNotes.classList.toggle('active', this.notesMode);
    this.dom.notesBadge.textContent = this.notesMode ? 'ON' : 'OFF';
    this.showToast(this.notesMode ? 'Notes Mode: ON' : 'Notes Mode: OFF');
  }

  handleKeyDown(e) {
    // If any modal is active or typing in textarea, ignore game hotkeys
    if (!document.querySelector('.modal-backdrop:not(.hidden)') === false && !this.dom.modalVictory.classList.contains('hidden') === false) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    }

    // Number keys (1-9)
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const num = parseInt(e.key, 10);
      if (this.inputMode === 'number-first') {
        this.selectedDigit = num;
        this.updateKeypadCounts();
      } else {
        this.inputDigit(num);
      }
      return;
    }

    // Delete / Backspace
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      this.eraseCell();
      return;
    }

    // Arrow keys & WASD navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      e.preventDefault();
      let r = this.selectedCell ? this.selectedCell.row : 0;
      let c = this.selectedCell ? this.selectedCell.col : 0;

      if (e.code === 'ArrowUp' || e.code === 'KeyW') r = Math.max(0, r - 1);
      if (e.code === 'ArrowDown' || e.code === 'KeyS') r = Math.min(8, r + 1);
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') c = Math.max(0, c - 1);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') c = Math.min(8, c + 1);

      this.selectedCell = { row: r, col: c };
      this.updateHighlights();
      return;
    }

    // Notes toggle 'N'
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      this.toggleNotesMode();
      return;
    }

    // Hint 'H'
    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      this.requestHint();
      return;
    }

    // Undo: Ctrl+Z or Z
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
      e.preventDefault();
      this.undo();
      return;
    }

    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if (((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
      e.preventDefault();
      this.redo();
      return;
    }

    // Pause toggle: Space or 'P'
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      this.togglePause();
      return;
    }
  }

  /**
   * Modals Setup
   */
  setupModals() {
    // Modal open buttons
    this.dom.btnStats.addEventListener('click', () => this.openStatsModal());
    this.dom.btnRules.addEventListener('click', () => this.dom.modalRules.classList.remove('hidden'));
    this.dom.btnSettings.addEventListener('click', () => this.openSettingsModal());

    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.closeModal;
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.add('hidden');
          this.confetti.stop();
        }
      });
    });

    // Victory modal buttons
    document.getElementById('btn-victory-new').addEventListener('click', () => {
      this.dom.modalVictory.classList.add('hidden');
      this.confetti.stop();
      this.startNewGame(this.difficulty);
    });

    document.getElementById('btn-victory-share').addEventListener('click', () => {
      const shareText = `🧩 I solved a ${SudokuEngine.DIFFICULTIES[this.difficulty].name} Sudoku in ${this.formatTime(this.timerSeconds)} on Zen Sudoku!`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText);
        this.showToast('Result copied to clipboard!');
      } else {
        this.showToast(shareText);
      }
    });

    // Game Over modal buttons
    document.getElementById('btn-gameover-revive').addEventListener('click', () => {
      this.dom.modalGameOver.classList.add('hidden');
      this.settings.mistakeLimit = false;
      this.isGameOver = false;
      this.updateMistakesUI();
      this.startTimer();
      this.showToast('Casual Mode active: Unlimited mistakes allowed!');
    });

    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      this.dom.modalGameOver.classList.add('hidden');
      this.currentGrid = this.initialGrid.map(row => [...row]);
      this.notesGrid = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
      this.mistakes = 0;
      this.timerSeconds = 0;
      this.isGameOver = false;
      this.updateMistakesUI();
      this.renderBoard();
      this.startTimer();
    });

    document.getElementById('btn-gameover-new').addEventListener('click', () => {
      this.dom.modalGameOver.classList.add('hidden');
      this.startNewGame(this.difficulty);
    });

    // Stats tab switches
    document.querySelectorAll('[data-stats-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('[data-stats-tab]').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        this.renderStatsTab(tabBtn.dataset.statsTab);
      });
    });

    document.getElementById('btn-reset-stats').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all your statistics?')) {
        StorageManager.resetStats();
        this.renderStatsTab('medium');
        this.showToast('Career stats cleared');
      }
    });

    // Settings Modal Bindings
    this.setupSettingsEvents();

    // Custom Board Modal Bindings
    this.setupCustomBoardEvents();
  }

  openStatsModal() {
    this.dom.modalStats.classList.remove('hidden');
    // Active tab
    const activeTab = document.querySelector('.stats-tab.active')?.dataset.statsTab || 'medium';
    this.renderStatsTab(activeTab);
  }

  renderStatsTab(diff) {
    const stats = StorageManager.loadStats();
    const data = stats[diff] || { played: 0, won: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 };

    document.getElementById('stat-played').textContent = data.played;
    const winRate = data.played > 0 ? Math.round((data.won / data.played) * 100) : 0;
    document.getElementById('stat-winrate').textContent = `${winRate}%`;
    document.getElementById('stat-best-time').textContent = data.bestTime ? this.formatTime(data.bestTime) : '--:--';
    
    const avgTimeSec = data.won > 0 ? Math.round(data.totalTime / data.won) : 0;
    document.getElementById('stat-avg-time').textContent = avgTimeSec > 0 ? this.formatTime(avgTimeSec) : '--:--';
    document.getElementById('stat-streak').textContent = data.currentStreak;
    document.getElementById('stat-best-streak').textContent = data.bestStreak;
  }

  openSettingsModal() {
    this.dom.modalSettings.classList.remove('hidden');
    document.getElementById('setting-theme-select').value = this.settings.theme || 'dark';
    document.getElementById('set-sound').checked = this.settings.sound !== false;
    document.getElementById('set-duplicates').checked = this.settings.highlightDuplicates !== false;
    document.getElementById('set-peers').checked = this.settings.highlightPeers !== false;
    document.getElementById('set-same-numbers').checked = this.settings.highlightSameNumbers !== false;
    document.getElementById('set-auto-remove').checked = this.settings.autoRemoveNotes !== false;
    document.getElementById('set-mistake-limit').checked = this.settings.mistakeLimit !== false;
  }

  setupSettingsEvents() {
    document.getElementById('setting-theme-select').addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });

    const bindToggle = (elemId, key, callback) => {
      document.getElementById(elemId).addEventListener('change', (e) => {
        this.settings[key] = e.target.checked;
        StorageManager.saveSettings(this.settings);
        if (callback) callback(e.target.checked);
      });
    };

    bindToggle('set-sound', 'sound', (checked) => {
      this.audio.enabled = checked;
      this.updateSoundIcon();
    });

    bindToggle('set-duplicates', 'highlightDuplicates', () => this.renderBoard());
    bindToggle('set-peers', 'highlightPeers', () => this.updateHighlights());
    bindToggle('set-same-numbers', 'highlightSameNumbers', () => this.updateHighlights());
    bindToggle('set-auto-remove', 'autoRemoveNotes');
    bindToggle('set-mistake-limit', 'mistakeLimit', () => this.updateMistakesUI());
  }

  setupCustomBoardEvents() {
    const input = document.getElementById('custom-puzzle-input');
    const errorEl = document.getElementById('custom-error-msg');

    document.getElementById('btn-load-custom-string').addEventListener('click', () => {
      const raw = input.value.trim().replace(/[\s\r\n]/g, '');
      if (raw.length !== 81) {
        errorEl.textContent = `Expected 81 characters, got ${raw.length}. Use 1-9 for numbers and 0 or . for blanks.`;
        errorEl.classList.remove('hidden');
        return;
      }

      const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
      for (let i = 0; i < 81; i++) {
        const char = raw[i];
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (char >= '1' && char <= '9') {
          grid[r][c] = parseInt(char, 10);
        } else if (char === '0' || char === '.') {
          grid[r][c] = 0;
        } else {
          errorEl.textContent = `Invalid character '${char}' at index ${i + 1}`;
          errorEl.classList.remove('hidden');
          return;
        }
      }

      // Check if puzzle has a valid solution
      const sol = SudokuEngine.solve(grid);
      if (!sol.solved) {
        errorEl.textContent = 'This puzzle is unsolvable or contains rule violations.';
        errorEl.classList.remove('hidden');
        return;
      }

      errorEl.classList.add('hidden');
      this.dom.modalCustom.classList.add('hidden');

      this.initialGrid = grid.map(row => [...row]);
      this.currentGrid = grid.map(row => [...row]);
      this.solutionGrid = sol.grid;
      this.notesGrid = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
      this.difficulty = 'custom';
      this.dom.diffBadge.textContent = 'Custom';
      this.mistakes = 0;
      this.timerSeconds = 0;
      this.historyStack = [];
      this.redoStack = [];

      this.renderBoard();
      this.updateKeypadCounts();
      this.startTimer();
      this.showToast('Custom puzzle loaded successfully!');
    });

    document.getElementById('btn-solve-custom-string').addEventListener('click', () => {
      const raw = input.value.trim().replace(/[\s\r\n]/g, '');
      if (raw.length !== 81) {
        errorEl.textContent = `Expected 81 characters, got ${raw.length}.`;
        errorEl.classList.remove('hidden');
        return;
      }
      const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
      for (let i = 0; i < 81; i++) {
        const char = raw[i];
        const r = Math.floor(i / 9);
        const c = i % 9;
        grid[r][c] = (char >= '1' && char <= '9') ? parseInt(char, 10) : 0;
      }

      const sol = SudokuEngine.solve(grid);
      if (!sol.solved) {
        errorEl.textContent = 'Unable to solve this custom board.';
        errorEl.classList.remove('hidden');
        return;
      }

      let solString = '';
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          solString += sol.grid[r][c];
        }
      }
      input.value = solString;
      errorEl.classList.add('hidden');
      this.showToast('Solution computed and filled into box!');
    });

    document.getElementById('btn-clear-custom-board').addEventListener('click', () => {
      input.value = '0'.repeat(81);
      errorEl.classList.add('hidden');
    });
  }

  applyTheme(theme) {
    this.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    StorageManager.saveSettings(this.settings);
    this.updateThemeIcon(theme);
  }

  updateThemeIcon(theme) {
    const moon = document.querySelector('.theme-moon');
    const sun = document.querySelector('.theme-sun');
    const emerald = document.querySelector('.theme-emerald-icon');

    if (moon) moon.classList.toggle('hidden', theme !== 'dark');
    if (sun) sun.classList.toggle('hidden', theme !== 'light');
    if (emerald) emerald.classList.toggle('hidden', theme !== 'emerald');
  }

  updateSoundIcon() {
    const onIcon = document.querySelector('.sound-on-icon');
    const offIcon = document.querySelector('.sound-off-icon');
    if (this.audio.enabled) {
      if (onIcon) onIcon.classList.remove('hidden');
      if (offIcon) offIcon.classList.add('hidden');
    } else {
      if (onIcon) onIcon.classList.add('hidden');
      if (offIcon) offIcon.classList.remove('hidden');
    }
  }

  showToast(message, durationMs = 2600) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, durationMs);
  }
}

// Initialize Application once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.sudokuApp = new SudokuApp();
});
