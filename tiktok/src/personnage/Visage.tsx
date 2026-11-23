// La tête, style illustration de jeu : proportions réalistes, contours noirs, ombres en aplats.
// Repère : tête centrée en x = 200, yeux à y ≈ 97, bouche à y ≈ 140.
import React, { useId } from 'react';
import type { Apparence, Expression } from './types';
import { CONTOUR, TRAIT, TRAIT_FIN } from './variantes';

type Props = {
  apparence: Apparence;
  expression: Expression;
  /** 0 = yeux ouverts, 1 = fermés (clignement) */
  clignement: number;
  /** 0 = bouche fermée, 1 = grande ouverte (parole) */
  ouverture: number;
  lunettesSoleil?: boolean;
};

// Identifiant unique : plusieurs personnages peuvent être affichés en même temps
const useIdUnique = (prefixe: string) => `${prefixe}${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

const TETE = {
  homme: 'M 200 38 C 234 38 248 62 248 92 L 246 114 C 244 130 238 142 228 151 L 214 161 Q 200 168 186 161 L 172 151 C 162 142 156 130 154 114 L 152 92 C 152 62 166 38 200 38 Z',
  femme: 'M 200 40 C 232 40 246 62 246 92 L 244 112 C 241 132 230 148 216 158 Q 200 168 184 158 C 170 148 159 132 156 112 L 154 92 C 154 62 168 40 200 40 Z',
};

// Réglages par expression : ouverture des yeux, décalage des sourcils (intérieur, extérieur),
// inclinaison des paupières (> 0 : coin intérieur plus bas = colère)
const REGLAGES: Record<Expression, { yeux: number; oeilG?: number; sourcilD: [number, number]; sourcilG: [number, number]; pente: number }> = {
  neutre: { yeux: 1, sourcilD: [0, 0], sourcilG: [0, 0], pente: 0 },
  choque: { yeux: 1.5, sourcilD: [-10, -8], sourcilG: [-10, -8], pente: 0 },
  content: { yeux: 0.72, sourcilD: [-3, -2], sourcilG: [-3, -2], pente: 0 },
  colere: { yeux: 0.78, sourcilD: [7, -3], sourcilG: [7, -3], pente: 2.5 },
  triste: { yeux: 0.8, sourcilD: [-7, 3], sourcilG: [-7, 3], pente: -2.5 },
  malin: { yeux: 0.62, oeilG: 0.42, sourcilD: [0, 0], sourcilG: [-7, -10], pente: 0 },
};

const Oeil: React.FC<{ cx: number; cote: -1 | 1; ouvert: number; pente: number; femme: boolean; peauOmbre: string }> = ({
  cx, cote, ouvert, pente, femme, peauOmbre,
}) => {
  const cy = 97;
  const clip = useIdUnique('oeil');
  // cote -1 = œil à gauche de l'écran ; le coin intérieur est vers le centre du visage
  const xInt = cx - cote * 10.5, xExt = cx + cote * 11.5;
  const yInt = cy + pente, yExt = cy - 1;
  const h = 7.5 * ouvert;
  const pli = (
    <path d={`M ${xInt} ${yInt - 6 - h * 0.6} Q ${cx} ${cy - 10 - h} ${xExt} ${yExt - 5 - h * 0.5}`} fill="none" stroke={peauOmbre} strokeWidth={2} strokeLinecap="round" />
  );
  if (ouvert < 0.14) {
    // œil fermé : une simple ligne de paupière
    return (
      <g>
        {pli}
        <path d={`M ${xInt} ${yInt} Q ${cx} ${cy + 3} ${xExt} ${yExt}`} fill="none" stroke={CONTOUR} strokeWidth={3.2} strokeLinecap="round" />
      </g>
    );
  }
  const forme = `M ${xExt} ${yExt} Q ${cx} ${cy - h * 1.35} ${xInt} ${yInt} Q ${cx} ${cy + h * 0.95} ${xExt} ${yExt} Z`;
  return (
    <g>
      {pli}
      <clipPath id={clip}><path d={forme} /></clipPath>
      <path d={forme} fill="#F3EEE7" />
      <g clipPath={`url(#${clip})`}>
        <circle cx={cx - cote} cy={cy + 0.5} r={5} fill="#4E3221" />
        <circle cx={cx - cote} cy={cy + 0.5} r={2.4} fill="#0B0807" />
        <circle cx={cx - cote - 1.6} cy={cy - 1.4} r={1.3} fill="#FFFFFF" />
        {/* ombre portée de la paupière sur le blanc de l'œil */}
        <path d={`M ${xExt - cote * 2} ${yExt - 1} Q ${cx} ${cy - h * 1.1} ${xInt + cote * 2} ${yInt - 1}`} fill="none" stroke="#000000" strokeOpacity={0.18} strokeWidth={3} />
      </g>
      {/* paupière supérieure épaisse (prolongée en trait de cils pour les femmes) */}
      <path d={`M ${xExt + cote * (femme ? 3 : 1)} ${yExt - (femme ? 2 : 0)} Q ${cx} ${cy - h * 1.35} ${xInt} ${yInt}`} fill="none" stroke={CONTOUR} strokeWidth={femme ? 3.6 : 3.2} strokeLinecap="round" />
      <path d={`M ${xInt} ${yInt} Q ${cx} ${cy + h * 0.95} ${xExt} ${yExt}`} fill="none" stroke={CONTOUR} strokeOpacity={0.55} strokeWidth={1.4} />
    </g>
  );
};

const Sourcil: React.FC<{ cote: -1 | 1; decalage: [number, number]; femme: boolean; couleur: string }> = ({ cote, decalage, femme, couleur }) => {
  const xi = 200 + cote * 8, xo = 200 + cote * 35;
  const yi = 84 + decalage[0], yo = 86 + decalage[1];
  const ei = femme ? 4 : 7, eo = femme ? 2.4 : 4;
  const xm = (xi + xo) / 2, ym = (yi + yo) / 2 - 3;
  const d = `M ${xi} ${yi - ei / 2} Q ${xm} ${ym - ei / 2 - 1} ${xo} ${yo - eo / 2} L ${xo} ${yo + eo / 2} Q ${xm} ${ym + ei / 2} ${xi} ${yi + ei / 2} Z`;
  return <path d={d} fill={couleur} stroke={CONTOUR} strokeWidth={1.2} strokeLinejoin="round" />;
};

const Bouche: React.FC<{ expression: Expression; ouverture: number; femme: boolean; ombre: string }> = ({ expression, ouverture, femme, ombre }) => {
  const clip = useIdUnique('bouche');
  const levre = femme ? '#A6474E' : CONTOUR;
  // Parole : bouche ouverte dont la hauteur suit `ouverture`
  if (ouverture > 0.06 && expression !== 'choque') {
    const w = expression === 'content' ? 13 : 11;
    const h = 2 + ouverture * 11;
    const coin = expression === 'content' ? -2 : expression === 'triste' || expression === 'colere' ? 2 : 0;
    const d = `M ${200 - w} ${139 + coin} Q 200 137.5 ${200 + w} ${139 + coin} Q ${200 + w * 0.85} ${139 + h} 200 ${140 + h * 1.2} Q ${200 - w * 0.85} ${139 + h} ${200 - w} ${139 + coin} Z`;
    return (
      <g>
        <clipPath id={clip}><path d={d} /></clipPath>
        <path d={d} fill="#3A1214" />
        <g clipPath={`url(#${clip})`}>
          <rect x={200 - w} y={136} width={w * 2} height={4.5} fill="#F2EEE8" />
          <ellipse cx={200} cy={141 + h * 1.2} rx={w * 0.6} ry={h * 0.5} fill="#B5545A" />
        </g>
        <path d={d} fill="none" stroke={levre} strokeWidth={2.6} strokeLinejoin="round" />
        <path d={`M 194 ${144 + h * 1.3} Q 200 ${146 + h * 1.3} 206 ${144 + h * 1.3}`} fill="none" stroke={ombre} strokeWidth={2.4} strokeLinecap="round" />
      </g>
    );
  }
  switch (expression) {
    case 'choque':
      return (
        <g>
          <ellipse cx={200} cy={145} rx={7} ry={9.5} fill="#3A1214" stroke={levre} strokeWidth={2.6} />
          <ellipse cx={200} cy={150} rx={4} ry={3} fill="#B5545A" />
        </g>
      );
    case 'content':
      return (
        <g>
          <path d="M 184 135 Q 200 153 216 135 Q 200 141 184 135 Z" fill="#F2EEE8" stroke={levre} strokeWidth={2.6} strokeLinejoin="round" />
          <path d="M 186 137 Q 200 149 214 137" fill="none" stroke="#000" strokeOpacity={0.15} strokeWidth={2} />
          <path d="M 180 131 Q 178 136 182 140 M 220 131 Q 222 136 218 140" fill="none" stroke={ombre} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    default: {
      const traits: Record<string, string> = {
        neutre: 'M 188 140 Q 200 142 212 140',
        colere: 'M 187 144 Q 200 136 213 144',
        triste: 'M 189 144 Q 200 138 211 144',
        malin: 'M 189 141 Q 203 144 214 134',
      };
      return (
        <g>
          {femme && <path d="M 190 141 Q 200 149 210 141 Q 200 143 190 141 Z" fill="#B85A60" />}
          <path d={traits[expression]} fill="none" stroke={levre} strokeWidth={femme ? 3.4 : 3} strokeLinecap="round" />
          <path d="M 194 146 Q 200 149 206 146" fill="none" stroke={ombre} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      );
    }
  }
};

/** Cheveux : partie arrière (derrière la tête) et partie avant. */
const Cheveux: React.FC<{ apparence: Apparence; devant: boolean }> = ({ apparence, devant }) => {
  const { teinte, style } = apparence.cheveux;
  const p = { stroke: CONTOUR, strokeWidth: TRAIT - 1, strokeLinejoin: 'round' as const };
  if (!devant) {
    if (style === 'chignon') return <circle cx={200} cy={26} r={22} fill={teinte.base} {...p} />;
    if (style === 'boucle') {
      const boucles = [];
      for (let i = 0; i <= 14; i++) {
        const a = Math.PI * (0.92 + (i / 14) * 1.16);
        const x = 200 + Math.cos(a) * 60, y = 92 + Math.sin(a) * 64;
        boucles.push(<circle key={i} cx={x} cy={y} r={21} fill={x > 205 ? teinte.ombre : teinte.base} {...p} />);
      }
      return <g>{boucles}</g>;
    }
    return null;
  }
  switch (style) {
    case 'court':
      return (
        <g>
          {/* dégradé court sur les côtés */}
          <path d="M 153 96 L 154 116 L 160 114 L 161 86 Z M 247 96 L 246 116 L 240 114 L 239 86 Z" fill={teinte.base} opacity={0.75} />
          <path {...p} fill={teinte.base} d="M 152 100 C 145 60 164 24 206 24 C 242 24 260 48 251 98 L 247 80 C 243 66 232 58 218 60 C 206 53 184 53 170 63 C 161 70 156 84 155 100 Z" />
          <path d="M 214 28 C 244 32 256 54 251 98 L 247 80 C 243 66 232 58 218 60 Z" fill={teinte.ombre} />
          <path d="M 176 40 Q 198 30 228 36 M 168 52 Q 194 40 234 48 M 186 30 Q 206 26 222 30" fill="none" stroke={teinte.clair} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case 'degarni':
      return (
        <g>
          <path {...p} fill={teinte.base} d="M 151 108 C 149 82 155 66 168 58 L 170 84 C 163 90 158 98 157 112 Z" />
          <path {...p} fill={teinte.ombre} d="M 249 108 C 251 82 245 66 232 58 L 230 84 C 237 90 242 98 243 112 Z" />
          <ellipse cx={184} cy={52} rx={18} ry={6} fill="#FFFFFF" opacity={0.35} transform="rotate(-12 184 52)" />
        </g>
      );
    case 'chignon':
      return (
        <g>
          <path {...p} fill={teinte.base} d="M 150 104 C 142 56 170 32 200 32 C 232 32 258 56 250 104 C 246 82 238 66 222 60 C 208 66 192 66 178 60 C 164 66 155 82 150 104 Z" />
          <path d="M 224 36 C 246 46 256 70 250 104 C 246 82 238 66 222 60 Z" fill={teinte.ombre} />
          <path d="M 172 50 Q 196 38 226 44 M 164 66 Q 176 52 196 50" fill="none" stroke={teinte.clair} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      );
    case 'long':
      return (
        <g>
          {/* mèches qui tombent devant les oreilles jusqu'à la mâchoire */}
          <path {...p} fill={teinte.base} d="M 153 92 C 144 126 146 160 158 196 L 170 192 C 162 160 160 128 164 98 Z" />
          <path {...p} fill={teinte.ombre} d="M 247 92 C 256 126 254 160 242 196 L 230 192 C 238 160 240 128 236 98 Z" />
          {/* frange balayée sur le côté, raie à gauche */}
          <path {...p} fill={teinte.base} d="M 151 106 C 144 58 170 28 204 28 C 240 28 260 56 250 106 C 246 84 238 68 222 60 C 206 70 182 78 162 80 C 157 88 153 96 151 106 Z" />
          <path d="M 222 34 C 246 44 258 70 250 106 C 246 84 238 68 222 60 Z" fill={teinte.ombre} />
          <path d="M 176 38 Q 200 30 230 40 M 166 56 Q 188 46 214 52 M 170 70 Q 194 64 220 58" fill="none" stroke={teinte.clair} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case 'boucle':
      return (
        <g>
          {[160, 176, 192, 208, 224, 240].map((x, i) => (
            <circle key={x} cx={x} cy={52 + Math.abs(i - 2.5) * 4} r={14} fill={x > 205 ? teinte.ombre : teinte.base} {...p} />
          ))}
          <circle cx={170} cy={44} r={4} fill={teinte.clair} opacity={0.7} />
          <circle cx={194} cy={40} r={4} fill={teinte.clair} opacity={0.7} />
        </g>
      );
  }
};

/** Masse arrière des cheveux longs, dessinée derrière le cou et le torse. */
export const CheveuxDos: React.FC<{ apparence: Apparence }> = ({ apparence }) => {
  if (apparence.cheveux.style !== 'long') return null;
  const { teinte } = apparence.cheveux;
  return (
    <g>
      <path
        d="M 150 92 C 138 40 168 20 200 20 C 238 20 266 44 252 96 C 262 150 272 214 266 268 Q 250 280 236 270 Q 220 284 200 274 Q 180 284 164 270 Q 150 280 134 268 C 128 214 138 150 150 92 Z"
        fill={teinte.base} stroke={CONTOUR} strokeWidth={TRAIT - 1} strokeLinejoin="round"
      />
      <path d="M 226 26 C 254 40 266 66 252 96 C 262 150 272 214 266 268 Q 250 280 236 270 Q 242 200 232 140 Q 226 80 226 26 Z" fill={teinte.ombre} />
      <path d="M 146 150 Q 142 200 150 250 M 160 170 Q 156 214 166 256" fill="none" stroke={teinte.clair} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

export const Visage: React.FC<Props> = ({ apparence, expression, clignement, ouverture, lunettesSoleil }) => {
  const { peau } = apparence;
  const femme = apparence.visage === 'femme';
  const r = REGLAGES[expression];
  const clipTete = useIdUnique('tete');
  const sourcil = apparence.cheveux.style === 'degarni' ? '#7A7A7A' : apparence.cheveux.style === 'chignon' ? '#9A9088' : apparence.cheveux.teinte.base;
  const tete = TETE[apparence.visage];
  return (
    <g>
      <Cheveux apparence={apparence} devant={false} />
      {/* oreilles */}
      <path d="M 155 94 C 140 88 138 118 153 126 Z" fill={peau.base} stroke={CONTOUR} strokeWidth={TRAIT - 1} strokeLinejoin="round" />
      <path d="M 245 94 C 260 88 262 118 247 126 Z" fill={peau.ombre} stroke={CONTOUR} strokeWidth={TRAIT - 1} strokeLinejoin="round" />
      <path d="M 151 100 Q 146 108 151 118" fill="none" stroke={peau.ombre} strokeWidth={2} />
      {apparence.bouclesOreilles && (
        <g fill="none" stroke="#E8B930" strokeWidth={3}>
          <circle cx={148} cy={132} r={7} />
          <circle cx={252} cy={132} r={7} />
        </g>
      )}
      {/* tête et ombrage en aplats (lumière en haut à gauche) */}
      <clipPath id={clipTete}><path d={tete} /></clipPath>
      <path d={tete} fill={peau.base} />
      <g clipPath={`url(#${clipTete})`}>
        <path d="M 226 40 C 244 52 252 72 250 94 L 248 116 C 246 134 238 146 226 156 L 210 166 L 198 166 Q 218 152 226 132 Q 234 110 230 86 Q 228 62 226 40 Z" fill={peau.ombre} />
        <path d="M 168 56 Q 184 46 204 46 Q 186 54 176 70 Z" fill={peau.clair} />
        <path d="M 164 108 Q 170 118 180 120 Q 170 124 162 118 Z" fill={peau.clair} />
        <path d="M 166 90 Q 181 84 194 92 M 206 92 Q 219 84 234 90" fill="none" stroke={peau.ombre} strokeWidth={3} opacity={0.6} />
        {apparence.barbe && (
          <g fill="#2A1E18" opacity={0.22}>
            <path d="M 152 116 C 158 140 176 160 200 168 C 224 160 242 140 248 116 C 238 130 226 136 214 134 Q 200 130 186 134 C 174 136 162 130 152 116 Z" />
            <path d="M 185 130 Q 200 125 215 130 L 214 135 Q 200 131 186 135 Z" />
          </g>
        )}
      </g>
      <path d={tete} fill="none" stroke={CONTOUR} strokeWidth={TRAIT} strokeLinejoin="round" />
      {/* nez */}
      <path d="M 203 100 Q 211 114 209 124 L 202 125 Z" fill={peau.ombre} />
      <path d="M 196 100 L 194 116" fill="none" stroke={peau.ombre} strokeWidth={2} strokeLinecap="round" />
      <path d="M 190 122 Q 193 128 200 127 Q 207 128 210 122" fill="none" stroke={CONTOUR} strokeWidth={TRAIT_FIN} strokeLinecap="round" />
      {!femme && <path d="M 186 124 Q 181 132 184 140 M 214 124 Q 219 132 216 140" fill="none" stroke={peau.ombre} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />}
      <Cheveux apparence={apparence} devant />
      <Oeil cx={181} cote={-1} ouvert={r.yeux * (1 - clignement)} pente={r.pente} femme={femme} peauOmbre={peau.ombre} />
      <Oeil cx={219} cote={1} ouvert={(r.oeilG ?? r.yeux) * (1 - clignement)} pente={r.pente} femme={femme} peauOmbre={peau.ombre} />
      <Sourcil cote={-1} decalage={r.sourcilD} femme={femme} couleur={sourcil} />
      <Sourcil cote={1} decalage={r.sourcilG} femme={femme} couleur={sourcil} />
      {apparence.moustache && (
        <path d="M 180 134 Q 190 124 200 130 Q 210 124 220 134 Q 212 136 200 133 Q 188 136 180 134 Z" fill="#8E8E8E" stroke={CONTOUR} strokeWidth={2} />
      )}
      <Bouche expression={expression} ouverture={ouverture} femme={femme} ombre={peau.ombre} />
      {expression === 'colere' && <path d="M 194 72 L 198 80 M 206 72 L 202 80" stroke={peau.ombre} strokeWidth={2.2} strokeLinecap="round" />}
      {apparence.lunettes && !lunettesSoleil && (
        <g fill="none" stroke="#2A2A30" strokeWidth={3}>
          <rect x={164} y={86} width={33} height={23} rx={9} fill="#FFFFFF" fillOpacity={0.08} />
          <rect x={203} y={86} width={33} height={23} rx={9} fill="#FFFFFF" fillOpacity={0.08} />
          <path d="M 197 95 Q 200 92 203 95 M 164 94 L 153 92 M 236 94 L 247 92" />
          <path d="M 170 90 L 176 90 M 209 90 L 215 90" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={2} />
        </g>
      )}
      {lunettesSoleil && (
        <g>
          <path d="M 162 88 L 197 88 Q 198 104 186 110 Q 170 112 164 102 Z M 203 88 L 238 88 L 236 102 Q 230 112 214 110 Q 202 104 203 88 Z" fill="#141418" stroke={CONTOUR} strokeWidth={3} strokeLinejoin="round" />
          <path d="M 197 91 Q 200 88 203 91 M 162 90 L 152 92 M 238 90 L 248 92" stroke={CONTOUR} strokeWidth={3} fill="none" />
          <path d="M 168 92 L 182 92 L 170 104 Z M 208 92 L 222 92 L 210 104 Z" fill="#7FB3FF" opacity={0.35} />
        </g>
      )}
      {expression === 'choque' && (
        <path d="M 250 60 Q 260 78 255 86 Q 247 91 243 81 Q 243 72 250 60 Z" fill="#8FD0FF" stroke={CONTOUR} strokeWidth={2.5} />
      )}
    </g>
  );
};
