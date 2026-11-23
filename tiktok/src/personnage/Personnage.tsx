// Personnage SVG réutilisable : même squelette pour tous, apparence selon la variante.
// Micro-animations automatiques : clignement des yeux, respiration, bouche qui parle.
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { EPAULE_DROITE, EPAULE_GAUCHE, POSES_BRAS, mixBras } from './poses';
import type { Apparence, Bras, Expression, Point, Pose, Variante } from './types';
import { APPARENCES, CONTOUR, nuance } from './variantes';
import { Visage } from './Visage';

const TRAIT = 4;

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
  /** Décale les clignements et la respiration entre plusieurs personnages. */
  graine?: number;
};

// --- Micro-animations (fonctions pures du temps : rendu déterministe image par image) ---

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

const chemin = (pts: Point[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');

/** Membre « tube » : un trait épais avec un contour (dessiné deux fois). */
const Tube: React.FC<{ pts: Point[]; couleur: string; largeur: number }> = ({ pts, couleur, largeur }) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={chemin(pts)} stroke={CONTOUR} strokeWidth={largeur + TRAIT * 2} />
    <path d={chemin(pts)} stroke={couleur} strokeWidth={largeur} />
  </g>
);

const Main: React.FC<{ bras: Bras; peau: string; pointe?: boolean }> = ({ bras, peau, pointe }) => {
  const { coude, main } = bras;
  const dx = main.x - coude.x, dy = main.y - coude.y;
  const n = Math.hypot(dx, dy) || 1;
  const ux = dx / n, uy = dy / n;
  return (
    <g>
      {pointe && (
        <Tube
          pts={[{ x: main.x + ux * 8, y: main.y + uy * 8 }, { x: main.x + ux * 36, y: main.y + uy * 36 }]}
          couleur={peau}
          largeur={11}
        />
      )}
      <circle cx={main.x} cy={main.y} r={17} fill={peau} stroke={CONTOUR} strokeWidth={TRAIT} />
    </g>
  );
};

const BrasSvg: React.FC<{ epaule: Point; bras: Bras; apparence: Apparence; pointe?: boolean }> = ({ epaule, bras, apparence, pointe }) => {
  const manche = apparence.haut.couleur;
  // poignet : la manche s'arrête un peu avant la main
  const dx = bras.main.x - bras.coude.x, dy = bras.main.y - bras.coude.y;
  const n = Math.hypot(dx, dy) || 1;
  const poignet = { x: bras.main.x - (dx / n) * 14, y: bras.main.y - (dy / n) * 14 };
  return (
    <g>
      <Tube pts={[epaule, bras.coude, poignet]} couleur={manche} largeur={40} />
      {/* revers de manche */}
      <Tube pts={[{ x: poignet.x - (dx / n) * 4, y: poignet.y - (dy / n) * 4 }, poignet]} couleur={nuance(manche, -0.18)} largeur={40} />
      <Main bras={bras} peau={apparence.peau} pointe={pointe} />
    </g>
  );
};

const TORSE = 'M 122 330 Q 122 296 164 291 L 236 291 Q 278 296 278 330 L 272 522 Q 200 534 128 522 Z';

const Torse: React.FC<{ apparence: Apparence }> = ({ apparence }) => {
  const { haut } = apparence;
  const fonce = nuance(haut.couleur, -0.2);
  return (
    <g>
      <path d={TORSE} fill={haut.couleur} stroke={CONTOUR} strokeWidth={TRAIT} strokeLinejoin="round" />
      {/* ombre côté droit pour le volume */}
      <path d="M 246 296 Q 278 300 278 330 L 272 522 Q 260 525 248 526 Z" fill="#000000" opacity={0.08} />
      {haut.type === 'pull' && (
        <g>
          <ellipse cx={200} cy={294} rx={30} ry={12} fill={haut.dessous} stroke={CONTOUR} strokeWidth={3} />
          <path d="M 166 292 Q 200 318 234 292" fill="none" stroke={fonce} strokeWidth={8} strokeLinecap="round" />
          <path d="M 130 506 Q 200 518 270 506" fill="none" stroke={fonce} strokeWidth={10} />
        </g>
      )}
      {(haut.type === 'costume' || haut.type === 'blazer' || haut.type === 'gilet') && (
        <g>
          {/* chemise visible dans l'ouverture en V */}
          <path d={`M 172 291 L 228 291 L 200 ${haut.type === 'gilet' ? 372 : 402} Z`} fill={haut.dessous} stroke={CONTOUR} strokeWidth={3} strokeLinejoin="round" />
          {/* col de chemise */}
          <path d="M 176 291 L 196 312 L 186 322 Z M 224 291 L 204 312 L 214 322 Z" fill={haut.dessous} stroke={CONTOUR} strokeWidth={2.5} strokeLinejoin="round" />
          {haut.cravate && (
            <path d="M 194 312 L 206 312 L 210 322 L 206 392 L 200 402 L 194 392 L 190 322 Z" fill={haut.cravate} stroke={CONTOUR} strokeWidth={2.5} strokeLinejoin="round" />
          )}
          {haut.type !== 'gilet' && (
            /* revers de veste */
            <path d="M 172 291 L 160 300 L 196 404 L 200 402 Z M 228 291 L 240 300 L 204 404 L 200 402 Z" fill={fonce} stroke={CONTOUR} strokeWidth={2.5} strokeLinejoin="round" />
          )}
          {(haut.type === 'gilet' ? [392, 432, 472, 506] : [432, 474]).map((y) => (
            <circle key={y} cx={200} cy={y} r={5} fill={fonce} stroke={CONTOUR} strokeWidth={1.5} />
          ))}
          <line x1={200} y1={haut.type === 'gilet' ? 372 : 402} x2={200} y2={526} stroke={fonce} strokeWidth={2.5} />
        </g>
      )}
      {apparence.collier && (
        <g fill="#FFFDF5" stroke={CONTOUR} strokeWidth={1.2}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI * (0.18 + (i / 8) * 0.64);
            return <circle key={i} cx={200 + Math.cos(a) * 30} cy={290 + Math.sin(a) * 24} r={4.5} />;
          })}
        </g>
      )}
    </g>
  );
};

const Jambes: React.FC<{ apparence: Apparence }> = ({ apparence }) => {
  const bas = apparence.bas;
  return (
    <g>
      <path d="M 132 508 L 268 508 L 266 572 L 134 572 Z" fill={bas} stroke={CONTOUR} strokeWidth={TRAIT} strokeLinejoin="round" />
      <Tube pts={[{ x: 164, y: 552 }, { x: 160, y: 752 }]} couleur={bas} largeur={54} />
      <Tube pts={[{ x: 236, y: 552 }, { x: 240, y: 752 }]} couleur={bas} largeur={54} />
      {/* couture du jean */}
      <path d="M 200 520 L 200 580" stroke={nuance(bas, -0.25)} strokeWidth={3} />
      <path d="M 176 600 L 172 740 M 224 600 L 228 740" stroke={nuance(bas, 0.15)} strokeWidth={2} strokeDasharray="6 6" />
      <ellipse cx={148} cy={770} rx={36} ry={15} fill={apparence.chaussures} stroke={CONTOUR} strokeWidth={TRAIT} />
      <ellipse cx={252} cy={770} rx={36} ry={15} fill={apparence.chaussures} stroke={CONTOUR} strokeWidth={TRAIT} />
    </g>
  );
};

const Telephone: React.FC<{ main: Point }> = ({ main }) => (
  <g transform={`translate(${main.x - 6} ${main.y - 28}) rotate(-14)`}>
    <rect x={-13} y={-26} width={26} height={52} rx={6} fill="#22252B" stroke={CONTOUR} strokeWidth={3} />
    <rect x={-9} y={-20} width={18} height={38} rx={3} fill="#5AC8FA" />
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

  // Inclinaison de la tête selon l'expression
  const inclinaison = { neutre: 0, choque: 0, content: 2, colere: -2, triste: 6, malin: -5 }[expression];

  return (
    <svg
      viewBox="0 0 400 800"
      width={hauteur / 2}
      height={hauteur}
      overflow="visible"
      style={{ transform: miroir ? 'scaleX(-1)' : undefined }}
    >
      {/* ombre au sol */}
      <ellipse cx={200} cy={782} rx={130} ry={14} fill="#000000" opacity={0.15} />
      <Jambes apparence={apparence} />
      <g transform={`translate(0 ${-2.5 * souffle})`}>
        {/* cou */}
        <rect x={182} y={246} width={36} height={56} fill={apparence.peau} stroke={CONTOUR} strokeWidth={TRAIT} />
        <g transform={`translate(0 520) scale(1 ${1 + 0.012 * souffle}) translate(0 -520)`}>
          <Torse apparence={apparence} />
        </g>
        <BrasSvg epaule={EPAULE_DROITE} bras={brasD} apparence={apparence} />
        <BrasSvg epaule={EPAULE_GAUCHE} bras={brasG} apparence={apparence} pointe={pose === 'pointe_doigt'} />
        <g transform={`translate(0 ${-1.2 * souffle}) rotate(${inclinaison} 200 270)`}>
          <Visage apparence={apparence} expression={expression} clignement={cligne} ouverture={bouche} />
        </g>
        {pose === 'telephone' && (
          <g opacity={k}>
            <Telephone main={brasD.main} />
            <Main bras={brasD} peau={apparence.peau} />
          </g>
        )}
      </g>
    </svg>
  );
};
