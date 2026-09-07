/**
 * Neon Snake - Core Game Engine
 * Features:
 * - Interpolated 60 FPS rendering on a discrete grid
 * - Input queue to eliminate accidental 180° self-collisions
 * - 5 Arena maps (Classic, Box, Cross, Pillars, Portals)
 * - Arcade power-ups (Golden Apple, Ghost Phase, Cryo Freeze, Magnet, Shrink)
 * - Combo multiplier system
 * - High DPI canvas support
 */

class SnakeGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Grid configuration
    this.gridWidth = 22;
    this.gridHeight = 22;
    this.cellSize = 24;

    // Game state
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
    this.mode = 'classic'; // 'classic', 'arcade', 'maze', 'timeattack'
    this.map = 'infinity'; // 'infinity' (default no-walls wrap arena), 'open', 'box', 'cross', 'pillars', 'portals'
    this.wallsSolid = false; // Infinity arena has wrap borders by default
    this.difficulty = 'normal'; // 'chill', 'normal', 'hard', 'dynamic'

    // Snake representation
    // Segment format: { x, y, prevX, prevY }
    this.snake = [];
    this.direction = { x: 1, y: 0 };
    this.targetDirection = { x: 1, y: 0 };
    this.inputQueue = [];
    this.growPending = 0;

    // Food & Items
    this.food = null; // { x, y, type: 'apple' }
    this.goldenFood = null; // { x, y, timer, maxTimer, pulse }
    this.powerUp = null; // { x, y, type: 'ghost'|'slow'|'magnet'|'shrink'|'speed', timer, maxTimer }
    this.activePowerUp = null; // { type, duration, maxDuration }

    // Portals for 'portals' map
    this.portals = []; // [{ x, y, partnerIndex, color: '#38bdf8' }, { x, y, partnerIndex, color: '#f43f5e' }]

    // Obstacles: array of { x, y }
    this.obstacles = [];

    // Stats & Scoring
    this.score = 0;
    this.highScore = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.comboMaxTime = 3.0; // seconds
    this.foodEaten = 0;
    this.goldenEaten = 0;
    this.powerUpsCollected = 0;
    this.timeAttackRemaining = 90; // seconds

    // Timing & Interpolation
    this.lastTickTime = 0;
    this.tickInterval = 130; // ms per step
    this.baseSpeed = 130;
    this.interpolation = 0; // 0..1 between ticks
    this.rafId = null;
    this.lastFrameTime = performance.now();

    // Visual theme
    this.theme = 'neon'; // 'neon', 'synthwave', 'crt', 'ember'

    this.initMap(this.map);
  }

  setTheme(themeName) {
    this.theme = themeName;
  }

  setMode(modeName) {
    this.mode = modeName;
    if (modeName === 'maze') {
      if (this.map === 'infinity' || this.map === 'open') this.map = 'box';
    } else if (modeName === 'timeattack') {
      this.timeAttackRemaining = 90;
    }
    this.initMap(this.map);
  }

  setMap(mapName) {
    this.map = mapName;
    this.initMap(mapName);
  }

  setDifficulty(diff) {
    this.difficulty = diff;
    if (diff === 'chill') this.baseSpeed = 170;
    else if (diff === 'normal') this.baseSpeed = 130;
    else if (diff === 'hard') this.baseSpeed = 95;
    else if (diff === 'dynamic') this.baseSpeed = 145;
    this.tickInterval = this.baseSpeed;
  }

  initMap(mapName) {
    this.obstacles = [];
    this.portals = [];

    const W = this.gridWidth;
    const H = this.gridHeight;

    if (mapName === 'infinity') {
      this.wallsSolid = false;
    } else if (mapName === 'open') {
      this.wallsSolid = true;
    } else if (mapName === 'box') {
      this.wallsSolid = true;
      // 4 corner barriers
      for (let i = 4; i <= 7; i++) {
        this.obstacles.push({ x: i, y: 4 });
        this.obstacles.push({ x: W - 1 - i, y: 4 });
        this.obstacles.push({ x: i, y: H - 5 });
        this.obstacles.push({ x: W - 1 - i, y: H - 5 });
      }
      // Center block
      const cx = Math.floor(W / 2);
      const cy = Math.floor(H / 2);
      this.obstacles.push({ x: cx - 1, y: cy });
      this.obstacles.push({ x: cx, y: cy });
      this.obstacles.push({ x: cx + 1, y: cy });
    } else if (mapName === 'cross') {
      const cx = Math.floor(W / 2);
      const cy = Math.floor(H / 2);
      // Horizontal cross wings with gap in center
      for (let x = 3; x <= cx - 3; x++) {
        this.obstacles.push({ x, y: cy });
        this.obstacles.push({ x: W - 1 - x, y: cy });
      }
      // Vertical cross wings
      for (let y = 3; y <= cy - 3; y++) {
        this.obstacles.push({ x: cx, y });
        this.obstacles.push({ x: cx, y: H - 1 - y });
      }
    } else if (mapName === 'pillars') {
      // 4 vertical columns
      const cols = [5, W - 6];
      for (const col of cols) {
        for (let y = 4; y <= H - 5; y++) {
          if (y !== Math.floor(H / 2)) {
            this.obstacles.push({ x: col, y });
          }
        }
      }
    } else if (mapName === 'portals') {
      // Two portal pairs: Portal A (cyan) and Portal B (pink)
      this.portals = [
        { x: 2, y: Math.floor(H / 2), targetX: W - 3, targetY: Math.floor(H / 2), color: '#06b6d4', label: 'A' },
        { x: W - 3, y: Math.floor(H / 2), targetX: 2, targetY: Math.floor(H / 2), color: '#ec4899', label: 'B' }
      ];
      // Some modest obstacles to navigate around
      const cx = Math.floor(W / 2);
      for (let y = 5; y <= H - 6; y++) {
        if (y < 9 || y > 12) {
          this.obstacles.push({ x: cx, y });
        }
      }
    }
  }

  reset() {
    this.inputQueue = [];
    this.growPending = 0;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.foodEaten = 0;
    this.goldenEaten = 0;
    this.powerUpsCollected = 0;
    this.activePowerUp = null;
    this.goldenFood = null;
    this.powerUp = null;
    this.timeAttackRemaining = 90;

    this.setDifficulty(this.difficulty);

    const startX = 6;
    const startY = Math.floor(this.gridHeight / 2);

    this.snake = [
      { x: startX, y: startY, prevX: startX - 1, prevY: startY },
      { x: startX - 1, y: startY, prevX: startX - 2, prevY: startY },
      { x: startX - 2, y: startY, prevX: startX - 3, prevY: startY },
      { x: startX - 3, y: startY, prevX: startX - 4, prevY: startY }
    ];

    this.direction = { x: 1, y: 0 };
    this.targetDirection = { x: 1, y: 0 };

    this.initMap(this.map);
    this.spawnFood();

    this.lastTickTime = performance.now();
    this.interpolation = 0;
  }

  start() {
    this.reset();
    this.state = 'PLAYING';
    if (window.soundManager) window.soundManager.init();
  }

  pause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTickTime = performance.now();
    }
  }

  handleInput(dirX, dirY) {
    if (this.state !== 'PLAYING') return;

    // Get reference direction (last queued or current target)
    const refDir = this.inputQueue.length > 0 
      ? this.inputQueue[this.inputQueue.length - 1] 
      : this.targetDirection;

    // Disallow 180° immediate reverse
    if (dirX === -refDir.x && dirY === -refDir.y) {
      return;
    }
    // Disallow duplicate direction
    if (dirX === refDir.x && dirY === refDir.y) {
      return;
    }

    // Limit buffer queue to 2 inputs
    if (this.inputQueue.length < 2) {
      this.inputQueue.push({ x: dirX, y: dirY });
      if (window.soundManager) window.soundManager.playTurn();
    }
  }

  isOccupied(x, y, ignoreTail = false) {
    // Check snake
    const len = ignoreTail ? this.snake.length - 1 : this.snake.length;
    for (let i = 0; i < len; i++) {
      if (this.snake[i].x === x && this.snake[i].y === y) return true;
    }
    // Check obstacles
    for (const obs of this.obstacles) {
      if (obs.x === x && obs.y === y) return true;
    }
    // Check portals
    for (const p of this.portals) {
      if (p.x === x && p.y === y) return true;
    }
    return false;
  }

  spawnFood() {
    let emptyCells = [];
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (!this.isOccupied(x, y)) {
          // Also check not on golden or powerup
          if (this.goldenFood && this.goldenFood.x === x && this.goldenFood.y === y) continue;
          if (this.powerUp && this.powerUp.x === x && this.powerUp.y === y) continue;
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      this.food = null;
      return;
    }

    const spot = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.food = { x: spot.x, y: spot.y, type: 'apple' };
  }

  spawnGoldenFood() {
    if (this.goldenFood) return;
    let emptyCells = [];
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (!this.isOccupied(x, y)) {
          if (this.food && this.food.x === x && this.food.y === y) continue;
          if (this.powerUp && this.powerUp.x === x && this.powerUp.y === y) continue;
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length > 0) {
      const spot = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.goldenFood = {
        x: spot.x,
        y: spot.y,
        timer: 8.0,
        maxTimer: 8.0
      };
    }
  }

  spawnPowerUp() {
    if (this.powerUp || this.mode === 'classic') return;
    const types = ['ghost', 'slow', 'magnet', 'shrink', 'speed'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    let emptyCells = [];
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (!this.isOccupied(x, y)) {
          if (this.food && this.food.x === x && this.food.y === y) continue;
          if (this.goldenFood && this.goldenFood.x === x && this.goldenFood.y === y) continue;
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length > 0) {
      const spot = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.powerUp = {
        x: spot.x,
        y: spot.y,
        type: chosenType,
        timer: 10.0,
        maxTimer: 10.0
      };
    }
  }

  tick() {
    if (this.state !== 'PLAYING') return;

    // Process queued input
    if (this.inputQueue.length > 0) {
      this.targetDirection = this.inputQueue.shift();
    }
    this.direction = { ...this.targetDirection };

    const head = this.snake[0];
    let nextX = head.x + this.direction.x;
    let nextY = head.y + this.direction.y;

    // Handle Portal traversal
    let usedPortal = false;
    for (const portal of this.portals) {
      if (nextX === portal.x && nextY === portal.y) {
        nextX = portal.targetX + this.direction.x;
        nextY = portal.targetY + this.direction.y;
        usedPortal = true;
        if (window.soundManager) window.soundManager.playPortal();
        if (window.particleSystem) {
          const ptX = (portal.x + 0.5) * this.cellSize;
          const ptY = (portal.y + 0.5) * this.cellSize;
          window.particleSystem.emitBurst(ptX, ptY, portal.color, 16, 4);
        }
        break;
      }
    }

    // Boundary wrapping or collision
    if (!this.wallsSolid) {
      if (nextX < 0) nextX = this.gridWidth - 1;
      else if (nextX >= this.gridWidth) nextX = 0;
      if (nextY < 0) nextY = this.gridHeight - 1;
      else if (nextY >= this.gridHeight) nextY = 0;
    } else {
      if (nextX < 0 || nextX >= this.gridWidth || nextY < 0 || nextY >= this.gridHeight) {
        // Wall crash!
        if (this.activePowerUp && this.activePowerUp.type === 'ghost') {
          // Ghost phase wraps through wall safely!
          if (nextX < 0) nextX = this.gridWidth - 1;
          else if (nextX >= this.gridWidth) nextX = 0;
          if (nextY < 0) nextY = this.gridHeight - 1;
          else if (nextY >= this.gridHeight) nextY = 0;
        } else {
          this.gameOver('Crashed into the perimeter barrier!');
          return;
        }
      }
    }

    // Check Obstacle collision
    for (const obs of this.obstacles) {
      if (obs.x === nextX && obs.y === nextY) {
        if (this.activePowerUp && this.activePowerUp.type === 'ghost') {
          // Phase through obstacle
        } else {
          this.gameOver('Crashed into a barrier block!');
          return;
        }
      }
    }

    // Check Self-collision (ignore tail if not growing)
    const checkLength = this.growPending > 0 ? this.snake.length : this.snake.length - 1;
    for (let i = 0; i < checkLength; i++) {
      if (this.snake[i].x === nextX && this.snake[i].y === nextY) {
        if (this.activePowerUp && this.activePowerUp.type === 'ghost') {
          // Ghost mode can safely pass through own tail!
        } else {
          this.gameOver('Collided with your own tail!');
          return;
        }
      }
    }

    // Save snapshot of positions before moving
    const oldSnake = this.snake.map(s => ({ x: s.x, y: s.y }));

    // Advance snake segments
    const newHead = {
      x: nextX,
      y: nextY,
      prevX: head.x,
      prevY: head.y
    };

    this.snake.unshift(newHead);

    if (this.growPending > 0) {
      this.growPending--;
    } else {
      this.snake.pop();
    }

    // Update body segments so each segment smoothly glides toward its predecessor
    for (let i = 1; i < this.snake.length; i++) {
      const seg = this.snake[i];
      const targetPos = oldSnake[i - 1];
      const prevPos = i < oldSnake.length ? oldSnake[i] : oldSnake[oldSnake.length - 1];

      seg.x = targetPos.x;
      seg.y = targetPos.y;
      seg.prevX = prevPos.x;
      seg.prevY = prevPos.y;
    }

    // Check Food consumption
    if (this.food && nextX === this.food.x && nextY === this.food.y) {
      this.consumeFood();
    }

    // Check Golden Food consumption
    if (this.goldenFood && nextX === this.goldenFood.x && nextY === this.goldenFood.y) {
      this.consumeGolden();
    }

    // Check Power-Up consumption
    if (this.powerUp && nextX === this.powerUp.x && nextY === this.powerUp.y) {
      this.consumePowerUp();
    }

    // Magnet power-up effect: pulls food toward head if within 3 units
    if (this.activePowerUp && this.activePowerUp.type === 'magnet') {
      this.applyMagnet();
    }

    // Dynamic speed recalculation
    if (this.difficulty === 'dynamic') {
      const speedRamp = Math.min(this.snake.length * 1.5, 65);
      this.tickInterval = Math.max(70, this.baseSpeed - speedRamp);
    }
  }

  applyMagnet() {
    const head = this.snake[0];
    const targets = [this.food, this.goldenFood].filter(Boolean);
    for (const target of targets) {
      const dx = head.x - target.x;
      const dy = head.y - target.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist > 0 && dist <= 4) {
        let stepX = target.x + (dx > 0 ? 1 : dx < 0 ? -1 : 0);
        let stepY = target.y + (dy > 0 ? 1 : dy < 0 ? -1 : 0);
        if (!this.isOccupied(stepX, stepY)) {
          target.x = stepX;
          target.y = stepY;
          if (window.particleSystem) {
            const px = (target.x + 0.5) * this.cellSize;
            const py = (target.y + 0.5) * this.cellSize;
            window.particleSystem.emitBurst(px, py, '#facc15', 3, 2, 2);
          }
        }
      }
    }
  }

  consumeFood() {
    this.foodEaten++;
    this.growPending += 1;

    // Combo calculation
    this.combo = Math.min(this.combo + 1, 5);
    this.comboTimer = this.comboMaxTime;

    const pts = 10 * this.combo;
    this.score += pts;
    if (this.score > this.highScore) this.highScore = this.score;

    if (window.soundManager) window.soundManager.playEat(this.combo);
    if (window.particleSystem) {
      const px = (this.food.x + 0.5) * this.cellSize;
      const py = (this.food.y + 0.5) * this.cellSize;
      window.particleSystem.emitBurst(px, py, '#22c55e', 20, 4.5);
    }

    this.spawnFood();

    // Occasional golden apple spawn (every 5-6 apples)
    if (this.foodEaten % 5 === 0 && !this.goldenFood) {
      this.spawnGoldenFood();
    }

    // Occasional power-up spawn (in arcade mode)
    if (this.mode === 'arcade' && this.foodEaten % 4 === 0 && !this.powerUp && !this.activePowerUp) {
      this.spawnPowerUp();
    }
  }

  consumeGolden() {
    this.goldenEaten++;
    this.growPending += 2;
    const pts = 50 * this.combo;
    this.score += pts;
    if (this.score > this.highScore) this.highScore = this.score;

    if (window.soundManager) window.soundManager.playGolden();
    if (window.particleSystem) {
      const px = (this.goldenFood.x + 0.5) * this.cellSize;
      const py = (this.goldenFood.y + 0.5) * this.cellSize;
      window.particleSystem.emitGolden(px, py);
    }

    this.goldenFood = null;
  }

  consumePowerUp() {
    const type = this.powerUp.type;
    this.powerUpsCollected++;
    this.score += 25 * this.combo;

    const duration = type === 'slow' || type === 'ghost' || type === 'speed' ? 7.0 : 8.0;
    this.activePowerUp = {
      type,
      duration,
      maxDuration: duration
    };

    if (type === 'shrink') {
      // Instantly remove 4 segments (min length 3)
      const toRemove = Math.min(4, Math.max(0, this.snake.length - 3));
      for (let i = 0; i < toRemove; i++) {
        this.snake.pop();
      }
      this.activePowerUp = null; // Instant effect
    }

    if (window.soundManager) window.soundManager.playPowerUp();
    if (window.particleSystem) {
      const px = (this.powerUp.x + 0.5) * this.cellSize;
      const py = (this.powerUp.y + 0.5) * this.cellSize;
      window.particleSystem.emitPowerUp(px, py, '#a855f7');
    }

    this.powerUp = null;
  }

  gameOver(reason = 'Game Over!') {
    this.state = 'GAMEOVER';
    if (window.soundManager) window.soundManager.playDie();

    const head = this.snake[0];
    const px = (head.x + 0.5) * this.cellSize;
    const py = (head.y + 0.5) * this.cellSize;

    if (window.particleSystem) {
      const segments = this.snake.map(s => ({
        px: (s.x + 0.5) * this.cellSize,
        py: (s.y + 0.5) * this.cellSize
      }));
      window.particleSystem.emitDeath(px, py, segments);
    }

    if (window.app) {
      window.app.onGameOver(reason, {
        score: this.score,
        length: this.snake.length,
        foodEaten: this.foodEaten,
        goldenEaten: this.goldenEaten,
        powerUps: this.powerUpsCollected
      });
    }
  }

  update(deltaTime) {
    if (this.state === 'PLAYING') {
      // Time Attack countdown
      if (this.mode === 'timeattack') {
        this.timeAttackRemaining -= deltaTime;
        if (this.timeAttackRemaining <= 0) {
          this.timeAttackRemaining = 0;
          this.gameOver('Time limit reached! Outstanding performance!');
          return;
        }
      }

      // Combo countdown
      if (this.comboTimer > 0) {
        this.comboTimer -= deltaTime;
        if (this.comboTimer <= 0) {
          this.combo = 1;
        }
      }

      // Golden food expiration timer
      if (this.goldenFood) {
        this.goldenFood.timer -= deltaTime;
        if (this.goldenFood.timer <= 0) {
          this.goldenFood = null;
        }
      }

      // Power-up pick-up countdown
      if (this.powerUp) {
        this.powerUp.timer -= deltaTime;
        if (this.powerUp.timer <= 0) {
          this.powerUp = null;
        }
      }

      // Active power-up duration timer
      if (this.activePowerUp) {
        this.activePowerUp.duration -= deltaTime;
        if (this.activePowerUp.duration <= 0) {
          if (window.soundManager) window.soundManager.playPowerExpire();
          this.activePowerUp = null;
        }
      }

      // Trail particle
      if (window.particleSystem && this.snake.length > 0) {
        const head = this.snake[0];
        const hx = (head.x + 0.5) * this.cellSize;
        const hy = (head.y + 0.5) * this.cellSize;
        const trailColor = this.activePowerUp && this.activePowerUp.type === 'ghost' 
          ? '#c084fc' 
          : this.theme === 'synthwave' ? '#f43f5e' : '#22c55e';
        window.particleSystem.emitTrail(hx, hy, trailColor);
      }
    }

    if (window.particleSystem) {
      window.particleSystem.update();
    }
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Get theme colors
    const colors = this.getThemeColors();

    // Draw grid background
    this.drawGrid(ctx, colors);

    // Draw Portals
    this.drawPortals(ctx);

    // Draw Obstacles
    this.drawObstacles(ctx, colors);

    // Draw Food items
    this.drawItems(ctx);

    // Draw Snake
    this.drawSnake(ctx, colors);

    // Draw Particles
    if (window.particleSystem) {
      window.particleSystem.draw(ctx);
    }
  }

  getThemeColors() {
    switch (this.theme) {
      case 'synthwave':
        return {
          grid: 'rgba(236, 72, 153, 0.08)',
          gridLine: 'rgba(236, 72, 153, 0.15)',
          wall: '#ec4899',
          wallGlow: 'rgba(236, 72, 153, 0.4)',
          head: '#fb7185',
          headGlow: '#f43f5e',
          body1: '#d946ef',
          body2: '#8b5cf6',
          eye: '#ffffff'
        };
      case 'crt':
        return {
          grid: 'rgba(34, 197, 94, 0.07)',
          gridLine: 'rgba(34, 197, 94, 0.2)',
          wall: '#22c55e',
          wallGlow: 'rgba(34, 197, 94, 0.35)',
          head: '#86efac',
          headGlow: '#22c55e',
          body1: '#4ade80',
          body2: '#16a34a',
          eye: '#052e16'
        };
      case 'ember':
        return {
          grid: 'rgba(249, 115, 22, 0.07)',
          gridLine: 'rgba(249, 115, 22, 0.15)',
          wall: '#ea580c',
          wallGlow: 'rgba(234, 88, 12, 0.4)',
          head: '#fed7aa',
          headGlow: '#f97316',
          body1: '#f97316',
          body2: '#c2410c',
          eye: '#431407'
        };
      case 'neon':
      default:
        return {
          grid: 'rgba(6, 182, 212, 0.06)',
          gridLine: 'rgba(6, 182, 212, 0.12)',
          wall: '#06b6d4',
          wallGlow: 'rgba(6, 182, 212, 0.35)',
          head: '#67e8f9',
          headGlow: '#22c55e',
          body1: '#22c55e',
          body2: '#06b6d4',
          eye: '#083344'
        };
    }
  }

  drawGrid(ctx, colors) {
    const cs = this.cellSize;
    const gw = this.gridWidth;
    const gh = this.gridHeight;

    ctx.save();
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1;

    // Outer boundary border
    if (this.wallsSolid) {
      ctx.save();
      ctx.strokeStyle = colors.wall;
      ctx.shadowColor = colors.wallGlow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, gw * cs - 2, gh * cs - 2);
      ctx.restore();
    } else {
      // Infinity Wrap Arena - subtle dashed border indicating open wrap-around perimeter
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(0.5, 0.5, gw * cs - 1, gh * cs - 1);
      ctx.restore();
    }

    // Subtle inner grid dots or lines
    ctx.beginPath();
    for (let x = 0; x <= gw; x++) {
      ctx.moveTo(x * cs + 0.5, 0);
      ctx.lineTo(x * cs + 0.5, gh * cs);
    }
    for (let y = 0; y <= gh; y++) {
      ctx.moveTo(0, y * cs + 0.5);
      ctx.lineTo(gw * cs, y * cs + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawPortals(ctx) {
    const cs = this.cellSize;
    const now = performance.now() * 0.004;

    for (const portal of this.portals) {
      const cx = (portal.x + 0.5) * cs;
      const cy = (portal.y + 0.5) * cs;
      const r = cs * 0.42;

      ctx.save();
      ctx.shadowColor = portal.color;
      ctx.shadowBlur = 12;

      // Rotating portal ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();

      ctx.strokeStyle = portal.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner spiral pulse
      ctx.beginPath();
      ctx.arc(cx, cy, r * (0.5 + 0.3 * Math.sin(now)), 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  drawObstacles(ctx, colors) {
    const cs = this.cellSize;
    ctx.save();

    for (const obs of this.obstacles) {
      const x = obs.x * cs;
      const y = obs.y * cs;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

      ctx.strokeStyle = colors.wall;
      ctx.shadowColor = colors.wallGlow;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);

      // Cyber cross in center of obstacle
      ctx.strokeStyle = colors.wallGlow;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + cs - 4, y + cs - 4);
      ctx.moveTo(x + cs - 4, y + 4);
      ctx.lineTo(x + 4, y + cs - 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawItems(ctx) {
    const cs = this.cellSize;
    const now = performance.now();

    // Normal Food (Neon Apple)
    if (this.food) {
      const cx = (this.food.x + 0.5) * cs;
      const cy = (this.food.y + 0.5) * cs;
      const pulse = 1 + 0.08 * Math.sin(now * 0.008);
      const r = cs * 0.36 * pulse;

      ctx.save();
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 14;

      // Glow circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.fill();

      // Gloss reflection
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();

      // Stem/leaf
      ctx.fillStyle = '#15803d';
      ctx.fillRect(cx - 1, cy - r - 3, 2, 4);

      ctx.restore();
    }

    // Golden Star Food
    if (this.goldenFood) {
      const cx = (this.goldenFood.x + 0.5) * cs;
      const cy = (this.goldenFood.y + 0.5) * cs;
      const r = cs * 0.4;
      const progress = this.goldenFood.timer / this.goldenFood.maxTimer;

      ctx.save();
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 18;

      // Circular countdown timer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Golden orb body
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, r);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#eab308');
      grad.addColorStop(1, '#a16207');
      ctx.fillStyle = grad;
      ctx.fill();

      // Center star icon
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.floor(cs * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', cx, cy + 1);

      ctx.restore();
    }

    // Power-Up item
    if (this.powerUp) {
      const cx = (this.powerUp.x + 0.5) * cs;
      const cy = (this.powerUp.y + 0.5) * cs;
      const r = cs * 0.38;
      const progress = this.powerUp.timer / this.powerUp.maxTimer;

      let icon = '⚡';
      let color = '#a855f7';
      if (this.powerUp.type === 'ghost') { icon = '👻'; color = '#c084fc'; }
      else if (this.powerUp.type === 'slow') { icon = '❄️'; color = '#38bdf8'; }
      else if (this.powerUp.type === 'magnet') { icon = '🧲'; color = '#facc15'; }
      else if (this.powerUp.type === 'shrink') { icon = '💊'; color = '#f97316'; }
      else if (this.powerUp.type === 'speed') { icon = '⚡'; color = '#eab308'; }

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;

      // Timer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Capsule background
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 15, 35, 0.9)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Emoji icon
      ctx.font = `${Math.floor(cs * 0.52)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, cx, cy + 1);

      ctx.restore();
    }
  }

  drawSnake(ctx, colors) {
    if (this.snake.length === 0) return;

    const cs = this.cellSize;
    const gw = this.gridWidth;
    const gh = this.gridHeight;
    const totalW = gw * cs;
    const totalH = gh * cs;
    const isGhost = this.activePowerUp && this.activePowerUp.type === 'ghost';
    const canWrap = !this.wallsSolid || isGhost;
    const interp = Math.min(Math.max(this.interpolation, 0), 1);

    ctx.save();
    // Clip to playing area so segments entering walls are cleanly clipped at borders
    ctx.beginPath();
    ctx.rect(0, 0, totalW, totalH);
    ctx.clip();

    // Helper to calculate render position(s) with smooth boundary wrapping
    const getSegmentPositions = (seg) => {
      let dx = seg.x - seg.prevX;
      let dy = seg.y - seg.prevY;
      let dirX = dx;
      let dirY = dy;

      if (dx === 1 - gw) dirX = 1;        // Wrapped right-to-left
      else if (dx === gw - 1) dirX = -1;  // Wrapped left-to-right

      if (dy === 1 - gh) dirY = 1;        // Wrapped bottom-to-top
      else if (dy === gh - 1) dirY = -1;  // Wrapped top-to-bottom

      const isWrapping = canWrap && (dx !== dirX || dy !== dirY);

      if (!isWrapping) {
        return [{
          x: (seg.prevX + dirX * interp + 0.5) * cs,
          y: (seg.prevY + dirY * interp + 0.5) * cs
        }];
      }

      // 1. Exiting the boundary wall: smoothly continuing forward into the wall
      const posA_x = (seg.prevX + dirX * interp + 0.5) * cs;
      const posA_y = (seg.prevY + dirY * interp + 0.5) * cs;

      // 2. Emerging from the opposing boundary wall: smoothly continuing forward into the board
      const posB_x = (seg.x - dirX * (1 - interp) + 0.5) * cs;
      const posB_y = (seg.y - dirY * (1 - interp) + 0.5) * cs;

      return [
        { x: posA_x, y: posA_y },
        { x: posB_x, y: posB_y }
      ];
    };

    // Body segments (draw back-to-front so head is on top)
    for (let i = this.snake.length - 1; i >= 1; i--) {
      const seg = this.snake[i];
      const ratio = 1 - (i / this.snake.length) * 0.35;
      const r = cs * 0.4 * ratio;
      const positions = getSegmentPositions(seg);

      for (const pos of positions) {
        ctx.save();
        const renderX = pos.x;
        const renderY = pos.y;

        if (isGhost) {
          ctx.globalAlpha = 0.5 + 0.2 * Math.sin(performance.now() * 0.01 + i);
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#a855f7';
        } else {
          ctx.shadowColor = i % 2 === 0 ? colors.body1 : colors.body2;
          ctx.shadowBlur = i < 4 ? 10 : 4;
          ctx.fillStyle = i % 2 === 0 ? colors.body1 : colors.body2;
        }

        ctx.beginPath();
        ctx.arc(renderX, renderY, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner cyber core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(renderX, renderY, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Snake Head
    const head = this.snake[0];
    const headRadius = cs * 0.45;
    const headPositions = getSegmentPositions(head);

    for (const pos of headPositions) {
      const renderHeadX = pos.x;
      const renderHeadY = pos.y;

      ctx.save();
      if (isGhost) {
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#c084fc';
      } else {
        ctx.shadowColor = colors.headGlow;
        ctx.shadowBlur = 18;
        ctx.fillStyle = colors.head;
      }

      // Rounded head base
      ctx.beginPath();
      ctx.arc(renderHeadX, renderHeadY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Eyes facing direction
      const eyeOffset = cs * 0.18;
      const eyeForward = cs * 0.16;
      let eye1X, eye1Y, eye2X, eye2Y;

      if (this.direction.x === 1) { // Moving Right
        eye1X = renderHeadX + eyeForward; eye1Y = renderHeadY - eyeOffset;
        eye2X = renderHeadX + eyeForward; eye2Y = renderHeadY + eyeOffset;
      } else if (this.direction.x === -1) { // Moving Left
        eye1X = renderHeadX - eyeForward; eye1Y = renderHeadY - eyeOffset;
        eye2X = renderHeadX - eyeForward; eye2Y = renderHeadY + eyeOffset;
      } else if (this.direction.y === 1) { // Moving Down
        eye1X = renderHeadX - eyeOffset; eye1Y = renderHeadY + eyeForward;
        eye2X = renderHeadX + eyeOffset; eye2Y = renderHeadY + eyeForward;
      } else { // Moving Up
        eye1X = renderHeadX - eyeOffset; eye1Y = renderHeadY - eyeForward;
        eye2X = renderHeadX + eyeOffset; eye2Y = renderHeadY - eyeForward;
      }

      // Eye whites
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, cs * 0.13, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, cs * 0.13, 0, Math.PI * 2);
      ctx.fill();

      // Eye pupils
      ctx.fillStyle = colors.eye;
      const pupilOffX = this.direction.x * 1.5;
      const pupilOffY = this.direction.y * 1.5;
      ctx.beginPath();
      ctx.arc(eye1X + pupilOffX, eye1Y + pupilOffY, cs * 0.07, 0, Math.PI * 2);
      ctx.arc(eye2X + pupilOffX, eye2Y + pupilOffY, cs * 0.07, 0, Math.PI * 2);
      ctx.fill();

      // Animated flickering cyber tongue
      const tongueFlicker = Math.sin(performance.now() * 0.015);
      if (tongueFlicker > 0.4) {
        const tLen = cs * 0.35 * (tongueFlicker - 0.4) * 1.6;
        const startX = renderHeadX + this.direction.x * headRadius;
        const startY = renderHeadY + this.direction.y * headRadius;
        const endX = startX + this.direction.x * tLen;
        const endY = startY + this.direction.y * tLen;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        // Fork
        if (this.direction.x !== 0) {
          ctx.lineTo(endX + this.direction.x * 3, endY - 3);
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX + this.direction.x * 3, endY + 3);
        } else {
          ctx.lineTo(endX - 3, endY + this.direction.y * 3);
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX + 3, endY + this.direction.y * 3);
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // Animation frame loop
  loop(now) {
    const deltaMs = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const deltaTime = Math.min(deltaMs / 1000, 0.1);

    if (this.state === 'PLAYING') {
      // Step game tick when accumulated time reaches tickInterval
      // Power-up speed modification
      let currentInterval = this.tickInterval;
      if (this.activePowerUp) {
        if (this.activePowerUp.type === 'slow') currentInterval *= 1.55;
        if (this.activePowerUp.type === 'speed') currentInterval *= 0.65;
      }

      const timeSinceTick = now - this.lastTickTime;
      if (timeSinceTick >= currentInterval) {
        this.tick();
        this.lastTickTime = now;
        this.interpolation = 0;
      } else {
        this.interpolation = timeSinceTick / currentInterval;
      }
    }

    this.update(deltaTime);
    this.render();

    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  startLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lastFrameTime = performance.now();
    this.lastTickTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

window.SnakeGame = SnakeGame;
