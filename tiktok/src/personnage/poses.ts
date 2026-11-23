// Squelette des bras pour chaque pose (repère SVG 400 x 800).
// « droit » = bras droit du personnage = côté gauche de l'écran.
import type { Bras, Point, Pose } from './types';

export const EPAULE_DROITE: Point = { x: 140, y: 318 };
export const EPAULE_GAUCHE: Point = { x: 260, y: 318 };

const BAISSE_D: Bras = { coude: { x: 122, y: 415 }, main: { x: 128, y: 505 } };
const BAISSE_G: Bras = { coude: { x: 278, y: 415 }, main: { x: 272, y: 505 } };

export const POSES_BRAS: Record<Pose, { droit: Bras; gauche: Bras }> = {
  debout: { droit: BAISSE_D, gauche: BAISSE_G },
  bras_leves: {
    droit: { coude: { x: 88, y: 252 }, main: { x: 66, y: 150 } },
    gauche: { coude: { x: 312, y: 252 }, main: { x: 334, y: 150 } },
  },
  // pointe vers la droite de l'écran (là où s'affichent montants et documents)
  pointe_doigt: {
    droit: BAISSE_D,
    gauche: { coude: { x: 322, y: 302 }, main: { x: 378, y: 262 } },
  },
  mains_hanches: {
    droit: { coude: { x: 74, y: 402 }, main: { x: 134, y: 486 } },
    gauche: { coude: { x: 326, y: 402 }, main: { x: 266, y: 486 } },
  },
  // téléphone collé à l'oreille droite
  telephone: {
    droit: { coude: { x: 92, y: 345 }, main: { x: 116, y: 226 } },
    gauche: BAISSE_G,
  },
};

const mixPoint = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Interpole deux poses (t = 0 -> pose a, t = 1 -> pose b) pour des transitions douces. */
export function mixBras(a: Bras, b: Bras, t: number): Bras {
  return { coude: mixPoint(a.coude, b.coude, t), main: mixPoint(a.main, b.main, t) };
}
