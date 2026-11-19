// Résultat : étoiles, réaction du client, récompenses.
import { stage } from '../core/stage.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles, drawStar } from '../core/particles.js';
import { save } from '../core/save.js';
import { tween, ease, wait, randi, rand } from '../core/util.js';
import { ui } from '../ui.js';
import { live } from '../live/live.js';
import { drawTable } from '../render/scenery.js';
import { updateCustomer } from '../render/customer.js';

export class ResultScene {
  constructor(game, recipe, customer, prod, results) {
    this.game = game;
    this.recipe = recipe;
    this.customer = customer;
    this.prod = prod;
    this.results = results;
    this.t = 0;
    this.score = results.reduce((s, r) => s + r.score * r.weight, 0) / results.reduce((s, r) => s + r.weight, 0);
    let stars = this.score >= 0.85 ? 3 : this.score >= 0.62 ? 2 : 1;
    this.burnt = (prod.bake ?? 0) > 0.9;
    if (this.burnt) stars = 1;
    this.stars = stars;
    this.starAnim = [0, 0, 0].map(() => ({ s: 0 }));
    this.plate = { s: 0 };
    this.steamT = 0;
    this.custY = 0;
  }

  get starsY() {
    return (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0) / stage.scale + 92;
  }
  get panelTop() {
    const r = stage.canvas.getBoundingClientRect();
    return this.panelTopPx ? (this.panelTopPx - r.top) / stage.scale : stage.H - 330 / stage.scale;
  }
  get plateY() {
    return (this.starsY + 40 + this.panelTop) / 2 + 6;
  }
  get size() {
    return Math.max(150, Math.min(250, (this.panelTop - this.starsY - 40) * 1.45));
  }

  async enter() {
    ui.clear();
    ui.hideBanner();
    const { stars } = this;
    const customer = this.customer;

    // récompenses
    const tip = stars === 3 ? randi(4, 10) : 0;
    const coins = Math.round(6 + stars * 10 + this.score * 8) + tip;
    const likes = Math.round(live.viewers * (0.3 + this.score) * (stars === 3 ? 1.8 : 1));
    const followers = stars === 3 ? randi(4, 9) : stars === 2 ? randi(1, 4) : randi(0, 1);
    const d = save.data;
    d.coins += coins;
    d.likes += likes;
    d.followers += followers;
    d.served += 1;
    d.best[this.recipe.id] = Math.max(d.best[this.recipe.id] || 0, stars);
    save.write();

    const quote = this.burnt
      ? 'C\'est… un peu cramé, non ? 😬'
      : stars === 3
        ? pickQuote(['Magnifique ! Je reviendrai 😍', 'Le meilleur croissant du quartier !', 'Il est parfait, merci !'])
        : stars === 2
          ? pickQuote(['Merci, il a l\'air délicieux !', 'Très joli, merci beaucoup !'])
          : pickQuote(['Hmm… merci quand même.', 'Il est… original. Merci !']);

    const rows = this.results
      .map((r) => `<span>${r.label}</span><div class="bar"><i style="width:${Math.round(r.score * 100)}%"></i></div><span class="lbl">${Math.round(r.score * 100)}%</span>`)
      .join('');
    const panel = ui.el(`
      <div class="client-quote">${customer.name} : « ${quote} »</div>
      <div class="rewards">
        <div class="reward">+${coins}<small>🪙 pièces</small></div>
        <div class="reward">+${likes}<small>❤ likes</small></div>
        <div class="reward">+${followers}<small>👤 abonnés</small></div>
      </div>
      <div class="breakdown">${rows}</div>
    `, 'result-panel pending');
    this.panelEl = panel;
    this.panelTopPx = panel.getBoundingClientRect().top;


    audio.whoosh();
    await tween(this.plate, { s: 1 }, 0.5, ease.outBack);
    audio.crackle(0.9, 0.8);

    for (let i = 0; i < 3; i++) {
      await wait(0.38);
      if (i < stars) {
        audio.star(i);
        haptics.tap(18 + i * 8);
        tween(this.starAnim[i], { s: 1 }, 0.55, ease.outElastic);
        const [sx, sy] = this.starPos(i);
        particles.sparkle(sx, sy, 10, 40, '#ffe680');
      } else {
        tween(this.starAnim[i], { s: 0.7 }, 0.3, ease.outBack);
      }
    }

    customer.mood = this.burnt ? 'sad' : stars === 3 ? 'love' : stars === 2 ? 'happy' : 'meh';
    if (stars === 3) {
      audio.chime();
      haptics.pattern([30, 50, 30, 50, 60]);
      particles.confetti(stage.W / 2, this.plateY, 50);
      live.celebrate();
    } else {
      live.react(this.burnt ? 'burnt' : stars === 2 ? 'good' : 'meh', this.score);
    }

    panel.classList.remove('pending');
    ui.syncLift();
    const keys = ['coins', 'likes', 'followers'];
    const rewards = panel.querySelectorAll('.reward');
    for (let i = 0; i < rewards.length; i++) {
      await wait(0.3);
      rewards[i].classList.add('in');
      if (i === 0) for (let k = 0; k < 5; k++) audio.coin(k);
      else audio.pop(1.2 + i * 0.2);
      haptics.tap(12);
      live.refreshStats(keys[i]);
    }
    await wait(0.4);
    ui.button('Client suivant →', () => this.game.nextCustomer());
  }

  exit() {}

  starPos(i) {
    return [stage.W / 2 + (i - 1) * 78, this.starsY + (i === 1 ? -8 : 6)];
  }

  update(dt) {
    this.t += dt;
    updateCustomer(this.customer, dt);
    this.steamT -= dt;
    if (this.steamT <= 0 && this.plate.s > 0.5) {
      this.steamT = 0.18;
      particles.steam(stage.W / 2, this.plateY - 40, 120);
    }
    if (this.stars === 3 && Math.random() < dt * 3) {
      particles.sparkle(stage.W / 2 + rand(-110, 110), this.plateY + rand(-50, 20), 1, 10);
    }
  }

  down(p) {
    // tapoter le croissant : il croustille
    if (Math.hypot(p.x - stage.W / 2, p.y - this.plateY) < 120) {
      audio.crackle(1, 0.3);
      haptics.tap(12);
      particles.crumbs(p.x, p.y, 6);
      this.squish = 1;
    }
  }

  draw(ctx) {
    drawTable(ctx);
    const cx = stage.W / 2, py = this.plateY;
    const s = this.plate.s;
    // assiette
    ctx.save();
    ctx.translate(cx, py + this.size * 0.12);
    ctx.scale(s * this.size / 250, s * this.size / 250);
    ctx.fillStyle = 'rgba(90,45,15,0.2)';
    ctx.beginPath(); ctx.ellipse(6, 14, 175, 62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fdfaf4';
    ctx.beginPath(); ctx.ellipse(0, 0, 175, 62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200,170,130,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -2, 130, 42, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    this.squish = Math.max(0, (this.squish || 0) - 1 / 15);
    const sq = this.squish;
    ctx.save();
    ctx.translate(cx, py);
    ctx.scale(s * (1 + sq * 0.05), s * (1 - sq * 0.05));
    this.recipe.drawFinal(ctx, 0, 0, this.size, this.prod, { shine: 0.05 + Math.max(0, Math.sin(this.t * 2.5)) * 0.08 });
    ctx.restore();

    // étoiles
    for (let i = 0; i < 3; i++) {
      const a = this.starAnim[i];
      if (a.s <= 0.01) continue;
      const [sx, sy] = this.starPos(i);
      const on = i < this.stars;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(a.s, a.s);
      ctx.rotate(on ? Math.sin(this.t * 2 + i) * 0.08 : 0);
      ctx.fillStyle = on ? '#b86a10' : 'rgba(120,80,50,0.25)';
      drawStar(ctx, 2, 4, i === 1 ? 38 : 31, -Math.PI / 2, 5, 0.48);
      ctx.fillStyle = on ? '#ffc933' : 'rgba(255,255,255,0.45)';
      drawStar(ctx, 0, 0, i === 1 ? 38 : 31, -Math.PI / 2, 5, 0.48);
      if (on) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        drawStar(ctx, -6, -8, i === 1 ? 12 : 10, -Math.PI / 2, 5, 0.5);
      }
      ctx.restore();
    }

  }
}

function pickQuote(a) {
  return a[Math.floor(Math.random() * a.length)];
}
