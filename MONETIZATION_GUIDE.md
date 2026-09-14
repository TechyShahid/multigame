# 💰 MultiGame Arcade — Monetization & Revenue Guide

This guide details how your games generate revenue, how the monetization architecture works, and the exact steps to submit your games to web game portals and ad networks.

---

## 🏗️ 1. Monetization Architecture Overview

The arcade now uses a modular, non-intrusive monetization SDK located at:
* **Styles**: [`shared/arcade-ads.css`](file:///Users/shahidkhan/multigame/shared/arcade-ads.css)
* **Manager**: [`shared/arcade-ads.js`](file:///Users/shahidkhan/multigame/shared/arcade-ads.js)

### Integrated Revenue Touchpoints:

| Game | Rewarded Ad Perk (Player Opt-In) | Interstitial Trigger (Automatic with 60s cooldown) |
| :--- | :--- | :--- |
| **Zen Sudoku** | 💡 **+3 Free Smart Hints** (triggered when free hints run out) & **Ad Revive** (-1 mistake) | "Play Another" on Victory or New Puzzle |
| **Candy Crush** | 🍬 **+5 Extra Moves** on "Out of Moves" modal | "Next Level" on Level Complete |
| **Neon Snake** | ⚡ **Revive Snake** with 4s Ghost Invulnerability | "Play Again" on Game Over |
| **Neon Pong** | 🏓 **Continue Rally** (+2 Lives in Solo Rally Mode) | "Play Again" on Match Over |
| **Arcade Hub** | ⭐ **VIP Ad-Free Pass** (Preview/Toggle) & ☕ **Buy Me a Coffee** | Responsive 728×90 / 320×50 Ad Banner Slot |

---

## 🧪 2. How to Test in Simulation / Sandbox Mode

By default, `ArcadeAds` runs in **Simulation Mode (`mock`)**:
1. When you click any **"Watch Ad"** button (e.g. out of hints in Sudoku, or revive in Snake), a realistic high-fidelity video ad simulator appears with a 5-second countdown and progress bar.
2. After 5 seconds, clicking **"🎉 Claim Reward"** automatically grants the perk and triggers a reward toast.
3. Automatic interstitials enforce a **60-second cooldown** so players are never spammed.

---

## 🚀 3. Step-by-Step Portal & Ad Network Setup

### Option A: CrazyGames Developer Portal (Recommended — Highest Payouts)
CrazyGames receives over 30 million monthly players and pays developers up to **50%–70% of ad revenue** generated.

1. **Sign Up**: Go to [https://developer.crazygames.com/](https://developer.crazygames.com/) and register a free developer account.
2. **Submit a Game**:
   * Create a new game submission (e.g. "Zen Sudoku" or "Candy Crush").
   * Zip the game folder (e.g., the `sudoku/` directory including `shared/`).
   * Upload the zip as an HTML5 web build.
3. **Switch Provider**:
   In `shared/arcade-ads.js`, set:
   ```javascript
   this.provider = 'crazygames';
   ```
   Or load the game with `?ads=crazygames` in the URL.
   The SDK will automatically load the official `crazygames-sdk-v3.js` and route all midgame and rewarded ads through CrazyGames!

---

### Option B: AdinPlay (For Independent Game Portals)
AdinPlay specializes in `.io` and casual HTML5 games with fast payouts via PayPal or Wire.

1. **Register**: Sign up at [https://adinplay.com/](https://adinplay.com/).
2. Add your domain (e.g. `https://yourdomain.com`).
3. Once approved, they will give you a publisher ID and tag IDs.
4. Replace `'YOUR_TAG_ID'` in [`shared/arcade-ads.js`](file:///Users/shahidkhan/multigame/shared/arcade-ads.js) and set:
   ```javascript
   this.provider = 'adinplay';
   ```

---

### Option C: Google AdSense for Games (H5 Games Ads)
1. If you already have an approved Google AdSense account, enable **AdSense for Games (AFG / H5)**.
2. Add the Google H5 Games snippet to `index.html` <head>:
   ```html
   <script async
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-channel="XXXXXXXXXX"
     data-ad-frequency-hint="60s"
     src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js">
   </script>
   ```
3. Set `this.provider = 'adsense_h5'` in [`shared/arcade-ads.js`](file:///Users/shahidkhan/multigame/shared/arcade-ads.js).

---

## ☕ 4. Connecting Your "Buy Me a Coffee" or Ko-fi Link

In [`index.html`](file:///Users/shahidkhan/multigame/index.html), locate line 578:
```html
<a href="https://buymeacoffee.com" target="_blank" rel="noopener" class="monetize-pill pill-coffee" id="btn-coffee">
```
Change `https://buymeacoffee.com` to your personal page (e.g., `https://buymeacoffee.com/yourname` or `https://ko-fi.com/yourname`).

---

## 🌐 5. Custom Domain & SEO Setup (For Higher CPMs)

1. Buy a domain on Namecheap, Porkbun, or Google Cloud Domains (e.g. `multigamearcade.com` or `playzen.games`).
2. Point your domain's DNS `CNAME` record to `techyshahid.github.io`.
3. In GitHub Repository Settings > **Pages**, enter your Custom Domain and check **Enforce HTTPS**.
4. Custom domains have a significantly higher acceptance rate on Google AdSense and AdinPlay compared to generic free subdomains.
