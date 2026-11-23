// Les personnages : même squelette, apparence différente.
// Style « illustration de jeu » : chaque couleur existe en 3 tons (lumière, base, ombre)
// pour un ombrage en aplats francs, lumière venant d'en haut à gauche.
import type { Apparence, Teinte, Variante } from './types';

export const CONTOUR = '#121014'; // contours noirs épais
export const TRAIT = 5; // contour extérieur
export const TRAIT_FIN = 2.5; // détails intérieurs (plis, coutures)

const t = (clair: string, base: string, ombre: string): Teinte => ({ clair, base, ombre });

export const APPARENCES: Record<Variante, Apparence> = {
  // Personnage principal : la trentaine, pull orange, jean
  heros: {
    nom: 'Thomas',
    visage: 'homme',
    peau: t('#E9BC94', '#D29C72', '#A8704C'),
    cheveux: { teinte: t('#4A3A30', '#231B16', '#100C0A'), style: 'court' },
    haut: { type: 'pull', teinte: t('#FF9A4D', '#EE6F22', '#B34A12'), dessous: '#F2F2F2' },
    bas: t('#5577A8', '#2F4F7F', '#1C3254'),
    chaussures: { dessus: '#F4F4F4', semelle: '#2A2A2E' },
    barbe: true,
  },
  patron: {
    nom: 'Le patron',
    visage: 'homme',
    peau: t('#EFC3A0', '#D9A27C', '#B07A55'),
    cheveux: { teinte: t('#CFCFCF', '#9E9E9E', '#6E6E6E'), style: 'degarni' },
    haut: { type: 'costume', teinte: t('#5E6472', '#3C414D', '#23262E'), dessous: '#FFFFFF', cravate: '#B3202A' },
    bas: t('#4A4F5C', '#30343E', '#1C1F26'),
    chaussures: { dessus: '#2A1C14', semelle: '#0E0A08' },
    moustache: true,
  },
  proprietaire: {
    nom: 'La propriétaire',
    visage: 'femme',
    peau: t('#F6D6BE', '#E6B998', '#C08C6C'),
    cheveux: { teinte: t('#E2DCD5', '#BDB4AA', '#8C8279'), style: 'chignon' },
    haut: { type: 'gilet', teinte: t('#A879C4', '#7E4FA0', '#57326F'), dessous: '#F4E9D8' },
    bas: t('#7A604B', '#5B4636', '#3B2C21'),
    chaussures: { dessus: '#3A2A22', semelle: '#1A120D' },
    lunettes: true,
    collier: true,
  },
  conseiller: {
    nom: 'La conseillère',
    visage: 'femme',
    peau: t('#A87452', '#8A5A3C', '#643E27'),
    cheveux: { teinte: t('#3A2C24', '#1E1612', '#0A0706'), style: 'boucle' },
    haut: { type: 'blazer', teinte: t('#4468A8', '#2E4A7D', '#1B2F54'), dessous: '#D6E6F2' },
    bas: t('#3A3A44', '#24242C', '#141418'),
    chaussures: { dessus: '#1A1A1E', semelle: '#0A0A0C' },
    lunettes: true,
  },
};
