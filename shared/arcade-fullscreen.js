/**
 * MultiGame Arcade — Fullscreen & Game Mode Controller
 * Handles fullscreen kiosk activation, browser zoom prevention during gameplay,
 * and clean restoration of default browser settings when returning to the arcade portal.
 */

(function () {
  'use strict';

  // Detect whether this is the root MultiGame Arcade portal or a game subfolder
  const isArcadePortal = 
    document.body.hasAttribute('data-arcade-portal') ||
    window.location.pathname.endsWith('/multigame/') ||
    window.location.pathname.endsWith('/multigame/index.html') ||
    window.location.pathname === '/' ||
    window.location.pathname.endsWith('/index.html') && !window.location.pathname.includes('/candy-crush/') && !window.location.pathname.includes('/math-olympiad/') && !window.location.pathname.includes('/pong/') && !window.location.pathname.includes('/snake/') && !window.location.pathname.includes('/sudoku/') && !window.location.pathname.includes('/kids-learning/');

  /* -------------------------------------------------------------
     PORTAL MODE: Default browser behavior restored
     ------------------------------------------------------------- */
  if (isArcadePortal) {
    // 1. If returning from a game in fullscreen, exit fullscreen cleanly
    const exitIfFullscreen = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (fsEl) {
        const exitFn = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exitFn) {
          exitFn.call(document).catch(() => {});
        }
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', exitIfFullscreen);
    } else {
      exitIfFullscreen();
    }

    // 2. When user clicks any game card, request fullscreen synchronously within the user gesture
    document.addEventListener('click', (e) => {
      const gameLink = e.target.closest('a[href], .game-card, .btn-play-game');
      if (gameLink) {
        const href = gameLink.getAttribute('href') || gameLink.querySelector('a')?.getAttribute('href');
        if (href && !href.startsWith('#') && !href.includes('mailto:')) {
          const docEl = document.documentElement;
          const reqFn = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (reqFn && !document.fullscreenElement) {
            reqFn.call(docEl).catch(() => {});
          }
        }
      }
    }, { capture: true });

    // Portal has NO zoom or context menu restrictions: all default browser options remain active!
    return;
  }

  /* -------------------------------------------------------------
     GAME MODE: Fullscreen & Browser Zoom/Menu Restrictions
     ------------------------------------------------------------- */
  document.body.classList.add('arcade-game-mode');

  // 1. Enforce non-scalable viewport meta tag
  let metaViewport = document.querySelector('meta[name="viewport"]');
  if (!metaViewport) {
    metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    document.head.appendChild(metaViewport);
  }
  metaViewport.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no'
  );

  // 2. Fullscreen Helpers
  const FullscreenManager = {
    isFullscreen() {
      return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    },

    request() {
      if (this.isFullscreen()) return Promise.resolve();
      const docEl = document.documentElement;
      const req =
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen;
      if (req) {
        return req.call(docEl).catch(() => {});
      }
      return Promise.resolve();
    },

    exit() {
      if (!this.isFullscreen()) return Promise.resolve();
      const exitFn =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
      if (exitFn) {
        return exitFn.call(document).catch(() => {});
      }
      return Promise.resolve();
    },

    toggle() {
      if (this.isFullscreen()) {
        return this.exit();
      } else {
        return this.request();
      }
    },

    updateButtons() {
      const isFs = this.isFullscreen();
      const buttons = document.querySelectorAll('.btn-arcade-fullscreen');
      buttons.forEach((btn) => {
        const diffTitle = btn.querySelector('.diff-title');
        if (diffTitle) {
          diffTitle.textContent = `${isFs ? '🗗' : '⛶'} ${isFs ? 'Exit Fullscreen' : 'Fullscreen Mode'}`;
        } else {
          btn.innerHTML = isFs ? '🗗' : '⛶';
        }
        btn.setAttribute('title', isFs ? 'Exit Fullscreen' : 'Enter Fullscreen Mode');
        btn.setAttribute('aria-label', isFs ? 'Exit Fullscreen' : 'Enter Fullscreen Mode');
      });
    }
  };

  // Expose global manager
  window.ArcadeFullscreen = FullscreenManager;

  // 3. Auto-enter Fullscreen on Startup & User Interactions
  // Try immediate request on load if user activation was inherited
  FullscreenManager.request();

  // On any interaction anywhere on the game page, if not in fullscreen, enter fullscreen
  const ensureFullscreenOnInteraction = (e) => {
    if (FullscreenManager.isFullscreen()) return;
    // If clicking an exit or return-to-arcade button, do not request fullscreen
    if (e.target && e.target.closest('a[href*="../"], [id*="exit"], [class*="exit"], .btn-arcade-back, .btn-home-link')) {
      return;
    }
    FullscreenManager.request();
  };

  ['click', 'touchend', 'pointerup', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, ensureFullscreenOnInteraction, { passive: true, capture: true });
  });

  // Track fullscreen state changes
  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach((evt) => {
    document.addEventListener(evt, () => FullscreenManager.updateButtons());
  });

  // 4. Disable Browser Zoom & Restrictive Keyboard Shortcuts
  window.addEventListener(
    'keydown',
    (e) => {
      // Prevent Ctrl/Cmd + (+ / - / = / 0) browser zoom
      if (e.ctrlKey || e.metaKey) {
        if (
          e.key === '+' ||
          e.key === '-' ||
          e.key === '=' ||
          e.key === '_' ||
          e.key === '0' ||
          e.code === 'Minus' ||
          e.code === 'Equal' ||
          e.code === 'NumpadAdd' ||
          e.code === 'NumpadSubtract' ||
          e.code === 'Digit0' ||
          e.code === 'Numpad0'
        ) {
          e.preventDefault();
        }
      }

      // Allow F11 for native toggle, but also sync state
      if (e.key === 'F11') {
        setTimeout(() => FullscreenManager.updateButtons(), 200);
      }
    },
    { passive: false }
  );

  // Prevent Mouse Wheel Zoom (Ctrl + Wheel)
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent Safari Gesture Zoom (Pinch)
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((evt) => {
    window.addEventListener(
      evt,
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
  });

  // Prevent Multi-Touch Pinch to Zoom on Mobile
  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent Double-Tap Zoom on touch devices
  let lastTouchEnd = 0;
  window.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        // Allow clicks on inputs if any
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // Prevent Context Menu during gameplay (unless right-clicking an input)
  window.addEventListener(
    'contextmenu',
    (e) => {
      if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 5. Exit Navigation Interception: Exit Fullscreen when leaving game
  const handleExitToArcade = (e) => {
    const exitTarget = e.target.closest(
      'a[href^="../"], a[href="./"], [id*="exit"], [id*="back-arcade"], [id*="arcade-exit"], .btn-arcade-back, .btn-arcade-exit, .btn-arcade-exit-bottom, .btn-home-link'
    );

    if (exitTarget) {
      if (FullscreenManager.isFullscreen()) {
        FullscreenManager.exit();
      }
    }
  };

  document.addEventListener('click', handleExitToArcade, { capture: true });

  // 6. Connect Fullscreen Toggle Buttons on DOM Ready
  const initButtons = () => {
    document.querySelectorAll('.btn-arcade-fullscreen').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        FullscreenManager.toggle();
      });
    });
    FullscreenManager.updateButtons();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButtons);
  } else {
    initButtons();
  }
})();
