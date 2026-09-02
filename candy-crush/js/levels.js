/**
 * Candy Crush — Level Configuration
 * 30 levels with progressive difficulty
 */

export const LEVELS = [
  // World 1: Sweet Meadows (Levels 1–10)
  {
    id: 1, name: "Sweet Start", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 30, targetScore: 1000,
    stars: [1000, 2500, 5000], candyTypes: 4
  },
  {
    id: 2, name: "Gummy Path", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 28, targetScore: 1500,
    stars: [1500, 3500, 6000], candyTypes: 4
  },
  {
    id: 3, name: "Lollipop Lane", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 25, targetScore: 2000,
    stars: [2000, 4000, 7000], candyTypes: 5
  },
  {
    id: 4, name: "Candy Creek", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 25, targetScore: 2500,
    stars: [2500, 5000, 8000], candyTypes: 5
  },
  {
    id: 5, name: "Jelly Bridge", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 22, targetScore: 3000,
    stars: [3000, 6000, 10000], candyTypes: 5
  },
  {
    id: 6, name: "Sugar Slopes", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 22, targetScore: 3500,
    stars: [3500, 7000, 12000], candyTypes: 5
  },
  {
    id: 7, name: "Taffy Tunnel", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 20, targetScore: 4000,
    stars: [4000, 8000, 13000], candyTypes: 5
  },
  {
    id: 8, name: "Peppermint Pass", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 20, targetScore: 5000,
    stars: [5000, 9000, 15000], candyTypes: 6
  },
  {
    id: 9, name: "Caramel Cove", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 18, targetScore: 5500,
    stars: [5500, 10000, 16000], candyTypes: 6
  },
  {
    id: 10, name: "Meadow's End", world: "Sweet Meadows",
    rows: 8, cols: 8, moves: 18, targetScore: 6000,
    stars: [6000, 12000, 18000], candyTypes: 6
  },

  // World 2: Chocolate Mountains (Levels 11–20)
  {
    id: 11, name: "Cocoa Foothills", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 25, targetScore: 7000,
    stars: [7000, 13000, 20000], candyTypes: 6
  },
  {
    id: 12, name: "Truffle Trail", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 23, targetScore: 8000,
    stars: [8000, 14000, 22000], candyTypes: 6
  },
  {
    id: 13, name: "Fudge Falls", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 22, targetScore: 9000,
    stars: [9000, 16000, 24000], candyTypes: 6
  },
  {
    id: 14, name: "Mocha Ridge", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 20, targetScore: 10000,
    stars: [10000, 18000, 27000], candyTypes: 6
  },
  {
    id: 15, name: "Dark Choco Cave", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 20, targetScore: 11000,
    stars: [11000, 19000, 29000], candyTypes: 6
  },
  {
    id: 16, name: "Brownie Basin", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 18, targetScore: 12000,
    stars: [12000, 21000, 32000], candyTypes: 6
  },
  {
    id: 17, name: "Ganache Gorge", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 18, targetScore: 13000,
    stars: [13000, 23000, 35000], candyTypes: 6
  },
  {
    id: 18, name: "Praline Peak", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 16, targetScore: 14000,
    stars: [14000, 25000, 38000], candyTypes: 6
  },
  {
    id: 19, name: "Nougat Cliff", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 16, targetScore: 15000,
    stars: [15000, 27000, 40000], candyTypes: 6
  },
  {
    id: 20, name: "Summit Swirl", world: "Chocolate Mountains",
    rows: 8, cols: 8, moves: 15, targetScore: 17000,
    stars: [17000, 30000, 45000], candyTypes: 6
  },

  // World 3: Crystal Cosmos (Levels 21–30)
  {
    id: 21, name: "Starlight Entry", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 22, targetScore: 18000,
    stars: [18000, 32000, 48000], candyTypes: 6
  },
  {
    id: 22, name: "Nebula Sweets", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 20, targetScore: 20000,
    stars: [20000, 35000, 52000], candyTypes: 6
  },
  {
    id: 23, name: "Comet Crumble", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 20, targetScore: 22000,
    stars: [22000, 38000, 56000], candyTypes: 6
  },
  {
    id: 24, name: "Galaxy Gummies", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 18, targetScore: 24000,
    stars: [24000, 40000, 60000], candyTypes: 6
  },
  {
    id: 25, name: "Asteroid Belt", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 18, targetScore: 26000,
    stars: [26000, 44000, 65000], candyTypes: 6
  },
  {
    id: 26, name: "Supernova Surge", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 16, targetScore: 28000,
    stars: [28000, 48000, 70000], candyTypes: 6
  },
  {
    id: 27, name: "Orbit Overload", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 16, targetScore: 30000,
    stars: [30000, 52000, 76000], candyTypes: 6
  },
  {
    id: 28, name: "Pulsar Pop", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 15, targetScore: 33000,
    stars: [33000, 56000, 82000], candyTypes: 6
  },
  {
    id: 29, name: "Quasar Quest", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 14, targetScore: 36000,
    stars: [36000, 60000, 90000], candyTypes: 6
  },
  {
    id: 30, name: "Cosmic Finale", world: "Crystal Cosmos",
    rows: 8, cols: 8, moves: 12, targetScore: 40000,
    stars: [40000, 68000, 100000], candyTypes: 6
  }
];

/**
 * Candy type definitions with colors and shapes
 */
export const CANDY_TYPES = [
  { id: 0, name: "Red Jellybean",    emoji: "🔴", color: "#ff4757", gradient: "linear-gradient(135deg, #ff6b81, #ff4757, #c0392b)", shape: "circle" },
  { id: 1, name: "Orange Lollipop",  emoji: "🟠", color: "#ffa502", gradient: "linear-gradient(135deg, #ffbe76, #ffa502, #e67e22)", shape: "circle" },
  { id: 2, name: "Yellow Star",      emoji: "🟡", color: "#ffd32a", gradient: "linear-gradient(135deg, #fff200, #ffd32a, #f9ca24)", shape: "diamond" },
  { id: 3, name: "Green Gummy",      emoji: "🟢", color: "#2ed573", gradient: "linear-gradient(135deg, #7bed9f, #2ed573, #27ae60)", shape: "circle" },
  { id: 4, name: "Blue Candy",       emoji: "🔵", color: "#3742fa", gradient: "linear-gradient(135deg, #70a1ff, #3742fa, #2c3e9c)", shape: "circle" },
  { id: 5, name: "Purple Bonbon",    emoji: "🟣", color: "#a55eea", gradient: "linear-gradient(135deg, #d291ff, #a55eea, #8854d0)", shape: "circle" }
];

/**
 * Special candy types
 */
export const SPECIAL_TYPES = {
  NONE: 'none',
  STRIPED_H: 'striped_h',  // Clears entire row
  STRIPED_V: 'striped_v',  // Clears entire column
  WRAPPED: 'wrapped',       // 3x3 explosion
  COLOR_BOMB: 'color_bomb'  // Clears all of one color
};

export function getLevelConfig(levelId) {
  return LEVELS.find(l => l.id === levelId) || LEVELS[0];
}
