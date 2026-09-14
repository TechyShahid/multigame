/**
 * ==========================================================================
 * MultiGame Arcade — Unified Ads & Monetization SDK
 * ==========================================================================
 * Supports:
 * - Mock/Simulation Mode (instant local preview with realistic countdown)
 * - CrazyGames SDK v2/v3
 * - AdinPlay (aipPlayer)
 * - GameMonetize SDK
 * - Google AdSense for Games (H5)
 * ==========================================================================
 */

(function () {
  'use strict';

  class ArcadeAdManager {
    constructor() {
      this.provider = 'mock'; // 'mock' | 'crazygames' | 'adinplay' | 'gamemonetize' | 'adsense_h5'
      this.interstitialCooldownMs = 60000; // 60s cooldown between auto interstitials
      this.lastInterstitialTime = 0;
      this.isAdActive = false;
      this.onAdStartCallbacks = new Set();
      this.onAdEndCallbacks = new Set();
      
      // DOM elements
      this.overlayEl = null;
      this.promptModalEl = null;
      this.toastEl = null;
      this.initialized = false;
    }

    /**
     * Initialize the Ad Manager
     */
    init(config = {}) {
      if (this.initialized) return;
      this.initialized = true;

      if (config.provider) this.provider = config.provider;
      if (config.interstitialCooldownMs) this.interstitialCooldownMs = config.interstitialCooldownMs;

      // Allow switching provider via URL query param for quick testing (?ads=mock or ?ads=crazygames)
      const urlParams = new URLSearchParams(window.location.search);
      const queryProvider = urlParams.get('ads');
      if (queryProvider) this.provider = queryProvider;

      this.injectDOM();
      this.initProviderSDK();
      
      console.log(`🕹️ ArcadeAds initialized [Provider: ${this.provider}]`);
    }

    /**
     * Check if player has VIP Ad-Free status
     */
    isAdFree() {
      return localStorage.getItem('multigame_vip_adfree') === 'true';
    }

    /**
     * Set VIP Ad-Free status
     */
    setAdFree(enabled) {
      localStorage.setItem('multigame_vip_adfree', enabled ? 'true' : 'false');
      if (enabled) {
        this.showToast('⭐ VIP Ad-Free Pass Activated!');
      }
    }

    /**
     * Register lifecycle listeners (e.g. to mute Web Audio)
     */
    onAdStart(cb) { this.onAdStartCallbacks.add(cb); }
    onAdEnd(cb) { this.onAdEndCallbacks.add(cb); }

    _notifyStart() {
      this.isAdActive = true;
      this.onAdStartCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
    }

    _notifyEnd() {
      this.isAdActive = false;
      this.onAdEndCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
    }

    /**
     * Shows an Interstitial Ad (e.g. between game rounds / levels)
     */
    showInterstitial({ onComplete = () => {}, onSkipped = () => {}, force = false } = {}) {
      if (this.isAdFree()) {
        onComplete();
        return;
      }

      const now = Date.now();
      if (!force && (now - this.lastInterstitialTime < this.interstitialCooldownMs)) {
        console.log('⏳ Interstitial skipped (cooldown active)');
        onComplete();
        return;
      }

      this.lastInterstitialTime = now;
      this._notifyStart();

      if (this.provider === 'crazygames' && window.CrazyGames && window.CrazyGames.SDK) {
        window.CrazyGames.SDK.ad.requestAd('midgame', {
          adStarted: () => {},
          adFinished: () => { this._notifyEnd(); onComplete(); },
          adError: () => { this._notifyEnd(); onSkipped(); }
        });
        return;
      }

      if (this.provider === 'adinplay' && window.aiptag) {
        window.aiptag.cmd.displayTag('YOUR_TAG_ID');
        this._notifyEnd();
        onComplete();
        return;
      }

      if (this.provider === 'adsense_h5' && typeof window.adBreak === 'function') {
        window.adBreak({
          type: 'next',
          name: 'next_round',
          beforeAd: () => {},
          afterAd: () => { this._notifyEnd(); onComplete(); }
        });
        return;
      }

      // Default: High-fidelity simulated ad modal
      this._showMockAdModal({
        isRewarded: false,
        durationSeconds: 3,
        title: 'MultiGame Arcade Partner',
        subtitle: 'Sponsoring free games for millions of players',
        icon: '🎮',
        onFinished: () => {
          this._notifyEnd();
          onComplete();
        }
      });
    }

    /**
     * Shows a Rewarded Video Ad (e.g. +3 Hints, +5 Moves, Revive)
     */
    showRewarded({ rewardType = 'reward', title = 'Sponsored Reward', onRewarded = () => {}, onDismissed = () => {} } = {}) {
      // If VIP, give reward immediately
      if (this.isAdFree()) {
        this.showToast(`⭐ VIP Perk: Free ${rewardType}!`);
        onRewarded();
        return;
      }

      this._notifyStart();

      if (this.provider === 'crazygames' && window.CrazyGames && window.CrazyGames.SDK) {
        window.CrazyGames.SDK.ad.requestAd('rewarded', {
          adStarted: () => {},
          adFinished: () => {
            this._notifyEnd();
            this.showToast(`🎉 Reward Granted!`);
            onRewarded();
          },
          adError: () => {
            this._notifyEnd();
            onDismissed();
          }
        });
        return;
      }

      // Default: Simulated Rewarded Video with strict 5-second countdown
      this._showMockAdModal({
        isRewarded: true,
        durationSeconds: 5,
        title: `Sponsored Offer: ${title}`,
        subtitle: `Watch 5 seconds to unlock your free reward`,
        icon: '🎁',
        onFinished: (rewardEarned) => {
          this._notifyEnd();
          if (rewardEarned) {
            this.showToast(`🎉 Reward Granted!`);
            onRewarded();
          } else {
            onDismissed();
          }
        }
      });
    }

    /**
     * Shows an interactive pre-reward prompt (e.g., "Out of Moves!", "Need a Hint?")
     */
    showRewardPrompt({
      icon = '🎁',
      title = 'Extra Reward Available',
      desc = 'Watch a short video ad to claim this perk.',
      watchBtnText = 'Watch Video Ad',
      cancelBtnText = 'No Thanks',
      onWatch = () => {},
      onCancel = () => {}
    } = {}) {
      if (!this.promptModalEl) this.injectDOM();

      const card = this.promptModalEl.querySelector('.arcade-reward-card');
      card.querySelector('.arcade-reward-icon').textContent = icon;
      card.querySelector('.arcade-reward-title').textContent = title;
      card.querySelector('.arcade-reward-desc').textContent = desc;
      
      const watchBtn = card.querySelector('.arcade-reward-btn-watch');
      const cancelBtn = card.querySelector('.arcade-reward-btn-cancel');

      watchBtn.innerHTML = `<span>▶</span> ${watchBtnText}`;
      cancelBtn.textContent = cancelBtnText;

      const cleanup = () => {
        this.promptModalEl.classList.add('hidden');
        watchBtn.onclick = null;
        cancelBtn.onclick = null;
      };

      watchBtn.onclick = () => {
        cleanup();
        onWatch();
      };

      cancelBtn.onclick = () => {
        cleanup();
        onCancel();
      };

      this.promptModalEl.classList.remove('hidden');
    }

    /**
     * Helper to show a floating reward toast notification
     */
    showToast(message, duration = 3000) {
      if (!this.toastEl) this.injectDOM();
      this.toastEl.innerHTML = `<span>✨</span> ${message}`;
      this.toastEl.classList.add('show');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        this.toastEl.classList.remove('show');
      }, duration);
    }

    /**
     * Simulated Modal Ad Player
     */
    _showMockAdModal({ isRewarded, durationSeconds, title, subtitle, icon, onFinished }) {
      if (!this.overlayEl) this.injectDOM();

      const badge = this.overlayEl.querySelector('.arcade-ad-badge');
      const timerStrong = this.overlayEl.querySelector('.arcade-ad-timer strong');
      const titleEl = this.overlayEl.querySelector('.arcade-ad-title');
      const subtitleEl = this.overlayEl.querySelector('.arcade-ad-subtitle');
      const iconEl = this.overlayEl.querySelector('.arcade-ad-icon');
      const progressBar = this.overlayEl.querySelector('.arcade-ad-progress-bar');
      const skipBtn = this.overlayEl.querySelector('.arcade-ad-btn-skip');
      const footerRight = this.overlayEl.querySelector('.arcade-ad-footer-right');

      badge.textContent = isRewarded ? '🎁 Rewarded Sponsor Ad' : '⚡ Interstitial Ad';
      if (isRewarded) badge.classList.add('rewarded'); else badge.classList.remove('rewarded');

      titleEl.textContent = title;
      subtitleEl.textContent = subtitle;
      iconEl.textContent = icon;

      let remaining = durationSeconds;
      timerStrong.textContent = `${remaining}s`;
      progressBar.style.width = '0%';
      skipBtn.disabled = isRewarded;
      skipBtn.textContent = isRewarded ? `Wait ${remaining}s` : 'Skip Ad';

      // Reset footer buttons
      footerRight.innerHTML = '';
      footerRight.appendChild(skipBtn);

      this.overlayEl.classList.remove('hidden');

      const startTime = Date.now();
      const totalMs = durationSeconds * 1000;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / totalMs) * 100);
        progressBar.style.width = `${progress}%`;

        remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
        timerStrong.textContent = `${remaining}s`;

        if (isRewarded && remaining > 0) {
          skipBtn.textContent = `Wait ${remaining}s`;
        }

        if (elapsed >= totalMs) {
          clearInterval(interval);
          progressBar.style.width = '100%';
          timerStrong.textContent = '0s';

          if (isRewarded) {
            const claimBtn = document.createElement('button');
            claimBtn.className = 'arcade-ad-btn-claim';
            claimBtn.innerHTML = '🎉 Claim Reward';
            claimBtn.onclick = () => {
              this.overlayEl.classList.add('hidden');
              onFinished(true);
            };
            footerRight.innerHTML = '';
            footerRight.appendChild(claimBtn);
          } else {
            skipBtn.disabled = false;
            skipBtn.textContent = 'Continue';
            skipBtn.onclick = () => {
              this.overlayEl.classList.add('hidden');
              onFinished(true);
            };
          }
        }
      }, 100);

      skipBtn.onclick = () => {
        clearInterval(interval);
        this.overlayEl.classList.add('hidden');
        onFinished(!isRewarded); // If rewarded and clicked early, no reward
      };
    }

    /**
     * Injects the required UI containers into the DOM
     */
    injectDOM() {
      if (document.getElementById('arcade-ad-overlay')) return;

      // 1. Ad Overlay
      const overlay = document.createElement('div');
      overlay.id = 'arcade-ad-overlay';
      overlay.className = 'arcade-ad-overlay hidden';
      overlay.innerHTML = `
        <div class="arcade-ad-container">
          <div class="arcade-ad-header">
            <span class="arcade-ad-badge">⚡ Advertisement</span>
            <span class="arcade-ad-timer">Reward in <strong>5s</strong></span>
          </div>
          <div class="arcade-ad-video-screen">
            <div class="arcade-ad-pulse-ring"></div>
            <div class="arcade-ad-icon">🎁</div>
            <h3 class="arcade-ad-title">MultiGame Sponsor Offer</h3>
            <p class="arcade-ad-subtitle">Enjoy high-speed, ad-supported free arcade games.</p>
            <div class="arcade-ad-progress-bar"></div>
          </div>
          <div class="arcade-ad-footer">
            <span class="arcade-ad-sponsor-info">MultiGame Verified Sponsor</span>
            <div class="arcade-ad-footer-right">
              <button class="arcade-ad-btn-skip">Skip</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      this.overlayEl = overlay;

      // 2. Pre-Reward Prompt Modal
      const prompt = document.createElement('div');
      prompt.id = 'arcade-reward-prompt-modal';
      prompt.className = 'arcade-reward-prompt-modal hidden';
      prompt.innerHTML = `
        <div class="arcade-reward-card">
          <div class="arcade-reward-icon">🍬</div>
          <h3 class="arcade-reward-title">Extra Moves Available</h3>
          <p class="arcade-reward-desc">Watch a short 5-second video to gain +5 moves and keep playing!</p>
          <div class="arcade-reward-actions">
            <button class="arcade-reward-btn-watch"><span>▶</span> Watch Video Ad</button>
            <button class="arcade-reward-btn-cancel">Give Up</button>
          </div>
        </div>
      `;
      document.body.appendChild(prompt);
      this.promptModalEl = prompt;

      // 3. Floating Reward Toast
      const toast = document.createElement('div');
      toast.id = 'arcade-toast-reward';
      toast.className = 'arcade-toast-reward';
      document.body.appendChild(toast);
      this.toastEl = toast;
    }

    /**
     * Initializes external provider SDKs when enabled
     */
    initProviderSDK() {
      if (this.provider === 'crazygames') {
        const script = document.createElement('script');
        script.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
        script.async = true;
        script.onload = () => {
          if (window.CrazyGames && window.CrazyGames.SDK) {
            window.CrazyGames.SDK.init();
            console.log('✅ CrazyGames SDK loaded');
          }
        };
        document.head.appendChild(script);
      }
    }
  }

  // Export as global singleton
  window.ArcadeAds = new ArcadeAdManager();
  
  // Auto-init on DOMContentLoaded if not called manually
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.ArcadeAds.init());
  } else {
    window.ArcadeAds.init();
  }
})();
