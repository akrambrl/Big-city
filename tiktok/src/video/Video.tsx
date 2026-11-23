// La vidéo complète : scènes calées sur la voix off, audio, sous-titres.
// Les props sont le contenu d'un fichier videos/XXX.json ; la timeline (durées, mots,
// déclencheurs) est lue dans public/voix/<id>/timeline.json, produit par `npm run voix`.
import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, type CalculateMetadataFunction } from 'remotion';
import { Scene } from '../scenes/Scenes';
import type { SceneData } from '../scenes/types';
import { SousTitres } from './SousTitres';
import type { Timeline, VideoJson } from './types';

export type VideoProps = VideoJson & { timeline?: Timeline };

/** Lit la timeline de la voix off pour fixer la durée totale de la composition. */
export const calculerMetadonnees: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const url = staticFile(`voix/${props.id}/timeline.json`);
  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error(`Voix off introuvable pour « ${props.id} ». Lance d'abord : npm run voix -- videos/${props.id}.json`);
  }
  const timeline = (await reponse.json()) as Timeline;
  if (timeline.scenes.length !== props.scenes.length) {
    throw new Error(`La voix off de « ${props.id} » ne correspond plus au JSON (nombre de scènes). Relance npm run voix.`);
  }
  return { durationInFrames: timeline.frames, fps: timeline.fps, props: { ...props, timeline } };
};

/** Courte transition d'entrée de scène : léger zoom arrière + flash. */
const Transition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 6], [1.12, 1], { extrapolateRight: 'clamp' });
  const flash = interpolate(frame, [0, 4], [0.5, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      {children}
      {flash > 0 && <AbsoluteFill style={{ background: '#FFFFFF', opacity: flash }} />}
    </AbsoluteFill>
  );
};

export const Video: React.FC<VideoProps> = ({ id, scenes, timeline }) => {
  if (!timeline) return null;
  const fps = timeline.fps;
  // Images de début de chaque scène (arrondies) : la scène suivante commence où l'autre s'arrête
  const debuts = timeline.scenes.map((s) => Math.round(s.debut * fps));
  return (
    <AbsoluteFill style={{ background: '#121014' }}>
      {scenes.map((json, i) => {
        const ts = timeline.scenes[i];
        const debut = debuts[i];
        const fin = i + 1 < debuts.length ? debuts[i + 1] : timeline.frames;
        const scene: SceneData = {
          ...json,
          // moment de l'animation principale : quand la voix prononce le mot déclencheur
          declencheur: ts.declencheurs[0]?.frame_dans_scene,
          // mots en images relatives à la scène : pilotent la bouche du personnage
          mots: ts.mots.map((m) => ({ texte: m.texte, debut: Math.round(m.debut * fps) - debut, fin: Math.round(m.fin * fps) - debut })),
        };
        return (
          <Sequence key={i} from={debut} durationInFrames={fin - debut} name={`${i + 1}. ${json.type}`}>
            <Transition>
              <Scene scene={scene} />
            </Transition>
          </Sequence>
        );
      })}
      <SousTitres blocs={timeline.scenes.flatMap((s) => s.sous_titres)} />
      <Audio src={staticFile(`voix/${id}/${timeline.audio}`)} />
    </AbsoluteFill>
  );
};
