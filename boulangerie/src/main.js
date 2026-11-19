import './styles.css';
import { initStage, beginFrame, stage } from './core/stage.js';
import { initInput, input } from './core/input.js';
import { audio } from './core/audio.js';
import { haptics } from './core/haptics.js';
import { particles } from './core/particles.js';
import { save } from './core/save.js';
import { updateTweens, clearTweens } from './core/util.js';
import { live } from './live/live.js';
import { ui } from './ui.js';
import { PRODUCTS } from './recipes/index.js';
import { TitleScene } from './scenes/title.js';
import { MorningScene } from './scenes/morning.js';
import { WorkbenchScene } from './scenes/workbench.js';
import { ResultScene } from './scenes/result.js';
import { ServiceScene } from './scenes/service.js';
import { DayEndScene } from './scenes/dayEnd.js';

const canvas = document.getElementById('stage');
initStage(canvas);
initInput(canvas);

audio.setEnabled(save.data.settings.sound);
haptics.enabled = save.data.settings.haptics;
input.firstTouch.push(() => audio.unlock());
live.init();

let scene = null;
const CUSTOMERS_PER_DAY = 6;

// Une journée : missions du matin -> service -> bilan
const game = {
  day: { n: 1 },
  stock: {},
  dayStats: {},
  missions: [],

  go(next) {
    if (scene && scene.exit) scene.exit();
    clearTweens();
    ui.clear();
    scene = next;
    input.target = scene;
    scene.enter && scene.enter();
  },

  startShift() {
    live.show(true);
    live.hype = 0.3;
    this.newDay();
  },

  newDay() {
    this.day = { n: save.data.day || 1 };
    this.stock = {};
    this.dayStats = { served: 0, coins: 0, tips: 0, likes: 0, followers: 0, missed: 0, customers: CUSTOMERS_PER_DAY };
    this.go(new MorningScene(this));
  },

  startMissions(list) {
    this.missions = list;
    this.runNextMission();
  },

  runNextMission() {
    const id = this.missions.shift();
    if (!id) return this.openShop();
    const p = PRODUCTS[id];
    this.go(new WorkbenchScene(this, p.mission, (prod, results) => {
      this.go(new ResultScene(this, p.mission, prod, results, {
        product: p,
        nextLabel: this.missions.length ? 'Fournée suivante →' : 'Ouvrir la boutique ☕',
        onNext: () => this.runNextMission(),
      }));
    }));
  },

  addStock(id, prod, score) {
    const s = this.stock[id] || (this.stock[id] = { left: 0 });
    s.left += PRODUCTS[id].batch;
    s.bake = prod.bake ?? 0.7;
    s.quality = score;
  },

  openShop() {
    this.go(new ServiceScene(this, CUSTOMERS_PER_DAY));
  },

  endDay() {
    save.data.day = (save.data.day || 1) + 1;
    save.write();
    this.go(new DayEndScene(this));
  },
};

// Raccourcis de test : ?mission=bananabread, ?service, ?step=latte:1
const params = new URLSearchParams(location.search);
if (params.has('mission')) {
  live.show(true);
  game.newDay();
  game.startMissions([params.get('mission')]);
} else if (params.has('service')) {
  live.show(true);
  game.newDay();
  game.addStock('bananabread', { bake: 0.7 }, 0.9);
  game.addStock('croissant', { bake: 0.7 }, 0.9);
  game.openShop();
} else if (params.has('step')) {
  const [rid, n] = params.get('step').split(':');
  const p = PRODUCTS[rid];
  const recipe = p.mission || p.serveRecipe({ left: 8, bake: 0.7, quality: 0.8 });
  live.show(true);
  const wb = new WorkbenchScene(game, recipe, () => game.go(new TitleScene(game)));
  wb.idx = (+n || 0) - 1;
  game.go(wb);
} else {
  game.go(new TitleScene(game));
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  updateTweens(dt);
  if (scene) scene.update(dt);
  particles.update(dt);
  if (!document.getElementById('hud').classList.contains('hidden')) live.update(dt);
  beginFrame(dt);
  const ctx = stage.ctx;
  if (scene) scene.draw(ctx);
  particles.draw(ctx);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.suspend();
  else { audio.resume(); last = performance.now(); }
});

// exposé pour le débogage
window.__game = game;
Object.defineProperty(window, '__scene', { get: () => scene });
