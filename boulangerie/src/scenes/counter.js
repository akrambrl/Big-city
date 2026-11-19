// Comptoir : un client entre et passe commande.
import { stage } from '../core/stage.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { tween, ease, wait } from '../core/util.js';
import { ui } from '../ui.js';
import { live } from '../live/live.js';
import { drawShop, roundRect } from '../render/scenery.js';
import { makeCustomer, updateCustomer, drawCustomer } from '../render/customer.js';

export class CounterScene {
  constructor(game, recipe) {
    this.game = game;
    this.recipe = recipe;
    this.t = 0;
    this.customer = makeCustomer();
    this.cx = stage.W + 120;
    this.walk = 1;
    this.bubble = 0;
  }

  get counterY() {
    return Math.max(stage.top + 230, stage.H * 0.58);
  }

  async enter() {
    ui.hideBanner();
    live.setContext('order');
    audio.bell();
    await tween(this, { cx: stage.W / 2 - 40 }, 1.1, ease.outCubic);
    this.walk = 0;
    await wait(0.15);
    audio.pop(1.1);
    haptics.tap(10);
    live.comment('order');
    tween(this, { bubble: 1 }, 0.45, ease.outBack);
    await wait(0.4);
    ui.button('Au fournil ! 🥐', () => this.game.startRecipe(this.recipe, this.customer));
  }

  exit() {}

  update(dt) {
    this.t += dt;
    updateCustomer(this.customer, dt);
  }

  draw(ctx) {
    const cy = this.counterY;
    drawShop(ctx, cy);
    const bob = this.walk ? Math.abs(Math.sin(this.t * 9)) * -10 : Math.sin(this.t * 2) * 2;
    // le client se tient derrière le comptoir
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, stage.W, cy + 2);
    ctx.clip();
    drawCustomer(ctx, this.customer, this.cx, cy - 75, 1, bob);
    ctx.restore();

    // bulle de commande
    if (this.bubble > 0.01) {
      const bx = Math.min(stage.W - 92, this.cx + 120), by = cy - 210;
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(this.bubble, this.bubble);
      ctx.fillStyle = 'rgba(90,45,15,0.15)';
      roundRect(ctx, -82, -60, 168, 128, 28);
      ctx.fill();
      ctx.fillStyle = '#fff';
      roundRect(ctx, -84, -64, 168, 126, 28);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-56, 56);
      ctx.lineTo(-92, 86);
      ctx.lineTo(-26, 60);
      ctx.fill();
      ctx.fillStyle = '#5b3a29';
      ctx.font = '600 16px Fredoka, ui-rounded, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.recipe.orderShort || this.recipe.name, 0, 44);
      ctx.save();
      ctx.translate(0, -12);
      ctx.rotate(Math.sin(this.t * 3) * 0.06);
      this.recipe.icon(ctx, 0, 0, 100);
      ctx.restore();
      ctx.restore();
    }
  }
}
