/**
 * Neon Pong — Core Game Orchestrator & Canvas Renderer
 * Handles game loop, input tracking, physics updates, rendering, and mode logic.
 */

import { SoundEngine } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Ball, Paddle, PowerupEntity, TargetBrick, PhysicsEngine, POWERUP_TYPES } from './physics.js';
import { AIOpponent } from './ai.js';

export const GAME_MODES = {
  PVP_AI: '1p',
  PVP_LOCAL: '2p',
  SOLO_RALLY: 'rally'
};

export const THEMES = {
  neon: {
    id: 'neon',
    name: 'Cyberpunk Neon',
    bgCourt: '#0b0c16',
    gridColor: 'rgba(99, 102, 241, 0.08)',
    centerLine: 'rgba(255, 255, 255, 0.15)',
    paddleLeft: '#06b6d4',
    paddleRight: '#ec4899',
    ballColor: '#f0eaff',
    ballGlow: '#a855f7',
    wallColor: '#6366f1'
  },
  synthwave: {
    id: 'synthwave',
    name: 'Synthwave Sunset',
    bgCourt: '#180e29',
    gridColor: 'rgba(244, 63, 94, 0.1)',
    centerLine: 'rgba(251, 146, 60, 0.25)',
    paddleLeft: '#f43f5e',
    paddleRight: '#f59e0b',
    ballColor: '#fffbeb',
    ballGlow: '#f43f5e',
    wallColor: '#c084fc'
  },
  crt: {
    id: 'crt',
    name: '1972 CRT Green',
    bgCourt: '#08140b',
    gridColor: 'rgba(34, 197, 94, 0.05)',
    centerLine: 'rgba(34, 197, 94, 0.3)',
    paddleLeft: '#22c55e',
    paddleRight: '#4ade80',
    ballColor: '#bbf7d0',
    ballGlow: '#22c55e',
    wallColor: '#15803d'
  },
  electric: {
    id: 'electric',
    name: 'Electric Blue',
    bgCourt: '#061325',
    gridColor: 'rgba(56, 189, 248, 0.08)',
    centerLine: 'rgba(56, 189, 248, 0.2)',
    paddleLeft: '#38bdf8',
    paddleRight: '#818cf8',
    ballColor: '#e0f2fe',
    ballGlow: '#0284c7',
    wallColor: '#0369a1'
  }
};

export class PongGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Logical dimensions (fixed 1000 x 600 virtual court for crisp scaling)
    this.courtWidth = 1000;
    this.courtHeight = 600;

    // Game configuration
    this.mode = GAME_MODES.PVP_AI;
    this.targetScore = 7;
    this.powerupsEnabled = true;
    this.theme = THEMES.neon;

    // State machine: 'idle', 'countdown', 'playing', 'scored', 'paused', 'gameover'
    this.state = 'idle';
    this.countdownValue = 3;
    this.countdownTimer = null;

    // Entities
    this.paddleLeft = new Paddle(40, this.courtHeight / 2, 16, 95, true);
    this.paddleRight = new Paddle(this.courtWidth - 40, this.courtHeight / 2, 16, 95, false);
    this.balls = [new Ball(this.courtWidth / 2, this.courtHeight / 2)];
    this.powerups = [];
    this.bricks = []; // For Solo Rally mode
    this.ai = new AIOpponent('pro');
    this.particles = new ParticleSystem();

    // Match statistics
    this.rally = 0;
    this.maxRally = 0;
    this.rallyPoints = 0; // for Solo Rally
    this.rallyLives = 3;
    this.topBallSpeed = 0;
    this.serveSide = 1; // 1 = Left serves to Right, -1 = Right serves to Left

    // Visual FX
    this.screenShake = 0;
    this.streakBanner = '';
    this.streakBannerTimer = 0;

    // Input state
    this.keys = {};
    this.mouseY = this.courtHeight / 2;
    this.mouseActive = false;
    this.touchP1Y = null;
    this.touchP2Y = null;

    // Time tracking
    this.lastTime = performance.now();
    this.powerupSpawnTimer = 0;

    // Callbacks
    this.onStateChange = null;
    this.onScoreUpdate = null;

    this.setupListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  setTheme(themeKey) {
    if (THEMES[themeKey]) {
      this.theme = THEMES[themeKey];
      this.paddleLeft.glowColor = this.theme.paddleLeft;
      this.paddleRight.glowColor = this.theme.paddleRight;
    }
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const containerW = parent.clientWidth;
    const containerH = parent.clientHeight;

    // Maintain 16:9 or 5:3 aspect ratio
    const aspect = this.courtWidth / this.courtHeight;
    let w = containerW;
    let h = containerW / aspect;

    if (h > containerH) {
      h = containerH;
      w = containerH * aspect;
    }

    // Set display size
    this.canvas.style.width = `${Math.floor(w)}px`;
    this.canvas.style.height = `${Math.floor(h)}px`;

    // Internal buffer size (high-DPI support)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.courtWidth * dpr);
    this.canvas.height = Math.floor(this.courtHeight * dpr);
    this.ctx.scale(dpr, dpr);
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Space / Enter serving or resume
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.state === 'idle') {
          this.startCountdown();
        } else if (this.state === 'paused') {
          this.resume();
        }
      }

      // Pause toggle
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'playing') {
          this.pause();
        } else if (this.state === 'paused') {
          this.resume();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse movement
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = this.courtHeight / rect.height;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      this.mouseActive = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseActive = false;
    });

    // Touch controls
    const handleTouch = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.courtWidth / rect.width;
      const scaleY = this.courtHeight / rect.height;

      let p1 = null;
      let p2 = null;

      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const tx = (t.clientX - rect.left) * scaleX;
        const ty = (t.clientY - rect.top) * scaleY;

        if (this.mode === GAME_MODES.PVP_LOCAL) {
          if (tx < this.courtWidth / 2) {
            p1 = ty;
          } else {
            p2 = ty;
          }
        } else {
          // In 1P or Rally mode, touching anywhere controls P1
          p1 = ty;
        }
      }

      this.touchP1Y = p1;
      this.touchP2Y = p2;
    };

    const container = this.canvas.parentElement || this.canvas;
    container.addEventListener('touchstart', (e) => {
      // Don't capture touches on buttons/modals
      if (e.target.closest('.modal-card') || e.target.closest('button') || e.target.closest('select')) return;
      e.preventDefault();
      handleTouch(e);
      if (this.state === 'idle') {
        this.startCountdown();
      }
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
      if (e.target.closest('.modal-card') || e.target.closest('button') || e.target.closest('select')) return;
      e.preventDefault();
      handleTouch(e);
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
      if (e.target.closest('.modal-card') || e.target.closest('button') || e.target.closest('select')) return;
      e.preventDefault();
      handleTouch(e);
    }, { passive: false });
  }

  setPaddleNormalizedY(isLeft, ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const targetY = 35 + clamped * (this.courtHeight - 70);
    if (isLeft) {
      this.touchP1Y = targetY;
    } else {
      this.touchP2Y = targetY;
    }
  }

  movePaddleStep(isLeft, dir) {
    const step = 32;
    if (isLeft) {
      const cur = this.touchP1Y !== null ? this.touchP1Y : this.paddleLeft.y;
      this.touchP1Y = Math.max(40, Math.min(this.courtHeight - 40, cur + dir * step));
    } else {
      const cur = this.touchP2Y !== null ? this.touchP2Y : this.paddleRight.y;
      this.touchP2Y = Math.max(40, Math.min(this.courtHeight - 40, cur + dir * step));
    }
  }

  startMatch(mode, difficulty = 'pro', targetScore = 7, powerups = true) {
    this.mode = mode;
    this.ai.setProfile(difficulty);
    this.targetScore = targetScore;
    this.powerupsEnabled = powerups;

    // Reset scores & entities
    this.paddleLeft.reset();
    this.paddleRight.reset();
    this.paddleLeft.score = 0;
    this.paddleRight.score = 0;
    this.paddleLeft.y = this.courtHeight / 2;
    this.paddleRight.y = this.courtHeight / 2;

    this.rally = 0;
    this.maxRally = 0;
    this.rallyPoints = 0;
    this.rallyLives = 3;
    this.topBallSpeed = 0;
    this.powerups = [];
    this.powerupSpawnTimer = 0;
    this.particles.reset();

    // Setup Solo Rally bricks if active
    if (this.mode === GAME_MODES.SOLO_RALLY) {
      this.setupRallyArena();
    } else {
      this.bricks = [];
    }

    this.startCountdown();
  }

  setupRallyArena() {
    this.bricks = [];
    const colors = ['#f43f5e', '#a855f7', '#06b6d4', '#10b981', '#f59e0b'];
    // 3 columns of bouncy target bricks along the right zone
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 6; row++) {
        const x = this.courtWidth - 140 + col * 45;
        const y = 80 + row * 85;
        const color = colors[(col + row) % colors.length];
        this.bricks.push(new TargetBrick(x, y, 22, 55, (col + 1) * 25, color));
      }
    }
  }

  startCountdown() {
    this.state = 'countdown';
    this.countdownValue = 3;
    SoundEngine.playCountdown(false);

    if (this.onStateChange) this.onStateChange(this.state);

    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue > 0) {
        SoundEngine.playCountdown(false);
      } else if (this.countdownValue === 0) {
        SoundEngine.playCountdown(true);
      } else {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.serveBall();
      }
    }, 700);
  }

  serveBall() {
    this.state = 'playing';
    this.rally = 0;
    this.balls = [new Ball(this.courtWidth / 2, this.courtHeight / 2)];

    const ball = this.balls[0];
    const dir = this.mode === GAME_MODES.SOLO_RALLY ? 1 : this.serveSide;
    ball.reset(this.courtWidth / 2, this.courtHeight / 2, dir, 7.5);

    if (this.onStateChange) this.onStateChange(this.state);
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.lastTime = performance.now();
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  handleInputs() {
    // Left Paddle target
    let targetLeftY = this.paddleLeft.y;
    const speed = 12;

    if (this.touchP1Y !== null) {
      targetLeftY = this.touchP1Y;
    } else if (this.mouseActive && this.mode !== GAME_MODES.PVP_LOCAL) {
      targetLeftY = this.mouseY;
    } else {
      if (this.keys['KeyW'] || (this.mode !== GAME_MODES.PVP_LOCAL && this.keys['ArrowUp'])) {
        targetLeftY -= speed;
      }
      if (this.keys['KeyS'] || (this.mode !== GAME_MODES.PVP_LOCAL && this.keys['ArrowDown'])) {
        targetLeftY += speed;
      }
    }
    this.paddleLeft.update(this.courtHeight, targetLeftY, 15);

    // Right Paddle (Local 2P or AI)
    if (this.mode === GAME_MODES.PVP_LOCAL) {
      let targetRightY = this.paddleRight.y;
      if (this.touchP2Y !== null) {
        targetRightY = this.touchP2Y;
      } else {
        if (this.keys['ArrowUp']) targetRightY -= speed;
        if (this.keys['ArrowDown']) targetRightY += speed;
      }
      this.paddleRight.update(this.courtHeight, targetRightY, 15);
    } else if (this.mode === GAME_MODES.PVP_AI) {
      // AI computes target
      const primaryBall = this.balls[0];
      if (primaryBall) {
        const targetAIY = this.ai.computeTargetY(
          primaryBall,
          this.paddleRight,
          this.courtWidth,
          this.courtHeight,
          performance.now()
        );
        this.paddleRight.update(this.courtHeight, targetAIY, this.ai.profile.speed);
      }
    }
  }

  spawnPowerup() {
    const types = Object.values(POWERUP_TYPES);
    const chosen = types[Math.floor(Math.random() * types.length)];
    // Random position in central 50% court zone
    const x = this.courtWidth * 0.28 + Math.random() * (this.courtWidth * 0.44);
    const y = 80 + Math.random() * (this.courtHeight - 160);

    this.powerups.push(new PowerupEntity(x, y, chosen));
    SoundEngine.playPowerupSpawn();
    this.particles.addShockwave(x, y, chosen.color, 45);
  }

  update(dt = 1) {
    if (this.state !== 'playing') {
      this.particles.update(dt);
      return;
    }

    this.handleInputs();

    // Powerup Spawning
    if (this.powerupsEnabled && this.mode !== GAME_MODES.SOLO_RALLY) {
      this.powerupSpawnTimer += dt;
      if (this.powerupSpawnTimer > 650 && this.powerups.length < 2) {
        this.spawnPowerup();
        this.powerupSpawnTimer = 0;
      }
    }

    // Update powerup entities
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pup = this.powerups[i];
      pup.update();
      if (!pup.active) this.powerups.splice(i, 1);
    }

    // Update Balls
    for (let bIndex = this.balls.length - 1; bIndex >= 0; bIndex--) {
      const ball = this.balls[bIndex];
      ball.update(dt);

      // Track top speed
      if (ball.speed > this.topBallSpeed) {
        this.topBallSpeed = Math.round(ball.speed * 10) / 10;
      }

      // Trail particles
      const trailColor = ball.isFireball ? '#f59e0b' : this.theme.ballGlow;
      this.particles.addTrail(ball.x, ball.y, ball.radius, trailColor, 0.45);

      // Court Wall bounce
      if (PhysicsEngine.checkWallBounce(ball, this.courtHeight, 10)) {
        SoundEngine.playWallBounce();
        this.particles.addWallSparks(ball.x, ball.y, ball.vy > 0 ? 1 : -1, this.theme.wallColor);
      }

      // Check Left Paddle Collision
      const leftCol = PhysicsEngine.checkPaddleCollision(ball, this.paddleLeft);
      if (leftCol && leftCol.hit) {
        this.rally++;
        if (this.rally > this.maxRally) this.maxRally = this.rally;
        SoundEngine.playPaddleHit(this.rally);
        this.particles.addSparks(ball.x, ball.y, 1, this.paddleLeft.glowColor, 18);
        this.triggerRallyCallout();

        if (this.mode === GAME_MODES.SOLO_RALLY) {
          this.rallyPoints += 10 * this.rally;
          if (this.onScoreUpdate) this.onScoreUpdate();
        }
      }

      // Check Right Paddle Collision (in 1P or 2P)
      if (this.mode !== GAME_MODES.SOLO_RALLY) {
        const rightCol = PhysicsEngine.checkPaddleCollision(ball, this.paddleRight);
        if (rightCol && rightCol.hit) {
          this.rally++;
          if (this.rally > this.maxRally) this.maxRally = this.rally;
          SoundEngine.playPaddleHit(this.rally);
          this.particles.addSparks(ball.x, ball.y, -1, this.paddleRight.glowColor, 18);
          this.triggerRallyCallout();
        }
      } else {
        // Solo Rally right bounce wall
        if (ball.x >= this.courtWidth - 15 - ball.radius) {
          ball.x = this.courtWidth - 15 - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          SoundEngine.playWallBounce();
          this.particles.addWallSparks(ball.x, ball.y, 0, '#ec4899', 12);
        }

        // Check target bricks
        for (const brick of this.bricks) {
          if (brick.active && PhysicsEngine.checkBrickCollision(ball, brick)) {
            brick.hitCount++;
            brick.active = false;
            this.rallyPoints += brick.points;
            SoundEngine.playPowerupCollect();
            this.particles.addGoalExplosion(brick.x, brick.y, brick.color, 16);
            if (this.onScoreUpdate) this.onScoreUpdate();

            // Respawn all if all cleared
            if (this.bricks.every(b => !b.active)) {
              setTimeout(() => this.setupRallyArena(), 500);
            }
            break;
          }
        }
      }

      // Power-up pickups
      for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
        const pup = this.powerups[pIdx];
        if (PhysicsEngine.checkPowerupCollision(ball, pup)) {
          pup.active = false;
          SoundEngine.playPowerupCollect();
          this.particles.addPowerupCollect(pup.x, pup.y, pup.type.color);

          // Apply to the paddle who last hit the ball
          const recipient = ball.vx > 0 ? this.paddleLeft : this.paddleRight;

          if (pup.type.id === 'speed') {
            ball.isFireball = true;
            ball.speed = Math.min(ball.maxSpeed, ball.speed + 3);
            setTimeout(() => { ball.isFireball = false; }, pup.type.duration);
          } else if (pup.type.id === 'slow') {
            ball.speed = Math.max(ball.baseSpeed, ball.speed * 0.65);
          } else if (pup.type.id === 'multiball') {
            const extra = new Ball(ball.x, ball.y);
            extra.reset(ball.x, ball.y, -Math.sign(ball.vx), ball.speed);
            this.balls.push(extra);
          } else {
            recipient.applyPowerup(pup.type);
          }

          this.powerups.splice(pIdx, 1);
        }
      }

      // Goal scoring check
      if (ball.x < -20) {
        // Scored on Left
        if (this.paddleLeft.shieldActive) {
          this.paddleLeft.shieldActive = false;
          ball.x = 25;
          ball.vx = Math.abs(ball.vx);
          SoundEngine.playWallBounce();
          this.particles.addShockwave(20, ball.y, '#8b5cf6', 70);
        } else {
          this.handleGoal(false, bIndex);
        }
      } else if (ball.x > this.courtWidth + 20 && this.mode !== GAME_MODES.SOLO_RALLY) {
        // Scored on Right
        if (this.paddleRight.shieldActive) {
          this.paddleRight.shieldActive = false;
          ball.x = this.courtWidth - 25;
          ball.vx = -Math.abs(ball.vx);
          SoundEngine.playWallBounce();
          this.particles.addShockwave(this.courtWidth - 20, ball.y, '#8b5cf6', 70);
        } else {
          this.handleGoal(true, bIndex);
        }
      }
    }

    // Decay streak banner
    if (this.streakBannerTimer > 0) {
      this.streakBannerTimer -= dt;
      if (this.streakBannerTimer <= 0) this.streakBanner = '';
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    this.particles.update(dt);
  }

  triggerRallyCallout() {
    if (this.rally === 5) {
      this.streakBanner = '🔥 5 RALLY STREAK!';
      this.streakBannerTimer = 90;
    } else if (this.rally === 10) {
      this.streakBanner = '⚡ SUPER CHARGE (10)!';
      this.streakBannerTimer = 90;
      this.screenShake = 4;
    } else if (this.rally === 15) {
      this.streakBanner = '💥 HYPER SPEED (15)!';
      this.streakBannerTimer = 100;
      this.screenShake = 6;
    } else if (this.rally === 20) {
      this.streakBanner = '👑 UNSTOPPABLE (20)!';
      this.streakBannerTimer = 120;
      this.screenShake = 8;
    }
  }

  handleGoal(scoredByLeft, ballIndex) {
    // If multi-ball, only end point if last ball drops
    if (this.balls.length > 1) {
      this.balls.splice(ballIndex, 1);
      return;
    }

    this.state = 'scored';
    SoundEngine.playScore();
    this.screenShake = 12;

    if (this.mode === GAME_MODES.SOLO_RALLY) {
      this.rallyLives--;
      this.particles.addGoalExplosion(30, this.courtHeight / 2, '#f43f5e', 45);
      if (this.onScoreUpdate) this.onScoreUpdate();

      if (this.rallyLives <= 0) {
        this.endMatch('gameover');
      } else {
        setTimeout(() => this.serveBall(), 1000);
      }
      return;
    }

    if (scoredByLeft) {
      this.paddleLeft.score++;
      this.serveSide = -1; // Loser serves
      this.particles.addGoalExplosion(this.courtWidth - 20, this.courtHeight / 2, this.paddleLeft.glowColor, 50);
    } else {
      this.paddleRight.score++;
      this.serveSide = 1;
      this.particles.addGoalExplosion(20, this.courtHeight / 2, this.paddleRight.glowColor, 50);
    }

    if (this.onScoreUpdate) this.onScoreUpdate();

    // Check match victory
    if (this.paddleLeft.score >= this.targetScore) {
      this.endMatch('p1');
    } else if (this.paddleRight.score >= this.targetScore) {
      this.endMatch('p2');
    } else {
      setTimeout(() => this.serveBall(), 1200);
    }
  }

  endMatch(winner) {
    this.state = 'gameover';
    this.winner = winner;

    if (winner === 'p1' || (winner === 'gameover' && this.rallyPoints > 500)) {
      SoundEngine.playWin();
    } else {
      SoundEngine.playLose();
    }

    // Save statistics to localStorage
    this.saveMatchStats();

    if (this.onStateChange) this.onStateChange(this.state);
  }

  saveMatchStats() {
    try {
      const stats = JSON.parse(localStorage.getItem('pong_stats') || '{}');
      stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
      stats.bestRally = Math.max(stats.bestRally || 0, this.maxRally);
      stats.topSpeed = Math.max(stats.topSpeed || 0, this.topBallSpeed);

      if (this.mode === GAME_MODES.SOLO_RALLY) {
        stats.highScoreRally = Math.max(stats.highScoreRally || 0, this.rallyPoints);
      } else if (this.winner === 'p1') {
        stats.winsP1 = (stats.winsP1 || 0) + 1;
      }
      localStorage.setItem('pong_stats', JSON.stringify(stats));
    } catch (_) {}
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Apply screen shake
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // Clear background
    ctx.fillStyle = this.theme.bgCourt;
    ctx.fillRect(0, 0, this.courtWidth, this.courtHeight);

    // Draw Subtle Grid Pattern
    ctx.strokeStyle = this.theme.gridColor;
    ctx.lineWidth = 1;
    const gridSize = 40;
    ctx.beginPath();
    for (let x = 0; x <= this.courtWidth; x += gridSize) {
      ctx.moveTo(x, 0); ctx.lineTo(x, this.courtHeight);
    }
    for (let y = 0; y <= this.courtHeight; y += gridSize) {
      ctx.moveTo(0, y); ctx.lineTo(this.courtWidth, y);
    }
    ctx.stroke();

    // Draw Upper & Lower Neon Boundaries
    ctx.strokeStyle = this.theme.wallColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = this.theme.wallColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.lineTo(this.courtWidth, 8);
    ctx.moveTo(0, this.courtHeight - 8); ctx.lineTo(this.courtWidth, this.courtHeight - 8);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center dashed divider
    if (this.mode !== GAME_MODES.SOLO_RALLY) {
      ctx.strokeStyle = this.theme.centerLine;
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 14]);
      ctx.beginPath();
      ctx.moveTo(this.courtWidth / 2, 12);
      ctx.lineTo(this.courtWidth / 2, this.courtHeight - 12);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Solo rally right energy barrier
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(this.courtWidth - 12, 12);
      ctx.lineTo(this.courtWidth - 12, this.courtHeight - 12);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Render Rally Target Bricks
    for (const b of this.bricks) {
      if (!b.active) continue;
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height, 6);
      ctx.fill();
      ctx.restore();
    }

    // Render Power-ups
    for (const pup of this.powerups) {
      ctx.save();
      ctx.shadowColor = pup.type.color;
      ctx.shadowBlur = 14 + Math.sin(pup.pulse) * 6;
      ctx.fillStyle = pup.type.color;

      ctx.beginPath();
      ctx.arc(pup.x, pup.y, pup.radius + Math.sin(pup.pulse) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Power-up icon
      ctx.shadowBlur = 0;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pup.type.icon, pup.x, pup.y + 1);
      ctx.restore();
    }

    // Render Left Paddle
    this.renderPaddle(ctx, this.paddleLeft);

    // Render Right Paddle (in 1P or 2P)
    if (this.mode !== GAME_MODES.SOLO_RALLY) {
      this.renderPaddle(ctx, this.paddleRight);
    }

    // Render Particles & Explosions
    this.particles.render(ctx);

    // Render Balls
    for (const ball of this.balls) {
      if (!ball.active) continue;
      ctx.save();
      const glow = ball.isFireball ? '#f59e0b' : this.theme.ballGlow;
      ctx.shadowColor = glow;
      ctx.shadowBlur = ball.isFireball ? 25 : 16;
      ctx.fillStyle = ball.isFireball ? '#fbbf24' : this.theme.ballColor;

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Streak Callout Banner
    if (this.streakBanner) {
      ctx.save();
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.textAlign = 'center';
      ctx.fillText(this.streakBanner, this.courtWidth / 2, 60);
      ctx.restore();
    }

    // Render Countdown overlay
    if (this.state === 'countdown') {
      ctx.save();
      ctx.font = '800 76px Outfit, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 30;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = this.countdownValue > 0 ? this.countdownValue : 'GO!';
      ctx.fillText(text, this.courtWidth / 2, this.courtHeight / 2);
      ctx.restore();
    }

    ctx.restore();
  }

  renderPaddle(ctx, paddle) {
    ctx.save();
    const halfW = paddle.width / 2;
    const halfH = paddle.height / 2;

    ctx.shadowColor = paddle.glowColor;
    ctx.shadowBlur = 18;
    ctx.fillStyle = paddle.glowColor;

    ctx.beginPath();
    ctx.roundRect(paddle.x - halfW, paddle.y - halfH, paddle.width, paddle.height, 8);
    ctx.fill();

    // Subtle inner glossy core
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.roundRect(paddle.x - halfW + 3, paddle.y - halfH + 4, paddle.width - 6, paddle.height - 8, 4);
    ctx.fill();

    // Shield barrier indicator
    if (paddle.shieldActive) {
      const shieldX = paddle.isLeft ? 12 : this.courtWidth - 12;
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(shieldX, 15);
      ctx.lineTo(shieldX, this.courtHeight - 15);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Loop ticker
  tick(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 16.666, 2.5);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.tick(t));
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }
}
