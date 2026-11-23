// Toutes les compositions visibles dans le Studio (npx remotion studio).
import React from 'react';
import { Composition, Folder, Still } from 'remotion';
import { DemoScenes, DUREE_SCENE_DEMO, GalerieDecors, SCENES_DEMO, SceneSeule } from './compositions/Etape2';
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
    <Folder name="Etape2-Scenes">
      <Composition id="Demo-Scenes" component={DemoScenes} durationInFrames={DUREE_SCENE_DEMO * SCENES_DEMO.length} fps={FPS} width={LARGEUR} height={HAUTEUR} />
      {SCENES_DEMO.map((s, i) => (
        <Composition key={s.type} id={`Scene-${s.type}`} component={SceneSeule} defaultProps={{ index: i }} durationInFrames={DUREE_SCENE_DEMO} fps={FPS} width={LARGEUR} height={HAUTEUR} />
      ))}
      <Still id="Galerie-Decors" component={GalerieDecors} width={LARGEUR} height={HAUTEUR} />
    </Folder>
  </>
);
