/**
 * Sudoku Engine
 * Fast puzzle generator, solver, candidate tracker, and hint logic
 */

export class SudokuEngine {
  static DIFFICULTIES = {
    beginner: { name: 'Beginner', clues: 50, minClues: 46 },
    easy: { name: 'Easy', clues: 40, minClues: 38 },
    medium: { name: 'Medium', clues: 33, minClues: 31 },
    hard: { name: 'Hard', clues: 28, minClues: 26 },
    expert: { name: 'Expert', clues: 24, minClues: 22 }
  };

  /**
   * Generates a new Sudoku puzzle
   * @param {string} difficultyKey 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'
   * @returns {{ initial: number[][], solution: number[][], difficulty: string }}
   */
  static generate(difficultyKey = 'medium') {
    const diffConfig = this.DIFFICULTIES[difficultyKey] || this.DIFFICULTIES.medium;
    
    // Step 1: Create a full solved 9x9 grid
    const solution = this.createSolvedGrid();
    
    // Step 2: Clone grid to carve out clues
    const puzzle = solution.map(row => [...row]);
    
    // Step 3: Remove cells while preserving unique solution
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }
    this.shuffle(positions);

    let cluesRemaining = 81;
    const targetClues = diffConfig.clues;

    for (const [r, c] of positions) {
      if (cluesRemaining <= targetClues) break;

      const temp = puzzle[r][c];
      puzzle[r][c] = 0;

      // Ensure uniqueness
      const solCount = this.countSolutions(puzzle, 2);
      if (solCount !== 1) {
        // Revert cell if multiple solutions arise
        puzzle[r][c] = temp;
      } else {
        cluesRemaining--;
      }
    }

    return {
      initial: puzzle,
      solution: solution,
      difficulty: difficultyKey
    };
  }

  /**
   * Generates a complete valid 9x9 solved grid
   */
  static createSolvedGrid() {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    
    // Fill diagonal 3x3 boxes first (they are independent)
    for (let box = 0; box < 9; box += 3) {
      const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      let idx = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          grid[box + r][box + c] = nums[idx++];
        }
      }
    }

    // Solve the remaining cells using backtracking with random candidates
    this.solveRandomized(grid);
    return grid;
  }

  /**
   * Randomized backtracking solver to fill grid
   */
  static solveRandomized(grid) {
    const emptyCell = this.findEmptyCell(grid);
    if (!emptyCell) return true; // Solved

    const [row, col] = emptyCell;
    const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of nums) {
      if (this.isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;
        if (this.solveRandomized(grid)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  /**
   * Counts number of solutions up to a limit (typically limit = 2 for uniqueness)
   */
  static countSolutions(grid, limit = 2) {
    let count = 0;

    const solve = (g) => {
      if (count >= limit) return;
      const empty = this.findEmptyCell(g);
      if (!empty) {
        count++;
        return;
      }
      const [r, c] = empty;
      for (let num = 1; num <= 9; num++) {
        if (this.isValidPlacement(g, r, c, num)) {
          g[r][c] = num;
          solve(g);
          g[r][c] = 0;
          if (count >= limit) return;
        }
      }
    };

    // Deep copy for simulation
    const clone = grid.map(row => [...row]);
    solve(clone);
    return count;
  }

  /**
   * Deterministic solver to solve any valid grid
   */
  static solve(grid) {
    const clone = grid.map(row => [...row]);
    const solved = this._solveDeterministic(clone);
    return { solved, grid: clone };
  }

  static _solveDeterministic(grid) {
    const empty = this.findEmptyCell(grid);
    if (!empty) return true;
    const [r, c] = empty;

    for (let num = 1; num <= 9; num++) {
      if (this.isValidPlacement(grid, r, c, num)) {
        grid[r][c] = num;
        if (this._solveDeterministic(grid)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  /**
   * Checks if placing num at (row, col) violates row, column or box constraints
   */
  static isValidPlacement(grid, row, col, num) {
    // Check row and column
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num && i !== col) return false;
      if (grid[i][col] === num && i !== row) return false;
    }

    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const currR = startRow + r;
        const currC = startCol + c;
        if (grid[currR][currC] === num && (currR !== row || currC !== col)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Finds the next empty cell (row, col)
   */
  static findEmptyCell(grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) return [r, c];
      }
    }
    return null;
  }

  /**
   * Returns list of valid candidate digits [1-9] for cell (row, col)
   */
  static getCandidates(grid, row, col) {
    if (grid[row][col] !== 0) return [];
    const candidates = [];
    for (let n = 1; n <= 9; n++) {
      if (this.isValidPlacement(grid, row, col, n)) {
        candidates.push(n);
      }
    }
    return candidates;
  }

  /**
   * Provides an intelligent, educational hint for the current board
   */
  static getSmartHint(currentGrid, solutionGrid) {
    // Check 1: Check for any existing incorrect cell
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = currentGrid[r][c];
        if (val !== 0 && val !== solutionGrid[r][c]) {
          return {
            type: 'conflict',
            row: r,
            col: c,
            value: solutionGrid[r][c],
            message: `Cell at Row ${r + 1}, Col ${c + 1} has an incorrect number (${val}). Erasing or fixing it will help you proceed!`
          };
        }
      }
    }

    // Check 2: Look for Naked Single (cell with only 1 possible candidate)
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentGrid[r][c] === 0) {
          const candidates = this.getCandidates(currentGrid, r, c);
          if (candidates.length === 1) {
            const val = candidates[0];
            return {
              type: 'naked-single',
              row: r,
              col: c,
              value: val,
              message: `Naked Single: At Row ${r + 1}, Column ${c + 1}, all other numbers (1-9) are blocked by its row, column, or box. Only ${val} can fit here!`
            };
          }
        }
      }
    }

    // Check 3: Look for Hidden Single in 3x3 boxes, rows, or cols
    // Box check
    for (let box = 0; box < 9; box++) {
      const boxRow = Math.floor(box / 3) * 3;
      const boxCol = (box % 3) * 3;
      for (let num = 1; num <= 9; num++) {
        const spots = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const currR = boxRow + r;
            const currC = boxCol + c;
            if (currentGrid[currR][currC] === 0 && this.isValidPlacement(currentGrid, currR, currC, num)) {
              spots.push([currR, currC]);
            }
          }
        }
        if (spots.length === 1) {
          const [r, c] = spots[0];
          return {
            type: 'hidden-single',
            row: r,
            col: c,
            value: num,
            message: `Hidden Single: In 3x3 Box ${box + 1}, the number ${num} can only fit in Row ${r + 1}, Column ${c + 1}!`
          };
        }
      }
    }

    // Row check
    for (let r = 0; r < 9; r++) {
      for (let num = 1; num <= 9; num++) {
        const spots = [];
        for (let c = 0; c < 9; c++) {
          if (currentGrid[r][c] === 0 && this.isValidPlacement(currentGrid, r, c, num)) {
            spots.push([r, c]);
          }
        }
        if (spots.length === 1) {
          const [currR, currC] = spots[0];
          return {
            type: 'hidden-single',
            row: currR,
            col: currC,
            value: num,
            message: `Hidden Single: In Row ${r + 1}, the number ${num} can only be placed in Column ${currC + 1}!`
          };
        }
      }
    }

    // Column check
    for (let c = 0; c < 9; c++) {
      for (let num = 1; num <= 9; num++) {
        const spots = [];
        for (let r = 0; r < 9; r++) {
          if (currentGrid[r][c] === 0 && this.isValidPlacement(currentGrid, r, c, num)) {
            spots.push([r, c]);
          }
        }
        if (spots.length === 1) {
          const [currR, currC] = spots[0];
          return {
            type: 'hidden-single',
            row: currR,
            col: currC,
            value: num,
            message: `Hidden Single: In Column ${c + 1}, the number ${num} can only be placed in Row ${currR + 1}!`
          };
        }
      }
    }

    // Fallback: Pick empty cell with fewest candidates from solution
    let bestCell = null;
    let minCandidates = 10;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentGrid[r][c] === 0) {
          const cands = this.getCandidates(currentGrid, r, c);
          if (cands.length < minCandidates && cands.length > 0) {
            minCandidates = cands.length;
            bestCell = [r, c];
          }
        }
      }
    }

    if (bestCell) {
      const [r, c] = bestCell;
      return {
        type: 'advanced',
        row: r,
        col: c,
        value: solutionGrid[r][c],
        message: `Strategic Placement: At Row ${r + 1}, Column ${c + 1}, the correct value is ${solutionGrid[r][c]}.`
      };
    }

    return null;
  }

  /**
   * Helper shuffle array
   */
  static shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
