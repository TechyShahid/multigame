/**
 * Neon Pong — Physics Engine & Collision Detection
 * Robust collision handling with swept detection to prevent ball tunneling,
 * realistic spin impartation, and power-up mechanics.
 */

export const POWERUP_TYPES = {
  EXPAND: { id: 'expand', name: 'Paddle Expand', icon: '📏', color: '#10b981', duration: 12000 },
  SPEED: { id: 'speed', name: 'Fireball', icon: '🔥', color: '#f59e0b', duration: 8000 },
  SLOW: { id: 'slow', name: 'Slow-Mo', icon: '❄️', color: '#06b6d4', duration: 8000 },
  SHIELD: { id: 'shield', name: 'Goal Shield', icon: '🛡️', color: '#8b5cf6', duration: 15000 },
  MULTIBALL: { id: 'multiball', name: 'Multi-Ball', icon: '⚡', color: '#ec4899', duration: 0 }
};

export class Ball {
  constructor(x, y, radius = 9) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.radius = radius;
    this.vx = 0;
    this.vy = 0;
    this.speed = 0;
    this.baseSpeed = 7.5;
    this.maxSpeed = 19;
    this.spin = 0; // vertical curve influence
    this.isFireball = false;
    this.color = '#ffffff';
    this.active = true;
  }

  reset(x, y, serveDirection = 1, baseSpeed = 7.5) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.baseSpeed = baseSpeed;
    this.speed = baseSpeed;
    this.spin = 0;
    this.isFireball = false;
    this.color = '#ffffff';
    this.active = true;

    // Random initial angle between -25 and +25 degrees
    const angle = (Math.random() * 0.8 - 0.4);
    this.vx = Math.cos(angle) * this.speed * serveDirection;
    this.vy = Math.sin(angle) * this.speed;
  }

  update(dt = 1) {
    if (!this.active) return;
    this.prevX = this.x;
    this.prevY = this.y;

    // Apply spin curve
    if (Math.abs(this.spin) > 0.05) {
      this.vy += this.spin * 0.12 * dt;
      this.spin *= 0.985;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

export class Paddle {
  constructor(x, y, width = 14, height = 90, isLeft = true) {
    this.x = x;
    this.y = y;
    this.prevY = y;
    this.width = width;
    this.height = height;
    this.baseHeight = height;
    this.isLeft = isLeft;
    this.vy = 0;
    this.score = 0;
    this.shieldActive = false;
    this.activePowerup = null;
    this.powerupTimer = null;
    this.glowColor = isLeft ? '#06b6d4' : '#ec4899'; // Cyan vs Magenta
  }

  update(courtHeight, targetY, speedLimit = 12) {
    this.prevY = this.y;
    const dy = targetY - this.y;
    const move = Math.sign(dy) * Math.min(Math.abs(dy), speedLimit);
    this.y += move;

    // Clamp inside court boundaries
    const halfH = this.height / 2;
    if (this.y - halfH < 10) this.y = 10 + halfH;
    if (this.y + halfH > courtHeight - 10) this.y = courtHeight - 10 - halfH;

    this.vy = this.y - this.prevY;
  }

  applyPowerup(type) {
    if (type.id === 'expand') {
      this.height = this.baseHeight * 1.4;
      if (this.powerupTimer) clearTimeout(this.powerupTimer);
      this.activePowerup = type;
      this.powerupTimer = setTimeout(() => {
        this.height = this.baseHeight;
        this.activePowerup = null;
      }, type.duration);
    } else if (type.id === 'shield') {
      this.shieldActive = true;
      this.activePowerup = type;
    }
  }

  reset() {
    this.height = this.baseHeight;
    this.shieldActive = false;
    this.activePowerup = null;
    if (this.powerupTimer) {
      clearTimeout(this.powerupTimer);
      this.powerupTimer = null;
    }
  }
}

export class PowerupEntity {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 16;
    this.pulse = 0;
    this.active = true;
    this.life = 12000; // disappears after 12s if uncollected
    this.spawnTime = performance.now();
  }

  update() {
    this.pulse += 0.06;
    if (performance.now() - this.spawnTime > this.life) {
      this.active = false;
    }
  }
}

export class TargetBrick {
  constructor(x, y, width, height, points = 10, color = '#a855f7') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.points = points;
    this.color = color;
    this.active = true;
    this.hitCount = 0;
  }
}

export const PhysicsEngine = {
  // Check continuous ball collision against paddle
  checkPaddleCollision(ball, paddle) {
    if (!ball.active) return false;

    const halfH = paddle.height / 2;
    const halfW = paddle.width / 2;
    const pLeft = paddle.x - halfW;
    const pRight = paddle.x + halfW;
    const pTop = paddle.y - halfH;
    const pBottom = paddle.y + halfH;

    // Determine if ball is moving towards the paddle
    const isMovingTowards = paddle.isLeft ? ball.vx < 0 : ball.vx > 0;
    if (!isMovingTowards) return false;

    // Check overlap with radius margin
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;

    // Swept X-range between frames
    const minX = Math.min(ball.prevX, ball.x) - ball.radius;
    const maxX = Math.max(ball.prevX, ball.x) + ball.radius;

    const xHit = (maxX >= pLeft && minX <= pRight);
    const yHit = (ballBottom >= pTop && ballTop <= pBottom);

    if (xHit && yHit) {
      // Impact point normalized from -1 (top) to +1 (bottom)
      const offset = (ball.y - paddle.y) / (halfH + ball.radius * 0.5);
      const clampedOffset = Math.max(-1, Math.min(1, offset));

      // Max bounce angle = 60 degrees (pi * 0.33)
      const maxAngle = Math.PI * 0.33;
      const angle = clampedOffset * maxAngle;

      // Increase speed slightly with each rally hit
      ball.speed = Math.min(ball.maxSpeed, ball.speed + 0.4);

      const dir = paddle.isLeft ? 1 : -1;
      ball.vx = Math.cos(angle) * ball.speed * dir;
      ball.vy = Math.sin(angle) * ball.speed;

      // Impart spin based on paddle movement
      ball.spin = paddle.vy * 0.28;

      // Reposition ball outside paddle to prevent multi-frame sticking
      if (paddle.isLeft) {
        ball.x = pRight + ball.radius + 1;
      } else {
        ball.x = pLeft - ball.radius - 1;
      }

      return { hit: true, offset: clampedOffset };
    }

    return false;
  },

  // Check top and bottom court walls
  checkWallBounce(ball, courtHeight, margin = 10) {
    let bounced = false;
    const topLimit = margin + ball.radius;
    const bottomLimit = courtHeight - margin - ball.radius;

    if (ball.y <= topLimit) {
      ball.y = topLimit;
      ball.vy = Math.abs(ball.vy);
      bounced = true;
    } else if (ball.y >= bottomLimit) {
      ball.y = bottomLimit;
      ball.vy = -Math.abs(ball.vy);
      bounced = true;
    }

    return bounced;
  },

  // Check power-up collection
  checkPowerupCollision(ball, powerup) {
    if (!powerup.active || !ball.active) return false;
    const dx = ball.x - powerup.x;
    const dy = ball.y - powerup.y;
    const distSq = dx * dx + dy * dy;
    const combinedRadius = ball.radius + powerup.radius;
    return distSq <= combinedRadius * combinedRadius;
  },

  // Check Target Brick collision in Solo Rally mode
  checkBrickCollision(ball, brick) {
    if (!brick.active || !ball.active) return false;

    const bLeft = brick.x - brick.width / 2;
    const bRight = brick.x + brick.width / 2;
    const bTop = brick.y - brick.height / 2;
    const bBottom = brick.y + brick.height / 2;

    const nearestX = Math.max(bLeft, Math.min(ball.x, bRight));
    const nearestY = Math.max(bTop, Math.min(ball.y, bBottom));

    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;

    if (dx * dx + dy * dy <= ball.radius * ball.radius) {
      // Determine collision side
      const overlapLeft = (ball.x + ball.radius) - bLeft;
      const overlapRight = bRight - (ball.x - ball.radius);
      const overlapTop = (ball.y + ball.radius) - bTop;
      const overlapBottom = bBottom - (ball.y - ball.radius);

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        ball.vx = -ball.vx;
      } else {
        ball.vy = -ball.vy;
      }

      return true;
    }

    return false;
  }
};
