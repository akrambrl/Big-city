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
  MOIS_BAC: 12,          // juin de l'année de terminale (12ᵉ saison)
  MOIS_DIPLOME: 24,      // juin, trois ans après le bac
  MOIS_FIN: 41,          // 25 ans : l'heure du bilan
  PROBA_SCENE: 0.55,     // chance de scène de vie chaque saison
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

const NOMS_MOIS_VIE = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
