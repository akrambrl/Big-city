// Plan de travail : enchaîne les étapes de la recette.
import { stage } from '../core/stage.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { tween, ease, wait } from '../core/util.js';
import { ui } from '../ui.js';
import { live } from '../live/live.js';
import { drawTable } from '../render/scenery.js';

const RATING = (s) => (s >= 0.9 ? 'Parfait !' : s >= 0.75 ? 'Super !' : s >= 0.5 ? 'Pas mal' : 'Oups…');

export class WorkbenchScene {
  constructor(game, recipe, customer) {
    this.game = game;
    this.recipe = recipe;
    this.customer = customer;
    this.prod = {};
    this.results = [];
    this.idx = -1;
    this.step = null;
    this.slide = { x: 0 };
    this.busy = true;
    this.stepUI = {
      setHint: (h) => ui.setHint(h),
      button: (label, cb, kind) => ui.button(label, cb, kind),
      clearButtons: () => ui.clearButtons(),
    };
  }

  enter() {
    audio.whoosh();
    this.next();
  }

  exit() {
    ui.hideBanner();
    audio.rollSet && audio.rollSet(0);
    audio.brushSet && audio.brushSet(0);
    audio.ovenStop();
  }

  async next() {
    this.idx++;
    const defs = this.recipe.steps;
    if (this.idx >= defs.length) {
      this.game.showResult(this.recipe, this.customer, this.prod, this.results);
      return;
    }
    const def = defs[this.idx];
    ui.clear();
    const step = def.make(this.prod, this.stepUI);
    step.onDone = (score, label) => this.stepDone(def, score, label);
    this.step = step;
    live.setContext(step.live || 'idle');
    ui.banner(this.idx + 1, defs.length, step.title, step.hintText);
    this.slide.x = this.idx === 0 ? 0 : stage.W;
    if (this.idx > 0) await tween(this.slide, { x: 0 }, 0.4, ease.outCubic);
    this.busy = false;
    step.enter();
  }

  async stepDone(def, score, label) {
    this.results.push({ key: def.key, label: def.label, weight: def.weight, score });
    ui.progress(1);
    ui.pop(RATING(score), label);
    if (score >= 0.9) {
      audio.star(2);
      haptics.pattern([15, 30, 25]);
      particles.sparkle(stage.W / 2, stage.H * 0.42, 16, 200);
    } else if (score >= 0.6) {
      audio.star(0);
      haptics.tap(20);
    } else {
      audio.fail();
    }
    live.react('step', score);
    await wait(1.25);
    this.busy = true;
    this.step.exit();
    audio.whoosh();
    await tween(this.slide, { x: -stage.W }, 0.35, ease.inOutCubic);
    this.next();
  }

  // Les gestes vont à l'étape en cours
  down(p) { if (!this.busy && this.step) this.step.down && this.step.down(p); }
  move(p) { if (!this.busy && this.step) this.step.move && this.step.move(p); }
  up(p) { if (this.step) this.step.up && this.step.up(p); }

  update(dt) {
    if (this.step) {
      this.step.update(dt);
      if (!this.step.done) ui.progress(this.step.progress());
    }
  }

  draw(ctx) {
    drawTable(ctx);
    if (!this.step) return;
    ctx.save();
    ctx.translate(this.slide.x, 0);
    this.step.draw(ctx);
    ctx.restore();
  }
}
