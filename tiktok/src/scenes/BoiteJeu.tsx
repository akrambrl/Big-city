// Boîte de jeu vidéo générique, dessinée en code (pas de jaquette officielle : droits d'auteur).
// Le titre est écrit en texte simple. `image` permet d'afficher ta propre image (dans public/)
// à la place de l'illustration — à toi de vérifier que tu as le droit de l'utiliser.
import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, POLICE_TEXTE, POLICE_TITRE } from '../theme';

export type ObjetBoite = {
  type: 'boite_jeu';
  titre: string;
  sousTitre?: string;
  /** Image facultative (chemin dans public/), affichée sur la face avant. */
  image?: string;
  /** Tampon qui s'écrase sur la boîte au mot déclencheur, ex. « JAMAIS REÇU ». */
  tampon?: string;
};

const L = 340; // largeur du boîtier en px
const H = 430;

const Illustration: React.FC = () => (
  <svg viewBox="0 0 300 380" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <linearGradient id="ciel-boite" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2A0F4F" />
        <stop offset="0.45" stopColor="#C2366B" />
        <stop offset="0.8" stopColor="#FF8C42" />
        <stop offset="1" stopColor="#FFC46B" />
      </linearGradient>
    </defs>
    <rect width="300" height="380" fill="url(#ciel-boite)" />
    <circle cx="190" cy="250" r="70" fill="#FFD27A" />
    {[0, 1, 2].map((i) => <rect key={i} x="110" y={262 + i * 16} width="160" height={4 + i * 2} fill="#E8436B" />)}
    {/* ville au loin */}
    <path d="M 0 320 L 0 270 L 30 270 L 30 240 L 55 240 L 55 280 L 80 280 L 80 255 L 105 255 L 105 320 Z M 200 320 L 200 285 L 230 285 L 230 250 L 255 250 L 255 275 L 300 275 L 300 320 Z" fill="#3A1D4A" />
    {/* palmiers */}
    {[[40, 1], [262, -1]].map(([x, s]) => (
      <g key={x} transform={`translate(${x} 330) scale(${s} 1)`} fill="#1B0E24">
        <path d="M -4 0 Q 4 -90 16 -170 L 22 -168 Q 10 -90 4 0 Z" />
        {[-60, -25, 10, 45, 80].map((a, i) => (
          <path key={i} d="M 19 -170 Q 50 -185 85 -160 Q 50 -172 19 -166 Z" transform={`rotate(${a} 19 -170)`} />
        ))}
      </g>
    ))}
    <rect y="320" width="300" height="60" fill="#1B0E24" />
  </svg>
);

export const BoiteJeu: React.FC<{ objet: ObjetBoite; declencheur: number }> = ({ objet, declencheur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // la boîte tombe du haut de l'écran avec un rebond, puis flotte légèrement
  const chute = spring({ frame: frame - 6, fps, config: { damping: 11, mass: 0.8, stiffness: 140 } });
  const flotte = Math.sin(frame / 14) * 8;
  const rotation = interpolate(chute, [0, 1], [-35, -8]) + Math.sin(frame / 20) * 2;
  const tampon = spring({ frame: frame - declencheur, fps, config: { damping: 9, mass: 0.5, stiffness: 220 } });
  return (
    <div
      style={{
        position: 'relative', width: L, height: H,
        transform: `translateY(${(1 - chute) * -1300 + flotte}px) rotate(${rotation}deg)`,
      }}
    >
      {/* ombre portée dure */}
      <div style={{ position: 'absolute', inset: 0, transform: 'translate(16px, 16px)', background: C.noir, borderRadius: 18 }} />
      {/* boîtier */}
      <div style={{ position: 'absolute', inset: 0, background: '#1E2A44', border: `7px solid ${C.noir}`, borderRadius: 18, overflow: 'hidden' }}>
        {/* bandeau du haut (générique, sans logo de console) */}
        <div style={{ height: 52, background: '#2D6CDF', borderBottom: `5px solid ${C.noir}`, display: 'flex', alignItems: 'center', paddingLeft: 18 }}>
          <span style={{ fontFamily: POLICE_TEXTE, fontWeight: 900, fontSize: 24, color: C.blanc, letterSpacing: 2 }}>JEU VIDÉO</span>
        </div>
        <div style={{ position: 'absolute', top: 57, left: 0, right: 0, bottom: 0 }}>
          {objet.image ? (
            <Img src={staticFile(objet.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Illustration />
          )}
          {/* titre en texte simple */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center' }}>
            <div style={{ fontFamily: POLICE_TITRE, fontSize: 104, lineHeight: 1, color: C.blanc, WebkitTextStroke: `5px ${C.noir}`, paintOrder: 'stroke fill', textShadow: `6px 6px 0 ${C.noir}` }}>
              {objet.titre}
            </div>
            {objet.sousTitre && (
              <div style={{ fontFamily: POLICE_TEXTE, fontWeight: 800, fontSize: 22, color: C.blanc, textTransform: 'uppercase', letterSpacing: 2, marginTop: 6, textShadow: `2px 2px 0 ${C.noir}` }}>
                {objet.sousTitre}
              </div>
            )}
          </div>
        </div>
        {/* reflet sur le plastique */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 30, width: 40, background: 'rgba(255,255,255,0.12)', transform: 'skewX(-12deg)' }} />
      </div>
      {/* tampon « JAMAIS REÇU » */}
      {objet.tampon && frame >= declencheur && (
        <div
          style={{
            position: 'absolute', left: '50%', top: '34%',
            transform: `translate(-50%, -50%) rotate(-16deg) scale(${interpolate(tampon, [0, 1], [3, 1])})`,
            opacity: Math.min(1, tampon * 2),
            border: `9px solid ${C.rouge}`, borderRadius: 14, padding: '6px 18px',
            fontFamily: POLICE_TITRE, fontSize: 64, color: C.rouge, whiteSpace: 'nowrap',
            background: 'rgba(255,255,255,0.9)', boxShadow: `6px 6px 0 ${C.noir}`,
          }}
        >
          {objet.tampon}
        </div>
      )}
    </div>
  );
};
