/**
 * Candy Crush — LocalStorage Persistence
 */

const STORAGE_KEY = 'candyCrush_v1';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load save data:', e);
  }
  return getDefaults();
}

function getDefaults() {
  return {
    maxLevelUnlocked: 1,
    levelScores: {},    // { "1": { score: 5000, stars: 2 }, ... }
    totalStars: 0,
    sfxEnabled: true,
    musicEnabled: true
  };
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save data:', e);
  }
}

export const Storage = {
  /** Get full save data */
  getData() {
    return loadData();
  },

  /** Get max unlocked level */
  getMaxLevel() {
    return loadData().maxLevelUnlocked;
  },

  /** Get score/stars for a specific level */
  getLevelResult(levelId) {
    const data = loadData();
    return data.levelScores[String(levelId)] || null;
  },

  /** Save a level result (only if it improves the score) */
  saveLevelResult(levelId, score, stars) {
    const data = loadData();
    const key = String(levelId);
    const existing = data.levelScores[key];

    if (!existing || score > existing.score) {
      const oldStars = existing ? existing.stars : 0;
      data.levelScores[key] = { score, stars };

      // Recalculate total stars
      data.totalStars = Object.values(data.levelScores)
        .reduce((sum, r) => sum + r.stars, 0);

      // Unlock next level
      if (levelId >= data.maxLevelUnlocked && stars >= 1) {
        data.maxLevelUnlocked = Math.min(levelId + 1, 30);
      }

      saveData(data);
      return true;
    }
    return false;
  },

  /** Unlock next level */
  unlockLevel(levelId) {
    const data = loadData();
    if (levelId > data.maxLevelUnlocked) {
      data.maxLevelUnlocked = levelId;
      saveData(data);
    }
  },

  /** Get total stars */
  getTotalStars() {
    return loadData().totalStars;
  },

  /** Sound preferences */
  getSfxEnabled() {
    return loadData().sfxEnabled;
  },

  setSfxEnabled(enabled) {
    const data = loadData();
    data.sfxEnabled = enabled;
    saveData(data);
  },

  getMusicEnabled() {
    return loadData().musicEnabled;
  },

  setMusicEnabled(enabled) {
    const data = loadData();
    data.musicEnabled = enabled;
    saveData(data);
  },

  /** Reset all data */
  resetAll() {
    saveData(getDefaults());
  }
};
