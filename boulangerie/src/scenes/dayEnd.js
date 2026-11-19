// Bilan de la journée.
import { stage } from '../core/stage.js';
import { audio } from '../core/audio.js';
import { particles } from '../core/particles.js';
import { rand } from '../core/util.js';
import { ui } from '../ui.js';
import { live } from '../live/live.js';
import { drawTable } from '../render/scenery.js';
import { PRODUCTS, CAKES } from '../recipes/index.js';

export class DayEndScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
  }

  enter() {
    ui.hideBanner();
    live.setContext('idle');
    const st = this.game.dayStats;
    const left = CAKES.filter((id) => this.game.stock[id]?.left > 0)
      .map((id) => `${this.game.stock[id].left} ${PRODUCTS[id].emoji}`)
      .join(' · ');
    const rows = [
      ['Clients servis', `${st.served} / ${st.customers}`],
      ['Pièces gagnées', `🪙 ${st.coins}`],
      ['dont pourboires', `🪙 ${st.tips}`],
      ['Likes', `❤ ${st.likes}`],
      ['Nouveaux abonnés', `👤 +${st.followers}`],
    ];
    if (st.missed) rows.push(['Gâteaux en rupture', `😢 ${st.missed}`]);
    ui.el(`
      <div class="sheet-title">🌙 Fin de la journée ${this.game.day.n}</div>
      <div class="day-rows">${rows.map(([a, b]) => `<span>${a}</span><b>${b}</b>`).join('')}</div>
      ${left ? `<div class="sheet-sub">Invendus donnés aux voisins 💛 ${left}</div>` : '<div class="sheet-sub">Tout est parti, vitrine vide ! ✨</div>'}
    `, 'day-sheet');
    audio.chime();
    live.celebrate();
    setTimeout(() => ui.button('Journée suivante ☀️', () => this.game.newDay()), 800);
  }

  exit() {}

  update(dt) {
    this.t += dt;
    if (Math.random() < dt * 4) particles.sparkle(rand(0, stage.W), rand(stage.H * 0.6, stage.H * 0.8), 1, 10, '#fff3c4');
  }

  draw(ctx) {
    drawTable(ctx);
    const g = ctx.createLinearGradient(0, 0, 0, stage.H);
    g.addColorStop(0, 'rgba(70,50,110,0.35)');
    g.addColorStop(1, 'rgba(255,150,90,0.15)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, stage.W, stage.H);
  }
}
