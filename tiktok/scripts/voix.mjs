#!/usr/bin/env node
// Génère la voix off d'une vidéo avec le module local ../voix-off (Piper + faster-whisper).
//
//   node scripts/voix.mjs videos/001.json
//
// Produit public/voix/<id>/ : voix_off.wav + timeline.json (durées des scènes, mots datés,
// déclencheurs, groupes de sous-titres), lus ensuite par Remotion.
// L'audio est en cache dans ../voix-off/cache : seules les scènes modifiées sont regénérées.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Durée minimale par type de scène (s) : laisse le temps aux animations de se jouer
const DUREE_MIN = { accroche: 2.5, montant: 3.5, document: 4, explication: 3.5, cta: 3.5 };

const VOIXOFF = resolve(process.env.VOIXOFF_DIR ?? join(RACINE, '..', 'voix-off'));

export function genererVoix(cheminVideo, { forcer = false } = {}) {
  const video = JSON.parse(readFileSync(cheminVideo, 'utf-8'));
  if (!video.id) throw new Error(`${cheminVideo} : il manque le champ « id ».`);
  const sortie = join(RACINE, 'public', 'voix', video.id);
  mkdirSync(sortie, { recursive: true });

  // Script au format du module voix-off : une scène par scène de la vidéo
  const script = {
    voix: video.voix ?? {},
    video: { largeur: 1080, hauteur: 1920, fps: 30 },
    marges: video.marges ?? { avant: 0.15, apres: 0.35 },
    prononciation: video.prononciation ?? {},
    // groupes courts : 2 à 4 mots, sur une seule ligne à l'écran
    sous_titres: { mots_min: 2, mots_max: 4, caracteres_max: 18 },
    scenes: video.scenes.map((s, i) => {
      if (!s.voix) throw new Error(`Scène ${i + 1} (${s.type}) : le texte de voix off « voix » est vide.`);
      return {
        id: `s${String(i + 1).padStart(2, '0')}-${s.type}`,
        texte: s.voix,
        ...(s.declencheur ? { declencheurs: [{ mot: s.declencheur, animation: s.type }] } : {}),
        duree_min: s.duree_min ?? DUREE_MIN[s.type] ?? 0,
        ...(s.marge_apres != null ? { marge_apres: s.marge_apres } : {}),
      };
    }),
  };
  const cheminScript = join(sortie, 'script-voix.json');
  writeFileSync(cheminScript, JSON.stringify(script, null, 2));

  const python = [join(VOIXOFF, '.venv', 'bin', 'python'), join(VOIXOFF, '.venv', 'Scripts', 'python.exe')].find(existsSync);
  if (!python) {
    throw new Error(`Module voix-off non installé. Lance d'abord : ${join(VOIXOFF, 'install.sh')}`);
  }
  const args = ['-m', 'voixoff', 'construire', cheminScript, '-o', sortie];
  if (forcer) args.push('--forcer');
  const r = spawnSync(python, args, { cwd: VOIXOFF, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('La génération de la voix off a échoué (voir les messages ci-dessus).');

  const timeline = JSON.parse(readFileSync(join(sortie, 'timeline.json'), 'utf-8'));
  return { video, timeline, sortie };
}

// Utilisation en ligne de commande
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const chemin = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!chemin) {
    console.error('Usage : node scripts/voix.mjs videos/001.json [--forcer]');
    process.exit(1);
  }
  try {
    const { timeline } = genererVoix(resolve(chemin), { forcer: process.argv.includes('--forcer') });
    console.log(`\n✓ Voix prête : ${timeline.duree.toFixed(1)} s`);
  } catch (e) {
    console.error(`\n✗ ${e.message}`);
    process.exit(1);
  }
}
