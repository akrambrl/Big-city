// Verser la pâte dans le moule : appui long, relâcher à la ligne.
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { live } from '../live/live.js';
import { clamp, rand, css, shade, hex } from '../core/util.js';
import { roundRect } from '../render/scenery.js';
import { drawHoldButton, drawZoneMarks } from './common.js';

const ZONE = [0.66, 0.8];
const TARGET = 0.73;

export class Pour extends Step {
  constructor(prod, ui, opt = {}) {
    super(prod, ui);
    this.title = 'Verser dans le moule';
    this.hintText = 'Maintiens pour verser, relâche entre les traits';
    this.live = 'pour';
    this.color = opt.color || '#d9b679';
    this.fill = 0;
    this.tilt = 0;
    this.holding = false;
    this.glopT = 0;
    this.pan = { w: 250, h: 96, x: this.cx - 10, y: this.cy + this.areaH * 0.12 };
  }

  progress() { return clamp(this.fill / TARGET); }

  down() {
    if (this.done) return;
    this.holding = true;
    haptics.tap(10);
  }

  up() {
    if (!this.holding) return;
    this.holding = false;
    audio.loopSet('pour', 0);
    if (this.fill < 0.35) {
      this.ui.setHint('Continue à verser…');
      return;
    }
    this.end();
  }

  end() {
    if (this.done) return;
    this.holding = false;
    audio.loopSet('pour', 0);
    const f = this.fill;
    const score = f >= 0.99 ? 0.3 : clamp(1 - Math.max(0, Math.abs(f - TARGET) - 0.03) / 0.3, 0.2, 1);
    this.prod.pour = score;
    audio.glop();
    audio.pop(1.2);
    particles.sparkle(this.pan.x, this.pan.y - 20, 10, 120);
    this.finish(score, f >= 0.99 ? 'Ça déborde !' : f >= ZONE[0] && f <= ZONE[1] ? 'Pile à la ligne !' : f < ZONE[0] ? 'Un peu juste' : 'Un peu trop');
  }

  update(dt) {
    super.update(dt);
    this.tilt += ((this.holding ? 1 : 0) - this.tilt) * Math.min(1, dt * 6);
    if (this.holding && this.tilt > 0.55) {
      this.fill = Math.min(1, this.fill + dt * 0.24);
      audio.loopSet('pour', 0.45, 280 + Math.sin(this.t * 7) * 60, { brownNoise: true, f: 300 });
      this.glopT -= dt;
      if (this.glopT <= 0) {
        this.glopT = rand(0.25, 0.5);
        audio.glop();
        haptics.tap(6);
        live.react('small', 0.08);
      }
      if (this.fill >= 1) {
        particles.spawn({ x: this.pan.x + this.pan.w / 2, y: this.pan.y - this.pan.h, vx: 40, vy: 30, life: 0.8, size: 6, color: this.color, grav: 400 });
        this.end();
      }
    }
  }

  draw(ctx) {
    const p = this.pan;
    const x0 = p.x - p.w / 2, top = p.y - p.h;
    // moule à cake (vue de côté, en perspective légère)
    ctx.fillStyle = 'rgba(80,40,10,0.22)';
    ctx.beginPath(); ctx.ellipse(p.x + 6, p.y + 6, p.w * 0.58, 14, 0, 0, Math.PI * 2); ctx.fill();
    const metal = ctx.createLinearGradient(x0, 0, x0 + p.w, 0);
    metal.addColorStop(0, '#9aa1aa');
    metal.addColorStop(0.5, '#d9dde2');
    metal.addColorStop(1, '#8e959e');
    // intérieur (fond)
    ctx.fillStyle = '#6f757d';
    ctx.beginPath();
    ctx.moveTo(x0 - 14, top);
    ctx.lineTo(x0 + p.w + 14, top);
    ctx.lineTo(x0 + p.w, p.y);
    ctx.lineTo(x0, p.y);
    ctx.closePath();
    ctx.fill();
    // pâte dans le moule
    if (this.fill > 0) {
      const fy = p.y - p.h * this.fill;
      const spread = (14 * (p.y - fy)) / p.h;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(x0 - spread, fy);
      for (let i = 0; i <= 12; i++) {
        const xx = x0 - spread + ((p.w + spread * 2) * i) / 12;
        ctx.lineTo(xx, fy + Math.sin(this.t * 4 + i) * 1.5 * this.tilt);
      }
      ctx.lineTo(x0 + p.w, p.y);
      ctx.lineTo(x0, p.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x0 - spread + 10, fy + 3, p.w + spread * 2 - 20, 4);
    }
    // face avant du moule (transparente au niveau de la pâte pour la lisibilité)
    ctx.strokeStyle = metal;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0 - 14, top);
    ctx.lineTo(x0, p.y);
    ctx.lineTo(x0 + p.w, p.y);
    ctx.lineTo(x0 + p.w + 14, top);
    ctx.stroke();
    // repères
    drawZoneMarks(ctx, x0 + p.w + 22, top, p.y, ZONE, 'ligne');

    // bol qui s'incline
    const bx = p.x + 60, by = top - 110;
    const ang = -this.tilt * 0.95;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(80,40,10,0.15)';
    ctx.beginPath(); ctx.ellipse(6, 8, 80, 50, 0, 0, Math.PI); ctx.fill();
    const bg = ctx.createLinearGradient(0, -10, 0, 60);
    bg.addColorStop(0, '#fbf6ee');
    bg.addColorStop(1, '#cfdcdf');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-80, 0);
    ctx.quadraticCurveTo(-78, 62, 0, 62);
    ctx.quadraticCurveTo(78, 62, 80, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.ellipse(0, 0, 76, 12 * (1 - this.fill * 0.6), 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9fc3c9';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, 0, 80, 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // ruban de pâte
    if (this.holding && this.tilt > 0.5 && this.fill < 1) {
      const lipX = bx + Math.cos(ang) * -80, lipY = by + Math.sin(ang) * -80;
      const surf = p.y - p.h * this.fill;
      const c = hex(this.color);
      ctx.strokeStyle = css(shade(c, -0.05));
      ctx.lineCap = 'round';
      const w = 14 * (this.tilt - 0.5) * 2;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(lipX, lipY);
      ctx.quadraticCurveTo(lipX - 18, (lipY + surf) / 2, lipX - 14 + Math.sin(this.t * 9) * 2, surf);
      ctx.stroke();
      ctx.lineWidth = w * 0.3;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.stroke();
      // ondes à l'impact
      const k = (this.t * 2) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(lipX - 14, surf + 2, 10 + k * 40, 3 + k * 6, 0, 0, Math.PI * 2); ctx.stroke();
    }

    drawHoldButton(ctx, this.cx, Math.min(p.y + 80, this.cy + this.areaH / 2 + 10), this.t, this.holding, this.fill / TARGET, '🥣');
  }
}
