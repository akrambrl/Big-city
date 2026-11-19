// Café 3 — Latte art : verser un rond de lait, puis le tirer en cœur d'un swipe.
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { live } from '../live/live.js';
import { clamp, tween, ease } from '../core/util.js';
import { drawLatte, drawHeartArt } from '../render/cafe.js';
import { drawArrow } from './common.js';

export class LatteArt extends Step {
  constructor(prod, ui) {
    super(prod, ui);
    this.title = 'Latte art';
    this.hintText = 'Maintiens pour verser le lait, relâche sur le cercle';
    this.live = 'art';
    this.size = Math.min(300, this.areaH * 0.66);
    this.cupR = this.size * 0.36;
    this.target = this.cupR * 0.42;
    this.blob = 0;
    this.k = 0;
    this.phase = 'pour';
    this.holding = false;
    this.drag = null;
    this.sizeScore = 0;
  }

  progress() { return this.phase === 'pour' ? clamp(this.blob / this.target) * 0.6 : this.phase === 'pull' ? 0.6 : 1; }

  down(p) {
    if (this.done) return;
    if (this.phase === 'pour') {
      this.holding = true;
      haptics.tap(8);
    } else if (this.phase === 'pull') {
      this.drag = { x0: p.x, y0: p.y, minY: p.y, maxY: p.y, xs: [p.x] };
    }
  }

  move(p) {
    if (this.drag) {
      this.drag.minY = Math.min(this.drag.minY, p.y);
      this.drag.maxY = Math.max(this.drag.maxY, p.y);
      this.drag.xs.push(p.x);
      audio.brushSet(400);
    }
  }

  up(p) {
    if (this.phase === 'pour' && this.holding) {
      this.holding = false;
      audio.loopSet('milk', 0);
      if (this.blob < this.target * 0.3) { this.ui.setHint('Verse encore un peu…'); return; }
      this.sizeScore = clamp(1 - Math.max(0, Math.abs(this.blob - this.target) - this.target * 0.08) / (this.target * 0.6), 0.2, 1);
      this.phase = 'pull';
      audio.pop(1.2);
      this.ui.setHint('Swipe vers le bas à travers le rond pour dessiner le cœur');
      return;
    }
    const d = this.drag;
    if (this.phase === 'pull' && d) {
      this.drag = null;
      audio.brushSet(0);
      const span = d.maxY - d.minY;
      const midX = d.xs.reduce((s, v) => s + v, 0) / d.xs.length;
      if (span < this.blob * 1.3 || p.y < d.y0) {
        audio.boing();
        return;
      }
      const center = clamp(1 - Math.abs(midX - this.cx) / 45, 0.2, 1);
      const score = clamp(0.65 * this.sizeScore + 0.35 * center);
      this.prod.art = score;
      this.phase = 'done';
      audio.whoosh();
      tween(this, { k: 1 }, 0.4, ease.outBack).then(() => {
        audio.sparkle();
        haptics.pattern([15, 30, 15]);
        particles.sparkle(this.cx, this.cy, 16, 140);
        live.react('step', score);
        setTimeout(() => this.finish(score, score > 0.85 ? 'Un cœur parfait 💛' : 'Joli cœur'), 450);
      });
    }
  }

  update(dt) {
    super.update(dt);
    if (this.holding) {
      this.blob += dt * this.target * 0.55;
      audio.loopSet('milk', 0.22, 900 + Math.sin(this.t * 6) * 100, { brownNoise: true, f: 900 });
      if (Math.random() < dt * 3) live.react('small', 0.05);
      if (this.blob > this.cupR * 0.95) {
        this.holding = false;
        audio.loopSet('milk', 0);
        this.sizeScore = 0.2;
        this.phase = 'pull';
        audio.boing();
        this.ui.setHint('Oups, beaucoup de lait ! Swipe vers le bas pour le cœur');
      }
    }
  }

  draw(ctx) {
    const { cx, cy } = this;
    drawLatte(ctx, cx, cy, this.size, {});
    if (this.blob > 0) drawHeartArt(ctx, cx, cy, this.blob, this.k);
    if (this.phase === 'pour') {
      ctx.setLineDash([7, 7]);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, this.target, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // pichet qui verse
      ctx.save();
      ctx.translate(cx + 50, cy - this.cupR - 30);
      ctx.rotate(this.holding ? -0.7 : -0.2);
      const g = ctx.createLinearGradient(-30, 0, 30, 0);
      g.addColorStop(0, '#9aa1aa'); g.addColorStop(0.4, '#eef1f4'); g.addColorStop(1, '#8e959e');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-30, -40); ctx.lineTo(34, -46); ctx.lineTo(28, 30); ctx.lineTo(-28, 30); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (this.holding) {
        ctx.strokeStyle = '#fff8ec';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx + 20, cy - this.cupR - 50); ctx.quadraticCurveTo(cx + 4, cy - 40, cx, cy - 4); ctx.stroke();
      }
    } else if (this.phase === 'pull' && !this.drag) {
      drawArrow(ctx, cx, cy - this.blob - 30, this.t, 1, this.blob * 2);
    }
  }
}
