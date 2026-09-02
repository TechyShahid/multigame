/**
 * Canvas Confetti Particle System
 * High-performance, celebratory victory animation
 */

export class ConfettiCannon {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.particles = [];
    this.animationId = null;
    this.colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fbbf24', '#34d399', '#f87171'];
    
    this.resize = this.resize.bind(this);
    if (this.canvas) {
      window.addEventListener('resize', this.resize);
      this.resize();
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start(durationMs = 4000) {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    this.particles = [];

    // Spawn 140 particles with randomized velocities, angles and spins
    for (let i = 0; i < 140; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -10 - Math.random() * 50,
        width: Math.random() * 8 + 6,
        height: Math.random() * 6 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    const startTime = performance.now();
    cancelAnimationFrame(this.animationId);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let alive = false;
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.rotation += p.rotationSpeed;

        if (elapsed > durationMs - 1000) {
          p.opacity = Math.max(0, (durationMs - elapsed) / 1000);
        }

        if (p.y < this.canvas.height + 20 && p.opacity > 0) {
          alive = true;
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.globalAlpha = p.opacity;
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
          this.ctx.restore();
        }
      }

      if (alive && elapsed < durationMs) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  stop() {
    cancelAnimationFrame(this.animationId);
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
