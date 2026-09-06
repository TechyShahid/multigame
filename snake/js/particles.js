/**
 * Neon Snake - Particle Effects Engine
 * High performance, canvas-based particle bursts, spark trails, and crash explosions.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  clear() {
    this.particles = [];
  }

  // Generic burst
  emitBurst(x, y, color = '#22c55e', count = 18, speed = 4, size = 3) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const vel = (0.5 + Math.random() * 0.8) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        color,
        size: (0.7 + Math.random() * 0.6) * size,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.025,
        type: 'circle'
      });
    }
  }

  // Golden starburst
  emitGolden(x, y) {
    const colors = ['#facc15', '#fef08a', '#fbbf24', '#ffffff'];
    for (let i = 0; i < 26; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3.5,
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
        type: 'sparkle'
      });
    }
  }

  // Power-up activation shockwave particles
  emitPowerUp(x, y, color = '#a855f7') {
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 2.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.5 + Math.random() * 2,
        alpha: 1.0,
        decay: 0.022 + Math.random() * 0.015,
        type: 'circle'
      });
    }
  }

  // Snake death explosion
  emitDeath(x, y, bodySegments = [], color = '#ef4444') {
    // Primary head burst
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1.0,
        decay: 0.012 + Math.random() * 0.018,
        type: 'shatter'
      });
    }

    // Body segment shatters
    bodySegments.slice(0, 20).forEach((seg, idx) => {
      const segX = seg.px || x;
      const segY = seg.py || y;
      for (let j = 0; j < 3; j++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        this.particles.push({
          x: segX,
          y: segY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: idx % 2 === 0 ? '#22c55e' : '#10b981',
          size: 2 + Math.random() * 2.5,
          alpha: 1.0,
          decay: 0.02 + Math.random() * 0.02,
          type: 'circle'
        });
      }
    });
  }

  // Trail behind head
  emitTrail(x, y, color = '#22c55e') {
    if (Math.random() > 0.4) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color,
      size: 1.5 + Math.random() * 1.5,
      alpha: 0.6,
      decay: 0.04,
      type: 'circle'
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;
      if (p.rotation !== undefined) {
        p.rotation += p.vRot || 0.1;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (!this.particles.length) return;
    ctx.save();

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'sparkle') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.type === 'shatter') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

window.particleSystem = new ParticleSystem();
