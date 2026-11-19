// Particules : farine, miettes, étincelles, vapeur, fumée.
import { rand } from './util.js';

const list = [];
const MAX = 500;

export const particles = {
  list,
  spawn(p) {
    if (list.length >= MAX) list.shift();
    list.push({
      x: 0, y: 0, vx: 0, vy: 0, life: 1, max: 1, size: 4, grow: 0,
      color: '#fff', alpha: 1, grav: 0, drag: 0.9, rot: 0, vr: 0, type: 'dot',
      ...p,
      max: p.life ?? 1,
    });
  },

  flour(x, y, n = 12, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(40, 190) * power;
      this.spawn({
        x: x + rand(-6, 6), y: y + rand(-6, 6),
        vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - rand(20, 70),
        life: rand(0.5, 1.2), size: rand(1.5, 4.5), grow: rand(2, 7),
        color: '#fffaf0', alpha: rand(0.5, 0.95), grav: 30, drag: 0.04,
      });
    }
  },

  sparkle(x, y, n = 8, spread = 40, color = '#fff6c8') {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(30, 150);
      this.spawn({
        x: x + rand(-spread, spread) * 0.3, y: y + rand(-spread, spread) * 0.3,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: rand(0.4, 0.9), size: rand(4, 9), color, type: 'star',
        drag: 0.02, rot: rand(0, 3), vr: rand(-6, 6),
      });
    }
  },

  steam(x, y, w = 60) {
    this.spawn({
      x: x + rand(-w, w) * 0.5, y: y + rand(-6, 6),
      vx: rand(-10, 10), vy: rand(-55, -30),
      life: rand(1.2, 2.2), size: rand(10, 18), grow: rand(14, 26),
      color: '#ffffff', alpha: rand(0.18, 0.32), drag: 0.3, type: 'soft',
    });
  },

  smoke(x, y, w = 60) {
    this.spawn({
      x: x + rand(-w, w) * 0.5, y: y,
      vx: rand(-14, 14), vy: rand(-60, -35),
      life: rand(1.2, 2), size: rand(12, 20), grow: rand(20, 30),
      color: '#4a3b33', alpha: rand(0.25, 0.4), drag: 0.3, type: 'soft',
    });
  },

  crumbs(x, y, n = 8, color = '#d9963c') {
    for (let i = 0; i < n; i++) {
      this.spawn({
        x, y, vx: rand(-140, 140), vy: rand(-220, -80),
        life: rand(0.6, 1.1), size: rand(2, 4.5), color, grav: 700, drag: 0.02,
        rot: rand(0, 3), vr: rand(-10, 10), type: 'crumb',
      });
    }
  },

  confetti(x, y, n = 30) {
    const cols = ['#ff6f86', '#ffd166', '#f2a14c', '#8fd3c1', '#ffffff', '#c59cff'];
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI, 0);
      const s = rand(150, 420);
      this.spawn({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: rand(1.2, 2.2), size: rand(5, 9), color: cols[i % cols.length],
        grav: 420, drag: 0.6, rot: rand(0, 6), vr: rand(-12, 12), type: 'confetti',
      });
    }
  },

  update(dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) { list.splice(i, 1); continue; }
      const d = Math.pow(p.drag, dt);
      p.vx *= d;
      p.vy = p.vy * d + p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += p.grow * dt;
      p.rot += p.vr * dt;
    }
  },

  draw(ctx) {
    for (const p of list) {
      const k = p.life / p.max;
      const a = p.alpha * (p.type === 'star' || p.type === 'confetti' ? Math.min(1, k * 2) : k);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.type === 'star') {
        drawStar(ctx, p.x, p.y, p.size * (0.5 + k * 0.5), p.rot);
      } else if (p.type === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.type === 'crumb') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      } else if (p.type === 'soft') {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        if (p.color !== '#ffffff') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.globalAlpha = a * 0.6;
          ctx.fill();
        } else {
          ctx.fillStyle = g;
          ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },

  clear() { list.length = 0; },
};

export function drawStar(ctx, x, y, r, rot = 0, points = 4, inner = 0.38) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = rot + (i * Math.PI) / points;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
