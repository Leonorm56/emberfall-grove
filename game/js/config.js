// config.js — every tuning number and palette entry in one place.

export const W = 1280;
export const H = 720;

export const COLORS = {
  skyTop: '#141b3d',
  skyBottom: '#070a1c',
  emberCore: '#fff6d8',
  emberMid: '#ffb347',
  emberHot: '#ff7a29',
  mint: '#8ef0d2',
  violet: '#b9a6ff',
  shadow: '#241a38',
  shadowEdge: '#0d0718',
  paper: '#f5e9d8',
};

export const PLAYER = {
  startHp: 6,
  maxHp: 6,
  speed: 265,
  radius: 16,
  boltSpeed: 560,
  boltDamage: 1,
  fireCooldown: 0.28,      // seconds between bolts
  magnetRadius: 90,
  emberValue: 10,
};

export const WAVES = [
  { shadows: 4,  speed: 105, hp: 1, spawnEvery: 1.15 },
  { shadows: 6,  speed: 118, hp: 1, spawnEvery: 1.0 },
  { shadows: 8,  speed: 128, hp: 2, spawnEvery: 0.9,  brute: false },
  { shadows: 10, speed: 140, hp: 2, spawnEvery: 0.8,  brute: true },
  { shadows: 12, speed: 152, hp: 2, spawnEvery: 0.7,  brute: true },
  { shadows: 14, speed: 165, hp: 3, spawnEvery: 0.62, brute: true },
  { shadows: 17, speed: 180, hp: 3, spawnEvery: 0.55, brute: true },
  { shadows: 21, speed: 198, hp: 3, spawnEvery: 0.46, brute: true, eclipse: true },
];

export const EMBED = {
  driftSpeed: 42,
  lifespan: 11,
  spawnEvery: 1.35,
};

export const ECLIPSE_BONUS = 150;
