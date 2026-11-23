// Personnage SVG réutilisable, style illustration de jeu (cel shading, contours noirs).
// Même squelette pour tous ; l'apparence dépend de la variante.
// Micro-animations automatiques : clignement des yeux, respiration, bouche qui parle.
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { angle, membre, versPoint } from './geometrie';
import { EPAULE_DROITE, EPAULE_GAUCHE, POSES_BRAS, mixBras } from './poses';
import type { Apparence, Bras, Expression, Point, Pose, Teinte, Variante } from './types';
import { APPARENCES, CONTOUR, TRAIT, TRAIT_FIN } from './variantes';
import { CheveuxDos, Visage } from './Visage';

export type PersonnageProps = {
  variante?: Variante;
  expression?: Expression;
  pose?: Pose;
  /** Pose de départ d'une transition (avec `transition` entre 0 et 1). */
  posePrecedente?: Pose;
  /** Avancement de la transition posePrecedente -> pose (1 = pose atteinte). */
  transition?: number;
  /** Ouverture de la bouche imposée (0..1), par exemple calculée depuis la voix off. */
  ouverture?: number;
  /** Sans `ouverture`, fait parler le personnage avec un mouvement de bouche automatique. */
  parle?: boolean;
  /** Hauteur affichée en pixels (largeur = moitié). */
  hauteur?: number;
  /** Retourne le personnage horizontalement (pour qu'il regarde vers la gauche). */
  miroir?: boolean;
  /** Lunettes de soleil. */
  lunettesSoleil?: boolean;
  /** Décale les clignements et la respiration entre plusieurs personnages. */
  graine?: number;
};

// --- Micro-animations (fonctions pures du temps : rendu identique à chaque fois) ---

const hasard = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Clignement : 0 = ouvert, 1 = fermé. Un clignement toutes les 2,5 à 4,5 s environ. */
export function clignement(t: number, graine: number): number {
  const periode = 3.2;
  const k = Math.floor(t / periode);
  for (const kk of [k - 1, k]) {
    const debut = kk * periode + hasard(graine, kk) * 1.6;
    const d = t - debut;
    if (d >= 0 && d < 0.2) return 1 - Math.abs(d - 0.1) / 0.1;
  }
  return 0;
}

/** Bouche automatique : alternance de « syllabes » d'environ 4 par seconde. */
export function boucheAuto(t: number): number {
  const syllabe = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 4.3);
  const phrase = 0.55 + 0.45 * Math.sin(t * Math.PI * 2 * 1.1 + 1);
  return Math.max(0, Math.min(1, syllabe * phrase * 1.2));
}

// --- Éléments du corps ---

/** Forme pleine ombrée : aplat de base + bande d'ombre + contour noir. */
const Forme: React.FC<{ d: string; ombre?: string; teinte: Teinte; trait?: number }> = ({ d, ombre, teinte, trait = TRAIT }) => (
  <g>
    <path d={d} fill={teinte.base} />
    {ombre && <path d={ombre} fill={teinte.ombre} />}
    <path d={d} fill="none" stroke={CONTOUR} strokeWidth={trait} strokeLinejoin="round" />
  </g>
);

/** Main orientée selon l'avant-bras : poing, index tendu, ou main ouverte (bras levés). */
const Main: React.FC<{ bras: Bras; peau: Teinte; geste: 'poing' | 'index' | 'ouverte'; cote: 1 | -1 }> = ({ bras, peau, geste, cote }) => {
  const a = angle(bras.coude, bras.main);
  const pouce = cote; // le pouce est tourné vers le corps
  return (
    <g transform={`translate(${bras.main.x} ${bras.main.y}) rotate(${a})`}>
      {geste === 'index' && (
        <path d="M 14 -9 L 44 -9 Q 50 -5 44 -1 L 16 -1 Z" fill={peau.base} stroke={CONTOUR} strokeWidth={3} strokeLinejoin="round" />
      )}
      {geste === 'ouverte' ? (
        <g>
          <path d="M -6 -13 L 18 -15 L 34 -12 Q 38 -9 34 -6 L 22 -6 L 36 -3 Q 40 0 36 3 L 22 3 L 34 7 Q 37 10 33 12 L 18 12 L -6 13 Z" fill={peau.base} stroke={CONTOUR} strokeWidth={3} strokeLinejoin="round" />
          <path d={`M 4 ${-13 * pouce} Q 16 ${-24 * pouce} 24 ${-20 * pouce}`} fill="none" stroke={CONTOUR} strokeWidth={3} />
        </g>
      ) : (
        <g>
          <path d="M -6 -14 Q 14 -18 26 -12 Q 33 0 26 12 Q 14 18 -6 14 Z" fill={peau.base} stroke={CONTOUR} strokeWidth={3} strokeLinejoin="round" />
          <path d="M 4 4 Q 16 14 26 6 L 26 12 Q 14 18 -6 14 Z" fill={peau.ombre} />
          <path d="M 18 -11 Q 23 -6 19 -2 M 20 -2 Q 25 3 20 7" fill="none" stroke={CONTOUR} strokeWidth={1.8} strokeLinecap="round" />
          <ellipse cx={10} cy={-14 * pouce} rx={10} ry={5.5} fill={peau.base} stroke={CONTOUR} strokeWidth={2.5} />
        </g>
      )}
    </g>
  );
};

const cercle = (c: Point, r: number) => `M ${c.x - r} ${c.y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

/**
 * Bras en deux segments (bras + avant-bras) avec épaule et coude arrondis.
 * Dessin en trois passes pour un contour unique, sans couture aux articulations :
 * 1) silhouette noire épaissie, 2) aplats de couleur, 3) ombres.
 */
const BrasSvg: React.FC<{ epaule: Point; bras: Bras; apparence: Apparence; geste: 'poing' | 'index' | 'ouverte'; cote: 1 | -1 }> = ({
  epaule, bras, apparence, geste, cote,
}) => {
  const { haut, peau } = apparence;
  const teinte = haut.teinte;
  const poignet = versPoint(bras.coude, bras.main, 12);
  const haut1 = membre([epaule, bras.coude], [46, 38]);
  const bas1 = membre([bras.coude, poignet], [38, 31]);
  const formes = [cercle(epaule, 23), haut1.contour, cercle(bras.coude, 19), bas1.contour];
  // revers de manche (pull) ou poignet de chemise (veste)
  const debutRevers = versPoint(bras.coude, poignet, 14);
  const revers = membre([debutRevers, poignet], [33, 32]);
  const poignetChemise = membre([poignet, versPoint(bras.coude, bras.main, 4)], [27, 26]);
  return (
    <g>
      {formes.map((d, i) => <path key={`c${i}`} d={d} fill={CONTOUR} stroke={CONTOUR} strokeWidth={TRAIT * 2} strokeLinejoin="round" />)}
      {formes.map((d, i) => <path key={`f${i}`} d={d} fill={teinte.base} />)}
      <path d={haut1.ombre} fill={teinte.ombre} />
      <path d={bas1.ombre} fill={teinte.ombre} />
      {/* pli au coude */}
      <path d={`M ${bras.coude.x - 9} ${bras.coude.y - 4} Q ${bras.coude.x} ${bras.coude.y + 4} ${bras.coude.x + 9} ${bras.coude.y - 2}`} fill="none" stroke={teinte.ombre} strokeWidth={TRAIT_FIN + 0.5} strokeLinecap="round" />
      {haut.type !== 'pull' ? (
        <Forme d={poignetChemise.contour} teinte={{ clair: haut.dessous, base: haut.dessous, ombre: haut.dessous }} trait={3} />
      ) : (
        <Forme d={revers.contour} teinte={{ ...teinte, base: teinte.ombre }} trait={3} />
      )}
      <Main bras={bras} peau={peau} geste={geste} cote={cote} />
    </g>
  );
};

const TORSE = 'M 150 184 Q 200 196 250 184 L 280 198 Q 298 208 296 240 L 286 408 Q 200 422 114 408 L 104 240 Q 102 208 120 198 Z';
const OMBRE_TORSE = 'M 236 188 L 280 198 Q 298 208 296 240 L 286 408 Q 266 412 244 414 Q 256 330 250 262 Q 246 222 236 188 Z';

const Torse: React.FC<{ apparence: Apparence }> = ({ apparence }) => {
  const { haut } = apparence;
  const teinte = haut.teinte;
  const clip = `torse-${apparence.nom.replace(/[^a-z]/gi, '')}`;
  return (
    <g>
      <clipPath id={clip}><path d={TORSE} /></clipPath>
      <path d={TORSE} fill={teinte.base} />
      <g clipPath={`url(#${clip})`}>
        <path d={OMBRE_TORSE} fill={teinte.ombre} />
        {/* reflet de lumière sur le côté gauche */}
        <path d="M 116 214 Q 128 260 122 330 L 112 330 Q 114 260 110 214 Z" fill={teinte.clair} />
        {haut.type === 'pull' && (
          <g>
            {/* bord-côte en bas du pull */}
            <path d="M 100 392 Q 200 406 300 392 L 300 430 L 100 430 Z" fill={teinte.ombre} />
            <path d="M 100 392 Q 200 406 300 392" fill="none" stroke={CONTOUR} strokeWidth={TRAIT_FIN} />
            {[130, 150, 170, 190, 210, 230, 250, 270].map((x) => (
              <line key={x} x1={x} y1={398 + Math.abs(x - 200) * -0.02} x2={x} y2={416} stroke={CONTOUR} strokeOpacity={0.35} strokeWidth={1.5} />
            ))}
            {/* plis du tricot */}
            <path d="M 146 300 Q 168 312 188 304 M 214 334 Q 236 342 254 330 M 136 360 Q 160 372 184 366" fill="none" stroke={teinte.ombre} strokeWidth={TRAIT_FIN + 0.5} strokeLinecap="round" />
          </g>
        )}
        {haut.type !== 'pull' && (
          <g>
            {/* chemise visible dans l'ouverture en V */}
            <path d={`M 174 184 L 226 184 L 200 ${haut.type === 'gilet' ? 262 : 292} Z`} fill={haut.dessous} stroke={CONTOUR} strokeWidth={3} strokeLinejoin="round" />
            <path d="M 176 186 L 194 206 L 184 214 Z M 224 186 L 206 206 L 216 214 Z" fill={haut.dessous} stroke={CONTOUR} strokeWidth={2.5} strokeLinejoin="round" />
            {haut.cravate && (
              <g>
                <path d="M 194 204 L 206 204 L 209 214 L 206 282 L 200 292 L 194 282 L 191 214 Z" fill={haut.cravate} stroke={CONTOUR} strokeWidth={2.5} strokeLinejoin="round" />
                <path d="M 201 214 L 205 282 L 200 292 Z" fill="#000" opacity={0.25} />
              </g>
            )}
            {haut.type !== 'gilet' && (
              <path d="M 174 184 L 158 194 L 196 296 L 200 292 Z M 226 184 L 242 194 L 204 296 L 200 292 Z" fill={teinte.ombre} stroke={CONTOUR} strokeWidth={2.5} strokeLinejoin="round" />
            )}
            <line x1={200} y1={haut.type === 'gilet' ? 262 : 292} x2={200} y2={420} stroke={CONTOUR} strokeWidth={TRAIT_FIN} />
            {(haut.type === 'gilet' ? [282, 316, 350, 384] : [326, 364]).map((y) => (
              <circle key={y} cx={206} cy={y} r={4.5} fill={teinte.ombre} stroke={CONTOUR} strokeWidth={1.5} />
            ))}
            {haut.type !== 'gilet' && <path d="M 236 330 L 268 330" stroke={CONTOUR} strokeWidth={TRAIT_FIN} />}
          </g>
        )}
      </g>
      <path d={TORSE} fill="none" stroke={CONTOUR} strokeWidth={TRAIT} strokeLinejoin="round" />
      {haut.type === 'pull' && (
        <g>
          {/* col rond : t-shirt qui dépasse + côte du col */}
          <path d="M 170 186 Q 200 204 230 186 Q 200 196 170 186 Z" fill={haut.dessous} stroke={CONTOUR} strokeWidth={2.5} />
          <path d="M 166 185 Q 200 212 234 185" fill="none" stroke={teinte.ombre} strokeWidth={8} strokeLinecap="round" />
          <path d="M 166 185 Q 200 212 234 185" fill="none" stroke={CONTOUR} strokeWidth={2} strokeLinecap="round" strokeOpacity={0.6} />
        </g>
      )}
      {apparence.collier && (
        <g fill="#FFFDF5" stroke={CONTOUR} strokeWidth={1.2}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI * (0.15 + (i / 8) * 0.7);
            return <circle key={i} cx={200 + Math.cos(a) * 28} cy={186 + Math.sin(a) * 22} r={4} />;
          })}
        </g>
      )}
    </g>
  );
};

const Jambes: React.FC<{ apparence: Apparence }> = ({ apparence }) => {
  const bas = apparence.bas;
  const jd = membre([{ x: 160, y: 430 }, { x: 158, y: 600 }, { x: 156, y: 752 }], [76, 60, 50]);
  const jg = membre([{ x: 240, y: 430 }, { x: 242, y: 600 }, { x: 244, y: 752 }], [76, 60, 50]);
  const { dessus, semelle } = apparence.chaussures;
  const Basket: React.FC<{ x: number; sens: 1 | -1 }> = ({ x, sens }) => (
    <g transform={`translate(${x} 0) scale(${sens} 1)`}>
      <path d="M -30 778 Q -32 752 -10 748 L 18 750 Q 32 756 32 772 L 32 780 L -30 780 Z" fill={dessus} stroke={CONTOUR} strokeWidth={TRAIT - 1} strokeLinejoin="round" />
      <path d="M 10 750 Q 30 756 32 772 L 32 780 L 8 780 Z" fill="#000" opacity={0.18} />
      <path d="M -14 756 L 6 754 M -16 762 L 8 760" stroke={CONTOUR} strokeWidth={2} strokeLinecap="round" />
      <path d="M -33 778 L 35 778 Q 36 790 26 790 L -26 790 Q -35 790 -33 778 Z" fill={semelle} stroke={CONTOUR} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
  return (
    <g>
      <Forme d={jd.contour} ombre={jd.ombre} teinte={bas} />
      <Forme d={jg.contour} ombre={jg.ombre} teinte={bas} />
      {/* bassin (couvre le haut des jambes) */}
      <path d="M 116 398 L 284 398 L 280 468 Q 240 474 222 470 L 200 520 L 178 470 Q 160 474 120 468 Z" fill={bas.base} />
      <path d="M 222 400 L 284 398 L 280 468 Q 250 472 222 470 Z" fill={bas.ombre} />
      <path d="M 120 468 L 116 398 L 284 398 L 280 468" fill="none" stroke={CONTOUR} strokeWidth={TRAIT} strokeLinejoin="round" />
      {/* poches, couture, plis aux genoux et aux chevilles */}
      <g fill="none" stroke={bas.clair} strokeWidth={TRAIT_FIN} strokeLinecap="round">
        <path d="M 126 410 Q 150 434 170 410 M 274 410 Q 250 434 230 410" strokeDasharray="5 4" />
        <path d="M 200 404 L 200 470" stroke={CONTOUR} strokeWidth={2} />
      </g>
      <g fill="none" stroke={bas.ombre} strokeWidth={TRAIT_FIN + 0.5} strokeLinecap="round">
        <path d="M 140 590 Q 156 598 170 588 M 146 606 L 166 602 M 230 592 Q 244 600 258 590" />
        <path d="M 136 726 Q 156 734 176 724 M 140 738 Q 158 744 172 736 M 224 728 Q 244 736 264 726 M 228 740 Q 246 746 260 738" />
      </g>
      <Basket x={152} sens={-1} />
      <Basket x={248} sens={1} />
    </g>
  );
};

const Cou: React.FC<{ apparence: Apparence }> = ({ apparence }) => {
  const { peau } = apparence;
  return (
    <g>
      <path d="M 178 146 L 176 194 L 224 194 L 222 146 Z" fill={peau.base} stroke={CONTOUR} strokeWidth={TRAIT} strokeLinejoin="round" />
      <path d="M 178 150 L 222 150 L 222 172 Q 200 182 178 172 Z" fill={peau.ombre} />
      <path d="M 210 150 L 222 150 L 224 194 L 212 194 Z" fill={peau.ombre} />
      {apparence.visage === 'homme' && <path d="M 198 178 Q 201 183 198 188" fill="none" stroke={peau.ombre} strokeWidth={2} />}
    </g>
  );
};

const Telephone: React.FC<{ main: Point }> = ({ main }) => (
  <g transform={`translate(${main.x + 4} ${main.y - 22}) rotate(-12)`}>
    <rect x={-12} y={-26} width={24} height={52} rx={5} fill="#1A1C21" stroke={CONTOUR} strokeWidth={3} />
    <rect x={-8} y={-21} width={16} height={40} rx={2} fill="#2C3E66" />
    <path d="M -6 -18 L 2 -18 L -6 -6 Z" fill="#FFFFFF" opacity={0.3} />
  </g>
);

// --- Le personnage complet ---

export const Personnage: React.FC<PersonnageProps> = ({
  variante = 'heros',
  expression = 'neutre',
  pose = 'debout',
  posePrecedente,
  transition = 1,
  ouverture,
  parle = false,
  hauteur = 800,
  miroir = false,
  lunettesSoleil = false,
  graine = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const apparence = APPARENCES[variante];

  // Respiration : le haut du corps monte et descend doucement
  const souffle = Math.sin((t / 3.4) * Math.PI * 2 + graine);
  const cligne = clignement(t, graine);
  const bouche = ouverture ?? (parle ? boucheAuto(t + graine) : 0);

  // Bras : pose (éventuellement en transition) + léger balancement
  const cible = POSES_BRAS[pose];
  const depart = POSES_BRAS[posePrecedente ?? pose];
  const k = Math.max(0, Math.min(1, transition));
  const balance = (bras: Bras, phase: number): Bras => ({
    coude: { x: bras.coude.x, y: bras.coude.y + Math.sin(t * 1.7 + phase) * 1.5 },
    main: { x: bras.main.x + Math.sin(t * 1.3 + phase) * 2, y: bras.main.y + Math.sin(t * 1.7 + phase) * 3 },
  });
  const brasD = balance(mixBras(depart.droit, cible.droit, k), graine);
  const brasG = balance(mixBras(depart.gauche, cible.gauche, k), graine + 2);
  const gesteBras = (p: Pose) => (p === 'bras_leves' ? 'ouverte' : 'poing') as 'poing' | 'ouverte';

  const corps = apparence.silhouette === 'fine' ? 'translate(200 0) scale(0.86 1) translate(-200 0)' : undefined;
  const inclinaison = { neutre: 0, choque: -1, content: 2, colere: -2, triste: 5, malin: -4 }[expression];

  return (
    <svg viewBox="0 0 400 800" width={hauteur / 2} height={hauteur} overflow="visible" style={{ transform: miroir ? 'scaleX(-1)' : undefined }}>
      {/* ombre au sol */}
      <ellipse cx={200} cy={790} rx={120} ry={13} fill="#000000" opacity={0.25} />
      {/* silhouette fine : corps resserré autour de l'axe central, tête inchangée */}
      <g transform={corps}>
        <Jambes apparence={apparence} />
      </g>
      <g transform={`translate(0 ${-2.5 * souffle})`}>
        <g transform={`translate(0 ${-1.2 * souffle}) rotate(${inclinaison} 200 170)`}>
          <CheveuxDos apparence={apparence} />
        </g>
        <g transform={corps}>
          <Cou apparence={apparence} />
          <g transform={`translate(0 410) scale(1 ${1 + 0.01 * souffle}) translate(0 -410)`}>
            <Torse apparence={apparence} />
          </g>
          <BrasSvg epaule={EPAULE_DROITE} bras={brasD} apparence={apparence} geste={gesteBras(pose)} cote={-1} />
          <BrasSvg epaule={EPAULE_GAUCHE} bras={brasG} apparence={apparence} geste={pose === 'pointe_doigt' ? 'index' : gesteBras(pose)} cote={1} />
        </g>
        <g transform={`translate(0 ${-1.2 * souffle}) rotate(${inclinaison} 200 170)`}>
          <Visage apparence={apparence} expression={expression} clignement={cligne} ouverture={bouche} lunettesSoleil={lunettesSoleil} />
        </g>
        {pose === 'telephone' && (
          <g opacity={k} transform={corps}>
            <Telephone main={brasD.main} />
            <Main bras={brasD} peau={apparence.peau} geste="poing" cote={-1} />
          </g>
        )}
      </g>
    </svg>
  );
};

