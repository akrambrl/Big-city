/* ============================================================
   BIG CITY LIFE — Moteur du jeu de vie
   Un tour = un mois : une activité choisie sur la carte, l'école
   ou le boulot en fond, des scènes de vie, des examens, des amis.
   ============================================================ */

const Vie = (() => {
  let S = null;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const clamp100 = (v) => clamp(v, 0, 100);

  /* ---------- Hasard à graine : le Défi du jour est le même pour tout le monde ---------- */

  function graineDepuis(txt) {
    let h = 2166136261;
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function rnd() {
    S.rngN = (S.rngN + 1) | 0;
    let t = (S.graine + Math.imul(S.rngN, 0x6D2B79F5)) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /* Le défi du jour : même graine, même ville, mêmes questions pour toute la France */
  function defiDuJour() {
    const d = new Date();
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const graine = graineDepuis('bcl-defi-' + cle);
    const codes = Object.keys(DEPTS_FR);
    const dept = codes[graine % codes.length];
    const ville = COMMUNES_FR.parDept(dept)[0] || COMMUNES_FR.chercher('Paris')[0];
    const dateFr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return { cle, dateFr, graine, ville };
  }

  /* ---------- Création ---------- */

  function nouvellePartie({ ville, ambiance, perso, familleId, amisIds, filiereId, graine, defi }) {
    const famille = FAMILLES.find(f => f.id === familleId);
    S = {
      version: 1,
      graine: graine || ((Math.random() * 4294967296) >>> 0),
      rngN: 0,
      defi: defi || null,        // { cle, dateFr } quand c'est le Défi du jour
      raresVues: [],             // moments rares déjà vécus (une fois chacun)
      burnouts: 0,
      ville, profil: ambiance,
      commune: ville.nom,
      monde: null,               // lycée, fast-food, resto… générés juste après
      voisines: ville.voisines || null,
      population: ville.pop, populationInitiale: ville.pop,
      cadre: { voirie: 70 }, equipements: [], // pour la carte
      perso,                     // { prenom, genre, emoji }
      familleId,
      filiereId,
      orientationId: null,       // choisi après le bac
      pauseFaite: false,         // une seule année off (sabbatique / voyage) par vie
      finPause: null,            // dernière saison de l'année off
      metierId: null,
      bacObtenu: null,           // null | true | false
      mois: 1,                   // mois 1 = septembre de la seconde (15 ans)
      stats: { energie: 70, moral: 70, savoir: 30, social: 55, forme: 60 },
      talents: { foot: 0, musique: 0 },
      essaiPropose: null,        // 'foot' | 'musique' : un recruteur attend ta réponse
      essaisTentes: { foot: 0, musique: 0 },
      rechercheEmploi: false,    // vrai quand c'est à TOI de décrocher ton métier
      entretienDispo: 0,         // cooldown après un entretien raté
      argent: famille.argentDepart,
      abonnes: 150,              // tes abonnés sur les réseaux — ça peut devenir un métier
      drapeaux: {},              // permis, chien, voiture… les traces de tes choix
      enfants: [],               // les prénoms de tes enfants (si tu choisis d'en avoir)
      saisonsFaibleForme: 0,     // trop de saisons en mauvaise forme → maladie
      maladies: 0,
      arcs: { foot: { etape: 0, prochainMois: 0, actif: true }, tiktok: { etape: 0, prochainMois: 0, actif: true } },
      parcours: { noeud: 'p1', prochainMois: 1, voie: null }, // le scénario principal qui bifurque
      amis: amisIds.map(id => ({ id, relation: 50 })),
      carte: null,               // la question en cours { type: 'scene'|'rythme', id, amiId }
      pileScenes: [],
      pileRythmes: [],
      sceneActive: null,         // (compat interne : les scènes passent par `carte`)
      choixOrientation: false,   // vrai quand il faut choisir post-bac
      objectifsFaits: {},        // id -> true (chaque objectif se valide indépendamment)
      refAnnee: { argent: famille.argentDepart }, // photo de début d'année (pour le bilan)
      bilanAnnee: null,          // la mise en scène de fin d'année, à afficher
      annee: 1,
      xp: 0, niveau: 1,
      notifications: [],
      journal: [],
      cinematiques: [],
      historique: [],            // { mois, bonheur, argent }
      gameOver: null,
    };
    S.monde = genererMonde();
    log(`🎒 Rentrée de seconde au ${S.monde.lycee}, à ${ville.nom}. ${famille.ambiance}`);
    nouvelleCarte();
    return S;
  }

  /* ---------- Le monde nommé : ton lycée, ton fast-food, ton club ---------- */

  function genererMonde() {
    /* graine dédiée (indépendante de rngN) : le Défi du jour partage le même monde */
    const g = graineDepuis('monde-' + S.graine + '-' + S.commune);
    const pioche = (arr, n) => arr[(g + n * 7919) % arr.length];
    return {
      lycee: 'lycée ' + pioche(NOMS_LYCEES, 1),
      fastfood: pioche(FAST_FOODS, 2),
      resto: pioche(RESTOS, 3),
      cafe: pioche(CAFES, 4),
      influenceur: pioche(INFLUENCEURS, 5),
      club: pioche(PREFIXES_CLUB, 6) + ' ' + S.commune,
      marque: pioche(MARQUES, 7),
    };
  }

  /* Le film à l'affiche change toutes les 2 saisons, la tendance TikTok chaque saison */
  function filmDuMoment() { return FILMS[(S.graine + Math.floor((S.mois - 1) / 2)) % FILMS.length]; }
  function tendanceDuMoment() { return TENDANCES_TIKTOK[(S.graine + S.mois) % TENDANCES_TIKTOK.length]; }

  function remplacerMonde(txt) {
    return txt
      .replaceAll('{ville}', S.commune)
      .replaceAll('{prenom}', S.perso.prenom)
      .replaceAll('{lycee}', S.monde.lycee)
      .replaceAll('{fastfood}', S.monde.fastfood)
      .replaceAll('{resto}', S.monde.resto)
      .replaceAll('{cafe}', S.monde.cafe)
      .replaceAll('{influenceur}', S.monde.influenceur)
      .replaceAll('{club}', S.monde.club)
      .replaceAll('{marque}', S.monde.marque || MARQUES[0])
      .replaceAll('{enfant}', (S.enfants && S.enfants[0]) || 'ton enfant')
      .replaceAll('{film}', filmDuMoment())
      .replaceAll('{tiktok}', tendanceDuMoment())
      .replaceAll('{destination}', DESTINATIONS[(S.graine + Math.floor((S.mois - 1) / 4)) % DESTINATIONS.length]);
  }

  /* ---------- Temps & phases ---------- */

  /* S.mois compte des TOURS. Le temps s'accélère avec la vie :
     tours 1-12 = 3 mois (lycée), 13-24 = 6 mois (études/débuts),
     25+ = 1 an (vie adulte). */
  function moisEcoules(tour) {
    const t = Math.max(1, tour);
    if (t <= 12) return (t - 1) * 3;
    if (t <= 24) return 36 + (t - 13) * 6;
    return 108 + (t - 25) * 12;
  }
  function ageAuTour(tour) { return VIE_CFG.AGE_DEPART + Math.floor((moisEcoules(tour) + VIE_CFG.MOIS_DEPART) / 12); }
  function age() { return ageAuTour(S.mois); }
  function moisCalendaire() { return (VIE_CFG.MOIS_DEPART + moisEcoules(S.mois)) % 12; }
  function saisonVie() { return SAISONS_VIE[moisCalendaire()]; }

  function orientation() { return ORIENTATIONS.find(x => x.id === S.orientationId) || null; }

  function metierReve() {
    const m = METIERS.find(x => x.id === S.metierId);
    return !!(m && m.orientation === 'reve');
  }

  function phase() {
    if (metierReve()) return 'travail'; // carrière de rêve : la vie active a déjà commencé
    if (S.mois <= VIE_CFG.MOIS_BAC) return 'lycee';
    const o = orientation();
    if (o && o.pause && S.finPause && S.mois <= S.finPause) return 'pause';
    if (o && !o.pause && S.orientationId !== 'travail' && S.mois <= VIE_CFG.MOIS_DIPLOME) return 'etudes';
    return 'travail';
  }

  const NOMS_PHASE = { lycee: 'Lycée', etudes: 'Études', pause: 'Année off', travail: 'Vie active' };

  function classeActuelle() {
    if (phase() === 'lycee') {
      const annee = Math.ceil(S.mois / 4);
      return ['Seconde', 'Première', 'Terminale'][Math.min(annee - 1, 2)];
    }
    if (phase() === 'pause') return orientation().nom;
    if (phase() === 'etudes') {
      const o = orientation();
      return o ? o.nom : 'Études';
    }
    const m = METIERS.find(x => x.id === S.metierId);
    return m ? `${m.icone} ${m.nom}` : 'En recherche';
  }

  /* ---------- Bonheur (la note du header) ---------- */

  function bonheur() {
    const s = S.stats;
    const note = clamp100(s.moral * 0.35 + s.social * 0.25 + s.forme * 0.2 + s.energie * 0.2);
    return { note, sur5: note / 20, composantes: { moral: s.moral, social: s.social, forme: s.forme, energie: s.energie } };
  }

  /* ---------- Revenus mensuels ---------- */

  function revenuMensuel() {
    const famille = FAMILLES.find(f => f.id === S.familleId);
    const ph = phase();
    if (ph === 'lycee') {
      const fil = FILIERES.find(f => f.id === S.filiereId);
      return famille.argentPoche + (fil.salaireApprenti || 0);
    }
    if (ph === 'pause') return S.orientationId === 'sabbatique' ? 250 : 0; // petits boulots vs vie sur les économies
    if (ph === 'etudes') return Math.round(famille.argentPoche * 1.5);
    const m = METIERS.find(x => x.id === S.metierId);
    return m ? Math.round(m.salaire * (S.promotions || 0) * 0.3 + m.salaire) - 1100 : 300;
    // salaire − loyer/factures ≈ reste à vivre ; intérim : 300 €
  }

  /* ---------- Le flux de cartes : une question = une saison ---------- */

  function amiAuHasard() {
    const a = S.amis[Math.floor(rnd() * S.amis.length)];
    return a ? a.id : null;
  }

  /* l'épisode d'arc narratif disponible, s'il y en a un */
  function arcDisponible() {
    const a = S.arcs;
    if (a.foot.actif && S.mois >= a.foot.prochainMois && !S.metierId) {
      if (a.foot.etape === 0 && S.talents.foot >= 40) return 'foot_1';
      if (a.foot.etape === 1) return 'foot_2';
      if (a.foot.etape === 2) return 'foot_3';
    }
    if (a.tiktok.actif && S.mois >= a.tiktok.prochainMois) {
      if (a.tiktok.etape === 0 && S.abonnes >= 3000) return 'tiktok_1';
      if (a.tiktok.etape === 1 && S.abonnes >= 12000 && !S.metierId) return 'tiktok_2';
    }
    return null;
  }

  function nouvelleCarte() {
    if (S.gameOver || S.choixOrientation || S.essaiPropose) { S.carte = null; return; }
    // LE PARCOURS d'abord : le scénario principal qui bifurque selon tes réponses
    if (S.parcours && S.parcours.noeud && PARCOURS[S.parcours.noeud] && S.mois >= S.parcours.prochainMois) {
      S.carte = { type: 'parcours', id: S.parcours.noeud, amiId: amiAuHasard() };
      return;
    }
    // un épisode d'histoire t'attend ? (foot repéré, marques qui te contactent…)
    const arc = arcDisponible();
    if (arc) { S.carte = { type: 'arc', id: arc, amiId: amiAuHasard() }; return; }
    // un MOMENT RARE ? (jamais deux fois le même, jamais à la première saison)
    if (S.mois > 2 && rnd() < VIE_CFG.PROBA_RARE) {
      const restants = SCENES_RARES.filter(r => !S.raresVues.includes(r.id));
      if (restants.length) {
        const r = restants[Math.floor(rnd() * restants.length)];
        S.raresVues.push(r.id);
        S.carte = { type: 'rare', id: r.id, amiId: amiAuHasard() };
        return;
      }
    }
    // une scène narrative la plupart du temps, sinon une question de rythme
    if (rnd() < VIE_CFG.PROBA_SCENE) {
      const ph = phase();
      for (let essais = 0; essais < SCENES_VIE.length + 1; essais++) {
        if (!S.pileScenes.length) S.pileScenes = SCENES_VIE.map(s => s.id).sort(() => rnd() - 0.5);
        const id = S.pileScenes.pop();
        const sc = SCENES_VIE.find(x => x.id === id);
        if (sc.phases && !sc.phases.includes(ph)) continue;
        if (sc.ageMin && age() < sc.ageMin) continue;
        S.carte = { type: 'scene', id, amiId: amiAuHasard() };
        return;
      }
    }
    const ph = phase();
    for (let essais = 0; essais < RYTHMES.length + 1; essais++) {
      if (!S.pileRythmes.length) S.pileRythmes = RYTHMES.map(r => r.id).sort(() => rnd() - 0.5);
      const id = S.pileRythmes.pop();
      const r = RYTHMES.find(x => x.id === id);
      if (r.phases && !r.phases.includes(ph)) continue;
      S.carte = { type: 'rythme', id, amiId: amiAuHasard() };
      return;
    }
    S.carte = { type: 'rythme', id: RYTHMES[0].id, amiId: amiAuHasard() };
  }

  /* La carte courante, prête à afficher ({ami} remplacé, options filtrées) */
  function carteCourante() {
    if (!S.carte) return null;
    const ami = AMIS.find(a => a.id === S.carte.amiId) || AMIS[0];
    const remplacer = (txt) => remplacerMonde(txt.replaceAll('{ami}', ami.nom));
    if (S.carte.type !== 'rythme') {
      const source = S.carte.type === 'rare' ? SCENES_RARES.find(x => x.id === S.carte.id)
        : S.carte.type === 'arc' ? { ...ARCS[S.carte.id], id: S.carte.id }
        : S.carte.type === 'parcours' ? { icone: PARCOURS[S.carte.id].emoji, ...PARCOURS[S.carte.id], id: S.carte.id }
        : SCENES_VIE.find(x => x.id === S.carte.id);
      return {
        type: S.carte.type, icone: source.icone, de: source.de, ami,
        rare: S.carte.type === 'rare', arc: S.carte.type === 'arc',
        parcours: S.carte.type === 'parcours', chapitre: source.chapitre, qui: source.qui, decor: source.decor,
        texte: remplacer(source.texte),
        options: source.options.map(o => ({
          txt: remplacer(o.txt), note: remplacer(o.note), effets: o.effets,
          bloquee: (o.si && !S.drapeaux[o.si]) || (o.formeMin && S.stats.forme < o.formeMin)
            || ((o.effets.argent || 0) < 0 && S.argent + o.effets.argent < 0),
          bloqueeRaison: o.si && !S.drapeaux[o.si] ? (o.si === 'permis' ? 'Il te faut le permis.' : 'Pas encore possible.')
            : (o.formeMin && S.stats.forme < o.formeMin) ? `Il te faut ${o.formeMin} de 💪 forme.` : null,
        })),
      };
    }
    const r = RYTHMES.find(x => x.id === S.carte.id);
    return {
      type: 'rythme', icone: r.icone, ami,
      texte: remplacer(r.texte),
      options: r.options.map(o => ({
        txt: remplacer(o.ami ? `${o.txt} (avec ${ami.icone} ${ami.nom})` : o.txt),
        note: remplacer(o.note), effets: o.effets, ami: o.ami, talent: o.talent,
        bloquee: (o.ageMin && age() < o.ageMin) || (o.formeMin && S.stats.forme < o.formeMin)
          || ((o.effets.argent || 0) < 0 && S.argent + o.effets.argent < 0),
        bloqueeRaison: (o.formeMin && S.stats.forme < o.formeMin) ? `Il te faut ${o.formeMin} de 💪 forme.` : null,
      })),
    };
  }

  function repondreCarte(indexOption) {
    const carte = carteCourante();
    if (!carte || S.gameOver) return { ok: false };
    const opt = carte.options[indexOption];
    if (!opt || opt.bloquee) return { ok: false, msg: 'Pas possible pour l\'instant.' };

    /* les traces persistantes et les bonus d'arc */
    const optSource = carte.type === 'arc' ? ARCS[S.carte.id].options[indexOption]
      : carte.type === 'parcours' ? PARCOURS[S.carte.id].options[indexOption]
      : carte.type === 'rythme' ? null
      : (carte.type === 'rare' ? SCENES_RARES : SCENES_VIE).find(x => x.id === S.carte.id).options[indexOption];
    if (optSource && optSource.drapeau) {
      S.drapeaux[optSource.drapeau] = true;
      if (optSource.drapeau === 'parent' && !S.enfants.length) {
        const g = graineDepuis('enfant-' + S.graine);
        S.enfants.push(PRENOMS_ENFANTS[g % PRENOMS_ENFANTS.length]);
        notifier('👶', `${S.enfants[0]} entre dans ta vie. Rien ne sera plus pareil.`);
        log(`👶 ${S.enfants[0]} est arrivé·e. Ta plus grande aventure commence.`);
      }
    }
    if (optSource && optSource.talentPlus) {
      for (const [t, v] of Object.entries(optSource.talentPlus)) S.talents[t] = clamp100(S.talents[t] + v);
    }
    if (carte.type === 'parcours') {
      appliquerEffets(opt.effets, S.carte.amiId);
      gagnerXP(25);
      if (optSource.voie) S.parcours.voie = optSource.voie;
      S.parcours.noeud = optSource.suivant || null;
      S.parcours.prochainMois = S.mois + (optSource.dans || 2);
      if (!S.parcours.noeud) log('📖 Ton parcours est écrit. La suite t\'appartient.');
    } else if (carte.type === 'arc') {
      appliquerEffets(opt.effets, S.carte.amiId);
      gagnerXP(30);
      const arcId = S.carte.id.startsWith('foot') ? 'foot' : 'tiktok';
      if (optSource.stop) S.arcs[arcId].actif = false;
      else { S.arcs[arcId].etape++; S.arcs[arcId].prochainMois = S.mois + (optSource.delai || 2); }
      if (optSource.metier) {
        S.metierId = optSource.metier;
        S.rechercheEmploi = false;
        S.orientationId = S.orientationId || 'travail';
        gagnerXP(120);
        const m = METIERS.find(x => x.id === optSource.metier);
        log(`${m.icone} ${m.nom.toUpperCase()} : signé·e en agence !`);
        notifier(m.icone, `${m.nom} : c'est ton métier maintenant !`);
        S.cinematiques.push({ emoji: m.icone, titre: 'Nouvelle vie', texte: 'Contrats, tournages, campagnes : tes réseaux sont devenus ton bureau. {ville} n\'en revient pas.' });
      }
    } else if (carte.type === 'rare') {
      appliquerEffets(opt.effets, S.carte.amiId);
      gagnerXP(35);
      notifier('🌟', 'Tu as vécu un MOMENT RARE. Ça se raconte, ça !');
    } else if (carte.type === 'scene') {
      appliquerEffets(opt.effets, S.carte.amiId);
      gagnerXP(15);
    } else {
      appliquerEffets(opt.effets);
      if (opt.ami) {
        const a = S.amis.find(x => x.id === S.carte.amiId);
        if (a) a.relation = clamp100(a.relation + 12);
        S.stats.social = clamp100(S.stats.social + 4);
      }
      if (opt.talent) {
        S.talents[opt.talent] = clamp100(S.talents[opt.talent] + 7);
        if (S.talents[opt.talent] >= 25 && S.talents[opt.talent] < 33)
          notifier(REVES[opt.talent].icone, `Tu progresses sérieusement en ${opt.talent === 'foot' ? 'foot' : 'chant'}…`);
      }
      gagnerXP(8);
    }
    log(`${carte.icone} ${opt.txt} — ${opt.note}`);
    const rare = carte.type === 'rare';
    S.carte = null;
    finDeMois();
    if (!S.gameOver) nouvelleCarte();
    verifierObjectifs();
    return { ok: true, note: opt.note, icone: carte.icone, effets: opt.effets || {}, choix: opt.txt, rare };
  }

  function appliquerEffets(eff, amiScene) {
    for (const [k, v] of Object.entries(eff || {})) {
      if (k === 'argent') S.argent = Math.max(0, S.argent + v);
      else if (k === 'abonnes') S.abonnes = Math.max(0, S.abonnes + v);
      else if (k === 'relation' && amiScene) {
        const a = S.amis.find(x => x.id === amiScene);
        if (a) a.relation = clamp100(a.relation + v);
      } else if (S.stats[k] !== undefined) S.stats[k] = clamp100(S.stats[k] + v);
    }
  }

  function finDeMois() {
    /* école / études / boulot en fond */
    const ph = phase();
    const fatigue = S.stats.energie < 30 || S.stats.moral < 30 ? 0.5 : 1;
    if (ph === 'lycee') {
      const fil = FILIERES.find(f => f.id === S.filiereId);
      S.stats.savoir = clamp100(S.stats.savoir + fil.savoirMois * fatigue);
    } else if (ph === 'pause') {
      const o = orientation();
      S.stats.savoir = clamp100(S.stats.savoir + o.savoirMois);
      if (S.orientationId === 'voyage') {
        S.stats.social = clamp100(S.stats.social + 3);
        S.stats.moral = clamp100(S.stats.moral + 3);
        S.stats.forme = clamp100(S.stats.forme + 1);
        S.argent = Math.max(0, S.argent - 60); // la route, ça se paye
      } else {
        S.stats.energie = clamp100(S.stats.energie + 5);
        S.stats.moral = clamp100(S.stats.moral + 2);
      }
    } else if (ph === 'etudes') {
      const o = orientation();
      S.stats.savoir = clamp100(S.stats.savoir + o.savoirMois * fatigue);
      S.argent = Math.max(0, S.argent - o.cout);
    } else {
      S.stats.savoir = clamp100(S.stats.savoir + 0.4 * fatigue);
    }

    /* revenus et décroissances */
    S.argent = Math.max(0, S.argent + revenuMensuel());
    const famille = FAMILLES.find(f => f.id === S.familleId);
    S.stats.energie = clamp100(S.stats.energie - VIE_CFG.DECAY.energie);
    S.stats.moral = clamp100(S.stats.moral - VIE_CFG.DECAY.moral + (famille.bonus.moral || 0) - (famille.malus.moral || 0));
    S.stats.social = clamp100(S.stats.social - VIE_CFG.DECAY.social);
    S.stats.forme = clamp100(S.stats.forme - VIE_CFG.DECAY.forme);
    S.stats.savoir = clamp100(S.stats.savoir + (famille.bonus.savoir || 0) * 0.3 - (famille.malus.savoir || 0) * 0.3);
    for (const a of S.amis) a.relation = clamp100(a.relation - VIE_CFG.DECAY.relation);

    /* la forme au tapis trop longtemps : le corps finit par lâcher */
    S.saisonsFaibleForme = S.stats.forme < 20 ? S.saisonsFaibleForme + 1 : 0;
    if (S.saisonsFaibleForme >= 3) {
      S.saisonsFaibleForme = 0;
      S.maladies = (S.maladies || 0) + 1;
      S.stats.forme = 40;
      S.stats.energie = clamp100(S.stats.energie - 10);
      S.stats.moral = clamp100(S.stats.moral - 6);
      S.argent = Math.max(0, S.argent - 80);
      S.cinematiques.push({
        emoji: '🤒', titre: 'Le corps lâche',
        texte: 'Des mois à négliger ton corps, et l\'addition arrive : grosse grippe, deux semaines au tapis, pharmacie hors de prix. Ton corps est ton premier équipement — entretiens-le.',
      });
      notifier('🤒', 'Malade ! Trop de saisons sans prendre soin de ta forme.');
      log('🤒 Malade : le corps a fini par dire stop. (−80 €, moral en berne)');
    }

    /* coup de mou sévère : l'infirmerie de la vie */
    if (S.stats.energie <= 5 && S.stats.moral <= 15) {
      S.burnouts = (S.burnouts || 0) + 1;
      S.stats.energie = 45; S.stats.moral = 40;
      S.argent = Math.max(0, S.argent - 60);
      S.cinematiques.push({
        emoji: '🤒', titre: 'Gros coup de mou',
        texte: 'Ton corps a dit stop : une semaine au lit, tisanes et couette. Ta famille a pris soin de toi. Repars doucement — et dors, parfois.',
      });
      log('🤒 Burn-out évité de justesse. Une semaine au lit, ça remet les idées en place.');
    }

    S.historique.push({ mois: S.mois, bonheur: Math.round(bonheur().note), argent: S.argent });
    S.mois++;

    /* fin d'année scolaire (toutes les 4 saisons) : la mise en scène du bilan */
    if (S.mois > 1 && (S.mois - 1) % 4 === 0 && S.mois <= VIE_CFG.MOIS_FIN) genererBilanAnnee();

    /* fin de l'année off : et maintenant, on fait quoi ? */
    if (S.finPause && S.mois > S.finPause && !S.gameOver) {
      const etaitVoyage = S.orientationId === 'voyage';
      S.finPause = null;
      S.orientationId = null;
      S.choixOrientation = true;
      S.carte = null;
      S.cinematiques.push(etaitVoyage
        ? { emoji: '🛬', titre: 'Retour au pays', texte: 'Un an, quatorze pays, un carnet plein et des chaussures mortes. {ville} n\'a pas bougé — toi, si. Maintenant : on fait quoi ?' }
        : { emoji: '⏰', titre: 'Fin de l\'année off', texte: 'L\'année sabbatique se termine. Reposé·e, des idées plus claires — et la vraie question revient : on fait quoi, maintenant ?' });
      notifier('🧭', 'Ton année off se termine : choisis ta suite !');
    }

    /* rendez-vous fixes */
    if (S.mois === VIE_CFG.MOIS_BAC + 1) passerBac();
    if (S.mois === VIE_CFG.MOIS_DIPLOME + 1 && phase() === 'travail' && !S.metierId && S.orientationId !== 'travail') obtenirDiplome();
    if (S.mois === 15) { // ~20 ans
      S.cinematiques.push({ emoji: '🎂', titre: '20 ans', texte: 'Deux dizaines au compteur. Quelqu\'un a mis une seule bougie « 20 » sur le gâteau, par flemme. Tu as souri : la suite t\'appartient.' });
    }
    if (S.mois === 25) { // 25 ans : le temps passe à l'année
      S.cinematiques.push({ emoji: '⏳', titre: 'La vie s\'accélère', texte: 'Vingt-cinq ans. Les années se mettent à défiler plus vite — chaque question compte désormais pour une année entière de ta vie. Choisis bien.' });
    }
    if (S.mois > VIE_CFG.MOIS_FIN && !S.gameOver) bilanFinal();

    /* un recruteur te repère ? (rêves : foot, musique) */
    if (!S.gameOver && !S.essaiPropose && !['foot', 'musique'].includes(S.metierId) && age() <= 24) {
      for (const [id, reve] of Object.entries(REVES)) {
        const seuil = reve.seuilReperage + 12 * S.essaisTentes[id];
        if (S.talents[id] >= seuil) {
          S.essaiPropose = id;
          notifier(reve.icone, 'On t\'a repéré·e ! Une chance à saisir…');
          S.cinematiques.push({ emoji: reve.icone, titre: 'Repéré·e !', texte: reve.reperage });
          break;
        }
      }
    }

    verifierObjectifs();
  }

  /* ---------- Le bilan d'année : gros titre, tuiles, potins ---------- */

  function genererBilanAnnee() {
    const a = (S.mois - 1) / 4;                       // l'année qui vient de se finir (1..10)
    S.annee = a;
    const s = S.stats;
    const deltaArgent = S.argent - (S.refAnnee ? S.refAnnee.argent : S.argent);
    const meilleurAmi = S.amis.reduce((m, x) => x.relation > m.relation ? x : m, S.amis[0]);
    const amiDef = AMIS.find(x => x.id === meilleurAmi.id);

    /* la classe de l'année écoulée */
    let classe;
    if (a <= 3) classe = ['Seconde', 'Première', 'Terminale'][a - 1];
    else if (S.metierId) classe = METIERS.find(m => m.id === S.metierId).nom;
    else if (S.orientationId && S.orientationId !== 'travail' && S.mois <= VIE_CFG.MOIS_DIPLOME + 1)
      classe = ORIENTATIONS.find(x => x.id === S.orientationId).nom;
    else classe = 'Vie active';

    /* le gros titre de presse : le trait dominant de ton année */
    const deltaAbonnes = S.abonnes - (S.refAnnee && S.refAnnee.abonnes !== undefined ? S.refAnnee.abonnes : S.abonnes);
    let trait;
    if (deltaAbonnes >= 4000 || S.metierId === 'influenceur') trait = 'reseaux';
    else if (S.talents.foot >= 40 && S.talents.foot >= S.talents.musique) trait = 'foot';
    else if (S.talents.musique >= 40) trait = 'musique';
    else if (deltaArgent >= 800) trait = 'argent';
    else {
      const max = Math.max(s.savoir, s.social, s.forme, s.moral);
      if (max < 45) trait = 'discret';
      else trait = s.savoir === max ? 'savoir' : s.social === max ? 'social' : s.forme === max ? 'forme' : 'moral';
    }
    const modeles = TITRES_ANNEE[trait];
    const remplacer = remplacerMonde;
    const titrePresse = remplacer(modeles[Math.floor(rnd() * modeles.length)]);

    /* les lignes du bilan */
    const lignes = [];
    if (a === 1 || a === 2) lignes.push(s.savoir >= 40
      ? `✅ Passage en ${a === 1 ? 'première' : 'terminale'} sans trembler.`
      : `⚠️ Passage en ${a === 1 ? 'première' : 'terminale'}… de justesse. Le conseil de classe a « des attentes ».`);
    if (a === 3) lignes.push('🎓 L\'année du bac — les résultats tombent tout de suite…');
    const obj = objectifCourant();
    lignes.push(obj ? `🎯 Objectif en cours : ${obj.icone} ${obj.texte}` : '🎯 Tous tes objectifs de vie sont cochés !');
    lignes.push(`🫂 Ton pilier de l'année : ${amiDef.icone} ${amiDef.nom} (${Math.round(meilleurAmi.relation)}/100)`);
    if (S.abonnes >= 1000) lignes.push(`📱 ${S.abonnes.toLocaleString('fr-FR')} abonnés te suivent${deltaAbonnes > 0 ? ` (+${deltaAbonnes.toLocaleString('fr-FR')} cette année)` : ''}.`);
    if (S.drapeaux.chien) lignes.push('🐶 Biscotte approuve cette année. (Il a mangé une chaussure.)');
    if (S.enfants && S.enfants.length) lignes.push(`👶 ${S.enfants[0]} grandit — et te ressemble un peu trop.`);
    if (s.energie < 30) lignes.push('⚠️ Tu tires sur la corde — dors, sérieusement.');
    else if (s.moral < 35) lignes.push('⚠️ Le moral a pris cher cette année. Prends soin de toi.');
    if (S.argent < 40) lignes.push('⚠️ Les fins de mois piquent. Un petit boulot ?');

    S.bilanAnnee = {
      saison: `tes ${age()} ans`,
      classe, titrePresse,
      tuiles: [
        { val: (s.savoir * 0.16 + 3).toFixed(1).replace('.', ','), lib: 'moyenne' },
        { val: Math.round(meilleurAmi.relation), lib: `ami·e n°1` },
        { val: (bonheur().note / 20).toFixed(1).replace('.', ','), lib: 'bonheur /5' },
        { val: `${deltaArgent >= 0 ? '+' : '−'}${Math.abs(Math.round(deltaArgent))} €`, lib: 'cette année' },
      ],
      lignes,
      potin: remplacer(POTINS_VILLE[Math.floor(rnd() * POTINS_VILLE.length)]),
    };
    S.refAnnee = { argent: S.argent, abonnes: S.abonnes };
  }

  /* ---------- Examens & carrière ---------- */

  function passerBac() {
    const reussi = S.stats.savoir >= 45;
    S.bacObtenu = reussi;
    const mention = S.stats.savoir >= 80 ? ' avec mention Très Bien 🌟' : S.stats.savoir >= 65 ? ' avec mention Bien' : S.stats.savoir >= 55 ? ' avec mention Assez Bien' : '';
    if (reussi) {
      S.cinematiques.push({
        emoji: '🎓', titre: 'Résultats du bac',
        texte: `La liste est affichée sur la grille du ${S.monde.lycee}. Ton nom y est : ADMIS${S.perso.genre === 'femme' ? 'E' : ''}${mention} ! Les cris, les câlins, les photos. Maintenant… il faut choisir la suite.`,
      });
      log(`🎓 BAC OBTENU${mention} ! (savoir : ${Math.round(S.stats.savoir)})`);
      S.stats.moral = clamp100(S.stats.moral + 15);
    } else {
      S.cinematiques.push({
        emoji: '😶', titre: 'Résultats du bac',
        texte: 'Ton nom n\'est pas sur la liste. Le monde ne s\'arrête pas — la voie pro et le travail t\'ouvrent leurs portes, et des revanches se préparent.',
      });
      log('😶 Bac raté. La vie continue, autrement.');
      S.stats.moral = clamp100(S.stats.moral - 10);
    }
    if (metierReve()) {
      // déjà signé·e pro : le club/label a aménagé tes cours, pas d'orientation à choisir
      log('🎓 Le bac en parallèle de ta carrière — chapeau.');
    } else {
      S.choixOrientation = true;
      notifier('🎓', reussi ? 'Bac en poche ! Choisis ton orientation.' : 'Pas de bac — choisis ta voie quand même.');
    }
  }

  function orientationsPossibles() {
    return ORIENTATIONS.filter(o => {
      if (o.pause && S.pauseFaite) return false;          // une seule année off par vie
      if (o.argentMin && S.argent < o.argentMin) return false;
      if (o.formeMin && S.stats.forme < o.formeMin) return false;
      if (!o.pause && o.id !== 'travail' && S.bacObtenu === false) return false;
      return S.stats.savoir >= o.minSavoir - 10; // un peu de souplesse
    });
  }

  function choisirOrientation(id) {
    if (!S.choixOrientation) return { ok: false };
    const o = ORIENTATIONS.find(x => x.id === id);
    S.orientationId = id;
    S.choixOrientation = false;
    if (o && o.pause) {
      S.pauseFaite = true;
      S.finPause = S.mois + (S.mois >= 13 ? 1 : 3); // une année, quel que soit le rythme du temps
      if (id === 'voyage') {
        S.argent = Math.max(0, S.argent - (o.argentMin || 0));
        log('✈️ Billet aller, sac de 12 kilos. Le monde t\'attend.');
        S.cinematiques.push({ emoji: '✈️', titre: 'Départ', texte: 'Aéroport, 6 h du matin. Ta famille fait semblant de ne pas pleurer. Premier tampon sur le passeport — un an de routes, d\'auberges et de rencontres commence.' });
      } else {
        log('🧳 Année sabbatique : un an à toi.');
        S.cinematiques.push({ emoji: '🧳', titre: 'L\'année à toi', texte: 'Pas de réveil, pas de programme. Des petits boulots, des projets qui traînaient, du temps pour réfléchir à la suite. Un luxe rare : le temps.' });
      }
    } else if (id === 'travail') demarrerRecherche();
    else {
      log(`${o.icone} C'est parti pour : ${o.nom}.`);
      S.cinematiques.push({ emoji: o.icone, titre: o.nom, texte: `Nouveau campus, nouvelles têtes, nouveaux horaires approximatifs. ${o.desc}` });
    }
    nouvelleCarte();
    verifierObjectifs();
    return { ok: true };
  }

  function obtenirDiplome() {
    S.cinematiques.push({
      emoji: '🎓', titre: 'Diplômé·e !',
      texte: 'Remise des diplômes : toge trop grande, chapeau lancé trop fort, fierté immense. Direction : la vraie vie — à toi de décrocher LE job.',
    });
    demarrerRecherche();
  }

  function demarrerRecherche() {
    S.rechercheEmploi = true;
    notifier('💼', 'À toi de jouer : choisis un métier et passe des entretiens !');
    log('💼 La recherche d\'emploi commence. En attendant : missions d\'intérim (300 €/mois).');
  }

  /* ---------- L'essai : tenter sa chance (foot, musique) ---------- */

  function repondreEssai(tenter) {
    const id = S.essaiPropose;
    if (!id) return { ok: false };
    S.essaiPropose = null;
    const reve = REVES[id];
    if (!tenter) {
      S.essaisTentes[id]++;
      log(`${reve.icone} Tu as décliné, pour l'instant. Le talent, lui, reste.`);
      nouvelleCarte();
      return { ok: true, tente: false };
    }
    const score = S.talents[id] + S.stats[reve.stat] * 0.5;
    const reussi = score >= 100;
    S.essaisTentes[id]++;
    if (reussi) {
      S.metierId = id;
      S.rechercheEmploi = false;
      S.orientationId = S.orientationId || 'travail';
      S.stats.moral = clamp100(S.stats.moral + 20);
      gagnerXP(120);
      log(`${reve.icone} ${reve.nom.toUpperCase()} ! Le rêve est devenu un métier.`);
      notifier(reve.icone, `${reve.nom} : contrat signé !`);
      S.cinematiques.push({ emoji: reve.icone, titre: 'Le grand jour', texte: reve.essai });
      S.cinematiques.push({ emoji: '🌟', titre: 'Signé !', texte: reve.reussite });
    } else {
      S.talents[id] = clamp100(S.talents[id] + 5);
      S.stats.moral = clamp100(S.stats.moral - 8);
      log(`${reve.icone} Essai manqué (score ${Math.round(score)}/100). Retente quand tu seras plus fort·e.`);
      S.cinematiques.push({ emoji: '😔', titre: 'Pas cette fois', texte: reve.echec + ' (Continue à t\'entraîner : talent et ' + (id === 'foot' ? 'forme' : 'social') + ' font la différence.)' });
    }
    nouvelleCarte();
    return { ok: true, tente: true, reussi };
  }

  /* ---------- La recherche d'emploi : à toi de choisir, à toi de convaincre ---------- */

  function metiersDisponibles() {
    return METIERS
      .filter(m => m.orientation === (S.orientationId || 'travail'))
      .filter(m => !m.filiere || m.filiere === S.filiereId)
      .map(m => ({
        ...m,
        accessible: S.stats.savoir >= m.minSavoir && S.stats.forme >= (m.minForme || 0),
        manqueForme: S.stats.forme < (m.minForme || 0),
      }));
  }

  function passerEntretien(metierId, nbBonnesReponses) {
    const m = METIERS.find(x => x.id === metierId);
    if (!m || !S.rechercheEmploi) return { ok: false };
    if (S.mois < S.entretienDispo) return { ok: false, msg: 'Le prochain entretien attendra un peu.' };
    if (S.stats.savoir < m.minSavoir) return { ok: false, msg: 'Il te manque du savoir pour ce poste.' };
    if (m.minForme && S.stats.forme < m.minForme) return { ok: false, msg: 'Ce poste est physique : il te manque de la forme.' };
    /* bien dans ton corps = de la présence en entretien (jusqu'à +8) */
    const score = nbBonnesReponses * 25 + S.stats.social * 0.25 + Math.min(20, (S.stats.savoir - m.minSavoir) * 0.4)
      + Math.min(8, S.stats.forme * 0.08);
    const reussi = score >= 68;
    if (reussi) {
      S.metierId = m.id;
      S.rechercheEmploi = false;
      S.promotions = 0;
      gagnerXP(80);
      log(`💼 EMBAUCHÉ·E : ${m.icone} ${m.nom} !`);
      notifier('💼', `Embauché·e : ${m.nom} !`);
      S.cinematiques.push({
        emoji: m.icone, titre: 'Premier jour de boulot',
        texte: `Badge tout neuf, café de machine, collègues curieux. Te voilà ${m.nom} — ${m.salaire} €/mois. Ta carrière commence.`,
      });
    } else {
      S.entretienDispo = S.mois + 1;
      S.stats.moral = clamp100(S.stats.moral - 6);
      log(`💼 Entretien raté pour ${m.nom} (score ${Math.round(score)}/100). On retente la saison prochaine.`);
      notifier('😕', `Recalé·e pour ${m.nom}. Une saison pour se refaire.`);
    }
    finDeMois(); // un entretien, ça occupe la saison
    if (!S.gameOver) nouvelleCarte();
    return { ok: true, reussi, score: Math.round(score) };
  }

  /* ---------- Objectifs & progression ---------- */

  function objectifCourant() {
    return OBJECTIFS_VIE.find(o => !S.objectifsFaits[o.id]) || null;
  }

  function objectifAtteint(id) {
    switch (id) {
      case 'premier_pote': return S.amis.some(a => a.relation >= 70);
      case 'economies': return S.argent >= 200;
      case 'bac': return S.bacObtenu === true;
      case 'metier': return !!S.metierId;
      case 'equilibre': return bonheur().note >= 70;
      case 'fortune': return S.argent >= 3000;
      case 'famille': return !!(S.drapeaux.parent || S.drapeaux.sansEnfant);
      case 'trentaine': return S.mois > VIE_CFG.MOIS_FIN;
      default: return false;
    }
  }

  function verifierObjectifs() {
    for (const obj of OBJECTIFS_VIE) {
      if (S.objectifsFaits[obj.id] || !objectifAtteint(obj.id)) continue;
      S.objectifsFaits[obj.id] = true;
      if (obj.xp) gagnerXP(obj.xp);
      log(`🎯 Objectif de vie atteint : ${obj.texte} !`);
      notifier('🎯', `Objectif atteint : ${obj.texte} !`);
    }
  }

  function xpPourNiveau(n) { return 100 + 40 * n; }
  function gagnerXP(pts) {
    S.xp += pts;
    while (S.xp >= xpPourNiveau(S.niveau)) {
      S.xp -= xpPourNiveau(S.niveau);
      S.niveau++;
      notifier('⭐', `Niveau ${S.niveau} ! Tu prends de la bouteille.`);
    }
  }

  /* ---------- Le titre de vie : l'archétype qu'on partage ---------- */

  function titreDeVie() {
    const s = S.stats;
    const amisMoy = S.amis.length ? S.amis.reduce((x, a) => x + a.relation, 0) / S.amis.length : 0;
    const b = bonheur().note;
    let id = 'electron';
    if (S.metierId === 'foot') id = 'ballon_or';
    else if (S.metierId === 'musique') id = 'tete_affiche';
    else if (S.metierId === 'influenceur' || S.abonnes >= 50000) id = 'star_reseaux';
    else if (s.savoir >= 85) id = 'cerveau';
    else if (S.argent >= 5000) id = 'main_doree';
    else if (amisMoy >= 82) id = 'coeur_quartier';
    else if ((S.burnouts || 0) >= 1 && b >= 55) id = 'phenix';
    else if (b >= 78) id = 'zen';
    else if (s.social >= 85) id = 'papillon';
    else if (s.social < 25 && amisMoy < 35) id = 'fantome';
    const t = TITRES_VIE.find(x => x.id === id);
    return { ...t, desc: t.desc.replaceAll('{ville}', S.commune) };
  }

  /* ---------- Bilan final à 25 ans ---------- */

  function bilanFinal() {
    const b = bonheur().note;
    const amisMoy = S.amis.length ? S.amis.reduce((s, a) => s + a.relation, 0) / S.amis.length : 0;
    const metier = METIERS.find(m => m.id === S.metierId);
    /* la vie de famille (ou son choix assumé) compte dans le bilan */
    let fam = 30;
    if (S.drapeaux.couple) fam += 25;
    if (S.drapeaux.parent || S.drapeaux.sansEnfant) fam += 35;
    if (S.drapeaux.proprio) fam += 10;
    fam = Math.min(100, fam);
    const score = Math.round(b * 0.35 + amisMoy * 0.2 + Math.min(100, S.argent / 80) * 0.15
      + (metier ? Math.min(100, metier.salaire / 26) : 20) * 0.15 + fam * 0.15);
    let phrase;
    if (score >= 80) phrase = 'Une vie qui donne envie : des gens en or, un métier qui te va, une maison qui te ressemble.';
    else if (score >= 60) phrase = 'Une belle trajectoire, avec ses hauts, ses bas, et beaucoup de fierté au compteur.';
    else if (score >= 40) phrase = 'Une vie cabossée mais bien à toi. Et à 50 ans, il reste tant à vivre.';
    else phrase = 'Ça a tangué. Mais tu es encore debout, et c\'est déjà une victoire.';
    const famTxt = S.enfants.length ? `${S.enfants[0]} et les tiens t'entourent.`
      : S.drapeaux.sansEnfant ? 'Ta vie sans enfants, tu l\'as choisie et remplie.' : '';
    S.gameOver = {
      victoire: true, score,
      titre: `50 ans — score de vie : ${score}/100`,
      texte: `${S.perso.prenom}, ${metier ? metier.nom : 'électron libre'} à ${S.commune}. Bonheur ${Math.round(b)}/100, amitiés ${Math.round(amisMoy)}/100, ${Math.round(S.argent)} € de côté. ${famTxt} ${phrase}`,
      titreVie: titreDeVie(),
      recap: {
        bonheur: Math.round(b), amisMoy: Math.round(amisMoy), argent: Math.round(S.argent),
        metier: metier ? `${metier.icone} ${metier.nom}` : '🧭 Électron libre',
        bac: S.bacObtenu === true, rares: (S.raresVues || []).length,
        famille: S.enfants.length ? `👨‍👩‍👧 ${S.enfants.length} enfant${S.enfants.length > 1 ? 's' : ''} (${S.enfants[0]})`
          : S.drapeaux.sansEnfant ? '🌍 Sans enfants, par choix' : '🧭 Célibat longue durée',
        defi: S.defi || null,
      },
    };
  }

  /* ---------- Notifications & journal ---------- */

  function notifier(icone, texte) {
    S.notifications.unshift({ mois: S.mois, icone, texte, lu: false });
    if (S.notifications.length > 50) S.notifications.pop();
  }
  function notifsNonLues() { return S.notifications.filter(n => !n.lu).length; }
  function marquerNotifsLues() { for (const n of S.notifications) n.lu = true; }

  function log(txt) {
    S.journal.unshift({ mois: S.mois, txt });
    if (S.journal.length > 120) S.journal.pop();
  }

  /* ---------- Sauvegarde ---------- */

  const SAVE_KEY = 'bigcitylife_save_v1';
  function sauvegarder() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  function charger() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      S = JSON.parse(raw);
      if (S.carte === undefined) return null; // ancienne version du jeu : on repart de zéro
      /* migration douce : sauvegardes d'avant le pack viral */
      if (S.graine === undefined) { S.graine = (Math.random() * 4294967296) >>> 0; S.rngN = 0; }
      if (S.raresVues === undefined) S.raresVues = [];
      if (S.burnouts === undefined) S.burnouts = 0;
      if (S.defi === undefined) S.defi = null;
      if (S.refAnnee === undefined) S.refAnnee = { argent: S.argent };
      if (S.bilanAnnee === undefined) S.bilanAnnee = null;
      if (!S.monde) S.monde = genererMonde();
      if (S.monde && !S.monde.marque) S.monde.marque = genererMonde().marque;
      if (S.pauseFaite === undefined) { S.pauseFaite = false; S.finPause = null; }
      if (S.abonnes === undefined) S.abonnes = 150;
      if (S.saisonsFaibleForme === undefined) { S.saisonsFaibleForme = 0; S.maladies = 0; }
      if (S.parcours === undefined) S.parcours = { noeud: S.mois <= 2 ? 'p1' : null, prochainMois: S.mois, voie: null };
      if (S.drapeaux === undefined) S.drapeaux = {};
      if (S.enfants === undefined) S.enfants = [];
      if (S.arcs === undefined) S.arcs = { foot: { etape: 0, prochainMois: 0, actif: true }, tiktok: { etape: 0, prochainMois: 0, actif: true } };
      return S;
    } catch (e) { return null; }
  }
  function effacerSauvegarde() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; }

  return {
    get etat() { return S; },
    nouvellePartie, charger, sauvegarder, effacerSauvegarde,
    carteCourante, repondreCarte, nouvelleCarte,
    choisirOrientation, orientationsPossibles,
    repondreEssai, metiersDisponibles, passerEntretien,
    age, ageAuTour, phase, NOMS_PHASE, classeActuelle, moisCalendaire, saisonVie,
    bonheur, revenuMensuel, objectifCourant, xpPourNiveau,
    notifsNonLues, marquerNotifsLues,
    defiDuJour, titreDeVie, remplacerMonde,
  };
})();
