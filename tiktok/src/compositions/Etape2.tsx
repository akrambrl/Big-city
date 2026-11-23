// Étape 2 : démonstration des 5 scènes et des 4 décors (timings fixes, sans voix).
import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { DECORS, Decor } from '../decors/Decors';
import { Scene } from '../scenes/Scenes';
import type { SceneData } from '../scenes/types';
import { texteAffiche } from '../theme';

export const DUREE_SCENE_DEMO = 120; // 4 s par scène

// Exemple sur le thème « Colis perdu » (contenu provisoire, la vraie vidéo sera dans videos/001.json)
export const SCENES_DEMO: SceneData[] = [
  {
    type: 'accroche',
    decor: 'rue',
    titre: 'Colis perdu ?',
    texte: 'Le vendeur doit te rembourser',
    personnage: { variante: 'heros', expression: 'choque', pose: 'bras_leves' },
  },
  {
    type: 'document',
    decor: 'appartement',
    document: {
      type: 'courrier',
      titre: 'Mise en demeure',
      lignes: ['Madame, Monsieur,', 'Ma commande n° 48213 ne m’a', 'jamais été livrée.', 'Article L216-4 du Code de la conso :', 'le vendeur est responsable du colis.'],
      surligne: 3,
    },
    personnage: { variante: 'heros', expression: 'malin', pose: 'pointe_doigt' },
  },
  {
    type: 'montant',
    decor: 'magasin',
    montant: { ancien: '0 €', nouveau: '59,90 €', legende: 'remboursés' },
    personnage: { variante: 'heros', expression: 'neutre', pose: 'pointe_doigt', expressionApres: 'content' },
  },
  {
    type: 'explication',
    decor: 'bureau',
    texte: 'Tant que tu n’as pas reçu le colis, il est **sous la responsabilité** du vendeur, pas du transporteur.',
    personnage: { variante: 'heroine', expression: 'malin', pose: 'mains_hanches' },
    secondaire: { variante: 'conseiller', expression: 'content', pose: 'debout' },
  },
  {
    type: 'cta',
    decor: 'rue',
    titre: 'Abonne-toi',
    texte: 'pour ne plus te faire avoir',
    personnage: { variante: 'heros', expression: 'content', pose: 'debout', poseApres: 'bras_leves' },
  },
];

export const DemoScenes: React.FC = () => (
  <Series>
    {SCENES_DEMO.map((s, i) => (
      <Series.Sequence key={i} durationInFrames={DUREE_SCENE_DEMO}>
        <Scene scene={s} />
      </Series.Sequence>
    ))}
  </Series>
);

export const SceneSeule: React.FC<{ index: number }> = ({ index }) => <Scene scene={SCENES_DEMO[index]} />;

/** Planche des 4 décors. */
export const GalerieDecors: React.FC = () => (
  <AbsoluteFill style={{ background: '#121014', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12 }}>
    {DECORS.map((d) => (
      <div key={d} style={{ position: 'relative', overflow: 'hidden', border: '4px solid #fff' }}>
        <div style={{ position: 'absolute', width: 1080, height: 1920, transform: 'scale(0.4878)', transformOrigin: 'top left' }}>
          <Decor nom={d} />
        </div>
        <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', ...texteAffiche(60) }}>{d}</div>
      </div>
    ))}
  </AbsoluteFill>
);
