/**
 * MultiGame Arcade — Unified Analytics & Admin Command Center
 * 
 * Tracks player engagement, game launches, play counts, and session duration across all games.
 * 
 * SECURITY & VISIBILITY:
 * - Tracking runs silently in the background for all users.
 * - NO floating badges or analytics widgets are shown on any page by default.
 * - The Analytics menu option is STRICTLY VISIBLE ONLY when the active user is 'shahid_adm'.
 * - Any regular visitor or guest sees standard player options and NO analytics UI whatsoever.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'arcade_analytics_data_v1';
  const USER_KEY = 'arcade_active_user';
  const AUTHORIZED_ADMIN = 'shahid_adm';
  const GA_STORAGE_KEY = 'arcade_ga4_id';

  // Game Registry for consistent names and icons
  const GAMES = {
    'kids-learning': { id: 'kids-learning', name: 'Kids Learning Adventure', icon: '🌈', color: '#ff7675' },
    'snake': { id: 'snake', name: 'Neon Snake', icon: '🐍', color: '#00ffcc' },
    'candy-crush': { id: 'candy-crush', name: 'Candy Crush', icon: '🍬', color: '#e84393' },
    'sudoku': { id: 'sudoku', name: 'Zen Sudoku', icon: '🧩', color: '#74b9ff' },
    'pong': { id: 'pong', name: 'Neon Pong', icon: '🏓', color: '#fdcb6e' },
    'math-olympiad': { id: 'math-olympiad', name: 'Math Olympiad', icon: '🧮', color: '#a29bfe' }
  };

  const ArcadeAnalytics = {
    currentGame: null,
    sessionStartTime: null,
    activePlayStartTime: null,
    hasStartedPlay: false,
    gaMeasurementId: null,

    init() {
      // Clean up any legacy admin flags from earlier tests
      try {
        localStorage.removeItem('arcade_admin_active');
      } catch (e) {}

      // Handle URL authentication (?user=shahid_adm or ?admin=shahid_adm)
      this.checkUrlAuth();

      this.gaMeasurementId = localStorage.getItem(GA_STORAGE_KEY) || 'G-XXXXXXXXXX';
      this.initGA4();

      // Ensure persistent anonymous user id
      this.ensureUserId();

      // Detect game context
      this.detectGame();

      // Record visit / launch in background
      this.recordVisit();

      // Setup session lifecycle listeners
      this.setupLifecycleListeners();

      // Setup and bind User Menu on portal
      this.setupUserMenu();
    },

    // -------------------------------------------------------------
    // User Management & Admin Access Control
    // -------------------------------------------------------------
    getCurrentUser() {
      try {
        const user = localStorage.getItem(USER_KEY);
        return (user && user.trim()) ? user.trim() : 'Guest';
      } catch (e) {
        return 'Guest';
      }
    },

    isAdmin() {
      return this.getCurrentUser().toLowerCase() === AUTHORIZED_ADMIN.toLowerCase();
    },

    login(username) {
      if (!username || !username.trim()) return false;
      const cleanName = username.trim();
      try {
        localStorage.setItem(USER_KEY, cleanName);
      } catch (e) {}

      this.updateUserMenuUI();

      if (cleanName.toLowerCase() === AUTHORIZED_ADMIN.toLowerCase()) {
        this.showToast(`👑 Welcome, Admin ${cleanName}! Analytics unlocked in your menu.`);
        return true;
      } else {
        this.showToast(`👤 Logged in as ${cleanName}`);
        return false;
      }
    },

    logout() {
      try {
        localStorage.setItem(USER_KEY, 'Guest');
      } catch (e) {}

      this.updateUserMenuUI();

      const modal = document.getElementById('arcade-analytics-modal');
      if (modal) modal.remove();

      this.showToast('👤 Switched to Guest. Analytics menu hidden.');
    },

    checkUrlAuth() {
      try {
        const params = new URLSearchParams(window.location.search);
        const queryUser = params.get('user') || params.get('admin');
        if (queryUser) {
          if (queryUser.toLowerCase() === AUTHORIZED_ADMIN.toLowerCase()) {
            localStorage.setItem(USER_KEY, AUTHORIZED_ADMIN);
          } else if (queryUser.toLowerCase() === 'guest' || queryUser.toLowerCase() === 'logout') {
            localStorage.setItem(USER_KEY, 'Guest');
          } else {
            localStorage.setItem(USER_KEY, queryUser.trim());
          }
          // Clean URL parameter
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (e) {}
    },

    // -------------------------------------------------------------
    // User Menu Controller (Dropdown in header)
    // -------------------------------------------------------------
    setupUserMenu() {
      const initMenu = () => {
        const pill = document.getElementById('btn-user-pill');
        const dropdown = document.getElementById('arcade-user-dropdown');
        const btnAuth = document.getElementById('btn-user-auth');
        const btnAnalytics = document.getElementById('btn-open-analytics-menu');

        if (!pill || !dropdown) return;

        // Toggle dropdown
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = dropdown.classList.contains('hidden');
          dropdown.classList.toggle('hidden', !isHidden);
          pill.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (!dropdown.contains(e.target) && !pill.contains(e.target)) {
            dropdown.classList.add('hidden');
            pill.setAttribute('aria-expanded', 'false');
          }
        });

        // Login / Switch User button
        if (btnAuth) {
          btnAuth.addEventListener('click', () => {
            dropdown.classList.add('hidden');
            if (this.isAdmin()) {
              this.logout();
            } else {
              const input = window.prompt('👤 Enter username (e.g. shahid_adm):');
              if (input !== null && input.trim()) {
                this.login(input.trim());
              }
            }
          });
        }

        // Analytics menu item click (strictly available to shahid_adm)
        if (btnAnalytics) {
          btnAnalytics.addEventListener('click', () => {
            dropdown.classList.add('hidden');
            if (this.isAdmin()) {
              this.openDashboard();
            }
          });
        }

        this.updateUserMenuUI();
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMenu);
      } else {
        initMenu();
      }
    },

    updateUserMenuUI() {
      const currentUser = this.getCurrentUser();
      const isAdmin = this.isAdmin();

      // Header Pill Elements
      const pillName = document.getElementById('user-pill-name');
      const pillIcon = document.getElementById('user-pill-icon');
      const pill = document.getElementById('btn-user-pill');

      // Dropdown Elements
      const dropdownAvatar = document.getElementById('dropdown-avatar');
      const dropdownUsername = document.getElementById('dropdown-username');
      const dropdownBadge = document.getElementById('dropdown-badge');
      const analyticsContainer = document.getElementById('dropdown-analytics-container');
      const authLabel = document.getElementById('user-auth-label');
      const authIcon = document.getElementById('user-auth-icon');

      if (pillName) pillName.textContent = currentUser;
      if (pillIcon) pillIcon.textContent = isAdmin ? '👑' : '👤';
      if (pill) {
        pill.classList.toggle('pill-admin', isAdmin);
      }

      if (dropdownAvatar) dropdownAvatar.textContent = isAdmin ? '👑' : '👤';
      if (dropdownUsername) dropdownUsername.textContent = isAdmin ? `${currentUser} (Admin)` : currentUser;
      if (dropdownBadge) {
        dropdownBadge.textContent = isAdmin ? 'Arcade Administrator' : 'Standard Player';
        dropdownBadge.className = isAdmin ? 'badge-role badge-admin-role' : 'badge-role';
      }

      // CRITICAL: Analytics option is STRICTLY VISIBLE ONLY to shahid_adm!
      if (analyticsContainer) {
        if (isAdmin) {
          analyticsContainer.classList.remove('hidden');
        } else {
          analyticsContainer.classList.add('hidden');
        }
      }

      if (authLabel) {
        authLabel.textContent = isAdmin ? '🚪 Log Out (Switch to Guest)' : '🔑 Switch / Login User';
      }
      if (authIcon) {
        authIcon.textContent = isAdmin ? '🚪' : '🔑';
      }
    },

    // -------------------------------------------------------------
    // Data Storage & Metrics Engine (Runs invisibly in background)
    // -------------------------------------------------------------
    ensureUserId() {
      try {
        let uid = localStorage.getItem('arcade_analytics_uid');
        if (!uid) {
          uid = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
          localStorage.setItem('arcade_analytics_uid', uid);
        }
        return uid;
      } catch (e) {
        return 'anonymous';
      }
    },

    getAnalyticsData() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}

      return {
        installedAt: new Date().toISOString(),
        totalPortalVisits: 0,
        totalGamePlays: 0,
        totalPlayDurationSeconds: 0,
        uniqueUsers: 1,
        games: {
          'kids-learning': { launches: 0, plays: 0, totalDurationSeconds: 0, highScore: 0, lastPlayed: null },
          'snake': { launches: 0, plays: 0, totalDurationSeconds: 0, highScore: 0, lastPlayed: null },
          'candy-crush': { launches: 0, plays: 0, totalDurationSeconds: 0, highScore: 0, lastPlayed: null },
          'sudoku': { launches: 0, plays: 0, totalDurationSeconds: 0, highScore: 0, lastPlayed: null },
          'pong': { launches: 0, plays: 0, totalDurationSeconds: 0, highScore: 0, lastPlayed: null },
          'math-olympiad': { launches: 0, plays: 0, totalDurationSeconds: 0, highScore: 0, lastPlayed: null }
        },
        dailyStats: {},
        activityLog: []
      };
    },

    saveAnalyticsData(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    },

    detectGame() {
      const path = window.location.pathname.toLowerCase();
      for (const key of Object.keys(GAMES)) {
        if (path.includes('/' + key + '/') || path.endsWith('/' + key) || path.endsWith('/' + key + '.html')) {
          this.currentGame = key;
          return key;
        }
      }
      const bodyGame = document.body ? document.body.getAttribute('data-game') : null;
      if (bodyGame && GAMES[bodyGame]) {
        this.currentGame = bodyGame;
        return bodyGame;
      }
      this.currentGame = null;
      return null;
    },

    recordVisit() {
      const data = this.getAnalyticsData();
      const today = new Date().toISOString().split('T')[0];

      if (!data.dailyStats[today]) {
        data.dailyStats[today] = { plays: 0, launches: 0 };
      }

      if (!this.currentGame) {
        data.totalPortalVisits = (data.totalPortalVisits || 0) + 1;
        this.logActivity(data, 'portal_visit', 'MultiGame Portal Hub', null);
        this.saveAnalyticsData(data);
        this.dispatchGA('portal_visit', { page: 'home' });
      } else {
        this.sessionStartTime = Date.now();
        if (!data.games[this.currentGame]) {
          data.games[this.currentGame] = { launches: 0, plays: 0, totalDurationSeconds: 0, highScore: 0, lastPlayed: null };
        }
        data.games[this.currentGame].launches++;
        data.games[this.currentGame].lastPlayed = new Date().toISOString();
        data.dailyStats[today].launches++;

        const gameMeta = GAMES[this.currentGame];
        this.logActivity(data, 'game_launch', gameMeta.name, null);
        this.saveAnalyticsData(data);

        this.dispatchGA('game_launch', {
          game_id: this.currentGame,
          game_name: gameMeta.name
        });
      }
    },

    trackGameStart(gameId, mode = 'classic') {
      const gameKey = gameId || this.currentGame;
      if (!gameKey) return;

      this.hasStartedPlay = true;
      this.activePlayStartTime = Date.now();

      const data = this.getAnalyticsData();
      const today = new Date().toISOString().split('T')[0];
      if (!data.dailyStats[today]) data.dailyStats[today] = { plays: 0, launches: 0 };

      if (!data.games[gameKey]) {
        data.games[gameKey] = { launches: 0, plays: 0, totalDurationSeconds: 0, highScore: 0, lastPlayed: null };
      }

      data.games[gameKey].plays++;
      data.totalGamePlays = (data.totalGamePlays || 0) + 1;
      data.dailyStats[today].plays++;

      const gameName = GAMES[gameKey]?.name || gameKey;
      this.logActivity(data, 'game_start', gameName, `Mode: ${mode}`);
      this.saveAnalyticsData(data);

      this.dispatchGA('game_start', {
        game_id: gameKey,
        game_name: gameName,
        game_mode: mode
      });
    },

    trackGameOver(gameId, score = 0, level = 1) {
      const gameKey = gameId || this.currentGame;
      if (!gameKey) return;

      const duration = this.activePlayStartTime ? Math.round((Date.now() - this.activePlayStartTime) / 1000) : 0;
      this.activePlayStartTime = null;

      const data = this.getAnalyticsData();
      if (data.games[gameKey]) {
        data.games[gameKey].totalDurationSeconds += duration;
        data.totalPlayDurationSeconds = (data.totalPlayDurationSeconds || 0) + duration;
        if (score > (data.games[gameKey].highScore || 0)) {
          data.games[gameKey].highScore = score;
        }
      }

      const gameName = GAMES[gameKey]?.name || gameKey;
      this.logActivity(data, 'game_over', gameName, `Score: ${score} | Level: ${level} | Time: ${this.formatDuration(duration)}`);
      this.saveAnalyticsData(data);

      this.dispatchGA('game_over', {
        game_id: gameKey,
        game_name: gameName,
        score: score,
        level: level,
        duration_seconds: duration
      });
    },

    recordScore(gameId, score) {
      const gameKey = gameId || this.currentGame;
      if (!gameKey || typeof score !== 'number') return;
      const data = this.getAnalyticsData();
      if (data.games[gameKey] && score > (data.games[gameKey].highScore || 0)) {
        data.games[gameKey].highScore = score;
        this.saveAnalyticsData(data);
      }
    },

    endSession() {
      if (this.sessionStartTime && this.currentGame) {
        const totalSessionSeconds = Math.round((Date.now() - this.sessionStartTime) / 1000);
        if (totalSessionSeconds >= 3) {
          const data = this.getAnalyticsData();
          if (data.games[this.currentGame]) {
            data.games[this.currentGame].totalDurationSeconds += totalSessionSeconds;
            data.totalPlayDurationSeconds += totalSessionSeconds;
            this.saveAnalyticsData(data);
          }
          this.dispatchGA('game_session_time', {
            game_id: this.currentGame,
            duration_seconds: totalSessionSeconds
          });
        }
        this.sessionStartTime = null;
      }
    },

    setupLifecycleListeners() {
      window.addEventListener('beforeunload', () => this.endSession());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.endSession();
        } else if (document.visibilityState === 'visible' && this.currentGame) {
          this.sessionStartTime = Date.now();
        }
      });

      document.addEventListener('DOMContentLoaded', () => {
        if (!this.currentGame) {
          document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href], .game-card, .btn-play-game');
            if (link) {
              const href = link.getAttribute('href') || link.querySelector('a')?.getAttribute('href');
              if (href) {
                for (const key of Object.keys(GAMES)) {
                  if (href.includes(key)) {
                    this.dispatchGA('portal_card_click', { game_id: key, game_name: GAMES[key].name });
                    break;
                  }
                }
              }
            }
          });
        } else {
          const startBtns = document.querySelectorAll('#btn-start, #btn-play, #start-btn, .btn-start, .play-btn, #restart-btn');
          startBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              if (!this.hasStartedPlay) this.trackGameStart(this.currentGame);
            });
          });

          const triggerPlay = () => {
            if (!this.hasStartedPlay) this.trackGameStart(this.currentGame);
          };
          window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
              triggerPlay();
            }
          }, { passive: true });
          document.addEventListener('pointerdown', (e) => {
            if (e.target.closest('canvas, .game-board, .board, .card, .cell, #game-container, #game-board, .candy, .choice-btn, .option-btn, .tile')) {
              triggerPlay();
            }
          }, { passive: true });
        }
      });
    },

    logActivity(data, type, title, detail) {
      if (!data.activityLog) data.activityLog = [];
      const item = {
        type: type,
        title: title,
        detail: detail || '',
        timestamp: new Date().toISOString()
      };
      data.activityLog.unshift(item);
      if (data.activityLog.length > 50) {
        data.activityLog.pop();
      }
    },

    // -------------------------------------------------------------
    // Google Analytics 4 (GA4) Dispatcher
    // -------------------------------------------------------------
    initGA4() {
      if (!this.gaMeasurementId || this.gaMeasurementId.startsWith('G-XXXX')) return;
      try {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaMeasurementId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', this.gaMeasurementId, { send_page_view: true });
      } catch (e) {}
    },

    dispatchGA(eventName, params = {}) {
      if (typeof window.gtag === 'function' && this.gaMeasurementId && !this.gaMeasurementId.startsWith('G-XXXX')) {
        window.gtag('event', eventName, params);
      }
    },

    // -------------------------------------------------------------
    // Visual Admin Dashboard Modal (Strictly opened by shahid_adm)
    // -------------------------------------------------------------
    openDashboard() {
      if (!this.isAdmin()) {
        this.showToast('🔒 Access denied. Only shahid_adm can view analytics.');
        return;
      }

      let modal = document.getElementById('arcade-analytics-modal');
      if (modal) modal.remove();

      this.injectStyles();

      const data = this.getAnalyticsData();

      let mostPlayedGame = null;
      let totalPlaysAllGames = 0;

      const rankedGames = Object.keys(GAMES).map(key => {
        const stats = data.games[key] || { launches: 0, plays: 0, totalDurationSeconds: 0, highScore: 0 };
        const scoreMetric = (stats.plays * 2) + stats.launches;
        totalPlaysAllGames += (stats.plays || 0);
        return {
          key: key,
          name: GAMES[key].name,
          icon: GAMES[key].icon,
          color: GAMES[key].color,
          launches: stats.launches || 0,
          plays: stats.plays || 0,
          totalDuration: stats.totalDurationSeconds || 0,
          highScore: stats.highScore || 0,
          scoreMetric: scoreMetric,
          lastPlayed: stats.lastPlayed
        };
      }).sort((a, b) => b.scoreMetric - a.scoreMetric);

      if (rankedGames.length > 0 && rankedGames[0].scoreMetric > 0) {
        mostPlayedGame = rankedGames[0];
      }

      const totalTimeFormatted = this.formatDuration(data.totalPlayDurationSeconds || 0);

      modal = document.createElement('div');
      modal.id = 'arcade-analytics-modal';
      modal.className = 'arcade-modal-backdrop';
      modal.innerHTML = `
        <div class="arcade-modal-card">
          <!-- Header -->
          <div class="arcade-modal-header">
            <div class="arcade-modal-title-group">
              <span class="arcade-modal-badge">ADMINISTRATOR VIEW</span>
              <h2>📊 MultiGame Analytics & Insights</h2>
              <p class="arcade-admin-sub">Active User: <strong>${this.getCurrentUser()}</strong> • Game Popularity & Usage Metrics</p>
            </div>
            <div class="arcade-modal-header-actions">
              <button class="arcade-btn-ghost" id="arcade-btn-logout-modal">🚪 Log Out</button>
              <button class="arcade-modal-close" id="arcade-modal-close-btn">&times;</button>
            </div>
          </div>

          <!-- Quick Stats Grid -->
          <div class="arcade-stats-grid">
            <div class="arcade-stat-box highlight">
              <div class="arcade-stat-icon">👑</div>
              <div class="arcade-stat-info">
                <div class="arcade-stat-label">#1 Most Played Game</div>
                <div class="arcade-stat-value text-accent">${mostPlayedGame ? mostPlayedGame.icon + ' ' + mostPlayedGame.name : 'None yet'}</div>
                <div class="arcade-stat-meta">${mostPlayedGame ? `${mostPlayedGame.plays} plays (${mostPlayedGame.launches} launches)` : 'Play games to rank'}</div>
              </div>
            </div>

            <div class="arcade-stat-box">
              <div class="arcade-stat-icon">🎮</div>
              <div class="arcade-stat-info">
                <div class="arcade-stat-label">Total Game Sessions</div>
                <div class="arcade-stat-value">${data.totalGamePlays || 0}</div>
                <div class="arcade-stat-meta">${data.totalPortalVisits || 0} Portal Visits</div>
              </div>
            </div>

            <div class="arcade-stat-box">
              <div class="arcade-stat-icon">⏱️</div>
              <div class="arcade-stat-info">
                <div class="arcade-stat-label">Total Time Played</div>
                <div class="arcade-stat-value">${totalTimeFormatted}</div>
                <div class="arcade-stat-meta">Cumulative across all users</div>
              </div>
            </div>

            <div class="arcade-stat-box">
              <div class="arcade-stat-icon">📈</div>
              <div class="arcade-stat-info">
                <div class="arcade-stat-label">GA4 Integration</div>
                <div class="arcade-stat-value text-sm">${this.gaMeasurementId && !this.gaMeasurementId.startsWith('G-XXXX') ? 'Active 🟢' : 'Demo Mode 🟡'}</div>
                <div class="arcade-stat-meta">${this.gaMeasurementId || 'Not Configured'}</div>
              </div>
            </div>
          </div>

          <!-- Leaderboard: Which Game is Used Most? -->
          <div class="arcade-section">
            <div class="arcade-section-header">
              <h3>🏆 Game Popularity Leaderboard (Ranked by Engagement)</h3>
              <span class="arcade-section-subtitle">Real-time play counts, launches, and active play duration</span>
            </div>

            <div class="arcade-leaderboard-table-wrap">
              <table class="arcade-leaderboard-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">Rank</th>
                    <th>Game Name</th>
                    <th>Popularity Share</th>
                    <th style="text-align: right;">Plays</th>
                    <th style="text-align: right;">Launches</th>
                    <th style="text-align: right;">Total Playtime</th>
                    <th style="text-align: right;">High Score</th>
                  </tr>
                </thead>
                <tbody>
                  ${rankedGames.map((g, idx) => {
                    const rankMedal = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}`;
                    const pct = totalPlaysAllGames > 0 ? Math.round((g.plays / totalPlaysAllGames) * 100) : (g.launches > 0 ? 10 : 0);
                    return `
                      <tr class="${idx === 0 && g.scoreMetric > 0 ? 'top-ranked-row' : ''}">
                        <td class="rank-cell"><span class="rank-pill rank-${idx + 1}">${rankMedal}</span></td>
                        <td>
                          <div class="game-cell">
                            <span class="game-cell-icon">${g.icon}</span>
                            <div>
                              <strong class="game-cell-name">${g.name}</strong>
                              <div class="game-cell-id">${g.key}</div>
                            </div>
                          </div>
                        </td>
                        <td style="min-width: 140px;">
                          <div class="bar-container">
                            <div class="bar-fill" style="width: ${Math.max(pct, 4)}%; background: ${g.color};"></div>
                            <span class="bar-label">${pct}%</span>
                          </div>
                        </td>
                        <td style="text-align: right; font-weight: 700;">${g.plays}</td>
                        <td style="text-align: right; color: #a0aec0;">${g.launches}</td>
                        <td style="text-align: right; font-family: monospace;">${this.formatDuration(g.totalDuration)}</td>
                        <td style="text-align: right; color: #ffd700; font-weight: bold;">${g.highScore ? g.highScore.toLocaleString() : '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Activity Log & Tools Row -->
          <div class="arcade-bottom-row">
            <div class="arcade-activity-panel">
              <div class="arcade-section-header">
                <h3>📜 Live Activity Stream</h3>
                <span class="arcade-section-subtitle">Last ${data.activityLog ? data.activityLog.length : 0} events</span>
              </div>
              <div class="arcade-activity-list">
                ${(!data.activityLog || data.activityLog.length === 0) ? `
                  <div class="arcade-empty-log">No activity recorded yet. Start playing games to see live events!</div>
                ` : data.activityLog.slice(0, 15).map(item => `
                  <div class="arcade-log-item">
                    <span class="log-badge log-${item.type}">${this.getLogTypeIcon(item.type)}</span>
                    <div class="log-content">
                      <div class="log-title"><strong>${item.title}</strong> ${item.detail ? `<span class="log-detail">(${item.detail})</span>` : ''}</div>
                      <div class="log-time">${this.formatTimestamp(item.timestamp)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="arcade-tools-panel">
              <div class="arcade-section-header">
                <h3>⚙️ Admin Management Tools</h3>
              </div>

              <div class="arcade-tool-card">
                <label><strong>Google Analytics 4 Measurement ID</strong></label>
                <div class="arcade-input-group">
                  <input type="text" id="arcade-ga-input" placeholder="e.g. G-XXXXXXXXXX" value="${this.gaMeasurementId && !this.gaMeasurementId.startsWith('G-XXXX') ? this.gaMeasurementId : ''}" />
                  <button class="arcade-btn-primary" id="arcade-btn-save-ga">Save ID</button>
                </div>
                <p class="arcade-tool-desc">When set, events also forward live to your official Google Analytics 4 console.</p>
              </div>

              <div class="arcade-tool-buttons">
                <button class="arcade-btn-secondary" id="arcade-btn-export">📥 Export Analytics (JSON)</button>
                <button class="arcade-btn-secondary" id="arcade-btn-seed">🎲 Generate Sample Test Data</button>
                <button class="arcade-btn-danger" id="arcade-btn-reset">⚠️ Reset All Stats</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#arcade-modal-close-btn').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });

      modal.querySelector('#arcade-btn-logout-modal').addEventListener('click', () => {
        this.logout();
      });

      modal.querySelector('#arcade-btn-save-ga').addEventListener('click', () => {
        const inputVal = modal.querySelector('#arcade-ga-input').value.trim();
        if (inputVal) {
          localStorage.setItem(GA_STORAGE_KEY, inputVal);
          this.gaMeasurementId = inputVal;
          this.showToast('✅ GA4 Measurement ID saved!');
          this.openDashboard();
        }
      });

      modal.querySelector('#arcade-btn-export').addEventListener('click', () => {
        this.exportData();
      });

      modal.querySelector('#arcade-btn-seed').addEventListener('click', () => {
        if (confirm('Add realistic demo play counts to preview charts and rankings?')) {
          this.seedSampleData();
          this.openDashboard();
          this.showToast('✨ Demo play data injected!');
        }
      });

      modal.querySelector('#arcade-btn-reset').addEventListener('click', () => {
        if (confirm('Are you sure you want to RESET all analytics data? This cannot be undone.')) {
          localStorage.removeItem(STORAGE_KEY);
          this.openDashboard();
          this.showToast('🧹 Analytics data reset successfully.');
        }
      });
    },

    exportData() {
      const data = this.getAnalyticsData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `multigame-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    seedSampleData() {
      const data = this.getAnalyticsData();
      const mockPlays = {
        'kids-learning': { launches: 145, plays: 112, duration: 18200, highScore: 15 },
        'snake': { launches: 120, plays: 98, duration: 14300, highScore: 340 },
        'candy-crush': { launches: 92, plays: 76, duration: 12400, highScore: 4820 },
        'sudoku': { launches: 68, plays: 44, duration: 9200, highScore: 1250 },
        'math-olympiad': { launches: 54, plays: 41, duration: 7600, highScore: 90 },
        'pong': { launches: 42, plays: 35, duration: 4900, highScore: 11 }
      };

      data.totalPortalVisits = (data.totalPortalVisits || 0) + 210;
      data.totalGamePlays = (data.totalGamePlays || 0) + 406;
      data.totalPlayDurationSeconds = (data.totalPlayDurationSeconds || 0) + 66600;

      for (const [k, v] of Object.entries(mockPlays)) {
        if (!data.games[k]) data.games[k] = {};
        data.games[k].launches = (data.games[k].launches || 0) + v.launches;
        data.games[k].plays = (data.games[k].plays || 0) + v.plays;
        data.games[k].totalDurationSeconds = (data.games[k].totalDurationSeconds || 0) + v.duration;
        data.games[k].highScore = Math.max(data.games[k].highScore || 0, v.highScore);
        data.games[k].lastPlayed = new Date().toISOString();
      }

      this.logActivity(data, 'game_start', 'Kids Learning Adventure', 'Mode: Phonics & Math');
      this.logActivity(data, 'game_over', 'Neon Snake', 'Score: 340 | Level: High');
      this.logActivity(data, 'game_start', 'Candy Crush', 'Mode: Sugar Rush');
      this.saveAnalyticsData(data);
    },

    formatDuration(seconds) {
      if (!seconds || seconds <= 0) return '0s';
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    },

    formatTimestamp(isoStr) {
      if (!isoStr) return '';
      try {
        const d = new Date(isoStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
      } catch (e) {
        return isoStr;
      }
    },

    getLogTypeIcon(type) {
      switch (type) {
        case 'game_start': return '▶️';
        case 'game_over': return '🏁';
        case 'game_launch': return '🚀';
        case 'portal_visit': return '🏠';
        default: return '📌';
      }
    },

    showToast(msg) {
      const toast = document.createElement('div');
      toast.className = 'arcade-analytics-toast';
      toast.innerText = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 20);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    injectStyles() {
      if (document.getElementById('arcade-analytics-styles')) return;
      const style = document.createElement('style');
      style.id = 'arcade-analytics-styles';
      style.textContent = `
        /* Modal Backdrop */
        .arcade-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(8, 11, 20, 0.88);
          backdrop-filter: blur(10px);
          z-index: 1000000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          animation: arcadeFadeIn 0.2s ease-out;
        }
        @keyframes arcadeFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Modal Card */
        .arcade-modal-card {
          background: #0f1320;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 240, 255, 0.12);
          color: #f1f5f9;
          padding: 28px;
          box-sizing: border-box;
        }

        .arcade-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 18px;
          margin-bottom: 24px;
        }
        .arcade-modal-title-group h2 {
          margin: 6px 0 4px 0;
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .arcade-modal-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(255, 215, 0, 0.15);
          color: #ffd700;
          border: 1px solid rgba(255, 215, 0, 0.35);
        }
        .arcade-admin-sub {
          margin: 0;
          font-size: 13px;
          color: #94a3b8;
        }
        .arcade-modal-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .arcade-modal-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 28px;
          cursor: pointer;
          line-height: 1;
          padding: 0 6px;
        }
        .arcade-modal-close:hover { color: #fff; }

        .arcade-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }
        .arcade-stat-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .arcade-stat-box.highlight {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 107, 129, 0.05) 100%);
          border-color: rgba(255, 215, 0, 0.3);
        }
        .arcade-stat-icon { font-size: 32px; line-height: 1; }
        .arcade-stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .arcade-stat-value {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
        }
        .arcade-stat-value.text-accent {
          color: #ffd700;
          font-size: 17px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }
        .arcade-stat-value.text-sm { font-size: 16px; }
        .arcade-stat-meta {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }

        .arcade-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .arcade-section-header { margin-bottom: 16px; }
        .arcade-section-header h3 {
          margin: 0 0 4px 0;
          font-size: 17px;
          font-weight: 700;
          color: #f8fafc;
        }
        .arcade-section-subtitle { font-size: 12px; color: #64748b; }

        .arcade-leaderboard-table-wrap { overflow-x: auto; }
        .arcade-leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .arcade-leaderboard-table th {
          text-align: left;
          padding: 10px 12px;
          color: #94a3b8;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .arcade-leaderboard-table td {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .top-ranked-row { background: rgba(0, 240, 255, 0.04); }
        .rank-pill {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
        }
        .rank-1 { background: rgba(255, 215, 0, 0.2); color: #ffd700; border: 1px solid rgba(255, 215, 0, 0.4); }
        .rank-2 { background: rgba(192, 192, 192, 0.2); color: #e2e8f0; }
        .rank-3 { background: rgba(205, 127, 50, 0.2); color: #f97316; }

        .game-cell { display: flex; align-items: center; gap: 10px; }
        .game-cell-icon { font-size: 22px; }
        .game-cell-name { color: #fff; font-size: 14px; }
        .game-cell-id { font-size: 11px; color: #64748b; font-family: monospace; }

        .bar-container {
          position: relative;
          width: 100%;
          height: 18px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .bar-fill { height: 100%; border-radius: 10px; transition: width 0.4s ease; }
        .bar-label {
          position: absolute;
          right: 8px;
          font-size: 10px;
          font-weight: 700;
          color: #f1f5f9;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }

        .arcade-bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .arcade-bottom-row { grid-template-columns: 1fr; }
        }

        .arcade-activity-panel, .arcade-tools-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 18px;
        }
        .arcade-activity-list {
          max-height: 260px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .arcade-empty-log {
          color: #64748b;
          font-size: 12px;
          padding: 16px 0;
          text-align: center;
        }
        .arcade-log-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          font-size: 12px;
        }
        .log-badge { font-size: 14px; line-height: 1; }
        .log-content { flex: 1; }
        .log-title { color: #f1f5f9; }
        .log-detail { color: #94a3b8; font-size: 11px; }
        .log-time { color: #64748b; font-size: 10px; margin-top: 2px; }

        .arcade-tool-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 16px;
        }
        .arcade-tool-card label {
          display: block;
          font-size: 12px;
          color: #e2e8f0;
          margin-bottom: 8px;
        }
        .arcade-input-group { display: flex; gap: 8px; }
        .arcade-input-group input {
          flex: 1;
          background: #090c14;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
        }
        .arcade-input-group input:focus { outline: none; border-color: #00f0ff; }
        .arcade-tool-desc { margin: 8px 0 0 0; font-size: 11px; color: #64748b; }
        .arcade-tool-buttons { display: flex; flex-direction: column; gap: 10px; }

        .arcade-btn-primary {
          background: #00f0ff;
          color: #050811;
          border: none;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
        }
        .arcade-btn-primary:hover { opacity: 0.9; }

        .arcade-btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
        }
        .arcade-btn-secondary:hover { background: rgba(255, 255, 255, 0.14); }

        .arcade-btn-danger {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
        }
        .arcade-btn-danger:hover { background: rgba(239, 68, 68, 0.22); }

        .arcade-btn-ghost {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
        }
        .arcade-btn-ghost:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }

        .arcade-analytics-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #1e293b;
          color: #fff;
          border-left: 4px solid #00f0ff;
          padding: 12px 18px;
          border-radius: 8px;
          font-size: 13px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          z-index: 2000000;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          pointer-events: none;
        }
        .arcade-analytics-toast.show { opacity: 1; transform: translateY(0); }
      `;
      document.head.appendChild(style);
    }
  };

  window.ArcadeAnalytics = ArcadeAnalytics;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ArcadeAnalytics.init());
  } else {
    ArcadeAnalytics.init();
  }

})(window);
