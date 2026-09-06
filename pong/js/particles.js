/**
 * Neon Pong — Particle & Visual FX Engine
 * High performance canvas particle effects for ball trails, spark impacts,
 * shockwaves, and goal celebrations.
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
  }

  reset() {
    this.particles = [];
    this.shockwaves = [];
  }

  // Ball trail dot
  addTrail(x, y, radius, color, alpha = 0.6) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: radius * 0.7,
      maxRadius: radius,
      color,
      alpha,
      decay: 0.045,
      type: 'trail'
    });
  }

  // Paddle hit spark burst
  addSparks(x, y, dirX, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (dirX > 0 ? -0.4 : 0.6) * Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2.5 + 1.5,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        type: 'spark'
      });
    }
  }

  // Wall bounce spark
  addWallSparks(x, y, dirY, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (dirY > 0 ? 0.5 : -0.5) * Math.PI + (Math.random() - 0.5) * Math.PI * 0.7;
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        color,
        alpha: 0.9,
        decay: Math.random() * 0.04 + 0.03,
        type: 'spark'
      });
    }
  }

  // Expanding shockwave ring
  addShockwave(x, y, color, maxRadius = 80) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      color,
      alpha: 0.9,
      decay: 0.03
    });
  }

  // Goal celebration explosion
  addGoalExplosion(x, y, color, count = 45) {
    this.addShockwave(x, y, color, 120);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3.5 + 1.5,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015,
        type: 'confetti'
      });
    }
  }

  // Power-up collection burst
  addPowerupCollect(x, y, color, count = 25) {
    this.addShockwave(x, y, color, 60);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        type: 'spark'
      });
    }
  }

  update(dt = 1) {
    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * 0.15 * dt;
      s.alpha -= s.decay * dt;
      if (s.alpha <= 0 || s.radius >= s.maxRadius * 0.98) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.type === 'trail') {
        p.radius = Math.max(0.2, p.radius - 0.15 * dt);
      }
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0 || p.radius <= 0.2) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Render shockwaves
    for (const s of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(1, s.radius), 0, Math.PI * 2);
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Render particles
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fill();
    }

    ctx.restore();
  }
}
