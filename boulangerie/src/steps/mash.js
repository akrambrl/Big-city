// Banana bread 1 — Écraser les bananes à la fourchette (taps).
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { live } from '../live/live.js';
import { clamp, rand, mix, css } from '../core/util.js';
import { drawBowl } from '../render/cafe.js';
import { rhythmScore } from './common.js';

export class Mash extends Step {
  constructor(prod, ui, opt = {}) {
    super(prod, ui);
    this.title = 'Écraser les bananes';
    this.hintText = 'Tapote les bananes pour les écraser à la fourchette';
    this.live = 'mash';
    this.per = opt.taps || 6;
    this.r = Math.min(130, this.areaH * 0.32);
    this.bananas = [
      { a: -0.5, x: -0.25, y: -0.3, m: 0, sq: 0 },
      { a: 0.35, x: 0.22, y: -0.05, m: 0, sq: 0 },
      { a: -0.15, x: -0.1, y: 0.35, m: 0, sq: 0 },
    ];
    this.marks = [];
    this.times = [];
    this.lumps = Array.from({ length: 22 }, () => ({ a: rand(0, 6.28), d: rand(0, 0.8), s: rand(3, 7) }));
  }

  total() { return this.bananas.reduce((s, b) => s + b.m, 0) / this.bananas.length; }
  progress() { return this.total(); }

  down(p) {
    if (this.done) return;
    const { cx, cy, r } = this;
    if (Math.hypot(p.x - cx, p.y - cy) > r * 1.15) return;
    // banane la plus proche pas encore écrasée
    let best = null, bd = 1e9;
    for (const b of this.bananas) {
      if (b.m >= 1) continue;
      const d = Math.hypot(p.x - (cx + b.x * r), p.y - (cy + b.y * r));
      if (d < bd) { bd = d; best = b; }
    }
    if (!best) return;
    best.m = clamp(best.m + 1 / this.per);
    best.sq = 1;
    this.marks.push({ x: p.x, y: p.y, rot: rand(-0.4, 0.4), life: 1 });
    for (let i = 0; i < 8; i++) {
      const a = rand(0, Math.PI * 2), s = rand(60, 200);
      particles.spawn({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: rand(0.3, 0.6), size: rand(2, 4.5), color: '#f1d77c', grav: 600, drag: 0.1 });
    }
    audio.splat();
    haptics.tap(14);
    live.react('small', 0.15);
    this.times.push(p.t);
    if (best.m >= 1) {
      audio.pop(1.1);
      particles.sparkle(cx + best.x * r, cy + best.y * r, 6, 30);
    }
    if (this.total() >= 0.999) {
      const score = rhythmScore(this.times);
      this.prod.mash = score;
      particles.sparkle(cx, cy, 14, 120);
      setTimeout(() => this.finish(score, 'Purée bien lisse !'), 350);
    }
  }

  update(dt) {
    super.update(dt);
    for (const b of this.bananas) b.sq = Math.max(0, b.sq - dt * 6);
    for (const m of this.marks) m.life -= dt * 0.8;
    this.marks = this.marks.filter((m) => m.life > 0);
  }

  draw(ctx) {
    const { cx, cy, r } = this;
    drawBowl(ctx, cx, cy, r);
    const tot = this.total();
    // purée qui s'étale
    if (tot > 0) {
      const pr = r * (0.35 + 0.55 * tot);
      ctx.fillStyle = '#ecd58a';
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const rr = pr * (1 + Math.sin(a * 5 + 1) * 0.05 * (1 - tot));
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.fill();
      for (const l of this.lumps) {
        ctx.fillStyle = `rgba(250,232,160,${0.8 * (1 - tot * 0.7)})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(l.a) * l.d * pr, cy + Math.sin(l.a) * l.d * pr, l.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(cx - pr * 0.3, cy - pr * 0.35, pr * 0.3, pr * 0.1, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // bananes épluchées
    for (const b of this.bananas) {
      if (b.m >= 1) continue;
      const bx = cx + b.x * r, by = cy + b.y * r;
      const sq = b.sq * 0.25;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(b.a);
      ctx.scale(1 + b.m * 0.35 + sq, 1 - b.m * 0.6 - sq);
      const c = mix('#f5d96b', '#ecd58a', b.m);
      ctx.fillStyle = 'rgba(120,90,20,0.18)';
      ctx.beginPath(); ctx.ellipse(3, 8, 52, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css(c);
      ctx.beginPath();
      ctx.moveTo(-55, -2);
      ctx.quadraticCurveTo(0, -30, 55, -2);
      ctx.quadraticCurveTo(58, 8, 48, 10);
      ctx.quadraticCurveTo(0, -6, -48, 10);
      ctx.quadraticCurveTo(-58, 8, -55, -2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(170,120,30,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-40, -2); ctx.quadraticCurveTo(0, -18, 40, -2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.ellipse(-10, -12, 22, 3, -0.1, 0, Math.PI * 2); ctx.fill();
      // bouts bruns
      ctx.fillStyle = '#8a5a2a';
      ctx.beginPath(); ctx.arc(-53, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(53, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // traces de fourchette
    for (const m of this.marks) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      ctx.strokeStyle = `rgba(180,140,50,${0.5 * m.life})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = -1.5; i <= 1.5; i++) {
        ctx.beginPath(); ctx.moveTo(i * 7, -12); ctx.lineTo(i * 7, 12); ctx.stroke();
      }
      ctx.restore();
    }
    if (this.times.length === 0) {
      const k = (this.t * 1.3) % 1;
      const b = this.bananas[0];
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx + b.x * r, cy + b.y * r, 20 + k * 40, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
