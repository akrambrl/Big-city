// Le menu : missions du matin (gâteaux) et préparations du service (boissons, service des gâteaux).
import { croissant } from './croissant.js';
import { Mash } from '../steps/mash.js';
import { Mix } from '../steps/mix.js';
import { Pour } from '../steps/pour.js';
import { Topping } from '../steps/topping.js';
import { Bake } from '../steps/bake.js';
import { Espresso } from '../steps/espresso.js';
import { Froth } from '../steps/froth.js';
import { LatteArt } from '../steps/latteArt.js';
import { Slice, Pick } from '../steps/serve.js';
import { drawBananaBread, drawBBIcon, drawLatteIcon } from '../render/cafe.js';
import { drawCroissantIcon } from '../render/pastries.js';

export const bananaBread = {
  id: 'bananabread',
  name: 'Banana bread',
  steps: [
    { make: (p, ui) => new Mash(p, ui, { taps: 6 }), key: 'mash', label: 'Bananes', weight: 0.15 },
    { make: (p, ui) => new Mix(p, ui), key: 'mix', label: 'Mélange', weight: 0.15 },
    { make: (p, ui) => new Pour(p, ui), key: 'pour', label: 'Versage', weight: 0.15 },
    { make: (p, ui) => new Topping(p, ui), key: 'topping', label: 'Décor', weight: 0.1 },
    {
      make: (p, ui) => new Bake(p, ui, { draw: (ctx, x, y, s, o) => drawBananaBread(ctx, x, y, s * 1.15, o), inSize: 170, outSize: 260 }),
      key: 'bake', label: 'Cuisson', weight: 0.45,
    },
  ],
  drawFinal(ctx, x, y, s, prod, extra = {}) {
    drawBananaBread(ctx, x, y, s * 1.1, { bake: prod.bake ?? 0.7, puff: 1, ...extra });
  },
};

export const latte = {
  id: 'latte',
  name: 'Café latte',
  steps: [
    { make: (p, ui) => new Espresso(p, ui), key: 'espresso', label: 'Espresso', weight: 0.35 },
    { make: (p, ui) => new Froth(p, ui), key: 'froth', label: 'Mousse', weight: 0.35 },
    { make: (p, ui) => new LatteArt(p, ui), key: 'art', label: 'Latte art', weight: 0.3 },
  ],
};

// Produits vendus au comptoir
export const PRODUCTS = {
  croissant: {
    id: 'croissant', name: 'Croissant', emoji: '🥐', kind: 'cake', price: 3, batch: 6, unit: 'croissants',
    mission: croissant, icon: drawCroissantIcon, time: '~1 min 30',
    serveRecipe: (stock) => ({ id: 'serve-croissant', steps: [{ make: (p, ui) => new Pick(p, ui, { left: stock.left, bake: stock.bake }), key: 'pick', label: 'Service', weight: 1 }] }),
  },
  bananabread: {
    id: 'bananabread', name: 'Banana bread', emoji: '🍌', kind: 'cake', price: 4, batch: 8, unit: 'tranches',
    mission: bananaBread, icon: drawBBIcon, time: '~1 min',
    serveRecipe: (stock) => ({ id: 'serve-bb', steps: [{ make: (p, ui) => new Slice(p, ui, { left: stock.left, slices: 8, bake: stock.bake }), key: 'slice', label: 'Tranche', weight: 1 }] }),
  },
  carrotcake: { id: 'carrotcake', name: 'Carrot cake', emoji: '🥕', kind: 'cake', soon: true },
  latte: {
    id: 'latte', name: 'Latte', emoji: '☕', kind: 'drink', price: 5, icon: drawLatteIcon,
    serveRecipe: () => latte,
  },
  matcha: { id: 'matcha', name: 'Matcha latte', emoji: '🍵', kind: 'drink', soon: true },
};

export const MISSIONS = ['croissant', 'bananabread', 'carrotcake'];
export const DRINKS = ['latte'];
export const CAKES = ['croissant', 'bananabread'];

export function weightedScore(results) {
  const w = results.reduce((s, r) => s + r.weight, 0);
  return w ? results.reduce((s, r) => s + r.score * r.weight, 0) / w : 0;
}
