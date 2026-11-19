// Banana bread, café latte, bols : tout dessiné en code.
import { mix, shade, css, clamp, lerp } from '../core/util.js';
import { roundRect } from './scenery.js';

const BB_STOPS = [
  [0, '#ecd29c'],
  [0.4, '#d9a35c'],
  [0.7, '#a8642a'],
  [0.85, '#7a431c'],
  [1, '#2e1a0c'],
];
export function bbColor(b) {
  b = clamp(b, 0, 1);
  for (let i = 1; i < BB_STOPS.length; i++) {
    if (b <= BB_STOPS[i][0]) {
      const [a0, c0] = BB_STOPS[i - 1];
      const [a1, c1] = BB_STOPS[i];
      return mix(c0, c1, (b - a0) / (a1 - a0));
    }
  }
  return mix('#2e1a0c', '#2e1a0c', 0);
}
const CRUMB = '#e2bb7c';

function loafProfile(ctx, x0, x1, yb, h, dome) {
  const yt = yb - h * 0.62;
  ctx.beginPath();
  ctx.moveTo(x0 + 4, yb);
  ctx.lineTo(x1 - 4, yb);
  ctx.quadraticCurveTo(x1, yb, x1, yb - 6);
  ctx.lineTo(x1 + 2, yt);
  ctx.quadraticCurveTo((x0 + x1) / 2, yt - h * 0.75 * dome, x0 - 2, yt);
  ctx.lineTo(x0, yb - 6);
  ctx.quadraticCurveTo(x0, yb, x0 + 4, yb);
  ctx.closePath();
}

/**
 * Banana bread vu de côté. opt: { bake, puff, banana, len (0..1, part restante), shine }
 * Centré en (x, y), largeur s quand len = 1.
 */
export function drawBananaBread(ctx, x, y, s, opt = {}) {
  const bake = opt.bake ?? 0.7;
  const puff = opt.puff ?? 1;
  const len = opt.len ?? 1;
  const h = s * 0.42;
  const yb = y + h * 0.45;
  const x0 = x - s / 2;
  const x1 = x0 + s * len;
  const dome = 0.25 + puff * 0.75;
  if (len <= 0.02) return;

  if (!opt.noShadow) {
    ctx.fillStyle = 'rgba(90,45,15,0.22)';
    ctx.beginPath();
    ctx.ellipse((x0 + x1) / 2, yb + 4, (x1 - x0) * 0.55, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const base = bbColor(bake);
  const g = ctx.createLinearGradient(0, yb - h, 0, yb);
  g.addColorStop(0, css(shade(base, -0.12)));
  g.addColorStop(0.35, css(base));
  g.addColorStop(1, css(shade(base, 0.12)));
  ctx.fillStyle = g;
  loafProfile(ctx, x0, x1, yb, h, dome);
  ctx.fill();
  ctx.strokeStyle = css(shade(base, -0.35), 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  loafProfile(ctx, x0, x1, yb, h, dome);
  ctx.clip();
  // fente sur le dessus (plus claire)
  const yt = yb - h * 0.62;
  ctx.strokeStyle = css(shade(bbColor(bake * 0.7), 0.15), 0.8);
  ctx.lineWidth = s * 0.025;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const mx = (x0 + x1) / 2;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const xx = lerp(x0 + s * 0.12, Math.min(x1, x0 + s * 0.88), t);
    const k = (xx - mx) / (s / 2);
    const yy = yt - h * 0.75 * dome * 0.5 * (1 - k * k) + (i % 2 ? 2 : -2) + h * 0.06;
    if (i === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // reflet
  ctx.fillStyle = `rgba(255,240,210,${0.18 + (opt.shine || 0)})`;
  ctx.beginPath();
  ctx.ellipse(x0 + s * 0.3, yt - h * 0.18 * dome, s * 0.18, h * 0.06, -0.08, 0, Math.PI * 2);
  ctx.fill();
  // tranche coupée : la mie
  if (len < 1) {
    const fw = s * 0.06;
    const cg = ctx.createLinearGradient(x1 - fw, 0, x1, 0);
    cg.addColorStop(0, css(shade(CRUMB, -0.1)));
    cg.addColorStop(1, CRUMB);
    ctx.fillStyle = cg;
    ctx.fillRect(x1 - fw, yb - h * 1.3, fw + 4, h * 1.4);
    ctx.fillStyle = 'rgba(120,70,30,0.45)';
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(x1 - fw * 0.5 + ((i * 7) % 5) - 2, yb - h * (0.1 + (i / 9) * 0.6), 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // demi-banane caramélisée sur le dessus
  if (opt.banana !== false && len > 0.6) drawBananaHalf(ctx, x0 + s * 0.5, yt - h * 0.75 * dome * 0.5 + h * 0.02, s * 0.62, bake);
}

export function drawBananaHalf(ctx, x, y, w, bake = 0, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const c = bake < 0.1 ? [243, 220, 122] : mix('#f3dc7a', '#b5702a', clamp((bake - 0.1) / 0.7));
  ctx.fillStyle = css(c);
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.quadraticCurveTo(0, -w * 0.14, w / 2, 0);
  ctx.quadraticCurveTo(w * 0.42, w * 0.06, w * 0.3, w * 0.05);
  ctx.quadraticCurveTo(0, w * 0.01, -w * 0.3, w * 0.05);
  ctx.quadraticCurveTo(-w * 0.44, w * 0.06, -w / 2, 0);
  ctx.fill();
  ctx.strokeStyle = css(shade(c, -0.3), 0.7);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // graines
  ctx.fillStyle = css(shade(c, -0.45), 0.6);
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(i * w * 0.09, -w * 0.035 + Math.abs(i) * w * 0.005, 1.6, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(-w * 0.1, -w * 0.06, w * 0.18, w * 0.015, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Une tranche vue de face (pour les icônes et l'assiette)
export function drawBBSlice(ctx, x, y, s, opt = {}) {
  const bake = opt.bake ?? 0.7;
  const w = s, h = s * 0.8;
  const crust = bbColor(bake);
  ctx.save();
  ctx.translate(x, y);
  if (opt.rot) ctx.rotate(opt.rot);
  const path = (k) => {
    ctx.beginPath();
    ctx.moveTo(-w / 2 * k, h / 2 * k);
    ctx.lineTo(-w / 2 * k, -h * 0.05 * k);
    ctx.quadraticCurveTo(0, -h * 0.75 * k, w / 2 * k, -h * 0.05 * k);
    ctx.lineTo(w / 2 * k, h / 2 * k);
    ctx.closePath();
  };
  if (!opt.noShadow) {
    ctx.fillStyle = 'rgba(90,45,15,0.2)';
    ctx.beginPath();
    ctx.ellipse(3, h / 2 + 3, w * 0.55, s * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = css(crust);
  path(1);
  ctx.fill();
  const g = ctx.createRadialGradient(-w * 0.15, -h * 0.1, 2, 0, 0, w * 0.6);
  g.addColorStop(0, css(shade(CRUMB, 0.2)));
  g.addColorStop(1, CRUMB);
  ctx.fillStyle = g;
  path(0.86);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,70,30,0.4)';
  const pts = [[-0.2, 0.1], [0.15, 0.2], [0.05, -0.1], [-0.3, 0.3], [0.3, 0.05], [-0.05, 0.32], [0.25, 0.32]];
  for (const [px, py] of pts) {
    ctx.beginPath();
    ctx.arc(px * w, py * h, s * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
  // morceau de banane
  ctx.fillStyle = 'rgba(245,215,120,0.85)';
  ctx.beginPath();
  ctx.ellipse(-w * 0.1, h * 0.05, s * 0.06, s * 0.04, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBBIcon(ctx, x, y, s) {
  drawBBSlice(ctx, x, y + s * 0.05, s * 0.62, { noShadow: true });
}

// Tasse vue de dessus. opt: { art (0..1 cœur), fill (0..1), crema }
export function drawLatte(ctx, x, y, s, opt = {}) {
  const r = s * 0.36;
  ctx.save();
  ctx.translate(x, y);
  if (!opt.noSaucer) {
    ctx.fillStyle = 'rgba(90,45,15,0.18)';
    ctx.beginPath(); ctx.arc(4, 6, s * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7f2ea';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(190,170,140,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.stroke();
  }
  // anse
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, r * 0.8, -s * 0.06, s * 0.2, s * 0.12, s * 0.05);
  ctx.fill();
  // tasse
  ctx.fillStyle = 'rgba(90,45,15,0.15)';
  ctx.beginPath(); ctx.arc(2, 4, r + s * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, 0, r + s * 0.05, 0, Math.PI * 2); ctx.fill();
  // café / crema
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
  g.addColorStop(0, opt.color0 || '#c48a52');
  g.addColorStop(0.7, opt.color1 || '#a0632f');
  g.addColorStop(1, opt.color2 || '#6e3d1a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  if (opt.art) drawHeartArt(ctx, 0, r * 0.05, r * 0.62 * (opt.artSize || 1), opt.art);
  ctx.restore();
}

// Cœur de latte art : k = 0 rond de lait, k = 1 cœur fini
export function drawHeartArt(ctx, x, y, r, k = 1, color = '#fff8ec') {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  if (k <= 0.01) {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  } else {
    // interpolation cercle -> cœur
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      // cercle
      const cx = Math.sin(t) * r, cy = -Math.cos(t) * r;
      // cœur paramétrique (pointe en bas)
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const sc = r / 15;
      const px = lerp(cx, hx * sc, k), py = lerp(cy, hy * sc + r * 0.1, k);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.25, r * 0.12, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawLatteIcon(ctx, x, y, s) {
  drawLatte(ctx, x, y, s * 0.85, { art: 1, noSaucer: true });
}

// Bol en céramique vu de dessus ; retourne le rayon intérieur
export function drawBowl(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(90,45,15,0.22)';
  ctx.beginPath(); ctx.arc(x + 6, y + 10, r * 1.12, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.2, x, y, r * 1.12);
  g.addColorStop(0, '#fbf6ee');
  g.addColorStop(1, '#d9e4e6');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * 1.12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#9fc3c9';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y, r * 1.06, 0, Math.PI * 2); ctx.stroke();
  const ig = ctx.createRadialGradient(x + r * 0.2, y + r * 0.3, r * 0.1, x, y, r);
  ig.addColorStop(0, '#ffffff');
  ig.addColorStop(1, '#e3e6e2');
  ctx.fillStyle = ig;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  return r;
}
