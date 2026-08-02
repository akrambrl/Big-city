# 🏛️ Big City — Monsieur le Maire

Jeu de gestion communale en français, implémentation jouable du **MODULE — Budget, fiscalité, crises & défaite**.

Vous êtes maire. Chaque équipement construit crée une dépense de fonctionnement **à vie**. Chaque aide se paie un jour. Vous étiez prévenu.

## Lancer le jeu

Aucune dépendance, aucun build : c'est du HTML/CSS/JS pur.

```bash
# au choix :
open index.html                     # double-clic suffit
python3 -m http.server 8000         # ou servir le dossier
```

La partie se sauvegarde automatiquement dans le navigateur (localStorage).

## Ce qui est implémenté (fidèle au module)

| Section du module | Implémentation |
|---|---|
| §1 Structure du budget | Fonctionnement (fiscalité `pop × 1 850 € × taux/12`, dotation `187 €/hab/an`, services / personnel incompressible `pop × 0,012 × 2 400 €`, énergie, entretien, dette) + section investissement séparée : 15 jours de fonctionnement sont sanctuarisés, on ne finance jamais l'un avec l'autre. |
| §1 Le piège récurrent | Chaque équipement inscrit sa ligne d'entretien + énergie − recettes, à vie, visible dans l'onglet Budget. |
| §1 Ratios | Solde mensuel, jours de trésorerie (< 15 j), taux d'endettement (> 100 %) — les trois, pas plus. |
| §2 Jauges | Trésorerie, Population, Popularité, Attractivité, **Cadre de vie** (5 composantes pondérées : éclairage 20 %, voirie 25 %, propreté 20 %, logements 15 %, proximité 20 %). Pas de jauge « sécurité ». |
| §3 Fiscalité | Taux 8–30 %, défaut 15 %, une modification par mois, application au mois suivant, effet popularité `−(Δtaux) × 1,8`, pressions migratoires fiscales aux formules du module. Le taux de crise à 26 % est une stratégie valide. |
| §4 Migration | Calcul mensuel unique, un seul chiffre affiché, plafond ±3 %/mois, saturation `max(0, pop/capacité − 1) × 100`. |
| §5 Aides | **État** : capital préfecture (60 → +8/mois, −3 en alerte), dotation de solidarité (35), fonds de catastrophe (50, résolution 72 h avec dégâts), avance de trésorerie (25), soutien exceptionnel (60, une fois). **Département/Région/Europe** : dossiers de subvention 50 %, ~20 j d'instruction, 75 % de succès, jamais pour une crise. **Privé** : 3 offres avec créance différée (naming J+45, exonération J+60, terrain J+90). **Emprunt** : 24/60/120 mois, `taux = 3,5 % + 2 % × endettement`, mensualité définitive, coupé au-delà de 100 %. |
| §6 Crises | 7 crises apolitiques (feu de forêt, inondation, canicule, tempête, neige, fuite d'eau, fermeture d'usine), escalade du coût par jour d'attente, option par défaut toujours survivable, 1 crise majeure max par 30 jours, modulateurs de profil (touristique ×2 sur l'attractivité, rurale ×1,5 sur la population). |
| §7 Défaite | **Financière** : alerte (< 15 j) → plan de redressement (30 j, investissements gelés, emprunt coupé, taux plancher 15 %, mission quotidienne rémunérée) → tutelle. **Démographique** : −5 % alerte + diagnostic → −10 % déclin → −15 % désertification. Perdre = perdre la commune, jamais la progression. |
| §7 Diagnostic | Écran « pourquoi les gens partent » : les causes triées, la principale en tête, un conseil par cause. |
| §8 Projection | **Avant toute décision budgétaire** (construction, taux, emprunt, budgets d'entretien) : solde, trésorerie et jours de trésorerie avant → après à 30 jours. Un joueur qui coule doit pouvoir dire « je savais ». |
| §9 `degrader_voirie` | Seule dégradation automatique du jeu : −1,5 pt/mois max, annoncée, évitable en budgétant l'entretien. |
| §10 Calibrage | Commune de 12 000 hab. à 15 % : solde ≈ +53 k€/mois, une médiathèque tous les ~17 mois en autofinancement. |

## Points tranchés (§11)

- **Temps** : jeu au tour par tour — un clic = un jour, un mois de jeu = 30 jours, mandat = 36 mois (prototype). La protection hors-ligne du module (trésorerie figée à zéro, 48 h avant décompte) est sans objet ici : le temps n'avance que quand vous jouez — vous ne perdrez jamais une ville en dormant, par construction.
- **Trésorerie** : une par commune (une seule commune dans ce prototype).
- **Capital préfecture** : par commune.
- **Mode « ville tranquille »** : disponible à la création — les alertes restent affichées, les fins de mandat anticipées sont désactivées.

## Structure du code

```
index.html        point d'entrée
css/style.css     style « papier de mairie »
js/data.js        constantes, profils, équipements, crises, aides (les catalogues)
js/engine.js      moteur : budget, migration, paliers, crises, projections, sauvegarde
js/ui.js          rendu des écrans et des modales (projection, crise, diagnostic)
js/main.js        démarrage
```

Le schéma SQL du §9 décrit la version serveur multi-joueurs ; ce prototype est 100 % client, l'état de jeu reprend les mêmes champs (`population_initiale`, `taux_communal`, `capital_prefecture`, `palier_alerte_fin`, journal `budget_mensuel`…) pour faciliter un portage ultérieur.
