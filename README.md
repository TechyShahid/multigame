# 🧩 Zen Sudoku Pro

A modern, responsive, and feature-rich 9x9 Sudoku web application built with pure HTML5, CSS3, and Modular ES6+ JavaScript. Features procedural board generation with unique solutions, candidate pencil notes, smart educational hints, career statistics, and ambient Web Audio sound effects.

🚀 **Live Demo:** [https://techyshahid.github.io/multigame/](https://techyshahid.github.io/multigame/)

---

## 📸 Screenshots

### Midnight Dark (Default Theme)
![Zen Sudoku Desktop Dark Theme](screenshots/desktop-dark.png)

---

### Multiple Visual Themes
| Porcelain Light | Matrix Emerald |
| :---: | :---: |
| ![Porcelain Light Theme](screenshots/desktop-light.png) | ![Matrix Emerald Theme](screenshots/desktop-emerald.png) |

---

### Mobile Experience & Dashboards
| Single-Screen Mobile Layout | Career Statistics |
| :---: | :---: |
| ![Mobile Layout (390x844)](screenshots/mobile-layout.png) | ![Career Statistics Modal](screenshots/career-stats.png) |

---

### Settings & Customization
![Settings Modal](screenshots/settings-modal.png)

---

## ✨ Features

- **Procedural Generation & Solver**: Backtracking algorithm with unique solution guarantees across 5 difficulty levels:
  - **Beginner**: 50 clues
  - **Easy**: 40 clues
  - **Medium**: 33 clues
  - **Hard**: 28 clues
  - **Expert**: 24 clues
- **Candidate Notes**: 3×3 mini-grid inside empty cells for candidate numbers, complete with one-click **Auto-Fill Candidates** and automatic peer note cleanup upon placing correct digits.
- **Smart Educational Hints**: Analyzes the board and explains step-by-step logical deductions (**Naked Singles**, **Hidden Singles**, conflict detection) rather than simply revealing an answer.
- **Dual Input Modes**:
  - **Cell First**: Select a cell, then tap a number.
  - **Digit First**: Select a number, then rapidly tap multiple cells across the board.
- **Single-Screen Mobile Layout**: Designed with `100dvh` dynamic height to fit the entire board, header, controls, and keypad above the fold on mobile screens with zero vertical scrolling.
- **Web Audio API**: Crisp synthesizer sounds for clicks, pencil scribbles, error buzzes, and celebratory victory fanfares with zero external audio dependencies.
- **Confetti Cannon**: High-performance canvas particle system celebrating puzzle completion.
- **Career Statistics**: Tracks games played, win rate, best time, average time, and win streaks per difficulty level via `localStorage`.
- **Custom Board & Solver**: Allows inputting or solving custom 81-character puzzle strings.
- **Printable**: Clean `@media print` stylesheet for physical paper puzzle sheets.

---

## ⌨️ Keyboard Shortcuts

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
