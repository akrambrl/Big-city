// Étape 4 — Dorure : on peint le croissant à l'œuf avec le doigt (pinceau).
// La couche peinte est gardée et réapparaît, cuite, dans le four et le résultat.
import { Step } from './step.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { live } from '../live/live.js';
import { clamp, rand } from '../core/util.js';
import { drawCroissant } from '../render/pastries.js';
import { drawTray } from '../render/scenery.js';

const BOX = 0.7; // le masque couvre ±0.7·s autour du croissant
const HI = 384; // résolution d'affichage du masque
const LO = 96; // résolution de calcul de couverture

function canvas(n) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  return c;
}

export class Glaze extends Step {
  constructor(prod, ui) {
    super(prod, ui);
    this.title = 'Dorure';
    this.hintText = 'Peins le croissant à l\'œuf avec ton doigt';
    this.live = 'glaze';
    this.s = Math.min(330, this.areaH * 0.8);
    this.brushW = 30;
    this.cov = 0;
    this.over = 0;
    this.milestone = 0;
    this.drag = null;
    this.dirty = false;
    this.calcT = 0;
    this.buttonShown = false;

    // masques
    this.maskHi = canvas(HI);
    this.maskLo = canvas(LO);
    for (const [c, n] of [[this.maskHi, HI], [this.maskLo, LO]]) {
      const x = c.getContext('2d');
      const k = n / (this.s * BOX * 2);
      x.setTransform(k, 0, 0, k, n / 2, n / 2);
      drawCroissant(x, 0, 0, this.s, { solid: '#fff' });
    }
    this.strokeHi = canvas(HI);
    this.strokeLo = canvas(LO);
    this.glazed = canvas(HI); // peinture découpée à la forme du croissant
    this.spill = canvas(HI); // débordements sur la plaque
    const md = this.maskLo.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, LO, LO).data;
    this.maskBits = new Uint8Array(LO * LO);
    let n = 0;
    for (let i = 0; i < LO * LO; i++) if (md[i * 4 + 3] > 128) { this.maskBits[i] = 1; n++; }
    this.maskCount = n;
  }

  progress() { return clamp(this.cov / 0.95); }

  toMask(p, n) {
    const k = n / (this.s * BOX * 2);
    return [(p.x - this.cx) * k + n / 2, (p.y - this.cy) * k + n / 2, this.brushW * k];
  }

  paint(a, b) {
    for (const [c, n] of [[this.strokeHi, HI], [this.strokeLo, LO]]) {
      const x = c.getContext('2d');
      const [ax, ay, w] = this.toMask(a, n);
      const [bx, by] = this.toMask(b, n);
      x.strokeStyle = '#f5be46';
      x.fillStyle = '#f5be46';
      x.lineWidth = w;
      x.lineCap = 'round';
      x.lineJoin = 'round';
      x.beginPath();
      x.moveTo(ax, ay);
      x.lineTo(bx + 0.01, by);
      x.stroke();
    }
    this.dirty = true;
  }

  down(p) {
    if (this.done) return;
    this.drag = { x: p.x, y: p.y, t: p.t };
    this.paint(p, p);
    haptics.tap(6);
  }

  move(p) {
    const d = this.drag;
    if (!d || this.done) return;
    const len = Math.hypot(p.x - d.x, p.y - d.y);
    const dt = Math.max(1, p.t - d.t) / 1000;
    this.paint(d, p);
    audio.brushSet(len / dt);
    if (Math.random() < 0.08) particles.sparkle(p.x, p.y, 1, 10, '#fff3c4');
    d.x = p.x; d.y = p.y; d.t = p.t;
  }

  up() {
    this.drag = null;
    audio.brushSet(0);
  }

  computeCoverage() {
    const sd = this.strokeLo.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, LO, LO).data;
    let inside = 0, outside = 0;
    for (let i = 0; i < LO * LO; i++) {
      if (sd[i * 4 + 3] > 100) {
        if (this.maskBits[i]) inside++;
        else outside++;
      }
    }
    this.cov = inside / this.maskCount;
    this.over = outside / this.maskCount;
  }

  rebuild() {
    for (const [dst, op] of [[this.glazed, 'destination-in'], [this.spill, 'destination-out']]) {
      const x = dst.getContext('2d');
      x.globalCompositeOperation = 'source-over';
      x.clearRect(0, 0, HI, HI);
      x.drawImage(this.strokeHi, 0, 0);
      x.globalCompositeOperation = op;
      x.drawImage(this.maskHi, 0, 0);
      x.globalCompositeOperation = 'source-over';
    }
  }

  update(dt) {
    super.update(dt);
    if (this.dirty) {
      this.rebuild();
      this.calcT -= dt;
      if (this.calcT <= 0) {
        this.calcT = 0.12;
        this.dirty = false;
        this.computeCoverage();
        const m = Math.floor(this.cov * 4);
        if (m > this.milestone && m < 4) {
          this.milestone = m;
          audio.sparkle();
          live.react('small', 0.4);
          particles.sparkle(this.cx, this.cy, 8, 160);
        }
        if (this.cov > 0.55 && !this.buttonShown) {
          this.buttonShown = true;
          this.ui.button('Terminé ✓', () => this.end(), 'small');
        }
        if (this.cov > 0.965) this.end();
      }
    }
  }

  end() {
    if (this.done) return;
    this.computeCoverage();
    this.rebuild();
    audio.brushSet(0);
    this.ui.clearButtons();
    const score = clamp(this.cov * 1.08 - this.over * 0.35, 0.2, 1);
    this.prod.glazeScore = score;
    // on garde la dorure pour les étapes suivantes
    const keep = canvas(HI);
    keep.getContext('2d').drawImage(this.glazed, 0, 0);
    this.prod.glaze = keep;
    audio.chime();
    particles.sparkle(this.cx, this.cy, 20, 200);
    this.finish(score, this.cov > 0.9 ? 'Brillant parfait !' : this.cov > 0.7 ? 'Bien doré' : 'Un peu léger…');
  }

  draw(ctx) {
    const { cx, cy, s } = this;
    drawTray(ctx, cx, cy + 10, 370, s * 0.75);
    const size = s * BOX * 2;
    // débordements sur le papier
    ctx.globalAlpha = 0.4;
    ctx.drawImage(this.spill, cx - size / 2, cy - size / 2, size, size);
    ctx.globalAlpha = 1;
    drawCroissant(ctx, cx, cy, s, { bake: 0, glaze: this.glazed, glazeBox: BOX });
    // reflet qui balaie la dorure
    if (this.cov > 0.05) {
      const k = (this.t * 0.45) % 1.6 - 0.3;
      ctx.save();
      const g = ctx.createLinearGradient(cx - s * 0.6 + k * s, cy - s * 0.3, cx - s * 0.3 + k * s, cy + s * 0.2);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,240,${0.35 * this.cov})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      // découpe à la dorure
      const tmp = this.shineCanvas || (this.shineCanvas = canvas(HI));
      const t = tmp.getContext('2d');
      t.globalCompositeOperation = 'source-over';
      t.clearRect(0, 0, HI, HI);
      t.drawImage(this.glazed, 0, 0);
      t.globalCompositeOperation = 'source-in';
      const kk = HI / size;
      t.setTransform(kk, 0, 0, kk, HI / 2 - cx * kk, HI / 2 - cy * kk);
      t.fillStyle = g;
      t.fillRect(cx - size / 2, cy - size / 2, size, size);
      t.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(tmp, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();
    }

    // pinceau
    if (this.drag) this.drawBrush(ctx, this.drag.x, this.drag.y);
    else if (this.cov < 0.02) {
      const k = this.t % 2;
      const bx = cx - s * 0.3 + Math.min(1, k) * s * 0.6;
      const by = cy - s * 0.05 + Math.sin(k * Math.PI) * -s * 0.08;
      ctx.globalAlpha = 0.85;
      this.drawBrush(ctx, bx, by);
      ctx.globalAlpha = 1;
    }
  }

  drawBrush(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.6);
    // poils
    ctx.fillStyle = '#f2d48a';
    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.quadraticCurveTo(-11, 14, 0, 18);
    ctx.quadraticCurveTo(11, 14, 9, -4);
    ctx.fill();
    ctx.fillStyle = '#f5be46';
    ctx.beginPath();
    ctx.ellipse(0, 14, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // virole
    ctx.fillStyle = '#c9ccd2';
    ctx.fillRect(-10, -14, 20, 11);
    // manche
    ctx.fillStyle = '#b5713a';
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-4, -70);
    ctx.quadraticCurveTo(0, -76, 4, -70);
    ctx.lineTo(6, -14);
    ctx.fill();
    ctx.restore();
  }
}
