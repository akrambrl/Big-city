// Description d'une scène, telle qu'elle sera lue dans videos/XXX.json (étape 4).
import type { DecorNom } from '../decors/Decors';
import type { Expression, Pose, Variante } from '../personnage/types';

export const TYPES_SCENE = ['accroche', 'montant', 'document', 'explication', 'cta'] as const;
export type TypeScene = (typeof TYPES_SCENE)[number];

export type PersonnageScene = {
  variante?: Variante; // heros (Thomas) par défaut
  expression?: Expression;
  pose?: Pose;
  /** Expression et pose prises au moment du déclencheur (réaction). */
  expressionApres?: Expression;
  poseApres?: Pose;
  lunettesSoleil?: boolean;
};

export type DocumentScene = {
  type: 'courrier' | 'bail' | 'fiche_paie' | 'facture';
  titre: string;
  lignes: string[];
  /** Indice (à partir de 0) de la ligne surlignée en jaune. */
  surligne: number;
};

export type MotDate = { texte: string; debut: number; fin: number }; // en images, relatif à la scène

export type SceneData = {
  type: TypeScene;
  decor: DecorNom;
  personnage?: PersonnageScene;
  /** Personnage secondaire (patron, propriétaire, conseillère…) placé à droite. */
  secondaire?: PersonnageScene;
  /** accroche : texte du bandeau jaune ; cta : grand titre */
  titre?: string;
  /** Texte clé affiché (explication) ou sous-titre (accroche, cta). Les **mots** entre étoiles sont surlignés. */
  texte?: string;
  montant?: { ancien: string; nouveau: string; legende?: string };
  document?: DocumentScene;

  // --- Calage temporel (en images, relatif au début de la scène) ---
  /** Moment de l'animation principale (montant qui apparaît, ligne surlignée…). */
  declencheur?: number;
  /** Mots de la voix off avec leurs temps (étape 3) : pilotent la bouche du personnage. */
  mots?: MotDate[];
};
