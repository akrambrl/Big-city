#!/usr/bin/env node
// Commande unique : JSON de la vidéo -> MP4 vertical 1080x1920, 30 i/s, avec voix off.
//
//   npm run make -- videos/001.json
//
// 1. génère (ou reprend en cache) la voix off et les timings ;
// 2. vérifie que la vidéo dure entre 61 et 90 secondes ;
// 3. lance le rendu Remotion vers out/<id>.mp4.
// Les options supplémentaires sont passées à Remotion (ex. --browser-executable=...).
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { genererVoix } from './voix.mjs';

const DUREE_MIN = 61;
const DUREE_MAX = 90;

const args = process.argv.slice(2);
const chemin = args.find((a) => !a.startsWith('--'));
if (!chemin) {
  console.error('Usage : npm run make -- videos/001.json [--forcer] [--ignorer-duree]');
  process.exit(1);
}
const optionsRemotion = args.filter((a) => a.startsWith('--') && !['--forcer', '--ignorer-duree'].includes(a));

try {
  console.log('▶ 1/3 Voix off');
  const { video, timeline } = genererVoix(resolve(chemin), { forcer: args.includes('--forcer') });

  console.log(`\n▶ 2/3 Durée : ${timeline.duree.toFixed(1)} s`);
  if ((timeline.duree < DUREE_MIN || timeline.duree > DUREE_MAX) && !args.includes('--ignorer-duree')) {
    throw new Error(
      `La vidéo dure ${timeline.duree.toFixed(1)} s : elle doit durer entre ${DUREE_MIN} et ${DUREE_MAX} s. ` +
        (timeline.duree < DUREE_MIN ? 'Ajoute du texte ou une scène.' : 'Raccourcis le texte.') +
        ' (--ignorer-duree pour passer outre)',
    );
  }

  console.log('\n▶ 3/3 Rendu vidéo');
  mkdirSync('out', { recursive: true });
  const sortie = join('out', `${video.id}.mp4`);
  const r = spawnSync(
    'npx',
    ['remotion', 'render', 'src/index.ts', 'Video', sortie, `--props=${resolve(chemin)}`, ...optionsRemotion],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (r.status !== 0) throw new Error('Le rendu Remotion a échoué.');
  console.log(`\n✓ Vidéo prête : ${sortie} (${timeline.duree.toFixed(1)} s, 1080x1920, 30 i/s)`);
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
}
