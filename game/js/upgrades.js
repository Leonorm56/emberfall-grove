// upgrades.js — the lantern's boons: what you are offered between waves, and what they do.

export const BOONS = [
  {
    id: 'split', name: 'Split Shot', glyph: '⋔',
    desc: 'Your bolts fork into twins. One more light per cast, every cast.',
    apply(p) { p.projectiles = Math.min(4, p.projectiles + 1); },
    once: false,
  },
  {
    id: 'quicklight', name: 'Quicklight', glyph: '↯',
    desc: 'Bolts leave your hand much faster — the dark barely has time to blink.',
    apply(p) { p.fireCooldown = Math.max(0.12, p.fireCooldown * 0.74); },
    once: false,
  },
  {
    id: 'brightbolt', name: "Bright Bolt", glyph: '☀',
    desc: 'Each bolt burns for +1 damage. Shadows will learn to fear the glare.',
    apply(p) { p.boltDamage += 1; },
    once: false,
  },
  {
    id: 'magnet', name: 'Ember Magnet', glyph: '◎',
    desc: 'Loose embers lean toward you from much further away.',
    apply(p) { p.magnetRadius += 70; },
    once: false,
  },
  {
    id: 'swift', name: 'Swift Soul', glyph: '🜁',
    desc: 'The wisp drifts swifter — escape is also a kind of light.',
    apply(p) { p.speed += 55; },
    once: false,
  },
  {
    id: 'heart', name: 'Ember Heart', glyph: '♥',
    desc: '+2 max hearts and the grove knits your wounds. A gift of stubbornness.',
    apply(p) { p.maxHp += 2; p.hp = Math.min(p.maxHp, p.hp + 3); },
    once: false,
  },
  {
    id: 'nova', name: 'Kindled Nova', glyph: '✺',
    desc: 'A bolt that pierces straight through every shadow it touches.',
    apply(p) { p.pierces = true; },
    once: true,
  },
];

export function pickBoons(count = 3) {
  const pool = [...BOONS];
  const picks = [];
  while (picks.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  return picks;
}
