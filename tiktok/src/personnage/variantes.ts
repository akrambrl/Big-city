// Les personnages : tous partagent le même squelette SVG, seule l'apparence change.
import type { Apparence, Variante } from './types';

export const CONTOUR = '#2B1D16'; // contour léger, brun très foncé plutôt que noir pur

export const APPARENCES: Record<Variante, Apparence> = {
  // Personnage principal : la trentaine, pull orange, jean
  heros: {
    nom: 'Thomas',
    peau: '#F2C29B',
    cheveux: { couleur: '#3B2A20', style: 'court' },
    haut: { type: 'pull', couleur: '#F28C28', dessous: '#FFFFFF' },
    bas: '#3D5A80',
    chaussures: '#2E2E38',
    barbe: true,
  },
  patron: {
    nom: 'Le patron',
    peau: '#E8B48A',
    cheveux: { couleur: '#9C9C9C', style: 'degarni' },
    haut: { type: 'costume', couleur: '#4A4F5C', dessous: '#FFFFFF', cravate: '#C0392B' },
    bas: '#3A3E48',
    chaussures: '#1F1F24',
    moustache: true,
  },
  proprietaire: {
    nom: 'La propriétaire',
    peau: '#F5D0B5',
    cheveux: { couleur: '#C9C2BA', style: 'chignon' },
    haut: { type: 'gilet', couleur: '#8E5BA8', dessous: '#F4E9D8' },
    bas: '#5B4636',
    chaussures: '#3A2A22',
    lunettes: true,
    collier: true,
  },
  conseiller: {
    nom: 'La conseillère',
    peau: '#8A5A3C',
    cheveux: { couleur: '#1E1612', style: 'boucle' },
    haut: { type: 'blazer', couleur: '#2E4A7D', dessous: '#BFD7EA' },
    bas: '#2B2B33',
    chaussures: '#1F1F24',
    lunettes: true,
  },
};

/** Assombrit (k < 0) ou éclaircit (k > 0) une couleur hexadécimale. */
export function nuance(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)),
  );
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
