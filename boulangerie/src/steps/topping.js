// Banana bread — poser la demi-banane sur la pâte (glisser-déposer).
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { shake } from '../core/stage.js';
import { live } from '../live/live.js';
import { clamp, tween, ease, dist } from '../core/util.js';
import { drawBananaHalf } from '../render/cafe.js';
import { roundRect } from '../render/scenery.js';

export class Topping extends Step {
  constructor(prod, ui) {
    super(prod, ui);
    this.title = 'Décorer';
    this.hintText = 'Pose la demi-banane au centre de la pâte';
    this.live = 'shape';
    this.panW = 300;
    this.panH = Math.min(150, this.areaH * 0.32);
    this.spot = { x: this.cx, y: this.cy + this.areaH * 0.12 };
    this.home = { x: this.cx, y: this.cy - this.areaH * 0.28 };
    this.b = { x: this.home.x, y: this.home.y };
    this.drag = null;
    this.misses = 0;
    this.placed = false;
  }

  progress() { return this.placed ? 1 : this.drag ? 0.5 : 0; }

  down(p) {
    if (this.placed) return;
    if (dist(p.x, p.y, this.b.x, this.b.y) < 100) {
      this.drag = { ox: this.b.x - p.x, oy: this.b.y - p.y, tx: this.b.x, ty: this.b.y };
      audio.pop(0.8);
      haptics.tap(10);
    }
  }
  move(p) {
    if (!this.drag) return;
    this.drag.tx = p.x + this.drag.ox;
    this.drag.ty = p.y + this.drag.oy;
  }
  up() {
    if (!this.drag) return;
    this.drag = null;
    const d = dist(this.b.x, this.b.y, this.spot.x, this.spot.y);
    if (d < 70) {
      this.placed = true;
      const score = clamp(1 - (d / 70) * 0.6 - this.misses * 0.1, 0.3, 1);
      this.prod.topping = score;
      tween(this.b, { x: this.spot.x, y: this.spot.y }, 0.16).then(() => {
        audio.splat();
        audio.pop(1.3);
        haptics.tap(18);
        shake(2);
        particles.sparkle(this.spot.x, this.spot.y, 12, 100);
        live.react('step', score);
        setTimeout(() => this.finish(score, d < 18 ? 'Pile au centre !' : 'Bien posée'), 400);
      });
    } else {
      this.misses++;
      audio.boing();
      tween(this.b, { x: this.home.x, y: this.home.y }, 0.4, ease.outBack);
    }
  }

  update(dt) {
    super.update(dt);
    if (this.drag) {
      this.b.x += (this.drag.tx - this.b.x) * Math.min(1, dt * 18);
      this.b.y += (this.drag.ty - this.b.y) * Math.min(1, dt * 18);
    }
  }

  draw(ctx) {
    const { spot, panW: w, panH: h } = this;
    // moule vu de dessus
    ctx.fillStyle = 'rgba(80,40,10,0.22)';
    roundRect(ctx, spot.x - w / 2 + 6, spot.y - h / 2 + 10, w, h, 16);
    ctx.fill();
    ctx.fillStyle = '#b8bec6';
    roundRect(ctx, spot.x - w / 2, spot.y - h / 2, w, h, 16);
    ctx.fill();
    const g = ctx.createRadialGradient(spot.x - 40, spot.y - 20, 10, spot.x, spot.y, w * 0.6);
    g.addColorStop(0, '#e6c78e');
    g.addColorStop(1, '#cfa865');
    ctx.fillStyle = g;
    roundRect(ctx, spot.x - w / 2 + 12, spot.y - h / 2 + 12, w - 24, h - 24, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(ctx, spot.x - w / 2 + 30, spot.y - h / 2 + 22, w * 0.4, 8, 4);
    ctx.fill();
    if (!this.placed) {
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(spot.x, spot.y, w * 0.36, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const lift = this.drag ? 1 : 0;
    if (lift) {
      ctx.fillStyle = 'rgba(80,40,10,0.18)';
      ctx.beginPath(); ctx.ellipse(this.b.x + 10, this.b.y + 28, w * 0.3, 10, 0, 0, Math.PI * 2); ctx.fill();
    }
    drawBananaHalf(ctx, this.b.x, this.b.y - lift * 8, w * 0.62 * (1 + lift * 0.05), 0);
  }
}
