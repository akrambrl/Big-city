import type React from 'react';
// Identité visuelle commune : couleurs, polices (Google Fonts, licence OFL, gratuites).
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

export const POLICE_TITRE = loadAnton().fontFamily;
export const POLICE_TEXTE = loadInter('normal', { weights: ['600', '800', '900'], subsets: ['latin'] }).fontFamily;

export const C = {
  noir: '#121014',
  jaune: '#FFE600',
  rouge: '#E8233A',
  vert: '#2BD96B',
  blanc: '#FFFFFF',
  papier: '#FBF8F1',
};

/** Contour épais façon affiche : texte blanc/jaune cerné de noir avec ombre portée dure. */
export const texteAffiche = (taille: number, couleur = C.blanc): React.CSSProperties => ({
  fontFamily: POLICE_TITRE,
  fontSize: taille,
  color: couleur,
  textTransform: 'uppercase',
  lineHeight: 1,
  WebkitTextStroke: `${Math.max(3, taille / 22)}px ${C.noir}`,
  paintOrder: 'stroke fill',
  textShadow: `${taille / 18}px ${taille / 18}px 0 ${C.noir}`,
});
