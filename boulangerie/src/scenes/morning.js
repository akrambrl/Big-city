// Le matin : on choisit ses missions de préparation (2 maximum).
import { stage } from '../core/stage.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { rand } from '../core/util.js';
import { ui, bindButton } from '../ui.js';
import { live } from '../live/live.js';
import { drawTable } from '../render/scenery.js';
import { PRODUCTS, MISSIONS } from '../recipes/index.js';

const MAX = 2;

export class MorningScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.selected = [];
  }

  enter() {
    ui.hideBanner();
    live.setContext('morning');
    live.comment('morning');
    const day = this.game.day;
    const cards = MISSIONS.map((id) => {
      const p = PRODUCTS[id];
      if (p.soon) {
        return `<button class="mission soon" disabled><span class="m-emoji">${p.emoji}</span><span class="m-body"><b>${p.name}</b><small>Bientôt</small></span></button>`;
      }
      return `<button class="mission" data-id="${id}"><span class="m-emoji">${p.emoji}</span><span class="m-body"><b>${p.name}</b><small>${p.batch} ${p.unit} · ${p.time}</small></span><span class="m-check">✓</span></button>`;
    }).join('');
    const root = ui.el(`
      <div class="sheet-title">☀️ Jour ${day.n} · Préparation du matin</div>
      <div class="sheet-sub">Choisis tes fournées (${MAX} max). Les clients commanderont aussi des lattes ☕</div>
      <div class="missions">${cards}</div>
      <button class="btn pink go" disabled>Choisis une fournée</button>
    `, 'morning-sheet');
    const go = root.querySelector('.go');
    const refresh = () => {
      root.querySelectorAll('.mission[data-id]').forEach((b) => b.classList.toggle('on', this.selected.includes(b.dataset.id)));
      go.disabled = this.selected.length === 0;
      go.textContent = this.selected.length ? `Au fournil ! (${this.selected.length})` : 'Choisis une fournée';
    };
    root.querySelectorAll('.mission[data-id]').forEach((b) => {
      b.addEventListener('click', () => {
        audio.unlock();
        const id = b.dataset.id;
        if (this.selected.includes(id)) {
          this.selected = this.selected.filter((x) => x !== id);
          audio.pop(0.8);
        } else {
          if (this.selected.length >= MAX) this.selected.shift();
          this.selected.push(id);
          audio.pop(1.2);
        }
        haptics.tap(10);
        refresh();
      });
    });
    bindButton(go, () => {
      if (!this.selected.length) return;
      audio.chime();
      this.game.startMissions([...this.selected]);
    });
  }

  exit() {}

  update(dt) {
    this.t += dt;
    if (Math.random() < dt * 6) {
      particles.spawn({ x: rand(0, stage.W), y: -10, vx: rand(-10, 10), vy: rand(20, 50), life: rand(5, 9), size: rand(1, 3), color: '#fffaf0', alpha: rand(0.4, 0.9), drag: 1 });
    }
  }

  draw(ctx) {
    drawTable(ctx);
    // lumière du matin par la fenêtre
    const g = ctx.createLinearGradient(0, 0, stage.W, stage.H * 0.6);
    g.addColorStop(0, `rgba(255,230,170,${0.45 + Math.sin(this.t * 0.8) * 0.05})`);
    g.addColorStop(1, 'rgba(255,230,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, stage.W, stage.H);
  }
}
