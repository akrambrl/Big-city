// Outils de géométrie pour dessiner des membres « réalistes » (formes pleines, effilées).
import type { Point } from './types';

export const chemin = (pts: Point[], ferme = true) =>
  pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + (ferme ? ' Z' : '');

/**
 * Transforme une ligne brisée (épaule -> coude -> poignet) en forme pleine dont la largeur
 * varie le long du trajet. Renvoie le contour complet et la moitié « à l'ombre »
 * (le côté opposé à la lumière, qui vient d'en haut à gauche).
 */
export function membre(pts: Point[], largeurs: number[]) {
  const n = pts.length;
  const normales: Point[] = pts.map((_, i) => {
    // normale moyenne des segments voisins : contour continu aux articulations
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    return { x: -dy / l, y: dx / l };
  });
  const cote1 = pts.map((p, i) => ({ x: p.x + (normales[i].x * largeurs[i]) / 2, y: p.y + (normales[i].y * largeurs[i]) / 2 }));
  const cote2 = pts.map((p, i) => ({ x: p.x - (normales[i].x * largeurs[i]) / 2, y: p.y - (normales[i].y * largeurs[i]) / 2 }));
  // côté ombre : celui dont la normale pointe vers la droite / le bas
  const moy = normales.reduce((s, v) => ({ x: s.x + v.x, y: s.y + v.y }), { x: 0, y: 0 });
  const ombreCote1 = moy.x + moy.y * 0.6 > 0;
  const ombre = ombreCote1 ? cote1 : cote2;
  // la bande d'ombre occupe environ 40 % de la largeur
  const interieur = pts.map((p, i) => {
    const k = ombreCote1 ? 1 : -1;
    return { x: p.x + normales[i].x * k * largeurs[i] * 0.1, y: p.y + normales[i].y * k * largeurs[i] * 0.1 };
  });
  return {
    contour: chemin([...cote1, ...[...cote2].reverse()]),
    ombre: chemin([...ombre, ...interieur.reverse()]),
  };
}

export const angle = (a: Point, b: Point) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

export const versPoint = (a: Point, b: Point, d: number): Point => {
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: b.x - ((b.x - a.x) / l) * d, y: b.y - ((b.y - a.y) / l) * d };
};
