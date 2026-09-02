/**
 * PvP Local Turn Battle Engine
 * Manages same-device turn-based duel, combo completions, shot clock, and scores
 */

export class PvPLocalBattle {
  constructor(app, options = {}) {
    this.app = app;
    this.shotClockSeconds = options.shotClockSeconds || 30; // 0 for off
    this.shotClockTimer = null;
    this.remainingTurnTime = this.shotClockSeconds;

    this.activePlayer = 1; // 1 or 2
    this.scores = { 1: 0, 2: 0 };
    this.cellsCaptured = { 1: 0, 2: 0 };
    this.cellOwnership = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.isActive = false;

    // Callbacks
    this.onStateChange = options.onStateChange || (() => {});
    this.onTurnTimeout = options.onTurnTimeout || (() => {});
  }

  start() {
    this.isActive = true;
    this.activePlayer = 1;
    this.scores = { 1: 0, 2: 0 };
    this.cellsCaptured = { 1: 0, 2: 0 };
    this.cellOwnership = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.resetShotClock();
    this.notifyState();
  }

  stop() {
    this.isActive = false;
    this.stopShotClock();
  }

  resetShotClock() {
    this.stopShotClock();
    if (this.shotClockSeconds <= 0) return;

    this.remainingTurnTime = this.shotClockSeconds;
    this.notifyState();

    this.shotClockTimer = setInterval(() => {
      if (this.app.isPaused || this.app.isGameOver || this.app.isWon) return;

      this.remainingTurnTime--;
      this.notifyState();

      if (this.remainingTurnTime <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  stopShotClock() {
    if (this.shotClockTimer) {
      clearInterval(this.shotClockTimer);
      this.shotClockTimer = null;
    }
  }

  handleTimeout() {
    this.app.showToast(`⏳ Player ${this.activePlayer}'s time expired! Turn skipped.`);
    this.app.audio.playError();
    this.switchTurn();
  }

  switchTurn() {
    this.activePlayer = this.activePlayer === 1 ? 2 : 1;
    this.resetShotClock();
    this.notifyState();
    this.app.updateHighlights();
  }

  /**
   * Processes a move in local battle mode
   */
  processMove(row, col, digit, isCorrect, currentGrid) {
    if (!this.isActive) return;

    if (!isCorrect) {
      // Mistake penalty
      this.scores[this.activePlayer] = Math.max(0, this.scores[this.activePlayer] - 30);
      this.app.showToast(`❌ Player ${this.activePlayer}: -30 pts for mistake!`);
      this.switchTurn();
      return;
    }

    // Correct placement
    this.cellOwnership[row][col] = this.activePlayer;
    this.cellsCaptured[this.activePlayer]++;
    let movePoints = 50;
    let completedUnits = 0;

    // Check if move completed a row
    const rowComplete = currentGrid[row].every(v => v !== 0);
    if (rowComplete) {
      completedUnits++;
      movePoints += 150;
    }

    // Check if move completed a column
    let colComplete = true;
    for (let r = 0; r < 9; r++) {
      if (currentGrid[r][col] === 0) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) {
      completedUnits++;
      movePoints += 150;
    }

    // Check if move completed 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    let boxComplete = true;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (currentGrid[startRow + r][startCol + c] === 0) {
          boxComplete = false;
          break;
        }
      }
    }
    if (boxComplete) {
      completedUnits++;
      movePoints += 150;
    }

    this.scores[this.activePlayer] += movePoints;

    if (completedUnits > 0) {
      this.app.showToast(`🔥 Player ${this.activePlayer} completed ${completedUnits} line/box! +${movePoints} pts!`);
    } else {
      this.app.showToast(`✨ Player ${this.activePlayer}: +${movePoints} pts!`);
    }

    // Pass turn to opponent
    this.switchTurn();
  }

  getWinner() {
    if (this.scores[1] > this.scores[2]) return 1;
    if (this.scores[2] > this.scores[1]) return 2;
    return 0; // Tie
  }

  notifyState() {
    this.onStateChange({
      activePlayer: this.activePlayer,
      scores: { ...this.scores },
      cellsCaptured: { ...this.cellsCaptured },
      remainingTurnTime: this.remainingTurnTime,
      shotClockSeconds: this.shotClockSeconds
    });
  }
}
