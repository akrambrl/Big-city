// Mélanger : tracer des cercles au doigt dans le bol.
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { live } from '../live/live.js';
import { clamp, mix, css, rand, shade } from '../core/util.js';
import { drawBowl } from '../render/cafe.js';

export class Mix extends Step {
  constructor(prod, ui, opt = {}) {
    super(prod, ui);
    this.title = opt.title || 'Mélanger';
    this.hintText = 'Fais des cercles avec ton doigt dans le bol';
    this.live = 'mix';
    this.turns = opt.turns || 5;
    this.final = opt.color || '#d9b679';
    this.r = Math.min(130, this.areaH * 0.32);
    this.angle = 0; // total parcouru
    this.stir = 0; // rotation visuelle
    this.drag = null;
    this.radii = [];
    this.nextGlop = Math.PI;
    this.patches = opt.patches || [
      { a: 0.3, d: 0.45, c: '#ecd58a', s: 0.45 }, // bananes
      { a: 2.4, d: 0.45, c: '#fbf7ef', s: 0.42 }, // farine
      { a: 4.2, d: 0.5, c: '#f2a530', s: 0.16 }, // jaune d'œuf
      { a: 4.8, d: 0.35, c: '#f2a530', s: 0.14 },
      { a: 1.3, d: 0.15, c: '#b97a3c', s: 0.22 }, // sucre roux
    ];
  }

  progress() { return clamp(this.angle / (this.turns * Math.PI * 2)); }

  down(p) {
    if (this.done) return;
    this.drag = { a: Math.atan2(p.y - this.cy, p.x - this.cx), x: p.x, y: p.y, t: p.t };
  }

  move(p) {
    const d = this.drag;
    if (!d || this.done) return;
    const dx = p.x - this.cx, dy = p.y - this.cy;
    const rr = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    let da = Math.atan2(Math.sin(a - d.a), Math.cos(a - d.a));
    const dt = Math.max(1, p.t - d.t) / 1000;
    d.a = a; d.t = p.t;
    d.x = p.x; d.y = p.y;
    if (rr < this.r * 0.18 || rr > this.r * 1.2) { audio.loopSet('mix', 0); return; }
    this.angle += Math.abs(da);
    this.stir += da;
    this.radii.push(rr);
    const speed = (Math.abs(da) * rr) / dt;
    audio.loopSet('mix', clamp(speed / 900) * 0.7, 200 + clamp(speed / 900) * 400, { brownNoise: true, f: 250 });
    if (this.angle > this.nextGlop) {
      this.nextGlop += Math.PI;
      audio.glop();
      haptics.tap(8);
      live.react('small', 0.12);
    }
    if (Math.random() < 0.05) particles.spawn({ x: p.x, y: p.y, vx: rand(-40, 40), vy: rand(-80, -30), life: 0.4, size: 2.5, color: css(mix(this.final, '#ffffff', 0.2)), grav: 300 });
    if (this.progress() >= 1) this.end();
  }

  up() {
    this.drag = null;
    audio.loopSet('mix', 0);
  }

  end() {
    if (this.done) return;
    this.drag = null;
    audio.loopSet('mix', 0);
    const m = this.radii.reduce((s, v) => s + v, 0) / Math.max(1, this.radii.length);
    const sd = Math.sqrt(this.radii.reduce((s, v) => s + (v - m) * (v - m), 0) / Math.max(1, this.radii.length));
    const score = clamp(1.12 - (sd / Math.max(1, m)) * 1.6, 0.5, 1);
    this.prod.mix = score;
    audio.sparkle();
    particles.sparkle(this.cx, this.cy, 14, 120);
    this.finish(score, 'Pâte homogène !');
  }

  draw(ctx) {
    const { cx, cy, r } = this;
    const prog = this.progress();
    drawBowl(ctx, cx, cy, r);
    const base = mix('#efe3c8', this.final, prog);
    ctx.fillStyle = css(base);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2); ctx.clip();
    // ingrédients qui tournent et se fondent
    for (const p of this.patches) {
      const a = p.a + this.stir * 0.5;
      const k = 1 - prog;
      if (k <= 0.02) continue;
      ctx.globalAlpha = k;
      ctx.fillStyle = p.c;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * p.d * r, cy + Math.sin(a) * p.d * r);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s * r * (1 + prog * 1.5), p.s * r * (1 - prog * 0.6), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // traînées de spirale
    ctx.strokeStyle = css(shade(base, -0.12), 0.5);
    ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const a = this.stir * 0.8 + k * 2.1 + t * 4;
        const rr = r * (0.15 + t * 0.7);
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.08, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // spatule
    const d = this.drag;
    const sx = d ? d.x : cx + Math.cos(this.t * 2.2) * r * 0.55;
    const sy = d ? d.y : cy + Math.sin(this.t * 2.2) * r * 0.55;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-0.5);
    ctx.globalAlpha = d ? 1 : 0.85;
    ctx.fillStyle = 'rgba(80,40,10,0.2)';
    ctx.beginPath(); ctx.ellipse(4, 6, 14, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9a466';
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-4, -100, 8, 82);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-2, -98, 3, 78);
    ctx.restore();
    if (!d && this.angle === 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
