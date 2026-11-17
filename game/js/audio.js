// audio.js — every sound in the game is synthesised here with WebAudio.
// Nothing is fetched, nothing is decoded; M mutes the whole grove.

let ctx = null;
let master = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

export function isMuted() { return muted; }

function tone({ type = 'sine', freq = 440, freqEnd = null, dur = 0.2, vol = 0.5, when = 0, attack = 0.005 }) {
  if (muted) return;
  const c = ac();
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.3, vol = 0.4, when = 0, lowpass = 900 }) {
  if (muted) return;
  const c = ac();
  const t0 = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
}

export const sfx = {
  pickup()  { tone({ type: 'sine', freq: 660, freqEnd: 990, dur: 0.16, vol: 0.32 });
              tone({ type: 'sine', freq: 1320, dur: 0.22, vol: 0.16, when: 0.05 }); },
  zap()     { tone({ type: 'square', freq: 880, freqEnd: 330, dur: 0.09, vol: 0.22 });
              noise({ dur: 0.05, vol: 0.08, lowpass: 2400 }); },
  hit()     { tone({ type: 'sawtooth', freq: 220, freqEnd: 90, dur: 0.22, vol: 0.36 });
              noise({ dur: 0.18, vol: 0.3, lowpass: 700 }); },
  shadowDie(){ tone({ type: 'triangle', freq: 330, freqEnd: 110, dur: 0.28, vol: 0.3 });
              noise({ dur: 0.22, vol: 0.18, lowpass: 1100 }); },
  boon()    { [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'sine', freq: f, dur: 0.5, vol: 0.26, when: i * 0.09 })); },
  wave()    { tone({ type: 'sine', freq: 98, freqEnd: 147, dur: 1.1, vol: 0.4, attack: 0.15 });
              tone({ type: 'sine', freq: 196, dur: 0.9, vol: 0.18, when: 0.25, attack: 0.2 }); },
  hurt()    { tone({ type: 'square', freq: 160, freqEnd: 70, dur: 0.24, vol: 0.4 }); noise({ dur: 0.2, vol: 0.34, lowpass: 500 }); },
  eclipse() { tone({ type: 'sine', freq: 65, freqEnd: 196, dur: 1.4, vol: 0.44, attack: 0.3 }); },
  defeat()  { [392, 311, 233, 155].forEach((f, i) => tone({ type: 'sine', freq: f, dur: 0.62, vol: 0.3, when: i * 0.22 })); },
  victory() { [523, 587, 698, 784, 1046, 1318].forEach((f, i) => tone({ type: 'sine', freq: f, dur: 0.55, vol: 0.3, when: i * 0.14 })); },
  click()   { tone({ type: 'sine', freq: 1200, dur: 0.05, vol: 0.12 }); },
};

// A quiet two-note drone under the menu — starts only after a user gesture.
let droneGain = null;
export function startDrone() {
  if (muted) return;
  const c = ac();
  if (droneGain) return;
  droneGain = c.createGain();
  droneGain.gain.value = 0.0001;
  droneGain.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 1.5);
  [65.4, 98.0, 130.8].forEach((f) => {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(droneGain);
    o.start();
  });
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.13;
  lfoGain.gain.value = 0.028;
  lfo.connect(lfoGain);
  lfoGain.connect(droneGain.gain);
  lfo.start();
  droneGain.connect(master);
}
