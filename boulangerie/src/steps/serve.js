// Service : couper une tranche de gâteau, ou prendre une viennoiserie en vitrine.
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { shake } from '../core/stage.js';
import { live } from '../live/live.js';
import { clamp, tween, ease, dist } from '../core/util.js';
import { roundRect, drawTray } from '../render/scenery.js';
import { drawBananaBread, drawBBSlice } from '../render/cafe.js';
import { drawCroissant } from '../render/pastries.js';

function drawPlate(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(90,45,15,0.2)';
  ctx.beginPath(); ctx.ellipse(x + 4, y + 8, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fdfaf4';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(200,170,130,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y - 1, r * 0.72, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
}

// Couper une tranche : swipe vertical sur le repère
export class Slice extends Step {
  constructor(prod, ui, opt = {}) {
    super(prod, ui);
    this.title = 'Couper une tranche';
    this.hintText = 'Swipe vers le bas sur le pointillé pour couper';
    this.live = 'slice';
    this.total = opt.slices || 8;
    this.left = opt.left ?? this.total; // tranches restantes avant la coupe
    this.bake = opt.bake ?? 0.7;
    this.s = 300;
    this.x0 = this.cx - this.s / 2 - 30;
    this.loafY = this.cy - 30;
    this.drag = null;
    this.knifeX = null;
    this.cut = null; // { x, w }
    this.piece = { x: 0, y: 0, rot: 0, s: 1 };
    this.plate = { x: this.cx + 80, y: this.cy + this.areaH * 0.3 };
  }

  get len() { return this.left / this.total; }
  get x1() { return this.x0 + this.s * this.len; }
  get guide() { return this.x1 - this.s / this.total; }
  progress() { return this.cut ? 1 : 0; }

  down(p) {
    if (this.cut || this.done) return;
    this.drag = { x0: p.x, y0: p.y, maxY: p.y, xAtMid: null };
    this.knifeX = p.x;
  }
  move(p) {
    const d = this.drag;
    if (!d) return;
    this.knifeX = p.x;
    d.maxY = Math.max(d.maxY, p.y);
    if (d.xAtMid === null && p.y > this.loafY) d.xAtMid = p.x;
  }
  up() {
    const d = this.drag;
    this.drag = null;
    if (!d || this.cut) return;
    const h = this.s * 0.42;
    if (d.y0 > this.loafY - h * 0.2 || d.maxY < this.loafY + h * 0.3 || d.xAtMid === null) {
      if (d.maxY - d.y0 > 20) audio.boing();
      return;
    }
    const sw = this.s / this.total;
    const x = clamp(d.xAtMid, this.x1 - sw * 2, this.x1 - sw * 0.35);
    const score = clamp(1 - Math.abs(x - this.guide) / (sw * 0.8), 0.2, 1);
    this.prod.slice = score;
    this.cut = { x, w: this.x1 - x };
    audio.knife();
    haptics.pattern([10, 20, 30]);
    shake(2);
    particles.crumbs(x, this.loafY - 10, 8, '#a8642a');
    const sc = (this.cut.w / sw);
    this.piece = { x: x + this.cut.w / 2, y: this.loafY, rot: 0, s: sc };
    tween(this.piece, { rot: 0.25 }, 0.2).then(async () => {
      await tween(this.piece, { x: this.plate.x, y: this.plate.y - 26, rot: 0 }, 0.45, ease.outCubic);
      audio.clink();
      haptics.tap(12);
      particles.sparkle(this.plate.x, this.plate.y - 20, 8, 60);
      live.react('step', score);
      setTimeout(() => this.finish(score, score > 0.85 ? 'Tranche parfaite !' : sc > 1.2 ? 'Grosse tranche !' : 'Petite tranche'), 350);
    });
  }

  draw(ctx) {
    const h = this.s * 0.42;
    // planche à découper
    ctx.fillStyle = 'rgba(80,40,10,0.25)';
    roundRect(ctx, this.x0 - 20 + 6, this.loafY + h * 0.4, this.s + 70, 34, 12);
    ctx.fill();
    ctx.fillStyle = '#c98c55';
    roundRect(ctx, this.x0 - 20, this.loafY + h * 0.38, this.s + 70, 28, 12);
    ctx.fill();
    drawPlate(ctx, this.plate.x, this.plate.y, 70);
    const len = this.cut ? (this.cut.x - this.x0) / this.s : this.len;
    drawBananaBread(ctx, this.x0 + this.s / 2, this.loafY, this.s, { bake: this.bake, len: Math.min(1, len) - 0.0001, noShadow: true });
    if (!this.cut) {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(this.guide, this.loafY - h * 0.9); ctx.lineTo(this.guide, this.loafY + h * 0.55); ctx.stroke();
      ctx.setLineDash([]);
    } else {
      drawBBSlice(ctx, this.piece.x, this.piece.y, 70 * Math.min(1.6, this.piece.s * 0.9 + 0.1), { bake: this.bake, rot: this.piece.rot });
    }
    // couteau
    if (!this.cut) {
      const kx = this.knifeX ?? this.guide;
      const ky = this.drag ? Math.min(this.drag.maxY, this.loafY + h * 0.4) - 40 : this.loafY - h - 30 + Math.sin(this.t * 3) * 4;
      ctx.save();
      ctx.translate(kx, ky);
      ctx.fillStyle = '#3d3532';
      roundRect(ctx, -7, -70, 14, 48, 6);
      ctx.fill();
      const g = ctx.createLinearGradient(-8, 0, 8, 0);
      g.addColorStop(0, '#c9ced4'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#9aa1aa');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(6, -22); ctx.lineTo(4, 40); ctx.lineTo(-6, 34); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
}

// Prendre une viennoiserie sur la plaque et la poser dans l'assiette
export class Pick extends Step {
  constructor(prod, ui, opt = {}) {
    super(prod, ui);
    this.title = 'Servir un croissant';
    this.hintText = 'Glisse un croissant de la plaque vers l\'assiette';
    this.live = 'shape';
    this.count = Math.max(1, opt.left || 1);
    this.bake = opt.bake ?? 0.7;
    this.trayY = this.cy - this.areaH * 0.2;
    this.plate = { x: this.cx, y: this.cy + this.areaH * 0.26 };
    this.items = [];
    const n = Math.min(6, this.count);
    for (let i = 0; i < n; i++) {
      this.items.push({ x: this.cx - 110 + (i % 3) * 110, y: this.trayY - 30 + Math.floor(i / 3) * 70, home: null });
    }
    this.items.forEach((it) => (it.home = { x: it.x, y: it.y }));
    this.drag = null;
    this.done2 = false;
  }

  progress() { return this.done2 ? 1 : 0; }

  down(p) {
    if (this.done2) return;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (dist(p.x, p.y, it.x, it.y) < 55) {
        this.drag = { it, ox: it.x - p.x, oy: it.y - p.y, tx: it.x, ty: it.y };
        audio.crackle(0.5, 0.12);
        haptics.tap(10);
        return;
      }
    }
  }
  move(p) {
    if (!this.drag) return;
    this.drag.tx = p.x + this.drag.ox;
    this.drag.ty = p.y + this.drag.oy;
  }
  up() {
    const d = this.drag;
    this.drag = null;
    if (!d) return;
    const dd = dist(d.it.x, d.it.y, this.plate.x, this.plate.y - 14);
    if (dd < 90) {
      this.done2 = true;
      tween(d.it, { x: this.plate.x, y: this.plate.y - 14 }, 0.15).then(() => {
        audio.clink();
        audio.crackle(0.8, 0.2);
        haptics.tap(15);
        particles.crumbs(this.plate.x, this.plate.y - 10, 6);
        particles.sparkle(this.plate.x, this.plate.y - 20, 8, 60);
        setTimeout(() => this.finish(1, 'Servi !'), 300);
      });
    } else {
      tween(d.it, { x: d.it.home.x, y: d.it.home.y }, 0.35, ease.outBack);
    }
  }
  update(dt) {
    super.update(dt);
    if (this.drag) {
      this.drag.it.x += (this.drag.tx - this.drag.it.x) * Math.min(1, dt * 18);
      this.drag.it.y += (this.drag.ty - this.drag.it.y) * Math.min(1, dt * 18);
    }
  }
  draw(ctx) {
    drawTray(ctx, this.cx, this.trayY, 360, 170);
    drawPlate(ctx, this.plate.x, this.plate.y, 90);
    for (const it of this.items) {
      if (it === this.drag?.it) continue;
      drawCroissant(ctx, it.x, it.y, 95, { bake: this.bake, puff: 1 });
    }
    if (this.drag) drawCroissant(ctx, this.drag.it.x, this.drag.it.y - 6, 102, { bake: this.bake, puff: 1 });
  }
}
