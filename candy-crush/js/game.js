/**
 * Candy Crush — Core Game Engine
 * Match-3 logic, cascading, special candies, scoring
 */

import { CANDY_TYPES, SPECIAL_TYPES, getLevelConfig } from './levels.js';

export class GameEngine {
  constructor() {
    this.board = [];       // 2D array of { type, special }
    this.rows = 8;
    this.cols = 8;
    this.score = 0;
    this.movesLeft = 0;
    this.level = null;
    this.chainLevel = 0;
    this.isProcessing = false;
    this.candyTypeCount = 6;

    // Callbacks
    this.onBoardChanged = null;
    this.onScoreChanged = null;
    this.onMovesChanged = null;
    this.onMatchFound = null;
    this.onSpecialCreated = null;
    this.onSpecialActivated = null;
    this.onCascade = null;
    this.onGameOver = null;
    this.onLevelComplete = null;
    this.onCandiesRemoved = null;
    this.onCandiesDropped = null;
    this.onCandiesSpawned = null;
  }

  /**
   * Initialize a new game with the given level
   */
  initLevel(levelId) {
    this.level = getLevelConfig(levelId);
    this.rows = this.level.rows;
    this.cols = this.level.cols;
    this.movesLeft = this.level.moves;
    this.score = 0;
    this.chainLevel = 0;
    this.isProcessing = false;
    this.candyTypeCount = this.level.candyTypes;
    this.generateBoard();
    return this.level;
  }

  /**
   * Generate a board with no initial matches
   */
  generateBoard() {
    this.board = [];
    for (let r = 0; r < this.rows; r++) {
      this.board[r] = [];
      for (let c = 0; c < this.cols; c++) {
        let type;
        do {
          type = Math.floor(Math.random() * this.candyTypeCount);
        } while (this._wouldMatch(r, c, type));
        this.board[r][c] = { type, special: SPECIAL_TYPES.NONE };
      }
    }
  }

  /**
   * Check if placing a type at (r,c) would create a match
   */
  _wouldMatch(r, c, type) {
    // Check horizontal
    if (c >= 2 &&
        this.board[r][c-1] && this.board[r][c-1].type === type &&
        this.board[r][c-2] && this.board[r][c-2].type === type) {
      return true;
    }
    // Check vertical
    if (r >= 2 &&
        this.board[r-1] && this.board[r-1][c] && this.board[r-1][c].type === type &&
        this.board[r-2] && this.board[r-2][c] && this.board[r-2][c].type === type) {
      return true;
    }
    return false;
  }

  /**
   * Get the candy at a position
   */
  getCandy(r, c) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    return this.board[r][c];
  }

  /**
   * Check if two positions are adjacent
   */
  areAdjacent(r1, c1, r2, c2) {
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);
    return (dr + dc === 1);
  }

  /**
   * Attempt to swap two candies - returns true if the swap resulted in a match
   */
  async trySwap(r1, c1, r2, c2) {
    if (this.isProcessing) return false;
    if (!this.areAdjacent(r1, c1, r2, c2)) return false;
    if (this.movesLeft <= 0) return false;

    this.isProcessing = true;

    // Perform the swap
    this._swap(r1, c1, r2, c2);

    // Check for matches
    const matches = this.findAllMatches();

    if (matches.length === 0) {
      // No match — swap back
      this._swap(r1, c1, r2, c2);
      this.isProcessing = false;
      return false;
    }

    // Valid move — decrement moves
    this.movesLeft--;
    if (this.onMovesChanged) this.onMovesChanged(this.movesLeft);

    // Process the match cascade
    this.chainLevel = 0;
    await this._processCascade(matches);

    // Check win/lose
    if (this.score >= this.level.targetScore) {
      const stars = this._calculateStars();
      if (this.onLevelComplete) this.onLevelComplete(this.score, stars);
    } else if (this.movesLeft <= 0) {
      if (this.onGameOver) this.onGameOver(this.score);
    }

    this.isProcessing = false;
    return true;
  }

  /**
   * Internal swap
   */
  _swap(r1, c1, r2, c2) {
    const temp = this.board[r1][c1];
    this.board[r1][c1] = this.board[r2][c2];
    this.board[r2][c2] = temp;
  }

  /**
   * Find all matches on the board
   * Returns array of match objects: { cells: [{r,c},...], type, direction, length }
   */
  findAllMatches() {
    const matches = [];
    const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

    // Horizontal matches
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const type = this.board[r][c].type;
        if (type === -1) { c++; continue; }
        let end = c;
        while (end + 1 < this.cols && this.board[r][end + 1].type === type) {
          end++;
        }
        const length = end - c + 1;
        if (length >= 3) {
          const cells = [];
          for (let i = c; i <= end; i++) {
            cells.push({ r, c: i });
          }
          matches.push({ cells, type, direction: 'horizontal', length });
        }
        c = end + 1;
      }
    }

    // Vertical matches
    for (let c = 0; c < this.cols; c++) {
      let r = 0;
      while (r < this.rows) {
        const type = this.board[r][c].type;
        if (type === -1) { r++; continue; }
        let end = r;
        while (end + 1 < this.rows && this.board[end + 1][c].type === type) {
          end++;
        }
        const length = end - r + 1;
        if (length >= 3) {
          const cells = [];
          for (let i = r; i <= end; i++) {
            cells.push({ r: i, c });
          }
          matches.push({ cells, type, direction: 'vertical', length });
        }
        r = end + 1;
      }
    }

    return matches;
  }

  /**
   * Process cascade: remove matches, create specials, apply gravity, repeat
   */
  async _processCascade(matches) {
    while (matches.length > 0) {
      this.chainLevel++;

      // Determine specials to create from matches
      const specialsToCreate = this._determineSpecials(matches);

      // Collect all cells to remove (with deduplication)
      const cellsToRemove = new Set();
      const specialActivations = [];

      for (const match of matches) {
        for (const cell of match.cells) {
          const candy = this.board[cell.r][cell.c];
          // If this candy is special, queue its activation
          if (candy && candy.special !== SPECIAL_TYPES.NONE) {
            specialActivations.push({ r: cell.r, c: cell.c, special: candy.special, type: candy.type });
          }
          cellsToRemove.add(`${cell.r},${cell.c}`);
        }
      }

      // Process special candy activations
      for (const act of specialActivations) {
        const extraCells = this._getSpecialClearCells(act.r, act.c, act.special, act.type);
        for (const cell of extraCells) {
          cellsToRemove.add(`${cell.r},${cell.c}`);
        }
      }

      // Calculate score
      const basePoints = cellsToRemove.size * 10;
      const chainMultiplier = this.chainLevel;
      const points = basePoints * chainMultiplier;
      this.score += points;

      // Notify
      if (this.onMatchFound) this.onMatchFound(matches, this.chainLevel, points);
      if (this.onScoreChanged) this.onScoreChanged(this.score);
      if (specialActivations.length > 0 && this.onSpecialActivated) {
        this.onSpecialActivated(specialActivations);
      }

      // Remove matched cells
      const removedCells = [];
      for (const key of cellsToRemove) {
        const [r, c] = key.split(',').map(Number);
        removedCells.push({ r, c, type: this.board[r][c].type });
        this.board[r][c] = null;
      }
      if (this.onCandiesRemoved) {
        await this.onCandiesRemoved(removedCells);
      }

      // Create special candies at intersection points
      for (const spec of specialsToCreate) {
        if (!this.board[spec.r][spec.c]) {
          this.board[spec.r][spec.c] = { type: spec.type, special: spec.special };
          if (this.onSpecialCreated) this.onSpecialCreated(spec);
        }
      }

      // Apply gravity — drop candies down
      const droppedCandies = this._applyGravity();
      if (this.onCandiesDropped && droppedCandies.length > 0) {
        await this.onCandiesDropped(droppedCandies);
      }

      // Spawn new candies at the top
      const spawnedCandies = this._spawnNewCandies();
      if (this.onCandiesSpawned && spawnedCandies.length > 0) {
        await this.onCandiesSpawned(spawnedCandies);
      }

      if (this.chainLevel > 1 && this.onCascade) {
        this.onCascade(this.chainLevel);
      }

      // Check for new matches
      matches = this.findAllMatches();
    }
  }

  /**
   * Determine what special candies to create based on match patterns
   */
  _determineSpecials(matches) {
    const specials = [];

    // Check for intersecting matches (L/T shapes → Wrapped)
    const cellMatchCount = {};
    for (const match of matches) {
      for (const cell of match.cells) {
        const key = `${cell.r},${cell.c}`;
        if (!cellMatchCount[key]) cellMatchCount[key] = [];
        cellMatchCount[key].push(match);
      }
    }

    // Find intersection cells (part of 2+ matches)
    const intersections = new Set();
    for (const [key, matchList] of Object.entries(cellMatchCount)) {
      if (matchList.length >= 2) {
        intersections.add(key);
        const [r, c] = key.split(',').map(Number);
        specials.push({
          r, c,
          type: this.board[r][c].type,
          special: SPECIAL_TYPES.WRAPPED
        });
      }
    }

    // Match-5 → Color Bomb, Match-4 → Striped
    for (const match of matches) {
      // Skip if this match already has an intersection (handled above)
      const hasIntersection = match.cells.some(cell => intersections.has(`${cell.r},${cell.c}`));
      if (hasIntersection) continue;

      if (match.length >= 5) {
        // Color bomb at the middle cell
        const mid = Math.floor(match.cells.length / 2);
        const cell = match.cells[mid];
        specials.push({
          r: cell.r, c: cell.c,
          type: match.type,
          special: SPECIAL_TYPES.COLOR_BOMB
        });
      } else if (match.length === 4) {
        // Striped candy — perpendicular to match direction
        const mid = Math.floor(match.cells.length / 2);
        const cell = match.cells[mid];
        specials.push({
          r: cell.r, c: cell.c,
          type: match.type,
          special: match.direction === 'horizontal' ? SPECIAL_TYPES.STRIPED_V : SPECIAL_TYPES.STRIPED_H
        });
      }
    }

    return specials;
  }

  /**
   * Get cells cleared by a special candy activation
   */
  _getSpecialClearCells(r, c, special, type) {
    const cells = [];

    switch (special) {
      case SPECIAL_TYPES.STRIPED_H:
        for (let col = 0; col < this.cols; col++) {
          if (this.board[r][col]) cells.push({ r, c: col });
        }
        break;
      case SPECIAL_TYPES.STRIPED_V:
        for (let row = 0; row < this.rows; row++) {
          if (this.board[row][c]) cells.push({ r: row, c });
        }
        break;
      case SPECIAL_TYPES.WRAPPED:
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc]) {
              cells.push({ r: nr, c: nc });
            }
          }
        }
        break;
      case SPECIAL_TYPES.COLOR_BOMB:
        // Clear all candies of the given type
        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col < this.cols; col++) {
            if (this.board[row][col] && this.board[row][col].type === type) {
              cells.push({ r: row, c: col });
            }
          }
        }
        break;
    }

    return cells;
  }

  /**
   * Apply gravity — move candies down to fill gaps
   * Returns array of { r, c, fromR, fromC } for animation
   */
  _applyGravity() {
    const drops = [];

    for (let c = 0; c < this.cols; c++) {
      let writePos = this.rows - 1;

      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.board[r][c] !== null) {
          if (r !== writePos) {
            drops.push({
              fromR: r, fromC: c,
              r: writePos, c,
              candy: this.board[r][c]
            });
            this.board[writePos][c] = this.board[r][c];
            this.board[r][c] = null;
          }
          writePos--;
        }
      }
    }

    return drops;
  }

  /**
   * Spawn new candies in empty cells at the top
   * Returns array of { r, c, candy } for animation
   */
  _spawnNewCandies() {
    const spawned = [];

    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (this.board[r][c] === null) {
          const type = Math.floor(Math.random() * this.candyTypeCount);
          this.board[r][c] = { type, special: SPECIAL_TYPES.NONE };
          spawned.push({ r, c, candy: this.board[r][c] });
        }
      }
    }

    return spawned;
  }

  /**
   * Calculate star rating based on score
   */
  _calculateStars() {
    if (!this.level) return 0;
    const thresholds = this.level.stars;
    if (this.score >= thresholds[2]) return 3;
    if (this.score >= thresholds[1]) return 2;
    if (this.score >= thresholds[0]) return 1;
    return 0;
  }

  /**
   * Check if any valid moves exist
   */
  hasValidMoves() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Try swap right
        if (c + 1 < this.cols) {
          this._swap(r, c, r, c + 1);
          const matches = this.findAllMatches();
          this._swap(r, c, r, c + 1); // swap back
          if (matches.length > 0) return true;
        }
        // Try swap down
        if (r + 1 < this.rows) {
          this._swap(r, c, r + 1, c);
          const matches = this.findAllMatches();
          this._swap(r, c, r + 1, c); // swap back
          if (matches.length > 0) return true;
        }
      }
    }
    return false;
  }

  /**
   * Shuffle the board if no valid moves exist
   */
  shuffleBoard() {
    // Fisher-Yates shuffle on the flat board
    const flat = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        flat.push(this.board[r][c]);
      }
    }

    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }

    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.board[r][c] = flat[idx++];
      }
    }

    // If shuffle creates matches or still no valid moves, regenerate
    if (this.findAllMatches().length > 0 || !this.hasValidMoves()) {
      this.generateBoard();
    }
  }

  /**
   * Get a copy of the current board state
   */
  getBoardState() {
    return this.board.map(row => row.map(cell => cell ? { ...cell } : null));
  }

  /**
   * Calculate progress percentage toward target score
   */
  getProgress() {
    if (!this.level) return 0;
    return Math.min(1, this.score / this.level.targetScore);
  }
}
