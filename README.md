# Zen Sudoku Pro

A modern, responsive, and feature-rich 9x9 Sudoku web application with procedural board generation, intelligent hints, pencil candidate notes, multiple color schemes, and Web Audio sound synthesis.

Live Demo: [https://TechyShahid.github.io/multigame/](https://TechyShahid.github.io/multigame/)

---

## Features

- **Procedural Generation & Solver**: Fast backtracking generator with guaranteed unique solutions across 5 difficulty levels (Beginner, Easy, Medium, Hard, Expert).
- **Candidate Notes**: 3x3 pencil marks inside cells with auto-fill and auto-clearing when numbers are placed.
- **Intelligent Step-by-Step Hints**: Detects and explains logical deductions (Naked Singles, Hidden Singles, conflict resolution).
- **Dual Input Modes**: Cell-first (select cell -> tap digit) and Digit-first (select digit -> tap multiple cells).
- **Multiple Themes**: Midnight Dark, Porcelain Light, and Matrix Emerald.
- **Web Audio API**: Crisp synthesizer sounds for clicks, notes, errors, and celebratory victory fanfare without external assets.
- **Confetti Celebration**: Smooth 60fps canvas particle cannon on puzzle completion.
- **Career Statistics**: Tracks games played, win rate, best time, average time, and streaks per difficulty level via LocalStorage.
- **Printable**: Dedicated print stylesheet for clean physical paper puzzles.

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `1` - `9` | Place number or candidate note |
| `Arrow Keys` / `W` `A` `S` `D` | Navigate cells |
| `Delete` / `Backspace` | Erase cell |
| `N` | Toggle pencil notes mode |
| `H` | Get a smart hint |
| `Ctrl` + `Z` / `U` | Undo move |
| `Ctrl` + `Y` | Redo move |
| `Space` / `P` | Pause / Resume |

---

## Local Development

No build dependencies or bundlers required. Simply serve using any static server:

```bash
# Using Python
python3 -m http.server 8080

# Or using Node
npx serve .
```

---

## License

MIT
