// Les 5 types de scènes. Chaque scène est autonome : décor + personnage + animation principale
// déclenchée à l'image `declencheur` (calée sur la voix off à l'étape 3).
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Decor } from '../decors/Decors';
import { C, POLICE_TEXTE, POLICE_TITRE, texteAffiche } from '../theme';
import { Bandeau, LignesVitesse, PersonnageEnScene, TexteSurligne, usePop } from './elements';
import type { SceneData, TypeScene } from './types';

// Moment par défaut de l'animation principale si la voix ne le fixe pas (en images)
export const DECLENCHEUR_DEFAUT: Record<TypeScene, number> = { accroche: 4, montant: 30, document: 30, explication: 20, cta: 40 };

const pseudo = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return x - Math.floor(x);
};

/** Secousse de caméra pendant quelques images après `debut`. */
const useSecousse = (debut: number, duree = 10, amplitude = 14) => {
  const frame = useCurrentFrame();
  const t = frame - debut;
  if (t < 0 || t > duree) return 'none';
  const a = amplitude * (1 - t / duree);
  return `translate(${(pseudo(t) - 0.5) * 2 * a}px, ${(pseudo(t + 50) - 0.5) * 2 * a}px)`;
};

/** Flash blanc bref (impact). */
const Flash: React.FC<{ debut: number; force?: number }> = ({ debut, force = 0.7 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - debut, [0, 1, 7], [0, force, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return o > 0 ? <AbsoluteFill style={{ background: '#FFFFFF', opacity: o }} /> : null;
};

/** Gerbe d'éléments (pièces, cœurs) qui jaillissent d'un point. */
const Gerbe: React.FC<{ x: number; y: number; debut: number; nombre?: number; forme: 'piece' | 'coeur' }> = ({ x, y, debut, nombre = 16, forme }) => {
  const frame = useCurrentFrame();
  const t = (frame - debut) / 30;
  if (t < 0 || t > 1.6) return null;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: nombre }, (_, i) => {
        const a = -Math.PI / 2 + (pseudo(i) - 0.5) * Math.PI * 1.3;
        const v = 900 + pseudo(i + 9) * 700;
        const px = x + Math.cos(a) * v * t;
        const py = y + Math.sin(a) * v * t + 1400 * t * t;
        const r = forme === 'piece' ? 30 + pseudo(i + 3) * 14 : 34;
        const rot = t * 400 * (pseudo(i + 5) - 0.5);
        return (
          <g key={i} transform={`translate(${px} ${py}) rotate(${rot})`} opacity={Math.min(1, (1.6 - t) * 2)}>
            {forme === 'piece' ? (
              <g>
                <ellipse rx={r} ry={r * (0.6 + 0.4 * Math.abs(Math.cos(t * 8 + i)))} fill="#FFC928" stroke={C.noir} strokeWidth={5} />
                <text y={r * 0.35} textAnchor="middle" fontFamily={POLICE_TITRE} fontSize={r} fill="#B8860B">€</text>
              </g>
            ) : (
              <path d="M 0 22 C -40 -6 -24 -38 0 -18 C 24 -38 40 -6 0 22 Z" transform={`scale(${r / 22})`} fill={C.rouge} stroke={C.noir} strokeWidth={4} />
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// ACCROCHE : bandeau jaune en haut, personnage en réaction
// ---------------------------------------------------------------------------
const Accroche: React.FC<{ s: SceneData; d: number }> = ({ s, d }) => {
  const frame = useCurrentFrame();
  const secousse = useSecousse(d + 6, 12, 18);
  const sousTitre = usePop(d + 14);
  return (
    <AbsoluteFill style={{ transform: secousse }}>
      <Decor nom={s.decor} assombrir={0.3} />
      <LignesVitesse opacite={interpolate(frame, [d, d + 8], [0, 0.22], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} couleur={C.jaune} />
      <PersonnageEnScene p={s.personnage} x={540} hauteur={1220} declencheur={d} mots={s.mots} />
      <div style={{ position: 'absolute', top: 210, width: '100%', textAlign: 'center', padding: '0 50px' }}>
        <Bandeau texte={s.titre ?? ''} taille={170} debut={d} />
      </div>
      {s.texte && (
        <div style={{ position: 'absolute', top: 470, width: '100%', textAlign: 'center', padding: '0 70px', transform: `scale(${sousTitre})` }}>
          <span style={{ ...texteAffiche(78, C.blanc), textTransform: 'none' }}>{s.texte.replace(/\*\*/g, '')}</span>
        </div>
      )}
      <Flash debut={d + 5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// MONTANT : ancien montant barré en rouge -> flèche -> nouveau montant en vert (pop)
// ---------------------------------------------------------------------------
const Montant: React.FC<{ s: SceneData; d: number }> = ({ s, d }) => {
  const frame = useCurrentFrame();
  const m = s.montant ?? { ancien: '', nouveau: '' };
  const carte = usePop(2);
  const barre = interpolate(frame, [d - 18, d - 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fleche = interpolate(frame, [d - 8, d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const nouveau = usePop(d, { damping: 8, mass: 0.6, stiffness: 200 });
  const secousse = useSecousse(d, 8, 10);
  const pulse = 1 + 0.03 * Math.sin(Math.max(0, frame - d - 15) / 5);
  const ajuste = (txt: string, max: number) => Math.min(max, 540 / (Math.max(1, txt.length) * 0.46));
  return (
    <AbsoluteFill style={{ transform: secousse }}>
      <Decor nom={s.decor} assombrir={0.15} />
      <PersonnageEnScene p={s.personnage} x={250} hauteur={1180} declencheur={d} mots={s.mots} entree="gauche" />
      <div
        style={{
          position: 'absolute', top: 150, right: 50, width: 640,
          background: C.papier, border: `8px solid ${C.noir}`, boxShadow: `16px 16px 0 ${C.noir}`,
          borderRadius: 28, padding: '40px 30px 50px', textAlign: 'center',
          transform: `rotate(2deg) scale(${carte})`, transformOrigin: 'top right',
        }}
      >
        <div style={{ position: 'relative', display: 'inline-block', fontFamily: POLICE_TITRE, fontSize: ajuste(m.ancien, 140), color: C.rouge, lineHeight: 1, whiteSpace: 'nowrap' }}>
          {m.ancien}
          <div style={{ position: 'absolute', left: -14, top: '50%', height: 16, width: `calc(${barre * 100}% + 28px)`, background: C.rouge, border: `3px solid ${C.noir}`, transform: 'rotate(-8deg)' }} />
        </div>
        <svg viewBox="0 0 100 120" width={120} height={140} style={{ display: 'block', margin: '10px auto', opacity: fleche, transform: `translateY(${(1 - fleche) * -40}px)` }}>
          <path d="M 35 0 L 65 0 L 65 60 L 92 60 L 50 115 L 8 60 L 35 60 Z" fill={C.jaune} stroke={C.noir} strokeWidth={7} strokeLinejoin="round" />
        </svg>
        <div style={{ display: 'inline-block', whiteSpace: 'nowrap', transform: `scale(${nouveau * pulse})`, ...texteAffiche(ajuste(m.nouveau, 190), C.vert) }}>{m.nouveau}</div>
        {m.legende && (
          <div style={{ marginTop: 26, opacity: nouveau }}>
            <span style={{ background: C.noir, color: C.blanc, fontFamily: POLICE_TEXTE, fontWeight: 900, fontSize: 46, padding: '10px 24px', borderRadius: 14, textTransform: 'uppercase' }}>
              {m.legende}
            </span>
          </div>
        )}
      </div>
      <Gerbe x={720} y={720} debut={d} forme="piece" nombre={18} />
      <Flash debut={d} force={0.4} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// DOCUMENT : un papier apparaît, une ligne est surlignée au déclencheur
// ---------------------------------------------------------------------------
const ICONES_DOC: Record<string, { etiquette: string; couleur: string }> = {
  courrier: { etiquette: 'Courrier', couleur: '#3D7DD8' },
  bail: { etiquette: 'Bail', couleur: '#8E5BD8' },
  fiche_paie: { etiquette: 'Fiche de paie', couleur: '#2BB673' },
  facture: { etiquette: 'Facture', couleur: '#F2A12C' },
};

const Document: React.FC<{ s: SceneData; d: number }> = ({ s, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const doc = s.document ?? { type: 'courrier', titre: '', lignes: [], surligne: 0 };
  const icone = ICONES_DOC[doc.type];
  const entree = spring({ frame, fps, config: { damping: 15, mass: 0.8 } });
  const marqueur = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zoom = 1 + 0.07 * spring({ frame: frame - d, fps, config: { damping: 20 } });
  const yLigne = 330 + doc.surligne * 74;
  return (
    <AbsoluteFill>
      <Decor nom={s.decor} assombrir={0.25} flou={3} />
      <div
        style={{
          position: 'absolute', top: 130, left: 110, width: 860, height: 920,
          background: C.papier, border: `7px solid ${C.noir}`, boxShadow: `18px 18px 0 ${C.noir}`,
          padding: '46px 56px',
          transform: `translateX(${(1 - entree) * 1100}px) rotate(${2 - entree * 1}deg) scale(${zoom})`,
          transformOrigin: `50% ${yLigne}px`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ background: icone.couleur, color: C.blanc, border: `4px solid ${C.noir}`, fontFamily: POLICE_TEXTE, fontWeight: 900, fontSize: 30, padding: '6px 16px', borderRadius: 10, textTransform: 'uppercase' }}>
            {icone.etiquette}
          </span>
          <div style={{ width: 160, height: 14, background: '#D9D2C3', borderRadius: 7 }} />
        </div>
        <div style={{ fontFamily: POLICE_TEXTE, fontWeight: 900, fontSize: 52, color: C.noir, marginTop: 34, textTransform: 'uppercase', lineHeight: 1.1 }}>{doc.titre}</div>
        <div style={{ height: 6, width: 140, background: C.noir, margin: '18px 0 26px' }} />
        {doc.lignes.map((l, i) => (
          <div key={i} style={{ position: 'relative', fontFamily: POLICE_TEXTE, fontWeight: i === doc.surligne ? 800 : 600, fontSize: 36, lineHeight: '74px', color: '#2A2630', whiteSpace: 'nowrap', overflow: 'visible' }}>
            {i === doc.surligne && (
              <div style={{ position: 'absolute', left: -12, top: 10, bottom: 8, width: `calc(${marqueur * 100}% + 24px)`, background: C.jaune, opacity: 0.85, transform: 'skewX(-8deg)', zIndex: 0 }} />
            )}
            <span style={{ position: 'relative' }}>{l}</span>
          </div>
        ))}
        {/* lignes de remplissage pour faire « vrai document » */}
        {[0, 1].map((i) => <div key={i} style={{ height: 14, width: `${70 - i * 20}%`, background: '#E4DDCE', borderRadius: 7, marginTop: 28 }} />)}
      </div>
      <PersonnageEnScene p={s.personnage} x={180} hauteur={880} declencheur={d} mots={s.mots} entree="gauche" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// EXPLICATION : personnage + texte clé à l'écran (mots surlignés)
// ---------------------------------------------------------------------------
const Explication: React.FC<{ s: SceneData; d: number }> = ({ s, d }) => {
  const carte = usePop(2);
  const accent = usePop(d, { damping: 9, mass: 0.5, stiffness: 220 });
  return (
    <AbsoluteFill>
      <Decor nom={s.decor} assombrir={0.1} />
      <PersonnageEnScene p={s.personnage} x={s.secondaire ? 300 : 360} hauteur={1150} declencheur={d} mots={s.mots} entree="gauche" />
      {s.secondaire && <PersonnageEnScene p={s.secondaire} x={800} hauteur={1120} declencheur={d} parle={false} miroir graine={7} entree="droite" />}
      <div
        style={{
          position: 'absolute', top: 130, left: 60, right: 60,
          background: C.blanc, border: `8px solid ${C.noir}`, boxShadow: `16px 16px 0 ${C.noir}`, borderRadius: 26,
          padding: '40px 44px', transform: `rotate(-1.5deg) scale(${carte * (1 + 0.04 * (accent > 0.01 && accent < 1 ? Math.sin(accent * Math.PI) : 0))})`,
        }}
      >
        <TexteSurligne texte={s.texte ?? ''} taille={60} debut={6} cadence={2} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// CTA : « Abonne-toi pour ne plus te faire avoir » + bouton qui se fait cliquer
// ---------------------------------------------------------------------------
const Cta: React.FC<{ s: SceneData; d: number }> = ({ s, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bouton = usePop(10);
  const clic = spring({ frame: frame - d, fps, config: { damping: 10, mass: 0.5, stiffness: 240 } });
  const abonne = frame >= d;
  // curseur qui arrive sur le bouton puis appuie
  const curseur = interpolate(frame, [d - 20, d - 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const appui = interpolate(frame - d, [-3, 0, 5], [1, 0.85, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Decor nom={s.decor} assombrir={0.4} />
      <LignesVitesse opacite={0.12} couleur={C.jaune} />
      <PersonnageEnScene p={s.personnage} x={540} hauteur={1100} declencheur={d} mots={s.mots} />
      <div style={{ position: 'absolute', top: 190, width: '100%', textAlign: 'center' }}>
        <Bandeau texte={s.titre ?? 'Abonne-toi'} taille={170} debut={0} />
      </div>
      <div style={{ position: 'absolute', top: 440, width: '100%', textAlign: 'center', padding: '0 60px', transform: `scale(${usePop(6)})` }}>
        <span style={{ ...texteAffiche(76, C.blanc), textTransform: 'none' }}>{(s.texte ?? 'pour ne plus te faire avoir').replace(/\*\*/g, '')}</span>
      </div>
      <div style={{ position: 'absolute', top: 640, width: '100%', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 20,
            background: abonne ? '#3A3A44' : C.rouge, color: C.blanc,
            border: `7px solid ${C.noir}`, boxShadow: `10px 10px 0 ${C.noir}`, borderRadius: 999,
            fontFamily: POLICE_TEXTE, fontWeight: 900, fontSize: 70, padding: '22px 60px',
            transform: `scale(${bouton * appui * (abonne ? 1 + 0.12 * Math.sin(Math.min(1, clic) * Math.PI) : 1)})`,
          }}
        >
          {abonne ? 'Abonné ✓' : "S'abonner"}
        </div>
      </div>
      {/* curseur (main) */}
      <svg viewBox="0 0 60 80" width={110} height={146} style={{ position: 'absolute', left: interpolate(curseur, [0, 1], [1000, 640]), top: interpolate(curseur, [0, 1], [1100, 700]), opacity: curseur > 0 && frame < d + 25 ? 1 : 0, transform: `scale(${appui})` }}>
        <path d="M 20 4 Q 28 0 30 8 L 30 34 L 44 32 Q 54 32 54 44 L 52 66 Q 50 76 40 76 L 22 76 Q 14 76 10 68 L 2 48 Q 0 40 8 40 L 14 46 L 14 10 Q 14 4 20 4 Z" fill={C.blanc} stroke={C.noir} strokeWidth={4} strokeLinejoin="round" />
      </svg>
      <Gerbe x={540} y={720} debut={d} forme="coeur" nombre={14} />
    </AbsoluteFill>
  );
};

const COMPOSANTS: Record<TypeScene, React.FC<{ s: SceneData; d: number }>> = {
  accroche: Accroche,
  montant: Montant,
  document: Document,
  explication: Explication,
  cta: Cta,
};

/** Affiche n'importe quelle scène à partir de sa description. */
export const Scene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const Composant = COMPOSANTS[scene.type];
  return <Composant s={scene} d={scene.declencheur ?? DECLENCHEUR_DEFAUT[scene.type]} />;
};
