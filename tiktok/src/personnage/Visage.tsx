// La tête : visage, cheveux, yeux, sourcils, bouche et accessoires.
// Tout est dessiné dans le repère 400 x 800 du personnage (tête centrée en 200, 175).
import React, { useId } from 'react';
import type { Apparence, Expression } from './types';
import { CONTOUR, nuance } from './variantes';

const TRAIT = 4; // épaisseur du contour

type Props = {
  apparence: Apparence;
  expression: Expression;
  /** 0 = yeux ouverts, 1 = fermés (clignement) */
  clignement: number;
  /** 0 = bouche fermée, 1 = grande ouverte (parole) */
  ouverture: number;
};

// Sourcils : hauteur côté intérieur / extérieur pour chaque expression (y SVG, plus petit = plus haut)
const SOURCILS: Record<Expression, { d: [number, number]; g: [number, number] }> = {
  neutre: { d: [136, 138], g: [136, 138] },
  choque: { d: [118, 116], g: [118, 116] },
  content: { d: [128, 130], g: [128, 130] },
  colere: { d: [152, 132], g: [152, 132] },
  triste: { d: [128, 145], g: [128, 145] },
  malin: { d: [142, 140], g: [126, 118] },
};

// Ouverture des yeux : taille, pupille, paupière supérieure (0 = aucune, 1 = fermée)
const YEUX: Record<Expression, { echelle: number; pupille: number; paupiere: number }> = {
  neutre: { echelle: 1, pupille: 10, paupiere: 0.08 },
  choque: { echelle: 1.18, pupille: 7, paupiere: 0 },
  content: { echelle: 1, pupille: 10, paupiere: 0.12 },
  colere: { echelle: 0.95, pupille: 9, paupiere: 0.35 },
  triste: { echelle: 1, pupille: 10, paupiere: 0.3 },
  malin: { echelle: 1, pupille: 9, paupiere: 0.45 },
};

const Oeil: React.FC<{ cx: number; cy: number; expression: Expression; clignement: number; peau: string; cote: 1 | -1 }> = ({
  cx, cy, expression, clignement, peau, cote,
}) => {
  const y = YEUX[expression];
  const rx = 21 * y.echelle;
  const ry = 25 * y.echelle;
  // paupière : la plus fermée entre l'expression et le clignement
  const ferme = Math.max(y.paupiere, clignement);
  // identifiant unique : plusieurs personnages peuvent être affichés en même temps
  const clipId = `oeil-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  // le malin ferme un peu plus l'œil gauche (côté droit de l'écran)
  const fermeture = expression === 'malin' && cote === 1 ? Math.max(ferme, 0.55) : ferme;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFFFF" />
      <g clipPath={`url(#${clipId})`}>
        <circle cx={cx + 2 * cote * -1 + 1} cy={cy + 4} r={y.pupille} fill="#2A1C14" />
        <circle cx={cx - 2} cy={cy - 1} r={y.pupille * 0.35} fill="#FFFFFF" />
        {/* paupière supérieure (couleur peau) qui descend */}
        <rect x={cx - rx - 2} y={cy - ry - 2} width={rx * 2 + 4} height={(ry * 2 + 4) * fermeture} fill={peau} />
        {fermeture > 0.02 && (
          <line
            x1={cx - rx} x2={cx + rx}
            y1={cy - ry - 2 + (ry * 2 + 4) * fermeture} y2={cy - ry - 2 + (ry * 2 + 4) * fermeture}
            stroke={CONTOUR} strokeWidth={3} strokeLinecap="round"
          />
        )}
      </g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={CONTOUR} strokeWidth={3} />
    </g>
  );
};

const Bouche: React.FC<{ expression: Expression; ouverture: number }> = ({ expression, ouverture }) => {
  const cx = 200, cy = 234;
  const clipId = `bouche-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  // Quand le personnage parle, la bouche s'ouvre ; la largeur dépend de l'expression
  if (ouverture > 0.06 || expression === 'choque') {
    const o = expression === 'choque' ? Math.max(ouverture, 0.75) : ouverture;
    const w = expression === 'content' ? 26 : expression === 'choque' ? 14 : 19;
    const h = 5 + o * 15;
    const sourire = expression === 'content' ? 6 : expression === 'triste' || expression === 'colere' ? -4 : 2;
    const d = `M ${cx - w} ${cy - sourire / 2}
      Q ${cx} ${cy + sourire - h * 0.4} ${cx + w} ${cy - sourire / 2}
      Q ${cx + w * 0.9} ${cy + h * 1.6} ${cx} ${cy + h * 1.7}
      Q ${cx - w * 0.9} ${cy + h * 1.6} ${cx - w} ${cy - sourire / 2} Z`;
    return (
      <g>
        <clipPath id={clipId}><path d={d} /></clipPath>
        <path d={d} fill="#7A2323" />
        <g clipPath={`url(#${clipId})`}>
          <ellipse cx={cx} cy={cy + h * 1.6} rx={w * 0.7} ry={h * 0.7} fill="#E86F6F" />
          {expression !== 'choque' && <rect x={cx - w} y={cy - 12} width={w * 2} height={10} fill="#FFFFFF" />}
        </g>
        <path d={d} fill="none" stroke={CONTOUR} strokeWidth={3.5} strokeLinejoin="round" />
      </g>
    );
  }
  const traits: Record<Expression, string> = {
    neutre: `M 182 232 Q 200 242 218 232`,
    choque: '',
    content: `M 174 226 Q 200 256 226 226 Z`,
    colere: `M 180 242 Q 200 228 220 242`,
    triste: `M 182 244 Q 200 230 218 244`,
    malin: `M 182 236 Q 206 244 226 224`,
  };
  if (expression === 'content') {
    return (
      <g>
        <path d={traits.content} fill="#7A2323" stroke={CONTOUR} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M 180 230 Q 200 236 220 230 L 219 226 L 181 226 Z" fill="#FFFFFF" />
        <ellipse cx={200} cy={244} rx={10} ry={5} fill="#E86F6F" />
      </g>
    );
  }
  return <path d={traits[expression]} fill="none" stroke={CONTOUR} strokeWidth={4.5} strokeLinecap="round" />;
};

const Cheveux: React.FC<{ apparence: Apparence; devant: boolean }> = ({ apparence, devant }) => {
  const { couleur, style } = apparence.cheveux;
  const p = { fill: couleur, stroke: CONTOUR, strokeWidth: TRAIT, strokeLinejoin: 'round' as const };
  if (style === 'chignon' && !devant) return <circle cx={200} cy={78} r={34} {...p} />;
  if (!devant) return null;
  switch (style) {
    case 'court':
      return (
        <path
          {...p}
          d="M 112 176 C 104 96 156 64 206 66 C 262 68 300 104 290 176
             C 282 146 270 126 252 116 C 230 128 186 130 150 116 C 132 128 118 148 112 176 Z"
        />
      );
    case 'degarni':
      return (
        <g>
          <path {...p} d="M 113 190 C 106 150 114 122 138 110 L 146 150 C 130 158 124 172 122 192 Z" />
          <path {...p} d="M 287 190 C 294 150 286 122 262 110 L 254 150 C 270 158 276 172 278 192 Z" />
        </g>
      );
    case 'chignon':
      return (
        <path
          {...p}
          d="M 112 180 C 106 102 152 76 202 76 C 254 76 298 104 289 180
             C 280 140 262 118 236 112 C 214 120 186 120 164 112 C 136 120 118 144 112 180 Z"
        />
      );
    case 'boucle': {
      // boucles : une couronne de petits cercles
      const cercles = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (1.02 + (i / 12) * 0.96);
        cercles.push(<circle key={i} cx={200 + Math.cos(a) * 88} cy={168 + Math.sin(a) * 92} r={24} {...p} />);
      }
      return (
        <g>
          {cercles}
          <path d="M 120 160 C 130 110 270 110 280 160 L 280 120 L 120 120 Z" fill={couleur} />
        </g>
      );
    }
  }
};

export const Visage: React.FC<Props> = ({ apparence, expression, clignement, ouverture }) => {
  const peau = apparence.peau;
  const s = SOURCILS[expression];
  const sourcil = apparence.cheveux.style === 'degarni' ? '#6E6E6E' : nuance(apparence.cheveux.couleur, -0.2);
  return (
    <g>
      <Cheveux apparence={apparence} devant={false} />
      {/* oreilles */}
      <circle cx={114} cy={188} r={15} fill={peau} stroke={CONTOUR} strokeWidth={TRAIT} />
      <circle cx={286} cy={188} r={15} fill={peau} stroke={CONTOUR} strokeWidth={TRAIT} />
      {/* visage */}
      <ellipse cx={200} cy={176} rx={88} ry={96} fill={peau} stroke={CONTOUR} strokeWidth={TRAIT} />
      {/* ombre douce sous le menton côté droit */}
      <path d="M 250 240 Q 230 268 200 270 Q 250 262 270 230 Z" fill={nuance(peau, -0.12)} opacity={0.6} />
      {apparence.barbe && (
        <path d="M 124 214 Q 140 268 200 272 Q 260 268 276 214 Q 262 250 200 254 Q 138 250 124 214 Z" fill="#3B2A20" opacity={0.16} />
      )}
      {/* joues */}
      {(expression === 'content' || expression === 'malin' || expression === 'choque') && (
        <g opacity={0.35} fill="#FF7B7B">
          <ellipse cx={146} cy={214} rx={15} ry={9} />
          <ellipse cx={254} cy={214} rx={15} ry={9} />
        </g>
      )}
      {expression === 'colere' && <ellipse cx={200} cy={150} rx={80} ry={60} fill="#FF3B30" opacity={0.12} />}
      <Cheveux apparence={apparence} devant />
      {/* yeux */}
      <Oeil cx={164} cy={180} expression={expression} clignement={clignement} peau={peau} cote={-1} />
      <Oeil cx={236} cy={180} expression={expression} clignement={clignement} peau={peau} cote={1} />
      {/* sourcils */}
      <g stroke={sourcil} strokeWidth={9} strokeLinecap="round" fill="none">
        <path d={`M 182 ${s.d[0]} Q 164 ${(s.d[0] + s.d[1]) / 2 - 7} 146 ${s.d[1]}`} />
        <path d={`M 218 ${s.g[0]} Q 236 ${(s.g[0] + s.g[1]) / 2 - 7} 254 ${s.g[1]}`} />
      </g>
      {/* nez */}
      <path d="M 198 196 Q 188 214 202 216" fill="none" stroke={nuance(peau, -0.35)} strokeWidth={4} strokeLinecap="round" />
      {apparence.moustache && (
        <path d="M 172 226 Q 186 212 200 222 Q 214 212 228 226 Q 214 230 200 226 Q 186 230 172 226 Z" fill="#8A8A8A" stroke={CONTOUR} strokeWidth={2.5} />
      )}
      <Bouche expression={expression} ouverture={ouverture} />
      {apparence.lunettes && (
        <g fill="none" stroke="#3A3A44" strokeWidth={4.5}>
          <circle cx={164} cy={180} r={32} />
          <circle cx={236} cy={180} r={32} />
          <path d="M 196 176 Q 200 170 204 176" />
          <path d="M 132 176 L 116 172 M 268 176 L 284 172" />
        </g>
      )}
      {/* goutte de sueur pour le choc */}
      {expression === 'choque' && (
        <path d="M 288 120 Q 300 142 294 152 Q 284 158 280 146 Q 280 136 288 120 Z" fill="#7CC8FF" stroke={CONTOUR} strokeWidth={2.5} />
      )}
    </g>
  );
};
