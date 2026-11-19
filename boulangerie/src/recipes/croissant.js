import { Knead } from '../steps/knead.js';
import { Laminate } from '../steps/laminate.js';
import { Shape } from '../steps/shape.js';
import { Glaze } from '../steps/glaze.js';
import { Bake } from '../steps/bake.js';
import { drawCroissant, drawCroissantIcon } from '../render/pastries.js';

// Une recette = une suite d'étapes + leurs poids dans la note finale.
// (Dorure avant cuisson, comme en vrai : la dorure à l'œuf cuit avec le croissant.)
export const croissant = {
  id: 'croissant',
  name: 'Croissant',
  price: 0,
  order: 'Un croissant, s\'il vous plaît !',
  orderShort: 'Un croissant, svp !',
  steps: [
    { make: (p, ui) => new Knead(p, ui, { taps: 20 }), key: 'knead', label: 'Pétrissage', weight: 0.15 },
    { make: (p, ui) => new Laminate(p, ui, { tours: 3 }), key: 'laminate', label: 'Tourage', weight: 0.2 },
    { make: (p, ui) => new Shape(p, ui), key: 'shape', label: 'Façonnage', weight: 0.15 },
    { make: (p, ui) => new Glaze(p, ui), key: 'glaze', label: 'Dorure', weight: 0.15 },
    { make: (p, ui) => new Bake(p, ui), key: 'bake', label: 'Cuisson', weight: 0.35 },
  ],
  icon: drawCroissantIcon,
  drawFinal(ctx, x, y, s, prod, extra = {}) {
    drawCroissant(ctx, x, y, s, {
      bake: prod.bake ?? 0.7,
      puff: 1,
      glaze: prod.glaze,
      glazeBox: 0.7,
      ...extra,
    });
  },
};

export const RECIPES = { croissant };
