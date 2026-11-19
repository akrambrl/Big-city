export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

export const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
};

// Petit gestionnaire d'animations : tween(obj, {x: 10}, 0.4, ease.outBack)
const tweens = [];
export function tween(obj, to, dur, fn = ease.outCubic, delay = 0) {
  return new Promise((resolve) => {
    const from = {};
    for (const k in to) from[k] = obj[k];
    tweens.push({ obj, to, from, dur, fn, t: -delay, resolve });
  });
}
export function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    if (tw.t < 0) continue;
    const k = clamp(tw.t / tw.dur);
    const e = tw.fn(k);
    for (const key in tw.to) tw.obj[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * e;
    if (k >= 1) {
      tweens.splice(i, 1);
      tw.resolve();
    }
  }
}
export function clearTweens() {
  tweens.length = 0;
}

export const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

// Couleurs
export function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgb(r, g, b, a = 1) {
  return a >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}
export function mix(c1, c2, t) {
  const a = typeof c1 === 'string' ? hex(c1) : c1;
  const b = typeof c2 === 'string' ? hex(c2) : c2;
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
export function shade(c, amt) {
  // amt > 0 éclaircit, < 0 assombrit
  const a = typeof c === 'string' ? hex(c) : c;
  return amt >= 0 ? mix(a, [255, 255, 255], amt) : mix(a, [40, 18, 6], -amt);
}
export const css = (c, a = 1) => rgb(c[0], c[1], c[2], a);
