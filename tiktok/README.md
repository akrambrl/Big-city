# Vidéos TikTok « droits et argent du quotidien »

Générateur de vidéos animées verticales (1080 × 1920, 30 i/s) avec [Remotion](https://www.remotion.dev) en TypeScript : personnage animé, voix off locale, sous-titres synchronisés, animations calées sur la voix.

> **En cours de construction, étape par étape.**
> - [x] Étape 1 : personnage et expressions
> - [ ] Étape 2 : scènes et décors
> - [ ] Étape 3 : voix et synchro (module `../voix-off`)
> - [ ] Étape 4 : commande finale `npm run make -- videos/001.json`

## Lancer le Studio

```bash
cd tiktok
npm install
npx remotion studio
```

Dans le dossier **Etape1-Personnage** :
- **Demo-Personnage** (Thomas) et **Demo-Lea** : animations de 9 s qui enchaînent expressions et poses ;
- **Galerie-Expressions**, **Galerie-Poses** (et leurs versions **-Lea**), **Galerie-Personnages** : planches fixes.

## Le personnage

Composant React `src/personnage/Personnage.tsx`, entièrement en SVG, dans un style d'illustration de jeu vidéo : proportions réalistes, contours noirs épais et ombres en aplats (lumière en haut à gauche). Chaque couleur existe en trois tons (lumière, base, ombre) dans `variantes.ts`.

```tsx
<Personnage
  variante="heros"           // heros (Thomas) | heroine (Léa) | patron | proprietaire | conseiller
  expression="choque"        // neutre | choque | content | colere | triste | malin
  pose="pointe_doigt"        // debout | bras_leves | pointe_doigt | mains_hanches | telephone
  posePrecedente="debout"    // facultatif : transition douce entre deux poses…
  transition={0.5}           // …avec son avancement (0 -> 1)
  parle                      // bouche automatique (à l'étape 3, calée sur la voix avec `ouverture`)
  hauteur={1400}             // hauteur en pixels
  lunettesSoleil             // facultatif
/>
```

Le clignement des yeux, la respiration et un léger balancement des bras sont automatiques. Ils sont calculés à partir du numéro d'image, donc le rendu est identique à chaque fois.

| Fichier | Rôle |
|---|---|
| `personnage/types.ts` | Listes des expressions, poses et variantes. |
| `personnage/variantes.ts` | Apparence de chaque personnage (peau, cheveux, vêtements, accessoires). |
| `personnage/geometrie.ts` | Membres effilés et bande d'ombre calculés à partir du squelette. |
| `personnage/poses.ts` | Position des épaules, coudes et mains pour chaque pose. |
| `personnage/Visage.tsx` | Yeux, sourcils et bouche selon l'expression. |
| `personnage/Personnage.tsx` | Corps, bras, jambes et micro-animations. |

Pour ajouter un personnage, ajoute une entrée dans `APPARENCES` (`variantes.ts`) et son nom dans `VARIANTES` (`types.ts`).

## Police

Les titres utilisent **Anton** (Google Fonts, licence OFL : gratuite, usage commercial autorisé), chargée avec `@remotion/google-fonts`.

## Licence de Remotion

Remotion est **gratuit** pour un particulier, une association ou une entreprise de **3 salariés maximum**, y compris pour un usage commercial. Au-delà, il faut une licence entreprise payante. Voir le fichier `node_modules/remotion/LICENSE.md`.
