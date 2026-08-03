# 🎒 Big City Life — Une vie en 40 questions

Un jeu de vie **100 % questions**, façon Destiny Eleven : tu choisis la ville de France où tu grandis, ta famille, tes amis, ta filière — puis **chaque question écrit une saison de ta vie**, de 15 à 25 ans. Pas de carte, pas de menus : le jeu EST la question. **Une partie complète dure 20 à 25 minutes.**

> 🏛️ L'ancien jeu « deviens maire » reste jouable sur `maire.html`.

## Lancer

Aucune dépendance, aucun build : ouvre `index.html`. Sauvegarde automatique dans le navigateur.

## Pensé pour être filmé (Twitch, TikTok)

- **🔥 Défi du jour** : chaque jour, toute la France vit LA MÊME vie (même ville, mêmes questions, même hasard). Le streamer joue, le chat rejoue la même partie et compare les scores.
- **✍️ Une conséquence après chaque réponse**, façon Destiny Eleven : tu choisis, la vie te répond, et c'est ce moment-là qu'on clippe.
- **📋 Bilan d'année mis en scène** (toutes les 4 saisons) : gros titre de presse sur ton année (« Jade, la machine à bonnes notes d'Annecy »), tuiles de stats (moyenne, ami·e n°1, bonheur, argent), passage de classe, avertissements, et le potin de la ville en prime.
- **🌟 Moments rares** : des cartes dorées à ~7 % de chance (ticket gagnant, TikTok à 2 M de vues, tournage en ville…) — le moment de crier devant la caméra.
- **🏆 Titres de vie** à collectionner en fin de partie : La Légende du Stade, La Tête d'Affiche, Le Cerveau, Le Fantôme, Le Phénix…
- **📸 Image de partage 9:16** générée en un clic (canvas, format story/TikTok) + récap texte à coller, avec #BigCityLife.

## Le départ

1. **Ta ville** : choisis ta région, ton département, puis ta commune parmi les 34 957 de France (population INSEE) — ou lance le Défi du jour, ville imposée.
2. **Toi** : garçon ou fille, ta tête (10 visages), ton prénom.
3. **Ta famille** : aisée & exigeante, classe moyenne, modeste & aimante, ou bohème — argent de poche et bonus différents.
4. **Tes amis** : choisis-en 2 parmi 5 archétypes (Sam le premier de la classe, Théo le gamer, Inès la sportive, Léa la sociale, Marco le débrouillard) — ils reviennent dans tes questions.
5. **Ta filière** : générale, techno ou pro/apprentissage (payé 150 €/saison dès le lycée).

## La boucle de jeu

- **Chaque question est une scène, façon visual novel** : un décor (salle de classe, rue, stade, bureau, saison), le personnage qui te parle en grand, sa plaque de nom, et le texte qui s'écrit lettre à lettre dans la boîte de dialogue.
- **Un monde nommé, pour que ça fasse réel** : ton lycée (Albert-Camus, Simone-Veil…), ton fast-food (Le Roi du Tacos…), ton resto, ton café, le club de foot de TA ville (US Toulouse…), l'influenceur local, le film à l'affiche qui change au fil des saisons et la tendance TikTok du moment.
- **Des arcs narratifs à conséquences** : ton pote filme ton geste au foot → le clip tourne → un recruteur te propose un stage… pendant les cours (à toi de choisir). Tes abonnés grimpent → une marque te contacte → une agence t'appelle : **influenceur·se peut devenir ton métier**.
- **Des choix qui laissent des traces** : le permis débloque l'achat de la voiture du pote, le chiot « de race » acheté sur Snap s'appelle Biscotte et revient dans tes bilans.
- **La vie, pas que les cours** : vacances en famille, premier départ entre potes (destination à choisir !), rencontres au camping, premier rendez-vous au resto, festival, plans business…
- **Après le bac, 5 voies** : études longues, BTS/BUT, travailler direct, **année sabbatique** ou **voyage sac à dos** (une année off, puis on re-choisit).
- **Une question par saison, ~40 questions pour une vie.** Deux types de cartes :
  - **Scènes de vie** (~18) : contrôle surprise, rumeur sur un pote, crush qui t'écrit, plan douteux de Marco, collègue qui s'attribue ton travail… Le prof, ta famille, tes potes ou le taf t'interpellent.
  - **Ta saison** : comment tu passes ces trois mois — réviser, sortir, t'entraîner au foot, répéter ton chant, bosser un petit job… Chaque option affiche ses effets.
- **5 stats** (⚡ énergie, 😊 moral, 🧠 savoir, 🫂 social, 💪 forme) + 💰 ton argent + l'amitié de chaque pote. Trop de fêtes et le bac s'éloigne, trop de révisions et le moral craque.
- **Le bac** (résultat selon ton savoir) puis **l'orientation** : études longues, BTS/BUT ou travail direct.
- **Ton métier, c'est toi qui le décroches** : choisis un poste puis passe un **entretien d'embauche** (3 questions piège + ton social et ton savoir font le score). Raté ? Une saison d'intérim et on retente.
- **Les carrières de rêve** ⚽🎤 : choisis les saisons d'entraînement ou de répète — ton talent monte, un recruteur finit par te repérer, et l'essai décide de tout (talent + forme ou social ≥ 100). Footballeur pro à 17 ans ou chanteuse signée, c'est possible.
- **Cinématiques** letterbox aux grands moments (rentrée, résultats du bac, premier jour de boulot, contrat pro) et **7 objectifs de vie** indépendants en fil rouge.
- **À 25 ans, le bilan façon « Wrapped »** : ton titre de vie, ton score /100, tes stats — et les boutons pour le partager au monde.

## Structure du code

```
index.html          Big City Life (le jeu principal, tout en questions)
maire.html          l'ancien jeu : deviens maire
css/style.css       habillage commun « jeu »
js/communes.js      les 34 957 communes de France (INSEE + littoral)
js/fx.js            sons WebAudio, confettis, toasts, tremblements
js/vie-data.js      familles, amis, filières, scènes, rythmes de saison, métiers, rêves
js/vie-engine.js    moteur de vie : cartes-questions, stats, bac, entretiens, talents, bilan
js/vie-ui.js        interface question (carte du moment, panneau Moi, cinématiques)
js/data|engine|ui|map  le jeu du maire (inchangé)
```
