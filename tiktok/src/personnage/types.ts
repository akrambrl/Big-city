// Types partagés du personnage.

export const EXPRESSIONS = ['neutre', 'choque', 'content', 'colere', 'triste', 'malin'] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export const POSES = ['debout', 'bras_leves', 'pointe_doigt', 'mains_hanches', 'telephone'] as const;
export type Pose = (typeof POSES)[number];

export const VARIANTES = ['heros', 'heroine', 'patron', 'proprietaire', 'conseiller'] as const;
export type Variante = (typeof VARIANTES)[number];

export type Point = { x: number; y: number };

/** Position des articulations d'un bras : épaule -> coude -> main. */
export type Bras = { coude: Point; main: Point };

/** Une couleur en trois tons pour l'ombrage en aplats (cel shading) : lumière, base, ombre. */
export type Teinte = { clair: string; base: string; ombre: string };

/** Ce qui change d'un personnage à l'autre (même squelette, autre « costume »). */
export type Apparence = {
  nom: string;
  visage: 'homme' | 'femme';
  peau: Teinte;
  cheveux: { teinte: Teinte; style: 'court' | 'degarni' | 'chignon' | 'boucle' | 'long' };
  haut: {
    type: 'pull' | 'costume' | 'gilet' | 'blazer';
    teinte: Teinte;
    dessous: string; // t-shirt ou chemise visible au col
    cravate?: string;
  };
  bas: Teinte;
  chaussures: { dessus: string; semelle: string };
  barbe?: boolean; // barbe de trois jours
  moustache?: boolean;
  lunettes?: boolean;
  collier?: boolean;
  bouclesOreilles?: boolean;
  /** Silhouette un peu plus fine (épaules et hanches). */
  silhouette?: 'large' | 'fine';
};
