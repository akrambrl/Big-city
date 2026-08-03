/* ============================================================
   BIG CITY LIFE — Données du jeu de vie
   Familles, amis, filières, lieux et activités, scènes,
   études, jobs, objectifs. De 15 à 30 ans dans ta vraie ville.
   ============================================================ */

/* Le temps s'accélère avec la vie : tours 1-12 = saisons (lycée,
   16-19 ans), tours 13-24 = semestres (études/débuts, 19-25 ans),
   tours 25-49 = années (vie adulte, 25-50 ans). ~49 questions. */
const VIE_CFG = {
  MOIS_DEPART: 8,        // on commence en septembre (rentrée post-brevet)
  AGE_DEPART: 16,        // juste après le brevet
  ANNEE_DEPART: 2026,    // année civile de la rentrée de seconde
  MOIS_BAC: 12,          // juin de l'année de terminale (12ᵉ tour)
  MOIS_DIPLOME: 18,      // fin d'études (~22 ans)
  MOIS_FIN: 49,          // 50 ans : l'heure du bilan
  PROBA_SCENE: 0.66,     // chance de scène de vie chaque saison
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
  { id: 'sabbatique', nom: 'Année sabbatique', icone: '🧳', minSavoir: 0, pause: true,
    desc: 'Un an pour souffler : petits boulots, projets perso, les idées qui se remettent en place. Tu choisiras après.',
    savoirMois: 0.4 },
  { id: 'voyage', nom: 'Voyage sac à dos', icone: '✈️', minSavoir: 0, pause: true, argentMin: 400, formeMin: 35,
    desc: 'Un an sur les routes du monde (400 € de départ). Ça coûte, ça fatigue, ça change une vie.',
    savoirMois: 0.8 },
];

/* Métier attribué au moment d'entrer dans la vie active */
/* Les carrières de rêve : on s'entraîne, on se fait repérer, on tente sa chance */
const REVES = {
  foot: { nom: 'Footballeur·se pro', icone: '⚽', stat: 'forme', seuilReperage: 62,
    reperage: 'Un recruteur du {club} t\'observe depuis trois entraînements. Il s\'approche : « Tu as quelque chose. Un essai au centre de formation, ça te dit ? »',
    essai: 'L\'essai au centre de formation du {club} : deux heures sous les yeux des coachs, jambes en feu, cœur à 200.',
    reussite: 'Le coach te serre la main : « Bienvenue au {club}. » CONTRAT PRO. Tes potes hurlent dans les gradins.',
    echec: 'Pas cette fois. « Reviens plus fort », dit le coach du {club}. Et tu reviendras.' },
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
  { id: 'influenceur', nom: 'Influenceur·se', icone: '💫', orientation: 'reve', minSavoir: 0, salaire: 2600 },
  { id: 'ingenieur', nom: 'Ingénieur·e', icone: '🛠️', orientation: 'longues', minSavoir: 75, salaire: 2600 },
  { id: 'prof', nom: 'Prof', icone: '📚', orientation: 'longues', minSavoir: 60, salaire: 2000 },
  { id: 'comm', nom: 'Chargé·e de comm', icone: '📣', orientation: 'longues', minSavoir: 0, salaire: 1900 },
  { id: 'technicien', nom: 'Technicien·ne', icone: '⚙️', orientation: 'courtes', minSavoir: 50, salaire: 1900 },
  { id: 'infirmier', nom: 'Infirmier·ère', icone: '🩺', orientation: 'courtes', minSavoir: 40, salaire: 1800 },
  { id: 'commercial', nom: 'Commercial·e', icone: '🤝', orientation: 'courtes', minSavoir: 0, salaire: 1700 },
  { id: 'artisan', nom: 'Artisan·e', icone: '🔨', orientation: 'travail', filiere: 'pro', minSavoir: 35, minForme: 40, salaire: 1800 },
  { id: 'vendeur', nom: 'Vendeur·se', icone: '🏬', orientation: 'travail', minSavoir: 0, salaire: 1450 },
  { id: 'livreur', nom: 'Livreur·se', icone: '📦', orientation: 'travail', minSavoir: 0, minForme: 45, salaire: 1400 },
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
    texte: 'Contrôle surprise demain au {lycee}. Ce soir, {ami} propose une soirée jeux « historique »…',
    options: [
      { txt: '📚 Réviser, tant pis pour la soirée', effets: { savoir: 6, moral: -4 }, note: 'Tu as fini par t\'endormir sur tes fiches. Mais tu étais prêt·e.' },
      { txt: '🎮 La soirée. On vit qu\'une fois', effets: { moral: 10, relation: 10, savoir: -4 }, note: 'Soirée légendaire. Le contrôle, beaucoup moins.' },
      { txt: '🤝 Négocier : révisions CHEZ {ami}', effets: { savoir: 3, relation: 6, moral: 4 }, note: 'Deux heures de fiches, trois heures de jeux. Honorable.' },
    ] },
  { id: 's_rumeur', icone: '🗣️', de: 'ami',
    texte: 'Une rumeur débile circule sur {ami}. Tout le monde en parle, du {lycee} au {cafe}.',
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
      { txt: '🍔 Commander au {fastfood}, mode cocooning', effets: { relation: 10, moral: 8 }, note: 'Meilleure soirée du mois, finalement.' },
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
      { txt: '🚗 Foncer (adieu les économies)', effets: { argent: -300, moral: 10, social: 4 }, drapeau: 'permis', note: 'Obtenu du premier coup ! Enfin, du deuxième. La liberté a quatre roues.' },
      { txt: '🚲 Le vélo, c\'est la vie', effets: { forme: 8, argent: 20 }, note: 'Écolo, économe, et des mollets en béton.' },
    ] },
  { id: 's_vieux_ami', icone: '👋',
    texte: 'Tu croises un·e pote d\'enfance perdu·e de vue. « On se fait un truc bientôt ? »',
    options: [
      { txt: '📅 Proposer une vraie date, là, maintenant', effets: { social: 10, moral: 8 }, note: 'Vous l\'avez VRAIMENT fait. Miracle.' },
      { txt: '😊 « Oui carrément ! » (jamais)', effets: {}, note: 'Le « bientôt » universel. Rendez-vous dans quatre ans.' },
    ] },
  { id: 's_reseaux', icone: '📸',
    texte: 'Ta story au {fastfood} a fait un mini-buzz local. 4 000 vues. Des inconnus te reconnaissent au {cafe}.',
    options: [
      { txt: '📈 Surfer dessus, poster plus', effets: { social: 12, energie: -6, moral: 4, abonnes: 1200 }, note: 'Les abonnés grimpent. Célébrité plus si cantonale.' },
      { txt: '🕶️ Savourer et passer à autre chose', effets: { moral: 6 }, note: 'La gloire est passée. Le café est toujours bon.' },
    ] },
  { id: 's_budget', icone: '🧾', phases: ['etudes', 'travail'],
    texte: 'Fin de mois difficile : il te reste 12 € et trois invitations à sortir.',
    options: [
      { txt: '🍝 Proposer une soirée pâtes à la maison', effets: { relation: 10, moral: 8, argent: -8 }, note: 'Carbonara approximative, ambiance cinq étoiles.' },
      { txt: '💳 Le {resto} quand même (le découvert attendra)', effets: { social: 8, argent: -40, moral: 4 }, note: 'La banque t\'a envoyé un SMS passif-agressif.' },
      { txt: '🚪 Hiberner jusqu\'à la paie', effets: { argent: 10, social: -5 }, note: 'Économe mais un peu triste.' },
    ] },
  { id: 's_chien', icone: '🐶',
    texte: '{ami} t\'envoie une annonce : un gars vend des chiots « de race » sur Snap, 150 €. Les photos sont ADORABLES. C\'est louche. Mais ADORABLES.',
    options: [
      { txt: '🥹 Craquer. Il s\'appellera Biscotte', effets: { argent: -150, moral: 14, forme: 4 }, drapeau: 'chien',
        note: 'Biscotte détruit une chaussure par semaine et t\'accueille comme un héros chaque soir. Aucun regret.' },
      { txt: '🚩 « C\'est un plan louche, signale-le »', effets: { savoir: 3, moral: 2 },
        note: 'C\'était effectivement louche. Tu as sûrement évité une arnaque… mais tu penses encore aux photos.' },
      { txt: '📸 Montrer aux parents « pour voir »', effets: { moral: 4 },
        note: 'Ta mère a dit non. Ton père a demandé le prix « juste par curiosité ».' },
    ] },
  { id: 's_voiture', icone: '🚙', ageMin: 18,
    texte: '{ami} vend sa vieille Clio, 600 € « première main, ou presque ». Elle démarre une fois sur deux, mais elle a du charme.',
    options: [
      { txt: '🔑 L\'acheter pour rouler', effets: { argent: -600, moral: 12, social: 8 }, si: 'permis', drapeau: 'voiture',
        note: 'Elle s\'appelle Josiane, elle cale aux feux, et c\'est la voiture la plus aimée de {ville}.' },
      { txt: '🔧 La retaper avec des tutos et la revendre', effets: { argent: 220, savoir: 3, energie: -8 },
        note: 'Trois week-ends de mécanique YouTube, revendue 900 €. Un vrai petit business.' },
      { txt: '🙃 Passer ton tour, sagement', effets: { moral: 2 },
        note: 'Deux semaines plus tard, la Clio fumait sur le bord de la départementale. Bien vu.' },
    ] },
  { id: 's_vacances_famille', icone: '🚐',
    texte: 'Tes parents annoncent LES vacances en famille : trois semaines de camping du côté de {destination}. Ambiance jeux de société et barbecue.',
    options: [
      { txt: '😎 Y aller à fond, mode famille', effets: { moral: 12, energie: 14 }, note: 'Tu as gagné 11 parties de cartes et un bronzage de routier. Zéro regret.' },
      { txt: '🤝 Négocier : {ami} vient avec vous', effets: { relation: 12, moral: 10, energie: 8 }, note: 'Vos fous rires ont réveillé le camping deux fois. Meilleur été.' },
      { txt: '😤 Bouder dans la caravane', effets: { energie: 12, moral: -4, savoir: 3 }, note: 'Tu as lu trois livres par vengeance. Ta mère te croit malade.' },
    ] },
  { id: 's_depart_potes', icone: '🚗', ageMin: 17,
    texte: 'PREMIER départ entre potes ! Le groupe hésite : {destination} en covoiturage, ou le camping pas cher au bord du lac ?',
    options: [
      { txt: '✈️ {destination}, on vise grand', effets: { moral: 15, social: 10, argent: -120, abonnes: 600 }, note: 'Vos stories ont rendu jaloux tout le lycée. Des souvenirs pour dix ans.' },
      { txt: '⛺ Le lac : pas cher, mythique', effets: { moral: 12, relation: 12, argent: -40 }, note: 'Feu de camp, guitare approximative, étoiles filantes. Parfait.' },
      { txt: '💼 Rester bosser cet été', effets: { argent: 180, moral: -6, relation: -6 }, note: 'Le compte en banque va bien. Le groupe WhatsApp, moins.' },
    ] },
  { id: 's_rencontre_vacances', icone: '🌅', ageMin: 16,
    texte: 'Au camping, quelqu\'un te tape dans l\'œil depuis trois jours. Dernier soir, feu de camp, la place à côté est libre.',
    options: [
      { txt: '💘 T\'asseoir et te lancer', effets: { moral: 14, social: 8 }, note: 'Vous avez parlé jusqu\'à 4 h. Vous vous suivez partout maintenant.' },
      { txt: '🎸 Impressionner de loin (mode guitare)', effets: { moral: 4, social: 3 }, note: 'Trois accords. La personne a souri… puis est partie dormir.' },
      { txt: '🙈 Rester avec les potes, trop la pression', effets: { relation: 6, moral: -3 }, note: 'Tu y penses encore. Le fameux « et si ».' },
    ] },
  { id: 's_premier_rdv', icone: '🍝', ageMin: 16,
    texte: 'Premier vrai rendez-vous — au {resto}, carrément. Stress maximal : tenue, sujets de conversation, qui paye ?',
    options: [
      { txt: '😌 Être toi-même, tout simplement', effets: { moral: 14, social: 6, argent: -25 }, note: 'Deux heures passées en dix minutes. Il y aura un deuxième rendez-vous.' },
      { txt: '🎭 Jouer un personnage « cool »', effets: { moral: -4, argent: -25 }, note: 'Tu as cité un film que tu n\'as pas vu. Ça s\'est vu.' },
      { txt: '📱 Demander conseil à {ami} en direct des toilettes', effets: { relation: 8, moral: 8, argent: -25 }, note: 'Coaching par SMS toutes les 10 minutes. Étrangement, ça a marché.' },
    ] },
  { id: 's_festival', icone: '🎪', ageMin: 16,
    texte: '{ami} a deux places pour le festival près de {ville}. Problème : c\'est le week-end… des révisions prévues.',
    options: [
      { txt: '🎶 Le festival, évidemment (3 jours debout)', effets: { moral: 15, social: 8, relation: 10, argent: -35, energie: -10, abonnes: 300 }, formeMin: 20, note: 'Tu as chanté jusqu\'à l\'extinction de voix. Aucun regret. Peut-être un petit.' },
      { txt: '📚 Les révisions (le cœur lourd)', effets: { savoir: 7, moral: -5, relation: -4 }, note: '{ami} t\'a envoyé 47 vidéos du concert. Courage.' },
      { txt: '🌗 Y aller juste le samedi soir', effets: { moral: 8, social: 4, savoir: 3, argent: -20 }, note: 'Le compromis du siècle. Fatigué mais fier.' },
    ] },
  { id: 's_cine', icone: '🎬',
    texte: '« {film} » sort cette semaine. {ami} a déjà pris deux places pour la séance de 20 h.',
    options: [
      { txt: '🍿 Foncer (popcorn obligatoire)', effets: { moral: 12, argent: -14, relation: 8 }, note: 'Le film était moyen. La soirée, excellente.' },
      { txt: '⏳ « On attend qu\'il soit en streaming »', effets: { argent: 5, relation: -4 }, note: '{ami} y est allé·e sans toi. Le débrief spoile tout.' },
    ] },
  { id: 's_tendance', icone: '🤳', phases: ['lycee', 'etudes'],
    texte: 'La tendance « {tiktok} » cartonne. {ami} veut ABSOLUMENT la refaire avec toi devant le {lycee}.',
    options: [
      { txt: '🎬 La refaire à fond, sans se cacher', effets: { social: 10, moral: 6, relation: 8, abonnes: 900 }, note: 'Les vues s\'affolent, 3 profs mi-amusés mi-consternés. Aucun regret.' },
      { txt: '📱 Filmer {ami}, rester derrière la caméra', effets: { relation: 4, moral: 3 }, note: 'Ton cadrage est propre. Ta dignité aussi.' },
      { txt: '🙅 « Jamais de la vie »', effets: { relation: -5, energie: 4 }, note: 'Tu as regardé la vidéo 14 fois quand même.' },
    ] },
  { id: 's_fastfood', icone: '🍔',
    texte: 'Vendredi soir au {fastfood} : toute la bande est là et quelqu\'un lance « allez, menu XXL pour tout le monde ».',
    options: [
      { txt: '👑 Banquet XXL, tournée générale', effets: { moral: 10, social: 8, argent: -22, forme: -3 }, note: 'Le gérant vous a donné des frites « cadeau de la maison ».' },
      { txt: '🍟 Menu simple, ambiance maximale', effets: { moral: 6, social: 4, argent: -9 }, note: 'Deux heures de rires pour le prix d\'un menu.' },
      { txt: '💨 Passer en coup de vent', effets: { energie: 6, social: -3 }, note: 'Tu as raté LA blague de l\'année. On te la re-racontera mal.' },
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
  { id: 'famille', icone: '🏡', texte: 'Choisis ta vie de famille (avec ou sans enfants)', xp: 80 },
  { id: 'fortune', icone: '🏦', texte: 'Économise 3 000 €', xp: 80 },
  { id: 'trentaine', icone: '🎂', texte: 'Arrive à 50 ans épanoui·e', xp: 0 },
];


/* ------------------------------------------------------------
   QUESTIONS DE RYTHME — le cœur du jeu : à chaque saison, une
   question. Tes réponses ÉCRIVENT ta vie (façon Destiny Eleven).
   `ami: true` = l'option se vit avec un de tes potes (lien +),
   `talent` = l'option nourrit un rêve (foot / musique).
   ------------------------------------------------------------ */
const SAISONS_VIE = ['hiver', 'hiver', 'printemps', 'printemps', 'printemps', 'ete', 'ete', 'ete', 'automne', 'automne', 'automne', 'hiver'];

const RYTHMES = [
  { id: 'r_tri', icone: '🗓️', phases: ['lycee', 'etudes'], texte: 'Nouvelle saison à {ville}. Elle ressemble à quoi, ta vie, ces temps-ci ?',
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
      { txt: '🧾 Petit boulot au {fastfood} le samedi', effets: { argent: 260, energie: -16, savoir: -2 }, ageMin: 16, note: '« Bonjour, vous avez la carte de fidélité ? » × 400.' },
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
  { id: 'r_examens', icone: '📝', phases: ['lycee', 'etudes'], texte: 'Grosse période d\'évaluations en vue. Ta stratégie ?',
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
  { id: 'r_projet', icone: '🛠️', texte: 'Une saison, un projet perso. Tu te lances dans quoi ?',
    options: [
      { txt: '🎥 Monter ta chaîne vidéo', effets: { abonnes: 500, moral: 6, energie: -6 }, note: 'Trois vidéos, un générique fait maison. Ça prend forme.' },
      { txt: '🎸 Apprendre la guitare pour tes sons', effets: { moral: 6, energie: -4 }, talent: 'musique', note: 'Tes doigts détestent. Ta voix adore.' },
      { txt: '💻 Coder un petit jeu', effets: { savoir: 7, energie: -8 }, note: 'Il y a un bug adorable : le héros vole. Tu le gardes.' },
      { txt: '🧘 Aucun projet. Souffler EST le projet', effets: { energie: 20, moral: 5 }, note: 'Parfois, ne rien faire est très productif.' },
    ] },
  { id: 'r_gaming', icone: '🎮', texte: 'La nouvelle saison de ton jeu préféré vient de sortir. Toute la bande est dessus.',
    options: [
      { txt: '🏆 Tryhard le mode classé', effets: { moral: 8, energie: -8, savoir: -2 }, ami: true, note: 'Rang atteint. Cernes assorties.' },
      { txt: '📡 Streamer tes parties', effets: { abonnes: 450, social: 4, energie: -8 }, note: 'Douze viewers fidèles, dont ta grand-mère. Un empire commence.' },
      { txt: '😌 Y jouer tranquille le soir', effets: { moral: 7, energie: 4 }, note: 'Le dosage parfait. Aucun classement, aucun stress.' },
      { txt: '🚫 Pas cette saison — d\'autres priorités', effets: { savoir: 5, moral: -2 }, note: 'Ta discipline force le respect. Ton groupe de potes, moins.' },
    ] },
  { id: 'r_cuisine', icone: '🍳', texte: 'Verdict du miroir et du compte en banque : les pâtes-fromage tous les soirs, ça ne va plus.',
    options: [
      { txt: '👨‍🍳 Apprendre à VRAIMENT cuisiner', effets: { forme: 6, moral: 6, argent: -15 }, note: 'Ton curry impressionne tout le monde. Toi le premier.' },
      { txt: '🍔 Assumer le {fastfood} en boucle', effets: { moral: 6, forme: -5, argent: -30 }, note: 'Le gérant connaît ta commande par cœur. C\'est un signe.' },
      { txt: '🍲 Squatter la popote chez {ami}', effets: { relation: 10, moral: 5, argent: 10 }, ami: true, note: 'Tu fais la vaisselle en échange. Deal du siècle.' },
    ] },
  { id: 'r_benevolat', icone: '🤝', texte: 'La maison de quartier de {ville} cherche des bénévoles cette saison.',
    options: [
      { txt: '⚽ Coacher les petits au foot', effets: { social: 6, moral: 8, energie: -6 }, talent: 'foot', note: 'Ils t\'appellent « coach ». Tu progresses autant qu\'eux.' },
      { txt: '📖 Aide aux devoirs le mercredi', effets: { savoir: 5, social: 5, moral: 6 }, note: 'Expliquer, c\'est apprendre deux fois.' },
      { txt: '🥖 Les maraudes du samedi soir', effets: { moral: 10, social: 6, energie: -6 }, note: 'Des rencontres qui remettent les idées en place.' },
      { txt: '🙃 Pas cette saison', effets: { energie: 8 }, note: 'Une autre fois, promis. (Tu l\'as noté quelque part.)' },
    ] },
  { id: 'r_chambre', icone: '🛏️', texte: 'Ta chambre ressemble à une zone sinistrée. Même toi tu ne retrouves plus rien.',
    options: [
      { txt: '🧹 Grand rangement, méthode radicale', effets: { moral: 10, energie: -8 }, note: 'Tu as retrouvé 23 €, un chargeur et ta motivation.' },
      { txt: '🪴 Tout refaire : déco, posters, plantes', effets: { moral: 12, argent: -40 }, note: 'On dirait un studio de photo. Tu invites des gens JUSTE pour montrer.' },
      { txt: '🚪 Fermer la porte. Problème réglé', effets: { energie: 10, moral: -2 }, note: 'Technique validée par des générations entières.' },
    ] },
  { id: 'r_defi_perso', icone: '🎯', texte: 'Un défi personnel pour ce trimestre, ça te tente ?',
    options: [
      { txt: '🏃 Courir un 10 km d\'ici trois mois', effets: { forme: 14, moral: 6, energie: -8 }, formeMin: 25, note: '58 minutes, genoux en vrac, fierté intacte.' },
      { txt: '📚 Lire trois vrais livres', effets: { savoir: 6, moral: 5 }, note: 'Le troisième t\'a retourné le cerveau. Tu en parles à tout le monde.' },
      { txt: '🍫 90 jours sans sucre', effets: { forme: 8, moral: -5 }, note: 'Jour 47 : tu as rêvé d\'un pain au chocolat. Tenu quand même.' },
      { txt: '😅 Le défi de ne pas prendre de défi', effets: { moral: 7, energie: 6 }, note: 'Réussi haut la main.' },
    ] },
  { id: 'r_campus', icone: '🎓', phases: ['etudes'], texte: 'La vie étudiante, c\'est l\'autonomie totale. Ce semestre, tu le joues comment ?',
    options: [
      { txt: '🥇 Premier rang, notes béton', effets: { savoir: 9, energie: -10, social: -2 }, note: 'Les profs connaissent ton prénom. Les autres étudiants aussi (pour tes fiches).' },
      { txt: '🎪 Les assos étudiantes à fond', effets: { social: 10, moral: 8, savoir: -2 }, ami: true, note: 'Tu organises la soirée d\'intégration. Légendaire, forcément.' },
      { txt: '💼 Un job entre les cours', effets: { argent: 220, energie: -14 }, note: 'Fatigué mais indépendant. Tes parents sont bluffés.' },
      { txt: '🛌 Amphi le matin ? On verra…', effets: { moral: 8, savoir: -4, energie: 10 }, note: 'Les cours en ligne existent, techniquement.' },
    ] },
  { id: 'r_taf', icone: '💼', phases: ['travail'], texte: 'Une nouvelle saison au taf. Tu la joues comment ?',
    options: [
      { txt: '🚀 Viser la promo : dossiers en plus', effets: { argent: 150, savoir: 4, energie: -12 }, note: 'Ton chef a dit « très bon trimestre ». Presque une augmentation.' },
      { txt: '🍻 Réseauter : afterworks & cie', effets: { social: 9, moral: 5, argent: -25 }, note: 'Tu connais maintenant TOUT l\'open space. Et leurs chiens.' },
      { txt: '📐 Le taf, juste le taf, bien fait', effets: { moral: 7, energie: 4 }, note: 'L\'équilibre parfait. Personne ne t\'embête.' },
      { txt: '📚 Une formation en ligne le soir', effets: { savoir: 7, energie: -8 }, note: 'Certificat obtenu. LinkedIn prévenu.' },
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
   LE MONDE NOMMÉ — pour que ça fasse RÉEL : ton lycée, ton
   fast-food, le film à l'affiche, la tendance TikTok du moment.
   Tiré à la création (graine déterministe : le Défi du jour
   donne le même monde à tout le monde).
   ------------------------------------------------------------ */
const NOMS_LYCEES = [
  'Victor-Hugo', 'Jean-Moulin', 'Marie-Curie', 'Simone-Veil', 'Rosa-Parks',
  'Albert-Camus', 'Jean-Jaurès', 'Saint-Exupéry', 'George-Sand', 'Louise-Michel',
  'Clemenceau', 'Marcel-Pagnol', 'Olympe-de-Gouges', 'Nelson-Mandela', 'Jules-Ferry', 'Aimé-Césaire',
];
const FAST_FOODS = [
  'Snack 2000', 'Le Roi du Tacos', 'Chicken Corner', 'Chez Momo', 'Speed Burger',
  'Kebab du Stade', 'La Frite Dorée', 'Big Snack', "O'Délices", 'Le 20h-Minuit',
];
const RESTOS = [
  'La Bonne Fourchette', 'Chez Nadia', 'Le Vieux Four', 'La Piccola Italia',
  'Le Bistrot des Halles', "L'Assiette Gourmande", 'Le Jardin de Saïgon', 'La Crêperie du Port',
];
const CAFES = [
  'Café de la Place', 'Le Longchamp', "L'Escale", 'Le Balto',
  'Café des Sports', 'Le Zinc', 'La Terrasse', 'Le Petit Noir',
];
const PREFIXES_CLUB = ['FC', 'AS', 'US', 'Olympique', 'Étoile Sportive', 'Racing Club'];
const MARQUES = ['Volt Énergie', 'Bloom Drink', 'Fizzly', 'Nuage Soda', 'Torrent', 'Kiwaï'];
const PRENOMS_ENFANTS = ['Léo', 'Nina', 'Adam', 'Zoé', 'Naël', 'Lya', 'Marius', 'Aya', 'Côme', 'Isra'];
const INFLUENCEURS = [
  '@JujuFitness', '@LeoVlogs_off', '@MamieDanse', '@TheoGaming', '@LinaMakeUp',
  '@KevinDuCoin', '@SarahFoodTour', '@MaxRider_officiel',
];
/* Les films à l'affiche — ça tourne toutes les deux saisons */
const FILMS = [
  'Vitesse Maximale 4', 'Les Ombres de Minuit', 'Un Été à Biarritz', 'Braquage Royal',
  'Mission Andromède', 'Cœurs en Fuite', 'Le Pacte des Ombres', 'Super Nova',
  'Les Rois du Bitume', 'Alerte Niveau 5', "L'Île aux Secrets", 'Minuit à Montmartre',
  'Opération Cyclone', 'Zombies au Lycée', 'La Dernière Frontière', 'Le Gang des Casquettes',
];
/* Les destinations de voyage — ça change chaque année */
const DESTINATIONS = [
  'Barcelone', 'la Costa Brava', 'Lisbonne', 'Amsterdam', 'la Croatie',
  'les Landes', "l'Ardèche", 'la Bretagne Sud', 'Prague', 'les Cinque Terre',
];

/* Les tendances TikTok — ça tourne chaque saison */
const TENDANCES_TIKTOK = [
  'le challenge de la baguette', 'la danse du robot cassé', 'le #PasseLeSel',
  'le filtre 80 ans', 'le POV « t\'es en retard »', 'le challenge silence au self',
  'la transition serviette', 'le #RangeTaChambre express', 'les pâtes au chocolat (non)',
  'le lip-sync ralenti', 'les 5 sauts impossibles', 'le micro-trottoir du self',
];

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
  reseaux: [
    '« {prenom}, le compte qui affole les compteurs de {ville} »',
    '« Tout {ville} suit {prenom}. Même la boulangerie. »',
    '« {influenceur} jaloux·se ? Le compte de {prenom} explose »',
  ],
  discret: [
    '« {prenom} ? Connais pas. » — tout {ville}',
    '« L\'année la plus calme de {prenom}, de mémoire de {ville} »',
  ],
};

const POTINS_VILLE = [
  '📰 Le {fastfood} lance une carte de fidélité. La file dépasse la mairie.',
  '📰 Le rond-point de {ville} a été refait. Personne ne sait pourquoi.',
  '📰 Un chat coincé dans un arbre à {ville} : les pompiers applaudis.',
  '📰 {influenceur} a filmé le marché de {ville}. 214 vues.',
  '📰 Le {resto} décroche une fourchette au guide régional. Complet jusqu\'en juin.',
  '📰 « {film} » affiche complet au ciné de {ville} depuis trois soirs.',
  '📰 Crise au {lycee} : le distributeur de snacks est en panne depuis lundi.',
  '📰 Le {club} enchaîne un troisième match nul. Le forum des supporters s\'enflamme.',
  '📰 Wi-Fi gratuit sur la place de {ville} : la jeunesse en liesse.',
  '📰 La fête de {ville} reportée pour cause de pluie. Comme l\'an dernier.',
];

/* ------------------------------------------------------------
   TITRES DE VIE — l'archétype qu'on partage à la fin
   (le moteur teste les conditions dans l'ordre : le premier gagne)
   ------------------------------------------------------------ */
const TITRES_VIE = [
  { id: 'ballon_or', icone: '⚽', nom: 'La Légende du Stade', desc: 'Footballeur·se pro — {ville} a un maillot à ton nom.' },
  { id: 'tete_affiche', icone: '🎤', nom: 'La Tête d\'Affiche', desc: 'Signé·e en musique — {ville} chante tes refrains.' },
  { id: 'star_reseaux', icone: '💫', nom: 'La Star des Réseaux', desc: 'Des millions de vues parties de {ville}. Les marques font la queue.' },
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
    texte: 'Tu tentes « {tiktok} » au marché de {ville}. Avant de poster, ton pouce hésite…',
    options: [
      { txt: '🚀 POSTER. Advienne que pourra', effets: { social: 18, moral: 12, abonnes: 9000 }, note: '2,3 MILLIONS de vues, repartagé par {influenceur}. Le boulanger de {ville} te demande un selfie.' },
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


/* ------------------------------------------------------------
   ARCS NARRATIFS — des histoires en plusieurs épisodes, qui se
   déclenchent selon TA vie (talent foot, abonnés TikTok…) et
   dont chaque choix a de vraies conséquences.
   ------------------------------------------------------------ */
const ARCS = {
  foot_1: { icone: '📹',
    texte: '{ami} t\'a filmé à l\'entraînement sans te le dire : « Frérot, ce geste est INSANE, je le poste ? » La vidéo est déjà montée.',
    options: [
      { txt: '🚀 « Poste-le ! »', effets: { social: 6, moral: 6, abonnes: 2500 }, suite: true, delai: 2,
        note: 'La vidéo tourne fort. Des inconnus commentent « c\'est qui ce crack ?? »' },
      { txt: '🙅 « Supprime, je veux pas le regretter »', effets: { relation: -4, moral: 2 }, stop: true,
        note: '{ami} a soupiré très fort. La vidéo dort dans un téléphone.' },
    ] },
  foot_2: { icone: '🧢',
    texte: 'Un recruteur du {club} a vu le clip. Il te propose un STAGE d\'une semaine au centre de formation… en pleine période de cours. Le {lycee} ne validera jamais.',
    options: [
      { txt: '⚽ Y aller — on verra pour les cours', effets: { forme: 6, savoir: -6, moral: 8 }, formeMin: 35, talentPlus: { foot: 14 }, suite: true, delai: 2,
        note: 'Une semaine de rêve, un carnet de correspondance en feu. Le coach t\'a noté « à suivre de près ».' },
      { txt: '🤝 Négocier un aménagement avec le {lycee}', effets: { savoir: -1, moral: 4 }, talentPlus: { foot: 7 }, suite: true, delai: 3,
        note: 'Trois jours au lieu de sept, devoirs dans le bus. Le recruteur a apprécié le sérieux.' },
      { txt: '📚 Refuser : les cours d\'abord', effets: { savoir: 4, moral: -7 }, stop: true,
        note: 'Choix raisonnable. Mais tu regarderas ce clip longtemps.' },
    ] },
  foot_3: { icone: '📰',
    texte: 'Le journal local titre : « {prenom}, la pépite du {club} ? » Ton téléphone chauffe, tout {ville} en parle. Le recruteur te rappelle : « Continue comme ça et l\'essai pro arrive vite. »',
    options: [
      { txt: '🔥 Redoubler d\'efforts à l\'entraînement', effets: { forme: 8, energie: -8 }, talentPlus: { foot: 8 }, stop: true,
        note: 'Plus que jamais, le rêve est à portée de crampons.' },
      { txt: '😌 Garder la tête froide, rester régulier', effets: { moral: 6 }, talentPlus: { foot: 5 }, stop: true,
        note: 'Les modestes vont loin. Le talent continue de monter, tranquillement.' },
    ] },
  tiktok_1: { icone: '💌',
    texte: 'DM de {marque}, la marque de boissons qui monte : « On adore ton contenu ! Une story avec notre nouveau parfum = 80 €. » Ta première proposition de marque.',
    options: [
      { txt: '🤑 Accepter — premier partenariat !', effets: { argent: 80, abonnes: 800, moral: 4 }, suite: true, delai: 2,
        note: 'Story postée, chèque encaissé. Des marques plus grosses regardent…' },
      { txt: '😇 Refuser : ton contenu reste 100 % toi', effets: { abonnes: 1500, moral: 6 }, suite: true, delai: 2,
        note: '« Respect, pas de pub chez toi » — tes abonnés adorent. Et ça se voit.' },
    ] },
  tiktok_2: { icone: '📞',
    texte: 'Une agence parisienne t\'appelle : « Ton audience explose. On te signe : contrats de marques, tournées, vraie carrière d\'influenceur·se. » C\'est un MÉTIER qu\'on te propose.',
    options: [
      { txt: '💫 Signer — les réseaux, c\'est ta vie', effets: { moral: 12, abonnes: 5000 }, metier: 'influenceur', stop: true,
        note: 'Contrat signé ! Ton premier partenariat national tombe la semaine suivante.' },
      { txt: '🎓 Refuser : tu as d\'autres plans', effets: { moral: 4, savoir: 3 }, stop: true,
        note: 'L\'agence a insisté deux fois. Toi, tu sais où tu vas.' },
    ] },
};


/* ------------------------------------------------------------
   LE PARCOURS — le scénario principal, façon Destiny Eleven :
   une histoire PRÉDÉFINIE qui bifurque selon tes réponses.
   Chaque nœud : { chapitre, qui, emoji, decor, texte, options }
   Chaque option : { txt, effets, note, suivant, dans, voie?, drapeau?, talentPlus? }
   `suivant` = le prochain nœud (la bifurcation) ; `dans` = dans
   combien de saisons (des scènes libres respirent entre-temps).
   ------------------------------------------------------------ */
const PARCOURS = {
  /* ===== ACTE 1 · LE LYCÉE ===== */
  p1: { chapitre: 1, qui: 'La cantine', emoji: '🍽️', decor: 'decor-classe',
    texte: 'Premier midi au {lycee}. Plateau en main, tu balaies la salle : la table des premiers de classe, la bande du fond qui rigole fort, les sportifs du {club}, et le coin des créatifs avec une guitare. Tu t\'assois où ?',
    options: [
      { txt: '🤓 Avec les premiers de classe', effets: { savoir: 6 }, voie: 'tete', suivant: 'p_tete1', dans: 2,
        note: 'On t\'a tendu une fiche de révision en guise de bienvenue. Efficace.' },
      { txt: '😎 La bande du fond', effets: { social: 6, moral: 4 }, voie: 'bande', suivant: 'p_bande1', dans: 2,
        note: 'En dix minutes, tu as trois surnoms et une place attitrée.' },
      { txt: '⚽ Les sportifs du {club}', effets: { forme: 6 }, voie: 'sport', suivant: 'p_sport1', dans: 2, talentPlus: { foot: 5 },
        note: 'On t\'a demandé ton poste préféré avant ton prénom.' },
      { txt: '🎸 Le coin des créatifs', effets: { moral: 6 }, voie: 'crea', suivant: 'p_crea1', dans: 2, talentPlus: { musique: 5 },
        note: 'Quelqu\'un a accordé la guitare et dit : « tu chantes ? »' },
    ] },

  /* — chapitre 2 : ta voie s'installe (4 branches) — */
  p_tete1: { chapitre: 2, qui: 'Le prof principal', emoji: '👩‍🏫', decor: 'decor-classe',
    texte: '« J\'ai remarqué ton niveau. Le concours académique approche — je peux te préparer. Mais c\'est des heures en plus, tous les mercredis. »',
    options: [
      { txt: '🏆 Viser le concours', effets: { savoir: 9, energie: -8 }, suivant: 'p_tete2', dans: 2,
        note: 'Les mercredis brûlent, ton niveau explose. Sam te regarde différemment.' },
      { txt: '🤝 Proposer plutôt un tutorat entre élèves', effets: { savoir: 4, social: 7 }, suivant: 'p_tete2', dans: 2,
        note: 'Ton petit groupe d\'entraide devient LE bon plan du lycée.' },
      { txt: '🌪️ Avouer que tu t\'ennuies, tu veux autre chose', effets: { moral: 5 }, suivant: 'p_doute', dans: 2,
        note: 'Le prof a souri : « Alors cherche ce qui t\'allume. »' },
    ] },
  p_bande1: { chapitre: 2, qui: 'La bande', emoji: '😎', decor: 'decor-rue',
    texte: 'La bande veut marquer le coup : LA soirée de l\'année, dans l\'ancien local près du {fastfood}. Problème : il faut une salle, de la musique, et que personne ne l\'apprenne… ou presque.',
    options: [
      { txt: '🎉 L\'organiser, à fond', effets: { social: 10, moral: 6, savoir: -3, argent: -20 }, suivant: 'p_bande2', dans: 2,
        note: 'Historique. Trois lycées en parlent. Ton nom circule.' },
      { txt: '📋 Version maligne : négocier la salle des fêtes', effets: { social: 6, savoir: 3 }, suivant: 'p_bande2', dans: 2,
        note: 'La mairie a dit oui. La bande t\'appelle « le ministre ».' },
      { txt: '🚪 C\'est trop pour toi, tu t\'éloignes', effets: { moral: -3, savoir: 3 }, suivant: 'p_doute', dans: 2,
        note: 'La soirée s\'est faite sans toi. Tu te demandes où est ta place.' },
    ] },
  p_sport1: { chapitre: 2, qui: 'Le coach', emoji: '🧢', decor: 'decor-stade',
    texte: 'Le coach du {club} te prend à part : « Les minimes ont besoin d\'un capitaine. Toi. Mais si tu préfères, concentre-toi sur ta propre place en équipe première. »',
    options: [
      { txt: '🫡 Capitaine des minimes', effets: { social: 8, forme: 4 }, suivant: 'p_sport2', dans: 2, talentPlus: { foot: 4 },
        note: 'Mener, ça s\'apprend. Les petits te suivent partout.' },
      { txt: '🎯 Ta place d\'abord, à fond', effets: { forme: 9, energie: -6 }, suivant: 'p_sport2', dans: 2, talentPlus: { foot: 8 },
        note: 'Doublé d\'entraînements. Le coach note tout.' },
      { txt: '😕 Le foot te pèse en ce moment', effets: { moral: 4 }, suivant: 'p_doute', dans: 2,
        note: '« Reviens quand la flamme revient », dit le coach.' },
    ] },
  p_crea1: { chapitre: 2, qui: 'Le groupe', emoji: '🎸', decor: 'decor-maison',
    texte: 'Le groupe répète dans un garage. On te propose : premier mini-concert au {cafe}… ou poster vos covers en ligne d\'abord, pour « exister sur les réseaux ».',
    options: [
      { txt: '🎤 Le concert au {cafe}', effets: { moral: 8, social: 6, energie: -5 }, suivant: 'p_crea2', dans: 2, talentPlus: { musique: 8 },
        note: 'Vingt personnes, deux rappels. Tes jambes tremblaient, ta voix non.' },
      { txt: '📱 Les covers en ligne', effets: { abonnes: 700, moral: 5 }, suivant: 'p_crea2', dans: 2, talentPlus: { musique: 5 },
        note: 'La troisième vidéo décolle. Des inconnus fredonnent TA version.' },
      { txt: '🌫️ Tu doutes de ta place dans le groupe', effets: { moral: 3 }, suivant: 'p_doute', dans: 2,
        note: 'Tu as posé la guitare. Pour l\'instant.' },
    ] },
  p_doute: { chapitre: 2, qui: 'Toi-même', emoji: '🪞', decor: 'decor-maison',
    texte: 'Un dimanche soir, face au plafond : cette voie ne te ressemble pas. Il est encore temps de changer de table. Qu\'est-ce qui t\'attire vraiment ?',
    options: [
      { txt: '🤓 Les études, finalement', effets: { savoir: 5 }, voie: 'tete', suivant: 'p_bac_veille', dans: 5,
        note: 'Tu t\'installes au premier rang. Personne ne commente. Tout le monde a compris.' },
      { txt: '😎 Les gens, les soirées, la vie', effets: { social: 6 }, voie: 'bande', suivant: 'p_bac_veille', dans: 5,
        note: 'La bande t\'accueille comme si tu n\'étais jamais parti·e.' },
      { txt: '⚽ Le terrain', effets: { forme: 5 }, voie: 'sport', suivant: 'p_bac_veille', dans: 5, talentPlus: { foot: 5 },
        note: 'Le coach a juste dit : « La flamme est revenue ? Enfile les crampons. »' },
      { txt: '🎤 La musique', effets: { moral: 5 }, voie: 'crea', suivant: 'p_bac_veille', dans: 5, talentPlus: { musique: 5 },
        note: 'Le groupe a gardé ta place. Et ta guitare.' },
    ] },

  /* — chapitre 3 : l'épreuve de ta voie — */
  p_tete2: { chapitre: 3, qui: 'Sam', emoji: '🤓', decor: 'decor-classe',
    texte: 'Catastrophe : le sujet du prochain contrôle circule sur le groupe de la classe. Tout le monde l\'a vu. Sam te regarde : « On fait quoi, nous ? »',
    options: [
      { txt: '🛑 Le signaler au prof, quitte à être impopulaire', effets: { savoir: 4, social: -6, moral: 6 }, suivant: 'p_amour', dans: 2,
        note: 'Contrôle annulé, classe furieuse, conscience tranquille. Le prof, lui, saura s\'en souvenir.' },
      { txt: '🙈 Ne rien dire, mais ne pas l\'utiliser', effets: { moral: 3, savoir: 2 }, suivant: 'p_amour', dans: 2,
        note: 'Tu as composé sans triche. Ta moyenne le prouve — les autres ont eu 18.' },
      { txt: '👀 Le lire « juste pour vérifier »', effets: { savoir: 5, moral: -5 }, suivant: 'p_amour', dans: 2,
        note: '19/20. Le chiffre te félicite, le miroir un peu moins.' },
    ] },
  p_bande2: { chapitre: 3, qui: 'Théo', emoji: '🎮', decor: 'decor-rue',
    texte: 'Un gars de la bande a « emprunté » le scooter de son cousin et l\'a rayé. Il panique, il te demande de dire que vous étiez ensemble ce soir-là. Toute la bande te regarde.',
    options: [
      { txt: '🤥 Le couvrir, c\'est la famille', effets: { relation: 10, moral: -6 }, suivant: 'p_amour', dans: 2,
        note: 'La bande t\'est reconnaissante. Le mensonge, lui, pèse trois grammes de trop.' },
      { txt: '💬 L\'accompagner pour tout avouer au cousin', effets: { moral: 8, social: 4 }, suivant: 'p_amour', dans: 2,
        note: 'Le cousin a gueulé, puis respecté. La bande a retenu la leçon : tu es droit·e.' },
      { txt: '🚶 Refuser net et t\'en aller', effets: { moral: 4, relation: -8 }, suivant: 'p_amour', dans: 2,
        note: 'Tu dors tranquille. La bande fait la tête. Ça passera. Peut-être.' },
    ] },
  p_sport2: { chapitre: 3, qui: 'Inès', emoji: '⚽', decor: 'decor-stade',
    texte: 'Le titulaire à TON poste se blesse à l\'échauffement. Le coach hésite entre toi… et Inès, qui attend sa chance depuis deux ans. Elle te glisse : « Vas-y, toi. T\'es meilleur·e. » Sa voix tremble un peu.',
    options: [
      { txt: '⚡ Prendre la place, c\'est le jeu', effets: { forme: 6, moral: 4, relation: -6 }, suivant: 'p_amour', dans: 2, talentPlus: { foot: 8 },
        note: 'Tu as brillé. Inès a applaudi, les yeux ailleurs.' },
      { txt: '🎁 Dire au coach de la faire jouer', effets: { relation: 14, moral: 6 }, suivant: 'p_amour', dans: 2,
        note: 'Elle a marqué. En sortant, elle t\'a serré si fort que t\'as craqué une côte. Ami·e à vie.' },
      { txt: '🗣️ Proposer au coach un mi-temps chacun', effets: { social: 5, forme: 3, relation: 5 }, suivant: 'p_amour', dans: 2, talentPlus: { foot: 4 },
        note: 'Solution d\'équipe. Le coach a levé un sourcil : « Pas bête. »' },
    ] },
  p_crea2: { chapitre: 3, qui: 'Un « producteur »', emoji: '🕶️', decor: 'decor-rue',
    texte: 'Après votre passage au {cafe}, un type en veste brillante : « Je produis des artistes. Pour 100 €, je vous enregistre un single et je le place. Offre limitée, décidez ce soir. »',
    options: [
      { txt: '🚩 Flairer l\'arnaque et refuser poliment', effets: { savoir: 4, moral: 4 }, suivant: 'p_amour', dans: 2,
        note: 'Deux semaines plus tard, il « produisait » des montres. Bien vu.' },
      { txt: '💸 Tenter le coup, on ne sait jamais', effets: { argent: -100, moral: -4 }, suivant: 'p_amour', dans: 2,
        note: 'Le « single » est un fichier MP3 mal mixé. Leçon à 100 €.' },
      { txt: '🎙️ Négocier : il paie le studio, vous partagez', effets: { social: 6, moral: 4 }, suivant: 'p_amour', dans: 2, talentPlus: { musique: 5 },
        note: 'Il a ri, puis accepté. Le morceau est correct. Le type a disparu, le fichier reste.' },
    ] },

  /* — chapitre 4 : l'amour s'en mêle — */
  p_amour: { chapitre: 4, qui: 'Ton cœur', emoji: '💘', decor: 'decor-rue',
    texte: 'Depuis quelques semaines, il y a cette personne. Au {cine}, en cours, partout. Vos regards se croisent une fois de trop pour que ce soit un hasard. Ce soir, elle est à trois mètres de toi.',
    options: [
      { txt: '💬 Aller lui parler, maintenant', effets: { moral: 10, social: 5 }, drapeau: 'couple', suivant: 'p_couple', dans: 2,
        note: 'Deux heures de conversation. Vous avez un « endroit à vous » désormais.' },
      { txt: '🫂 Rester ami·e·s — c\'est déjà bien', effets: { social: 6, moral: 2 }, suivant: 'p_solo', dans: 2,
        note: 'Une amitié en or. Avec un léger « et si » en filigrane.' },
      { txt: '🙈 Fuir. Trop. La. Pression.', effets: { moral: -4, energie: 5 }, suivant: 'p_solo', dans: 2,
        note: 'Tu as marché très vite vers nulle part. Champion·ne du monde de l\'esquive.' },
    ] },
  p_couple: { chapitre: 4, qui: 'Ton couple', emoji: '💑', decor: 'decor-maison',
    texte: 'Premier vrai choc : samedi, c\'est l\'anniversaire de votre rencontre… et le grand moment de ta bande (match, concert, soirée — tout tombe le même soir).',
    options: [
      { txt: '❤️ L\'anniversaire, sans hésiter', effets: { moral: 8, social: -4 }, suivant: 'p_bac_veille', dans: 2,
        note: 'Une soirée parfaite. Tes potes ont mis trois jours à te pardonner.' },
      { txt: '🤹 Négocier : les deux, en courant', effets: { energie: -10, moral: 6, social: 4 }, suivant: 'p_bac_veille', dans: 2,
        note: 'Tu as tout fait, tout réussi, et dormi 14 heures dimanche.' },
      { txt: '🎟️ Ta bande d\'abord, promis on fête ça dimanche', effets: { social: 6, moral: -5 }, suivant: 'p_bac_veille', dans: 2,
        note: 'Dimanche, l\'ambiance était… polaire. Rattrapage nécessaire.' },
    ] },
  p_solo: { chapitre: 4, qui: 'La bande', emoji: '🎉', decor: 'decor-rue',
    texte: 'Pas de couple, mais une bande en feu : ils veulent partir camper à l\'arrache le week-end avant la grosse semaine de contrôles.',
    options: [
      { txt: '⛺ Y aller — ces souvenirs n\'ont pas de prix', effets: { moral: 10, relation: 8, savoir: -3 }, suivant: 'p_bac_veille', dans: 2,
        note: 'Feu de camp, étoiles, zéro révision. Aucun regret (pour l\'instant).' },
      { txt: '📚 Rester réviser, y aller au prochain', effets: { savoir: 6, moral: -3 }, suivant: 'p_bac_veille', dans: 2,
        note: 'Les photos du camp te narguent. Tes notes te consolent.' },
      { txt: '🌗 Les rejoindre juste le samedi soir', effets: { moral: 6, relation: 4, savoir: 2 }, suivant: 'p_bac_veille', dans: 2,
        note: 'L\'art du compromis. Tu commences à devenir fort·e à ce jeu.' },
    ] },

  /* — chapitre 5 : la veille du bac — */
  p_bac_veille: { chapitre: 5, qui: 'Ta famille', emoji: '👨‍👩‍👧', decor: 'decor-maison',
    texte: 'Dernière ligne droite avant le bac. À table, ta famille tente un discours de motivation. Toi, tu choisis ta stratégie pour les dernières semaines.',
    options: [
      { txt: '📚 Marathon de révisions, rideau fermé', effets: { savoir: 8, energie: -10, moral: -3 }, suivant: 'p_ete', dans: 3,
        note: 'Tes fiches ont des fiches. Tu es prêt·e. Épuisé·e, mais prêt·e.' },
      { txt: '🧘 Réviser bien, dormir bien, vivre bien', effets: { savoir: 5, moral: 5 }, suivant: 'p_ete', dans: 3,
        note: 'Équilibre trouvé. Tu entres dans l\'examen frais·che comme un matin de printemps.' },
      { txt: '🎲 Miser sur ton talent naturel', effets: { moral: 6, savoir: -2 }, suivant: 'p_ete', dans: 3,
        note: 'Audacieux. L\'Histoire jugera. Littéralement, il y a une épreuve d\'histoire.' },
    ] },

  /* ===== ACTE 2 · APRÈS LE BAC ===== */
  p_ete: { chapitre: 6, qui: 'L\'été', emoji: '☀️', decor: 'decor-ete',
    texte: 'L\'été de tous les possibles. Trois plans sur la table, un seul été.',
    options: [
      { txt: '🚗 Road-trip avec la bande vers {destination}', effets: { moral: 10, social: 6, argent: -80 }, suivant: 'p_route', dans: 2,
        note: 'Le coffre ferme à peine. La playlist est prête. En route.' },
      { txt: '💼 Bosser au {fastfood} tout l\'été', effets: { argent: 350, energie: -12 }, suivant: 'p_argent', dans: 2,
        note: 'L\'odeur de friture ne part plus. Ton compte en banque, lui, sourit.' },
      { txt: '📖 Préparer la suite : bosser ton projet', effets: { savoir: 6, moral: 3 }, suivant: 'p_prepa', dans: 2,
        note: 'Pendant que les autres bronzent, toi tu construis. Chacun son été.' },
    ] },
  p_route: { chapitre: 6, qui: 'Marco', emoji: '🛹', decor: 'decor-rue',
    texte: 'Panne SÈCHE à 400 bornes de chez vous, en pleine campagne, 23 h 40. Marco sort une carte routière de 1998. La bande te regarde : c\'est toi le cerveau de l\'opération.',
    options: [
      { txt: '🔧 Réparer vous-mêmes à la lampe torche', effets: { savoir: 5, moral: 8, relation: 8 }, suivant: 'p_20ans', dans: 2,
        note: 'À 3 h du matin, le moteur a toussé puis ronronné. Vous avez hurlé de joie dans la nuit.' },
      { txt: '🏕️ Dormir sur place, aviser demain', effets: { moral: 6, energie: 6, relation: 5 }, suivant: 'p_20ans', dans: 2,
        note: 'Meilleure nuit à la belle étoile de ta vie. La dépanneuse est venue au petit déj.' },
      { txt: '📞 Appeler les parents (la honte, mais bon)', effets: { moral: -3, argent: -30 }, suivant: 'p_20ans', dans: 2,
        note: 'Ton père a fait 400 bornes en sifflotant. Tu entendras parler de cette nuit à chaque Noël.' },
    ] },
  p_argent: { chapitre: 6, qui: 'Le gérant', emoji: '🧑‍💼', decor: 'decor-bureau',
    texte: 'Fin août, le gérant du {fastfood} te bloque : « T\'es le/la meilleur·e élément que j\'aie eu. CDI, temps plein, tout de suite. Réfléchis pas trop. »',
    options: [
      { txt: '🙏 Décliner avec classe — tu as d\'autres plans', effets: { moral: 5, social: 3 }, suivant: 'p_20ans', dans: 2,
        note: 'Il a hoché la tête : « Reviens quand tu veux. » Une porte reste ouverte.' },
      { txt: '💶 Accepter des extras le week-end seulement', effets: { argent: 150, energie: -8 }, suivant: 'p_20ans', dans: 2,
        note: 'Le meilleur des deux mondes. Fatigant, mais le compte grossit.' },
      { txt: '🤝 Négocier un poste de responsable', effets: { argent: 80, savoir: 4, social: 4 }, suivant: 'p_20ans', dans: 2,
        note: 'Il a ri : « T\'as du culot. » Puis il a dit oui pour les vacances scolaires.' },
    ] },
  p_prepa: { chapitre: 6, qui: 'Toi-même', emoji: '🪞', decor: 'decor-maison',
    texte: 'Mi-août. Tout le monde poste ses photos de vacances, toi tu bosses ton avenir. Un soir de doute : ça vaut le coup ?',
    options: [
      { txt: '🔥 Oui. Tu redoubles d\'efforts', effets: { savoir: 8, energie: -8 }, suivant: 'p_20ans', dans: 2,
        note: 'Septembre te trouvera prêt·e comme personne.' },
      { txt: '🏖️ Tu t\'accordes UNE semaine de vraie pause', effets: { moral: 8, energie: 12, savoir: 2 }, suivant: 'p_20ans', dans: 2,
        note: 'Sept jours de vide total. Tu reviens affûté·e et bronzé·e.' },
    ] },

  /* — chapitre 7 : 20 ans, le recentrage — */
  p_20ans: { chapitre: 7, qui: 'Toi, la vingtaine', emoji: '🎂', decor: 'decor-automne',
    texte: 'La vingtaine s\'installe. Dans le bus, front contre la vitre, tu te demandes : c\'est quoi, la priorité des prochaines années ?',
    options: [
      { txt: '🚀 La carrière : réussir, prouver, construire', effets: { savoir: 4, moral: 3 }, suivant: 'p_carriere1', dans: 4,
        note: 'Objectif verrouillé. Que ça plaise ou non.' },
      { txt: '🫂 Les gens : ta bande, ta famille, l\'amour', effets: { social: 5, moral: 4 }, suivant: 'p_amis1', dans: 4,
        note: 'On ne se souvient pas des open spaces. On se souvient des gens.' },
      { txt: '🗺️ La liberté : voir, vivre, bouger', effets: { moral: 6 }, suivant: 'p_liberte1', dans: 4,
        note: 'Posséder peu, vivre beaucoup. Programme validé.' },
    ] },
  p_carriere1: { chapitre: 8, qui: 'Le rival', emoji: '🦊', decor: 'decor-bureau',
    texte: 'Il y a cette personne — même âge, même ambition — qui te double partout : stages, notes, réseau. Aujourd\'hui elle vient de rafler LE poste/la place que tu visais, et te nargue à moitié.',
    options: [
      { txt: '💪 Bosser deux fois plus, la dépasser', effets: { savoir: 7, energie: -10 }, suivant: 'p_grand_saut', dans: 4,
        note: 'Six mois plus tard, c\'est TOI qu\'on cite en exemple. Le rival t\'a envoyé un 👏.' },
      { txt: '🤝 Lui proposer une alliance', effets: { social: 8, savoir: 3 }, suivant: 'p_grand_saut', dans: 4,
        note: 'Rivaux devenus tandem. À deux, vous êtes injouables.' },
      { txt: '🧘 Refuser cette course, tracer TA route', effets: { moral: 8 }, suivant: 'p_grand_saut', dans: 4,
        note: 'Le jour où tu as arrêté de comparer, tout est devenu plus léger.' },
    ] },
  p_amis1: { chapitre: 8, qui: 'Ton meilleur pote', emoji: '🧳', decor: 'decor-rue',
    texte: 'Coup de tonnerre : ton meilleur pote annonce qu\'il part s\'installer à 800 bornes. Son week-end d\'adieu tombe pile sur une obligation énorme (exam, boulot, sélection — la totale).',
    options: [
      { txt: '🚄 Y aller quand même, advienne que pourra', effets: { relation: 14, moral: 8, savoir: -4 }, suivant: 'p_grand_saut', dans: 4,
        note: 'Tu as eu des ennuis. Aucune importance : certaines nuits valent une carrière.' },
      { txt: '📹 Organiser un adieu décalé, rien qu\'à vous', effets: { relation: 8, moral: 5 }, suivant: 'p_grand_saut', dans: 4,
        note: 'Un week-end surprise trois semaines après. Il a pleuré. Toi « non ».' },
      { txt: '😔 Assumer l\'obligation, s\'excuser', effets: { savoir: 5, relation: -8, moral: -4 }, suivant: 'p_grand_saut', dans: 4,
        note: 'Il a compris. Mais quelque chose s\'est un peu éteint dans le groupe.' },
    ] },
  p_liberte1: { chapitre: 8, qui: 'L\'occasion', emoji: '🎫', decor: 'decor-printemps',
    texte: 'Une annonce improbable : un van aménagé à retaper, quasi donné, et un festival itinérant qui cherche des bénévoles tout l\'été à travers la France.',
    options: [
      { txt: '🚐 Le van + le festival : l\'été nomade', effets: { moral: 12, social: 8, argent: -120, energie: -6 }, suivant: 'p_grand_saut', dans: 4,
        note: 'Trois mois, quarante villes, cent histoires. Tu ne racontes plus ta vie pareil.' },
      { txt: '🛠️ Juste le van : le retaper, le louer', effets: { argent: 200, savoir: 5 }, suivant: 'p_grand_saut', dans: 4,
        note: 'Ton premier « business » qui roule. Littéralement.' },
      { txt: '📆 Trop tôt — tu notes l\'idée pour plus tard', effets: { moral: -2, argent: 40 }, suivant: 'p_grand_saut', dans: 4,
        note: 'Le van est parti en trois jours. L\'idée, elle, est restée.' },
    ] },

  /* ===== ACTE 3 · LE GRAND SAUT ===== */
  p_grand_saut: { chapitre: 9, qui: 'L\'appel', emoji: '📞', decor: 'decor-bureau',
    texte: 'LE coup de fil qui change tout : une opportunité à l\'étranger — un an, tout compris (boulot, contrat, aventure, selon ta vie). Ici, tout te retient. Là-bas, tout t\'appelle.',
    options: [
      { txt: '✈️ Partir. On ne regrette que ce qu\'on n\'a pas fait', effets: { moral: 8, social: 5, argent: -100 }, drapeau: 'monde', suivant: 'p_retour', dans: 3,
        note: 'L\'aéroport, la boule au ventre, puis l\'ivresse. Une année qui compte double.' },
      { txt: '🏡 Rester et construire ici, à {ville}', effets: { argent: 200, moral: 4 }, suivant: 'p_racines', dans: 3,
        note: 'Les racines aussi, c\'est une aventure. La tienne.' },
    ] },
  p_retour: { chapitre: 10, qui: 'Le retour', emoji: '🛬', decor: 'decor-rue',
    texte: 'Un an après, te revoilà à {ville}. Le {cafe} n\'a pas bougé, toi si. Ta bande a continué sa vie, ton accent a pris des couleurs. Tu reviens comment ?',
    options: [
      { txt: '📣 Avec mille projets plein la tête', effets: { moral: 8, savoir: 5, abonnes: 400 }, suivant: 'p_fonder', dans: 3,
        note: 'Ton énergie est contagieuse. Même le serveur du {cafe} veut partir.' },
      { txt: '🫂 Discret·e, juste heureux·se de retrouver les tiens', effets: { relation: 10, moral: 6 }, suivant: 'p_fonder', dans: 3,
        note: 'Les retrouvailles ont duré jusqu\'à 4 h du matin. Comme avant. Mieux qu\'avant.' },
    ] },
  p_racines: { chapitre: 10, qui: 'Le notaire (si, si)', emoji: '🗝️', decor: 'decor-bureau',
    texte: 'À force d\'économies, une porte s\'ouvre : un petit appart à {ville} à retaper, ou continuer à louer et garder ta liberté de mouvement.',
    options: [
      { txt: '🔑 Acheter et retaper — TON chez-toi', effets: { argent: -400, moral: 10 }, drapeau: 'proprio', suivant: 'p_fonder', dans: 3,
        note: 'Des travaux, des jurons, puis ce moment : tes clés, tes murs, ton canapé.' },
      { txt: '🧳 Rester libre, investir ailleurs', effets: { argent: 100, moral: 4 }, suivant: 'p_fonder', dans: 3,
        note: 'Ton épargne travaille pendant que tu vis. Pas de murs, pas de chaînes.' },
    ] },
  /* ===== ACTE 4 · LA FAMILLE (OU PAS) ===== */
  p_fonder: { chapitre: 11, qui: 'La grande question', emoji: '🏡', decor: 'decor-maison',
    texte: 'La trentaine. Autour de toi, ça se marie, ça pouponne, ça achète des poussettes qui coûtent un SMIC. Et toi, tu la veux comment, ta vie ?',
    options: [
      { txt: '👶 Fonder une famille — c\'est le moment', effets: { moral: 10, energie: -8, argent: -100 }, drapeau: 'parent', suivant: 'p_famille2', dans: 3,
        note: 'Neuf mois plus tard, un petit être hurle dans tes bras. Rien ne sera plus jamais pareil. Tant mieux.' },
      { txt: '🌍 Une vie sans enfants, choisie et assumée', effets: { moral: 8, argent: 150 }, drapeau: 'sansEnfant', suivant: 'p_projets2', dans: 3,
        note: 'Ta vie, tes règles. Tu réponds « et toi, ça va le travail ? » aux questions indiscrètes des repas de famille.' },
      { txt: '📋 Adopter, plus tard — le projet se construit', effets: { moral: 6, savoir: 3 }, drapeau: 'parent', suivant: 'p_famille2', dans: 3,
        note: 'Le dossier est long, l\'attente immense, et le jour où l\'appel arrive, le monde s\'arrête.' },
    ] },
  p_famille2: { chapitre: 12, qui: '{enfant}', emoji: '👶', decor: 'decor-maison',
    texte: '{enfant} a grandi d\'un coup. Ce soir, gros dilemme : présentation cruciale demain au travail, et {enfant} joue son premier spectacle de l\'école. Les deux à 18 h.',
    options: [
      { txt: '🎭 Le spectacle. Le travail attendra', effets: { moral: 12, argent: -50 }, suivant: 'p_quarantaine', dans: 4,
        note: '{enfant} t\'a cherché·e des yeux avant de chanter. Ce regard-là vaut toutes les promotions.' },
      { txt: '💼 La présentation — tu te rattrapes ce week-end', effets: { argent: 200, moral: -6 }, suivant: 'p_quarantaine', dans: 4,
        note: 'Présentation brillante. La vidéo du spectacle, filmée par mamie, t\'a serré la gorge.' },
      { txt: '🤹 Négocier : présentation à distance, au fond de la salle', effets: { energie: -10, moral: 8, savoir: 3 }, suivant: 'p_quarantaine', dans: 4,
        note: 'Micro coupé, caméra floue, {enfant} qui chante. Tu as TOUT eu. Épuisant et parfait.' },
    ] },
  p_projets2: { chapitre: 12, qui: 'Ton grand projet', emoji: '🚀', decor: 'decor-bureau',
    texte: 'Sans enfants à élever, tu as un luxe rare : du temps et de l\'élan. La décennie est à toi. Tu la consacres à quoi ?',
    options: [
      { txt: '🏢 Monter ta propre affaire à {ville}', effets: { argent: -200, savoir: 6, moral: 8 }, drapeau: 'patron', suivant: 'p_quarantaine', dans: 4,
        note: 'Deux ans de galère, puis ça tourne. Ton nom sur une devanture de {ville}.' },
      { txt: '🌏 Le grand voyage — six mois, sac au dos, pour de vrai', effets: { moral: 12, social: 6, argent: -250 }, suivant: 'p_quarantaine', dans: 4,
        note: 'Tu reviens avec 4 000 photos et une paix intérieure que rien n\'entame.' },
      { txt: '🫂 T\'investir : assos, mairie, la vie de {ville}', effets: { social: 10, moral: 8 }, suivant: 'p_quarantaine', dans: 4,
        note: 'Tout le monde te connaît. Le maire te demande ton avis. Ta ville a ta signature.' },
    ] },
  p_quarantaine: { chapitre: 13, qui: 'Le miroir', emoji: '🪞', decor: 'decor-automne',
    texte: 'Quarante ans. Un matin, le miroir te tend une embuscade : premiers cheveux blancs, vieux rêves qui toussent. Crise… ou renaissance ?',
    options: [
      { txt: '🔥 Renaissance : reprendre un vieux rêve (sport, musique, projet)', effets: { moral: 12, forme: 8, energie: -6 }, suivant: 'p_transmission', dans: 4,
        note: 'On n\'est jamais trop vieux. Tu es la preuve vivante, et un peu courbaturée.' },
      { txt: '🧘 Acceptation : tu aimes la vie que tu as construite', effets: { moral: 10, energie: 8 }, suivant: 'p_transmission', dans: 4,
        note: 'La paix. La vraie. Celle qui ne se photographie pas.' },
      { txt: '🏍️ Cliché total : l\'achat impulsif qui fait du bien', effets: { moral: 8, argent: -300 }, suivant: 'p_transmission', dans: 4,
        note: 'Oui, c\'est un cliché. Oui, ça fait un bien fou. Non, tu ne regrettes rien.' },
    ] },
  p_transmission: { chapitre: 14, qui: 'Un·e jeune de {ville}', emoji: '🌱', decor: 'decor-rue',
    texte: 'Au {cafe}, un·e jeune de {ville} te demande conseil — même regard, mêmes doutes que toi à 16 ans. Tu donnes quoi à la génération d\'après ?',
    options: [
      { txt: '🎓 Devenir mentor — du temps, chaque semaine', effets: { social: 8, moral: 10, energie: -4 }, suivant: 'p_finale', dans: 3,
        note: 'Le jour où « ton » jeune réussit, tu pleures plus fort que sa propre famille.' },
      { txt: '💶 Financer : une bourse, un club, un local', effets: { argent: -200, moral: 8, social: 4 }, suivant: 'p_finale', dans: 3,
        note: 'Une plaque discrète porte ton nom quelque part dans {ville}. Tu passes devant sans t\'arrêter. Enfin, presque.' },
      { txt: '📖 Raconter : ton histoire, sans filtre', effets: { moral: 8, abonnes: 800 }, suivant: 'p_finale', dans: 3,
        note: '« Et surtout : réponds aux questions avec le cœur. » Le/la jeune a souri. Toi aussi.' },
    ] },
  p_finale: { chapitre: 15, qui: 'La veille de tes 50 ans', emoji: '🕯️', decor: 'decor-hiver',
    texte: 'Demain, 50 ans. Une moitié de vie derrière toi, écrite question après question. Ce soir, une dernière chose à faire — celle qui te ressemble.',
    options: [
      { txt: '📔 Écrire une lettre à ton toi de 16 ans', effets: { moral: 10 }, suivant: null,
        note: '« Tu ne vas pas me croire, mais… » Trois pages plus tard, tu souris.' },
      { txt: '🍽️ Réunir tout le monde au {resto}', effets: { social: 8, relation: 8, argent: -60 }, suivant: null,
        note: 'Toutes tes époques autour d\'une table. Le patron a offert le dessert.' },
      { txt: '🌃 Marcher seul·e dans {ville}, écouteurs vissés', effets: { moral: 6, energie: 6 }, suivant: null,
        note: 'Chaque rue a une histoire. Les tiennes. Demain, la suite.' },
    ] },
};
