// main.js — boot, input, the fixed game loop.

import { Game } from './game.js';
import { toggleMute } from './audio.js';
import { W, H } from './config.js';

const canvas = document.getElementById('game');
const ui = {
  input: new Set(),
  hud: document.getElementById('hud'),
  hearts: document.getElementById('hearts'),
  emberCount: document.getElementById('ember-count'),
  shadowCount: document.getElementById('shadow-count'),
  waveLabel: document.getElementById('wave-label'),
  banner: document.getElementById('banner'),
  upgradeCards: document.getElementById('upgrade-cards'),
  endGlyph: document.getElementById('end-glyph'),
  endTitle: document.getElementById('end-title'),
  endText: document.getElementById('end-text'),
  endStats: document.getElementById('end-stats'),
  screens: {
    title: document.getElementById('screen-title'),
    upgrade: document.getElementById('screen-upgrade'),
    end: document.getElementById('screen-end'),
    pause: document.getElementById('screen-pause'),
  },
};

const game = new Game(canvas, ui);
window.__game = game; // exposed for local debugging and screenshot tooling

// ── input ─────────────────────────────────────────────
const mouse = { x: W / 2, y: H / 2, down: false };

function keyName(e) { return e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase(); }

window.addEventListener('keydown', (e) => {
  const k = keyName(e);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === 'm') { toggleMute(); return; }
  if (k === 'p' || k === 'escape') {
    if (game.state === 'playing') game.setState('paused');
    else if (game.state === 'paused') game.setState('playing');
    return;
  }
  if (k === ' ') { game.fireBolt(mouse); return; }
  if (k === 'enter' && game.state === 'title') { game.start(); return; }
  ui.input.add(k);
});
window.addEventListener('keyup', (e) => ui.input.delete(keyName(e)));
window.addEventListener('blur', () => { ui.input.clear(); mouse.down = false; });

function toCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
}
canvas.addEventListener('mousemove', (e) => Object.assign(mouse, toCanvas(e)));
canvas.addEventListener('mousedown', (e) => { Object.assign(mouse, toCanvas(e)); mouse.down = true; game.fireBolt(mouse); });
window.addEventListener('mouseup', () => { mouse.down = false; });

document.getElementById('btn-start').addEventListener('click', () => game.start());
document.getElementById('btn-again').addEventListener('click', () => game.start());

// auto-fire while the button is held
setInterval(() => { if (mouse.down) game.fireBolt(mouse); }, 90);

// ── the loop ──────────────────────────────────────────
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 0.05);           // never teleport after a tab switch
  game.update(dt);
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
