// Sous-titres dynamiques : 2 à 4 mots à la fois, mot prononcé surligné en jaune,
// placés au centre bas de l'écran (au-dessus de la zone des boutons TikTok).
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, POLICE_TEXTE } from '../theme';
import type { BlocSousTitre } from './types';

const HAUT = 1290; // position verticale (px) du haut des sous-titres

export const SousTitres: React.FC<{ blocs: BlocSousTitre[] }> = ({ blocs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const bloc = blocs.find((b) => t >= b.debut && t < b.fin);
  if (!bloc) return null;
  // apparition du groupe avec un petit rebond
  const k = spring({ frame: frame - Math.round(bloc.debut * fps), fps, config: { damping: 12, mass: 0.4, stiffness: 220 } });
  let actif = 0;
  bloc.mots.forEach((m, i) => {
    if (t >= m.debut) actif = i;
  });
  return (
    <div style={{ position: 'absolute', top: HAUT, left: 30, right: 30, textAlign: 'center', wordSpacing: 10, transform: `scale(${0.85 + 0.15 * k})` }}>
      {bloc.mots.map((m, i) => {
        const estActif = i === actif;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              margin: '0 16px',
              fontFamily: POLICE_TEXTE,
              fontWeight: 900,
              fontSize: 76,
              lineHeight: 1.15,
              textTransform: 'uppercase',
              color: estActif ? C.jaune : C.blanc,
              WebkitTextStroke: `10px ${C.noir}`,
              paintOrder: 'stroke fill',
              textShadow: `0 6px 0 ${C.noir}`,
              transform: `scale(${estActif ? 1.12 : 1}) rotate(${estActif ? -2 : 0}deg)`,
            }}
          >
            {m.texte}
          </span>
        );
      })}
    </div>
  );
};
