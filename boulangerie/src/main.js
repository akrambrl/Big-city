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
import { RECIPES } from './recipes/croissant.js';
import { TitleScene } from './scenes/title.js';
import { CounterScene } from './scenes/counter.js';
import { WorkbenchScene } from './scenes/workbench.js';
import { ResultScene } from './scenes/result.js';

const canvas = document.getElementById('stage');
initStage(canvas);
initInput(canvas);

audio.setEnabled(save.data.settings.sound);
haptics.enabled = save.data.settings.haptics;
input.firstTouch.push(() => audio.unlock());
live.init();

let scene = null;

const game = {
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
    this.nextCustomer();
  },
  nextCustomer() {
    // MVP : seul le croissant est disponible
    this.go(new CounterScene(this, RECIPES.croissant));
  },
  startRecipe(recipe, customer) {
    this.go(new WorkbenchScene(this, recipe, customer));
  },
  showResult(recipe, customer, prod, results) {
    this.go(new ResultScene(this, recipe, customer, prod, results));
  },
};

// Pour tester rapidement une étape : ?step=bake (0-4 ou nom)
const params = new URLSearchParams(location.search);
if (params.has('step')) {
  const r = RECIPES.croissant;
  const want = params.get('step');
  const idx = isNaN(+want) ? r.steps.findIndex((s) => s.key === want) : +want;
  live.show(true);
  const wb = new WorkbenchScene(game, r, { name: 'Test', mood: 'neutral', skin: '#ffd9b8', hair: '#3b2a20', cloth: '#8fc1d9', style: 'short', blinkT: 2, blink: 0 });
  wb.idx = Math.max(0, idx) - 1;
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
  if (live && !document.getElementById('hud').classList.contains('hidden')) live.update(dt);
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
