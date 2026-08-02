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
    nom: 'Saint-Aubin-le-Bourg', label: 'Campagne', icone: '🌾',
    population: 2800, attractivite: 48, popularite: 58,
    desc: 'Petit budget, petites crises. La moindre dépense compte, mais tout est plus lent.',
  },
  moyenne: {
    nom: 'Villeneuve-sur-Sarthe', label: 'Classique', icone: '🏘️',
    population: 12000, attractivite: 52, popularite: 55,
    desc: 'Le profil de référence. Marges correctes, patrimoine déjà lourd à entretenir.',
  },
  touristique: {
    nom: 'Port-Miran', label: 'Littoral', icone: '⛱️',
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

/* ------------------------------------------------------------
   COURRIER DU MAIRE — questions du quotidien à choix multiples.
   Courtes, drôles, sans piège mortel : chaque réponse est jouable.
   Les montants sont calibrés pour 12 000 hab. et mis à l'échelle.
   ------------------------------------------------------------ */
const QUESTIONS = [
  { id: 'q_food_truck', icone: '🚚',
    texte: 'Un food-truck de burgers veut s\'installer sur la place. Le kebab d\'en face crie à la concurrence déloyale.',
    options: [
      { libelle: 'L\'autoriser', effets: { tresorerie: 3000, attractivite: 4, popularite: 2 },
        note: 'Droit de place encaissé. File d\'attente dès le premier soir.' },
      { libelle: 'Seulement le week-end', effets: { tresorerie: 1500, attractivite: 2 },
        note: 'Un compromis à la française. Tout le monde râle un peu, personne ne proteste.' },
      { libelle: 'Refuser', effets: { popularite: -2 },
        note: 'Le kebab t\'offre un sandwich. La jeunesse t\'en veut.' },
    ] },
  { id: 'q_nid_poule', icone: '🕳️',
    texte: 'Le nid-de-poule de la rue de la Gare a désormais sa page sur les réseaux. 12 000 abonnés.',
    options: [
      { libelle: 'Le reboucher en urgence', effets: { tresorerie: -15000, cadre_voirie: 4, popularite: 3 },
        note: 'La page publie un hommage funèbre. Les suspensions te remercient.' },
      { libelle: 'Poser un panneau « danger »', effets: { tresorerie: -800, popularite: -1 },
        note: 'Le panneau devient une star lui aussi.' },
      { libelle: 'Attendre le budget de l\'an prochain', effets: { popularite: -4, cadre_voirie: -2 },
        note: 'La page passe à 20 000 abonnés. Il y a des produits dérivés.' },
    ] },
  { id: 'q_club_foot', icone: '⚽',
    texte: 'Le club de foot monte en division ! Il demande des maillots neufs. Et un minibus, tant qu\'à faire.',
    options: [
      { libelle: 'Maillots + minibus', effets: { tresorerie: -28000, popularite: 6 },
        note: 'Le capitaine te dédie la montée. Ton nom est chanté en tribune.' },
      { libelle: 'Juste les maillots', effets: { tresorerie: -6000, popularite: 2 },
        note: 'Ils floquent « Merci la mairie » dans le dos. C\'est déjà ça.' },
      { libelle: 'Une banderole d\'encouragement', effets: { popularite: -3 },
        note: '« Allez les gars ». L\'intention compte, paraît-il.' },
    ] },
  { id: 'q_graffiti', icone: '🎨',
    texte: 'Une fresque sauvage est apparue sur la salle des fêtes. Moitié street-art, moitié gribouillage.',
    options: [
      { libelle: 'Payer l\'artiste pour la finir', effets: { tresorerie: -8000, attractivite: 5, popularite: 2 },
        note: 'Des gens font des selfies devant. La commune d\'à côté est jalouse.' },
      { libelle: 'La faire effacer', effets: { tresorerie: -4000, cadre_proprete: 3 },
        note: 'Mur propre, débat clos. L\'artiste signera ailleurs.' },
      { libelle: 'Ne rien faire', effets: { cadre_proprete: -3 },
        note: 'Trois nouveaux tags apparaissent. Moins inspirés.' },
    ] },
  { id: 'q_cantine', icone: '🥦',
    texte: 'La cantine propose de passer au bio local. C\'est 15 % plus cher, mais « c\'est pour les enfants ».',
    options: [
      { libelle: 'Passer au bio local', effets: { tresorerie: -20000, popularite: 5, attractivite: 2 },
        note: 'Les parents applaudissent. Les enfants réclament toujours des frites.' },
      { libelle: 'Un jour bio par semaine', effets: { tresorerie: -5000, popularite: 2 },
        note: 'Le jeudi, c\'est quinoa. Le vendredi, la vie reprend.' },
      { libelle: 'Rester au menu actuel', effets: { popularite: -2 },
        note: 'Une pétition circule. Signée par des CM2, mais quand même.' },
    ] },
  { id: 'q_influenceur', icone: '🤳',
    texte: 'Un influenceur (2 millions d\'abonnés) veut tourner « La France qu\'on aime » chez toi. Il demande un accueil « à la hauteur ».',
    options: [
      { libelle: 'Tapis rouge et buffet', effets: { tresorerie: -12000, attractivite: 8 },
        note: 'La vidéo fait 3 millions de vues. Les gîtes sont complets pour l\'été.' },
      { libelle: 'Accueil normal', effets: { attractivite: 3 },
        note: 'Il tourne quand même. La vidéo est « authentique », dit-il.' },
      { libelle: 'Refuser le tournage', effets: { attractivite: -2, popularite: 1 },
        note: 'Les habitants apprécient la tranquillité retrouvée.' },
    ] },
  { id: 'q_pigeons', icone: '🐦',
    texte: 'Les pigeons ont colonisé la place. La statue du fondateur de la ville n\'a plus figure humaine.',
    options: [
      { libelle: 'Effaroucheurs + grand nettoyage', effets: { tresorerie: -7000, cadre_proprete: 4 },
        note: 'La statue retrouve son regard noble. Les pigeons déménagent chez le voisin.' },
      { libelle: 'Un fauconnier une fois par mois', effets: { tresorerie: -3000, cadre_proprete: 2, attractivite: 1 },
        note: 'Le faucon a désormais sa page fan. Plus populaire que toi.' },
      { libelle: '« C\'est la nature »', effets: { cadre_proprete: -3 },
        note: 'Le fondateur de la ville disparaît sous les fientes. Dignement.' },
    ] },
  { id: 'q_banc', icone: '🪑',
    texte: 'Madame Rosa, 87 ans, demande un banc à l\'arrêt de bus. Elle attend debout depuis 1962.',
    options: [
      { libelle: 'Un banc, avec plaque à son nom', effets: { tresorerie: -1500, popularite: 4 },
        note: '« Banc Rosa ». Elle pleure. Le journal local fait sa une.' },
      { libelle: 'Un banc standard', effets: { tresorerie: -900, popularite: 2 },
        note: 'Elle s\'assoit. 63 ans d\'attente, mais elle s\'assoit.' },
      { libelle: '« On va étudier la demande »', effets: { popularite: -2 },
        note: 'Elle attendra debout. Comme depuis 1962.' },
    ] },
  { id: 'q_marche', icone: '🧺',
    texte: 'Les commerçants veulent étendre le marché au dimanche. Les riverains tiennent à leur grasse matinée.',
    options: [
      { libelle: 'Marché le dimanche', effets: { tresorerie: 4000, attractivite: 3, cadre_proprete: -2 },
        note: 'Droits de place en hausse. Réveil à 6 h pour tout le quartier.' },
      { libelle: 'Une fois par mois', effets: { tresorerie: 1500, attractivite: 1 },
        note: 'Le premier dimanche du mois, ça sent la rôtisserie.' },
      { libelle: 'Refuser', effets: { popularite: -1 },
        note: 'Les commerçants soupirent. Les riverains dorment.' },
    ] },
  { id: 'q_compost', icone: '🌱',
    texte: 'Des habitants veulent un compost collectif. D\'autres prédisent « une montagne d\'épluchures en plein centre ».',
    options: [
      { libelle: 'Installer trois composteurs', effets: { tresorerie: -3500, cadre_proprete: 3, popularite: 2 },
        note: 'Six mois plus tard : zéro montagne, un potager partagé.' },
      { libelle: 'Refuser', effets: { popularite: -1 },
        note: 'Les épluchures finissent à la poubelle, comme la proposition.' },
    ] },
  { id: 'q_sapin', icone: '🎄', saisons: ['hiver'],
    texte: 'Décembre approche. Sapin géant avec illuminations, ou sobriété assumée ?',
    options: [
      { libelle: 'Sapin géant + illuminations', effets: { tresorerie: -18000, popularite: 6, attractivite: 3 },
        note: 'On vient des communes voisines pour la photo. Ça brille jusqu\'en janvier.' },
      { libelle: 'Sapin local, guirlandes d\'occasion', effets: { tresorerie: -4000, popularite: 2 },
        note: 'C\'est mignon. Un peu penché, mais mignon.' },
      { libelle: 'Pas de sapin cette année', effets: { popularite: -5 },
        note: 'Le Grinch, c\'est toi.' },
    ] },
  { id: 'q_jeux_eau', icone: '☀️', saisons: ['ete'],
    texte: 'Gros week-end de chaleur annoncé. Les familles demandent l\'ouverture gratuite des jeux d\'eau.',
    options: [
      { libelle: 'Gratuit tout le week-end', effets: { tresorerie: -6000, popularite: 5 },
        note: 'La place se transforme en plage. Tout le monde est trempé et content.' },
      { libelle: 'Tarif réduit', effets: { tresorerie: -2000, popularite: 2 },
        note: 'Raisonnable. Comme toujours.' },
      { libelle: 'Tarif normal', effets: { popularite: -2 },
        note: 'Les enfants te surnomment « le maire sec ».' },
    ] },
  { id: 'q_brocante', icone: '📦',
    texte: 'La grande brocante annuelle demande deux rues de plus et le prêt de la sono municipale.',
    options: [
      { libelle: 'Tout accorder', effets: { tresorerie: -2500, attractivite: 4, popularite: 3, cadre_proprete: -2 },
        note: '300 exposants, 5 000 visiteurs, 1 tonne de vaisselle dépareillée vendue.' },
      { libelle: 'Comme l\'an dernier, pas plus', effets: { popularite: -2 },
        note: 'Les organisateurs maugréent entre deux stands de vinyles.' },
    ] },
  { id: 'q_startup', icone: '💻',
    texte: 'Une start-up « révolutionnaire » veut installer ses bureaux en centre-ville. Elle demande la fibre et un loyer sympa.',
    options: [
      { libelle: 'Dérouler la fibre, loyer réduit', effets: { tresorerie: -10000, attractivite: 6 },
        note: 'Douze salariés déjeunent chez les commerçants tous les midis.' },
      { libelle: 'Les accueillir sans faveur', effets: { attractivite: 2 },
        note: 'Ils s\'installent quand même. Leur machine à café coûte plus cher que ta fibre.' },
      { libelle: 'Méfiance', effets: { attractivite: -1 },
        note: 'Ils partent dans la commune d\'à côté. Leur appli cartonne. Évidemment.' },
    ] },
  { id: 'q_panneau', icone: '🪧',
    texte: 'Le panneau d\'entrée de ville est tordu depuis « l\'incident du tracteur ». Tout le monde a une théorie.',
    options: [
      { libelle: 'Panneau neuf + massif fleuri', effets: { tresorerie: -5000, attractivite: 3, cadre_voirie: 1 },
        note: 'Première impression impeccable. Le tracteur reste introuvable.' },
      { libelle: 'Le redresser au cric', effets: { tresorerie: -300 },
        note: 'Il penche de l\'autre côté maintenant. Ça a du charme.' },
    ] },
  { id: 'q_chats', icone: '🐈',
    texte: 'Une colonie de chats errants a élu domicile derrière la mairie. Les réseaux les adorent. Les riverains moins.',
    options: [
      { libelle: 'Stérilisation + abri propre', effets: { tresorerie: -6000, popularite: 3, cadre_proprete: 2 },
        note: 'L\'association locale te canonise. Les chats restent, mais organisés.' },
      { libelle: 'Laisser faire', effets: { cadre_proprete: -2, attractivite: 1 },
        note: 'Ils ont un compte Instagram maintenant. Plus suivi que celui de la mairie.' },
    ] },
  { id: 'q_kermesse', icone: '🎪',
    texte: 'Kermesse de l\'école : on te demande des barnums, un service de sécurité… et de tenir le stand chamboule-tout.',
    options: [
      { libelle: 'Tout ça, et je tiens le stand', effets: { tresorerie: -2000, popularite: 5 },
        note: 'Tu prends trois balles dans l\'épaule. Meilleur score de popularité de l\'année.' },
      { libelle: 'Juste les barnums', effets: { tresorerie: -800, popularite: 1 },
        note: 'Service minimum. La directrice le note dans un petit carnet.' },
    ] },
  { id: 'q_lotissement', icone: '💡',
    texte: 'Le lotissement des Acacias réclame un vrai éclairage public, « comme en ville ».',
    options: [
      { libelle: 'Installer l\'éclairage complet', effets: { tresorerie: -22000, cadre_eclairage: 5, popularite: 3 },
        note: 'Les Acacias brillent. Les moustiques aussi sont ravis.' },
      { libelle: 'Des lampadaires solaires', effets: { tresorerie: -9000, cadre_eclairage: 2 },
        note: 'Écologique, économique, et un peu faiblard en décembre.' },
      { libelle: '« La nuit, c\'est fait pour dormir »', effets: { popularite: -3 },
        note: 'La phrase finit sur les réseaux. Sortie de son contexte, évidemment.' },
    ] },
];

/* Modulateurs de profil appliqués aux effets négatifs des crises */
const MODULATEURS_PROFIL = {
  touristique: { attractivite: 2.0 },  // la saison est compromise
  rurale: { population_pct: 1.5 },     // chaque départ pèse double
};

/* ------------------------------------------------------------
   PROGRESSION — niveaux de maire et leurs titres
   ------------------------------------------------------------ */
const TITRES_MAIRE = [
  'Stagiaire de la mairie',
  'Adjoint au sous-adjoint',
  'Maire débutant',
  'Maire qui gère',
  'Pro du béton armé',
  'Star du canton',
  'Baron local',
  'Légende départementale',
  'Ministre pressenti',
  'Monument historique vivant',
];

/* Gaston, ton adjoint — il annonce tout, il ne décide de rien */
const ADJOINT = { nom: 'Gaston', icone: '🧑‍💼' };
const PHRASES_ADJOINT = {
  courrier: [
    'Un pli pour vous, patron !',
    'Ça vient d\'arriver. Et c\'est signé.',
    'Les habitants attendent une réponse. De préférence la bonne.',
    'Encore du courrier. J\'ai pris la liberté de ne pas le perdre.',
    'On vous demande à l\'accueil. Enfin, par écrit.',
  ],
  crise: [
    'Patron… on a un GROS problème.',
    'Restez calme. Moi je n\'y arrive pas, mais vous, restez calme.',
    'J\'ai trois appels en attente et aucun n\'est une bonne nouvelle.',
    'C\'est le genre de journée qui finit dans le journal.',
  ],
  evenement: [
    'Vous vous souvenez de cette « affaire réglée » ? Elle est revenue.',
    'Il paraît que rien n\'est jamais gratuit. Il paraît bien.',
  ],
};

const SAISONS = ['hiver', 'hiver', 'printemps', 'printemps', 'printemps', 'ete', 'ete', 'ete', 'automne', 'automne', 'automne', 'hiver'];
const NOMS_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_DEBUT_MANDAT = 3; // avril — lendemain des élections
