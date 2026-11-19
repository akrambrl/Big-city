// Café 2 — Mousser le lait : garder la buse juste sous la surface (tsss…).
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { live } from '../live/live.js';
import { clamp, rand } from '../core/util.js';
import { roundRect } from '../render/scenery.js';

const BAND = [3, 18]; // profondeur idéale de la buse sous la surface

export class Froth extends Step {
  constructor(prod, ui) {
    super(prod, ui);
    this.title = 'Mousser le lait';
    this.hintText = 'Glisse le pichet vers le haut : la buse juste sous la surface';
    this.live = 'froth';
    this.prog = 0;
    this.good = 0;
    this.active = 0;
    this.drag = null;
    this.pitcherH = 150;
    this.tipY = this.cy - this.areaH * 0.12;
    this.py = this.tipY + 150; // haut du pichet
    this.state = 'off';
    this.hapT = 0;
  }

  progress() { return this.prog; }

  get level() { return 0.42 + this.prog * 0.3; }
  get surface() { return this.py + this.pitcherH * (1 - this.level); }
  get depth() { return this.tipY - this.surface; }

  down(p) {
    if (this.done) return;
    this.drag = { oy: this.py - p.y, ty: this.py };
    audio.clunk();
    haptics.tap(10);
  }
  move(p) {
    if (!this.drag) return;
    this.drag.ty = clamp(p.y + this.drag.oy, this.tipY - this.pitcherH * 0.95, this.tipY + 180);
  }
  up() {
    this.drag = null;
    this.state = 'off';
    audio.loopSet('steamHi', 0);
    audio.loopSet('steamLo', 0);
  }

  update(dt) {
    super.update(dt);
    if (this.drag) this.py += (this.drag.ty - this.py) * Math.min(1, dt * 16);
    if (!this.drag || this.done) return;
    const d = this.depth;
    this.active += dt;
    if (d >= BAND[0] && d <= BAND[1]) {
      this.state = 'good';
      this.good += dt;
      this.prog = Math.min(1, this.prog + dt / 3.6);
      audio.loopSet('steamHi', 0.2, 4200 + Math.sin(this.t * 13) * 400, { brownNoise: false, type: 'bandpass', q: 0.9 });
      audio.loopSet('steamLo', 0.06, 300);
      this.hapT -= dt;
      if (this.hapT <= 0) { this.hapT = 0.28; haptics.tap(4); }
      if (Math.random() < dt * 3) live.react('small', 0.06);
    } else if (d > BAND[1]) {
      this.state = 'deep';
      this.prog = Math.min(1, this.prog + dt / 14);
      audio.loopSet('steamHi', 0.03, 2500);
      audio.loopSet('steamLo', 0.38, 180, { brownNoise: true, f: 200 });
    } else {
      this.state = 'high';
      audio.loopSet('steamHi', 0.32, 7000, { brownNoise: false, type: 'bandpass', q: 0.9 });
      audio.loopSet('steamLo', 0);
      if (Math.random() < dt * 10) {
        audio.crackle(0.6, 0.1);
        particles.spawn({ x: this.cx + rand(-30, 30), y: this.surface, vx: rand(-80, 80), vy: rand(-200, -80), life: 0.5, size: rand(2, 4), color: '#fffaf2', grav: 600 });
      }
      if (Math.random() < dt * 8) particles.steam(this.cx, this.tipY, 30);
    }
    if (this.prog >= 1) this.end();
  }

  end() {
    if (this.done) return;
    this.drag = null;
    audio.loopSet('steamHi', 0);
    audio.loopSet('steamLo', 0);
    audio.clunk();
    audio.sparkle();
    const score = clamp(this.good / Math.max(0.1, this.active) + 0.08, 0.3, 1);
    this.prod.froth = score;
    particles.sparkle(this.cx, this.surface, 10, 80);
    this.finish(score, score > 0.85 ? 'Mousse soyeuse !' : 'Mousse un peu bulleuse');
  }

  draw(ctx) {
    const { cx, tipY } = this;
    const pw = 120, ph = this.pitcherH;
    const x0 = cx - pw / 2, top = this.py;
    // buse vapeur
    ctx.strokeStyle = '#b7bdc4';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 70, this.cy - this.areaH * 0.45); ctx.lineTo(cx + 70, tipY - 90); ctx.lineTo(cx + 6, tipY); ctx.stroke();
    ctx.strokeStyle = '#eef1f4';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx + 67, this.cy - this.areaH * 0.45); ctx.lineTo(cx + 67, tipY - 90); ctx.stroke();

    // pichet inox
    ctx.fillStyle = 'rgba(70,35,10,0.2)';
    ctx.beginPath(); ctx.ellipse(cx + 6, top + ph + 8, pw * 0.6, 10, 0, 0, Math.PI * 2); ctx.fill();
    const steel = ctx.createLinearGradient(x0, 0, x0 + pw, 0);
    steel.addColorStop(0, '#9aa1aa');
    steel.addColorStop(0.35, '#eef1f4');
    steel.addColorStop(1, '#8e959e');
    // anse
    ctx.strokeStyle = '#9aa1aa';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(x0 - 4, top + ph * 0.45, 26, Math.PI * 0.55, Math.PI * 1.45); ctx.stroke();
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(x0 - 6, top);
    ctx.lineTo(x0 + pw + 14, top - 8);
    ctx.lineTo(x0 + pw + 6, top + ph);
    ctx.lineTo(x0, top + ph);
    ctx.closePath();
    ctx.fill();

    // lait vu « à travers » (découpe)
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 + 6, top + 6, pw - 8, ph - 12);
    ctx.clip();
    const s = this.surface;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x0, top, pw + 20, ph);
    ctx.fillStyle = '#fbf7f0';
    ctx.fillRect(x0, s, pw + 20, ph);
    // mousse
    const foam = this.prog * 22;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x0, s, pw + 20, foam);
    // tourbillon
    for (let i = 0; i < 10; i++) {
      const a = this.t * (this.state === 'good' ? 9 : 2) + i * 0.63;
      const bx = cx + Math.cos(a) * (pw * 0.35);
      const by = s + 8 + Math.abs(Math.sin(a)) * 30;
      ctx.fillStyle = 'rgba(220,215,205,0.7)';
      ctx.beginPath(); ctx.arc(bx, by, this.state === 'high' ? 4 : 1.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0 + 20, top + 12); ctx.lineTo(x0 + 16, top + ph - 12); ctx.stroke();

    // pointe de la buse au premier plan si elle est dans le lait
    if (this.depth > 0) {
      ctx.strokeStyle = 'rgba(183,189,196,0.5)';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(cx + 20, tipY - 18); ctx.lineTo(cx + 6, tipY); ctx.stroke();
    }

    // jauge de profondeur
    const gx = this.cx + 150, gy = this.cy - 70, gh = 140;
    ctx.fillStyle = 'rgba(60,30,10,0.35)';
    roundRect(ctx, gx - 12, gy, 24, gh, 12);
    ctx.fill();
    const toY = (d) => gy + gh / 2 + clamp(d - 10, -60, 60) * (gh / 120);
    ctx.fillStyle = 'rgba(140,220,150,0.9)';
    ctx.fillRect(gx - 10, toY(BAND[0]), 20, toY(BAND[1]) - toY(BAND[0]));
    const col = this.state === 'good' ? '#7bd88a' : this.state === 'off' ? '#fff' : '#ff8f6b';
    ctx.fillStyle = col;
    ctx.strokeStyle = '#4a2f22';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(gx, toY(this.depth), 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '600 12px Fredoka, ui-rounded, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('buse', gx, gy - 8);

    // indications d'état
    if (this.drag) {
      const txt = this.state === 'good' ? 'tsssss… parfait' : this.state === 'deep' ? 'trop profond ↓' : 'trop haut, ça éclabousse ↑';
      ctx.font = '600 16px Fredoka, ui-rounded, system-ui';
      ctx.fillStyle = 'rgba(255,248,238,0.95)';
      const w = ctx.measureText(txt).width + 24;
      roundRect(ctx, cx - w / 2, top + ph + 22, w, 30, 15);
      ctx.fill();
      ctx.fillStyle = this.state === 'good' ? '#3f8a4d' : '#c0502e';
      ctx.fillText(txt, cx, top + ph + 42);
    } else if (this.prog === 0) {
      const k = (this.t * 1.1) % 1;
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const ay = top + ph * 0.5 - k * 60;
      ctx.moveTo(cx, ay - 24); ctx.lineTo(cx - 20, ay); ctx.lineTo(cx - 7, ay); ctx.lineTo(cx - 7, ay + 24);
      ctx.lineTo(cx + 7, ay + 24); ctx.lineTo(cx + 7, ay); ctx.lineTo(cx + 20, ay); ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
