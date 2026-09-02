/**
 * LocalStorage and Game Persistence Manager
 */

const STORAGE_KEYS = {
  ACTIVE_GAME: 'zen_sudoku_active_game_v1',
  SETTINGS: 'zen_sudoku_settings_v1',
  STATS: 'zen_sudoku_stats_v1'
};

const DEFAULT_SETTINGS = {
  theme: 'dark', // 'dark' | 'light' | 'emerald'
  sound: true,
  highlightDuplicates: true,
  highlightPeers: true,
  highlightSameNumbers: true,
  autoRemoveNotes: true,
  mistakeLimit: true, // 3 mistakes max
  inputMode: 'cell-first' // 'cell-first' | 'number-first'
};

const DEFAULT_STATS = {
  beginner: { played: 0, won: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 },
  easy: { played: 0, won: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 },
  medium: { played: 0, won: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 },
  hard: { played: 0, won: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 },
  expert: { played: 0, won: 0, bestTime: null, totalTime: 0, currentStreak: 0, bestStreak: 0 }
};

export class StorageManager {
  static loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Unable to save settings to localStorage', e);
    }
  }

  static loadStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      return data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : JSON.parse(JSON.stringify(DEFAULT_STATS));
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_STATS));
    }
  }

  static recordGameStart(difficulty) {
    const stats = this.loadStats();
    if (stats[difficulty]) {
      stats[difficulty].played++;
      try {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      } catch (e) {}
    }
    return stats;
  }

  static recordGameWin(difficulty, timeSeconds) {
    const stats = this.loadStats();
    if (stats[difficulty]) {
      const s = stats[difficulty];
      s.won++;
      s.totalTime += timeSeconds;
      s.currentStreak++;
      if (s.currentStreak > s.bestStreak) {
        s.bestStreak = s.currentStreak;
      }
      if (s.bestTime === null || timeSeconds < s.bestTime) {
        s.bestTime = timeSeconds;
      }
      try {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      } catch (e) {}
    }
    return stats;
  }

  static recordGameLoss(difficulty) {
    const stats = this.loadStats();
    if (stats[difficulty]) {
      stats[difficulty].currentStreak = 0;
      try {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      } catch (e) {}
    }
    return stats;
  }

  static resetStats() {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(DEFAULT_STATS));
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_STATS));
  }

  static saveActiveGame(gameData) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(gameData));
    } catch (e) {
      console.warn('Unable to persist active game state', e);
    }
  }

  static loadActiveGame() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static clearActiveGame() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
    } catch (e) {}
  }
}
