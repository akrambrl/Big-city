import { clamp } from '../core/util.js';

// Bouton rond « maintiens appuyé » dessiné dans le canvas
export function drawHoldButton(ctx, x, y, t, holding, prog, icon = '🔥') {
  const r = 38;
  const press = holding ? 3 : 0;
  ctx.fillStyle = 'rgba(80,40,10,0.25)';
  ctx.beginPath(); ctx.arc(x, y + 6 - press, r, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(0, y - r, 0, y + r);
  g.addColorStop(0, holding ? '#ff9a4a' : '#f0a24a');
  g.addColorStop(1, holding ? '#e0571f' : '#d97f24');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y + press, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  if (prog > 0) {
    ctx.beginPath();
    ctx.arc(x, y + press, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(prog));
    ctx.stroke();
  }
  if (!holding) {
    const k = (t * 1.2) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r + 6 + k * 18, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.font = '28px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, y + press + 1);
  ctx.textBaseline = 'alphabetic';
}

// Régularité d'une suite de taps -> score 0..1
export function rhythmScore(times) {
  const iv = [];
  for (let i = 1; i < times.length; i++) iv.push(times[i] - times[i - 1]);
  if (!iv.length) return 0.8;
  const m = iv.reduce((s, v) => s + v, 0) / iv.length;
  const sd = Math.sqrt(iv.reduce((s, v) => s + (v - m) * (v - m), 0) / iv.length);
  let score = clamp(1.12 - (sd / Math.max(1, m)) * 1.1, 0.45, 1);
  if (m > 900) score *= 0.85;
  return score;
}

// Flèche d'aide animée (dir: 1 = vers le bas, -1 = vers le haut)
export function drawArrow(ctx, x, y, t, dir = 1, travel = 70) {
  const k = (t * 1.1) % 1;
  const ay = y + dir * k * travel;
  ctx.save();
  ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
  ctx.fillStyle = '#fff';
  ctx.translate(x, ay);
  ctx.scale(1, dir);
  ctx.beginPath();
  ctx.moveTo(0, 24);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-7, -24);
  ctx.lineTo(7, -24);
  ctx.lineTo(7, 0);
  ctx.lineTo(20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Zone cible verticale (jauge) : renvoie rien, dessine une petite règle
export function drawZoneMarks(ctx, x, yTop, yBot, zone, label = '') {
  const y0 = yBot - (yBot - yTop) * zone[1];
  const y1 = yBot - (yBot - yTop) * zone[0];
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(x - 6, y0); ctx.lineTo(x + 26, y0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 6, y1); ctx.lineTo(x + 26, y1); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x - 6, y0, 32, y1 - y0);
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = '600 12px Fredoka, ui-rounded, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 30, (y0 + y1) / 2 + 4);
  }
}
