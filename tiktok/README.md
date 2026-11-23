# Vidéos TikTok « droits et argent du quotidien »

Générateur de vidéos animées verticales (1080 × 1920, 30 i/s) avec [Remotion](https://www.remotion.dev) en TypeScript : personnage animé, voix off locale, sous-titres synchronisés, animations calées sur la voix.

> **En cours de construction, étape par étape.**
> - [x] Étape 1 : personnage et expressions
> - [x] Étape 2 : scènes et décors
> - [x] Étape 3 : voix et synchro (module `../voix-off`)
> - [x] Étape 4 : commande finale `npm run make -- videos/001.json`

## Lancer le Studio

```bash
cd tiktok
npm install
npx remotion studio
```

Dans le dossier **Etape1-Personnage** :
- **Demo-Personnage** (Thomas) et **Demo-Lea** : animations de 9 s qui enchaînent expressions et poses ;
- **Galerie-Expressions**, **Galerie-Poses** (et leurs versions **-Lea**), **Galerie-Personnages** : planches fixes.

## Produire une vidéo

```bash
../voix-off/install.sh            # une seule fois : Piper, voix française, Whisper
npm install                       # une seule fois
npm run make -- videos/001.json   # -> out/001.mp4 (1080x1920, 30 i/s)
```

La commande génère la voix off (ou la reprend en cache), vérifie que la vidéo dure entre **61 et 90 s**, puis lance le rendu. Compte quelques minutes pour une vidéo de 80 s.

## Créer une nouvelle vidéo

1. Copie `videos/001.json` vers `videos/002.json` et change `id` en `"002"`.
2. Écris les scènes. Pour 61 à 90 s, compte environ **250 mots** de voix off, répartis en 10 à 13 scènes. Chaque scène contient :

```json
{
  "type": "montant",                       // accroche | montant | document | explication | cta
  "decor": "magasin",                      // rue | magasin | bureau | appartement
  "voix": "Le vendeur doit te rembourser 64,89 euros.",   // texte lu par la voix off
  "declencheur": "64,89 euros",            // mot de la voix qui lance l'animation
  "montant": { "ancien": "0 €", "nouveau": "64,89 €", "legende": "remboursés" },
  "personnage": { "variante": "heros", "expression": "neutre", "pose": "pointe_doigt", "expressionApres": "content" }
}
```

| Champ | Pour quelles scènes | Rôle |
|---|---|---|
| `voix` | toutes | Texte dit par la voix off. Il règle la durée de la scène et produit les sous-titres. |
| `declencheur` | toutes | Mot ou expression présent dans `voix`. L'animation part quand la voix le prononce. |
| `titre` | accroche, cta | Texte du bandeau jaune. |
| `texte` | accroche, explication, cta | Texte affiché. Les passages entre `**…**` sont surlignés en jaune. |
| `montant` | montant | `ancien` (barré en rouge), `nouveau` (en vert), `legende`. |
| `document` | document | `type` (`courrier`, `bail`, `fiche_paie`, `facture`), `titre`, `lignes` (5 lignes courtes), `surligne` (numéro de la ligne à surligner, à partir de 0). |
| `personnage` | toutes | `variante` (`heros`, `heroine`, `patron`, `proprietaire`, `conseiller`), `expression`, `pose`. Avec `expressionApres` et `poseApres`, il réagit au déclencheur. `lunettesSoleil` est facultatif. |
| `secondaire` | explication | Deuxième personnage, à droite. |
| `duree_min` | toutes | Durée minimale de la scène en secondes (facultatif). |

3. Au niveau de la vidéo :
   - `prononciation` corrige la lecture d'un mot par la voix sans toucher aux sous-titres, par exemple `"64,89 euros": "soixante-quatre euros quatre-vingt-neuf"`. Utilise-le pour les prix avec centimes, les sigles et les noms de marques.
   - `voix.vitesse` règle le débit de la voix (1.1 par défaut dans 001).
   - `sources` liste les pages officielles d'où viennent les informations.
4. Pour vérifier :
   - `npm run voix -- videos/002.json` affiche la durée et le taux de mots reconnus par Whisper (vise au moins 90 %) ;
   - `npx remotion studio`, composition **Video**, en remplaçant les props par le contenu de ton JSON.
5. Pour produire le MP4 : `npm run make -- videos/002.json`.

> Vérifie toujours les règles juridiques sur une source officielle (service-public.fr, economie.gouv.fr, Légifrance, INC) avant de publier.

## Voix off et synchro (étape 3)

Installation unique du module voix (Piper, voix française, Whisper) :

```bash
../voix-off/install.sh
```

Puis, pour une vidéo :

```bash
npm run voix -- videos/demo.json   # voix off + timings -> public/voix/demo/
npx remotion studio                # composition « Video »
```

- Chaque scène dure le temps de sa voix (plus une durée minimale par type, pour laisser les animations se jouer).
- L'animation principale part quand la voix prononce le mot `declencheur` de la scène (ex. « 59,90 euros »).
- La bouche des personnages s'ouvre pendant les mots et se ferme dans les silences.
- Les sous-titres (2 à 4 mots, mot prononcé en jaune) sont en bas au centre.
- `prononciation` corrige la lecture d'un mot par la voix sans changer les sous-titres (ex. « L216-4 » → « L deux cent seize quatre »).
- L'audio est en cache : seules les scènes dont le texte change sont regénérées.

## Les scènes (étape 2)

Dossier **Etape2-Scenes** du Studio : **Demo-Scenes** (les 5 scènes enchaînées, 20 s), chaque scène seule (**Scene-accroche**, **Scene-montant**…) et **Galerie-Decors**.

| Type | Ce qu'on voit | Animation au déclencheur |
|---|---|---|
| `accroche` | Bandeau jaune en haut (`titre`), sous-titre (`texte`), personnage en réaction | Bandeau qui s'écrase en place, flash, secousse, lignes de vitesse |
| `montant` | Carte avec `montant.ancien` barré en rouge → flèche → `montant.nouveau` en vert | Le nouveau montant « pop », pluie de pièces |
| `document` | Papier (`courrier`, `bail`, `fiche_paie`, `facture`) avec `titre` et `lignes` | La ligne `surligne` est surlignée au marqueur jaune, zoom dessus |
| `explication` | Personnage (et un `secondaire` éventuel) + texte clé | Les mots apparaissent un à un, les passages entre `**…**` en jaune |
| `cta` | « Abonne-toi » + « pour ne plus te faire avoir » + bouton | Un curseur clique sur « S'abonner », qui devient « Abonné ✓ », pluie de cœurs |

Décors : `rue`, `magasin`, `bureau`, `appartement` (`src/decors/Decors.tsx`). Le personnage peut changer d'expression et de pose au déclencheur (`expressionApres`, `poseApres`). Le format d'une scène est décrit dans `src/scenes/types.ts`.

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
