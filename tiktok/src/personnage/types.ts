// Types partagés du personnage.

export const EXPRESSIONS = ['neutre', 'choque', 'content', 'colere', 'triste', 'malin'] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export const POSES = ['debout', 'bras_leves', 'pointe_doigt', 'mains_hanches', 'telephone'] as const;
export type Pose = (typeof POSES)[number];

export const VARIANTES = ['heros', 'patron', 'proprietaire', 'conseiller'] as const;
export type Variante = (typeof VARIANTES)[number];

export type Point = { x: number; y: number };

/** Position des articulations d'un bras : épaule -> coude -> main. */
export type Bras = { coude: Point; main: Point };

/** Ce qui change d'un personnage à l'autre (même squelette, autre « costume »). */
export type Apparence = {
  nom: string;
  peau: string;
  cheveux: { couleur: string; style: 'court' | 'degarni' | 'chignon' | 'boucle' };
  haut: {
    type: 'pull' | 'costume' | 'gilet' | 'blazer';
    couleur: string;
    dessous: string; // t-shirt ou chemise visible au col
    cravate?: string;
  };
  bas: string;
  chaussures: string;
  barbe?: boolean; // barbe de quelques jours
  moustache?: boolean;
  lunettes?: boolean;
  collier?: boolean;
};
