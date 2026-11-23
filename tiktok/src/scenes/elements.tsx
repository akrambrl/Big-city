// Briques visuelles partagées par les scènes : personnage posé dans le décor, bandeau,
// texte avec mots surlignés, effet « pop ».
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Personnage } from '../personnage/Personnage';
import { C, POLICE_TEXTE, texteAffiche } from '../theme';
import type { MotDate, PersonnageScene } from './types';

/** Échelle d'apparition avec rebond, démarrant à l'image `debut`. */
export const usePop = (debut: number, config = { damping: 11, mass: 0.7, stiffness: 160 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - debut, fps, config });
};

/**
 * Ouverture de la bouche à partir des mots de la voix off : ouverte pendant les mots,
 * avec un battement de « syllabes », fermée dans les silences.
 */
export function ouvertureDepuisMots(frame: number, mots?: MotDate[]): number | undefined {
  if (!mots) return undefined;
  const m = mots.find((w) => frame >= w.debut && frame < w.fin);
  if (!m) return 0;
  const syllabe = 0.5 + 0.5 * Math.sin(((frame - m.debut) / 3.4) * Math.PI);
  return 0.25 + 0.75 * Math.abs(syllabe);
}

/** Personnage posé au sol, avec changement d'expression/pose au déclencheur. */
export const PersonnageEnScene: React.FC<{
  p?: PersonnageScene;
  x: number; // centre horizontal en px
  hauteur: number;
  declencheur: number;
  mots?: MotDate[];
  parle?: boolean;
  miroir?: boolean;
  graine?: number;
  entree?: 'gauche' | 'droite' | 'bas';
}> = ({ p, x, hauteur, declencheur, mots, parle = true, miroir, graine = 1, entree = 'bas' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!p) return null;
  const apres = frame >= declencheur;
  const posePrecedente = p.pose ?? 'debout';
  const pose = apres ? p.poseApres ?? posePrecedente : posePrecedente;
  const expression = apres ? p.expressionApres ?? p.expression ?? 'neutre' : p.expression ?? 'neutre';
  const transition = apres && p.poseApres ? spring({ frame: frame - declencheur, fps, config: { damping: 14, mass: 0.6 } }) : 1;
  // entrée en glissant au début de la scène
  const e = spring({ frame, fps, config: { damping: 16, mass: 0.8 } });
  const dx = entree === 'gauche' ? (1 - e) * -700 : entree === 'droite' ? (1 - e) * 700 : 0;
  const dy = entree === 'bas' ? (1 - e) * 300 : 0;
  // petit sursaut au moment de la réaction
  const sursaut = interpolate(frame - declencheur, [0, 4, 12], [1, 1.05, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        left: x - hauteur / 4 + dx,
        top: 1890 - hauteur + dy,
        transform: `scale(${sursaut})`,
        transformOrigin: 'bottom center',
      }}
    >
      <Personnage
        variante={p.variante ?? 'heros'}
        expression={expression}
        pose={pose}
        posePrecedente={p.poseApres && apres ? posePrecedente : undefined}
        transition={transition}
        ouverture={ouvertureDepuisMots(frame, mots)}
        parle={parle}
        hauteur={hauteur}
        miroir={miroir}
        lunettesSoleil={p.lunettesSoleil}
        graine={graine}
      />
    </div>
  );
};

/** Bandeau jaune incliné façon affiche (accroche, CTA). */
export const Bandeau: React.FC<{ texte: string; taille?: number; debut?: number; couleur?: string; texteCouleur?: string; rotation?: number }> = ({
  texte, taille = 150, debut = 0, couleur = C.jaune, texteCouleur = C.noir, rotation = -3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // arrivée « slam » : part de très grand et s'écrase en place
  const k = spring({ frame: frame - debut, fps, config: { damping: 12, mass: 0.6, stiffness: 180 } });
  const echelle = interpolate(k, [0, 1], [2.6, 1]);
  // le texte doit tenir sur une ligne dans ~950 px (une lettre Anton ≈ 0,47 em)
  const tailleAjustee = Math.min(taille, 900 / (Math.max(1, texte.length) * 0.47));
  return (
    <div
      style={{
        display: 'inline-block',
        transform: `rotate(${rotation}deg) scale(${echelle})`,
        opacity: Math.min(1, k * 3),
        background: couleur,
        border: `8px solid ${C.noir}`,
        boxShadow: `14px 14px 0 ${C.noir}`,
        padding: '18px 40px 10px',
        fontFamily: texteAffiche(taille).fontFamily,
        fontSize: tailleAjustee,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        color: texteCouleur,
        textTransform: 'uppercase',
        textAlign: 'center',
      }}
    >
      {texte}
    </div>
  );
};

/**
 * Texte avec mots surlignés : « Le vendeur est **responsable** » -> « responsable » en jaune.
 * Les mots apparaissent un par un à partir de `debut` (1 mot toutes les `cadence` images).
 */
export const TexteSurligne: React.FC<{ texte: string; taille?: number; debut?: number; cadence?: number; couleur?: string }> = ({
  texte, taille = 64, debut = 0, cadence = 2, couleur = C.noir,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const morceaux = texte.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  let i = 0;
  return (
    <div style={{ fontFamily: POLICE_TEXTE, fontWeight: 800, fontSize: taille, lineHeight: 1.25, color: couleur }}>
      {morceaux.map((m, mi) => {
        const fort = m.startsWith('**');
        if (fort) {
          // passage surligné : un seul bloc jaune qui « pop »
          const k = spring({ frame: frame - debut - i++ * cadence, fps, config: { damping: 9, mass: 0.5, stiffness: 200 } });
          return (
            <span
              key={mi}
              style={{
                display: 'inline-block', transform: `rotate(-1.5deg) scale(${0.6 + 0.4 * k})`, opacity: Math.min(1, k * 2),
                background: C.jaune, padding: '0 12px', border: `4px solid ${C.noir}`, boxShadow: `5px 5px 0 ${C.noir}`, margin: '6px 4px',
              }}
            >
              {m.slice(2, -2)}
            </span>
          );
        }
        return m.split(/(\s+)/).map((mot, wi) => {
          if (!mot.trim()) return <span key={`${mi}-${wi}`}>{mot}</span>;
          const k = spring({ frame: frame - debut - i++ * cadence, fps, config: { damping: 14, mass: 0.5 } });
          return (
            <span key={`${mi}-${wi}`} style={{ display: 'inline-block', transform: `translateY(${(1 - k) * 30}px) scale(${0.8 + 0.2 * k})`, opacity: k }}>
              {mot}
            </span>
          );
        });
      })}
    </div>
  );
};

/** Lignes de vitesse qui rayonnent (accroche) */
export const LignesVitesse: React.FC<{ opacite?: number; couleur?: string }> = ({ opacite = 0.35, couleur = '#FFFFFF' }) => {
  const frame = useCurrentFrame();
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: opacite }}>
      <g transform={`rotate(${frame * 0.6} 540 1000)`}>
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const l = i % 2 ? 0.06 : 0.035;
          return (
            <path
              key={i}
              d={`M 540 1000 L ${540 + Math.cos(a - l) * 2200} ${1000 + Math.sin(a - l) * 2200} L ${540 + Math.cos(a + l) * 2200} ${1000 + Math.sin(a + l) * 2200} Z`}
              fill={couleur}
            />
          );
        })}
      </g>
    </svg>
  );
};
