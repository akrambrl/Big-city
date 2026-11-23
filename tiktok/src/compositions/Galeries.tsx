// Étape 1 : planches de contrôle du personnage (expressions, poses, personnages secondaires)
// et une démo animée. Visibles dans `npx remotion studio`.
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Anton';
import { Personnage } from '../personnage/Personnage';
import { APPARENCES } from '../personnage/variantes';
import { EXPRESSIONS, POSES, VARIANTES, type Expression, type Pose, type Variante } from '../personnage/types';


// Police d'affiche (Google Fonts, licence OFL : gratuite, usage commercial autorisé)
const { fontFamily: ANTON } = loadFont();

// Ambiance « affiche de jeu » : ciel de coucher de soleil + trame de points
export const FOND = 'linear-gradient(180deg, #1B1035 0%, #5B1E5E 30%, #D6336C 62%, #FF9A3C 88%, #FFD36B 100%)';
const TRAME = 'radial-gradient(rgba(0,0,0,0.18) 1.6px, transparent 1.8px)';

const Etiquette: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: ANTON, fontSize: 44, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1, WebkitTextStroke: '2px #121014', textShadow: '4px 4px 0 #121014', marginTop: 2 }}>
    {children}
  </div>
);

const Grille: React.FC<{ titre: string; children: React.ReactNode; colonnes: number }> = ({ titre, children, colonnes }) => (
  <AbsoluteFill style={{ background: FOND, padding: 40 }}>
    <AbsoluteFill style={{ backgroundImage: TRAME, backgroundSize: '14px 14px', opacity: 0.5 }} />
    <div style={{ position: 'relative', fontFamily: ANTON, fontSize: 96, color: '#FFE600', textAlign: 'center', textTransform: 'uppercase', WebkitTextStroke: '4px #121014', textShadow: '7px 7px 0 #121014', marginBottom: 10, transform: 'rotate(-2deg)' }}>
      {titre}
    </div>
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${colonnes}, 1fr)`, rowGap: 6, justifyItems: 'center' }}>{children}</div>
  </AbsoluteFill>
);

export const GalerieExpressions: React.FC<{ variante?: Variante }> = ({ variante = 'heros' }) => (
  <Grille titre={`Expressions · ${APPARENCES[variante].nom}`} colonnes={3}>
    {EXPRESSIONS.map((e, i) => (
      <div key={e} style={{ textAlign: 'center' }}>
        <Personnage variante={variante} expression={e} hauteur={700} graine={i + 1} />
        <Etiquette>{e}</Etiquette>
      </div>
    ))}
  </Grille>
);

export const GaleriePoses: React.FC<{ variante?: Variante }> = ({ variante = 'heros' }) => (
  <Grille titre={`Poses · ${APPARENCES[variante].nom}`} colonnes={3}>
    {POSES.map((p, i) => (
      <div key={p} style={{ textAlign: 'center' }}>
        <Personnage variante={variante} pose={p} expression={p === 'bras_leves' ? 'content' : p === 'mains_hanches' ? 'colere' : p === 'pointe_doigt' ? 'malin' : 'neutre'} hauteur={700} graine={i + 3} />
        <Etiquette>{p}</Etiquette>
      </div>
    ))}
  </Grille>
);

export const GaleriePersonnages: React.FC = () => (
  <Grille titre="Personnages" colonnes={3}>
    {VARIANTES.map((v, i) => (
      <div key={v} style={{ textAlign: 'center' }}>
        <Personnage variante={v} hauteur={660} graine={i * 2 + 1} expression={(['content', 'content', 'malin', 'colere', 'neutre'] as Expression[])[i]} />
        <Etiquette>{APPARENCES[v].nom}</Etiquette>
      </div>
    ))}
  </Grille>
);

// Démo animée : enchaîne expressions et poses avec des transitions douces
const SEQUENCE: { expression: Expression; pose: Pose; parle: boolean }[] = [
  { expression: 'neutre', pose: 'debout', parle: true },
  { expression: 'choque', pose: 'bras_leves', parle: false },
  { expression: 'colere', pose: 'mains_hanches', parle: true },
  { expression: 'triste', pose: 'debout', parle: true },
  { expression: 'malin', pose: 'telephone', parle: true },
  { expression: 'content', pose: 'pointe_doigt', parle: true },
];
export const DUREE_PLAN = 45; // 1,5 s par expression

export const DemoPersonnage: React.FC<{ variante?: Variante }> = ({ variante = 'heros' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = Math.min(SEQUENCE.length - 1, Math.floor(frame / DUREE_PLAN));
  const plan = SEQUENCE[i];
  const precedent = SEQUENCE[Math.max(0, i - 1)];
  const local = frame - i * DUREE_PLAN;
  const transition = i === 0 ? 1 : spring({ frame: local, fps, config: { damping: 14, mass: 0.6 } });
  const sursaut = interpolate(local, [0, 4, 10], [1, 1.04, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: FOND, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 140 }}>
      <AbsoluteFill style={{ backgroundImage: TRAME, backgroundSize: '14px 14px', opacity: 0.5 }} />
      <div style={{ position: 'absolute', top: 120 }}>
        <Etiquette>{plan.expression} · {plan.pose}</Etiquette>
      </div>
      <div style={{ transform: `scale(${sursaut})`, transformOrigin: 'bottom center' }}>
        <Personnage variante={variante} expression={plan.expression} pose={plan.pose} posePrecedente={precedent.pose} transition={transition} parle={plan.parle} hauteur={1500} />
      </div>
    </AbsoluteFill>
  );
};

export const GalerieDemoDuree = SEQUENCE.length * DUREE_PLAN;
