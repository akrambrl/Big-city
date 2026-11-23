// Toutes les compositions visibles dans le Studio (npx remotion studio).
import React from 'react';
import { Composition, Folder, Still } from 'remotion';
import { DemoPersonnage, GalerieDemoDuree, GalerieExpressions, GaleriePersonnages, GaleriePoses } from './compositions/Galeries';

const LARGEUR = 1080;
const HAUTEUR = 1920;
const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Etape1-Personnage">
      <Composition id="Demo-Personnage" component={DemoPersonnage} durationInFrames={GalerieDemoDuree} fps={FPS} width={LARGEUR} height={HAUTEUR} />
      <Composition id="Demo-Lea" component={DemoPersonnage} defaultProps={{ variante: 'heroine' as const }} durationInFrames={GalerieDemoDuree} fps={FPS} width={LARGEUR} height={HAUTEUR} />
      <Still id="Galerie-Expressions" component={GalerieExpressions} width={LARGEUR} height={HAUTEUR} />
      <Still id="Galerie-Expressions-Lea" component={GalerieExpressions} defaultProps={{ variante: 'heroine' as const }} width={LARGEUR} height={HAUTEUR} />
      <Still id="Galerie-Poses" component={GaleriePoses} width={LARGEUR} height={HAUTEUR} />
      <Still id="Galerie-Poses-Lea" component={GaleriePoses} defaultProps={{ variante: 'heroine' as const }} width={LARGEUR} height={HAUTEUR} />
      <Still id="Galerie-Personnages" component={GaleriePersonnages} width={LARGEUR} height={HAUTEUR} />
    </Folder>
  </>
);
