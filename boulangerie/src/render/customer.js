// Clients tout ronds et mignons, générés au hasard.
import { pick, rand } from '../core/util.js';

const SKINS = ['#ffd9b8', '#f2c29b', '#d9a07a', '#b07850', '#8a5a3c', '#ffe3c9'];
const HAIRS = ['#3b2a20', '#6b4227', '#c9853f', '#e8c37a', '#2a2a2a', '#a33d2b', '#d8d0c8'];
const CLOTHES = ['#8fc1d9', '#f29e9e', '#9fd1a8', '#f2c46d', '#b8a4e3', '#f5a97f', '#7ba7e0'];
const NAMES = ['Mme Duval', 'M. Petit', 'Léa', 'Papi Jo', 'Inès', 'M. Martin', 'Chloé', 'Mamie Rose', 'Hugo', 'Nina'];
const STYLES = ['beret', 'bun', 'short', 'long', 'cap', 'bald'];

export function makeCustomer() {
  return {
    skin: pick(SKINS),
    hair: pick(HAIRS),
    cloth: pick(CLOTHES),
    style: pick(STYLES),
    name: pick(NAMES),
    glasses: Math.random() < 0.3,
    blinkT: rand(1, 3),
    blink: 0,
    mood: 'neutral', // neutral | happy | love | meh | sad
  };
}

export function updateCustomer(c, dt) {
  c.blinkT -= dt;
  if (c.blinkT <= 0) { c.blink = 0.14; c.blinkT = rand(2, 4.5); }
  if (c.blink > 0) c.blink -= dt;
}

export function drawCustomer(ctx, c, x, y, s = 1, bob = 0) {
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(s, s);

  // corps
  ctx.fillStyle = c.cloth;
  ctx.beginPath();
  ctx.ellipse(0, 78, 62, 52, 0, Math.PI, 0);
  ctx.lineTo(62, 130);
  ctx.lineTo(-62, 130);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(-18, 50, 18, 8, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // cou
  ctx.fillStyle = c.skin;
  ctx.fillRect(-12, 20, 24, 18);

  // cheveux longs (derrière)
  if (c.style === 'long') {
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.ellipse(0, 2, 50, 56, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // tête
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(0, -8, 44, 0, Math.PI * 2);
  ctx.fill();
  // oreilles
  ctx.beginPath(); ctx.arc(-43, -4, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(43, -4, 9, 0, Math.PI * 2); ctx.fill();

  // cheveux / chapeau
  ctx.fillStyle = c.hair;
  if (c.style === 'beret') {
    ctx.beginPath(); ctx.arc(0, -20, 44, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.fillStyle = '#3d2f45';
    ctx.beginPath(); ctx.ellipse(6, -50, 46, 15, -0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -66, 5, 0, Math.PI * 2); ctx.fill();
  } else if (c.style === 'bun') {
    ctx.beginPath(); ctx.arc(0, -16, 45, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -64, 18, 0, Math.PI * 2); ctx.fill();
  } else if (c.style === 'short' || c.style === 'long') {
    ctx.beginPath();
    ctx.arc(0, -14, 46, Math.PI * 0.95, Math.PI * 2.05);
    ctx.quadraticCurveTo(10, -30, -20, -26);
    ctx.quadraticCurveTo(-36, -22, -44, -6);
    ctx.fill();
  } else if (c.style === 'cap') {
    ctx.fillStyle = c.cloth;
    ctx.beginPath(); ctx.arc(0, -20, 45, Math.PI, 0); ctx.fill();
    ctx.fillRect(-4, -26, 66, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(0, -62, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(-40, -16, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(40, -16, 10, 0, Math.PI * 2); ctx.fill();
  }

  // joues
  ctx.fillStyle = 'rgba(255,120,120,0.35)';
  ctx.beginPath(); ctx.ellipse(-24, 8, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(24, 8, 9, 6, 0, 0, Math.PI * 2); ctx.fill();

  // yeux
  ctx.fillStyle = '#3a2418';
  ctx.strokeStyle = '#3a2418';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  const ey = -6;
  if (c.mood === 'love') {
    drawHeart(ctx, -16, ey, 9, '#ff5f7a');
    drawHeart(ctx, 16, ey, 9, '#ff5f7a');
  } else if (c.mood === 'happy') {
    for (const ex of [-16, 16]) {
      ctx.beginPath(); ctx.arc(ex, ey + 3, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
  } else if (c.blink > 0) {
    for (const ex of [-16, 16]) {
      ctx.beginPath(); ctx.moveTo(ex - 5, ey); ctx.lineTo(ex + 5, ey); ctx.stroke();
    }
  } else {
    for (const ex of [-16, 16]) {
      ctx.beginPath(); ctx.ellipse(ex, ey, 4.5, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex + 1.5, ey - 2, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2418';
    }
  }
  if (c.glasses) {
    ctx.strokeStyle = 'rgba(60,40,30,0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(-16, ey, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(16, ey, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, ey); ctx.lineTo(5, ey); ctx.stroke();
  }

  // bouche
  ctx.strokeStyle = '#7a3a2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (c.mood === 'happy' || c.mood === 'love') {
    ctx.fillStyle = '#8a3a2e';
    ctx.arc(0, 14, 9, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ff8f8f';
    ctx.beginPath(); ctx.arc(0, 19, 4, 0, Math.PI); ctx.fill();
  } else if (c.mood === 'meh') {
    ctx.moveTo(-7, 18); ctx.lineTo(7, 16); ctx.stroke();
  } else if (c.mood === 'sad') {
    ctx.arc(0, 24, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else {
    ctx.arc(0, 12, 7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  }
  ctx.restore();
}

export function drawHeart(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  ctx.fill();
  ctx.restore();
}
