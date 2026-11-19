import { stage } from '../core/stage.js';

// Une étape = un geste. Elle se dessine, reçoit les touches,
// et appelle finish(score 0..1, libellé) quand elle est terminée.
export class Step {
  constructor(prod, ui) {
    this.prod = prod; // l'état du produit, partagé entre les étapes
    this.ui = ui; // { setHint, button, clearButtons }
    this.done = false;
    this.t = 0;
    this.score = 0;
  }
  get cx() { return stage.W / 2; }
  get cy() { return (stage.top + stage.bottom) / 2; }
  get areaH() { return stage.bottom - stage.top; }
  progress() { return 0; }
  enter() {}
  exit() {}
  update(dt) { this.t += dt; }
  draw() {}
  finish(score, label) {
    if (this.done) return;
    this.done = true;
    this.score = Math.max(0, Math.min(1, score));
    this.onDone && this.onDone(this.score, label);
  }
}
