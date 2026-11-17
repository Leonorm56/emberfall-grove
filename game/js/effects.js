// effects.js — particles: ember bursts, hit sparks, ambient fireflies, lantern flames.

export class Particle {
  constructor(x, y, vx, vy, life, size, color, drag = 0.9) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.drag = drag;
  }
  update(dt) {
    this.life -= dt;
    this.vx *= Math.pow(this.drag, dt * 60);
    this.vy *= Math.pow(this.drag, dt * 60);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowBlur = this.size * 3;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (0.5 + a * 0.7), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ParticleField {
  constructor() { this.particles = []; }

  burst(x, y, { count = 12, color = '#ffb347', speed = 220, size = 4, life = 0.7 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.85);
      this.particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, life * (0.6 + Math.random() * 0.8), size * (0.6 + Math.random() * 0.9), color));
    }
  }

  sparkle(x, y, color = '#8ef0d2') {
    this.burst(x, y, { count: 6, color, speed: 90, size: 2.6, life: 0.5 });
  }

  update(dt) {
    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx) { for (const p of this.particles) p.draw(ctx); }

  clear() { this.particles = []; }
}

// Slow ambient fireflies drifting under the canopy — pure decoration.
export class Fireflies {
  constructor(count = 46) {
    this.flies = Array.from({ length: count }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      r: 1 + Math.random() * 2.1,
      phase: Math.random() * Math.PI * 2,
      drift: 0.15 + Math.random() * 0.4,
    }));
  }
  draw(ctx, t) {
    for (const f of this.flies) {
      f.y -= f.drift * 0.016;
      f.x += Math.sin(t * 0.4 + f.phase) * 0.22;
      if (f.y < -4) { f.y = 724; f.x = Math.random() * 1280; }
      const glow = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + f.phase * 3));
      ctx.save();
      ctx.globalAlpha = glow * 0.75;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffe27a';
      ctx.fillStyle = '#ffe9a3';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
