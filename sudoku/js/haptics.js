/**
 * Haptics — Vibration API utility for mobile touch feedback
 * Uses navigator.vibrate() with graceful fallback on unsupported devices
 */

export const Haptics = {
  /** Check if vibration is supported */
  supported: typeof navigator !== 'undefined' && 'vibrate' in navigator,

  /** Light tap — cell selection, button taps (10ms) */
  light() {
    if (this.supported) navigator.vibrate(10);
  },

  /** Medium tap — number placement, note toggle (25ms) */
  medium() {
    if (this.supported) navigator.vibrate(25);
  },

  /** Heavy buzz — errors, wrong number (pattern: buzz-pause-buzz) */
  error() {
    if (this.supported) navigator.vibrate([40, 30, 40]);
  },

  /** Success — correct placement, victory (pattern: short-pause-long) */
  success() {
    if (this.supported) navigator.vibrate([15, 50, 30]);
  },

  /** Victory — puzzle completed (celebratory pattern) */
  victory() {
    if (this.supported) navigator.vibrate([30, 50, 30, 50, 60]);
  },

  /** Game over — defeat buzz */
  gameOver() {
    if (this.supported) navigator.vibrate([80, 40, 80]);
  }
};
