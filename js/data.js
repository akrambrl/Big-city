/* ============================================================
   BIG CITY — Données de jeu
   Constantes, profils de commune, équipements, crises, aides.
   Toutes les formules viennent du MODULE Budget & Défaite.
   ============================================================ */

const CFG = {
  VALEUR_LOCATIVE: 1850,        // € / habitant / an
  DOTATION_HAB_AN: 187,         // € / habitant / an
  TAUX_DEFAUT: 15,
  TAUX_MIN: 8,
  TAUX_MAX: 30,
  JOURS_PAR_MOIS: 30,
  MANDAT_MOIS: 36,              // durée du mandat (prototype)
  CAPITAL_PREF_INIT: 60,
  CAPITAL_PREF_REGEN: 8,        // + par mois, plafonné à 100
  CAPITAL_PREF_MALUS_ALERTE: 3, // - par mois passé en alerte budgétaire
  SEUIL_ALERTE_JOURS: 15,       // jours de trésorerie
  REDRESSEMENT_JOURS: 30,       // délai avant tutelle
  DEFAITE_DEMO: [5, 10, 15],    // % de perte : alerte / déclin / désertification
  MIGRATION_CLAMP: 3,           // ± % / mois
  CRISE_COOLDOWN_GLOBAL: 30,    // jours mini entre deux crises majeures
  CRISE_PROBA_JOUR: 0.025,
  CRISE_GRACE_JOURS: 20,        // pas de crise en tout début de mandat
  CRISE_ESCALADE_JOUR: 0.12,    // +12 % du coût par jour d'attente
  CRISE_DELAI_JOURS: 2,         // au-delà : option par défaut appliquée
  MISSION_REDRESSEMENT: 8000,   // € par mission quotidienne de redressement
  RESERVE_FONCTIONNEMENT_J: 15, // jours de dépenses sanctuarisés (jamais investis)
  SUBVENTION_DELAI_JOURS: 20,
  SUBVENTION_TAUX: 0.5,
  SUBVENTION_SUCCES: 0.75,
  DEGRADATION_VOIRIE_MAX: 1.5,  // seule dégradation automatique du jeu
};

/* Coefficients par habitant (calibrés sur la commune de 12 000 hab. du §10) */
const COEF = {
  PERSONNEL: 0.012 * 2400,      // 28,80 € / hab / mois — incompressible
  ENERGIE_BASE: 38000 / 12000,
  ENTRETIEN_BASE: 25000 / 12000, // patrimoine existant hors voirie/propreté
  SERVICES_BASE: 24000 / 12000,
  CAPACITE_BASE: 1.125,          // écoles, eau, voirie, stationnement
  VOIRIE_PLEIN: 1.25,            // budget voirie « plein » : € / hab / mois
  PROPRETE_PLEIN: 1.5,           // budget propreté donnant 100 en cible
  TRESO_INIT_MOIS: 2.85,         // trésorerie de départ en mois de dépenses
};

const PROFILS = {
  rurale: {
    nom: 'Saint-Aubin-le-Bourg', label: 'Bourg rural', icone: '🌾',
    population: 2800, attractivite: 48, popularite: 58,
    desc: 'Petit budget, petites crises. La moindre dépense compte, mais tout est plus lent.',
  },
  moyenne: {
    nom: 'Villeneuve-sur-Sarthe', label: 'Ville moyenne', icone: '🏘️',
    population: 12000, attractivite: 52, popularite: 55,
    desc: 'Le profil de référence. Marges correctes, patrimoine déjà lourd à entretenir.',
  },
  touristique: {
    nom: 'Port-Miran', label: 'Station touristique', icone: '⛱️',
    population: 8500, attractivite: 62, popularite: 52,
    desc: 'Attractive mais exposée : les crises y coûtent cher en image, surtout en saison.',
  },
};

/* ------------------------------------------------------------
   ÉQUIPEMENTS — chaque construction crée une ligne de
   fonctionnement À VIE (entretien + énergie − recettes).
   ------------------------------------------------------------ */
const EQUIPEMENTS = [
  { id: 'mediatheque', nom: 'Médiathèque', icone: '📚', cout: 900000,
    entretien: 5500, energie: 1000, recettes: 0, capacite: 0,
    effets: { attractivite: 12, popularite: 4 }, proximite: true,
    desc: 'Le grand classique : 900 000 € une fois, puis 6 500 €/mois pour toujours.' },
  { id: 'creche', nom: 'Crèche municipale', icone: '🧸', cout: 600000,
    entretien: 6000, energie: 1000, recettes: 0, capacite: 0,
    effets: { attractivite: 6, popularite: 6 }, proximite: true,
    desc: 'Fait venir les jeunes ménages. Coût de fonctionnement élevé pour sa taille.' },
  { id: 'ecole', nom: 'Groupe scolaire', icone: '🏫', cout: 1200000,
    entretien: 8000, energie: 1500, recettes: 0, capacite: 4000,
    effets: { popularite: 5 }, proximite: true,
    desc: 'Augmente la capacité d\'accueil de la commune (+4 000 habitants).' },
  { id: 'maison_sante', nom: 'Maison de santé', icone: '🩺', cout: 800000,
    entretien: 4000, energie: 800, recettes: 0, capacite: 0,
    effets: { attractivite: 8, popularite: 7 }, proximite: true,
    desc: 'Un médecin qui reste, des habitants qui restent aussi.' },
  { id: 'gymnase', nom: 'Gymnase', icone: '🤸', cout: 1100000,
    entretien: 7000, energie: 2000, recettes: 0, capacite: 0,
    effets: { attractivite: 4, popularite: 6 }, proximite: true,
    desc: 'Les associations le réclament depuis dix ans.' },
  { id: 'piscine', nom: 'Piscine municipale', icone: '🏊', cout: 2500000,
    entretien: 15000, energie: 6000, recettes: 6000, capacite: 0,
    effets: { attractivite: 10, popularite: 8 },
    desc: 'Le gouffre assumé : aucune piscine municipale n\'est rentable. Aucune.' },
  { id: 'marche', nom: 'Marché couvert', icone: '🧺', cout: 700000,
    entretien: 3500, energie: 500, recettes: 4500, capacite: 0,
    effets: { attractivite: 7 }, proximite: true,
    desc: 'Recettes de droits de place et un centre-bourg qui revit.' },
  { id: 'parking', nom: 'Parking payant', icone: '🅿️', cout: 500000,
    entretien: 1500, energie: 500, recettes: 5000, capacite: 1000,
    effets: {},
    desc: 'Rapporte tous les mois et soulage le stationnement. Personne ne vous en remerciera.' },
  { id: 'zone_activite', nom: 'Zone d\'activité', icone: '🏭', cout: 1500000,
    entretien: 3500, energie: 1000, recettes: 8000, capacite: 0,
    effets: { attractivite: 15 },
    desc: 'Des entreprises, des emplois, de l\'attractivité — et des recettes de service.' },
  { id: 'reseau_eau', nom: 'Renforcement réseau d\'eau', icone: '🚰', cout: 2000000,
    entretien: 5500, energie: 1500, recettes: 0, capacite: 5000,
    effets: {},
    desc: 'Invisible et indispensable : +5 000 habitants de capacité d\'accueil.' },
  { id: 'voirie_refection', nom: 'Réfection de voirie', icone: '🛣️', cout: 400000,
    entretien: 0, energie: 0, recettes: 0, capacite: 500,
    effets: { attractivite: 3 }, chantier: 'voirie', repetable: true,
    desc: 'Remet l\'état de la voirie à neuf. À refaire régulièrement, comme dans la vraie vie.' },
  { id: 'eclairage_led', nom: 'Passage de l\'éclairage en LED', icone: '💡', cout: 350000,
    entretien: 0, energie: -1500, recettes: 0, capacite: 0,
    effets: {}, chantier: 'eclairage',
    desc: 'Investissement qui RÉDUIT une dépense de fonctionnement. Le seul du catalogue.' },
];

/* ------------------------------------------------------------
   AIDES DE L'ÉTAT — payées en Capital préfecture
   ------------------------------------------------------------ */
const AIDES_ETAT = [
  { id: 'avance_treso', nom: 'Avance de trésorerie', capital: 25,
    desc: '+3 mois de dépenses en trésorerie, remboursable sur 12 mois (ligne de dette).' },
  { id: 'soutien_exceptionnel', nom: 'Soutien exceptionnel au redressement', capital: 60,
    desc: 'Remet la trésorerie à zéro si elle est négative. Une seule fois par mandat.' },
];

/* ------------------------------------------------------------
   OFFRES PRIVÉES — l'argent immédiat, la contrepartie plus tard
   ------------------------------------------------------------ */
const OFFRES_PRIVEES = [
  { id: 'mecenat_local', nom: 'Mécénat du Groupe Bertholet', icone: '🤝',
    montant: 400000, delai: 45, evenement: 'evt_naming',
    texte: 'Le Groupe Bertholet, premier employeur du canton, propose un mécénat de 400 000 € « sans condition ». Son directeur ajoute en souriant qu\'il « repassera vous voir ».' },
  { id: 'fondation', nom: 'Fondation Meridiane', icone: '🏦',
    montant: 250000, delai: 60, evenement: 'evt_exoneration',
    texte: 'La Fondation Meridiane offre 250 000 € pour « soutenir l\'action municipale ». Le siège régional du groupe est justement installé sur votre commune.' },
  { id: 'groupe_industriel', nom: 'Groupe Norvia', icone: '🏗️',
    montant: 900000, delai: 90, evenement: 'evt_terrain',
    texte: 'Le Groupe Norvia met 900 000 € sur la table. Sa direction immobilière évoque « un projet de développement local qui mérite d\'être accompagné ».' },
];

/* Événements différés : la facture arrive toujours */
const EVENEMENTS_DIFFERES = {
  evt_naming: {
    titre: 'Le Groupe Bertholet réclame son dû',
    texte: 'Comme promis, le directeur du Groupe Bertholet « repasse vous voir ». Il souhaite que le prochain équipement public porte le nom du groupe. La presse locale est déjà au courant.',
    options: [
      { libelle: 'Accepter le naming', effets: { popularite: -8 },
        note: 'Les habitants goûtent peu la « Halle Bertholet ». L\'affaire est close.' },
      { libelle: 'Refuser poliment', effets: { attractivite: -5 },
        note: 'Le groupe gèle ses projets locaux. Le monde économique s\'en souviendra.' },
    ],
  },
  evt_exoneration: {
    titre: 'La Fondation Meridiane sollicite une exonération',
    texte: 'Le groupe Meridiane demande une exonération de fiscalité locale pour son siège régional, « au regard de son engagement pour le territoire ».',
    options: [
      { libelle: 'Accorder l\'exonération (12 mois)', effets: { exoneration_mois: 12 },
        note: 'Recettes fiscales −5 % pendant 12 mois. Personne n\'en saura rien. Probablement.' },
      { libelle: 'Refuser', effets: { popularite: -3 },
        note: 'Le groupe fait savoir sa « déception » dans la presse économique régionale.' },
    ],
  },
  evt_terrain: {
    titre: 'Le Groupe Norvia veut son terrain',
    texte: 'Norvia demande la cession d\'un terrain communal en zone d\'activité pour y construire une plateforme logistique. Le dossier est solide, le rapport de force aussi.',
    options: [
      { libelle: 'Céder le terrain', effets: { attractivite: 6, cadre_logement: -12, popularite: -6 },
        note: 'Des emplois, des recettes futures — et des riverains furieux.' },
      { libelle: 'Refuser la cession', effets: { tresorerie: -300000 },
        note: 'Norvia exige un dédommagement négocié à 300 000 €. Vous auriez dû lire les petites lignes.' },
    ],
  },
};

/* ------------------------------------------------------------
   CRISES — délai court, escalade, option par défaut survivable.
   Les coûts sont calibrés pour 12 000 hab. et mis à l'échelle.
   ------------------------------------------------------------ */
const CRISES = [
  {
    id: 'crise_feu_foret', nom: 'Feu de forêt', icone: '🔥',
    famille: 'crises_naturelles', profils: ['rurale', 'touristique'],
    saisons: ['ete'], cooldown: 730, cout: 680000,
    texte: 'Un départ de feu s\'est déclaré sur le massif au nord de la commune. 40 hectares déjà touchés, le vent se lève. Les secours demandent des moyens supplémentaires. Trois hameaux sont menacés.',
    options: [
      { cle: 'A', libelle: 'Financer les moyens sur le budget communal',
        coutFacteur: 1, effets: { popularite: 12 },
        note: 'Contrôle total, résolution immédiate. Peut vider la trésorerie.' },
      { cle: 'B', libelle: 'Solliciter le fonds de catastrophe naturelle',
        coutFacteur: 0.1, capital: 50,
        differes: [{ jours: 3, effets: { cadre_voirie: -8, popularite: -4 },
          note: 'Le feu a progressé pendant 72 h.' }],
        note: 'Presque gratuit, mais le feu progresse 72 h. Dégâts finaux plus lourds.' },
      { cle: 'C', libelle: 'Accepter l\'offre du Groupe Norvia (moyens aériens privés)',
        coutFacteur: 0.18, effets: { popularite: 6 },
        differes: [{ jours: 60, evenement: 'evt_terrain' }],
        note: 'Rapide et peu cher. La contrepartie arrive dans deux mois.' },
      { cle: 'D', libelle: 'Moyens minimaux, laisser les secours gérer', defaut: true,
        coutFacteur: 0.06, effets: { popularite: -30, cadre_voirie: -15, cadre_logement: -10, population_pct: -2.5 },
        differes: [{ jours: 30, effets: { attractivite: -20 }, note: 'Les images du feu tournent encore.' }],
        note: 'Le minimum légal. La commune s\'en souviendra longtemps.' },
    ],
  },
  {
    id: 'crise_inondation', nom: 'Inondation de novembre', icone: '🌊',
    famille: 'crises_naturelles', profils: ['rurale', 'moyenne', 'touristique'],
    saisons: ['automne'], cooldown: 545, cout: 520000,
    texte: 'Trois jours de pluie, la rivière est sortie de son lit. Le quartier bas est sous 40 cm d\'eau, deux écoles fermées, la station d\'épuration menacée.',
    options: [
      { cle: 'A', libelle: 'Pompes, relogement, indemnisation immédiate',
        coutFacteur: 1, effets: { popularite: 10 },
        note: 'La commune est au rendez-vous. Le budget, moins.' },
      { cle: 'B', libelle: 'Solliciter le fonds de catastrophe naturelle',
        coutFacteur: 0.1, capital: 50,
        differes: [{ jours: 3, effets: { cadre_voirie: -6, cadre_logement: -5 },
          note: 'L\'eau a stagné 72 h de plus.' }],
        note: '90 % pris en charge, mais l\'eau stagne pendant l\'instruction.' },
      { cle: 'D', libelle: 'Laisser faire la décrue', defaut: true,
        coutFacteur: 0.08, effets: { popularite: -25, cadre_logement: -15, cadre_voirie: -10, population_pct: -1.5 },
        differes: [{ jours: 30, effets: { attractivite: -12 }, note: 'Les photos du quartier bas circulent.' }],
        note: 'La décrue viendra. Les habitants du quartier bas, eux, partiront.' },
    ],
  },
  {
    id: 'crise_canicule', nom: 'Canicule et restriction d\'eau', icone: '🌡️',
    famille: 'crises_naturelles', profils: ['rurale', 'moyenne', 'touristique'],
    saisons: ['ete'], cooldown: 365, cout: 180000,
    texte: 'Quatrième jour au-dessus de 39 °C. Le préfet impose des restrictions d\'eau. L\'EHPAD demande des climatiseurs, les habitants un plan canicule.',
    options: [
      { cle: 'A', libelle: 'Plan canicule complet (salles fraîches, portage d\'eau)',
        coutFacteur: 1, effets: { popularite: 8 },
        note: 'Coûteux mais exemplaire.' },
      { cle: 'B', libelle: 'Demander la dotation de solidarité',
        coutFacteur: 0.3, capital: 35,
        note: 'L\'État couvre 70 % du plan. Le capital préfecture en prend un coup.' },
      { cle: 'D', libelle: 'Ouvrir la mairie climatisée, point final', defaut: true,
        coutFacteur: 0.15, effets: { popularite: -18, cadre_proprete: -8 },
        differes: [{ jours: 15, effets: { attractivite: -6 }, note: '« La commune qui a laissé cuire ses anciens ».' }],
        note: 'Le service minimum, au sens propre.' },
    ],
  },
  {
    id: 'crise_tempete', nom: 'Tempête et toitures arrachées', icone: '🌪️',
    famille: 'crises_naturelles', profils: ['rurale', 'moyenne', 'touristique'],
    saisons: ['automne', 'hiver'], cooldown: 545, cout: 420000,
    texte: 'Rafales à 130 km/h cette nuit. Le gymnase est décoiffé, deux rues coupées par des arbres, trente toitures endommagées chez les particuliers.',
    options: [
      { cle: 'A', libelle: 'Réparations et déblaiement en régie, tout de suite',
        coutFacteur: 1, effets: { popularite: 9 },
        note: 'La commune répare, la commune paie.' },
      { cle: 'B', libelle: 'Solliciter le fonds de catastrophe naturelle',
        coutFacteur: 0.1, capital: 50,
        differes: [{ jours: 3, effets: { cadre_voirie: -7 }, note: 'Trois jours de rues coupées.' }],
        note: 'Presque tout est couvert, mais les rues restent coupées 72 h.' },
      { cle: 'D', libelle: 'Sécuriser le minimum, renvoyer vers les assurances', defaut: true,
        coutFacteur: 0.07, effets: { popularite: -20, cadre_voirie: -12 },
        note: 'Juridiquement défendable. Politiquement, beaucoup moins.' },
    ],
  },
  {
    id: 'crise_neige', nom: 'Épisode neigeux', icone: '❄️',
    famille: 'crises_naturelles', profils: ['rurale', 'moyenne'],
    saisons: ['hiver'], cooldown: 365, cout: 150000,
    texte: '25 cm en une nuit, du jamais-vu depuis 2010. Le déneigement patine, les bus scolaires sont à l\'arrêt, la métropole voisine a réquisitionné les prestataires.',
    options: [
      { cle: 'A', libelle: 'Louer des engins en urgence, saler toute la commune',
        coutFacteur: 1, effets: { popularite: 7 },
        note: 'Cher pour trois jours de neige. Mais la commune roule.' },
      { cle: 'B', libelle: 'Demander la dotation de solidarité',
        coutFacteur: 0.3, capital: 35,
        note: 'L\'État prend 70 %. Utiliser la préfecture pour de la neige, vraiment ?' },
      { cle: 'D', libelle: 'Dégager les axes principaux, attendre le redoux', defaut: true,
        coutFacteur: 0.2, effets: { popularite: -15, cadre_voirie: -8 },
        note: 'Le redoux est annoncé. Les chutes de personnes âgées aussi.' },
    ],
  },
  {
    id: 'crise_fuite_eau', nom: 'Fuite majeure sur le réseau d\'eau', icone: '💧',
    famille: 'crises_techniques', profils: ['rurale', 'moyenne', 'touristique'],
    saisons: ['printemps', 'ete', 'automne', 'hiver'], cooldown: 545, cout: 350000,
    texte: 'Une canalisation principale des années 60 a cédé sous la rue de la République. 4 000 foyers au filet d\'eau, la chaussée s\'affaisse.',
    options: [
      { cle: 'A', libelle: 'Chantier d\'urgence, réparation complète',
        coutFacteur: 1, effets: { popularite: 6 },
        note: 'Réparé en 48 h, chaussée refaite.' },
      { cle: 'B', libelle: 'Solliciter le fonds d\'urgence',
        coutFacteur: 0.1, capital: 50,
        differes: [{ jours: 3, effets: { cadre_proprete: -6, popularite: -4 }, note: '72 h au filet d\'eau.' }],
        note: 'Presque gratuit, mais 4 000 foyers attendent 72 h.' },
      { cle: 'D', libelle: 'Réparation provisoire par manchon', defaut: true,
        coutFacteur: 0.12, effets: { popularite: -12, capacite: -1500 },
        note: 'Ça tiendra. La capacité du réseau, elle, est durablement réduite (−1 500 hab.).' },
    ],
  },
  {
    id: 'crise_usine', nom: 'Fermeture de la dernière usine', icone: '🏚️',
    famille: 'crises_economiques', profils: ['rurale', 'moyenne'],
    saisons: ['printemps', 'automne', 'hiver'], cooldown: 9999, cout: 400000, moisMin: 6,
    texte: 'Le site Provelec ferme : 140 emplois supprimés. Les familles parlent déjà de partir. La CGT occupe le rond-point, la presse nationale arrive demain.',
    options: [
      { cle: 'A', libelle: 'Plan de reconversion du site (rachat partiel, pépinière)',
        coutFacteur: 1, effets: { popularite: 8, attractivite: -4 },
        note: 'Ambitieux. Le site revivra — dans deux ans.' },
      { cle: 'C', libelle: 'Laisser le Groupe Norvia reprendre le site',
        coutFacteur: 0.1, effets: { popularite: 3, attractivite: 4 },
        differes: [{ jours: 90, evenement: 'evt_terrain' }],
        note: 'Norvia « sauve » le site. Il vous en coûtera autre chose.' },
      { cle: 'D', libelle: 'Compatir, et rappeler que la commune n\'y peut rien', defaut: true,
        coutFacteur: 0.02, effets: { popularite: -15, attractivite: -15 },
        differes: [{ jours: 30, effets: { population_pct: -1.2 }, note: 'Les premières familles déménagent.' }],
        note: 'C\'est factuellement vrai. Ça ne retiendra personne.' },
    ],
  },
];

/* Modulateurs de profil appliqués aux effets négatifs des crises */
const MODULATEURS_PROFIL = {
  touristique: { attractivite: 2.0 },  // la saison est compromise
  rurale: { population_pct: 1.5 },     // chaque départ pèse double
};

const SAISONS = ['hiver', 'hiver', 'printemps', 'printemps', 'printemps', 'ete', 'ete', 'ete', 'automne', 'automne', 'automne', 'hiver'];
const NOMS_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_DEBUT_MANDAT = 3; // avril — lendemain des élections
