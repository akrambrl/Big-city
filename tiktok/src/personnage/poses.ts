// Squelette des bras pour chaque pose (repère SVG 400 x 800, proportions réalistes).
// « droit » = bras droit du personnage = côté gauche de l'écran.
import type { Bras, Point, Pose } from './types';

export const EPAULE_DROITE: Point = { x: 128, y: 212 };
export const EPAULE_GAUCHE: Point = { x: 272, y: 212 };

const BAISSE_D: Bras = { coude: { x: 112, y: 312 }, main: { x: 118, y: 402 } };
const BAISSE_G: Bras = { coude: { x: 288, y: 312 }, main: { x: 282, y: 402 } };

export const POSES_BRAS: Record<Pose, { droit: Bras; gauche: Bras }> = {
  debout: { droit: BAISSE_D, gauche: BAISSE_G },
  bras_leves: {
    droit: { coude: { x: 76, y: 150 }, main: { x: 66, y: 58 } },
    gauche: { coude: { x: 324, y: 150 }, main: { x: 334, y: 58 } },
  },
  // pointe vers la droite de l'écran (là où s'affichent montants et documents)
  pointe_doigt: {
    droit: BAISSE_D,
    gauche: { coude: { x: 336, y: 204 }, main: { x: 392, y: 168 } },
  },
  mains_hanches: {
    droit: { coude: { x: 62, y: 300 }, main: { x: 122, y: 386 } },
    gauche: { coude: { x: 338, y: 300 }, main: { x: 278, y: 386 } },
  },
  // téléphone collé à l'oreille droite
  telephone: {
    droit: { coude: { x: 84, y: 246 }, main: { x: 146, y: 126 } },
    gauche: BAISSE_G,
  },
};

const mixPoint = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Interpole deux poses (t = 0 -> pose a, t = 1 -> pose b) pour des transitions douces. */
export function mixBras(a: Bras, b: Bras, t: number): Bras {
  return { coude: mixPoint(a.coude, b.coude, t), main: mixPoint(a.main, b.main, t) };
}
