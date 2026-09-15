/**
 * Kids Learning Adventure — Rewards, Progress, & Parent Zone
 * LocalStorage persistence for stars, badges, curriculum milestones, and parental gate.
 */

window.RewardSystem = (function () {
  'use strict';

  const STORAGE_KEY = 'kids_learning_adventure_v1';

  let state = {
    stars: 0,
    unlockedBadges: [],
    badgeProgress: {},
    stats: {
      lettersViewed: 0,
      wordsTraced: 0,
      animalsSolved: 0,
      soundsSolved: 0,
      fruitsSolved: 0,
      veggiesSolved: 0,
      colorsSolved: 0,
      numbersSolved: 0,
      shapesSolved: 0,
      gkSolved: 0,
      matchingSolved: 0,
      memorySolved: 0,
      dailyChallengesCompleted: 0
    },
    lastDailyDate: null
  };

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = {
          ...state,
          ...parsed,
          stats: { ...state.stats, ...(parsed.stats || {}) },
          badgeProgress: { ...(parsed.badgeProgress || {}) }
        };
      }
    } catch (e) {
      console.warn('Could not load progress from localStorage:', e);
    }
    updateStarsUI();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save progress to localStorage:', e);
    }
    updateStarsUI();
  }

  function addStars(count) {
    state.stars += count;
    save();

    // Trigger star pop animation in header
    const starChip = document.getElementById('header-star-chip');
    if (starChip) {
      starChip.classList.add('star-bump');
      setTimeout(() => starChip.classList.remove('star-bump'), 600);
    }
  }

  function updateStarsUI() {
    const starEls = document.querySelectorAll('.stat-star-count');
    starEls.forEach(el => {
      el.textContent = state.stars;
    });
  }

  function recordProgress(badgeId, count = 1) {
    if (!state.badgeProgress[badgeId]) {
      state.badgeProgress[badgeId] = 0;
    }
    state.badgeProgress[badgeId] += count;

    // Check if badge is unlocked
    const badgeDef = window.GameData.badges.find(b => b.id === badgeId);
    if (badgeDef && !state.unlockedBadges.includes(badgeId)) {
      if (state.badgeProgress[badgeId] >= badgeDef.target) {
        unlockBadge(badgeDef);
      }
    }

    save();
  }

  function unlockBadge(badgeDef) {
    state.unlockedBadges.push(badgeDef.id);
    save();

    if (window.AudioSystem) {
      window.AudioSystem.playBadge();
    }

    // Show badge unlock toast
    showBadgeNotification(badgeDef);
  }

  let badgeToastTimeout = null;

  function showBadgeNotification(badge) {
    const toast = document.getElementById('badge-toast');
    if (!toast) return;

    const iconEl = document.getElementById('badge-toast-icon');
    const titleEl = document.getElementById('badge-toast-title');
    const descEl = document.getElementById('badge-toast-desc');
    const closeBtn = document.getElementById('btn-toast-close');

    if (iconEl) iconEl.textContent = badge.icon;
    if (titleEl) titleEl.textContent = `${badge.title}!`;
    if (descEl) descEl.textContent = badge.desc;

    if (badgeToastTimeout) {
      clearTimeout(badgeToastTimeout);
      badgeToastTimeout = null;
    }

    const dismissToast = () => {
      if (badgeToastTimeout) {
        clearTimeout(badgeToastTimeout);
        badgeToastTimeout = null;
      }
      toast.classList.remove('visible');
    };

    // Tap toast or close button to dismiss immediately
    toast.onclick = dismissToast;
    if (closeBtn) closeBtn.onclick = (e) => {
      e.stopPropagation();
      dismissToast();
    };

    toast.classList.add('visible');

    // Auto-dismiss after 2.4 seconds so it never stays stuck
    badgeToastTimeout = setTimeout(() => {
      dismissToast();
    }, 2400);

    if (window.Buddy) {
      window.Buddy.celebrate(`Hooray! You earned the ${badge.title} badge! 🏆`);
    }
  }

  function renderRewardsModal() {
    const grid = document.getElementById('rewards-badges-grid');
    if (!grid) return;

    grid.innerHTML = window.GameData.badges.map(b => {
      const isUnlocked = state.unlockedBadges.includes(b.id);
      const current = state.badgeProgress[b.id] || 0;
      const progressPercent = Math.min(100, Math.round((current / b.target) * 100));

      return `
        <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="badge-icon-wrap">
            <span class="badge-icon">${b.icon}</span>
            ${isUnlocked ? '<span class="badge-check">⭐</span>' : ''}
          </div>
          <h4 class="badge-name">${b.title}</h4>
          <p class="badge-desc">${b.desc}</p>
          <div class="badge-progress-bar">
            <div class="badge-progress-fill" style="width: ${isUnlocked ? 100 : progressPercent}%"></div>
          </div>
          <span class="badge-count">${isUnlocked ? 'Unlocked!' : `${current} / ${b.target}`}</span>
        </div>
      `;
    }).join('');
  }

  function resetAllProgress() {
    state = {
      stars: 0,
      unlockedBadges: [],
      badgeProgress: {},
      stats: {
        lettersViewed: 0,
        wordsTraced: 0,
        animalsSolved: 0,
        soundsSolved: 0,
        fruitsSolved: 0,
        veggiesSolved: 0,
        colorsSolved: 0,
        numbersSolved: 0,
        shapesSolved: 0,
        gkSolved: 0,
        matchingSolved: 0,
        memorySolved: 0,
        dailyChallengesCompleted: 0
      },
      lastDailyDate: null
    };
    save();
    renderRewardsModal();
    renderParentZoneStats();
  }

  function renderParentZoneStats() {
    const statsContainer = document.getElementById('parent-zone-stats-list');
    if (!statsContainer) return;

    const list = [
      { label: '⭐ Total Stars Earned', value: state.stars },
      { label: '🏆 Badges Unlocked', value: `${state.unlockedBadges.length} / ${window.GameData.badges.length}` },
      { label: '✏️ Letters & Words Traced', value: (state.badgeProgress['super_writer'] || 0) },
      { label: '🐾 Animals Identified', value: (state.badgeProgress['animal_expert'] || 0) },
      { label: '🔊 Animal Sounds Guessed', value: (state.badgeProgress['sound_master'] || 0) },
      { label: '🍎 Fruits Explored', value: (state.badgeProgress['fruit_friend'] || 0) },
      { label: '🥕 Vegetables Explored', value: (state.badgeProgress['veggie_hero'] || 0) },
      { label: '🎨 Colors Mastered', value: (state.badgeProgress['color_master'] || 0) },
      { label: '🔢 Number Activities', value: (state.badgeProgress['number_star'] || 0) },
      { label: '🔺 Shapes Solved', value: (state.badgeProgress['shape_wizard'] || 0) },
      { label: '🧠 General Knowledge', value: (state.badgeProgress['little_genius'] || 0) }
    ];

    statsContainer.innerHTML = list.map(item => `
      <div class="parent-stat-row">
        <span class="parent-stat-label">${item.label}</span>
        <strong class="parent-stat-val">${item.value}</strong>
      </div>
    `).join('');
  }

  return {
    load,
    save,
    addStars,
    recordProgress,
    renderRewardsModal,
    renderParentZoneStats,
    resetAllProgress,
    get stars() { return state.stars; },
    get unlockedBadges() { return state.unlockedBadges; },
    get stats() { return state.stats; }
  };
})();
