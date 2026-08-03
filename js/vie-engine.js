/* ============================================================
   BIG CITY LIFE — Moteur du jeu de vie
   Un tour = un mois : une activité choisie sur la carte, l'école
   ou le boulot en fond, des scènes de vie, des examens, des amis.
   ============================================================ */

const Vie = (() => {
  let S = null;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const clamp100 = (v) => clamp(v, 0, 100);

  /* ---------- Création ---------- */

  function nouvellePartie({ ville, ambiance, perso, familleId, amisIds, filiereId }) {
    const famille = FAMILLES.find(f => f.id === familleId);
    S = {
      version: 1,
      ville, profil: ambiance,
      commune: ville.nom,
      voisines: ville.voisines || null,
      population: ville.pop, populationInitiale: ville.pop,
      cadre: { voirie: 70 }, equipements: [], // pour la carte
      perso,                     // { prenom, genre, emoji }
      familleId,
      filiereId,
      orientationId: null,       // choisi après le bac
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
      amis: amisIds.map(id => ({ id, relation: 50 })),
      carte: null,               // la question en cours { type: 'scene'|'rythme', id, amiId }
      pileScenes: [],
      pileRythmes: [],
      sceneActive: null,         // (compat interne : les scènes passent par `carte`)
      choixOrientation: false,   // vrai quand il faut choisir post-bac
      objectifsFaits: {},        // id -> true (chaque objectif se valide indépendamment)
      xp: 0, niveau: 1,
      notifications: [],
      journal: [],
      cinematiques: [],
      historique: [],            // { mois, bonheur, argent }
      gameOver: null,
    };
    log(`🎒 Rentrée de seconde à ${ville.nom}. ${famille.ambiance}`);
    nouvelleCarte();
    return S;
  }

  /* ---------- Temps & phases ---------- */

  /* S.mois compte des TOURS ; un tour = une saison de trois mois */
  function age() { return VIE_CFG.AGE_DEPART + Math.floor(((S.mois - 1) * 3 + 8) / 12); }
  function moisCalendaire() { return (VIE_CFG.MOIS_DEPART + (S.mois - 1) * 3) % 12; }
  function saisonVie() { return SAISONS_VIE[moisCalendaire()]; }

  function phase() {
    if (S.metierId && REVES[S.metierId]) return 'travail'; // carrière de rêve : la vie active a déjà commencé
    if (S.mois <= VIE_CFG.MOIS_BAC) return 'lycee';
    if (S.orientationId && S.orientationId !== 'travail' && S.mois <= VIE_CFG.MOIS_DIPLOME) return 'etudes';
    return 'travail';
  }

  const NOMS_PHASE = { lycee: 'Lycée', etudes: 'Études', travail: 'Vie active' };

  function classeActuelle() {
    if (phase() === 'lycee') {
      const annee = Math.ceil(S.mois / 4);
      return ['Seconde', 'Première', 'Terminale'][Math.min(annee - 1, 2)];
    }
    if (phase() === 'etudes') {
      const o = ORIENTATIONS.find(x => x.id === S.orientationId);
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
    if (ph === 'etudes') return Math.round(famille.argentPoche * 1.5);
    const m = METIERS.find(x => x.id === S.metierId);
    return m ? Math.round(m.salaire * (S.promotions || 0) * 0.3 + m.salaire) - 1100 : 300;
    // salaire − loyer/factures ≈ reste à vivre ; intérim : 300 €
  }

  /* ---------- Le flux de cartes : une question = une saison ---------- */

  function amiAuHasard() {
    const a = S.amis[Math.floor(Math.random() * S.amis.length)];
    return a ? a.id : null;
  }

  function nouvelleCarte() {
    if (S.gameOver || S.choixOrientation || S.essaiPropose) { S.carte = null; return; }
    // une scène narrative la plupart du temps, sinon une question de rythme
    if (Math.random() < VIE_CFG.PROBA_SCENE) {
      const ph = phase();
      for (let essais = 0; essais < SCENES_VIE.length + 1; essais++) {
        if (!S.pileScenes.length) S.pileScenes = SCENES_VIE.map(s => s.id).sort(() => Math.random() - 0.5);
        const id = S.pileScenes.pop();
        const sc = SCENES_VIE.find(x => x.id === id);
        if (sc.phases && !sc.phases.includes(ph)) continue;
        if (sc.ageMin && age() < sc.ageMin) continue;
        S.carte = { type: 'scene', id, amiId: amiAuHasard() };
        return;
      }
    }
    if (!S.pileRythmes.length) S.pileRythmes = RYTHMES.map(r => r.id).sort(() => Math.random() - 0.5);
    S.carte = { type: 'rythme', id: S.pileRythmes.pop(), amiId: amiAuHasard() };
  }

  /* La carte courante, prête à afficher ({ami} remplacé, options filtrées) */
  function carteCourante() {
    if (!S.carte) return null;
    const ami = AMIS.find(a => a.id === S.carte.amiId) || AMIS[0];
    const remplacer = (txt) => txt.replaceAll('{ami}', ami.nom).replaceAll('{ville}', S.commune);
    if (S.carte.type === 'scene') {
      const sc = SCENES_VIE.find(x => x.id === S.carte.id);
      return {
        type: 'scene', icone: sc.icone, de: sc.de, ami,
        texte: remplacer(sc.texte),
        options: sc.options.map(o => ({ txt: remplacer(o.txt), note: remplacer(o.note), effets: o.effets })),
      };
    }
    const r = RYTHMES.find(x => x.id === S.carte.id);
    return {
      type: 'rythme', icone: r.icone, ami,
      texte: remplacer(r.texte),
      options: r.options.map(o => ({
        txt: o.ami ? `${o.txt} (avec ${ami.icone} ${ami.nom})` : o.txt,
        note: o.note, effets: o.effets, ami: o.ami, talent: o.talent,
        bloquee: (o.ageMin && age() < o.ageMin) || ((o.effets.argent || 0) < 0 && S.argent + o.effets.argent < 0),
      })),
    };
  }

  function repondreCarte(indexOption) {
    const carte = carteCourante();
    if (!carte || S.gameOver) return { ok: false };
    const opt = carte.options[indexOption];
    if (!opt || opt.bloquee) return { ok: false, msg: 'Pas possible pour l\'instant.' };

    if (carte.type === 'scene') {
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
    S.carte = null;
    finDeMois();
    if (!S.gameOver) nouvelleCarte();
    verifierObjectifs();
    return { ok: true, note: opt.note, icone: carte.icone };
  }

  function appliquerEffets(eff, amiScene) {
    for (const [k, v] of Object.entries(eff || {})) {
      if (k === 'argent') S.argent = Math.max(0, S.argent + v);
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
    } else if (ph === 'etudes') {
      const o = ORIENTATIONS.find(x => x.id === S.orientationId);
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

    /* coup de mou sévère : l'infirmerie de la vie */
    if (S.stats.energie <= 5 && S.stats.moral <= 15) {
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

    /* rendez-vous fixes */
    if (S.mois === VIE_CFG.MOIS_BAC + 1) passerBac();
    if (S.mois === VIE_CFG.MOIS_DIPLOME + 1 && phase() === 'travail' && !S.metierId && S.orientationId !== 'travail') obtenirDiplome();
    if (S.mois === 21) { // 20 ans
      S.cinematiques.push({ emoji: '🎂', titre: '20 ans', texte: 'Deux dizaines au compteur. Quelqu\'un a mis une seule bougie « 20 » sur le gâteau, par flemme. Tu as souri : la suite t\'appartient.' });
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

  /* ---------- Examens & carrière ---------- */

  function passerBac() {
    const reussi = S.stats.savoir >= 45;
    S.bacObtenu = reussi;
    const mention = S.stats.savoir >= 80 ? ' avec mention Très Bien 🌟' : S.stats.savoir >= 65 ? ' avec mention Bien' : S.stats.savoir >= 55 ? ' avec mention Assez Bien' : '';
    if (reussi) {
      S.cinematiques.push({
        emoji: '🎓', titre: 'Résultats du bac',
        texte: `La liste est affichée sur la grille du lycée. Ton nom y est : ADMIS${S.perso.genre === 'femme' ? 'E' : ''}${mention} ! Les cris, les câlins, les photos. Maintenant… il faut choisir la suite.`,
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
    if (S.metierId && REVES[S.metierId]) {
      // déjà signé·e pro : le club/label a aménagé tes cours, pas d'orientation à choisir
      log('🎓 Le bac en parallèle de ta carrière — chapeau.');
    } else {
      S.choixOrientation = true;
      notifier('🎓', reussi ? 'Bac en poche ! Choisis ton orientation.' : 'Pas de bac — choisis ta voie quand même.');
    }
  }

  function orientationsPossibles() {
    return ORIENTATIONS.filter(o => {
      if (o.id !== 'travail' && S.bacObtenu === false) return false;
      return S.stats.savoir >= o.minSavoir - 10; // un peu de souplesse
    });
  }

  function choisirOrientation(id) {
    if (!S.choixOrientation) return { ok: false };
    S.orientationId = id;
    S.choixOrientation = false;
    nouvelleCarte();
    if (id === 'travail') demarrerRecherche();
    else {
      const o = ORIENTATIONS.find(x => x.id === id);
      log(`${o.icone} C'est parti pour : ${o.nom}.`);
      S.cinematiques.push({ emoji: o.icone, titre: o.nom, texte: `Nouveau campus, nouvelles têtes, nouveaux horaires approximatifs. ${o.desc}` });
    }
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
      .map(m => ({ ...m, accessible: S.stats.savoir >= m.minSavoir }));
  }

  function passerEntretien(metierId, nbBonnesReponses) {
    const m = METIERS.find(x => x.id === metierId);
    if (!m || !S.rechercheEmploi) return { ok: false };
    if (S.mois < S.entretienDispo) return { ok: false, msg: 'Le prochain entretien attendra un peu.' };
    if (S.stats.savoir < m.minSavoir) return { ok: false, msg: 'Il te manque du savoir pour ce poste.' };
    const score = nbBonnesReponses * 25 + S.stats.social * 0.25 + Math.min(20, (S.stats.savoir - m.minSavoir) * 0.4);
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

  /* ---------- Bilan final à 30 ans ---------- */

  function bilanFinal() {
    const b = bonheur().note;
    const amisMoy = S.amis.length ? S.amis.reduce((s, a) => s + a.relation, 0) / S.amis.length : 0;
    const metier = METIERS.find(m => m.id === S.metierId);
    const score = Math.round(b * 0.4 + amisMoy * 0.25 + Math.min(100, S.argent / 80) * 0.2 + (metier ? Math.min(100, metier.salaire / 26) : 20) * 0.15);
    let phrase;
    if (score >= 80) phrase = 'Une vie qui donne envie : des amis en or, un métier qui te va, et le sourire en prime.';
    else if (score >= 60) phrase = 'Une belle trajectoire, avec ses hauts, ses bas, et pas mal de fierté au compteur.';
    else if (score >= 40) phrase = 'Une vie cabossée mais bien à toi. Et à 30 ans, tout reste ouvert.';
    else phrase = 'Ça a tangué. Mais tu es encore debout, et c\'est déjà une victoire.';
    S.gameOver = {
      victoire: true, score,
      titre: `25 ans — score de vie : ${score}/100`,
      texte: `${S.perso.prenom}, ${metier ? metier.nom : 'électron libre'} à ${S.commune}. Bonheur ${Math.round(b)}/100, amitiés ${Math.round(amisMoy)}/100, ${Math.round(S.argent)} € de côté. ${phrase}`,
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
    age, phase, NOMS_PHASE, classeActuelle, moisCalendaire, saisonVie,
    bonheur, revenuMensuel, objectifCourant, xpPourNiveau,
    notifsNonLues, marquerNotifsLues,
  };
})();
