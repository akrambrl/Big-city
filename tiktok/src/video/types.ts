// Format d'une vidéo (videos/XXX.json) et de la timeline produite par la voix off.
import type { SceneData } from '../scenes/types';

/** Une scène telle qu'écrite dans le JSON : tout SceneData + le texte dit par la voix off. */
export type SceneJson = Omit<SceneData, 'declencheur' | 'mots'> & {
  /** Texte de la voix off pour cette scène. */
  voix: string;
  /** Mot (ou expression) de la voix qui déclenche l'animation principale, ex. « 650 euros ». */
  declencheur?: string;
  /** Durée minimale de la scène en secondes (sinon : durée de la voix). */
  duree_min?: number;
};

export type VideoJson = {
  id: string;
  titre: string;
  /** Sources des informations juridiques (non affichées, pour vérification). */
  sources?: string[];
  voix?: { moteur?: 'piper' | 'kokoro' | 'pocket' | 'kyutai'; voix?: string; vitesse?: number; langue?: string };
  prononciation?: Record<string, string>;
  marges?: { avant: number; apres: number };
  scenes: SceneJson[];
};

// --- Timeline écrite par le module voix-off (temps en secondes, absolus) ---
export type MotTimeline = { texte: string; debut: number; fin: number };
export type BlocSousTitre = { debut: number; fin: number; mots: MotTimeline[] };
export type SceneTimeline = {
  id: string;
  debut: number;
  fin: number;
  duree: number;
  mots: MotTimeline[];
  declencheurs: { animation: string; mot: string; debut: number; frame_dans_scene: number }[];
  sous_titres: BlocSousTitre[];
};
export type Timeline = { fps: number; duree: number; frames: number; audio: string; scenes: SceneTimeline[] };
