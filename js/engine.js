/* ============================================================
   BIG CITY — Moteur de simulation
   Budget, fiscalité, migration, crises, paliers de défaite.
   ============================================================ */

const Engine = (() => {
  let S = null; // état courant de la partie

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const clamp100 = (v) => clamp(v, 0, 100);

  /* ---------- Création de partie ---------- */

  function nouvellePartie(profilId, tranquille) {
    const p = PROFILS[profilId];
    const pop = p.population;
    S = {
      version: 1,
      profil: profilId,
      commune: p.nom,
      tranquille: !!tranquille,
      jour: 1, jourDuMois: 1, mois: 1,

      population: pop,
      populationInitiale: pop,
      popularite: p.popularite,
      attractivite: p.attractivite,
      capitalPrefecture: CFG.CAPITAL_PREF_INIT,

      cadre: { eclairage: 60, voirie: 65, proprete: 62, logement: 55, proximite: 55 },

      taux: CFG.TAUX_DEFAUT,
      tauxProchain: null,
      tauxChangeCeMois: false,
      exonerationMois: 0,

      niveauEntretien: 'normal',
      budgetVoirie: Math.round(pop * COEF.VOIRIE_PLEIN),
      budgetProprete: Math.round(pop * 1.0),

      equipements: [],           // construits pendant le mandat
      emprunts: [],
      avanceTreso: null,         // { mensualite, moisRestants }
      effetsDifferes: [],        // { jour, effets?|evenement?, note?, source }
      offresEnCours: [],         // offres privées disponibles
      offresRefusees: [],
      prochaineOffreJour: 40 + Math.floor(Math.random() * 30),

      questionActive: null,      // id de la question du courrier du maire
      pileQuestions: [],         // pioche mélangée, retirée sans remise
      prochaineQuestionJour: 4 + Math.floor(Math.random() * 4),

      criseActive: null,         // { criseId, jourDebut, coutCourant }
      derniereCriseJour: -999,
      crisesCooldown: {},        // criseId -> jour de fin de cooldown
      crisesGerees: 0, crisesRatees: 0,

      paliers: {
        fin: 'ok',               // ok | alerte | redressement (tutelle => gameOver)
        demo: 'ok',              // ok | alerte | declin
        redressementDebut: null,
        declinApplique: false,
        soutienUtilise: false,
      },
      missionFaiteJour: 0,
      malusMigration: [],        // { pct, jusquauJour, motif }

      moisCourant: accumVide(),
      historique: [],            // budget_mensuel
      dernierSoldeMigratoire: 0,
      dernierDiagnostic: null,

      journal: [],
      epargneCumulee: 0,
      gameOver: null,            // { type, titre, texte }
    };
    S.tresorerie = Math.round(depensesMensuelles() * COEF.TRESO_INIT_MOIS);
    log(`🎉 Vous voilà maire de ${p.nom} (${fmtNb(pop)} hab.). Le conseil municipal vous souhaite « bon courage », avec un sourire en coin.`);
    log(`💶 Trésorerie de départ : ${fmtEuro(S.tresorerie)}. Taux communal : ${S.taux} %.`);
    return S;
  }

  function accumVide() {
    return { recFiscalite: 0, recDotation: 0, recServices: 0, recSubventions: 0,
             depPersonnel: 0, depEnergie: 0, depEntretien: 0, depDette: 0, depExceptionnel: 0,
             populationDebut: null };
  }

  /* ---------- Calendrier ---------- */

  function moisCalendaire() { return (MOIS_DEBUT_MANDAT + S.mois - 1) % 12; }
  function saison() { return SAISONS[moisCalendaire()]; }
  function annee() { return Math.floor((MOIS_DEBUT_MANDAT + S.mois - 1) / 12) + 1; }

  /* ---------- Budget mensuel (taux courants) ---------- */

  function cadreDeVie() {
    const c = S.cadre;
    return c.eclairage * 0.20 + c.voirie * 0.25 + c.proprete * 0.20 + c.logement * 0.15 + c.proximite * 0.20;
  }

  function recettes() {
    let fisc = S.population * CFG.VALEUR_LOCATIVE * (S.taux / 100) / 12;
    if (S.exonerationMois > 0) fisc *= 0.95;
    const dotation = S.population * CFG.DOTATION_HAB_AN / 12;
    let services = S.population * COEF.SERVICES_BASE;
    for (const e of S.equipements) services += defEquip(e.type).recettes;
    return { fiscalite: Math.round(fisc), dotation: Math.round(dotation), services: Math.round(services) };
  }

  function depenses() {
    const personnel = S.population * COEF.PERSONNEL;
    let energie = S.population * COEF.ENERGIE_BASE;
    let entretien = S.population * COEF.ENTRETIEN_BASE + S.budgetVoirie + S.budgetProprete;
    for (const e of S.equipements) {
      const d = defEquip(e.type);
      energie += d.energie;
      entretien += d.entretien;
    }
    let dette = S.emprunts.reduce((s, e) => s + e.mensualite, 0);
    if (S.avanceTreso) dette += S.avanceTreso.mensualite;
    return { personnel: Math.round(personnel), energie: Math.round(energie),
             entretien: Math.round(entretien), dette: Math.round(dette) };
  }

  function totalRecettes() { const r = recettes(); return r.fiscalite + r.dotation + r.services; }
  function depensesMensuelles() { const d = depenses(); return d.personnel + d.energie + d.entretien + d.dette; }
  function soldeMensuel() { return totalRecettes() - depensesMensuelles(); }
  function joursDeTresorerie() { return S.tresorerie / (depensesMensuelles() / 30); }
  function recettesAnnuelles() { return totalRecettes() * 12; }
  function encoursDette() { return S.emprunts.reduce((s, e) => s + e.restantDu, 0); }
  function tauxEndettement() { return encoursDette() / recettesAnnuelles(); }

  function capaciteEquipements() {
    let cap = S.populationInitiale * COEF.CAPACITE_BASE;
    for (const e of S.equipements) cap += defEquip(e.type).capacite;
    cap += S.capaciteMalus || 0;
    return Math.max(1, cap);
  }
  function saturation() {
    return Math.max(0, S.population / capaciteEquipements() - 1) * 100;
  }

  /* On ne finance jamais du fonctionnement avec de l'investissement —
     et réciproquement : 15 jours de dépenses sont sanctuarisés. */
  function reserveFonctionnement() { return depensesMensuelles() / 30 * CFG.RESERVE_FONCTIONNEMENT_J; }
  function capaciteInvestissement() { return Math.max(0, S.tresorerie - reserveFonctionnement()); }

  function defEquip(id) { return EQUIPEMENTS.find(e => e.id === id); }

  /* ---------- Fiscalité ---------- */

  function penalitePopularite(taux) { return (taux - CFG.TAUX_DEFAUT) * 1.8; }

  function changerTaux(nouveau) {
    nouveau = clamp(Math.round(nouveau), CFG.TAUX_MIN, CFG.TAUX_MAX);
    if (S.paliers.fin === 'redressement' && nouveau < 15) nouveau = 15;
    if (S.tauxChangeCeMois) return { ok: false, msg: 'Le taux ne peut être modifié qu\'une fois par mois.' };
    if (nouveau === S.taux && S.tauxProchain === null) return { ok: false, msg: 'Taux inchangé.' };
    const dPop = penalitePopularite(S.taux) - penalitePopularite(nouveau);
    S.popularite = clamp100(S.popularite + dPop);
    S.tauxProchain = nouveau;
    S.tauxChangeCeMois = true;
    log(`🏛️ Taux communal voté à ${nouveau} % (application au mois prochain). Popularité ${dPop >= 0 ? '+' : ''}${dPop.toFixed(1)}.`);
    return { ok: true };
  }

  /* ---------- Construction ---------- */

  function peutConstruire(def) {
    if (S.paliers.fin === 'redressement') return { ok: false, msg: 'Investissements gelés (plan de redressement).' };
    if (!def.repetable && !def.chantier && S.equipements.some(e => e.type === def.id))
      return { ok: false, msg: 'Déjà construit.' };
    if (def.chantier === 'eclairage' && S.equipements.some(e => e.type === def.id))
      return { ok: false, msg: 'Déjà réalisé.' };
    if (def.cout > capaciteInvestissement())
      return { ok: false, msg: 'Capacité d\'investissement insuffisante (15 jours de fonctionnement sanctuarisés).' };
    return { ok: true };
  }

  function construire(equipId) {
    const def = defEquip(equipId);
    const test = peutConstruire(def);
    if (!test.ok) return test;
    const cout = def.cout;
    S.tresorerie -= cout;
    S.equipements.push({ type: equipId, mois: S.mois });
    if (def.chantier === 'voirie') S.cadre.voirie = 95;
    if (def.chantier === 'eclairage') S.cadre.eclairage = 92;
    if (def.effets.attractivite) S.attractivite = clamp100(S.attractivite + def.effets.attractivite);
    if (def.effets.popularite) S.popularite = clamp100(S.popularite + def.effets.popularite);
    if (def.proximite) S.cadre.proximite = clamp100(S.cadre.proximite + 6);
    const charge = def.entretien + def.energie - def.recettes;
    log(`🏗️ ${def.nom} : ${fmtEuro(cout)}. ${charge > 0 ? `Nouvelle charge de fonctionnement : ${fmtEuro(charge)}/mois, à vie.` : charge < 0 ? `Gain de fonctionnement : ${fmtEuro(-charge)}/mois.` : ''}`);
    return { ok: true };
  }

  /* ---------- Entretien de la ville : trois niveaux, c'est tout ---------- */

  const NIVEAUX_ENTRETIEN = {
    eco:    { facteur: 0.5, nom: 'Éco' },
    normal: { facteur: 1.0, nom: 'Normal' },
    soigne: { facteur: 1.6, nom: 'Soigné' },
  };

  function budgetsEntretien(niveau, pop) {
    const f = NIVEAUX_ENTRETIEN[niveau].facteur;
    return {
      voirie: Math.round(pop * COEF.VOIRIE_PLEIN * f),
      proprete: Math.round(pop * 1.0 * f),
    };
  }

  function coutEntretien(niveau) {
    const b = budgetsEntretien(niveau, S.population);
    return b.voirie + b.proprete;
  }

  function reglerEntretien(niveau) {
    if (!NIVEAUX_ENTRETIEN[niveau]) return { ok: false };
    S.niveauEntretien = niveau;
    const b = budgetsEntretien(niveau, S.population);
    S.budgetVoirie = b.voirie;
    S.budgetProprete = b.proprete;
    log(`🧹 Entretien de la ville réglé sur « ${NIVEAUX_ENTRETIEN[niveau].nom} » (${fmtEuro(b.voirie + b.proprete)}/mois).`);
    return { ok: true };
  }

  /* ---------- Emprunt ---------- */

  function conditionsEmprunt() {
    const tx = 0.035 + 0.02 * tauxEndettement();
    const capaciteMax = Math.max(0, recettesAnnuelles() * 1.2 - encoursDette());
    const bloque = tauxEndettement() >= 1 || S.paliers.fin === 'redressement';
    return { taux: tx, capaciteMax: Math.round(capaciteMax), bloque };
  }

  function mensualite(capital, tauxAnnuel, dureeMois) {
    const t = tauxAnnuel / 12;
    return Math.round(capital * t / (1 - Math.pow(1 + t, -dureeMois)));
  }

  function emprunter(capital, dureeMois) {
    const c = conditionsEmprunt();
    if (c.bloque) return { ok: false, msg: 'Accès à l\'emprunt coupé (endettement > 100 % ou redressement).' };
    if (capital > c.capaciteMax) return { ok: false, msg: 'Capacité d\'emprunt dépassée.' };
    const m = mensualite(capital, c.taux, dureeMois);
    S.emprunts.push({ capital, tauxAnnuel: c.taux, dureeMois, mensualite: m, restantDu: capital, moisRestants: dureeMois });
    S.tresorerie += capital;
    log(`🏦 Emprunt de ${fmtEuro(capital)} sur ${dureeMois} mois à ${(c.taux * 100).toFixed(2)} %. Mensualité : ${fmtEuro(m)} — définitivement inscrite au fonctionnement.`);
    return { ok: true };
  }

  /* ---------- Aides de l'État ---------- */

  function aideEtat(id) {
    const aide = AIDES_ETAT.find(a => a.id === id);
    if (S.capitalPrefecture < aide.capital) return { ok: false, msg: 'Capital préfecture insuffisant. La préfecture ne répond plus à vos appels.' };
    if (id === 'avance_treso') {
      if (S.avanceTreso) return { ok: false, msg: 'Une avance est déjà en cours de remboursement.' };
      const montant = Math.round(depensesMensuelles() * 3);
      S.capitalPrefecture -= aide.capital;
      S.tresorerie += montant;
      S.avanceTreso = { mensualite: Math.round(montant / 12), moisRestants: 12 };
      log(`🏛️ Avance de trésorerie de l'État : ${fmtEuro(montant)}, remboursable sur 12 mois (${fmtEuro(S.avanceTreso.mensualite)}/mois).`);
      return { ok: true };
    }
    if (id === 'soutien_exceptionnel') {
      if (S.paliers.soutienUtilise) return { ok: false, msg: 'Déjà utilisé ce mandat. L\'État ne repassera pas deux fois.' };
      if (S.tresorerie >= 0) return { ok: false, msg: 'Réservé aux communes en trésorerie négative.' };
      S.capitalPrefecture -= aide.capital;
      log(`🏛️ Soutien exceptionnel au redressement : la trésorerie remonte de ${fmtEuro(-S.tresorerie)} à zéro. La préfecture précise : « C'était la dernière fois. »`);
      S.tresorerie = 0;
      S.paliers.soutienUtilise = true;
      return { ok: true };
    }
  }

  /* ---------- Offres privées ---------- */

  function accepterOffre(offreId) {
    const i = S.offresEnCours.findIndex(o => o.id === offreId);
    if (i < 0) return { ok: false };
    const o = OFFRES_PRIVEES.find(x => x.id === offreId);
    S.offresEnCours.splice(i, 1);
    S.tresorerie += o.montant;
    S.moisCourant.recSubventions += o.montant;
    S.effetsDifferes.push({ jour: S.jour + o.delai, evenement: o.evenement, source: o.nom });
    log(`💼 ${o.nom} : ${fmtEuro(o.montant)} encaissés. Une créance est inscrite dans la file des effets différés (J+${o.delai}).`);
    return { ok: true };
  }

  function refuserOffre(offreId) {
    const i = S.offresEnCours.findIndex(o => o.id === offreId);
    if (i >= 0) { S.offresEnCours.splice(i, 1); S.offresRefusees.push(offreId); }
    log(`🚪 Offre privée déclinée. On ne vous le proposera pas deux fois.`);
    return { ok: true };
  }

  /* ---------- Crises ---------- */

  function facteurPopulation() { return clamp(S.population / 12000, 0.35, 2.5); }

  function tenterCrise() {
    if (S.criseActive || S.gameOver) return;
    if (S.jour < CFG.CRISE_GRACE_JOURS) return;
    if (S.jour - S.derniereCriseJour < CFG.CRISE_COOLDOWN_GLOBAL) return;
    if (Math.random() > CFG.CRISE_PROBA_JOUR) return;
    const sais = saison();
    const eligibles = CRISES.filter(c =>
      c.profils.includes(S.profil) &&
      c.saisons.includes(sais) &&
      (S.crisesCooldown[c.id] || 0) <= S.jour &&
      (!c.moisMin || S.mois >= c.moisMin));
    if (!eligibles.length) return;
    const crise = eligibles[Math.floor(Math.random() * eligibles.length)];
    S.criseActive = {
      criseId: crise.id, jourDebut: S.jour,
      coutCourant: Math.round(crise.cout * facteurPopulation()),
    };
    S.derniereCriseJour = S.jour;
    S.crisesCooldown[crise.id] = S.jour + crise.cooldown;
    log(`🚨 CRISE — ${crise.nom}. Le coût augmente chaque jour sans décision (option par défaut sous ${CFG.CRISE_DELAI_JOURS} jours).`);
  }

  function escaladerCrise() {
    if (!S.criseActive) return;
    const c = S.criseActive;
    const joursEcoules = S.jour - c.jourDebut;
    if (joursEcoules <= 0) return;
    c.coutCourant = Math.round(c.coutCourant * (1 + CFG.CRISE_ESCALADE_JOUR));
    if (joursEcoules >= CFG.CRISE_DELAI_JOURS) {
      const crise = CRISES.find(x => x.id === c.criseId);
      const defaut = crise.options.find(o => o.defaut) || crise.options[crise.options.length - 1];
      log(`⏰ Délai de réponse expiré — option par défaut appliquée : « ${defaut.libelle} ».`);
      resoudreCrise(defaut.cle, true);
    }
  }

  function moduler(effets) {
    const mod = MODULATEURS_PROFIL[S.profil];
    if (!mod) return effets;
    const r = { ...effets };
    for (const k of Object.keys(mod)) {
      if (r[k] !== undefined && r[k] < 0) r[k] = r[k] * mod[k];
    }
    return r;
  }

  function resoudreCrise(cle, parDefaut = false) {
    const c = S.criseActive;
    if (!c) return { ok: false };
    const crise = CRISES.find(x => x.id === c.criseId);
    const opt = crise.options.find(o => o.cle === cle);
    if (!opt) return { ok: false, msg: 'Option inconnue pour cette crise.' };
    if (opt.capital && S.capitalPrefecture < opt.capital)
      return { ok: false, msg: 'Capital préfecture insuffisant pour cette option.' };
    const cout = Math.round(c.coutCourant * opt.coutFacteur);
    S.tresorerie -= cout;
    S.moisCourant.depExceptionnel += cout;
    if (opt.capital) S.capitalPrefecture -= opt.capital;
    appliquerEffets(moduler(opt.effets || {}), crise.nom);
    for (const d of (opt.differes || [])) {
      S.effetsDifferes.push({ jour: S.jour + d.jours, effets: d.effets, evenement: d.evenement, note: d.note, source: crise.nom });
    }
    if (parDefaut || opt.defaut) S.crisesRatees++; else S.crisesGerees++;
    S.criseActive = null;
    log(`${crise.icone} ${crise.nom} — option ${opt.cle} : « ${opt.libelle} ». Coût : ${fmtEuro(cout)}.${opt.capital ? ` Capital préfecture −${opt.capital}.` : ''}`);
    return { ok: true };
  }

  /* ---------- Courrier du maire (questions à choix multiples) ---------- */

  function tirerQuestion() {
    if (S.questionActive || S.criseActive || S.gameOver) return;
    if (S.jour < S.prochaineQuestionJour) return;
    const sais = saison();
    // on repioche dans le paquet mélangé ; on saute les questions hors saison
    for (let essais = 0; essais < QUESTIONS.length + 1; essais++) {
      if (!S.pileQuestions.length) {
        S.pileQuestions = QUESTIONS.map(q => q.id).sort(() => Math.random() - 0.5);
      }
      const id = S.pileQuestions.pop();
      const q = QUESTIONS.find(x => x.id === id);
      if (q.saisons && !q.saisons.includes(sais)) continue;
      S.questionActive = id;
      log(`📬 Courrier du maire : « ${q.texte} »`);
      return;
    }
  }

  function resoudreQuestion(indexOption) {
    const q = QUESTIONS.find(x => x.id === S.questionActive);
    if (!q) return { ok: false };
    const opt = q.options[indexOption];
    const effets = { ...opt.effets };
    if (effets.tresorerie) effets.tresorerie = Math.round(effets.tresorerie * facteurPopulation());
    appliquerEffets(effets, 'courrier du maire');
    S.questionActive = null;
    S.prochaineQuestionJour = S.jour + 6 + Math.floor(Math.random() * 7);
    log(`${q.icone} ${opt.libelle} — ${opt.note}`);
    return { ok: true, note: opt.note, icone: q.icone };
  }

  /* ---------- Effets génériques ---------- */

  function appliquerEffets(eff, source) {
    if (!eff) return;
    if (eff.tresorerie) { S.tresorerie += eff.tresorerie; if (eff.tresorerie < 0) S.moisCourant.depExceptionnel -= eff.tresorerie; }
    if (eff.popularite) S.popularite = clamp100(S.popularite + eff.popularite);
    if (eff.attractivite) S.attractivite = clamp100(S.attractivite + eff.attractivite);
    if (eff.cadre_voirie) S.cadre.voirie = clamp100(S.cadre.voirie + eff.cadre_voirie);
    if (eff.cadre_eclairage) S.cadre.eclairage = clamp100(S.cadre.eclairage + eff.cadre_eclairage);
    if (eff.cadre_logement) S.cadre.logement = clamp100(S.cadre.logement + eff.cadre_logement);
    if (eff.cadre_proprete) S.cadre.proprete = clamp100(S.cadre.proprete + eff.cadre_proprete);
    if (eff.capacite) S.capaciteMalus = (S.capaciteMalus || 0) + eff.capacite;
    if (eff.exoneration_mois) S.exonerationMois += eff.exoneration_mois;
    if (eff.population_pct) {
      const delta = Math.round(S.population * eff.population_pct / 100);
      S.population = Math.max(0, S.population + delta);
      log(`👥 ${delta >= 0 ? '+' : ''}${fmtNb(delta)} habitants (${source || 'événement'}).`);
    }
  }

  /* ---------- Tick quotidien ---------- */

  function avancerJour() {
    // une crise ou une question en attente bloque le temps tant qu'on n'a pas répondu
    if (S.gameOver || S.criseActive || S.questionActive) return;
    tickInterne();
  }

  function reporterCrise() {
    // le joueur choisit sciemment de laisser filer un jour : escalade
    if (!S.criseActive) return;
    tickInterne();
  }

  function tickInterne() {
    S.jour++; S.jourDuMois++;

    // accrual quotidien du budget de fonctionnement
    const r = recettes(), d = depenses();
    S.tresorerie += (r.fiscalite + r.dotation + r.services - d.personnel - d.energie - d.entretien - d.dette) / 30;
    const mc = S.moisCourant;
    if (mc.populationDebut === null) mc.populationDebut = S.population;
    mc.recFiscalite += r.fiscalite / 30; mc.recDotation += r.dotation / 30; mc.recServices += r.services / 30;
    mc.depPersonnel += d.personnel / 30; mc.depEnergie += d.energie / 30;
    mc.depEntretien += d.entretien / 30; mc.depDette += d.dette / 30;

    // effets différés arrivés à échéance
    const dus = S.effetsDifferes.filter(e => e.jour <= S.jour && !e.evenement);
    for (const e of dus) {
      appliquerEffets(e.effets, e.source);
      if (e.note) log(`⏳ ${e.source} : ${e.note}`);
    }
    S.effetsDifferes = S.effetsDifferes.filter(e => e.jour > S.jour || e.evenement);
    // (les événements différés à choix sont présentés par l'UI via evenementDu())

    // offres privées : apparition
    if (S.jour >= S.prochaineOffreJour && S.offresEnCours.length === 0) {
      const dispo = OFFRES_PRIVEES.filter(o => !S.offresRefusees.includes(o.id) &&
        !S.effetsDifferes.some(e => e.evenement === o.evenement));
      if (dispo.length) {
        const o = dispo[Math.floor(Math.random() * dispo.length)];
        S.offresEnCours.push({ id: o.id });
        log(`💼 Offre privée : ${o.nom} propose ${fmtEuro(o.montant)}. Rien n'est jamais gratuit (voir Aides & finances).`);
      }
      S.prochaineOffreJour = S.jour + 60 + Math.floor(Math.random() * 40);
    }

    // crises
    escaladerCrise();
    tenterCrise();

    // courrier du maire (jamais en même temps qu'une crise)
    tirerQuestion();

    // paliers
    evaluerPaliers();

    // clôture mensuelle
    if (S.jourDuMois > CFG.JOURS_PAR_MOIS) cloturerMois();

    // fin de mandat
    if (S.mois > CFG.MANDAT_MOIS && !S.gameOver) finDeMandat();
  }

  /* ---------- Clôture mensuelle ---------- */

  function cloturerMois() {
    S.jourDuMois = 1;

    // migration — un seul chiffre par mois
    const migration = calculerMigration();
    S.population = Math.max(0, S.population + migration.delta);
    S.dernierSoldeMigratoire = migration.delta;
    S.dernierDiagnostic = migration.diagnostic;

    // journal budgétaire
    const mc = S.moisCourant;
    const solde = Math.round(mc.recFiscalite + mc.recDotation + mc.recServices + mc.recSubventions
      - mc.depPersonnel - mc.depEnergie - mc.depEntretien - mc.depDette - mc.depExceptionnel);
    S.historique.push({
      mois: S.mois, nomMois: NOMS_MOIS[moisCalendaire()], annee: annee(),
      recFiscalite: Math.round(mc.recFiscalite), recDotation: Math.round(mc.recDotation),
      recServices: Math.round(mc.recServices), recSubventions: Math.round(mc.recSubventions),
      depPersonnel: Math.round(mc.depPersonnel), depEnergie: Math.round(mc.depEnergie),
      depEntretien: Math.round(mc.depEntretien), depDette: Math.round(mc.depDette),
      depExceptionnel: Math.round(mc.depExceptionnel),
      solde, tresorerie: Math.round(S.tresorerie),
      populationDebut: mc.populationDebut, populationFin: S.population,
      soldeMigratoire: migration.delta,
    });
    if (solde > 0) S.epargneCumulee += solde;
    S.moisCourant = accumVide();

    // emprunts & avance
    for (const e of S.emprunts) {
      e.moisRestants--;
      e.restantDu = Math.max(0, e.restantDu - Math.round(e.capital / e.dureeMois));
    }
    S.emprunts = S.emprunts.filter(e => e.moisRestants > 0);
    if (S.avanceTreso && --S.avanceTreso.moisRestants <= 0) {
      S.avanceTreso = null;
      log('🏛️ Avance de trésorerie de l\'État intégralement remboursée.');
    }
    if (S.exonerationMois > 0) S.exonerationMois--;

    // l'entretien suit la population au niveau choisi
    if (S.niveauEntretien) {
      const b = budgetsEntretien(S.niveauEntretien, S.population);
      S.budgetVoirie = b.voirie;
      S.budgetProprete = b.proprete;
    }

    // capital préfecture
    let regen = CFG.CAPITAL_PREF_REGEN;
    if (S.paliers.fin !== 'ok') regen -= CFG.CAPITAL_PREF_MALUS_ALERTE;
    S.capitalPrefecture = clamp100(S.capitalPrefecture + regen);

    // application du taux voté
    if (S.tauxProchain !== null) {
      S.taux = S.tauxProchain; S.tauxProchain = null;
      log(`💶 Le taux communal de ${S.taux} % entre en vigueur.`);
    }
    S.tauxChangeCeMois = false;

    // cadre de vie
    majCadreDeVie();

    // popularité : lente réversion vers 50
    S.popularite = clamp100(S.popularite + (50 - S.popularite) * 0.03);

    // malus migratoires expirés
    S.malusMigration = S.malusMigration.filter(m => m.jusquauJour > S.jour);

    S.mois++;
    const migTxt = migration.delta === 0 ? 'population stable' : `${migration.delta > 0 ? '+' : ''}${fmtNb(migration.delta)} habitants`;
    log(`📅 Clôture de ${NOMS_MOIS[moisCalendaire()]} : solde ${solde >= 0 ? '+' : ''}${fmtEuro(solde)}, ${migTxt}.`);
  }

  function majCadreDeVie() {
    const c = S.cadre;
    // voirie : seule dégradation automatique du jeu — lente, annoncée, évitable
    const plein = S.population * COEF.VOIRIE_PLEIN;
    const ratio = plein > 0 ? clamp(S.budgetVoirie / plein, 0, 1) : 1;
    if (ratio >= 1) c.voirie = clamp(c.voirie + 1, 0, 85 + (c.voirie > 85 ? c.voirie - 85 : 0));
    else {
      const perte = CFG.DEGRADATION_VOIRIE_MAX * (1 - ratio);
      c.voirie = clamp100(c.voirie - perte);
      if (ratio < 0.5) log(`🛣️ L'entretien de la voirie n'est pas budgété : l'état se dégrade (−${perte.toFixed(1)} pt ce mois-ci).`);
    }
    // propreté : converge vers la cible fixée par le budget alloué
    const cible = clamp100(100 * S.budgetProprete / (S.population * COEF.PROPRETE_PLEIN));
    c.proprete = clamp100(c.proprete + (cible - c.proprete) * 0.3);
    // logements vacants : suit l'attractivité
    c.logement = clamp100(c.logement + (S.attractivite - c.logement) * 0.1);
    // éclairage : très lente usure hors LED
    if (c.eclairage < 92) c.eclairage = clamp(c.eclairage - 0.2, 40, 100);
  }

  /* ---------- Migration (§4) ---------- */

  function calculerMigration() {
    const cadre = cadreDeVie();
    const sat = saturation();
    const malusEvt = S.malusMigration.reduce((s, m) => s + m.pct, 0);

    const dFiscal = Math.max(0, S.taux - 18) * 0.25;
    const dCadre = Math.max(0, 50 - cadre) * 0.04;
    const dSat = sat * 0.15;
    const depart = dFiscal + dCadre + dSat + malusEvt;

    const aAttract = Math.max(0, S.attractivite - 50) * 0.06;
    const aCadre = Math.max(0, cadre - 60) * 0.03;
    const aEquip = Math.min(0.3, S.equipements.length * 0.03);
    const aFiscal = Math.max(0, 12 - S.taux) * 0.15;
    const arrivee = aAttract + aCadre + aEquip + aFiscal;

    const soldePct = clamp(arrivee - depart, -CFG.MIGRATION_CLAMP, CFG.MIGRATION_CLAMP);
    return {
      delta: Math.round(S.population * soldePct / 100),
      diagnostic: {
        fiscalite: dFiscal, cadreDeVie: dCadre, saturation: dSat, evenements: malusEvt,
        aFiscal, arrivee, depart, soldePct,
      },
    };
  }

  /* ---------- Paliers de défaite (§7) ---------- */

  function evaluerPaliers() {
    if (S.gameOver) return;
    const P = S.paliers;

    /* Défaite n°1 — financière */
    const jours = joursDeTresorerie();
    if (S.tresorerie < 0) {
      if (P.fin !== 'redressement') {
        P.fin = 'redressement';
        P.redressementDebut = S.jour;
        S.popularite = clamp100(S.popularite - 10);
        if (S.taux < 15 && S.tauxProchain === null) { S.tauxProchain = 15; S.tauxChangeCeMois = true; }
        log(`🟥 TRÉSORERIE NÉGATIVE — Plan de redressement : ${CFG.REDRESSEMENT_JOURS} jours pour revenir à l'équilibre. Investissements gelés, emprunt coupé, taux plancher 15 %, popularité −10. Une mission de redressement rémunérée est disponible chaque jour.`);
      } else if (S.jour - P.redressementDebut > CFG.REDRESSEMENT_JOURS) {
        if (S.tranquille) {
          P.redressementDebut = S.jour; // mode ville tranquille : on repart pour 30 jours
          log('🕊️ Mode ville tranquille : la chambre régionale des comptes vous accorde un nouveau délai.');
        } else {
          return defaite('tutelle', 'Mise sous tutelle',
            `La chambre régionale des comptes constate l'échec du plan de redressement. La commune de ${S.commune} est placée sous tutelle préfectorale et votre mandat prend fin. Vous conservez votre expérience, votre palmarès — et une revanche à prendre.`);
        }
      }
    } else {
      if (P.fin === 'redressement') {
        P.redressementDebut = null;
        log('🟩 Trésorerie revenue à l\'équilibre : le plan de redressement est levé.');
      }
      P.fin = jours < CFG.SEUIL_ALERTE_JOURS ? 'alerte' : 'ok';
    }

    /* Défaite n°2 — démographique (en % de la population initiale) */
    const perte = (S.populationInitiale - S.population) / S.populationInitiale * 100;
    const [p1, p2, p3] = CFG.DEFAITE_DEMO;
    if (perte >= p3 && !S.tranquille) {
      return defaite('desertification', 'Désertification',
        `${S.commune} a perdu ${perte.toFixed(1)} % de sa population depuis le début du mandat. Le conseil municipal constate que la commune se vide et met fin à votre mandat. Les diagnostics étaient affichés ; la prochaine fois, vous saurez.`);
    }
    if (perte >= p2) {
      if (!P.declinApplique) {
        P.declinApplique = true;
        S.popularite = clamp100(S.popularite - 15);
        log('🟥 DÉCLIN DÉMOGRAPHIQUE (−10 %) : « Le conseil s\'inquiète ». Popularité −15, la dotation suit la population. Toujours jouable — mais plus pour longtemps.');
      }
      P.demo = 'declin';
    } else if (perte >= p1) {
      if (P.demo === 'ok') log('🟧 Alerte démographique (−5 %) : consultez le diagnostic des départs sur le tableau de bord.');
      P.demo = 'alerte';
    } else {
      P.demo = 'ok';
      if (perte < p2 - 1) P.declinApplique = false;
    }
  }

  function joursRedressementRestants() {
    if (S.paliers.fin !== 'redressement' || S.paliers.redressementDebut === null) return null;
    return Math.max(0, CFG.REDRESSEMENT_JOURS - (S.jour - S.paliers.redressementDebut));
  }

  function missionRedressementDispo() {
    return S.paliers.fin === 'redressement' && S.missionFaiteJour !== S.jour;
  }

  function faireMissionRedressement() {
    if (!missionRedressementDispo()) return { ok: false };
    S.missionFaiteJour = S.jour;
    S.tresorerie += CFG.MISSION_REDRESSEMENT;
    S.moisCourant.recSubventions += CFG.MISSION_REDRESSEMENT;
    log(`🗂️ Mission de redressement accomplie : +${fmtEuro(CFG.MISSION_REDRESSEMENT)}.`);
    return { ok: true };
  }

  function defaite(type, titre, texte) {
    S.gameOver = { type, titre, texte, victoire: false };
  }

  /* ---------- Fin de mandat & score ---------- */

  function finDeMandat() {
    const croissance = (S.population - S.populationInitiale) / S.populationInitiale * 100;
    const score = Math.round(
      croissance * 4 + S.popularite + S.attractivite * 0.5 + cadreDeVie() * 0.5
      + S.equipements.length * 5 + S.epargneCumulee / 50000
      + S.crisesGerees * 5 - S.crisesRatees * 8
    );
    let mention, note;
    if (score >= 180) { mention = 'A'; note = 'Un mandat exemplaire. Paris vous observe — restez donc ici, on est mieux.'; }
    else if (score >= 140) { mention = 'B'; note = 'Une commune tenue, des comptes sains. Le conseil vote des remerciements.'; }
    else if (score >= 100) { mention = 'C'; note = 'Un mandat honorable. On a connu pire — souvent dans la commune d\'à côté.'; }
    else if (score >= 60) { mention = 'D'; note = 'La commune a survécu. C\'est déjà ça, dira l\'opposition.'; }
    else { mention = 'E'; note = 'Le bilan est... contrasté. La presse locale a été moins diplomate.'; }
    S.gameOver = {
      type: 'fin_mandat', victoire: true, titre: `Fin du mandat — mention ${mention}`,
      texte: `Six ans (de jeu) plus tard : ${fmtNb(S.population)} habitants (${croissance >= 0 ? '+' : ''}${croissance.toFixed(1)} %), ${S.equipements.length} équipement(s) construit(s), ${S.crisesGerees} crise(s) bien gérée(s). Score : ${score}. ${note}`,
      score, mention,
    };
  }

  /* ---------- Projections (§8 — la pièce maîtresse) ---------- */

  function projeter({ coutImmediat = 0, deltaMensuel = 0, gainImmediat = 0 }) {
    const soldeAvant = soldeMensuel();
    const soldeApres = soldeAvant + deltaMensuel;
    const tresoAvant = S.tresorerie;
    const tresoApres = tresoAvant - coutImmediat + gainImmediat + soldeApres;
    const depApres = depensesMensuelles() + Math.max(0, -deltaMensuel);
    return {
      soldeAvant, soldeApres,
      tresoAvant: Math.round(tresoAvant), tresoApres: Math.round(tresoApres),
      joursAvant: joursDeTresorerie(),
      joursApres: tresoApres / (depApres / 30),
    };
  }

  function projeterConstruction(equipId) {
    const def = defEquip(equipId);
    const delta = -(def.entretien + def.energie) + def.recettes;
    return { def, cout: def.cout, ...projeter({ coutImmediat: def.cout, deltaMensuel: delta }) };
  }

  function projeterTaux(nouveau) {
    const fiscAvant = recettes().fiscalite;
    const fiscApres = Math.round(S.population * CFG.VALEUR_LOCATIVE * (nouveau / 100) / 12 * (S.exonerationMois > 0 ? 0.95 : 1));
    const dPop = penalitePopularite(S.taux) - penalitePopularite(nouveau);
    // pression migratoire projetée avec le nouveau taux
    const diag = calculerMigration().diagnostic;
    const dFiscalApres = Math.max(0, nouveau - 18) * 0.25;
    const aFiscalApres = Math.max(0, 12 - nouveau) * 0.15;
    const soldePctApres = clamp(diag.arrivee - diag.aFiscal + aFiscalApres - (diag.depart - diag.fiscalite + dFiscalApres),
      -CFG.MIGRATION_CLAMP, CFG.MIGRATION_CLAMP);
    return {
      fiscAvant, fiscApres, dPop,
      migAvant: Math.round(S.population * diag.soldePct / 100),
      migApres: Math.round(S.population * soldePctApres / 100),
      ...projeter({ deltaMensuel: fiscApres - fiscAvant }),
    };
  }

  function projeterEmprunt(capital, duree) {
    const c = conditionsEmprunt();
    const m = mensualite(capital, c.taux, duree);
    return { taux: c.taux, mensualite: m, ...projeter({ gainImmediat: capital, deltaMensuel: -m }) };
  }

  /* ---------- Journal & format ---------- */

  function log(txt) {
    S.journal.unshift({ jour: S.jour, mois: S.mois, txt });
    if (S.journal.length > 200) S.journal.pop();
  }

  function fmtEuro(v) {
    return Math.round(v).toLocaleString('fr-FR') + ' €';
  }
  function fmtNb(v) { return Math.round(v).toLocaleString('fr-FR'); }

  /* ---------- Sauvegarde ---------- */

  const SAVE_KEY = 'bigcity_save_v1';
  function sauvegarder() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } }
  function charger() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      S = JSON.parse(raw);
      return S;
    } catch (e) { return null; }
  }
  function effacerSauvegarde() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; }

  function evenementDu() {
    // premier événement différé à choix arrivé à échéance
    return S.effetsDifferes.find(e => e.evenement && e.jour <= S.jour) || null;
  }

  function resoudreEvenement(evt, indexOption) {
    const def = EVENEMENTS_DIFFERES[evt.evenement];
    const opt = def.options[indexOption];
    appliquerEffets(opt.effets, def.titre);
    S.effetsDifferes = S.effetsDifferes.filter(e => e !== evt);
    log(`📜 ${def.titre} — ${opt.libelle}. ${opt.note}`);
  }

  return {
    get etat() { return S; },
    nouvellePartie, charger, sauvegarder, effacerSauvegarde,
    avancerJour, reporterCrise,
    changerTaux, construire, peutConstruire,
    reglerEntretien, coutEntretien, NIVEAUX_ENTRETIEN,
    emprunter, conditionsEmprunt, mensualite, aideEtat,
    accepterOffre, refuserOffre, resoudreCrise, evenementDu, resoudreEvenement,
    resoudreQuestion,
    faireMissionRedressement, missionRedressementDispo, joursRedressementRestants,
    recettes, depenses, totalRecettes, depensesMensuelles, soldeMensuel,
    joursDeTresorerie, tauxEndettement, encoursDette, recettesAnnuelles,
    cadreDeVie, saturation, capaciteEquipements, capaciteInvestissement, reserveFonctionnement,
    projeterConstruction, projeterTaux, projeterEmprunt, penalitePopularite,
    calculerMigration, moisCalendaire, saison, annee, defEquip,
    fmtEuro, fmtNb,
  };
})();
