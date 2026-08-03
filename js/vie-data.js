/* ============================================================
   BIG CITY LIFE — Données du jeu de vie
   Familles, amis, filières, lieux et activités, scènes,
   études, jobs, objectifs. De 15 à 30 ans dans ta vraie ville.
   ============================================================ */

/* Un tour de jeu = UNE SAISON (3 mois). La vie entière tient en
   ~40 décisions : le bac au tour 12, le bilan à 25 ans (tour 41). */
const VIE_CFG = {
  MOIS_DEPART: 8,        // on commence en septembre (rentrée de seconde)
  AGE_DEPART: 15,
  ANNEE_DEPART: 2026,    // année civile de la rentrée de seconde
  MOIS_BAC: 12,          // juin de l'année de terminale (12ᵉ saison)
  MOIS_DIPLOME: 24,      // juin, trois ans après le bac
  MOIS_FIN: 41,          // 25 ans : l'heure du bilan
  PROBA_SCENE: 0.55,     // chance de scène de vie chaque saison
  PROBA_RARE: 0.07,      // chance d'un MOMENT RARE (une seule fois chacun)
  DECAY: { energie: 8, moral: 6, social: 4, forme: 3, relation: 3 },
};

const AVATARS_VIE = {
  homme: ['👦🏻', '👦🏼', '👦🏽', '👦🏾', '👦🏿', '🧑🏻‍🦱', '🧑🏽‍🦱', '👨🏻‍🦰', '🧑🏾‍🦲', '🧑🏼'],
  femme: ['👧🏻', '👧🏼', '👧🏽', '👧🏾', '👧🏿', '👩🏻‍🦱', '👩🏽‍🦱', '👩🏻‍🦰', '👱🏼‍♀️', '🧕🏽'],
};

/* ------------------------------------------------------------
   LE CADRE FAMILIAL — il colore toute la partie
   ------------------------------------------------------------ */
const FAMILLES = [
  { id: 'aisee', nom: 'Famille aisée & exigeante', icone: '🏡',
    desc: 'Grande maison, gros argent de poche… et des attentes XXL. « Alors, ces notes ? »',
    argentPoche: 80, argentDepart: 300,
    bonus: { savoir: 1 }, malus: { moral: 2 },
    ambiance: 'Tes parents scrutent tes bulletins comme des traders.' },
  { id: 'moyenne', nom: 'Classe moyenne tranquille', icone: '🏢',
    desc: 'Pavillon, barbecue le dimanche, personne ne crie. L\'équilibre.',
    argentPoche: 40, argentDepart: 150,
    bonus: {}, malus: {},
    ambiance: 'On ne roule pas sur l\'or, mais on rit à table.' },
  { id: 'modeste', nom: 'Famille modeste & aimante', icone: '🏘️',
    desc: 'Peu d\'argent de poche, beaucoup d\'amour. Tu apprends à te débrouiller tôt.',
    argentPoche: 15, argentDepart: 50,
    bonus: { moral: 2 }, malus: {},
    ambiance: 'Chez toi, on répare au lieu de racheter — et ça rend malin.' },
  { id: 'boheme', nom: 'Famille bohème', icone: '🎸',
    desc: 'Un parent artiste, des vinyles partout, des fins de mois en freestyle.',
    argentPoche: 30, argentDepart: 100,
    bonus: { social: 2 }, malus: { savoir: 0.5 },
    ambiance: 'Les devoirs, oui, mais après la répète.' },
];

/* ------------------------------------------------------------
   LES AMIS — choisis-en deux au départ, garde-les à vie (ou pas)
   ------------------------------------------------------------ */
const AMIS = [
  { id: 'sam', nom: 'Sam', icone: '🤓', titre: 'le premier de la classe',
    desc: 'Fiches de révision plastifiées. Réviser avec Sam, c\'est +2 de moyenne.',
    bonusActivite: { savoir: 4 } },
  { id: 'theo', nom: 'Théo', icone: '🎮', titre: 'le gamer',
    desc: 'Connaît tous les bons plans gratuits de la ville. Soirées manette garanties.',
    bonusActivite: { moral: 4 } },
  { id: 'ines', nom: 'Inès', icone: '⚽', titre: 'la sportive',
    desc: 'T\'embarque courir à 7 h du matin. Tu la détestes. Tu te sens en forme.',
    bonusActivite: { forme: 4 } },
  { id: 'lea', nom: 'Léa', icone: '🎤', titre: 'la sociale',
    desc: 'Connaît tout le monde, invitée partout — et toi avec, du coup.',
    bonusActivite: { social: 4 } },
  { id: 'marco', nom: 'Marco', icone: '🛹', titre: 'le débrouillard',
    desc: 'Toujours un plan pour gagner trois sous. Pas toujours très réglementaire.',
    bonusActivite: { argent: 15 } },
];

/* ------------------------------------------------------------
   FILIÈRES puis ÉTUDES puis MÉTIERS
   ------------------------------------------------------------ */
const FILIERES = [
  { id: 'generale', nom: 'Générale', icone: '📖',
    desc: 'Le grand classique : beaucoup de théorie, toutes les portes restent ouvertes.',
    savoirMois: 2.2 },
  { id: 'techno', nom: 'Technologique', icone: '🔧',
    desc: 'Du concret et de la théorie. Solide, polyvalent, sous-coté.',
    savoirMois: 1.8 },
  { id: 'pro', nom: 'Pro / Apprentissage', icone: '🧰',
    desc: 'Un métier dans les mains dès le lycée — et un salaire d\'apprenti (150 €/mois).',
    savoirMois: 1.3, salaireApprenti: 150 },
];

const ORIENTATIONS = [
  { id: 'longues', nom: 'Études longues', icone: '🎓', minSavoir: 55,
    desc: 'Fac ou école : cinq ans à bosser, un futur métier qui paie.',
    savoirMois: 2.4, cout: 60 },
  { id: 'courtes', nom: 'BTS / BUT', icone: '📐', minSavoir: 35,
    desc: 'Deux-trois ans efficaces, un boulot concret au bout.',
    savoirMois: 1.8, cout: 30 },
  { id: 'travail', nom: 'Travailler direct', icone: '💼', minSavoir: 0,
    desc: 'Fini l\'école : un salaire tout de suite, une carrière à construire à la force du poignet.',
    savoirMois: 0.5 },
];

/* Métier attribué au moment d'entrer dans la vie active */
/* Les carrières de rêve : on s'entraîne, on se fait repérer, on tente sa chance */
const REVES = {
  foot: { nom: 'Footballeur·se pro', icone: '⚽', stat: 'forme', seuilReperage: 62,
    reperage: 'Un recruteur du centre de formation t\'observe depuis trois entraînements. Il s\'approche : « Tu as quelque chose. Un essai, ça te dit ? »',
    essai: 'L\'essai au centre de formation : deux heures sous les yeux des coachs, jambes en feu, cœur à 200.',
    reussite: 'Le coach te serre la main : « Bienvenue au club. » CONTRAT PRO. Tes potes hurlent dans les gradins.',
    echec: 'Pas cette fois. « Reviens plus fort », dit le coach. Et tu reviendras.' },
  musique: { nom: 'Chanteur·se', icone: '🎤', stat: 'social', seuilReperage: 62,
    reperage: 'Après ta répète, une programmatrice de festival t\'attend : « J\'ai entendu ta voix. Viens auditionner. »',
    essai: 'L\'audition : une salle vide, trois personnes derrière une table, et ta voix. Juste ta voix.',
    reussite: '« On te signe. » Premier single, premières scènes, premiers fans. Ta vie bascule en musique.',
    echec: '« Il manque un petit truc. Travaille, reviens. » Le micro te reverra.' },
};

const QUESTIONS_ENTRETIEN = [
  { q: '« Parlez-moi de vous. »', options: [
    { txt: 'Un pitch clair, deux anecdotes préparées', bon: true },
    { txt: '« Alors moi j\'aime bien les gens, voilà voilà »', bon: false },
    { txt: 'Réciter ton CV mot pour mot, dates incluses', bon: false },
  ] },
  { q: '« Pourquoi vous et pas quelqu\'un d\'autre ? »', options: [
    { txt: 'Relier tes points forts au poste, exemples à l\'appui', bon: true },
    { txt: '« Parce que j\'ai vraiment besoin d\'argent »', bon: false },
    { txt: '« Bonne question… » (long silence)', bon: false },
  ] },
  { q: '« Vous avez une question pour nous ? »', options: [
    { txt: 'Demander à quoi ressemble une semaine type', bon: true },
    { txt: '« Ça paye combien, déjà ? »', bon: false },
    { txt: '« Non non, c\'est bon, merci »', bon: false },
  ] },
];

const METIERS = [
  { id: 'foot', nom: 'Footballeur·se pro', icone: '⚽', orientation: 'reve', minSavoir: 0, salaire: 4800 },
  { id: 'musique', nom: 'Chanteur·se', icone: '🎤', orientation: 'reve', minSavoir: 0, salaire: 3400 },
  { id: 'ingenieur', nom: 'Ingénieur·e', icone: '🛠️', orientation: 'longues', minSavoir: 75, salaire: 2600 },
  { id: 'prof', nom: 'Prof', icone: '📚', orientation: 'longues', minSavoir: 60, salaire: 2000 },
  { id: 'comm', nom: 'Chargé·e de comm', icone: '📣', orientation: 'longues', minSavoir: 0, salaire: 1900 },
  { id: 'technicien', nom: 'Technicien·ne', icone: '⚙️', orientation: 'courtes', minSavoir: 50, salaire: 1900 },
  { id: 'infirmier', nom: 'Infirmier·ère', icone: '🩺', orientation: 'courtes', minSavoir: 40, salaire: 1800 },
  { id: 'commercial', nom: 'Commercial·e', icone: '🤝', orientation: 'courtes', minSavoir: 0, salaire: 1700 },
  { id: 'artisan', nom: 'Artisan·e', icone: '🔨', orientation: 'travail', filiere: 'pro', minSavoir: 35, salaire: 1800 },
  { id: 'vendeur', nom: 'Vendeur·se', icone: '🏬', orientation: 'travail', minSavoir: 0, salaire: 1450 },
  { id: 'livreur', nom: 'Livreur·se', icone: '📦', orientation: 'travail', minSavoir: 0, salaire: 1400 },
];

/* ------------------------------------------------------------
   LES LIEUX DE LA VILLE — on s'y déplace, on y vit
   phases : lycee | etudes | travail (absent = toutes)
   ------------------------------------------------------------ */
const LIEUX = [
  { id: 'maison', nom: 'Chez toi', icone: '🏠', pos: { x: 0.40, y: 0.60 },
    activites: [
      { id: 'sieste', nom: '😴 Grosse sieste & séries', effets: { energie: 30, moral: 8 },
        note: 'Batterie rechargée, saison terminée.' },
      { id: 'aider', nom: '🧹 Aider à la maison', effets: { argent: 25, energie: -5, moral: 3 },
        note: 'Argent de poche bonus et parents ravis.' },
      { id: 'reviser', nom: '📝 Réviser dans ta chambre', effets: { savoir: 5, energie: -10 },
        note: 'Porte fermée, musique à fond, fiches partout.' },
    ] },
  { id: 'ecole', nom: 'Lycée', icone: '🏫', pos: { x: 0.55, y: 0.47 },
    activites: [
      { id: 'bosser', nom: '📚 À fond en cours', effets: { savoir: 6, energie: -12 },
        note: 'Premier rang, main levée. Ça paiera.' },
      { id: 'secher', nom: '🙈 Sécher avec les potes', effets: { moral: 12, social: 6, savoir: -4 },
        note: 'Une matinée de liberté totale. Pourvu que ça ne se sache pas.' },
    ] },
  { id: 'biblio', nom: 'Bibliothèque', icone: '📖', pos: { x: 0.60, y: 0.56 },
    activites: [
      { id: 'etudier', nom: '🤫 Étudier au calme', effets: { savoir: 8, energie: -12 },
        note: 'Trois heures de concentration pure. Gratuit, en plus.' },
    ] },
  { id: 'stade', nom: 'Stade', icone: '⚽', pos: { x: 0.34, y: 0.44 },
    activites: [
      { id: 'sport', nom: '🏃 Séance de sport', effets: { forme: 15, moral: 6, energie: -8 },
        note: 'Courbatures demain, fierté aujourd\'hui.' },
      { id: 'match', nom: '⚽ Match entre potes', effets: { forme: 10, social: 8, moral: 8, energie: -10 },
        note: 'Score contesté, fou rire général.' },
      { id: 'entrainement', nom: '🥅 Entraînement de foot intensif', effets: { forme: 12, energie: -15 },
        talent: 'foot', talentGain: 7,
        note: 'Frappes, sprints, gainage. Tu progresses, ça se voit.' },
    ] },
  { id: 'cafe', nom: 'Café de la place', icone: '☕', pos: { x: 0.49, y: 0.575 },
    activites: [
      { id: 'papoter', nom: '💬 Refaire le monde', effets: { social: 10, moral: 8, argent: -8 },
        note: 'Trois heures, deux cafés, zéro conclusion. Parfait.' },
    ] },
  { id: 'cine', nom: 'Cinéma', icone: '🎬', pos: { x: 0.575, y: 0.63 },
    activites: [
      { id: 'seance', nom: '🍿 Séance + popcorn', effets: { moral: 14, argent: -12 },
        note: 'Le film était moyen. Le popcorn, exceptionnel.' },
    ] },
  { id: 'parc', nom: 'Parc', icone: '🌳', pos: { x: 0.44, y: 0.50 },
    activites: [
      { id: 'chill', nom: '🧺 Chill au parc', effets: { moral: 10, energie: 10 },
        note: 'Herbe, nuages, zéro euro. La vie simple.' },
      { id: 'skate', nom: '🛹 Session skate', effets: { forme: 8, social: 6, moral: 8, energie: -6 },
        note: 'Tu as failli rentrer le trick. Failli.' },
    ] },
  { id: 'centre', nom: 'Centre commercial', icone: '🛍️', pos: { x: 0.63, y: 0.52 },
    activites: [
      { id: 'shopping', nom: '🛍️ Virée shopping', effets: { moral: 14, social: 4, argent: -40 },
        note: 'Tu n\'avais besoin de rien. Tu as trouvé trois trucs.' },
      { id: 'job', nom: '🧾 Petit boulot (caisse)', effets: { argent: 150, energie: -20, savoir: -1 }, ageMin: 16,
        note: 'Un mois de samedis en caisse. « Bonjour, vous avez la carte ? »' },
    ] },
  { id: 'salle', nom: 'Salle de concert', icone: '🎸', pos: { x: 0.37, y: 0.55 },
    activites: [
      { id: 'concert', nom: '🎶 Concert du samedi', effets: { moral: 14, social: 10, argent: -25, energie: -8 },
        note: 'Les oreilles sifflent encore. Ça valait chaque décibel.' },
      { id: 'chant', nom: '🎤 Répéter ton chant', effets: { moral: 8, social: 4, energie: -8 },
        talent: 'musique', talentGain: 7,
        note: 'La salle te prête le micro le mardi soir. Ta voix porte de plus en plus.' },
    ] },
  { id: 'eau', nom: 'Bord de l\'eau', icone: '🏖️', pos: { x: 0.50, y: 0.70 },
    activites: [
      { id: 'baignade', nom: '🌊 Journée au bord de l\'eau', effets: { moral: 14, energie: 12, forme: 4 },
        note: 'Peau salée ou pieds dans la rivière : reset complet.' },
    ] },
];

/* ------------------------------------------------------------
   SCÈNES DE VIE — à choix multiples, tirées sans remise
   phases optionnelles ; `ami` remplacé par un de tes amis
   ------------------------------------------------------------ */
const SCENES_VIE = [
  { id: 's_controle', icone: '📝', phases: ['lycee', 'etudes'], de: 'prof',
    texte: 'Contrôle surprise demain. Ce soir, {ami} propose une soirée jeux « historique »…',
    options: [
      { txt: '📚 Réviser, tant pis pour la soirée', effets: { savoir: 6, moral: -4 }, note: 'Tu as fini par t\'endormir sur tes fiches. Mais tu étais prêt·e.' },
      { txt: '🎮 La soirée. On vit qu\'une fois', effets: { moral: 10, relation: 10, savoir: -4 }, note: 'Soirée légendaire. Le contrôle, beaucoup moins.' },
      { txt: '🤝 Négocier : révisions CHEZ {ami}', effets: { savoir: 3, relation: 6, moral: 4 }, note: 'Deux heures de fiches, trois heures de jeux. Honorable.' },
    ] },
  { id: 's_rumeur', icone: '🗣️', de: 'ami',
    texte: 'Une rumeur débile circule sur {ami}. Tout le monde en parle au bahut.',
    options: [
      { txt: '🛡️ La démonter publiquement', effets: { relation: 15, social: 5, moral: 3 }, note: '{ami} ne l\'oubliera jamais.' },
      { txt: '🤫 Rester en dehors de ça', effets: { relation: -8 }, note: '{ami} a remarqué ton silence. Aïe.' },
    ] },
  { id: 's_anniv', icone: '🎂', de: 'famille',
    texte: 'L\'anniversaire de ta grand-mère tombe le même jour que LA soirée de l\'année.',
    options: [
      { txt: '👵 Mamie d\'abord', effets: { moral: 8, social: -4 }, note: 'Elle t\'a raconté sa jeunesse. C\'était mieux que la soirée, en vrai.' },
      { txt: '🎉 La soirée (tu passeras dimanche)', effets: { social: 10, moral: 4 }, note: 'Mamie a dit « je comprends » avec un petit sourire. Ouch.' },
    ] },
  { id: 's_portable', icone: '📱', de: 'famille', phases: ['lycee'],
    texte: 'Tes parents menacent de confisquer ton téléphone : « toujours dessus ! »',
    options: [
      { txt: '🤝 Proposer un deal : pas de tel à table', effets: { moral: 4, savoir: 2 }, note: 'Négociation de haut niveau. Tout le monde est fier.' },
      { txt: '🙄 Claquer la porte', effets: { moral: -6 }, note: 'Téléphone confisqué UNE semaine. Une éternité.' },
    ] },
  { id: 's_crush', icone: '💘',
    texte: 'Ton crush t\'a envoyé un message. Un vrai. Avec un emoji et tout.',
    options: [
      { txt: '💬 Répondre direct, naturel', effets: { moral: 14, social: 6 }, note: 'Conversation de 2 h 47. Record battu.' },
      { txt: '⏳ Attendre 3 heures pour faire genre', effets: { moral: 4 }, note: 'Le message d\'après était moins inspiré. Bien joué, stratège.' },
      { txt: '😱 Montrer le message à {ami} d\'abord', effets: { relation: 8, moral: 6 }, note: 'Debrief complet, réponse co-écrite. Le travail d\'équipe.' },
    ] },
  { id: 's_plan_marco', icone: '💶', de: 'ami',
    texte: '{ami} a « un plan en or » : revendre des sneakers en édition limitée. Il faut avancer 50 €.',
    options: [
      { txt: '💸 Tenter le coup', effets: { argent: 40, relation: 6 }, note: 'Revendues le double en une semaine ! Bon, une seule paire, mais quand même.' },
      { txt: '🙅 Garder tes 50 €', effets: { relation: -3 }, note: 'Le plan a moyennement marché. Tu as bien fait. Probablement.' },
    ] },
  { id: 's_soiree_ratee', icone: '🎈',
    texte: 'Tu organises une soirée. À 21 h, il y a trois personnes, dont toi.',
    options: [
      { txt: '📢 Spammer tout le monde', effets: { social: 10, moral: 6 }, note: 'À 23 h, la maison était pleine. Tu es passé·e à autre chose.' },
      { txt: '🍕 Pizza à trois, mode cocooning', effets: { relation: 10, moral: 8 }, note: 'Meilleure soirée du mois, finalement.' },
    ] },
  { id: 's_conseil_classe', icone: '📋', phases: ['lycee'], de: 'prof',
    texte: 'Le prof principal te propose d\'être délégué·e de classe.',
    options: [
      { txt: '🙋 Accepter', effets: { social: 8, savoir: 2, energie: -4 }, note: 'Des réunions, mais tout le monde connaît ton prénom maintenant.' },
      { txt: '😅 Décliner poliment', effets: { moral: 2 }, note: 'La tranquillité a du bon.' },
    ] },
  { id: 's_stage', icone: '💼', phases: ['etudes'],
    texte: 'Un stage s\'ouvre dans une boîte cool — mais c\'est non payé et loin.',
    options: [
      { txt: '🚀 Le prendre : l\'expérience !', effets: { savoir: 8, argent: -40, energie: -10 }, note: 'Épuisant, formateur, et une super ligne sur le CV.' },
      { txt: '💶 Chercher un job payé à la place', effets: { argent: 120, energie: -12 }, note: 'Moins prestigieux, mais le compte en banque respire.' },
    ] },
  { id: 's_collegue', icone: '🖇️', phases: ['travail'], de: 'boulot',
    texte: 'Un collègue s\'attribue ton travail devant le chef. Tranquillement. Devant toi.',
    options: [
      { txt: '🗣️ Rectifier calmement, faits à l\'appui', effets: { savoir: 3, social: 5, moral: 5 }, note: 'Le chef a hoché la tête. Le collègue a fixé ses chaussures.' },
      { txt: '😤 Laisser couler (et noter pour plus tard)', effets: { moral: -6 }, note: 'La vengeance est un plat qui se mange froid. Très froid.' },
    ] },
  { id: 's_augmentation', icone: '💰', phases: ['travail'], de: 'boulot',
    texte: 'Entretien annuel. Ton chef te demande : « Des attentes particulières ? »',
    options: [
      { txt: '💶 Demander une augmentation, chiffres à l\'appui', effets: { argent: 150, moral: 6 }, note: 'Il a dit oui. TOUJOURS demander.' },
      { txt: '😇 « Non non, tout va bien »', effets: { moral: -4 }, note: 'Tu y penseras toute l\'année.' },
    ] },
  { id: 's_coloc', icone: '🏠', phases: ['etudes', 'travail'],
    texte: '{ami} te propose une coloc dans le centre. Plus cher, mais la liberté totale.',
    options: [
      { txt: '🔑 Signer !', effets: { argent: -80, moral: 12, relation: 12, social: 6 }, note: 'Vaisselle en retard, rires en avance. Aucun regret.' },
      { txt: '🏡 Rester chez tes parents encore un peu', effets: { argent: 60 }, note: 'Le frigo plein a ses arguments.' },
    ] },
  { id: 's_dimanche_pluie', icone: '🌧️',
    texte: 'Dimanche. Pluie battante. Zéro plan, zéro motivation.',
    options: [
      { txt: '📖 Après-midi lecture / docu', effets: { savoir: 4, moral: 4, energie: 8 }, note: 'Tu es désormais incollable sur un sujet très précis et inutile.' },
      { txt: '📞 Appeler {ami} en visio', effets: { relation: 8, moral: 6 }, note: 'Trois heures au téléphone. Comme avant.' },
      { txt: '🛌 Hibernation totale', effets: { energie: 20, social: -3 }, note: 'Tu as dormi 14 heures. Aucune honte.' },
    ] },
  { id: 's_permis', icone: '🚗', ageMin: 18,
    texte: 'Il serait temps de passer le permis. C\'est cher, mais c\'est la liberté.',
    options: [
      { txt: '🚗 Foncer (adieu les économies)', effets: { argent: -300, moral: 10, social: 4 }, note: 'Obtenu du premier coup ! Enfin, du deuxième.' },
      { txt: '🚲 Le vélo, c\'est la vie', effets: { forme: 8, argent: 20 }, note: 'Écolo, économe, et des mollets en béton.' },
    ] },
  { id: 's_vieux_ami', icone: '👋',
    texte: 'Tu croises un·e pote d\'enfance perdu·e de vue. « On se fait un truc bientôt ? »',
    options: [
      { txt: '📅 Proposer une vraie date, là, maintenant', effets: { social: 10, moral: 8 }, note: 'Vous l\'avez VRAIMENT fait. Miracle.' },
      { txt: '😊 « Oui carrément ! » (jamais)', effets: {}, note: 'Le « bientôt » universel. Rendez-vous dans quatre ans.' },
    ] },
  { id: 's_reseaux', icone: '📸',
    texte: 'Ta story a fait un mini-buzz local. 4 000 vues. Des inconnus te reconnaissent au café.',
    options: [
      { txt: '📈 Surfer dessus, poster plus', effets: { social: 12, energie: -6, moral: 4 }, note: 'Tu plafonnes à 800 abonnés. Célébrité cantonale.' },
      { txt: '🕶️ Savourer et passer à autre chose', effets: { moral: 6 }, note: 'La gloire est passée. Le café est toujours bon.' },
    ] },
  { id: 's_budget', icone: '🧾', phases: ['etudes', 'travail'],
    texte: 'Fin de mois difficile : il te reste 12 € et trois invitations à sortir.',
    options: [
      { txt: '🍝 Proposer une soirée pâtes à la maison', effets: { relation: 10, moral: 8, argent: -8 }, note: 'Carbonara approximative, ambiance cinq étoiles.' },
      { txt: '💳 Sortir quand même (le découvert attendra)', effets: { social: 8, argent: -40, moral: 4 }, note: 'La banque t\'a envoyé un SMS passif-agressif.' },
      { txt: '🚪 Hiberner jusqu\'à la paie', effets: { argent: 10, social: -5 }, note: 'Économe mais un peu triste.' },
    ] },
  { id: 's_burn_devoirs', icone: '🥱', phases: ['lycee', 'etudes'],
    texte: 'Trois devoirs, deux exposés, une semaine. Mission impossible ?',
    options: [
      { txt: '🗂️ Planning militaire, tout rendre', effets: { savoir: 6, energie: -15 }, note: 'Tout rendu à l\'heure. Tu mérites une statue.' },
      { txt: '🎯 Prioriser : le plus gros coefficient', effets: { savoir: 3, moral: 3, energie: -6 }, note: 'Stratégie de pro. Le reste ? « Malade ». ' },
    ] },
];

/* ------------------------------------------------------------
   OBJECTIFS DE VIE — le fil rouge
   ------------------------------------------------------------ */
const OBJECTIFS_VIE = [
  { id: 'premier_pote', icone: '🫂', texte: 'Monte une amitié à 70', xp: 30 },
  { id: 'economies', icone: '💰', texte: 'Mets 200 € de côté', xp: 40 },
  { id: 'bac', icone: '🎓', texte: 'Décroche ton bac', xp: 100 },
  { id: 'metier', icone: '💼', texte: 'Décroche ton premier vrai job', xp: 100 },
  { id: 'equilibre', icone: '⭐', texte: 'Atteins 3,5 de bonheur', xp: 80 },
  { id: 'fortune', icone: '🏦', texte: 'Économise 3 000 €', xp: 80 },
  { id: 'trentaine', icone: '🎂', texte: 'Arrive à 25 ans épanoui·e', xp: 0 },
];


/* ------------------------------------------------------------
   QUESTIONS DE RYTHME — le cœur du jeu : à chaque saison, une
   question. Tes réponses ÉCRIVENT ta vie (façon Destiny Eleven).
   `ami: true` = l'option se vit avec un de tes potes (lien +),
   `talent` = l'option nourrit un rêve (foot / musique).
   ------------------------------------------------------------ */
const SAISONS_VIE = ['hiver', 'hiver', 'printemps', 'printemps', 'printemps', 'ete', 'ete', 'ete', 'automne', 'automne', 'automne', 'hiver'];

const RYTHMES = [
  { id: 'r_tri', icone: '🗓️', texte: 'Nouvelle saison à {ville}. Elle ressemble à quoi, ta vie, ces temps-ci ?',
    options: [
      { txt: '📚 Tête dans les cours, sérieux total', effets: { savoir: 7, energie: -8 }, note: 'Tes fiches font des jaloux.' },
      { txt: '🎉 Les potes d\'abord, on verra le reste', effets: { social: 8, moral: 8, savoir: -2 }, ami: true, note: 'Des souvenirs plein le téléphone.' },
      { txt: '🥅 Foot à fond, entraînements non-stop', effets: { forme: 10, energie: -8 }, talent: 'foot', note: 'Tes crampons connaissent le chemin par cœur.' },
      { txt: '😴 Mode cocon : dormir, souffler', effets: { energie: 26, moral: 6 }, note: 'Batterie rechargée à bloc.' },
    ] },
  { id: 'r_weekend', icone: '🌤️', texte: 'Tes week-ends de la saison, tu les passes où ?',
    options: [
      { txt: '📖 Bibliothèque, au calme', effets: { savoir: 8, energie: -10 }, note: 'Trois mois de concentration pure. Gratuit, en plus.' },
      { txt: '⚽ Terrain avec la bande', effets: { forme: 8, social: 6, moral: 6, energie: -6 }, ami: true, note: 'Scores contestés, fous rires garantis.' },
      { txt: '🎤 Micro en main, à répéter', effets: { moral: 7, social: 4, energie: -6 }, talent: 'musique', note: 'Ta voix porte de plus en plus loin.' },
      { txt: '🛋️ Canapé, plaid, séries', effets: { energie: 22, moral: 5, social: -3 }, note: 'Saison terminée. La série aussi.' },
    ] },
  { id: 'r_argent', icone: '💶', texte: 'Fin de mois compliquées : il te faudrait un peu d\'argent…',
    options: [
      { txt: '🧾 Petit boulot tous les samedis', effets: { argent: 260, energie: -16, savoir: -2 }, ageMin: 16, note: '« Bonjour, vous avez la carte de fidélité ? » × 400.' },
      { txt: '🍔 Quelques baby-sittings / livraisons', effets: { argent: 120, energie: -8 }, note: 'Ça dépanne, et ça fait des anecdotes.' },
      { txt: '🙏 Serrer le budget, zéro extra', effets: { moral: -4, argent: 30 }, note: 'Les pâtes, c\'est la vie.' },
      { txt: '🛹 Un plan débrouille avec un pote', effets: { argent: 90, moral: 4 }, ami: true, note: 'Pas très officiel, mais efficace.' },
    ] },
  { id: 'r_forme', icone: '💪', texte: 'Ton corps t\'envoie des signaux. Tu réponds quoi ?',
    options: [
      { txt: '🏃 Programme sport sérieux', effets: { forme: 14, moral: 6, energie: -8 }, note: 'Courbatures, puis fierté.' },
      { txt: '🥅 Version compétition : foot intensif', effets: { forme: 11, energie: -10 }, talent: 'foot', note: 'Le coach t\'a regardé deux fois de plus que d\'habitude.' },
      { txt: '🚶 Des balades, tranquille', effets: { forme: 6, moral: 8, energie: 6 }, note: 'La ville est belle quand on lève la tête.' },
      { txt: '🍕 On verra plus tard', effets: { moral: 6, forme: -4 }, note: 'La pizza a gagné. Encore.' },
    ] },
  { id: 'r_soiree', icone: '🎊', texte: 'LA soirée de la saison approche. Tout le monde y sera.',
    options: [
      { txt: '🌟 Y aller à fond, playlist préparée', effets: { social: 12, moral: 8, energie: -8, argent: -20 }, note: 'On parlera de cette soirée pendant des mois.' },
      { txt: '🎟️ Y passer une heure, dire bonjour', effets: { social: 5, moral: 4 }, ami: true, note: 'Dosage parfait. Couché à minuit.' },
      { txt: '🎧 Rester répéter ta musique', effets: { energie: -4, moral: 4 }, talent: 'musique', note: 'Pendant qu\'ils dansent, toi tu progresses.' },
      { txt: '🚪 Zapper : pas l\'ambiance', effets: { energie: 12, social: -5 }, note: 'Aucun regret. Enfin, presque.' },
    ] },
  { id: 'r_examens', icone: '📝', texte: 'Grosse période d\'évaluations en vue. Ta stratégie ?',
    options: [
      { txt: '🗂️ Réviser en groupe, planning béton', effets: { savoir: 8, social: 4, energie: -10 }, ami: true, note: 'On a ri, on a bossé. Combo rare.' },
      { txt: '🤓 Réviser seul·e, porte fermée', effets: { savoir: 10, energie: -12, social: -3 }, note: 'Silence, café, résultats.' },
      { txt: '🍀 Improviser le jour J', effets: { moral: 6, savoir: -3 }, note: 'L\'adrénaline comme méthode. Audacieux.' },
    ] },
  { id: 'r_passion', icone: '🔥', texte: 'Une saison entière devant toi. Si tu la donnais à ta passion ?',
    options: [
      { txt: '🥅 Le foot : stage intensif', effets: { forme: 12, energie: -12 }, talent: 'foot', note: 'Tu joues des deux pieds maintenant.' },
      { txt: '🎤 La musique : maquette enregistrée', effets: { moral: 8, argent: -30, energie: -6 }, talent: 'musique', note: 'Trois titres. Le deuxième est vraiment bien.' },
      { txt: '🧠 Les études, c\'est ça ta passion', effets: { savoir: 9, energie: -8 }, note: 'Les concours n\'ont qu\'à bien se tenir.' },
      { txt: '🫂 Les gens. Juste les gens', effets: { social: 10, moral: 8 }, ami: true, note: 'Ta bande est ta plus belle œuvre.' },
    ] },
  { id: 'r_hiver', icone: '☔', texte: 'Saison grise, moral en dents de scie. Ton antidote ?',
    options: [
      { txt: '🏋️ Transpirer, quoi qu\'il pleuve', effets: { forme: 10, moral: 8, energie: -6 }, note: 'La pluie ne gagne pas contre toi.' },
      { txt: '🍲 Grandes tablées chez les potes', effets: { social: 8, moral: 10, argent: -15 }, ami: true, note: 'Raclette-thérapie. Scientifiquement prouvé.' },
      { txt: '📚 En profiter pour prendre de l\'avance', effets: { savoir: 7, energie: -6 }, note: 'Pendant que la ville hiberne, toi tu avances.' },
      { txt: '🛌 Hiberner franchement', effets: { energie: 24, social: -4 }, note: 'Réveil prévu au printemps.' },
    ] },
];

const NOMS_MOIS_VIE = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/* ------------------------------------------------------------
   RÉGIONS & DÉPARTEMENTS — pour choisir sa ville en trois tapes
   ------------------------------------------------------------ */
const REGIONS_FR = [
  { nom: 'Île-de-France', icone: '🗼', depts: ['75', '77', '78', '91', '92', '93', '94', '95'] },
  { nom: 'Auvergne-Rhône-Alpes', icone: '⛰️', depts: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'] },
  { nom: 'Nouvelle-Aquitaine', icone: '🏄', depts: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'] },
  { nom: 'Occitanie', icone: '☀️', depts: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'] },
  { nom: 'Hauts-de-France', icone: '🍟', depts: ['02', '59', '60', '62', '80'] },
  { nom: 'Provence-Alpes-Côte d\'Azur', icone: '🌊', depts: ['04', '05', '06', '13', '83', '84'] },
  { nom: 'Grand Est', icone: '🥨', depts: ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'] },
  { nom: 'Pays de la Loire', icone: '🏰', depts: ['44', '49', '53', '72', '85'] },
  { nom: 'Bretagne', icone: '🥞', depts: ['22', '29', '35', '56'] },
  { nom: 'Normandie', icone: '🐮', depts: ['14', '27', '50', '61', '76'] },
  { nom: 'Bourgogne-Franche-Comté', icone: '🍇', depts: ['21', '25', '39', '58', '70', '71', '89', '90'] },
  { nom: 'Centre-Val de Loire', icone: '🌻', depts: ['18', '28', '36', '37', '41', '45'] },
  { nom: 'Corse', icone: '🏝️', depts: ['2A', '2B'] },
  { nom: 'Outre-mer', icone: '🌴', depts: ['971', '972', '973', '974', '975', '976', '977', '978', '986', '987', '988'] },
];

const DEPTS_FR = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes',
  '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes', '09': 'Ariège', '10': 'Aube',
  '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal',
  '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '21': 'Côte-d\'Or',
  '22': 'Côtes-d\'Armor', '23': 'Creuse', '24': 'Dordogne', '25': 'Doubs', '26': 'Drôme',
  '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère', '2A': 'Corse-du-Sud', '2B': 'Haute-Corse',
  '30': 'Gard', '31': 'Haute-Garonne', '32': 'Gers', '33': 'Gironde', '34': 'Hérault',
  '35': 'Ille-et-Vilaine', '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura',
  '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire', '44': 'Loire-Atlantique',
  '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne', '48': 'Lozère', '49': 'Maine-et-Loire',
  '50': 'Manche', '51': 'Marne', '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle',
  '55': 'Meuse', '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord',
  '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques',
  '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône',
  '70': 'Haute-Saône', '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie',
  '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines', '79': 'Deux-Sèvres',
  '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne', '83': 'Var', '84': 'Vaucluse',
  '85': 'Vendée', '86': 'Vienne', '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne',
  '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne', '95': 'Val-d\'Oise',
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane', '974': 'La Réunion',
  '975': 'Saint-Pierre-et-Miquelon', '976': 'Mayotte', '977': 'Saint-Barthélemy', '978': 'Saint-Martin',
  '986': 'Wallis-et-Futuna', '987': 'Polynésie française', '988': 'Nouvelle-Calédonie',
};

/* ------------------------------------------------------------
   BILAN D'ANNÉE — la mise en scène de fin de saison :
   gros titre de presse + tuiles de stats + potins de la ville
   ------------------------------------------------------------ */
const TITRES_ANNEE = {
  savoir: [
    '« {prenom}, la machine à bonnes notes de {ville} »',
    '« Les profs n\'ont plus rien à lui apprendre » — la rumeur du bahut',
    '« {prenom} vise plus haut que {ville} », murmure la salle des profs',
  ],
  social: [
    '« Aucune soirée à {ville} ne commence sans {prenom} »',
    '« {prenom}, maire officieux·se de {ville} »',
    '« Tout le monde connaît {prenom}. Tout le monde. »',
  ],
  forme: [
    '« {prenom}, la machine physique de {ville} »',
    '« On l\'a vu·e courir sous la pluie. Encore. » — {ville} Matin',
    '« {prenom} ne s\'arrête jamais », s\'épuise son entourage',
  ],
  moral: [
    '« {prenom}, l\'année du grand sourire »',
    '« Rien ne semble pouvoir toucher {prenom} cette année »',
  ],
  foot: [
    '« {prenom}, le crack du stade de {ville} »',
    '« Un recruteur aurait été aperçu au bord du terrain de {ville}… »',
  ],
  musique: [
    '« La voix de {prenom} résonne dans tout {ville} »',
    '« {prenom} en concert : la salle de {ville} était pleine »',
  ],
  argent: [
    '« {prenom}, le/la businessman·woman de {ville} »',
    '« À ce rythme, {prenom} rachète la mairie de {ville} »',
  ],
  discret: [
    '« {prenom} ? Connais pas. » — tout {ville}',
    '« L\'année la plus calme de {prenom}, de mémoire de {ville} »',
  ],
};

const POTINS_VILLE = [
  '📰 Le kebab de {ville} lance une carte de fidélité. La file dépasse la mairie.',
  '📰 Le rond-point de {ville} a été refait. Personne ne sait pourquoi.',
  '📰 Un chat coincé dans un arbre à {ville} : les pompiers applaudis.',
  '📰 La boulangerie de {ville} élue « meilleure baguette du canton ». Émeute polie.',
  '📰 Le club de pétanque de {ville} recrute. Ambiance électrique.',
  '📰 Wi-Fi gratuit sur la place de {ville} : la jeunesse en liesse.',
  '📰 Un influenceur a filmé le marché de {ville}. 214 vues.',
  '📰 La fête de {ville} reportée pour cause de pluie. Comme l\'an dernier.',
];

/* ------------------------------------------------------------
   TITRES DE VIE — l'archétype qu'on partage à la fin
   (le moteur teste les conditions dans l'ordre : le premier gagne)
   ------------------------------------------------------------ */
const TITRES_VIE = [
  { id: 'ballon_or', icone: '⚽', nom: 'La Légende du Stade', desc: 'Footballeur·se pro — {ville} a un maillot à ton nom.' },
  { id: 'tete_affiche', icone: '🎤', nom: 'La Tête d\'Affiche', desc: 'Signé·e en musique — {ville} chante tes refrains.' },
  { id: 'cerveau', icone: '🧠', nom: 'Le Cerveau', desc: 'Un savoir hors norme. {ville} n\'avait jamais vu ça.' },
  { id: 'main_doree', icone: '🤑', nom: 'La Main Dorée', desc: 'Un compte en banque qui brille plus que la mairie de {ville}.' },
  { id: 'coeur_quartier', icone: '🫶', nom: 'Le Cœur du Quartier', desc: 'Des amitiés en béton armé. Tout {ville} te connaît.' },
  { id: 'phenix', icone: '🔥', nom: 'Le Phénix', desc: 'Tombé·e, relevé·e, plus fort·e. {ville} se souvient.' },
  { id: 'zen', icone: '🧘', nom: 'Maître Zen', desc: 'Un bonheur insolent, zéro pression. La belle vie à {ville}.' },
  { id: 'papillon', icone: '🦋', nom: 'Le Papillon Social', desc: 'Invité·e partout, tout le temps. {ville} est ton salon.' },
  { id: 'fantome', icone: '👻', nom: 'Le Fantôme', desc: 'Dix ans à {ville} et personne ne t\'a jamais vraiment vu·e…' },
  { id: 'electron', icone: '⚡', nom: 'L\'Électron Libre', desc: 'Inclassable, imprévisible, 100 % toi. {ville} s\'en remet encore.' },
];

/* ------------------------------------------------------------
   MOMENTS RARES — les cartes « à clip » : rares, absurdes,
   grosses conséquences. Une seule fois chacune par vie.
   ------------------------------------------------------------ */
const SCENES_RARES = [
  { id: 'v_tiktok', icone: '🤳',
    texte: 'Tu filmes un truc débile au marché de {ville}. Avant de poster, ton pouce hésite…',
    options: [
      { txt: '🚀 POSTER. Advienne que pourra', effets: { social: 18, moral: 12 }, note: '2,3 MILLIONS de vues. Le boulanger de {ville} te demande un selfie.' },
      { txt: '🗑️ Supprimer, trop risqué', effets: { moral: 3 }, note: 'Le monde ne saura jamais. Toi si.' },
    ] },
  { id: 'v_gratte', icone: '🎫',
    texte: '{ami} t\'offre un ticket à gratter « porte-bonheur » pour te remercier d\'être là.',
    options: [
      { txt: '🪙 Gratter maintenant, devant {ami}', effets: { argent: 500, relation: 10, moral: 15 }, note: '500 € !!! Vous avez hurlé si fort que les voisins sont sortis.' },
      { txt: '🖼️ L\'encadrer sans le gratter', effets: { relation: 14, moral: 8 }, note: 'Le geste avant le gain. {ami} en parle encore.' },
    ] },
  { id: 'v_tournage', icone: '🎬',
    texte: 'Un tournage débarque à {ville} ! Ils cherchent des figurants pour une scène de foule.',
    options: [
      { txt: '🎥 Y aller à fond, premier rang', effets: { argent: 120, social: 12, moral: 10 }, note: 'On voit ton coude 0,8 seconde dans le film. GLOIRE ÉTERNELLE.' },
      { txt: '👀 Regarder de loin', effets: { moral: 5 }, note: 'Tu as vu une star manger un sandwich. Anecdote en or.' },
    ] },
  { id: 'v_micro', icone: '🎙️',
    texte: 'Micro-trottoir surprise dans la rue : « Une question philosophique : c\'est quoi, réussir sa vie ? »',
    options: [
      { txt: '💬 Sortir LA punchline', effets: { social: 15, moral: 10 }, note: 'Ta réponse tourne en boucle sur les réseaux. Tu es « la sagesse de {ville} ».' },
      { txt: '🏃 Fuir en marchant vite', effets: { energie: 4 }, note: 'On te voit fuir à l\'image. C\'est devenu un même local.' },
    ] },
];
