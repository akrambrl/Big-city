// Étape 1 — Pétrir : taps répétés sur une boule de pâte molle.
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { live } from '../live/live.js';
import { clamp, rand, mix, css, shade } from '../core/util.js';

const N = 40;

export class Knead extends Step {
  constructor(prod, ui, opt = {}) {
    super(prod, ui);
    this.title = 'Pétrir';
    this.hintText = 'Tapote la pâte en rythme pour la pétrir';
    this.live = 'knead';
    this.target = opt.taps || 20;
    this.taps = 0;
    this.times = [];
    this.off = new Float32Array(N); // déformation locale
    this.vel = new Float32Array(N);
    this.lumps = Array.from({ length: N }, (_, i) => Math.sin(i * 1.7) * 0.5 + Math.sin(i * 0.9 + 2) * 0.5 + rand(-0.3, 0.3));
    this.squash = 0;
    this.squashV = 0;
    this.marks = [];
    this.specks = Array.from({ length: 26 }, () => ({ a: rand(0, Math.PI * 2), r: rand(0.1, 0.85), s: rand(1, 2.4) }));
    this.R = 88;
  }

  progress() { return this.taps / this.target; }

  down(p) {
    if (this.done) return;
    const dx = p.x - this.cx, dy = p.y - this.cy;
    const d = Math.hypot(dx, dy);
    if (d > this.R * 1.6) return;
    const prog = this.taps / this.target;

    // creux local à l'endroit du doigt + écrasement global
    const a = Math.atan2(dy, dx);
    const depth = 0.4 + 0.6 * Math.min(1, d / this.R);
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      let da = Math.atan2(Math.sin(th - a), Math.cos(th - a));
      this.vel[i] -= 300 * depth * Math.exp(-(da * da) / 0.35);
    }
    this.squashV += 5.5;
    this.marks.push({ x: dx * 0.8, y: dy * 0.6, life: 1, r: rand(9, 13) });

    particles.flour(p.x, p.y, 7 + Math.round(rand(0, 5)), 0.8);
    if (Math.random() < 0.35) particles.flour(this.cx + rand(-60, 60), this.cy + this.R * 0.5, 5, 0.5);
    audio.squish(prog);
    if (this.taps % 3 === 0) audio.flourPuff();
    haptics.tap(14);
    live.react('small', 0.15);

    this.taps++;
    this.times.push(p.t);
    if (this.taps === Math.round(this.target / 2)) {
      audio.sparkle();
      particles.sparkle(this.cx, this.cy - 30, 6, 80);
    }
    if (this.taps >= this.target) {
      // régularité du rythme -> score
      const iv = [];
      for (let i = 1; i < this.times.length; i++) iv.push(this.times[i] - this.times[i - 1]);
      const m = iv.reduce((s, v) => s + v, 0) / iv.length;
      const sd = Math.sqrt(iv.reduce((s, v) => s + (v - m) * (v - m), 0) / iv.length);
      const cv = sd / Math.max(1, m);
      let score = clamp(1.12 - cv * 1.1, 0.45, 1);
      if (m > 900) score *= 0.85; // trop lent
      this.prod.knead = score;
      particles.sparkle(this.cx, this.cy, 14, 120);
      setTimeout(() => this.finish(score, 'Pâte lisse !'), 350);
    }
  }

  update(dt) {
    super.update(dt);
    // ressorts : chaque point revient à sa place et tire ses voisins
    for (let i = 0; i < N; i++) {
      const l = this.off[(i + N - 1) % N], r = this.off[(i + 1) % N];
      const acc = -260 * this.off[i] - 14 * this.vel[i] + 120 * (l + r - 2 * this.off[i]);
      this.vel[i] += acc * dt;
    }
    for (let i = 0; i < N; i++) this.off[i] += this.vel[i] * dt;
    const sa = -150 * this.squash - 9 * this.squashV;
    this.squashV += sa * dt;
    this.squash += this.squashV * dt;
    for (const m of this.marks) m.life -= dt * 0.7;
    this.marks = this.marks.filter((m) => m.life > 0);
  }

  draw(ctx) {
    const { cx, cy, R } = this;
    const prog = clamp(this.taps / this.target);
    const sq = clamp(this.squash * 0.12, -0.25, 0.4);
    const sx = 1 + sq * 0.6, sy = 1 - sq * 0.75;

    // farine sur le plan
    const fg = ctx.createRadialGradient(cx, cy + R * 0.55, 10, cx, cy + R * 0.55, R * 1.9);
    fg.addColorStop(0, 'rgba(255,253,246,0.75)');
    fg.addColorStop(1, 'rgba(255,253,246,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.55, R * 1.9, R * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // ombre
    ctx.fillStyle = 'rgba(90,45,15,0.22)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.82 * sy + 4, R * 1.02 * sx, R * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // contour de la boule (lisse grâce aux points milieux)
    const pts = [];
    const lumpAmp = 0.07 * (1 - prog);
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const rr = R * (1 + lumpAmp * this.lumps[i]) + this.off[i];
      // le bas reste posé sur la table
      const flat = Math.sin(th) > 0 ? 0.86 : 1;
      pts.push([cx + Math.cos(th) * rr * sx, cy + Math.sin(th) * rr * sy * flat + R * (1 - sy) * 0.8]);
    }
    const path = () => {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = pts[i], b = pts[(i + 1) % N];
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.quadraticCurveTo(a[0], a[1], mx, my);
      }
      const a = pts[0], b = pts[1];
      ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      ctx.closePath();
    };

    const base = mix('#ead6b2', '#f8e8c8', prog);
    const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.1, cx, cy, R * 1.15);
    g.addColorStop(0, css(shade(base, 0.45)));
    g.addColorStop(0.6, css(base));
    g.addColorStop(1, css(shade(base, -0.18)));
    ctx.fillStyle = g;
    path();
    ctx.fill();

    ctx.save();
    path();
    ctx.clip();
    // grumeaux de farine qui disparaissent en pétrissant
    for (const s of this.specks) {
      ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - prog)})`;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(s.a) * s.r * R * sx, cy + Math.sin(s.a) * s.r * R * sy, s.s, 0, Math.PI * 2);
      ctx.fill();
    }
    // empreintes de doigts
    for (const m of this.marks) {
      ctx.fillStyle = `rgba(160,110,60,${0.22 * m.life})`;
      ctx.beginPath();
      ctx.ellipse(cx + m.x * sx, cy + m.y * sy, m.r * 1.1, m.r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.25 * m.life})`;
      ctx.beginPath();
      ctx.ellipse(cx + m.x * sx - 2, cy + m.y * sy - 3, m.r * 0.6, m.r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // reflet satiné qui apparaît quand la pâte devient lisse
    ctx.fillStyle = `rgba(255,255,255,${0.15 + prog * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(cx - R * 0.35 * sx, cy - R * 0.5 * sy, R * 0.32, R * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // invitation à taper (anneau pulsé) au début
    if (this.taps === 0) {
      const k = (this.t * 1.3) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (0.4 + k * 0.8), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
