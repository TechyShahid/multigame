/**
 * Haptics — Vibration API utility for mobile touch feedback
 * Uses navigator.vibrate() with graceful fallback on unsupported devices
 */

export const Haptics = {
  /** Check if vibration is supported */
  supported: typeof navigator !== 'undefined' && 'vibrate' in navigator,

  /** Light tap — candy selection (10ms) */
  light() {
    if (this.supported) navigator.vibrate(10);
  },

  /** Medium tap — swap attempt (25ms) */
  medium() {
    if (this.supported) navigator.vibrate(25);
  },

  /** Match pop — candies popping (short pattern) */
  pop() {
    if (this.supported) navigator.vibrate(15);
  },

  /** Combo/cascade — chain reaction (escalating pattern) */
  combo(level) {
    if (!this.supported) return;
    const duration = Math.min(20 + level * 10, 80);
    navigator.vibrate(duration);
  },

  /** Special candy activation — color bombs, stripes etc. */
  special() {
    if (this.supported) navigator.vibrate([20, 30, 40]);
  },

  /** Invalid move — swap rejected (error buzz) */
  error() {
    if (this.supported) navigator.vibrate([40, 30, 40]);
  },

  /** Victory — level complete */
  victory() {
    if (this.supported) navigator.vibrate([30, 50, 30, 50, 60]);
  },

  /** Game over — no more moves */
  gameOver() {
    if (this.supported) navigator.vibrate([80, 40, 80]);
  }
};
