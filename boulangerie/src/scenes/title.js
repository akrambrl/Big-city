import { stage } from '../core/stage.js';
import { audio } from '../core/audio.js';
import { haptics } from '../core/haptics.js';
import { particles } from '../core/particles.js';
import { save } from '../core/save.js';
import { rand } from '../core/util.js';
import { ui, bindButton } from '../ui.js';
import { live } from '../live/live.js';
import { drawTable } from '../render/scenery.js';
import { drawCroissant } from '../render/pastries.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.flourT = 0;
  }

  enter() {
    live.show(false);
    const d = save.data;
    const root = ui.el(`
      <div class="logo">Fournil<br><span>Live</span></div>
      <div class="tagline">Ta boulangerie ASMR en direct 🥐</div>
      <div class="title-spacer"></div>
      <button class="btn pink" data-a="go">🎥 Lancer le live</button>
      ${d.served ? `<div class="title-stats">🪙 ${d.coins} · 👤 ${d.followers} abonnés · ${d.served} commandes</div>` : ''}
      <div class="toggles">
        <button class="toggle ${d.settings.sound ? '' : 'off'}" data-a="sound">🔊 Son</button>
        <button class="toggle ${d.settings.haptics ? '' : 'off'}" data-a="haptics">📳 Vibrations</button>
      </div>
      <div class="sound-hint">Monte le son et coupe le mode silencieux 🎧</div>
    `, 'title-screen');

    bindButton(root.querySelector('[data-a=go]'), () => {
      audio.unlock();
      audio.chime();
      haptics.tap(20);
      this.game.startShift();
    });
    const tSound = root.querySelector('[data-a=sound]');
    tSound.addEventListener('click', () => {
      d.settings.sound = !d.settings.sound;
      audio.setEnabled(d.settings.sound);
      tSound.classList.toggle('off', !d.settings.sound);
      save.write();
    });
    const tHap = root.querySelector('[data-a=haptics]');
    tHap.addEventListener('click', () => {
      d.settings.haptics = !d.settings.haptics;
      haptics.enabled = d.settings.haptics;
      tHap.classList.toggle('off', !d.settings.haptics);
      if (d.settings.haptics) haptics.tap(30);
      save.write();
    });
  }

  exit() {}

  // Toucher le croissant = petit bonus de feeling
  down(p) {
    const cx = stage.W / 2, cy = stage.H * 0.47;
    if (Math.hypot(p.x - cx, p.y - cy) < 130) {
      audio.unlock();
      audio.crackle(0.8, 0.25);
      audio.pop(1.2);
      haptics.tap(15);
      particles.crumbs(p.x, p.y, 6);
      particles.sparkle(p.x, p.y, 5, 30);
      this.squish = 1;
    }
  }

  update(dt) {
    this.t += dt;
    this.squish = Math.max(0, (this.squish || 0) - dt * 4);
    this.flourT -= dt;
    if (this.flourT <= 0) {
      this.flourT = 0.12;
      particles.spawn({
        x: rand(0, stage.W), y: -10, vx: rand(-10, 10), vy: rand(20, 50),
        life: rand(5, 9), size: rand(1, 3), color: '#fffaf0', alpha: rand(0.4, 0.9), drag: 1,
      });
    }
  }

  draw(ctx) {
    drawTable(ctx);
    const cx = stage.W / 2, cy = stage.H * 0.47;
    const bob = Math.sin(this.t * 2) * 8;
    const sq = this.squish || 0;
    // halo
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 200);
    g.addColorStop(0, 'rgba(255,240,200,0.7)');
    g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 200, cy - 200, 400, 400);
    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.rotate(Math.sin(this.t * 1.3) * 0.06);
    ctx.scale(1 + sq * 0.08, 1 - sq * 0.08);
    drawCroissant(ctx, 0, 0, 250, { bake: 0.7, puff: 1, shine: 0.1 + Math.max(0, Math.sin(this.t * 3)) * 0.1 });
    ctx.restore();
  }
}
