// Moteur de sons 100 % synthétisés (Web Audio API) — aucun fichier audio.
import { rand, clamp } from './util.js';

let ac = null;
let master = null;
let white = null;
let brown = null;
const loops = {};

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ac = new AC({ latencyHint: 'interactive' });
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  master = ac.createGain();
  master.gain.value = audio.enabled ? 0.9 : 0;
  master.connect(comp);
  comp.connect(ac.destination);

  const len = ac.sampleRate * 2;
  white = ac.createBuffer(1, len, ac.sampleRate);
  brown = ac.createBuffer(1, len, ac.sampleRate);
  const w = white.getChannelData(0);
  const b = brown.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const r = Math.random() * 2 - 1;
    w[i] = r;
    last = (last + 0.02 * r) / 1.02;
    b[i] = last * 3.5;
  }
  return true;
}

function ok() {
  if (!ac) return false;
  if (ac.state !== 'running') ac.resume();
  return audio.enabled;
}
const now = () => ac.currentTime;

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function noise(t, dur, o = {}) {
  const s = ac.createBufferSource();
  s.buffer = o.brown ? brown : white;
  s.playbackRate.value = o.rate || 1;
  const f = ac.createBiquadFilter();
  f.type = o.type || 'bandpass';
  f.frequency.setValueAtTime(o.f || 800, t);
  if (o.fEnd) f.frequency.exponentialRampToValueAtTime(o.fEnd, t + dur);
  f.Q.value = o.q ?? 1;
  const g = ac.createGain();
  env(g, t, o.a ?? 0.004, o.gain ?? 0.3, dur);
  s.connect(f).connect(g).connect(o.dest || master);
  s.start(t, Math.random() * 1.5);
  s.stop(t + (o.a ?? 0.004) + dur + 0.05);
}

function tone(t, freq, dur, o = {}) {
  const osc = ac.createOscillator();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (o.fEnd) osc.frequency.exponentialRampToValueAtTime(o.fEnd, t + (o.glide || dur));
  const g = ac.createGain();
  env(g, t, o.a ?? 0.004, o.gain ?? 0.2, dur);
  let node = osc.connect(g);
  if (o.lp) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.lp;
    node = node.connect(f);
  }
  node.connect(o.dest || master);
  osc.start(t);
  osc.stop(t + (o.a ?? 0.004) + dur + 0.05);
}

// Boucle continue (rouleau, pinceau, four) dont on module le volume en direct
function loop(name, { brownNoise = true, type = 'lowpass', f = 600, q = 0.7 } = {}) {
  if (loops[name]) return loops[name];
  const s = ac.createBufferSource();
  s.buffer = brownNoise ? brown : white;
  s.loop = true;
  const filt = ac.createBiquadFilter();
  filt.type = type;
  filt.frequency.value = f;
  filt.Q.value = q;
  const g = ac.createGain();
  g.gain.value = 0;
  s.connect(filt).connect(g).connect(master);
  s.start();
  loops[name] = { s, filt, g };
  return loops[name];
}

export const audio = {
  enabled: true,

  unlock() {
    if (!ac && !build()) return;
    if (ac.state !== 'running') ac.resume();
    // tampon silencieux pour iOS
    const b = ac.createBuffer(1, 1, 22050);
    const s = ac.createBufferSource();
    s.buffer = b;
    s.connect(ac.destination);
    s.start(0);
  },

  setEnabled(v) {
    this.enabled = v;
    if (master) master.gain.setTargetAtTime(v ? 0.9 : 0, now(), 0.05);
  },

  suspend() { if (ac) ac.suspend(); },
  resume() { if (ac) ac.resume(); },

  // --- Pâte ---
  squish(prog = 0) {
    if (!ok()) return;
    const t = now();
    const p = rand(0.85, 1.15);
    // corps mou de la pâte
    noise(t, 0.16, { type: 'lowpass', f: 900 * p + prog * 600, fEnd: 180, q: 2.5, gain: 0.55, a: 0.006 });
    // petit bruit mouillé
    noise(t + 0.01, 0.05, { type: 'bandpass', f: 1600 * p + prog * 900, q: 4, gain: 0.12 });
    // impact grave
    tone(t, 120 * p, 0.12, { fEnd: 52, gain: 0.32, glide: 0.1 });
  },
  flourPuff() {
    if (!ok()) return;
    noise(now(), 0.3, { type: 'highpass', f: 2500, gain: 0.05, a: 0.03 });
  },
  thud(power = 1) {
    if (!ok()) return;
    const t = now();
    tone(t, 95, 0.16, { fEnd: 45, gain: 0.45 * power });
    noise(t, 0.12, { type: 'lowpass', f: 420, gain: 0.35 * power });
  },
  flap() {
    if (!ok()) return;
    const t = now();
    noise(t, 0.22, { type: 'lowpass', f: 1400, fEnd: 220, q: 1.2, gain: 0.45, a: 0.02 });
    tone(t + 0.12, 80, 0.12, { fEnd: 48, gain: 0.3 });
  },
  rollSet(speed) {
    if (!ok()) return;
    const l = loop('roll', { brownNoise: true, f: 350 });
    const v = clamp(speed / 900, 0, 1);
    l.g.gain.setTargetAtTime(v * 0.75, now(), 0.04);
    l.filt.frequency.setTargetAtTime(260 + v * 900, now(), 0.05);
  },
  brushSet(speed) {
    if (!ok()) return;
    const l = loop('brush', { brownNoise: false, type: 'bandpass', f: 2600, q: 0.6 });
    const v = clamp(speed / 1200, 0, 1);
    l.g.gain.setTargetAtTime(v * 0.16, now(), 0.03);
    l.filt.frequency.setTargetAtTime(1800 + v * 2200, now(), 0.05);
  },
  squeak() {
    if (!ok()) return;
    const t = now();
    noise(t, 0.06, { type: 'bandpass', f: rand(500, 800), q: 6, gain: 0.12 });
  },

  // --- Four ---
  ovenStart() {
    if (!ok()) return;
    const t = now();
    if (!loops.ovenHum) {
      const osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 55;
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 140;
      const g = ac.createGain();
      g.gain.value = 0;
      osc.connect(f).connect(g).connect(master);
      osc.start();
      loops.ovenHum = { osc, filt: f, g };
    }
    loop('ovenFan', { brownNoise: true, f: 700 });
    loops.ovenHum.g.gain.setTargetAtTime(0.13, t, 0.15);
    loops.ovenFan.g.gain.setTargetAtTime(0.22, t, 0.2);
    noise(t, 0.25, { type: 'bandpass', f: 300, fEnd: 900, gain: 0.25, a: 0.05 }); // « whoump » d'allumage
  },
  ovenHeat(v) {
    if (!ac || !loops.ovenHum) return;
    loops.ovenHum.filt.frequency.setTargetAtTime(140 + v * 260, now(), 0.1);
    loops.ovenFan.filt.frequency.setTargetAtTime(600 + v * 900, now(), 0.1);
  },
  ovenStop() {
    if (!ac) return;
    const t = now();
    if (loops.ovenHum) loops.ovenHum.g.gain.setTargetAtTime(0, t, 0.12);
    if (loops.ovenFan) loops.ovenFan.g.gain.setTargetAtTime(0, t, 0.2);
  },
  // Crépitement de croûte : une pluie de micro-clics
  crackle(intensity = 1, dur = 0.3) {
    if (!ok()) return;
    const t = now();
    const n = Math.round(8 * intensity * dur * 10);
    for (let i = 0; i < n; i++) {
      const tt = t + Math.random() * dur;
      noise(tt, rand(0.003, 0.012), { type: 'bandpass', f: rand(1800, 7000), q: rand(1, 4), gain: rand(0.04, 0.32) * Math.min(1.2, intensity), a: 0.001 });
    }
  },
  tick() {
    if (!ok()) return;
    tone(now(), 1900, 0.02, { type: 'square', gain: 0.035, lp: 4000 });
  },
  door() {
    if (!ok()) return;
    const t = now();
    noise(t, 0.35, { type: 'bandpass', f: 500, fEnd: 1500, q: 3, gain: 0.12, a: 0.04 }); // grincement
    tone(t + 0.28, 140, 0.15, { fEnd: 70, gain: 0.3 });
  },
  sizzle(dur = 1.2) {
    if (!ok()) return;
    noise(now(), dur, { type: 'highpass', f: 4000, gain: 0.09, a: 0.05 });
  },

  // --- Récompenses ---
  pop(pitch = 1) {
    if (!ok()) return;
    const t = now();
    tone(t, 380 * pitch, 0.09, { fEnd: 1100 * pitch, glide: 0.05, gain: 0.32 });
    noise(t, 0.02, { type: 'highpass', f: 3000, gain: 0.08 });
  },
  coin(i = 0) {
    if (!ok()) return;
    const t = now() + i * 0.07;
    tone(t, 1318.5, 0.07, { type: 'triangle', gain: 0.14 });
    tone(t + 0.065, 1975.5, 0.3, { type: 'triangle', gain: 0.14 });
    tone(t + 0.065, 3951, 0.2, { gain: 0.03 });
  },
  sparkle() {
    if (!ok()) return;
    const t = now();
    [1568, 2093, 2637, 3136].forEach((f, i) => tone(t + i * 0.05, f, 0.25, { gain: 0.07 }));
  },
  ding() {
    if (!ok()) return;
    const t = now();
    [[1, 0.25], [2.76, 0.08], [5.4, 0.04]].forEach(([k, g]) => tone(t, 880 * k, 1.2, { gain: g, a: 0.002 }));
  },
  star(i = 0) {
    if (!ok()) return;
    const t = now();
    const notes = [1046.5, 1318.5, 1568];
    tone(t, 300 + i * 120, 0.08, { fEnd: 1200 + i * 300, glide: 0.06, gain: 0.25 });
    tone(t + 0.04, notes[i % 3], 0.5, { type: 'triangle', gain: 0.14 });
    tone(t + 0.04, notes[i % 3] * 2, 0.35, { gain: 0.04 });
  },
  whoosh() {
    if (!ok()) return;
    noise(now(), 0.35, { type: 'bandpass', f: 300, fEnd: 2200, q: 0.8, gain: 0.16, a: 0.12 });
  },
  boing() {
    if (!ok()) return;
    tone(now(), 220, 0.18, { fEnd: 140, type: 'triangle', gain: 0.12 });
  },
  fail() {
    if (!ok()) return;
    const t = now();
    tone(t, 330, 0.18, { type: 'triangle', gain: 0.12, fEnd: 300 });
    tone(t + 0.18, 247, 0.35, { type: 'triangle', gain: 0.12, fEnd: 220 });
  },
  chime() {
    if (!ok()) return;
    const t = now();
    [784, 988, 1175, 1568].forEach((f, i) => tone(t + i * 0.08, f, 0.4, { type: 'triangle', gain: 0.1 }));
  },
  bell() {
    // clochette de porte de boulangerie
    if (!ok()) return;
    const t = now();
    [0, 0.13, 0.26].forEach((d, i) => {
      [[1, 0.1], [2.4, 0.04], [4.1, 0.02]].forEach(([k, g]) => tone(t + d, (1760 + i * 40) * k, 0.6, { gain: g }));
    });
  },

  // --- Boucles génériques (mélange, versage, vapeur…) ---
  loopSet(name, gain, freq, opts) {
    if (!ok()) return;
    const l = loop(name, opts);
    l.g.gain.setTargetAtTime(gain, now(), 0.05);
    if (freq) l.filt.frequency.setTargetAtTime(freq, now(), 0.06);
  },
  humSet(name, gain, freq = 50, lp = 240, type = 'sawtooth') {
    if (!ok()) return;
    if (!loops[name]) {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lp;
      const g = ac.createGain();
      g.gain.value = 0;
      osc.connect(f).connect(g).connect(master);
      osc.start();
      loops[name] = { s: osc, filt: f, g };
    }
    loops[name].g.gain.setTargetAtTime(gain, now(), 0.06);
  },
  stopLoops() {
    if (!ac) return;
    for (const k in loops) loops[k].g.gain.setTargetAtTime(0, now(), 0.06);
  },
  glop() {
    if (!ok()) return;
    const t = now();
    tone(t, rand(160, 220), 0.12, { fEnd: 80, gain: 0.22 });
    noise(t, 0.1, { type: 'lowpass', f: 700, fEnd: 200, q: 3, gain: 0.25 });
  },
  splat() {
    if (!ok()) return;
    const t = now();
    const p = rand(0.85, 1.2);
    noise(t, 0.14, { type: 'lowpass', f: 1300 * p, fEnd: 260, q: 3, gain: 0.5 });
    noise(t + 0.02, 0.06, { type: 'bandpass', f: 2400 * p, q: 5, gain: 0.12 });
    tone(t, 200 * p, 0.1, { fEnd: 80, gain: 0.25 });
  },
  knife() {
    if (!ok()) return;
    const t = now();
    noise(t, 0.22, { type: 'bandpass', f: 3200, fEnd: 900, q: 1.5, gain: 0.2, a: 0.02 });
    this.crackle(0.7, 0.2);
    tone(t + 0.2, 110, 0.1, { fEnd: 60, gain: 0.3 });
  },
  clink() {
    if (!ok()) return;
    const t = now();
    [[2350, 0.09], [3720, 0.05], [5480, 0.03]].forEach(([f, g]) => tone(t, f * rand(0.97, 1.03), 0.35, { gain: g, a: 0.001 }));
  },
  register() {
    if (!ok()) return;
    const t = now();
    noise(t, 0.05, { type: 'highpass', f: 2000, gain: 0.15 });
    tone(t + 0.05, 2093, 0.5, { type: 'triangle', gain: 0.1 });
    tone(t + 0.12, 2637, 0.6, { type: 'triangle', gain: 0.1 });
    tone(t + 0.12, 5274, 0.3, { gain: 0.03 });
  },
  clunk() {
    if (!ok()) return;
    const t = now();
    tone(t, 160, 0.08, { type: 'square', fEnd: 90, gain: 0.12, lp: 900 });
    noise(t, 0.05, { type: 'bandpass', f: 1800, q: 3, gain: 0.2 });
  },
};
