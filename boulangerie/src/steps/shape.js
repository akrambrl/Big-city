// Étape 3 — Façonnage : on roule le triangle en glissant vers le bas,
// puis on dépose le croissant au bon endroit sur la plaque.
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { shake } from '../core/stage.js';
import { live } from '../live/live.js';
import { clamp, rand, tween, ease, dist } from '../core/util.js';
import { drawCroissant } from '../render/pastries.js';
import { drawTray, roundRect } from '../render/scenery.js';

export class Shape extends Step {
  constructor(prod, ui) {
    super(prod, ui);
    this.title = 'Façonnage';
    this.hintText = 'Glisse vers le bas pour rouler le croissant';
    this.live = 'shape';
    this.phase = 'roll';
    this.prog = 0;
    this.strokes = 0;
    this.drag = null;
    this.baseW = 250;
    this.triH = Math.min(280, this.areaH * 0.62);
    this.y0 = this.cy - this.triH / 2 - 10;
    this.lastTick = 0;
    this.c = { x: 0, y: 0, s: 150, scale: 1, lift: 0 };
    const th = Math.min(180, this.areaH * 0.36);
    this.tray = { x: this.cx, y: Math.min(this.cy + this.areaH * 0.22, this.cy + this.areaH / 2 - th / 2 - 6), w: 330, h: th };
    this.spot = { x: this.cx + rand(-60, 60), y: this.tray.y + 4 };
    this.home = { x: this.cx, y: this.cy - this.areaH * 0.2 };
    this.misses = 0;
  }

  progress() {
    return this.phase === 'roll' ? this.prog * 0.6 : this.phase === 'place' ? 0.6 : 1;
  }

  down(p) {
    if (this.phase === 'roll') {
      this.drag = { y: p.y };
      this.strokes++;
    } else if (this.phase === 'place') {
      if (dist(p.x, p.y, this.c.x, this.c.y) < 95) {
        this.drag = { ox: this.c.x - p.x, oy: this.c.y - p.y, tx: this.c.x, ty: this.c.y };
        this.c.lift = 1;
        audio.pop(0.7);
        haptics.tap(10);
      }
    }
  }

  move(p) {
    const d = this.drag;
    if (!d) return;
    if (this.phase === 'roll') {
      const dy = p.y - d.y;
      d.y = p.y;
      if (dy > 0) {
        this.prog = clamp(this.prog + (dy / this.triH) * 1.15);
        audio.rollSet(dy * 60);
        if (this.prog - this.lastTick > 0.1) {
          this.lastTick = this.prog;
          audio.squeak();
          haptics.tap(8);
          particles.flour(this.cx + rand(-100, 100), this.y0 + this.prog * this.triH, 3, 0.4);
        }
        if (this.prog >= 1) this.formed();
      }
    } else if (this.phase === 'place') {
      d.tx = p.x + d.ox;
      d.ty = p.y + d.oy;
    }
  }

  up() {
    const d = this.drag;
    this.drag = null;
    audio.rollSet(0);
    if (!d || this.phase !== 'place') return;
    this.c.lift = 0;
    const dd = dist(this.c.x, this.c.y, this.spot.x, this.spot.y);
    if (dd < 75) {
      this.phase = 'placed';
      const place = clamp(1 - (dd / 75) * 0.6);
      const roll = this.strokes <= 1 ? 1 : this.strokes === 2 ? 0.95 : this.strokes === 3 ? 0.88 : 0.78;
      const score = clamp(0.45 * roll + 0.55 * place - this.misses * 0.08, 0.3, 1);
      this.prod.shape = score;
      tween(this.c, { x: this.spot.x, y: this.spot.y }, 0.18, ease.outCubic).then(() => {
        audio.thud(0.6);
        audio.pop(1.3);
        haptics.tap(20);
        shake(3);
        particles.sparkle(this.spot.x, this.spot.y, 12, 80);
        particles.flour(this.spot.x, this.spot.y + 20, 8, 0.6);
        live.react('step', score);
        setTimeout(() => this.finish(score, dd < 20 ? 'Pile au centre !' : 'Bien placé'), 400);
      });
    } else {
      this.misses++;
      audio.boing();
      tween(this.c, { x: this.home.x, y: this.home.y }, 0.4, ease.outBack);
    }
  }

  async formed() {
    this.phase = 'pop';
    this.drag = null;
    audio.rollSet(0);
    audio.pop(1);
    audio.sparkle();
    haptics.pattern([15, 40, 15]);
    const yEnd = this.y0 + this.triH - 20;
    this.c.x = this.cx;
    this.c.y = yEnd;
    this.c.scale = 0.4;
    particles.sparkle(this.cx, yEnd, 14, 100);
    particles.flour(this.cx, yEnd, 12, 1);
    live.react('small', 0.5);
    tween(this.c, { scale: 1 }, 0.6, ease.outElastic);
    await tween(this.c, { x: this.home.x, y: this.home.y }, 0.5, ease.outCubic, 0.35);
    this.phase = 'place';
    this.ui.setHint('Dépose le croissant sur la marque de la plaque');
  }

  update(dt) {
    super.update(dt);
    if (this.phase === 'place' && this.drag) {
      this.c.x += (this.drag.tx - this.c.x) * Math.min(1, dt * 18);
      this.c.y += (this.drag.ty - this.c.y) * Math.min(1, dt * 18);
    }
  }

  draw(ctx) {
    if (this.phase === 'roll') return this.drawRoll(ctx);
    // plaque + emplacement
    const t = this.tray;
    drawTray(ctx, t.x, t.y, t.w, t.h);
    if (this.phase === 'place' || this.phase === 'pop') {
      const pulse = 0.35 + Math.sin(this.t * 5) * 0.12;
      drawCroissant(ctx, this.spot.x, this.spot.y, this.c.s, { solid: `rgba(214,170,110,${pulse})` });
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(180,120,60,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(this.spot.x, this.spot.y + 6, this.c.s * 0.52, this.c.s * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const lift = this.drag ? 1 : 0;
    const sc = this.c.scale * (1 + lift * 0.08);
    if (lift) {
      ctx.fillStyle = 'rgba(90,45,15,0.18)';
      ctx.beginPath();
      ctx.ellipse(this.c.x + 10, this.c.y + 40, this.c.s * 0.45, this.c.s * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawCroissant(ctx, this.c.x, this.c.y - lift * 8, this.c.s * sc, { bake: 0, noShadow: !!lift });
  }

  drawRoll(ctx) {
    const { cx, y0, triH, baseW } = this;
    const p = this.prog;
    const yr = y0 + p * triH;
    const y1 = y0 + triH;
    const wr = baseW * (1 - p);

    // ombre
    ctx.fillStyle = 'rgba(90,45,15,0.16)';
    ctx.beginPath();
    ctx.moveTo(cx - wr / 2 + 6, yr + 8);
    ctx.lineTo(cx + wr / 2 + 6, yr + 8);
    ctx.lineTo(cx + 6, y1 + 8);
    ctx.fill();

    // triangle de pâte restant
    const g = ctx.createLinearGradient(cx - baseW / 2, 0, cx + baseW / 2, 0);
    g.addColorStop(0, '#efd6a8');
    g.addColorStop(0.5, '#f8e8c8');
    g.addColorStop(1, '#ebd0a0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - wr / 2, yr);
    ctx.lineTo(cx + wr / 2, yr);
    ctx.lineTo(cx, y1);
    ctx.closePath();
    ctx.fill();
    // stries de feuilletage
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(230,190,110,0.5)';
    ctx.lineWidth = 1;
    for (let y = y0 + 12; y < y1; y += 14) {
      if (y < yr) continue;
      ctx.beginPath(); ctx.moveTo(cx - baseW / 2, y); ctx.lineTo(cx + baseW / 2, y); ctx.stroke();
    }
    ctx.restore();
    // petite entaille à la base
    if (p < 0.05) {
      ctx.strokeStyle = 'rgba(150,100,50,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y0 + 22); ctx.stroke();
    }

    // le rouleau qui grossit
    if (p > 0.01) {
      const rw = baseW * (1 - 0.25 * p) + 10;
      const rh = 16 + 40 * p;
      const ry = yr - rh * 0.35;
      ctx.fillStyle = 'rgba(90,45,15,0.2)';
      roundRect(ctx, cx - rw / 2 + 4, ry - rh / 2 + 8, rw, rh, rh / 2);
      ctx.fill();
      const rg = ctx.createLinearGradient(0, ry - rh / 2, 0, ry + rh / 2);
      rg.addColorStop(0, '#fbeccc');
      rg.addColorStop(0.5, '#f1d6a6');
      rg.addColorStop(1, '#ddb57c');
      ctx.fillStyle = rg;
      roundRect(ctx, cx - rw / 2, ry - rh / 2, rw, rh, rh / 2);
      ctx.fill();
      // tours de la spirale
      const n = 1 + Math.floor(p * 5);
      ctx.strokeStyle = 'rgba(170,120,60,0.45)';
      ctx.lineWidth = 1.6;
      for (let k = 1; k <= n; k++) {
        const xx = cx - rw / 2 + (rw * k) / (n + 1);
        ctx.beginPath();
        ctx.ellipse(xx, ry, rh * 0.18, rh / 2 - 2, 0, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }
    }

    // flèche d'aide
    if (!this.drag && p < 0.95) {
      const k = (this.t * 1.1) % 1;
      const ay = yr + 30 + k * 70;
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(cx, ay + 24);
      ctx.lineTo(cx - 20, ay);
      ctx.lineTo(cx - 7, ay);
      ctx.lineTo(cx - 7, ay - 24);
      ctx.lineTo(cx + 7, ay - 24);
      ctx.lineTo(cx + 7, ay);
      ctx.lineTo(cx + 20, ay);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
