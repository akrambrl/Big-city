// Couche HTML : boutons, bannière d'étape, « pop » de note.
import { audio } from './core/audio.js';
import { haptics } from './core/haptics.js';

const $ = (id) => document.getElementById(id);

export const ui = {
  clear() {
    $('ui').innerHTML = '';
    this.syncLift();
  },

  // les commentaires remontent quand un gros bouton occupe le bas de l'écran
  syncLift() {
    const app = $('app');
    app.classList.toggle('lift', !!$('ui').querySelector('.btn-bottom'));
    app.classList.toggle('cover', !!$('ui').querySelector('.result-panel'));
  },

  el(html, cls = '') {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.innerHTML = html;
    $('ui').appendChild(d);
    this.syncLift();
    return d;
  },

  // kind: 'bottom' | 'small'
  button(label, cb, kind = 'bottom', style = '') {
    const b = document.createElement('button');
    b.className = `btn ${kind === 'small' ? 'btn-small' : 'btn-bottom'} ${style}`;
    b.textContent = label;
    bindButton(b, cb);
    $('ui').appendChild(b);
    this.syncLift();
    return b;
  },

  clearButtons() {
    $('ui').querySelectorAll('.btn').forEach((b) => b.remove());
    this.syncLift();
  },

  banner(step, total, title, hint) {
    const b = $('banner');
    const wasHidden = b.classList.contains('hidden');
    b.classList.remove('hidden', 'swap');
    if (!wasHidden) { void b.offsetWidth; b.classList.add('swap'); }
    b.querySelector('.b-step').textContent = `${step}/${total}`;
    b.querySelector('.b-title').textContent = title;
    b.querySelector('.b-hint').textContent = hint;
    this.progress(0);
  },
  setHint(hint) {
    $('banner').querySelector('.b-hint').textContent = hint;
  },
  progress(v) {
    $('banner').querySelector('.b-bar i').style.width = `${Math.round(Math.min(1, v) * 100)}%`;
  },
  hideBanner() {
    $('banner').classList.add('hidden');
  },

  pop(text, sub = '') {
    const p = $('pop');
    p.classList.remove('show');
    p.innerHTML = '';
    p.appendChild(document.createTextNode(text));
    if (sub) {
      const s = document.createElement('small');
      s.textContent = sub;
      p.appendChild(s);
    }
    void p.offsetWidth;
    p.classList.add('show');
  },
};

export function bindButton(b, cb) {
  let used = false;
  b.addEventListener('pointerdown', () => {
    audio.unlock();
    audio.pop(0.9);
    haptics.tap(10);
  });
  b.addEventListener('click', (e) => {
    e.preventDefault();
    if (used) return;
    used = true;
    setTimeout(() => (used = false), 400);
    cb();
  });
}
