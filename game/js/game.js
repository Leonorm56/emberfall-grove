// game.js — the conductor: states, waves, collisions, rendering, the HUD.

import { W, H, COLORS, WAVES, EMBED, ECLIPSE_BONUS } from './config.js';
import { Wisp, Bolt, Ember, Shadow, Brute } from './entities.js';
import { ParticleField, Fireflies } from './effects.js';
import { pickBoons } from './upgrades.js';
import { sfx, startDrone } from './audio.js';

const BG = { sky: null, ridgeFar: null, ridgeNear: null, tree: null };

function makeBackdrop() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  // vertical dusk gradient with a bruised horizon
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0a0e24');
  sky.addColorStop(0.42, COLORS.skyTop);
  sky.addColorStop(0.72, '#232345');
  sky.addColorStop(0.88, '#31222a');
  sky.addColorStop(1, '#120a14');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  // low swollen moon, eclipse-ringed
  const mx = W * 0.76, my = H * 0.22;
  const moon = g.createRadialGradient(mx, my, 6, mx, my, 90);
  moon.addColorStop(0, '#fff4d9');
  moon.addColorStop(0.28, '#f3dfb2');
  moon.addColorStop(0.42, 'rgba(243,223,178,.35)');
  moon.addColorStop(1, 'rgba(243,223,178,0)');
  g.fillStyle = moon;
  g.fillRect(mx - 110, my - 110, 220, 220);
  g.fillStyle = '#efe0bb';
  g.beginPath(); g.arc(mx, my, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(120,96,60,.35)';
  [[-9, -6, 5], [8, 4, 3.4], [-3, 10, 2.6], [12, -10, 2.2]].forEach(([dx, dy, r]) => {
    g.beginPath(); g.arc(mx + dx, my + dy, r, 0, Math.PI * 2); g.fill();
  });

  // starfield
  for (let i = 0; i < 210; i++) {
    const y = Math.pow(Math.random(), 1.6) * H * 0.55;
    const a = 0.25 + Math.random() * 0.75;
    g.fillStyle = `rgba(245,233,216,${a})`;
    g.fillRect(Math.random() * W, y, Math.random() < 0.12 ? 2 : 1, Math.random() < 0.12 ? 2 : 1);
  }

  // far ridge — a slow saw of pines
  g.fillStyle = '#141a35';
  g.beginPath(); g.moveTo(0, H * 0.62);
  for (let x = 0; x <= W; x += 26) g.lineTo(x, H * 0.62 - 18 - Math.abs(Math.sin(x * 0.021 + 1.7)) * 46 - (x % 78 === 0 ? 26 : 0));
  g.lineTo(W, H); g.lineTo(0, H); g.fill();

  // near ridge
  g.fillStyle = '#0d1226';
  g.beginPath(); g.moveTo(0, H * 0.74);
  for (let x = 0; x <= W; x += 18) g.lineTo(x, H * 0.74 - 12 - Math.abs(Math.sin(x * 0.033 + 0.4)) * 34 - (x % 54 === 0 ? 20 : 0));
  g.lineTo(W, H); g.lineTo(0, H); g.fill();

  // ground haze
  const haze = g.createRadialGradient(W / 2, H + 60, 40, W / 2, H + 60, H * 0.85);
  haze.addColorStop(0, 'rgba(64,44,34,.5)');
  haze.addColorStop(1, 'rgba(64,44,34,0)');
  g.fillStyle = haze;
  g.fillRect(0, 0, W, H);
  return c;
}

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;               // {hud, hearts, emberCount, shadowCount, waveLabel, banner, screens...}
    this.state = 'title';       // title | playing | upgrade | over | win | paused
    this.time = 0;
    this.player = null;
    this.bolts = [];
    this.shadows = [];
    this.embers = [];
    this.field = new ParticleField();
    this.fireflies = new Fireflies(52);
    this.wave = 0;
    this.waveSpec = null;
    this.spawnTimer = 0;
    this.spawned = 0;
    this.emberTimer = 0;
    this.kills = 0;
    this.eclipseFlash = 0;
    if (!BG.sky) BG.sky = makeBackdrop();
  }

  start() {
    this.player = new Wisp();
    this.bolts = []; this.shadows = []; this.embers = [];
    this.field.clear();
    this.wave = 0; this.kills = 0; this.spawned = 0;
    this.time = 0; this.eclipseFlash = 0; this.emberTimer = 0;
    this.setState('playing');
    this.nextWave();
    startDrone();
  }

  setState(s) {
    this.state = s;
    const u = this.ui;
    u.screens.title.classList.toggle('hidden', s !== 'title');
    u.screens.upgrade.classList.toggle('hidden', s !== 'upgrade');
    u.screens.end.classList.toggle('hidden', s !== 'over' && s !== 'win');
    u.screens.pause.classList.toggle('hidden', s !== 'paused');
    u.hud.classList.toggle('hidden', s === 'title');
    if (s === 'over' || s === 'win' || s === 'upgrade') this.ui.banner.classList.add('hidden');
  }

  nextWave() {
    this.wave += 1;
    this.waveSpec = WAVES[this.wave - 1];
    this.spawned = 0;
    this.spawnTimer = 0.6;
    if (this.waveSpec.eclipse) { this.eclipseFlash = 1.4; sfx.eclipse(); } else sfx.wave();
    this.showBanner(this.waveSpec.eclipse ? 'Eclipse — the last hour' : `Wave ${this.wave}`);
  }

  showBanner(text) {
    this.ui.banner.textContent = text;
    this.ui.banner.classList.remove('hidden');
    // retrigger the animation
    this.ui.banner.style.animation = 'none';
    void this.ui.banner.offsetWidth;
    this.ui.banner.style.animation = '';
  }

  update(dt) {
    this.time += dt;
    if (this.state !== 'playing') { this.field.update(dt); return; }
    const p = this.player;

    p.update(dt, this.ui.input);

    // spawn shadows on schedule
    if (this.spawned < this.waveSpec.shadows) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.waveSpec.spawnEvery;
        this.spawnShadow();
      }
    }

    // embers drift in on their own clock
    this.emberTimer -= dt;
    if (this.emberTimer <= 0 && this.embers.length < 7) {
      this.emberTimer = EMBED.spawnEvery;
      this.embers.push(new Ember());
    }

    // updates
    for (const b of this.bolts) b.update(dt);
    for (const e of this.embers) e.update(dt, p);
    for (const s of this.shadows) s.update(dt, p);
    this.field.update(dt);
    this.eclipseFlash = Math.max(0, this.eclipseFlash - dt);

    this.collide(p);

    // cull the dead and the spent
    this.bolts = this.bolts.filter((b) => b.life > 0 && b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30);
    this.embers = this.embers.filter((e) => e.life > 0);
    this.shadows = this.shadows.filter((s) => s.hp > 0);

    // wave cleared?
    if (this.spawned >= this.waveSpec.shadows && this.shadows.length === 0) {
      if (this.wave >= WAVES.length) this.winGame();
      else this.offerBoon();
    }

    this.syncHud();
  }

  spawnShadow() {
    const spec = this.waveSpec;
    const side = Math.floor(Math.random() * 4);
    const m = 40;
    let x, y;
    if (side === 0) { x = Math.random() * W; y = -m; }
    else if (side === 1) { x = Math.random() * W; y = H + m; }
    else if (side === 2) { x = -m; y = Math.random() * H; }
    else { x = W + m; y = Math.random() * H; }
    const s = spec.brute && this.spawned === Math.floor(spec.shadows / 2)
      ? new Brute(x, y, spec.speed, spec.hp)
      : new Shadow(x, y, spec.speed * (0.85 + Math.random() * 0.35), spec.hp);
    this.shadows.push(s);
    this.spawned += 1;
  }

  fireBolt(mouse) {
    if (this.state !== 'playing') return;
    const shots = this.player.tryFire(mouse);
    if (!shots.length) return;
    this.bolts.push(...shots);
    sfx.zap();
    this.field.burst(this.player.x, this.player.y, { count: 4, color: '#ffe9a3', speed: 120, size: 2.4, life: 0.3 });
  }

  collide(p) {
    // bolts vs shadows
    for (const b of this.bolts) {
      for (const s of this.shadows) {
        if (s.hp <= 0) continue;
        const d = Math.hypot(b.x - s.x, b.y - s.y);
        if (d < b.radius + s.radius) {
          if (!p.pierces) b.life = 0;
          const died = s.hurt(b.damage);
          this.field.burst(s.x, s.y, { count: died ? 16 : 7, color: died ? '#b9a6ff' : '#8f74d6', speed: died ? 260 : 150, size: died ? 4.5 : 3, life: 0.6 });
          if (died) { this.kills += 1; sfx.shadowDie(); }
        }
      }
    }
    // embers vs wisp (gather)
    for (const e of this.embers) {
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius + 4) {
        e.life = 0;
        p.embers += 1;
        sfx.pickup();
        this.field.sparkle(e.x, e.y, '#ffd25e');
      }
    }
    // shadows vs wisp
    for (const s of this.shadows) {
      if (s.hp <= 0 || s.touchCooldown > 0) continue;
      if (Math.hypot(s.x - p.x, s.y - p.y) < s.radius + p.radius - 2) {
        s.touchCooldown = 1.0;
        const bonus = s.isBrute ? 2 : 1;
        const dead = p.hurt(bonus);
        sfx.hurt();
        this.field.burst(p.x, p.y, { count: 14, color: '#ff8a5c', speed: 240, size: 4, life: 0.6 });
        s.vx = 0;
        if (dead) this.loseGame();
      }
    }
  }

  offerBoon() {
    this.pendingBoons = pickBoons(3);
    const cards = this.ui.upgradeCards;
    cards.innerHTML = '';
    for (const boon of this.pendingBoons) {
      const btn = document.createElement('button');
      btn.className = 'upgrade-card';
      btn.innerHTML = `<span class="upgrade-glyph">${boon.glyph}</span><span class="upgrade-name">${boon.name}</span><span class="upgrade-desc">${boon.desc}</span>`;
      btn.addEventListener('click', () => this.chooseBoon(boon));
      cards.appendChild(btn);
    }
    sfx.boon();
    this.setState('upgrade');
  }

  chooseBoon(boon) {
    boon.apply(this.player);
    sfx.click();
    if (this.wave >= WAVES.length - 1) { this.winGame(); return; }
    this.setState('playing');
    this.nextWave();
  }

  winGame() {
    sfx.victory();
    this.state = 'win'; // so fillEndStats can see the outcome
    this.ui.endGlyph.textContent = '✦';
    this.ui.endTitle.textContent = 'The Grove Is Lit';
    this.ui.endTitle.classList.remove('defeat');
    this.ui.endText.textContent = 'Eight shadows broken against the lantern. The embers keep their own counsel now — and the path is warm beneath your feet. Until winter, little light.';
    this.fillEndStats();
    this.setState('win');
  }

  loseGame() {
    sfx.defeat();
    this.ui.endGlyph.textContent = '☾';
    this.ui.endTitle.textContent = 'The Light Fades';
    this.ui.endTitle.classList.add('defeat');
    this.ui.endText.textContent = 'An ember dropped, unmourned. The grove dims by one flame — but fire remembers how to return. Press Rekindle and try the shadows again.';
    this.fillEndStats();
    this.setState('over');
  }

  fillEndStats() {
    const embers = this.player.embers * 10;
    const bonus = this.state === 'win' ? ECLIPSE_BONUS : 0;
    const total = embers + this.kills * 5 + bonus;
    this.ui.endStats.innerHTML = `
      <div class="end-stat"><b>${total}</b><span>score</span></div>
      <div class="end-stat"><b>${this.wave}</b><span>wave</span></div>
      <div class="end-stat"><b>${this.kills}</b><span>shadows broken</span></div>
      <div class="end-stat"><b>${this.player.embers}</b><span>embers gathered</span></div>`;
  }

  syncHud() {
    this.ui.emberCount.textContent = this.player.embers;
    this.ui.shadowCount.textContent = this.shadows.length + (this.waveSpec.shadows - this.spawned);
    this.ui.waveLabel.textContent = `Wave ${this.wave} / ${WAVES.length}`;
    const hearts = this.ui.hearts;
    let html = '';
    for (let i = 0; i < this.player.maxHp; i++) html += `<span class="heart${i < this.player.hp ? '' : ' empty'}">♥</span>`;
    hearts.innerHTML = html;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(BG.sky, 0, 0);

    // eclipse pulse on the final wave
    if (this.eclipseFlash > 0) {
      ctx.fillStyle = `rgba(20,10,36,${0.35 * Math.min(1, this.eclipseFlash)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // the ground path glow at center-bottom — the lantern itself
    const lantern = ctx.createRadialGradient(W / 2, H + 90, 10, W / 2, H + 90, 420);
    lantern.addColorStop(0, 'rgba(255,179,71,.4)');
    lantern.addColorStop(1, 'rgba(255,179,71,0)');
    ctx.fillStyle = lantern;
    ctx.fillRect(0, H - 320, W, 320);

    this.fireflies.draw(ctx, this.time);
    for (const e of this.embers) e.draw(ctx, this.time);
    for (const s of this.shadows) s.draw(ctx, this.time);
    for (const b of this.bolts) b.draw(ctx);
    this.field.draw(ctx);
    if (this.player && this.state !== 'title') this.player.draw(ctx, this.time);

    // vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.78);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
}
