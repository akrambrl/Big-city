// Café 1 — Extraction de l'espresso : appui long, relâcher dans la zone.
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { live } from '../live/live.js';
import { clamp, tween, ease } from '../core/util.js';
import { roundRect } from '../render/scenery.js';
import { drawHoldButton, drawZoneMarks } from './common.js';

const ZONE = [0.55, 0.72];
const TARGET = 0.635;

export class Espresso extends Step {
  constructor(prod, ui) {
    super(prod, ui);
    this.title = 'Espresso';
    this.hintText = 'Maintiens pour extraire, relâche entre les traits';
    this.live = 'espresso';
    this.fill = 0;
    this.holding = false;
    this.pf = { y: -60, lock: 0 }; // porte-filtre qui s'enclenche
    this.ready = false;
    this.inZone = false;
    this.intro();
  }

  async intro() {
    await tween(this.pf, { y: 0 }, 0.35, ease.outBack, 0.25);
    audio.clunk();
    haptics.tap(15);
    await tween(this.pf, { lock: 1 }, 0.18);
    audio.clunk();
    this.ready = true;
  }

  progress() { return clamp(this.fill / TARGET); }

  get geo() {
    const top = this.cy - this.areaH * 0.38;
    return {
      top,
      head: top + 70,
      cupY: this.cy + this.areaH * 0.18,
      cupW: 96,
      cupH: 82,
    };
  }

  down() {
    if (!this.ready || this.done) return;
    this.holding = true;
    haptics.tap(10);
    audio.clunk();
  }

  up() {
    if (!this.holding) return;
    this.holding = false;
    audio.humSet('pump', 0);
    audio.loopSet('drip', 0);
    if (this.fill < 0.2) { this.ui.setHint('Encore ! Maintiens appuyé'); return; }
    this.end();
  }

  end() {
    if (this.done) return;
    audio.humSet('pump', 0);
    audio.loopSet('drip', 0);
    const f = this.fill;
    const score = f >= 0.99 ? 0.3 : clamp(1 - Math.max(0, Math.abs(f - TARGET) - 0.04) / 0.3, 0.15, 1);
    this.prod.espresso = score;
    audio.clink();
    particles.steam(this.cx, this.geo.cupY - this.geo.cupH, 40);
    this.finish(score, f >= 0.99 ? 'Ça déborde !' : f >= ZONE[0] && f <= ZONE[1] ? 'Shot parfait !' : f < ZONE[0] ? 'Un peu court' : 'Un peu long');
  }

  update(dt) {
    super.update(dt);
    if (this.holding) {
      this.fill = Math.min(1, this.fill + dt * 0.26);
      audio.humSet('pump', 0.08, 48, 260);
      audio.loopSet('drip', 0.12 + Math.sin(this.t * 20) * 0.03, 1700, { brownNoise: false, type: 'bandpass', q: 3 });
      const z = this.fill >= ZONE[0] && this.fill <= ZONE[1];
      if (z && !this.inZone) { haptics.pattern([20, 30, 20]); audio.pop(1.5); }
      this.inZone = z;
      if (Math.random() < dt * 4) live.react('small', 0.05);
      if (this.fill >= 1) { this.holding = false; this.end(); }
    }
  }

  draw(ctx) {
    const { cx } = this;
    const g = this.geo;
    const mw = 300;
    // machine
    ctx.fillStyle = 'rgba(70,35,10,0.25)';
    roundRect(ctx, cx - mw / 2 + 6, g.top + 8, mw, g.cupY - g.top + 50, 26);
    ctx.fill();
    // façade de la machine (fond sombre pour que la tasse ressorte)
    const back = ctx.createLinearGradient(0, g.top, 0, g.cupY + 40);
    back.addColorStop(0, '#6f767e');
    back.addColorStop(1, '#4b5157');
    ctx.fillStyle = back;
    roundRect(ctx, cx - mw / 2 + 10, g.top + 30, mw - 20, g.cupY - g.top + 14, 18);
    ctx.fill();
    const body = ctx.createLinearGradient(cx - mw / 2, 0, cx + mw / 2, 0);
    body.addColorStop(0, '#c9ced4');
    body.addColorStop(0.5, '#f3f5f7');
    body.addColorStop(1, '#b7bdc4');
    ctx.fillStyle = body;
    roundRect(ctx, cx - mw / 2, g.top, mw, 60, 22);
    ctx.fill();
    ctx.fillStyle = '#e8846b';
    roundRect(ctx, cx - mw / 2 + 16, g.top + 16, 70, 28, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 14px Fredoka, ui-rounded, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('ESPRESSO', cx - mw / 2 + 51, g.top + 35);
    // manomètre
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx + mw / 2 - 40, g.top + 30, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a2f22'; ctx.lineWidth = 2.5;
    const na = -Math.PI * 0.9 + (this.holding ? 1.6 + Math.sin(this.t * 30) * 0.05 : 0.2);
    ctx.beginPath(); ctx.moveTo(cx + mw / 2 - 40, g.top + 30); ctx.lineTo(cx + mw / 2 - 40 + Math.cos(na) * 13, g.top + 30 + Math.sin(na) * 13); ctx.stroke();
    // groupe
    ctx.fillStyle = '#9aa1aa';
    roundRect(ctx, cx - 40, g.top + 58, 80, 18, 6);
    ctx.fill();
    // porte-filtre
    ctx.save();
    ctx.translate(cx, g.head + 18 + this.pf.y);
    ctx.rotate((1 - this.pf.lock) * -0.25);
    ctx.fillStyle = '#3d3532';
    roundRect(ctx, 30, -6, 110, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#c9ced4';
    roundRect(ctx, -46, -10, 92, 22, 8);
    ctx.fill();
    ctx.fillStyle = '#8e959e';
    ctx.fillRect(-14, 12, 8, 10);
    ctx.fillRect(6, 12, 8, 10);
    ctx.restore();

    // plateau égouttoir
    ctx.fillStyle = '#7b828a';
    roundRect(ctx, cx - 90, g.cupY + 6, 180, 14, 6);
    ctx.fill();

    // tasse (vue de côté)
    const cw = g.cupW, ch = g.cupH;
    const cx0 = cx - cw / 2, cyTop = g.cupY - ch;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx0, cyTop);
    ctx.lineTo(cx0 + cw, cyTop);
    ctx.quadraticCurveTo(cx0 + cw, g.cupY, cx, g.cupY);
    ctx.quadraticCurveTo(cx0, g.cupY, cx0, cyTop);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(cx0 + cw + 6, cyTop + ch * 0.38, 14, -1.2, 1.2); ctx.stroke();
    // café visible par le haut de la tasse (effet verre de lecture)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx0 + 5, cyTop);
    ctx.lineTo(cx0 + cw - 5, cyTop);
    ctx.quadraticCurveTo(cx0 + cw - 5, g.cupY - 5, cx, g.cupY - 5);
    ctx.quadraticCurveTo(cx0 + 5, g.cupY - 5, cx0 + 5, cyTop);
    ctx.clip();
    ctx.fillStyle = 'rgba(240,235,228,1)';
    ctx.fillRect(cx0, cyTop, cw, ch);
    if (this.fill > 0) {
      const ly = g.cupY - 5 - (ch - 5) * this.fill;
      ctx.fillStyle = '#4a2410';
      ctx.fillRect(cx0, ly, cw, ch);
      ctx.fillStyle = '#c98a4b'; // crema
      ctx.fillRect(cx0, ly, cw, Math.min(12, 3 + this.fill * 14));
      ctx.fillStyle = 'rgba(255,230,190,0.6)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.arc(cx0 + 12 + i * 14, ly + 4 + (i % 2) * 2, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    drawZoneMarks(ctx, cx0 + cw + 26, cyTop + 5, g.cupY - 5, ZONE, 'shot');

    // filets de café
    if (this.holding && this.fill < 1) {
      const surf = g.cupY - 5 - (ch - 5) * this.fill;
      ctx.strokeStyle = '#5a2d12';
      ctx.lineWidth = 3;
      for (const dx of [-10, 10]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, g.head + 40);
        for (let y = g.head + 40; y < surf; y += 6) ctx.lineTo(cx + dx + Math.sin(y * 0.2 + this.t * 20) * 0.8, y);
        ctx.stroke();
      }
    }

    drawHoldButton(ctx, cx, Math.min(g.cupY + 78, this.cy + this.areaH / 2 + 10), this.t, this.holding, this.fill / TARGET, '☕');
  }
}
