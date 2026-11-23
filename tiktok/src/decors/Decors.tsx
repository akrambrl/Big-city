// Décors SVG en style illustration (aplats, ombres franches, contours noirs).
// Format 1080 x 1920 ; le sol commence vers y = 1480 pour que les personnages y posent les pieds.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C } from '../theme';

export const DECORS = ['rue', 'magasin', 'bureau', 'appartement'] as const;
export type DecorNom = (typeof DECORS)[number];

const N = C.noir;
const T = 6; // épaisseur de contour des décors (un peu plus fine que les personnages au premier plan)

// Pseudo-hasard déterministe (même rendu à chaque fois)
const h = (i: number) => {
  const x = Math.sin(i * 91.7 + 13.3) * 43758.5453;
  return x - Math.floor(x);
};

/** Grille de fenêtres, certaines allumées. */
const Fenetres: React.FC<{ x: number; y: number; cols: number; rangs: number; l: number; ht: number; ex: number; ey: number; graine: number; nuit?: boolean }> = ({
  x, y, cols, rangs, l, ht, ex, ey, graine, nuit,
}) => (
  <g>
    {Array.from({ length: cols * rangs }, (_, i) => {
      const cx = x + (i % cols) * (l + ex), cy = y + Math.floor(i / cols) * (ht + ey);
      const allumee = h(i + graine) > (nuit ? 0.45 : 0.7);
      return (
        <g key={i}>
          <rect x={cx} y={cy} width={l} height={ht} fill={allumee ? '#FFD36B' : '#2B2C4A'} stroke={N} strokeWidth={4} />
          <line x1={cx + l / 2} y1={cy} x2={cx + l / 2} y2={cy + ht} stroke={N} strokeWidth={3} />
          {/* balcon en fer forgé */}
          <rect x={cx - 8} y={cy + ht - 18} width={l + 16} height={18} fill="none" stroke={N} strokeWidth={4} />
        </g>
      );
    })}
  </g>
);

const Plante: React.FC<{ x: number; y: number; k?: number }> = ({ x, y, k = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    {[-50, -20, 10, 40, -35, 25].map((dx, i) => (
      <path key={i} d={`M 0 -60 Q ${dx * 1.4} ${-160 - h(i) * 80} ${dx * 2} ${-200 - h(i + 3) * 60} Q ${dx * 0.1} -150 0 -60 Z`} fill={i % 2 ? '#2E8B57' : '#3FAE6B'} stroke={N} strokeWidth={4} />
    ))}
    <path d="M -55 -70 L 55 -70 L 42 40 L -42 40 Z" fill="#C9673A" stroke={N} strokeWidth={T} strokeLinejoin="round" />
    <path d="M 15 -70 L 55 -70 L 42 40 L 20 40 Z" fill="#9A4A26" />
  </g>
);

/** Ciel de coucher de soleil commun à la rue et aux fenêtres. */
const Ciel: React.FC<{ id: string; y2?: number }> = ({ id, y2 = 1500 }) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2={y2} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#24104A" />
        <stop offset="0.35" stopColor="#7A2468" />
        <stop offset="0.65" stopColor="#E8436B" />
        <stop offset="0.85" stopColor="#FF8C42" />
        <stop offset="1" stopColor="#FFC46B" />
      </linearGradient>
    </defs>
    <rect width={1080} height={y2} fill={`url(#${id})`} />
  </>
);

const Rue: React.FC = () => (
  <g>
    <Ciel id="ciel-rue" />
    {/* soleil rayé façon affiche rétro */}
    <circle cx={720} cy={900} r={170} fill="#FFD27A" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={540} y={930 + i * 34} width={360} height={8 + i * 4} fill="#E8436B" />)}
    {/* silhouettes lointaines */}
    <path d="M 0 1100 L 0 900 L 90 900 L 90 840 L 170 840 L 170 960 L 260 960 L 260 880 L 340 880 L 340 1100 Z M 740 1100 L 740 920 L 820 920 L 820 860 L 900 860 L 900 940 L 1000 940 L 1000 880 L 1080 880 L 1080 1100 Z" fill="#4A1D5A" />
    {/* immeubles haussmanniens */}
    <path d="M -10 1480 L -10 360 L 340 360 L 360 330 L 360 1480 Z" fill="#E7B98E" stroke={N} strokeWidth={T} />
    <path d="M 290 360 L 360 330 L 360 1480 L 290 1480 Z" fill="#B9825A" />
    <path d="M -10 360 L 340 360 L 300 280 L 20 280 Z" fill="#4B5A7A" stroke={N} strokeWidth={T} strokeLinejoin="round" />
    <Fenetres x={30} y={420} cols={3} rangs={6} l={62} ht={110} ex={34} ey={58} graine={1} />
    <path d="M 740 1480 L 740 430 L 1090 430 L 1090 1480 Z" fill="#D9A57E" stroke={N} strokeWidth={T} />
    <path d="M 740 430 L 800 430 L 800 1480 L 740 1480 Z" fill="#A9744E" />
    <path d="M 740 430 L 1090 430 L 1060 350 L 770 350 Z" fill="#3E4B68" stroke={N} strokeWidth={T} strokeLinejoin="round" />
    <Fenetres x={830} y={490} cols={3} rangs={5} l={56} ht={105} ex={32} ey={60} graine={7} />
    {/* devanture au rez-de-chaussée */}
    <rect x={760} y={1240} width={330} height={240} fill="#B3202A" stroke={N} strokeWidth={T} />
    <rect x={790} y={1290} width={140} height={190} fill="#FFD36B" stroke={N} strokeWidth={4} />
    {/* lampadaire */}
    <rect x={636} y={900} width={16} height={580} fill="#2A2A30" stroke={N} strokeWidth={4} />
    <path d="M 610 900 L 678 900 L 664 860 L 624 860 Z" fill="#2A2A30" stroke={N} strokeWidth={4} />
    <circle cx={644} cy={915} r={60} fill="#FFE9A6" opacity={0.35} />
    {/* boîte aux lettres jaune */}
    <rect x={430} y={1270} width={110} height={150} rx={14} fill="#FFD21A" stroke={N} strokeWidth={T} />
    <rect x={450} y={1300} width={70} height={12} rx={6} fill={N} />
    <rect x={474} y={1420} width={22} height={60} fill="#2A2A30" stroke={N} strokeWidth={4} />
    {/* trottoir et route */}
    <rect x={-10} y={1480} width={1100} height={120} fill="#B7A9A6" stroke={N} strokeWidth={T} />
    <rect x={-10} y={1480} width={1100} height={22} fill="#D4C8C4" />
    <rect x={-10} y={1600} width={1100} height={330} fill="#3B3644" />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={i * 260 - 40} y={1760} width={150} height={18} fill="#F2E7C9" />)}
  </g>
);

const Magasin: React.FC = () => (
  <g>
    <rect width={1080} height={1500} fill="#F1D3A6" />
    <rect width={1080} height={260} fill="#E0B97F" />
    {/* enseigne promo */}
    <g transform="rotate(-4 540 170)">
      <rect x={300} y={110} width={480} height={130} fill="#E8233A" stroke={N} strokeWidth={T} />
      <text x={540} y={205} textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize={92} fill="#FFFFFF" stroke={N} strokeWidth={3}>PROMO -50%</text>
    </g>
    {/* étagères garnies */}
    {[420, 700, 980].map((y, r) => (
      <g key={y}>
        {Array.from({ length: 7 }, (_, i) => {
          const couleurs = ['#3D7DD8', '#F2A12C', '#E8436B', '#2BB673', '#8E5BD8', '#F2D13A'];
          const hc = 120 + h(i + r * 10) * 90;
          const x = 50 + i * 142;
          return (
            <g key={i}>
              <rect x={x} y={y - hc} width={118} height={hc} fill={couleurs[(i + r) % 6]} stroke={N} strokeWidth={4} />
              <rect x={x + 80} y={y - hc} width={38} height={hc} fill="#000" opacity={0.18} />
              <rect x={x + 18} y={y - hc + 24} width={60} height={22} fill="#FFFFFF" opacity={0.8} />
            </g>
          );
        })}
        <rect x={20} y={y} width={1040} height={28} fill="#8C5A35" stroke={N} strokeWidth={T} />
      </g>
    ))}
    {/* comptoir et caisse */}
    <rect x={560} y={1180} width={540} height={320} fill="#4A5C7A" stroke={N} strokeWidth={T} />
    <rect x={560} y={1180} width={540} height={40} fill="#6E83A6" stroke={N} strokeWidth={T} />
    <path d="M 820 1180 L 820 1080 L 980 1080 L 1000 1180 Z" fill="#2A2A30" stroke={N} strokeWidth={T} strokeLinejoin="round" />
    <rect x={845} y={1100} width={110} height={50} fill="#5FE3B0" stroke={N} strokeWidth={4} />
    {/* sol en damier */}
    <rect x={0} y={1480} width={1080} height={440} fill="#EDE6DA" />
    {Array.from({ length: 6 * 4 }, (_, i) => (
      <rect key={i} x={(i % 6) * 180 + (Math.floor(i / 6) % 2) * 90 - 90} y={1480 + Math.floor(i / 6) * 110} width={90} height={110} fill="#C9BFB0" />
    ))}
    <line x1={0} y1={1480} x2={1080} y2={1480} stroke={N} strokeWidth={T} />
  </g>
);

const Bureau: React.FC = () => (
  <g>
    <rect width={1080} height={1500} fill="#9FB3C8" />
    <rect x={0} y={1150} width={1080} height={350} fill="#8AA0B7" />
    {/* grande fenêtre sur la ville au coucher du soleil */}
    <g>
      <clipPath id="vitre-bureau"><rect x={60} y={200} width={600} height={760} /></clipPath>
      <g clipPath="url(#vitre-bureau)">
        <Ciel id="ciel-bureau" y2={960} />
        <circle cx={480} cy={760} r={110} fill="#FFD27A" />
        <path d="M 60 960 L 60 640 L 150 640 L 150 560 L 240 560 L 240 700 L 330 700 L 330 600 L 430 600 L 430 720 L 520 720 L 520 650 L 660 650 L 660 960 Z" fill="#3A1D4A" />
        <Fenetres x={170} y={590} cols={2} rangs={3} l={18} ht={22} ex={20} ey={24} graine={3} nuit />
      </g>
      <rect x={60} y={200} width={600} height={760} fill="none" stroke={N} strokeWidth={14} />
      <line x1={360} y1={200} x2={360} y2={960} stroke={N} strokeWidth={10} />
      <rect x={40} y={950} width={640} height={30} fill="#E9EEF3" stroke={N} strokeWidth={T} />
    </g>
    {/* horloge et étagère à classeurs */}
    <circle cx={880} cy={300} r={80} fill="#FFFFFF" stroke={N} strokeWidth={T} />
    <path d="M 880 300 L 880 248 M 880 300 L 916 318" stroke={N} strokeWidth={8} strokeLinecap="round" />
    <rect x={740} y={560} width={300} height={24} fill="#6B4A32" stroke={N} strokeWidth={T} />
    {['#E8436B', '#3D7DD8', '#F2A12C', '#2BB673', '#8E5BD8'].map((c, i) => (
      <rect key={c} x={760 + i * 54} y={420} width={46} height={140} fill={c} stroke={N} strokeWidth={4} />
    ))}
    <Plante x={930} y={1150} k={1.1} />
    {/* bureau avec ordinateur */}
    <rect x={-20} y={1220} width={760} height={40} fill="#B07A4C" stroke={N} strokeWidth={T} />
    <rect x={30} y={1260} width={30} height={240} fill="#7A5232" stroke={N} strokeWidth={4} />
    <rect x={640} y={1260} width={30} height={240} fill="#7A5232" stroke={N} strokeWidth={4} />
    <path d="M 220 1220 L 260 1060 L 520 1060 L 500 1220 Z" fill="#2A2C34" stroke={N} strokeWidth={T} strokeLinejoin="round" />
    <path d="M 270 1080 L 500 1080 L 486 1190 L 240 1190 Z" fill="#4FA3E0" />
    <rect x={560} y={1150} width={60} height={70} rx={8} fill="#FFFFFF" stroke={N} strokeWidth={4} />
    <rect x={0} y={1480} width={1080} height={440} fill="#5E6B7E" />
    <line x1={0} y1={1480} x2={1080} y2={1480} stroke={N} strokeWidth={T} />
  </g>
);

const Appartement: React.FC = () => (
  <g>
    <rect width={1080} height={1500} fill="#E9C9A8" />
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 96} y={0} width={30} height={1500} fill="#DDB995" />)}
    {/* fenêtre avec rideaux */}
    <clipPath id="vitre-appart"><rect x={600} y={260} width={380} height={560} /></clipPath>
    <g clipPath="url(#vitre-appart)">
      <Ciel id="ciel-appart" y2={820} />
      <path d="M 600 820 L 600 640 L 680 640 L 680 580 L 760 580 L 760 680 L 860 680 L 860 610 L 980 610 L 980 820 Z" fill="#3A1D4A" />
    </g>
    <rect x={600} y={260} width={380} height={560} fill="none" stroke={N} strokeWidth={12} />
    <line x1={790} y1={260} x2={790} y2={820} stroke={N} strokeWidth={8} />
    <path d="M 560 230 L 660 230 Q 640 560 680 880 L 560 880 Z M 1020 230 L 920 230 Q 940 560 900 880 L 1020 880 Z" fill="#C0392B" stroke={N} strokeWidth={T} strokeLinejoin="round" />
    {/* cadre au mur */}
    <rect x={120} y={360} width={300} height={220} fill="#2E4A7D" stroke={N} strokeWidth={10} />
    <path d="M 140 560 L 230 450 L 290 520 L 330 480 L 400 560 Z" fill="#5FDDD0" />
    <circle cx={350} cy={420} r={26} fill="#FFD27A" />
    {/* lampadaire */}
    <rect x={500} y={900} width={14} height={600} fill="#2A2A30" stroke={N} strokeWidth={4} />
    <path d="M 440 900 L 574 900 L 548 800 L 466 800 Z" fill="#F2D13A" stroke={N} strokeWidth={T} strokeLinejoin="round" />
    <circle cx={507} cy={880} r={110} fill="#FFE9A6" opacity={0.25} />
    {/* canapé */}
    <path d="M 40 1180 Q 40 1080 140 1080 L 460 1080 Q 560 1080 560 1180 L 560 1440 L 40 1440 Z" fill="#3D6DB5" stroke={N} strokeWidth={T} strokeLinejoin="round" />
    <path d="M 20 1250 L 580 1250 L 580 1440 L 20 1440 Z" fill="#2E5797" stroke={N} strokeWidth={T} strokeLinejoin="round" />
    <rect x={90} y={1140} width={170} height={120} rx={20} fill="#F2A12C" stroke={N} strokeWidth={5} />
    <rect x={40} y={1440} width={24} height={50} fill={N} />
    <rect x={536} y={1440} width={24} height={50} fill={N} />
    <Plante x={920} y={1440} k={1.2} />
    {/* parquet et tapis */}
    <rect x={0} y={1480} width={1080} height={440} fill="#A8693A" />
    {Array.from({ length: 5 }, (_, i) => <line key={i} x1={0} y1={1560 + i * 80} x2={1080} y2={1560 + i * 80} stroke="#7E4A24" strokeWidth={4} />)}
    <ellipse cx={540} cy={1740} rx={460} ry={120} fill="#E8436B" stroke={N} strokeWidth={T} />
    <ellipse cx={540} cy={1740} rx={380} ry={88} fill="none" stroke="#FFD27A" strokeWidth={8} />
    <line x1={0} y1={1480} x2={1080} y2={1480} stroke={N} strokeWidth={T} />
  </g>
);

const COMPOSANTS: Record<DecorNom, React.FC> = { rue: Rue, magasin: Magasin, bureau: Bureau, appartement: Appartement };

/**
 * Décor plein écran avec un très léger zoom continu (effet caméra) et une vignette.
 * `assombrir` (0..1) fonce le décor pour faire ressortir le texte.
 */
export const Decor: React.FC<{ nom: DecorNom; assombrir?: number; flou?: number }> = ({ nom, assombrir = 0, flou = 0 }) => {
  const frame = useCurrentFrame();
  const Composant = COMPOSANTS[nom];
  const zoom = 1.04 + frame * 0.0004;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ transform: `scale(${zoom})`, transformOrigin: '50% 60%', filter: flou ? `blur(${flou}px)` : undefined }}>
        <Composant />
      </svg>
      {/* trame de points + vignette pour l'ambiance « affiche » */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(0,0,0,0.16) 1.6px, transparent 1.8px)', backgroundSize: '14px 14px', opacity: 0.45 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(10,4,20,0.55) 100%)' }} />
      {assombrir > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(12,6,24,${assombrir})` }} />}
    </div>
  );
};
