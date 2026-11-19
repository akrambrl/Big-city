// Étape 2 — Tourage : on étale au rouleau (swipes ↕) puis on plie en trois (swipe ↑).
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { shake } from '../core/stage.js';
import { live } from '../live/live.js';
import { clamp, rand, tween, ease } from '../core/util.js';
import { roundRect } from '../render/scenery.js';

export class Laminate extends Step {
  constructor(prod, ui, opt = {}) {
    super(prod, ui);
    this.title = 'Tourage';
    this.hintText = 'Le beurre arrive…';
    this.live = 'laminate';
    this.tours = opt.tours || 3;
    this.rollsPerTour = 2;
    this.w = 230;
    this.Ll = Math.min(360, this.areaH * 0.78);
    this.Ls = this.Ll / 3;
    this.L = this.Ll;
    this.tour = 0;
    this.rolls = 0;
    this.layers = 0;
    this.layerPop = 0;
    this.phase = 'intro';
    this.fold = 0; // 0..2 pendant le pliage
    this.butter = { y: -200, a: 1, show: true };
    this.roller = { y: 0, phase: 0, vis: 0 };
    this.drag = null;
    this.stretch = 0;
    this.scores = [];
    this.misses = 0;
    this.intro();
  }

  async intro() {
    this.roller.y = this.cy + this.L / 2 + 30;
    await tween(this.butter, { y: this.cy }, 0.45, (t) => t * t, 0.35);
    audio.thud(1);
    audio.squish(0.2);
    haptics.tap(25);
    shake(5);
    particles.flour(this.cx, this.cy, 18, 1.2);
    await this.doFold(true);
  }

  progress() {
    const unit = this.rollsPerTour + 1;
    return clamp((this.tour * unit + this.rolls + (this.phase === 'folding' ? 1 : 0)) / (this.tours * unit));
  }

  setHint() {
    if (this.phase === 'roll') this.ui.setHint(`Passe le rouleau : swipe ↕ de haut en bas (${this.rolls}/${this.rollsPerTour})`);
    else if (this.phase === 'fold') this.ui.setHint('Swipe ↑ vers le haut pour plier en trois');
  }

  async doFold(auto = false) {
    this.phase = 'folding';
    this.fold = 0;
    audio.flap();
    haptics.tap(15);
    await tween(this, { fold: 1 }, 0.42, ease.inOutCubic);
    audio.thud(0.5);
    audio.flap();
    haptics.tap(15);
    await tween(this, { fold: 2 }, 0.42, ease.inOutCubic);
    audio.thud(0.7);
    haptics.tap(20);
    particles.flour(this.cx, this.cy + this.Ls / 2, 10, 0.8);
    this.L = this.L / 3;
    this.fold = 0;
    this.butter.show = false;
    this.layers = this.layers === 0 ? 1 : this.layers * 3;
    this.layerPop = 1;
    if (!auto) {
      this.tour++;
      audio.pop(1 + this.tour * 0.15);
      live.react('step', 0.6);
      particles.sparkle(this.cx + this.w / 2, this.cy - this.L / 2, 6, 40);
    }
    this.rolls = 0;
    if (this.tour >= this.tours) {
      const avg = this.scores.reduce((a, b) => a + b, 0) / Math.max(1, this.scores.length);
      const score = clamp(avg - this.misses * 0.03, 0.3, 1);
      this.prod.laminate = score;
      this.prod.layers = this.layers;
      this.phase = 'done';
      setTimeout(() => this.finish(score, `${this.layers} couches !`), 250);
      return;
    }
    this.phase = 'roll';
    this.setHint();
  }

  down(p) {
    if (this.phase !== 'roll' && this.phase !== 'fold') return;
    this.drag = { x0: p.x, y0: p.y, x: p.x, y: p.y, t0: p.t, lt: p.t, minY: p.y, maxY: p.y };
    if (this.phase === 'roll') {
      this.roller.target = p.y;
    }
  }

  move(p) {
    const d = this.drag;
    if (!d) return;
    const dy = p.y - d.y;
    const dt = Math.max(1, p.t - d.lt) / 1000;
    d.x = p.x; d.y = p.y; d.lt = p.t;
    d.minY = Math.min(d.minY, p.y);
    d.maxY = Math.max(d.maxY, p.y);
    if (this.phase === 'roll') {
      const top = this.cy - this.L / 2 - 10, bot = this.cy + this.L / 2 + 10;
      this.roller.target = clamp(p.y, top, bot);
      this.roller.phase += dy;
      const span = d.maxY - d.minY;
      this.stretch = clamp(span / 170) * 0.35;
      audio.rollSet(Math.abs(dy) / dt);
      if (Math.random() < 0.25) {
        particles.flour(this.cx + (Math.random() < 0.5 ? -1 : 1) * (this.w / 2 + 6), this.roller.y, 2, 0.4);
      }
      if (Math.abs(dy) > 2 && Math.random() < 0.06) haptics.tap(5);
    }
  }

  up(p) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    audio.rollSet(0);
    const span = d.maxY - d.minY;
    const dx = Math.abs(p.x - d.x0);
    if (this.phase === 'roll') {
      if (span < 90) {
        this.stretch = 0;
        if (span > 20) { this.misses++; audio.boing(); }
        return;
      }
      const straight = clamp(1 - (dx / span) * 1.4, 0.3, 1);
      const full = span >= 150 ? 1 : 0.88;
      this.scores.push(straight * full);
      this.rolls++;
      const target = this.Ls + ((this.Ll - this.Ls) * this.rolls) / this.rollsPerTour;
      const from = this.L + this.stretch * (this.Ll - this.Ls) / this.rollsPerTour;
      this.L = from;
      this.stretch = 0;
      tween(this, { L: target }, 0.35, ease.outBack);
      audio.squish(0.5);
      haptics.tap(12);
      live.react('small', 0.25);
      if (this.rolls >= this.rollsPerTour) {
        this.phase = 'fold';
        audio.pop(1.2);
      }
      this.setHint();
    } else if (this.phase === 'fold') {
      const dy = p.y - d.y0;
      if (dy < -60 && Math.abs(p.x - d.x0) < Math.abs(dy) * 1.2) {
        this.scores.push(clamp(1 - (dx / Math.abs(dy)) * 0.8, 0.5, 1));
        this.doFold();
      } else if (Math.hypot(p.x - d.x0, dy) > 25) {
        this.misses++;
        audio.boing();
      }
    }
  }

  update(dt) {
    super.update(dt);
    const r = this.roller;
    const wantVis = this.phase === 'roll' ? 1 : 0;
    r.vis += (wantVis - r.vis) * Math.min(1, dt * 8);
    if (r.target != null) r.y += (r.target - r.y) * Math.min(1, dt * 22);
    if (!this.drag && this.phase === 'roll') {
      r.target = this.cy + this.L / 2 + 28;
    }
    this.layerPop = Math.max(0, this.layerPop - dt * 2.5);
  }

  sheet(ctx, y0, y1, under = false) {
    const top = Math.min(y0, y1), h = Math.abs(y1 - y0);
    if (h < 0.5) return;
    const x = this.cx - this.w / 2;
    const g = ctx.createLinearGradient(x, 0, x + this.w, 0);
    const c = under ? ['#dfbf86', '#ead09f', '#d9b67c'] : ['#ecd09c', '#f7e3bd', '#e6c690'];
    g.addColorStop(0, c[0]);
    g.addColorStop(0.5, c[1]);
    g.addColorStop(1, c[2]);
    ctx.fillStyle = g;
    roundRect(ctx, x, top, this.w, h, Math.min(16, h / 2));
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,105,50,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // feuilletage visible sur la tranche
    if (this.layers > 0 && !under && h > 14) {
      const n = Math.min(14, this.layers + 1);
      const bh = 7;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(250,215,110,0.85)' : 'rgba(240,215,170,0.9)';
        ctx.fillRect(x + 10, top + h - bh + (i * bh) / n, this.w - 20, bh / n + 0.3);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, x + 12, top + 6, this.w - 24, Math.min(10, h / 4), 5);
    ctx.fill();
  }

  draw(ctx) {
    const { cx, cy } = this;
    const L = this.L + this.stretch * ((this.Ll - this.Ls) / this.rollsPerTour);
    const top = cy - L / 2, bot = cy + L / 2;
    const a = top + L / 3, b = top + (2 * L) / 3;
    const x = cx - this.w / 2;

    // ombre
    ctx.fillStyle = 'rgba(90,45,15,0.18)';
    roundRect(ctx, x + 5, (this.fold > 0 ? a : top) + 8, this.w, this.fold > 0 ? L / 3 : L, 16);
    ctx.fill();

    if (this.fold > 0) {
      const f1 = clamp(this.fold), f2 = clamp(this.fold - 1);
      this.sheet(ctx, a, b);
      if (this.butter.show) this.drawButter(ctx, cy);
      // rabat du bas
      const c1 = Math.cos(Math.PI * f1);
      this.sheet(ctx, b, b + (L / 3) * c1, c1 < 0);
      // rabat du haut
      const c2 = Math.cos(Math.PI * f2);
      this.sheet(ctx, a, a - (L / 3) * c2, c2 < 0);
      // pli
      ctx.strokeStyle = 'rgba(150,100,50,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 8, b); ctx.lineTo(x + this.w - 8, b); ctx.stroke();
      if (f2 > 0) { ctx.beginPath(); ctx.moveTo(x + 8, a); ctx.lineTo(x + this.w - 8, a); ctx.stroke(); }
    } else {
      this.sheet(ctx, top, bot);
      if (this.butter.show) this.drawButter(ctx, this.butter.y);
    }

    // guides de pliage
    if (this.phase === 'fold') {
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(160,100,50,0.5)';
      ctx.lineWidth = 2;
      for (const yy of [a, b]) {
        ctx.beginPath(); ctx.moveTo(x - 10, yy); ctx.lineTo(x + this.w + 10, yy); ctx.stroke();
      }
      ctx.setLineDash([]);
      // flèche animée
      const k = (this.t * 1.2) % 1;
      const ay = bot - 20 - k * (L / 2);
      ctx.globalAlpha = Math.sin(k * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(cx, ay - 26);
      ctx.lineTo(cx - 22, ay);
      ctx.lineTo(cx - 8, ay);
      ctx.lineTo(cx - 8, ay + 26);
      ctx.lineTo(cx + 8, ay + 26);
      ctx.lineTo(cx + 8, ay);
      ctx.lineTo(cx + 22, ay);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.roller.vis > 0.02) this.drawRoller(ctx);

    // compteur de couches
    if (this.layers > 0) {
      const s = 1 + this.layerPop * 0.5;
      const lx = cx + this.w / 2 - 6, ly = top - 18;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.scale(s, s);
      ctx.fillStyle = 'rgba(255,248,238,0.95)';
      roundRect(ctx, -70, -15, 84, 30, 15);
      ctx.fill();
      ctx.fillStyle = '#9c5418';
      ctx.font = '600 15px Fredoka, ui-rounded, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🧈 ${this.layers} couche${this.layers > 1 ? 's' : ''}`, -28, 1);
      ctx.restore();
    }
  }

  drawButter(ctx, y) {
    const w = this.w * 0.7, h = this.Ls * 0.7;
    const x = this.cx - w / 2;
    ctx.fillStyle = 'rgba(200,150,40,0.2)';
    roundRect(ctx, x + 3, y - h / 2 + 5, w, h, 8);
    ctx.fill();
    const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    g.addColorStop(0, '#fff2a8');
    g.addColorStop(1, '#f6d65e');
    ctx.fillStyle = g;
    roundRect(ctx, x, y - h / 2, w, h, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    roundRect(ctx, x + 8, y - h / 2 + 6, w - 16, 6, 3);
    ctx.fill();
  }

  drawRoller(ctx) {
    const r = this.roller;
    const y = r.y, w = this.w + 50, h = 28;
    ctx.save();
    ctx.globalAlpha = r.vis;
    const x = this.cx - w / 2;
    ctx.fillStyle = 'rgba(80,40,10,0.25)';
    roundRect(ctx, x + 4, y - h / 2 + 10, w, h, h / 2);
    ctx.fill();
    // poignées
    ctx.fillStyle = '#9a5c2e';
    roundRect(ctx, x - 34, y - 8, 40, 16, 8);
    ctx.fill();
    roundRect(ctx, x + w - 6, y - 8, 40, 16, 8);
    ctx.fill();
    // cylindre
    const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    g.addColorStop(0, '#f0c68e');
    g.addColorStop(0.4, '#e2ab6a');
    g.addColorStop(1, '#b97a3e');
    ctx.fillStyle = g;
    roundRect(ctx, x, y - h / 2, w, h, 8);
    ctx.fill();
    // lignes qui tournent
    ctx.strokeStyle = 'rgba(140,80,30,0.35)';
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) {
      const ang = r.phase / 14 + (k * Math.PI) / 2;
      if (Math.cos(ang) > 0) {
        const ly = y + Math.sin(ang) * (h / 2 - 2);
        ctx.beginPath(); ctx.moveTo(x + 6, ly); ctx.lineTo(x + w - 6, ly); ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(ctx, x + 10, y - h / 2 + 4, w - 20, 5, 2.5);
    ctx.fill();
    ctx.restore();
  }
}
