# 🕹️ MultiGame Arcade

A collection of beautiful, premium browser games — all built with pure HTML5, CSS3, and Modular ES6+ JavaScript. No frameworks, no build steps, no dependencies.

🚀 **Live Demo:** [https://techyshahid.github.io/multigame/](https://techyshahid.github.io/multigame/)

---

## 🎮 Games

### 🧩 Zen Sudoku Pro

A modern, responsive, and feature-rich 9×9 Sudoku web app with procedural board generation (unique solutions), candidate pencil notes, smart educational hints, career statistics, ambient Web Audio sound effects, and PvP multiplayer.

**[▶ Play Zen Sudoku](https://techyshahid.github.io/multigame/sudoku/)**

#### Highlights

- **⚔️ Player vs Player (PvP) Modes**:
  - **Local Turn Battle (Pass & Play)**: Two players take turns on a shared board with scoring, combos, and an optional shot-clock.
  - **Online 1v1 Race (WebRTC PeerJS)**: Zero-backend peer-to-peer real-time race via 5-letter Room Codes.
- **Procedural Generation & Solver**: Backtracking algorithm with unique solution guarantees across 5 difficulty levels (Beginner → Expert).
- **Candidate Notes**: 3×3 mini-grid inside empty cells with one-click **Auto-Fill Candidates** and automatic peer note cleanup.
- **Smart Educational Hints**: Step-by-step logical deductions (Naked Singles, Hidden Singles, conflict detection).
- **Dual Input Modes**: Cell First or Digit First for rapid board filling.
- **Single-Screen Mobile Layout**: `100dvh` dynamic height — zero vertical scrolling on mobile.
- **Web Audio API**: Synthesized clicks, pencil scribbles, error buzzes, and victory fanfares with zero external audio files.
- **Confetti Cannon**: Canvas particle system celebrating puzzle completion.
- **Career Statistics**: Games played, win rate, best time, average time, and win streaks per difficulty via `localStorage`.
- **Custom Board & Solver**: Input or solve custom 81-character puzzle strings.
- **3 Visual Themes**: Midnight Dark, Porcelain Light, Matrix Emerald.
- **Printable**: Clean `@media print` stylesheet for paper puzzle sheets.

---

### 🍬 Candy Crush

A sweet match-3 puzzle game with special candies, cascading combos, and 30 levels of sugary fun.

**[▶ Play Candy Crush](https://techyshahid.github.io/multigame/candy-crush/)**

#### Highlights

- **30 Levels** of progressively challenging match-3 gameplay.
- **Special Candies**: Striped, wrapped, and color bombs with spectacular chain reactions.
- **Cascading Combos**: Gravity-driven chain matches for massive scores.
- **Beautiful Animations**: Smooth swaps, explosions, and particle effects.
- **Responsive Design**: Plays great on desktop and mobile.

---

### 🏓 Neon Pong

A thrilling, retro-futuristic arcade Pong game with responsive physics, ball spin, dynamic power-ups, particle bursts, and rich Web Audio synthesized soundscapes.

**[▶ Play Neon Pong](https://techyshahid.github.io/multigame/pong/)**

#### Highlights

- **3 Game Modes**:
  - **Solo vs AI**: 4 distinct AI profiles (*Novice*, *Pro*, *Master*, and frame-perfect *Cyber*).
  - **Local 2-Player**: Battle head-to-head on the same screen (W/S vs Arrow keys, or dual touch zones on mobile).
  - **Solo Target Rally**: Breakout-style solo mode with destructible neon targets, bumper walls, and score multipliers.
- **Dynamic Arcade Power-Ups**:
  - 🔥 **Fireball**: Supercharged supersonic ball.
  - 📏 **Paddle Expand**: Lengthens paddle for clutch saves.
  - ❄️ **Slow-Mo**: Chills ball velocity for razor-sharp precision.
  - 🛡️ **Goal Shield**: Defensive energy wall blocking one missed point.
  - ⚡ **Multi-Ball**: Spawns multiple balls simultaneously for high-octane rallies.
- **Realistic Physics & Ball Spin**: Imparts English based on paddle movement velocity and contact position.
- **4 Visual Themes**: Cyberpunk Neon, Synthwave Sunset, 1972 CRT Green (with scanline overlay), and Electric Blue.
- **Pure Web Audio API**: Ascending pitch paddle hits during long streaks, sub-bass goal explosions, and optional pulsing synthwave soundtrack.
- **Comprehensive Controls**: Keyboard (`W/S`, `↑/↓`, `Space`, `Esc`), mouse tracking, and mobile touch zones.
- **Career Statistics**: Lifetime matches played, player win rate, top ball speeds, and max rally records stored via `localStorage`.

---

### 🐍 Neon Snake

A sleek, retro-futuristic arcade Snake game featuring interpolated 60 FPS movement, interactive power-ups, maze obstacles with wormhole portals, dynamic combo multipliers, and rich Web Audio synthesized audio.

**[▶ Play Neon Snake](https://techyshahid.github.io/multigame/snake/)**

#### Highlights

- **4 Game Modes**:
  - **Classic Snake**: Pure nostalgic arcade experience with speed scaling as length increases.
  - **Arcade Power-Ups**: Dynamic special items including Golden Apples, Ghost Phase, Cryo Slow, Orb Magnet, and Tail Shrink Pills.
  - **Maze & Portals**: 5 challenging arena maps (*Open Field*, *The Box*, *Crossroads*, *Twin Pillars*, and *Wormhole Portals*).
  - **Time Attack**: High-intensity 90-second score frenzy with constant fruit spawns.
- **Dynamic Arcade Power-Ups**:
  - 🍏 **Neon Apple**: Standard food (+10 pts, grows +1 segment).
  - ⭐ **Golden Star Orb**: Rare high-value bonus (+50 pts with circular countdown timer).
  - 👻 **Ghost Phase**: Temporary invulnerability to safely pass through obstacles or your own tail (6s).
  - ❄️ **Cryo Freeze**: Chills serpent velocity for pinpoint maneuvering precision.
  - 🧲 **Orb Magnet**: Attracts nearby food towards the serpent head.
  - 💊 **Tail Shrink**: Chops 4 segments off the tail for an emergency escape.
- **Fluid Visuals & 4 Curated Themes**:
  - High-DPI canvas rendering with smooth 60 FPS interpolated slithering, glowing body segments, directional cyber eyes, and animated tongue.
  - 4 Themes: **Cyber Neon**, **Synthwave Sunset**, **1997 Nokia CRT** (with scanline overlay), and **Obsidian Ember**.
- **Pure Web Audio API**: Ascending combo tones, golden fruit arpeggios, power-up hums, sub-bass crash explosions, and toggleable retro synth bassline.
- **Comprehensive Controls**: Keyboard (`WASD`, `↑/↓/←/→`, `Space`, `P`, `M`), touch swipe gestures, and on-screen translucent D-pad.
- **Career Statistics**: Lifetime games, max snake length, total orbs eaten, and high scores per mode stored via `localStorage`.

---

## 📸 Screenshots

### Zen Sudoku — Midnight Dark (Default Theme)
![Zen Sudoku Desktop Dark Theme](screenshots/desktop-dark.png)

### Zen Sudoku — Multiple Visual Themes
| Porcelain Light | Matrix Emerald |
| :---: | :---: |
| ![Porcelain Light Theme](screenshots/desktop-light.png) | ![Matrix Emerald Theme](screenshots/desktop-emerald.png) |

### Zen Sudoku — Mobile & Dashboards
| Single-Screen Mobile Layout | Career Statistics |
| :---: | :---: |
| ![Mobile Layout (390x844)](screenshots/mobile-layout.png) | ![Career Statistics Modal](screenshots/career-stats.png) |

### Zen Sudoku — PvP Mode
| PvP Mode Selector | Local Turn Battle (Live Duel) |
| :---: | :---: |
| ![PvP Mode Selector](screenshots/pvp-mode-selector.png) | ![Local Turn Battle Duel](screenshots/pvp-local-battle.png) |

### Zen Sudoku — Settings & Customization
![Settings Modal](screenshots/settings-modal.png)

---

## ⌨️ Keyboard Shortcuts (Sudoku)

| Key | Action |
| :--- | :--- |
| `1` – `9` | Place number or candidate note |
| `Arrow Keys` / `W` `A` `S` `D` | Navigate cells |
| `Delete` / `Backspace` | Erase cell |
| `N` | Toggle pencil notes mode |
| `H` | Get a smart hint |
| `Ctrl` + `Z` / `U` | Undo move |
| `Ctrl` + `Y` | Redo move |
| `Space` / `P` | Pause / Resume |

---

## 📁 Project Structure

```
multigame/
├── index.html          ← Game hub / landing page
├── README.md
├── sudoku/
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── app.js
│       ├── audio.js
│       ├── confetti.js
│       ├── pvp-local.js
│       ├── pvp-online.js
│       ├── storage.js
│       └── sudoku-engine.js
├── candy-crush/
│   ├── index.html
│   ├── style.css
│   └── js/
│       └── app.js
└── screenshots/
```

---

## 🚀 Local Development

No build steps or bundlers required. Run with any local HTTP server:

```bash
# Using Python
python3 -m http.server 8080

# Or using Node
npx serve .
```

Open `http://localhost:8080` in your browser.

---

## 📄 License

MIT © [Shahid Khan](https://github.com/TechyShahid)
