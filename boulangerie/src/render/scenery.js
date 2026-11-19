// Décors : plan de travail en bois fariné, intérieur de la boulangerie.
import { stage, onResize } from '../core/stage.js';
import { rand } from '../core/util.js';
import { drawCroissantIcon } from './pastries.js';

let tableCache = null;
let shopCache = null;
onResize(() => { tableCache = null; shopCache = null; });

function layer() {
  const c = document.createElement('canvas');
  c.width = stage.canvas.width;
  c.height = stage.canvas.height;
  const x = c.getContext('2d');
  const k = stage.scale * stage.dpr;
  x.setTransform(k, 0, 0, k, 0, 0);
  return { c, x };
}

// Graine fixe pour que le décor ne « saute » pas au redimensionnement
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function drawTable(ctx) {
  if (!tableCache) {
    const { c, x } = layer();
    const { W, H } = stage;
    const r = seeded(7);
    const planks = 5;
    const pw = W / planks;
    const tones = ['#e2b47c', '#d9a96f', '#e6bb85', '#dcac74', '#e0b27a'];
    for (let i = 0; i < planks; i++) {
      x.fillStyle = tones[i];
      x.fillRect(i * pw, 0, pw + 1, H);
      // veines du bois
      x.strokeStyle = 'rgba(150,90,40,0.13)';
      x.lineWidth = 1.2;
      for (let j = 0; j < 7; j++) {
        const x0 = i * pw + r() * pw;
        const amp = 3 + r() * 6;
        const freq = 0.01 + r() * 0.02;
        const ph = r() * 6;
        x.beginPath();
        for (let y = 0; y <= H; y += 8) x.lineTo(x0 + Math.sin(y * freq + ph) * amp, y);
        x.stroke();
      }
      // nœud du bois
      if (r() > 0.4) {
        const ky = r() * H, kx = i * pw + pw * (0.3 + r() * 0.4);
        x.strokeStyle = 'rgba(140,80,35,0.18)';
        for (let k = 1; k < 4; k++) {
          x.beginPath();
          x.ellipse(kx, ky, k * 3, k * 7, 0, 0, Math.PI * 2);
          x.stroke();
        }
      }
      // rainure entre planches
      x.fillStyle = 'rgba(120,70,30,0.28)';
      x.fillRect(i * pw - 1, 0, 2, H);
    }
    // voile de farine
    for (let i = 0; i < 6; i++) {
      const fx = r() * W, fy = stage.top + r() * (H - stage.top);
      const fr = 60 + r() * 120;
      const g = x.createRadialGradient(fx, fy, 0, fx, fy, fr);
      g.addColorStop(0, 'rgba(255,252,245,0.35)');
      g.addColorStop(1, 'rgba(255,252,245,0)');
      x.fillStyle = g;
      x.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
    }
    for (let i = 0; i < 900; i++) {
      x.fillStyle = `rgba(255,253,248,${0.15 + r() * 0.5})`;
      x.beginPath();
      x.arc(r() * W, r() * H, 0.4 + r() * 1.3, 0, Math.PI * 2);
      x.fill();
    }
    // vignette chaude
    const v = x.createRadialGradient(W / 2, H * 0.5, H * 0.25, W / 2, H * 0.5, H * 0.75);
    v.addColorStop(0, 'rgba(80,40,10,0)');
    v.addColorStop(1, 'rgba(80,40,10,0.28)');
    x.fillStyle = v;
    x.fillRect(0, 0, W, H);
    tableCache = c;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(tableCache, 0, 0);
  ctx.restore();
}

// Intérieur de la boutique : mur carrelé, étagères de pains, comptoir.
export function drawShop(ctx, counterY) {
  if (!shopCache) {
    const { c, x } = layer();
    const { W, H } = stage;
    const r = seeded(3);
    // mur
    const wall = x.createLinearGradient(0, 0, 0, counterY);
    wall.addColorStop(0, '#fbecd6');
    wall.addColorStop(1, '#f3dcbd');
    x.fillStyle = wall;
    x.fillRect(0, 0, W, H);
    // carrelage métro
    x.strokeStyle = 'rgba(200,160,120,0.22)';
    x.lineWidth = 1;
    const th = 22, tw = 44;
    for (let row = 0; row * th < counterY; row++) {
      const y = row * th;
      x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke();
      for (let col = -1; col * tw < W; col++) {
        const xx = col * tw + (row % 2 ? tw / 2 : 0);
        x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + th); x.stroke();
      }
    }
    // étagères avec pains
    const shelves = [stage.top + 30, stage.top + 120];
    shelves.forEach((sy, si) => {
      x.fillStyle = '#b97a45';
      x.fillRect(16, sy, W - 32, 9);
      x.fillStyle = '#9a5f31';
      x.fillRect(16, sy + 9, W - 32, 4);
      for (let i = 0; i < 6; i++) {
        const bx = 40 + i * ((W - 80) / 5);
        if (si === 0) {
          // baguettes debout dans un panier ? -> pains ronds
          x.fillStyle = '#c98236';
          x.beginPath(); x.ellipse(bx, sy - 13, 22, 14, 0, Math.PI, 0); x.fill();
          x.fillRect(bx - 22, sy - 13, 44, 13);
          x.strokeStyle = 'rgba(255,240,210,0.7)'; x.lineWidth = 2;
          x.beginPath(); x.moveTo(bx - 10, sy - 20); x.lineTo(bx + 4, sy - 16); x.stroke();
          x.beginPath(); x.moveTo(bx - 2, sy - 23); x.lineTo(bx + 12, sy - 19); x.stroke();
        } else {
          drawCroissantIcon(x, bx, sy - 12, 40 + r() * 4);
        }
      }
    });
    // ardoise
    x.fillStyle = '#3d3532';
    roundRect(x, W / 2 - 70, stage.top - 92, 140, 50, 8);
    x.fill();
    x.strokeStyle = '#a36b3f'; x.lineWidth = 5;
    roundRect(x, W / 2 - 70, stage.top - 92, 140, 50, 8);
    x.stroke();
    x.fillStyle = '#fff6e8';
    x.font = '600 18px Fredoka, ui-rounded, system-ui';
    x.textAlign = 'center';
    x.fillText('Fournil · Café', W / 2, stage.top - 61);

    // comptoir
    const cg = x.createLinearGradient(0, counterY, 0, H);
    cg.addColorStop(0, '#c88752');
    cg.addColorStop(1, '#a8673a');
    x.fillStyle = cg;
    x.fillRect(0, counterY + 22, W, H);
    // plateau de comptoir
    x.fillStyle = '#f5ebe0';
    x.fillRect(0, counterY, W, 24);
    x.fillStyle = 'rgba(0,0,0,0.08)';
    x.fillRect(0, counterY + 20, W, 4);
    // panneaux
    x.strokeStyle = 'rgba(90,45,15,0.25)';
    x.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      roundRect(x, 20 + i * ((W - 40) / 3) + 6, counterY + 44, (W - 40) / 3 - 12, H - counterY - 80, 10);
      x.stroke();
    }
    shopCache = c;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(shopCache, 0, 0);
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Plaque de cuisson avec papier sulfurisé
export function drawTray(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(70,35,10,0.25)';
  roundRect(ctx, x - w / 2 + 4, y - h / 2 + 8, w, h, 14);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, '#c9cdd2');
  g.addColorStop(1, '#9aa0a8');
  ctx.fillStyle = g;
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 14);
  ctx.fill();
  ctx.fillStyle = '#f7f0e2';
  roundRect(ctx, x - w / 2 + 10, y - h / 2 + 10, w - 20, h - 20, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,150,110,0.25)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 10 + rand(0, 0), y - h / 2 + 10 + ((h - 20) * i) / 4);
    ctx.lineTo(x + w / 2 - 10, y - h / 2 + 10 + ((h - 20) * i) / 4 + 3);
    ctx.stroke();
  }
}
