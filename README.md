# 🎒 Big City Life — Vis ta vie dans ta vraie ville

Un mélange de **Sims et de Pokémon**, pensé pour la nouvelle génération : tu choisis la ville de France où tu veux grandir, ta famille, tes amis, ta filière — puis tu vis, de 15 à 25 ans — **une partie complète dure 20 à 25 minutes**. Tu te déplaces de lieu en lieu sur la carte, chaque sortie fait avancer le temps d'une saison, et ta vie s'écrit : le bac, les entretiens d'embauche, les carrières de rêve, les potes.

> 🏛️ L'ancien jeu « deviens maire » reste jouable sur `maire.html`.

## Lancer

Aucune dépendance, aucun build : ouvre `index.html`. Sauvegarde automatique dans le navigateur.

## Le départ

1. **Ta ville** : les 34 957 communes de France (population INSEE), recherche avec autocomplétion, décor auto (littoral / campagne / ville).
2. **Toi** : garçon ou fille, ta tête (10 visages), ton prénom.
3. **Ta famille** : aisée & exigeante, classe moyenne, modeste & aimante, ou bohème — argent de poche et bonus différents.
4. **Tes amis** : choisis-en 2 parmi 5 archétypes (Sam le premier de la classe, Théo le gamer, Inès la sportive, Léa la sociale, Marco le débrouillard) — chacun booste tes sorties à sa façon.
5. **Ta filière** : générale, techno ou pro/apprentissage (payé 150 €/mois dès le lycée).

## La boucle de jeu

- **La carte est ton monde** : maison, lycée, stade, café, ciné, parc, bibliothèque, centre commercial, salle de concert, bord de l'eau. Touche un lieu, choisis l'activité et avec qui — **chaque activité = une saison de ta vie** (~40 décisions pour une vie entière).
- **5 stats** (⚡ énergie, 😊 moral, 🧠 savoir, 🫂 social, 💪 forme) + 💰 ton argent + l'amitié de chaque pote. Tout se gère : trop de fêtes et le bac s'éloigne, trop de révisions et le moral craque.
- **Scènes de vie** à choix multiples (~18) : contrôle surprise, rumeur sur un pote, crush qui t'écrit, plan douteux de Marco, collègue qui s'attribue ton travail…
- **Le bac** (résultat selon ton savoir) puis **l'orientation** : études longues, BTS/BUT ou travail direct.
- **Ton métier, c'est toi qui le décroches** : choisis un poste sur le tableau des métiers puis passe un **entretien d'embauche** (3 questions piège + ton social et ton savoir font le score). Raté ? Deux mois d'intérim et on retente.
- **Les carrières de rêve** ⚽🎤 : entraîne-toi au stade ou répète à la salle de concert — ton talent monte, un recruteur finit par te repérer, et l'essai décide de tout (talent + forme ou social ≥ 100). Footballeur pro à 17 ans ou chanteuse signée, c'est possible.
- **Cinématiques** letterbox aux grands moments (rentrée, résultats du bac, premier jour de boulot, contrat pro) et **objectifs de vie** en fil rouge.
- **À 25 ans, le bilan** : bonheur, amitiés, carrière, économies → ton score de vie. Le bac tombe au bout de ~5 minutes de jeu, le rythme ne retombe jamais.

## Structure du code

```
index.html          Big City Life (le jeu principal)
maire.html          l'ancien jeu : deviens maire
css/style.css       habillage commun « city-builder »
js/communes.js      les 34 957 communes de France (INSEE + littoral)
js/map.js           carte du monde explorable (pan/zoom, villes voisines réelles)
js/fx.js            sons WebAudio, confettis, toasts, tremblements
js/vie-data.js      familles, amis, filières, lieux, scènes, métiers, rêves
js/vie-engine.js    moteur de vie : stats, temps, bac, entretiens, talents, bilan
js/vie-ui.js        interface app (carte, lieux, modales, cinématiques)
js/data|engine|ui   le jeu du maire (inchangé)
```
