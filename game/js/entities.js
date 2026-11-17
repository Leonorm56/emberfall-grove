// entities.js — the living things of the grove: the wisp, the shadows, embers and bolts.

import { W, H, COLORS } from './config.js';

export class Wisp {
  constructor() {
    this.x = W / 2; this.y = H / 2 + 140;
    this.vx = 0; this.vy = 0;
    this.radius = 16;
    this.hp = 6; this.maxHp = 6;
    this.speed = 265;
    this.boltSpeed = 560;
    this.boltDamage = 1;
    this.fireCooldown = 0.28;
    this.cooldownLeft = 0;
    this.magnetRadius = 90;
    this.projectiles = 1;
    this.spreadStep = 0.17;    // radians between split bolts
    this.hurtTimer = 0;
    this.facing = 0;
    this.embers = 0;
    this.bob = 0;
  }

  update(dt, input) {
    let ax = 0, ay = 0;
    if (input.has('a') || input.has('arrowleft')) ax -= 1;
    if (input.has('d') || input.has('arrowright')) ax += 1;
    if (input.has('w') || input.has('arrowup')) ay -= 1;
    if (input.has('s') || input.has('arrowdown')) ay += 1;
    const len = Math.hypot(ax, ay) || 1;
    this.vx = (ax / len) * this.speed;
    this.vy = (ay / len) * this.speed;
    this.x = Math.min(W - 18, Math.max(18, this.x + this.vx * dt));
    this.y = Math.min(H - 18, Math.max(18, this.y + this.vy * dt));
    this.cooldownLeft = Math.max(0, this.cooldownLeft - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.bob += dt * 3.1;
  }

  aimFrom(mouse) { this.facing = Math.atan2(mouse.y - this.y, mouse.x - this.x); }

  tryFire(mouse) {
    if (this.cooldownLeft > 0) return [];
    this.cooldownLeft = this.fireCooldown;
    this.aimFrom(mouse);
    const bolts = [];
    const mid = (this.projectiles - 1) / 2;
    for (let i = 0; i < this.projectiles; i++) {
      const angle = this.facing + (i - mid) * this.spreadStep;
      bolts.push(new Bolt(this.x, this.y, Math.cos(angle) * this.boltSpeed, Math.sin(angle) * this.boltSpeed, this.boltDamage));
    }
    return bolts;
  }

  hurt(amount) {
    this.hp -= amount;
    this.hurtTimer = 1.1;
    return this.hp <= 0;
  }

  draw(ctx, t) {
    const bobY = Math.sin(this.bob) * 4;
    // hurt blink
    if (this.hurtTimer > 0 && Math.floor(this.hurtTimer * 9) % 2 === 0) { ctx.save(); ctx.globalAlpha = 0.45; } else { ctx.save(); }
    // glow aura
    const aura = ctx.createRadialGradient(this.x, this.y + bobY, 2, this.x, this.y + bobY, 52);
    aura.addColorStop(0, 'rgba(255,214,140,.85)');
    aura.addColorStop(0.35, 'rgba(255,179,71,.32)');
    aura.addColorStop(1, 'rgba(255,179,71,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(this.x - 56, this.y + bobY - 56, 112, 112);
    // body — a teardrop flame with a face of light
    ctx.save();
    ctx.translate(this.x, this.y + bobY);
    ctx.rotate(Math.sin(t * 1.3) * 0.07);
    const body = ctx.createLinearGradient(0, -20, 0, 22);
    body.addColorStop(0, COLORS.emberCore);
    body.addColorStop(0.45, COLORS.emberMid);
    body.addColorStop(1, COLORS.emberHot);
    ctx.shadowBlur = 22;
    ctx.shadowColor = COLORS.emberMid;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.bezierCurveTo(13, -6, 15, 12, 0, 19);
    ctx.bezierCurveTo(-15, 12, -13, -6, 0, -21);
    ctx.fill();
    ctx.shadowBlur = 0;
    // eyes
    ctx.fillStyle = '#3a1c05';
    ctx.beginPath();
    ctx.ellipse(-5.5, 2, 2.15, 3.1, 0, 0, Math.PI * 2);
    ctx.ellipse(5.5, 2, 2.15, 3.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}

export class Bolt {
  constructor(x, y, vx, vy, damage) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.damage = damage;
    this.radius = 6;
    this.life = 1.15;
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#ffe9a3';
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 9);
    g.addColorStop(0, '#fffbe0');
    g.addColorStop(0.6, '#ffd25e');
    g.addColorStop(1, 'rgba(255,210,94,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
    ctx.fill();
    // streak
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#ffd25e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.045, this.y - this.vy * 0.045);
    ctx.stroke();
    ctx.restore();
  }
}

export class Ember {
  constructor() {
    this.x = 60 + Math.random() * (W - 120);
    this.y = 60 + Math.random() * (H - 120);
    this.vx = (Math.random() - 0.5) * 84;
    this.vy = (Math.random() - 0.5) * 84;
    this.radius = 7;
    this.life = 11;
    this.maxLife = 11;
    this.phase = Math.random() * Math.PI * 2;
  }
  update(dt, player) {
    this.life -= dt;
    this.phase += dt * 2.4;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.x < 20 || this.x > W - 20) this.vx *= -1;
    if (this.y < 20 || this.y > H - 20) this.vy *= -1;
    // magnet: homes toward the wisp inside its aura
    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < player.magnetRadius && d > 1) {
      const pull = 340 * (1 - d / player.magnetRadius) + 120;
      this.vx += (dx / d) * pull * dt;
      this.vy += (dy / d) * pull * dt;
    }
    const cap = 240;
    const s = Math.hypot(this.vx, this.vy);
    if (s > cap) { this.vx = (this.vx / s) * cap; this.vy = (this.vy / s) * cap; }
  }
  draw(ctx, t) {
    const fade = Math.min(1, this.life / 2.2);
    const pulse = 0.75 + 0.25 * Math.sin(this.phase);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#ffb347';
    ctx.fillStyle = '#ffc46b';
    ctx.beginPath();
    // a four-point star, not another blob
    const r = this.radius * pulse;
    const inner = r * 0.38;
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI / 4) * i + t * 0.4;
      const rad = i % 2 === 0 ? r : inner;
      const px = this.x + Math.cos(ang) * rad, py = this.y + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export class Shadow {
  constructor(x, y, speed, hp) {
    this.x = x; this.y = y;
    this.speed = speed;
    this.hp = hp;
    this.maxHp = hp;
    this.radius = 15;
    this.wobble = Math.random() * Math.PI * 2;
    this.isBrute = false;
    this.touchCooldown = 0;
  }
  update(dt, player) {
    this.wobble += dt * 3.4;
    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const weave = Math.sin(this.wobble) * 0.42;
    const nx = dx / d, ny = dy / d;
    const px = -ny, py = nx;
    this.x += (nx * this.speed + px * weave * this.speed * 0.5) * dt;
    this.y += (ny * this.speed + py * weave * this.speed * 0.5) * dt;
    this.touchCooldown = Math.max(0, this.touchCooldown - dt);
  }
  hurt(amount) { this.hp -= amount; return this.hp <= 0; }
  draw(ctx, t) {
    const bob = Math.sin(this.wobble * 1.7) * 3;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    // smoky body
    const body = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 1.5);
    body.addColorStop(0, this.isBrute ? '#3d2b52' : '#2c2140');
    body.addColorStop(0.65, 'rgba(24,15,38,.9)');
    body.addColorStop(1, 'rgba(13,7,24,0)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    // ragged edge — three waving tendrils
    ctx.strokeStyle = 'rgba(185,166,255,.55)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#b9a6ff';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, 8);
      ctx.quadraticCurveTo(i * 8 + Math.sin(t * 5 + i * 2.1) * 6, 18, i * 9 + Math.sin(t * 6 + i) * 9, 27);
      ctx.stroke();
    }
    // eyes — pale, patient, wrong
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#d9ccff';
    ctx.fillStyle = '#e6dcff';
    ctx.beginPath();
    ctx.ellipse(-5.5, -2, 2.3, 3.4, 0, 0, Math.PI * 2);
    ctx.ellipse(5.5, -2, 2.3, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // brute crown
    if (this.isBrute) {
      ctx.fillStyle = '#8f74d6';
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(i * 6, -13);
        ctx.lineTo(i * 6 - 3, -22 - (i % 2 === 0 ? 4 : 0));
        ctx.lineTo(i * 6 + 3, -13);
      }
      ctx.fill();
    }
    ctx.restore();
    // hp pips when damaged
    if (this.hp < this.maxHp) {
      const w = 26 * (this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(185,166,255,.85)';
      ctx.fillRect(this.x - 13, this.y - this.radius - 12, w, 3);
    }
  }
}

export class Brute extends Shadow {
  constructor(x, y, speed, hp) {
    super(x, y, speed * 0.62, Math.round(hp * 3.4) + 2);
    this.isBrute = true;
    this.radius = 24;
  }
}
