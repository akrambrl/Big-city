// Dessin des viennoiseries en code, avec niveau de cuisson et dorure.
import { mix, shade, css, clamp, lerp } from '../core/util.js';

// Couleur de la pâte selon la cuisson (0 = crue, 0.7 = doré parfait, 1 = brûlé)
const BAKE_STOPS = [
  [0, '#f4ddb0'],
  [0.3, '#f2cf8d'],
  [0.5, '#ecb25a'],
  [0.7, '#d98a2c'],
  [0.82, '#b8641e'],
  [0.92, '#7a3d14'],
  [1, '#3a2010'],
];
export function bakeColor(b) {
  b = clamp(b, 0, 1);
  for (let i = 1; i < BAKE_STOPS.length; i++) {
    if (b <= BAKE_STOPS[i][0]) {
      const [a0, c0] = BAKE_STOPS[i - 1];
      const [a1, c1] = BAKE_STOPS[i];
      return mix(c0, c1, (b - a0) / (a1 - a0));
    }
  }
  return mix('#3a2010', '#3a2010', 0);
}

// Géométrie : 7 « rouleaux » disposés en arc, plus épais au centre.
// Tout est en unités de s (largeur ≈ 0.85 s), centré sur (0, 0).
export function croissantSegments(s, puff = 0) {
  const segs = [];
  const n = 7;
  const R = s * 0.4;
  const span = 1.22; // demi-angle de l'arc
  const step = (2 * span) / (n - 1);
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * 2 - 1;
    const a = t * span;
    const x = Math.sin(a) * R * 1.08;
    const y = R * 0.6 - Math.cos(a) * R + s * 0.07;
    const tt = Math.abs(t);
    const k = 1 + puff * 0.16;
    // épaisseur radiale : ventru au centre, effilé aux pointes
    const ry = s * 0.185 * (1 - 0.7 * Math.pow(tt, 1.5)) * k;
    // largeur le long de l'arc : les rouleaux se chevauchent bien
    const rx = R * step * (0.82 - 0.22 * tt) * (1 + puff * 0.06);
    segs.push({ x, y, rx, ry, rot: a, t });
  }
  // dessiner des pointes vers le centre
  return segs.sort((p, q) => Math.abs(q.t) - Math.abs(p.t));
}

/**
 * opt: { bake, puff, glaze (mask canvas), glazeBox, solid, shine, alpha }
 */
export function drawCroissant(ctx, x, y, s, opt = {}) {
  const bake = opt.bake ?? 0;
  const puff = opt.puff ?? 0;
  const segs = croissantSegments(s, puff);
  ctx.save();
  ctx.translate(x, y);
  if (opt.rot) ctx.rotate(opt.rot);
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;

  if (opt.solid) {
    ctx.fillStyle = opt.solid;
    for (const g of segs) {
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, g.rx, g.ry, g.rot, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // ombre portée
  if (!opt.noShadow) {
    ctx.fillStyle = 'rgba(90,45,15,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.2, s * 0.44, s * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sans dorure à l'œuf, la croûte reste plus pâle et mate
  const matte = opt.glaze ? 0.86 : 1;
  for (const g of segs) {
    const local = clamp(bake * matte * (1 + 0.14 * Math.abs(g.t)));
    const base = bakeColor(local);
    const hi = shade(base, 0.32);
    const lo = shade(base, -0.28);
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot);
    const grad = ctx.createRadialGradient(-g.rx * 0.3, -g.ry * 0.45, g.ry * 0.05, 0, 0, g.ry * 1.05);
    grad.addColorStop(0, css(hi));
    grad.addColorStop(0.55, css(base));
    grad.addColorStop(1, css(lo));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, g.rx, g.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // jointure entre les rouleaux
    ctx.strokeStyle = css(shade(base, -0.4), 0.45);
    ctx.lineWidth = s * 0.012;
    ctx.beginPath();
    ctx.ellipse(0, 0, g.rx, g.ry, 0, Math.PI * 0.62, Math.PI * 1.38);
    ctx.stroke();
    // feuilletage : petites lignes sur le dessus
    ctx.strokeStyle = css(shade(base, -0.2), 0.35);
    ctx.lineWidth = s * 0.006;
    for (let k = -1; k <= 1; k += 2) {
      ctx.beginPath();
      ctx.ellipse(0, g.ry * 0.05, g.rx * 0.55, g.ry * 0.8, 0, -Math.PI / 2 - 0.5 * k, -Math.PI / 2 + 0.2 * k, k < 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Dorure : couche brillante qui suit la cuisson
  if (opt.glaze) drawGlaze(ctx, s, opt.glaze, opt.glazeBox || 0.7, bake);

  // Reflets brillants (dessus des rouleaux)
  const gloss = (opt.glaze ? 0.28 : 0.1) + (opt.shine || 0);
  ctx.fillStyle = `rgba(255,250,235,${gloss})`;
  for (const g of segs) {
    if (Math.abs(g.t) > 0.9) continue;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot);
    ctx.beginPath();
    ctx.ellipse(-g.rx * 0.2, -g.ry * 0.5, g.rx * 0.32, g.ry * 0.16, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Teinte du masque de dorure (blanc) selon la cuisson
let tmp = null;
function drawGlaze(ctx, s, mask, box, bake) {
  if (!tmp) tmp = document.createElement('canvas');
  if (tmp.width !== mask.width) { tmp.width = mask.width; tmp.height = mask.height; }
  const t = tmp.getContext('2d');
  t.globalCompositeOperation = 'source-over';
  t.clearRect(0, 0, tmp.width, tmp.height);
  t.drawImage(mask, 0, 0);
  t.globalCompositeOperation = 'source-in';
  const raw = [245, 190, 70];
  const baked = shade(bakeColor(clamp(bake * 1.08)), -0.06);
  const c = bake < 0.15 ? raw : mix(raw, baked, clamp((bake - 0.15) / 0.4));
  t.fillStyle = css(c);
  t.fillRect(0, 0, tmp.width, tmp.height);
  const size = s * box * 2;
  ctx.globalAlpha *= lerp(0.5, 0.62, clamp(bake));
  ctx.drawImage(tmp, -size / 2, -size / 2, size, size);
  ctx.globalAlpha /= lerp(0.5, 0.62, clamp(bake));
}

// Mini-croissant pour les bulles et icônes
export function drawCroissantIcon(ctx, x, y, s) {
  drawCroissant(ctx, x, y, s, { bake: 0.7, puff: 1, noShadow: true, shine: 0.1 });
}
