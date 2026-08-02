# 🏛️ Big City — Deviens maire

Jeu de gestion communale en français, pensé pour un public **20-35 ans** : des décisions rapides, une carte vivante, zéro comptabilité imposée. Adapté du MODULE — Budget, fiscalité, crises & défaite.

Tu es maire. Chaque bâtiment coûte **tous les mois, pour toujours**. Chaque aide se paie un jour. Tu étais prévenu.

## Lancer le jeu

Aucune dépendance, aucun build : HTML/CSS/JS pur.

```bash
open index.html                     # double-clic suffit
# ou : python3 -m http.server 8000
```

La partie se sauvegarde automatiquement dans le navigateur (localStorage).

## Ta vraie ville

Le jeu embarque **les 34 957 communes de France** (population INSEE, via geo.api.gouv.fr) : cherche la tienne avec l'autocomplétion, ou tente une commune au hasard. La population de départ est la vraie, le budget est mis à l'échelle (une médiathèque de métropole ne coûte pas le prix d'une médiathèque de village), et **les villes voisines sur la carte sont de vraies communes de ton département**.

Le **décor s'adapte automatiquement à la vraie ville** : les ~1 500 communes littorales (classées par distance au trait de côte, outre-mer inclus) ont la mer, la plage et le port ; en dessous de 3 500 habitants c'est la campagne et son massif forestier ; sinon la ville classique et sa rivière. La carte reste stylisée (générée procéduralement à partir du nom de la commune) — ce n'est pas un plan réel, et c'est dit au joueur.

## Ton maire : un avatar physique et mental

Avant de gouverner, tu te présentes : **homme ou femme**, ta tête de campagne (dix visages au choix), ton prénom — puis un **quiz de personnalité** en trois questions détermine ton profil : 💰 L'Entrepreneur, 🌱 L'Écolo, ❤️ Le Populaire ou 🏗️ Le Bâtisseur.

Ce profil pilote **ton cabinet, qui agit sans te demander** : chaque mois une initiative dans ta ligne (l'Entrepreneur monte une régie publicitaire, l'Écolo plante 500 arbres, le Populaire offre la cantine…), et tous les trois mois le cabinet **lance de lui-même un chantier** conforme à ta politique quand la caisse le permet — avec des garde-fous : il ne met jamais la ville en danger.

## Encadré comme un jeu à scénario

- **Cinématiques** en letterbox : le soir d'élection en trois tableaux, le coup de téléphone à 3 h 12 avant chaque crise, les initiatives du cabinet mises en scène.
- **Objectifs de mandat** en fil rouge, toujours affichés sous le header : réponds à ton premier courrier → lance ta première construction → boucle un mois dans le vert → gère une crise sans l'option par défaut → … jusqu'au bout du mandat. Chaque objectif rapporte XP et parfois du capital préfecture.

## La boucle de jeu

1. **Avance les jours** (▶ +1 jour / ⏩ +7 jours).
2. **📬 Le courrier du maire** tombe régulièrement : une situation du quotidien, 2-3 réponses possibles, chacune avec ses effets (façon QCM à la Destiny Eleven) — food-truck contre kebab, nid-de-poule star des réseaux, banc de Madame Rosa, sapin de Noël ou sobriété…
3. **🚨 Les crises** frappent plus rarement mais plus fort : feu de forêt, inondation, tempête… Le coût grimpe chaque jour d'attente, l'option par défaut est toujours survivable.
4. **🏗️ Construis** pour attirer des habitants — la projection à 30 jours s'affiche avant chaque dépense : tu sauras toujours ce que tu signes.
5. Tiens 36 mois, garde la caisse pleine et tes habitants… ou perds la ville (jamais ta progression).

## La carte explorable

- **Balade-toi** : glisser à la souris ou au doigt, zoom à la molette, au pincement ou aux boutons +/−, recentrage en un clic.
- En dézoomant, tu découvres **la région et les autres villes du jeu** : cinq villages voisins et les deux autres communes jouables, reliés par des routes.
- La carte vit : les équipements construits y apparaissent, le bâti suit la population (les départs laissent des maisons grises), les saisons teintent les champs, l'état de la voirie colore les routes, et les crises pulsent à l'endroit concerné.
- Géographie par profil : rivière et bocage (ville moyenne), massif forestier (bourg rural), littoral avec plage et voiliers (station touristique).

## Une interface d'app mobile

- **Header d'app** toujours visible : la **note de la ville** (badge /20 coloré, touche-le pour le détail : finances, popularité, attractivité, cadre de vie, courbes et diagnostic), 💰 l'argent, 👥 la population, et la cloche 🔔.
- **Notifications** avec pastille de non-lus : crises (incendie, inondation…), alertes budget et exode, courrier, offres privées, bilan mensuel — chaque alerte a son bouton « Voir » qui ouvre le bon écran.
- **Barre de navigation en bas** : 🗺️ Carte (plein écran) · 📬 Courrier (question en cours + tes dernières décisions) · 🏗️ Construire · 💼 Business (budget, impôts, entretien, emprunt, aides, offres privées).
- **Pilule flottante** pour avancer le temps (▶ +1 jour / ⏩ +7), accessible depuis n'importe quelle vue.
- **Entretien de la ville en 3 niveaux** (Éco / Normal / Soigné) et **emprunt en 3 tailles** — mensualité affichée avant de signer ; le détail comptable est replié derrière « Voir le détail ».

## Sous le capot (fidèle au module de conception)

- Budget fonctionnement/investissement séparés : 15 jours de dépenses sont sanctuarisés, on ne finance jamais l'un avec l'autre. Chaque équipement inscrit sa charge mensuelle à vie.
- Fiscalité : taux communal 8-30 %, une modification par mois, application le mois suivant, effets popularité et migration (`−Δtaux × 1,8`, pressions fiscales du §3). Monter à 26 % en crise puis redescendre est une stratégie valide.
- Migration mensuelle plafonnée à ±3 %, saturation des services (`pop/capacité − 1`), diagnostic des départs (cause principale en tête).
- Aides : capital préfecture (60 au départ, +8/mois, aides de crise et de trésorerie), offres privées à contrepartie différée (naming J+45, exonération J+60, terrain J+90), emprunt à taux `3,5 % + 2 % × endettement`, coupé au-delà de 100 %.
- 7 crises apolitiques avec escalade (+12 %/jour) et cooldown de 30 jours ; ~18 questions de courrier du maire, pioche sans remise, certaines saisonnières.
- Défaites en paliers annoncés : financière (alerte < 15 j → redressement 30 j → tutelle) et démographique (−5 % → −10 % → −15 % de la population initiale). Mode « chill » sans défaite.
- Calibrage §10 respecté : commune de 12 000 hab. à 15 % → solde ≈ +52 900 €/mois.

## Structure du code

```
index.html        point d'entrée
css/style.css     habillage « city-builder » (ciel, crème, boutons 3D)
fonts/            Fredoka (interface) et Newsreader italique (récits)
js/data.js        constantes, profils, équipements, crises, questions, aides
js/map.js         carte du monde explorable (canvas 2D, caméra pan/zoom, villes voisines)
js/engine.js      moteur : budget, migration, paliers, crises, questions, projections
js/ui.js          rendu des écrans, modales (QCM, crise, projection), toasts
js/main.js        démarrage
```

Simplifications volontaires par rapport au module : pas de dossiers de subvention (retirés pour la lisibilité), temps au tour par tour (un clic = un jour, mandat = 36 mois), une trésorerie et un capital préfecture par commune.
