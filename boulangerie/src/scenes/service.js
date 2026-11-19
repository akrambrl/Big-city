// Le service : les clients commandent, on sert les gâteaux et on prépare les boissons.
// Ambiance cosy : la patience ne change que le pourboire, personne ne repart fâché.
import { stage } from '../core/stage.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { save } from '../core/save.js';
import { tween, ease, wait, pick, clamp } from '../core/util.js';
import { ui } from '../ui.js';
import { live } from '../live/live.js';
import { drawShop, roundRect } from '../render/scenery.js';
import { makeCustomer, updateCustomer, drawCustomer, drawHeart } from '../render/customer.js';
import { PRODUCTS, DRINKS, CAKES, weightedScore } from '../recipes/index.js';
import { WorkbenchScene } from './workbench.js';

const PATIENCE = 90; // secondes avant que la patience soit au plus bas

// Les clients demandent surtout ce qui est en vitrine (mais pas toujours !)
function makeOrder(stock) {
  const r = Math.random();
  const items = [];
  if (r < 0.75) items.push(pick(DRINKS));
  if (r > 0.25 || !items.length) {
    const avail = CAKES.filter((id) => (stock[id]?.left || 0) > 0);
    items.push(avail.length && Math.random() < 0.75 ? pick(avail) : pick(CAKES));
  }
  return items.map((id) => ({ id, status: 'todo', q: 0 }));
}

export class ServiceScene {
  constructor(game, count = 6) {
    this.game = game;
    this.t = 0;
    this.queue = Array.from({ length: count }, () => ({ c: makeCustomer() }));
    this.total = count;
    this.cust = null;
    this.started = false;
    this.floats = [];
    this.busy = false;
  }

  get counterY() {
    return Math.max(stage.top + 230, stage.H * 0.58);
  }

  enter() {
    ui.hideBanner();
    document.getElementById('app').classList.add('service');
    live.setContext('service');
    if (!this.started) {
      this.started = true;
      ui.pop('On ouvre ! 🔔', `${this.total} clients ce matin`);
      audio.bell();
      live.comment('service');
      setTimeout(() => this.nextCustomer(), 1000);
    } else if (this.cust) {
      // une animation a pu être coupée par le passage au plan de travail
      if (!this.cust.leaving) Object.assign(this.cust, { bubble: 1, walk: 0, x: stage.W / 2 - 40 });
      this.renderCards();
      if (this.cust.order.every((it) => it.status !== 'todo')) setTimeout(() => this.serve(), 450);
    }
  }

  exit() {
    document.getElementById('app').classList.remove('service');
  }

  async nextCustomer() {
    const next = this.queue.shift();
    if (!next) {
      this.game.endDay();
      return;
    }
    const cu = { ...next, order: makeOrder(this.game.stock), x: stage.W + 120, walk: 1, bubble: 0, arrived: performance.now() / 1000, quote: '' };
    this.cust = cu;
    cu.c.mood = 'neutral';
    // les gâteaux en rupture sont signalés tout de suite
    for (const it of cu.order) {
      const p = PRODUCTS[it.id];
      if (p.kind === 'cake' && !((this.game.stock[it.id]?.left || 0) > 0)) it.status = 'out';
    }
    audio.bell();
    await tween(cu, { x: stage.W / 2 - 40 }, 1.1, ease.outCubic);
    if (this.cust !== cu) return;
    cu.walk = 0;
    audio.pop(1.1);
    haptics.tap(10);
    live.comment('order');
    tween(cu, { bubble: 1 }, 0.45, ease.outBack);
    if (cu.order.some((it) => it.status === 'out')) setTimeout(() => live.comment('soldout'), 700);
    await wait(0.3);
    this.renderCards();
    if (cu.order.every((it) => it.status !== 'todo')) setTimeout(() => this.serve(), 900);
  }

  renderCards() {
    document.querySelectorAll('#ui .order-cards').forEach((e) => e.remove());
    const cu = this.cust;
    if (!cu || cu.leaving) return ui.syncLift();
    const html = cu.order.map((it, i) => {
      const p = PRODUCTS[it.id];
      const st = it.status === 'done' ? '✓ Prêt' : it.status === 'out' ? 'Rupture 😢' : p.kind === 'drink' ? 'Préparer' : 'Servir';
      const left = p.kind === 'cake' ? ` · ${this.game.stock[it.id]?.left || 0} en vitrine` : '';
      return `<button class="ocard ${it.status}" data-i="${i}" ${it.status !== 'todo' ? 'disabled' : ''}>
        <span class="o-emoji">${p.emoji}</span><span class="o-body"><b>${p.name}</b><small>${st}${it.status === 'todo' ? left : ''}</small></span></button>`;
    }).join('');
    const el = ui.el(html, 'order-cards');
    el.querySelectorAll('.ocard').forEach((b) => {
      b.addEventListener('pointerdown', () => { audio.pop(0.9); haptics.tap(10); });
      b.addEventListener('click', () => this.prepare(cu.order[+b.dataset.i]));
    });
  }

  prepare(item) {
    if (this.busy || item.status !== 'todo') return;
    const p = PRODUCTS[item.id];
    const stock = this.game.stock[item.id];
    const recipe = p.serveRecipe(stock || {});
    this.busy = true;
    this.game.go(new WorkbenchScene(this.game, recipe, (prod, results) => {
      const sc = weightedScore(results);
      if (p.kind === 'cake') {
        item.q = 0.5 * (stock?.quality ?? 0.7) + 0.5 * sc;
        if (stock) stock.left = Math.max(0, stock.left - 1);
      } else {
        item.q = sc;
      }
      item.status = 'done';
      this.busy = false;
      this.game.go(this);
    }));
  }

  async serve() {
    const cu = this.cust;
    if (!cu || cu.leaving) return;
    cu.leaving = true;
    document.querySelectorAll('#ui .order-cards').forEach((e) => e.remove());
    ui.syncLift();
    const served = cu.order.filter((it) => it.status === 'done');
    const missing = cu.order.some((it) => it.status === 'out');
    const avgQ = served.length ? served.reduce((s, it) => s + it.q, 0) / served.length : 0;
    const waited = performance.now() / 1000 - cu.arrived;
    const patience = clamp(1 - waited / PATIENCE, 0.3, 1);
    const pay = served.reduce((s, it) => s + PRODUCTS[it.id].price * (0.8 + 0.4 * it.q), 0);
    const tip = missing || !served.length ? 0 : Math.round(avgQ * 4 * patience + (avgQ > 0.9 ? 2 : 0));
    const coins = Math.round(pay) + tip;

    cu.c.mood = !served.length ? 'sad' : missing ? 'meh' : avgQ > 0.85 ? 'love' : avgQ > 0.6 ? 'happy' : 'meh';
    cu.quote = !served.length
      ? 'Tant pis, à demain…'
      : missing
        ? 'Dommage pour le gâteau… merci !'
        : avgQ > 0.85 ? pick(['Parfait, merci ! 😍', 'Le meilleur café du quartier !', 'Je reviendrai demain !']) : avgQ > 0.6 ? pick(['Merci beaucoup !', 'Ça a l\'air délicieux !']) : 'Merci…';

    const st = this.game.dayStats;
    st.served += served.length ? 1 : 0;
    st.coins += coins;
    st.tips += tip;
    if (missing) st.missed += 1;
    save.data.coins += coins;
    save.data.served += served.length ? 1 : 0;
    const likes = Math.round(live.viewers * 0.15 * (0.5 + avgQ));
    save.data.likes += likes;
    st.likes += likes;
    if (avgQ > 0.85 && !missing) {
      const f = 1 + Math.floor(Math.random() * 3);
      save.data.followers += f;
      st.followers += f;
    }
    save.write();

    if (coins > 0) {
      audio.register();
      for (let i = 0; i < Math.min(6, Math.ceil(coins / 3)); i++) audio.coin(i);
      haptics.pattern([15, 30, 15]);
      this.floats.push({ text: `+${coins} 🪙${tip ? `  (pourboire ${tip})` : ''}`, x: stage.W / 2, y: this.counterY - 20, life: 1.6 });
      particles.sparkle(stage.W / 2, this.counterY - 10, 12, 120, '#ffe680');
    }
    live.refreshStats('coins');
    setTimeout(() => live.refreshStats('likes'), 300);
    if (cu.c.mood === 'love') { live.react('great', avgQ); particles.confetti(stage.W / 2, this.counterY - 60, 24); }
    else live.react(cu.c.mood === 'happy' ? 'good' : 'meh', avgQ);

    await wait(1.8);
    if (this.cust !== cu) return;
    cu.walk = 1;
    cu.bubble = 0;
    await tween(cu, { x: -160 }, 1, ease.inOutCubic);
    if (this.cust !== cu) return;
    this.cust = null;
    await wait(0.4);
    this.nextCustomer();
  }

  update(dt) {
    this.t += dt;
    if (this.cust) updateCustomer(this.cust.c, dt);
    for (const f of this.floats) { f.life -= dt; f.y -= dt * 30; }
    this.floats = this.floats.filter((f) => f.life > 0);
  }

  draw(ctx) {
    const cy = this.counterY;
    drawShop(ctx, cy);
    const cu = this.cust;
    if (cu) {
      const bob = cu.walk ? Math.abs(Math.sin(this.t * 9)) * -10 : Math.sin(this.t * 2) * 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, stage.W, cy + 2);
      ctx.clip();
      drawCustomer(ctx, cu.c, cu.x, cy - 75, 1, bob);
      ctx.restore();

      // patience (cœurs) au-dessus de la tête
      if (!cu.walk && !cu.leaving) {
        const pat = clamp(1 - (performance.now() / 1000 - cu.arrived) / PATIENCE, 0.3, 1);
        const px = cu.x - 40, py = cy - 160;
        ctx.fillStyle = 'rgba(60,35,20,0.35)';
        roundRect(ctx, px, py, 80, 10, 5);
        ctx.fill();
        ctx.fillStyle = pat > 0.6 ? '#ff7f95' : pat > 0.4 ? '#ffb36b' : '#d9a07a';
        roundRect(ctx, px, py, 80 * pat, 10, 5);
        ctx.fill();
        drawHeart(ctx, px - 8, py + 5, 7, '#ff5f7a');
      }

      // bulle : commande ou remerciement
      if (cu.bubble > 0.01 || cu.leaving) {
        const bx = Math.min(stage.W - 92, cu.x + 120), by = cy - 210;
        const k = cu.leaving ? 1 : cu.bubble;
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(k, k);
        ctx.fillStyle = 'rgba(90,45,15,0.15)';
        roundRect(ctx, -82, -60, 168, 128, 28);
        ctx.fill();
        ctx.fillStyle = '#fff';
        roundRect(ctx, -84, -64, 168, 126, 28);
        ctx.fill();
        ctx.beginPath(); ctx.moveTo(-56, 56); ctx.lineTo(-92, 86); ctx.lineTo(-26, 60); ctx.fill();
        if (cu.leaving && cu.walk === 0) {
          ctx.fillStyle = '#5b3a29';
          ctx.font = '600 15px Fredoka, ui-rounded, system-ui';
          ctx.textAlign = 'center';
          wrap(ctx, cu.quote, 0, -6, 140, 19);
        } else {
          const n = cu.order.length;
          cu.order.forEach((it, i) => {
            const ix = n === 1 ? 0 : (i - 0.5) * 76;
            ctx.save();
            ctx.translate(ix, -6);
            ctx.rotate(Math.sin(this.t * 3 + i) * 0.05);
            ctx.globalAlpha = it.status === 'out' ? 0.4 : 1;
            PRODUCTS[it.id].icon(ctx, 0, 0, n === 1 ? 100 : 72);
            ctx.globalAlpha = 1;
            ctx.restore();
            if (it.status === 'done') badge(ctx, ix + 24, -34, '#5cbf72', '✓');
            if (it.status === 'out') badge(ctx, ix + 24, -34, '#e8466a', '✕');
          });
        }
        ctx.restore();
      }
    }

    // vitrine : stock restant
    const ids = CAKES.filter((id) => this.game.stock[id]);
    const vy = cy + 30;
    ctx.fillStyle = 'rgba(255,248,238,0.92)';
    roundRect(ctx, 16, vy, stage.W - 32, 54, 16);
    ctx.fill();
    ctx.fillStyle = '#9a7562';
    ctx.font = '600 12px Fredoka, ui-rounded, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('VITRINE', 30, vy + 18);
    if (!ids.length) {
      ctx.fillStyle = '#5b3a29';
      ctx.font = '500 15px Fredoka, ui-rounded, system-ui';
      ctx.fillText('Vide… (que des boissons aujourd\'hui)', 30, vy + 40);
    }
    ids.forEach((id, i) => {
      const p = PRODUCTS[id];
      const s = this.game.stock[id];
      const x = 110 + i * 130;
      ctx.globalAlpha = s.left > 0 ? 1 : 0.35;
      p.icon(ctx, x, vy + 27, 48);
      ctx.globalAlpha = 1;
      ctx.fillStyle = s.left > 0 ? '#5b3a29' : '#e8466a';
      ctx.font = '700 17px Fredoka, ui-rounded, system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(s.left > 0 ? `× ${s.left}` : 'épuisé', x + 30, vy + 33);
    });
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9a7562';
    ctx.font = '600 12px Fredoka, ui-rounded, system-ui';
    const done = this.total - this.queue.length - (this.cust ? 1 : 0);
    ctx.fillText(`client ${Math.min(this.total, done + 1)}/${this.total}`, stage.W - 30, vy + 18);

    for (const f of this.floats) {
      ctx.globalAlpha = Math.min(1, f.life * 1.5);
      ctx.font = '700 22px Fredoka, ui-rounded, system-ui';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#9c5418';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = '#ffe27a';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }
}

function badge(ctx, x, y, color, txt) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 15px Fredoka, ui-rounded, system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(txt, x, y + 5);
}

function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  lines.push(line);
  const y0 = y - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, y0 + i * lh));
}
