// Étape 5 — Cuisson : appui long pour chauffer, relâcher dans la zone dorée.
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { shake } from '../core/stage.js';
import { live } from '../live/live.js';
import { clamp, tween, ease, lerp } from '../core/util.js';
import { drawCroissant } from '../render/pastries.js';
import { roundRect } from '../render/scenery.js';

const ZONE = [0.62, 0.78];
const PERFECT = 0.7;
const RATE = 1 / 5.2; // cuisson par seconde d'appui

export class Bake extends Step {
  constructor(prod, ui) {
    super(prod, ui);
    this.title = 'Cuisson';
    this.hintText = 'Maintiens appuyé pour cuire, relâche quand c\'est doré';
    this.live = 'bake';
    this.bake = 0;
    this.heat = 0;
    this.holding = false;
    this.phase = 'ready'; // ready | out
    this.open = 0;
    this.crackT = 0;
    this.tickT = 0;
    this.inZone = false;
    this.burnWarned = false;
    this.ovenW = 340;
    this.ovenH = Math.min(310, this.areaH * 0.62);
    this.ovenY = this.cy - 20;
    this.c = { x: this.cx, y: this.ovenY + 10, s: 150, fade: 1 };
    this.steamT = 0;
  }

  progress() { return clamp(this.bake / PERFECT); }

  down() {
    if (this.phase !== 'ready' || this.done) return;
    this.holding = true;
    audio.ovenStart();
    haptics.tap(15);
    live.setContext('bake');
  }

  up() {
    if (!this.holding) return;
    this.holding = false;
    audio.ovenStop();
    if (this.bake < 0.3) {
      this.ui.setHint('Trop tôt ! Maintiens encore…');
      audio.boing();
      return;
    }
    this.takeOut();
  }

  async takeOut() {
    this.phase = 'out';
    const b = this.bake;
    this.prod.bake = b;
    const d = Math.abs(b - PERFECT);
    let score;
    if (b >= ZONE[0] && b <= ZONE[1]) score = 1 - (d / 0.08) * 0.12;
    else if (b < ZONE[0]) score = 0.86 - (ZONE[0] - b) * 2.2;
    else score = 0.86 - (b - ZONE[1]) * 3.6;
    score = clamp(score, 0.05, 1);
    this.prod.bakeScore = score;

    audio.door();
    await tween(this, { open: 1 }, 0.45, ease.outCubic);
    audio.sizzle(1.4);
    audio.crackle(1.3, 1.6);
    haptics.pattern([10, 30, 10, 30, 10, 30, 10]);
    for (let i = 0; i < 14; i++) particles.steam(this.c.x, this.c.y - 20, 120);
    tween(this.c, { fade: 0 }, 0.4);
    await tween(this.c, { y: this.cy, s: 250 }, 0.65, ease.outBack);
    shake(4);
    audio.thud(0.5);
    particles.crumbs(this.cx, this.cy + 30, 10, '#d9963c');
    for (let i = 0; i < 12; i++) particles.steam(this.cx, this.cy - 30, 160);
    const label = b > 0.9 ? 'Brûlé…' : b > ZONE[1] ? 'Un peu trop cuit' : b < 0.45 ? 'Bien pâle…' : b < ZONE[0] ? 'Un peu pâle' : d < 0.025 ? 'Cuisson parfaite !' : 'Bien doré !';
    setTimeout(() => this.finish(score, label), 900);
  }

  update(dt) {
    super.update(dt);
    if (this.holding) {
      this.bake = Math.min(1.05, this.bake + dt * RATE);
      this.heat = Math.min(1, this.heat + dt * 2.5);
      audio.ovenHeat(this.bake);
      // crépitements de plus en plus présents
      this.crackT -= dt;
      if (this.crackT <= 0 && this.bake > 0.3) {
        this.crackT = 0.22;
        audio.crackle(clamp((this.bake - 0.25) * 1.6, 0.1, 1.3), 0.22);
      }
      this.tickT -= dt;
      if (this.tickT <= 0) {
        this.tickT = 0.5;
        audio.tick();
      }
      const z = this.bake >= ZONE[0] && this.bake <= ZONE[1];
      if (z && !this.inZone) {
        haptics.pattern([25, 40, 25]);
        audio.pop(1.6);
      }
      this.inZone = z;
      if (this.bake > 0.88) {
        if (Math.random() < dt * 8) particles.smoke(this.cx, this.ovenY - this.ovenH / 2, 160);
        if (!this.burnWarned) {
          this.burnWarned = true;
          live.setContext('burning');
          live.comment('burning', true);
          haptics.pattern([60, 40, 60]);
        }
      }
      if (this.bake >= 1.05) {
        this.holding = false;
        audio.ovenStop();
        this.takeOut();
      }
    } else {
      this.heat = Math.max(0, this.heat - dt * 1.5);
    }
    if (this.phase === 'ready' && this.bake > 0.4) {
      this.steamT -= dt;
      if (this.steamT <= 0) {
        this.steamT = 0.25;
        particles.steam(this.c.x, this.c.y - 25, 80);
      }
    }
  }

  draw(ctx) {
    const { cx, ovenW: w, ovenH: h, ovenY: oy } = this;
    const x0 = cx - w / 2, y0 = oy - h / 2;
    const fade = this.phase === 'out' ? this.c.fade : 1;

    ctx.save();
    ctx.globalAlpha = fade;
    // jauge de cuisson
    this.drawGauge(ctx, cx, y0 - 38, w - 20);

    // corps du four
    ctx.fillStyle = 'rgba(60,30,10,0.3)';
    roundRect(ctx, x0 + 6, y0 + 12, w, h, 26);
    ctx.fill();
    const body = ctx.createLinearGradient(0, y0, 0, y0 + h);
    body.addColorStop(0, '#5a4a44');
    body.addColorStop(1, '#3b302c');
    ctx.fillStyle = body;
    roundRect(ctx, x0, y0, w, h, 26);
    ctx.fill();
    // bandeau de commandes
    ctx.fillStyle = '#6b5a52';
    roundRect(ctx, x0 + 14, y0 + 12, w - 28, 34, 12);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const kx = x0 + 44 + i * 44, ky = y0 + 29;
      ctx.fillStyle = '#d8c3a5';
      ctx.beginPath(); ctx.arc(kx, ky, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5a4a44'; ctx.lineWidth = 3;
      const a = -Math.PI / 2 + (i === 0 ? this.heat * 2.2 : i * 0.8);
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + Math.cos(a) * 8, ky + Math.sin(a) * 8); ctx.stroke();
    }
    // voyant
    ctx.fillStyle = this.heat > 0.05 ? `rgba(255,${120 - this.heat * 60},40,${0.4 + this.heat * 0.6})` : '#7a6a62';
    ctx.beginPath(); ctx.arc(x0 + w - 44, y0 + 29, 7, 0, Math.PI * 2); ctx.fill();
    if (this.heat > 0.05) {
      ctx.fillStyle = `rgba(255,140,40,${this.heat * 0.3})`;
      ctx.beginPath(); ctx.arc(x0 + w - 44, y0 + 29, 15, 0, Math.PI * 2); ctx.fill();
    }

    // intérieur
    const ix = x0 + 26, iy = y0 + 62, iw = w - 52, ih = h - 90;
    const inner = ctx.createLinearGradient(0, iy, 0, iy + ih);
    inner.addColorStop(0, '#2a1d17');
    inner.addColorStop(1, '#1d1410');
    ctx.fillStyle = inner;
    roundRect(ctx, ix, iy, iw, ih, 14);
    ctx.fill();
    // résistances
    const glow = this.heat;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgb(${lerp(90, 255, glow)},${lerp(60, 110, glow)},${lerp(50, 40, glow)})`;
    for (const yy of [iy + 12, iy + ih - 10]) {
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) ctx.lineTo(ix + 20 + ((iw - 40) * k) / 8, yy + (k % 2 ? 4 : -4));
      ctx.stroke();
    }
    // grille + plaque
    ctx.fillStyle = '#8d939b';
    ctx.fillRect(ix + 14, iy + ih * 0.72, iw - 28, 6);
    ctx.restore();

    // croissant (dessiné hors du fondu du four)
    const puff = clamp(this.bake / 0.55);
    const cOpt = { bake: this.bake, puff, glaze: this.prod.glaze, glazeBox: 0.7, shine: this.phase === 'out' ? 0.08 : 0 };
    if (this.phase === 'ready') {
      ctx.save();
      roundRect(ctx, ix, iy, iw, ih, 14);
      ctx.clip();
      drawCroissant(ctx, this.c.x, this.c.y, this.c.s, cOpt);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = fade;
    // lueur chaude
    if (this.heat > 0.01) {
      const g = ctx.createRadialGradient(cx, iy + ih / 2, 10, cx, iy + ih / 2, iw * 0.7);
      g.addColorStop(0, `rgba(255,150,50,${0.38 * this.heat})`);
      g.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = g;
      roundRect(ctx, ix, iy, iw, ih, 14);
      ctx.fill();
    }
    // vitre + porte qui s'ouvre (bascule vers le bas)
    const openK = 1 - this.open * 0.92;
    const dy0 = iy + ih - ih * openK;
    ctx.fillStyle = `rgba(255,255,255,${0.07 + 0.05 * openK})`;
    roundRect(ctx, ix, dy0, iw, ih * openK, 14);
    ctx.fill();
    ctx.strokeStyle = '#2a201c';
    ctx.lineWidth = 8;
    roundRect(ctx, ix - 2, dy0 - 2, iw + 4, ih * openK + 4, 16);
    ctx.stroke();
    if (openK > 0.3) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(ix + 20, dy0 + 8);
      ctx.lineTo(ix + 70, dy0 + 8);
      ctx.lineTo(ix + 30, dy0 + ih * openK - 8);
      ctx.lineTo(ix + 10, dy0 + ih * openK - 8);
      ctx.fill();
    }
    // poignée
    ctx.fillStyle = '#d6b37a';
    roundRect(ctx, cx - 70, dy0 - 16, 140, 9, 4.5);
    ctx.fill();
    ctx.restore();

    if (this.phase === 'out') drawCroissant(ctx, this.c.x, this.c.y, this.c.s, cOpt);

    // bouton d'appui long
    if (this.phase === 'ready') this.drawHold(ctx, cx, Math.min(oy + h / 2 + 62, this.cy + this.areaH / 2 + 10));
  }

  drawGauge(ctx, cx, y, w) {
    const x = cx - w / 2, h = 22;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#f4ddb0');
    g.addColorStop(0.5, '#ecb25a');
    g.addColorStop(0.7, '#d98a2c');
    g.addColorStop(0.85, '#9a4e1a');
    g.addColorStop(1, '#2a160a');
    ctx.fillStyle = 'rgba(60,30,10,0.25)';
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 15);
    ctx.fill();
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, 11);
    ctx.fill();
    // zone dorée
    const zx = x + w * ZONE[0], zw = w * (ZONE[1] - ZONE[0]);
    const pulse = this.inZone && this.holding ? 0.6 + Math.sin(this.t * 20) * 0.4 : 0.85;
    ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
    ctx.lineWidth = 3;
    roundRect(ctx, zx, y - 3, zw, h + 6, 8);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '600 13px Fredoka, ui-rounded, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('DORÉ', zx + zw / 2, y - 8);
    // curseur
    const mx = x + w * clamp(this.bake);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#4a2f22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx, y + h + 2);
    ctx.lineTo(mx - 9, y + h + 15);
    ctx.lineTo(mx + 9, y + h + 15);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.fillRect(mx - 2, y - 2, 4, h + 4);
  }

  drawHold(ctx, x, y) {
    const r = 40;
    const press = this.holding ? 1 : 0;
    ctx.fillStyle = 'rgba(80,40,10,0.25)';
    ctx.beginPath(); ctx.arc(x, y + 6 - press * 3, r, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, this.holding ? '#ff9a4a' : '#f0a24a');
    g.addColorStop(1, this.holding ? '#e0571f' : '#d97f24');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y + press * 3, r, 0, Math.PI * 2); ctx.fill();
    // anneau de progression
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y + press * 3, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(this.bake));
    ctx.stroke();
    if (!this.holding) {
      const k = (this.t * 1.2) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r + 6 + k * 18, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.font = '30px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', x, y + press * 3 + 1);
    ctx.textBaseline = 'alphabetic';
  }
}
