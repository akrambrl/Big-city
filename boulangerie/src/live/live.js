// Faux livestream en surimpression : spectateurs, commentaires, cœurs.
import { USERS, POOLS } from './comments.js';
import { pick, rand, clamp } from '../core/util.js';
import { save } from '../core/save.js';

const $ = (id) => document.getElementById(id);
const COLORS = ['#ffd166', '#8fd3c1', '#ffb3c1', '#b8c4ff', '#ffc38a', '#c7f0a0'];

function fmt(n) {
  n = Math.round(n);
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1e4) return Math.round(n / 1e3) + ' k';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + ' k';
  return String(n);
}

export const live = {
  viewers: 0,
  shown: 0,
  hype: 0.1,
  context: 'idle',
  timer: 1,
  heartTimer: 0,
  lastUser: '',

  init() {
    this.viewers = this.base();
    this.shown = this.viewers;
    this.refreshStats();
  },

  base() {
    return 24 + save.data.followers * 0.8;
  },

  show(v) { $('hud').classList.toggle('hidden', !v); },

  setContext(ctx) { this.context = ctx; },

  update(dt) {
    this.hype = Math.max(0.05, this.hype - dt * 0.05);
    const target = this.base() * (1 + this.hype * 1.6);
    this.viewers += (target - this.viewers) * dt * 0.6 + rand(-1, 1) * dt * 6;
    this.viewers = Math.max(3, this.viewers);
    if (Math.abs(this.viewers - this.shown) >= 1) {
      this.shown = this.viewers;
      $('viewers').textContent = '👁 ' + fmt(this.shown);
    }
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = rand(0.9, 1.3) * (3.8 - this.hype * 2.4);
      this.comment(this.context);
    }
    if (this.hype > 0.45) {
      this.heartTimer -= dt;
      if (this.heartTimer <= 0) {
        this.heartTimer = rand(0.15, 0.5) / this.hype;
        this.heart();
      }
    }
  },

  comment(pool, hot = false) {
    const lines = POOLS[pool] || POOLS.idle;
    let user = pick(USERS);
    if (user === this.lastUser) user = pick(USERS);
    this.lastUser = user;
    const box = $('comments');
    const el = document.createElement('div');
    el.className = 'cmt' + (hot ? ' hot' : '');
    const b = document.createElement('b');
    b.textContent = user;
    b.style.color = hot ? '#fff' : pick(COLORS);
    el.appendChild(b);
    el.appendChild(document.createTextNode(pick(lines)));
    box.appendChild(el);
    while (box.children.length > 4) box.firstElementChild.remove();
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 400);
    }, 6000);
  },

  heart(n = 1) {
    const box = $('hearts');
    const glyphs = ['❤️', '🧡', '💛', '💖', '🥐', '😍'];
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        if (box.children.length > 30) return;
        const h = document.createElement('span');
        h.className = 'heart';
        h.textContent = pick(glyphs);
        h.style.setProperty('--dx', rand(-40, 30) + 'px');
        h.style.fontSize = rand(20, 32) + 'px';
        h.addEventListener('animationend', () => h.remove());
        box.appendChild(h);
      }, i * 70);
    }
  },

  // Le public réagit : strength 0..1
  react(kind, strength = 0.5) {
    if (kind === 'small') {
      this.hype = clamp(this.hype + strength * 0.06, 0, 0.7);
      if (Math.random() < 0.18) this.heart(1);
      return;
    }
    this.hype = clamp(this.hype + strength * 0.25, 0, 1);
    if (kind === 'great') {
      this.heart(10);
      for (let i = 0; i < 5; i++) setTimeout(() => this.comment('great', i % 2 === 0), i * 260);
    } else if (kind === 'good') {
      this.heart(4);
      this.comment('good');
      setTimeout(() => this.comment('good'), 500);
    } else if (kind === 'meh') {
      this.comment('meh');
    } else if (kind === 'burnt') {
      this.comment('burnt', true);
      setTimeout(() => this.comment('burnt'), 400);
    } else if (kind === 'step') {
      this.heart(Math.round(2 + strength * 5));
      this.comment(strength > 0.85 ? 'great' : this.context, strength > 0.9);
    }
  },

  // Grosse vague pour un 3 étoiles
  celebrate() {
    this.hype = 1;
    this.heart(24);
    for (let i = 0; i < 10; i++) setTimeout(() => this.comment('great', i % 3 === 0), i * 180);
  },

  refreshStats(bumpKey) {
    const d = save.data;
    $('stat-coins').querySelector('b').textContent = fmt(d.coins);
    $('stat-followers').querySelector('b').textContent = fmt(d.followers);
    $('likes').querySelector('b').textContent = fmt(d.likes);
    if (bumpKey) {
      const el = bumpKey === 'likes' ? $('likes') : $('stat-' + bumpKey);
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  },
};
