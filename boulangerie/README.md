# 🥐 Fournil Live

Jeu mobile ASMR « satisfaisant » : tu tiens une petite boulangerie et tu filmes ta production en live. Web, mobile-first, en portrait.

**Statut : MVP en cours.** Une journée complète est jouable : fournées du matin (croissant, banana bread), service (latte, tranches de banana bread, croissants), bilan. Carrot cake, matcha et boutique arrivent ensuite.

## Une journée

1. **Le matin** : on choisit 1 ou 2 fournées. Chaque fournée remplit la vitrine (6 croissants, 8 tranches de banana bread) et sa note suit toute la journée.
2. **Le service** (cosy) : 6 clients. On sert les gâteaux de la vitrine et on prépare les lattes à la minute. La patience ne change que le pourboire. Un gâteau en rupture ne peut pas être servi.
3. **Le bilan** : pièces, pourboires, likes, abonnés ; les invendus sont donnés aux voisins.

## Lancer

```bash
cd boulangerie
npm install
npm run dev      # http://localhost:5173 (et sur le réseau local pour tester au téléphone)
npm run build    # sortie dans dist/
```

Raccourcis de test : `?mission=bananabread`, `?service` (vitrine pleine), `?step=latte:1` (produit:numéro d'étape).

## Déployer sur Vercel

1. Importer le dépôt dans Vercel.
2. **Root Directory** : `boulangerie`.
3. Vite est détecté automatiquement (build `npm run build`, sortie `dist`).

## Les gestes

- **Banana bread** : écraser les bananes (taps), mélanger (cercles), verser (appui long jusqu'à la ligne), poser la banane (glisser), cuire.
- **Latte** : espresso (appui long), mousser le lait (garder la buse juste sous la surface en glissant le pichet), latte art (verser un rond, swipe pour le cœur).
- **Service** : couper une tranche sur le repère (swipe), glisser un croissant dans l'assiette.

### Le croissant, étape par étape

| Étape | Geste | Ce qui compte pour la note |
|---|---|---|
| Pétrir | Taps répétés sur la boule de pâte | Régularité du rythme |
| Tourage | Swipes ↕ au rouleau puis swipe ↑ pour plier en trois, 3 fois (1 → 27 couches) | Swipes droits et complets |
| Façonnage | Glisser vers le bas pour rouler le triangle, puis déposer le croissant sur la plaque | Nombre de passes, précision du placement |
| Dorure | Peindre l'œuf au doigt | Surface couverte, débordements |
| Cuisson | Appui long, relâcher dans la zone « DORÉ » | Écart à la cuisson parfaite (35 % de la note) |

La dorure passe avant la cuisson, comme en vrai : la couche peinte cuit avec le croissant et reste brillante.

## Technique

- **Vite + JavaScript sans framework** : aucune dépendance à l'exécution.
- **Canvas 2D** pour le plan de travail, **HTML/CSS** pour le live, les boutons et les panneaux.
- **Sons** : 100 % synthétisés avec la Web Audio API (`src/core/audio.js`), aucun fichier audio.
- **Vibrations** : `navigator.vibrate` sur Android, astuce `<input switch>` sur iOS 18 et plus.
- **Sauvegarde** : `localStorage`, clé `fournil-live-v1`.

```
src/
  core/      stage (canvas), input (gestes), audio, haptics, particles, save, util (tweens, couleurs)
  render/    pastries (croissant + cuisson + dorure), scenery (bois, boutique, plaque), customer
  steps/     knead, laminate, shape, glaze, bake : une étape = un geste, avec un score de 0 à 1
  recipes/   croissant : suite d'étapes et poids dans la note
  scenes/    title, counter, workbench, result
  live/      faux live : spectateurs, commentaires, cœurs
```
