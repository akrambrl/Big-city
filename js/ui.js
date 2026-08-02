/* ============================================================
   BIG CITY — Interface « app »
   Header : note de la ville, argent, population, notifications.
   Barre du bas : Carte · Courrier · Construire · Business.
   Pilule flottante pour avancer le temps.
   ============================================================ */

const UI = (() => {
  const app = () => document.getElementById('app');
  const modalRoot = () => document.getElementById('modal-root');
  const E = Engine;
  let vueActive = 'carte';
  let notifsOuvertes = false;
  let questionEnAttente = false; // « Plus tard » : la question reste due, mais on peut naviguer
  let dernierNiveauVu = null;    // détection des passages de niveau
  let communeSuivie = null;
  let finJouee = false;

  /* Gaston, l'adjoint : une bulle par-dessus les grands moments */
  function bulleAdjoint(type) {
    const phrases = PHRASES_ADJOINT[type] || PHRASES_ADJOINT.courrier;
    const p = phrases[Math.floor(Math.random() * phrases.length)];
    return `<div class="adjoint"><span class="adjoint-avatar">${ADJOINT.icone}</span>
      <div class="adjoint-bulle"><b>${ADJOINT.nom}</b> — ${p}</div></div>`;
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = E.fmtEuro, nb = E.fmtNb;
  const signe = (v, fmt = eur) => (v >= 0 ? '+' : '−') + fmt(Math.abs(v));
  const eurCourt = (v) => {
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' M€';
    if (a >= 1e4) return Math.round(v / 1000).toLocaleString('fr-FR') + ' k€';
    return Math.round(v).toLocaleString('fr-FR') + ' €';
  };

  /* ================= ÉCRAN D'ACCUEIL ================= */

  /* Le décor est celui de la vraie ville : littoral si la commune est
     au bord de la mer, campagne en dessous de 3 500 habitants. */
  function ambianceDeLaVille(v) {
    if (v.littoral) return 'touristique';
    if (v.pop < 3500) return 'rurale';
    return 'moyenne';
  }
  const NOMS_AMBIANCE = { rurale: '🌾 commune rurale', moyenne: '🏘️ ville', touristique: '⛱️ commune littorale' };

  function ecranAccueil() {
    let villeChoisie = null;
    let ambiance = 'moyenne';
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">Deviens maire · De ta vraie ville</p>
      <h1>Big <span class="filet">City</span></h1>
      <p class="sous-titre">Les ${COMMUNES_FR.nombre.toLocaleString('fr-FR')} communes de France t'attendent — la tienne aussi.
      Chaque bâtiment coûte pour toujours, chaque aide se paie un jour. Tu étais prévenu.</p>
      <div class="recherche-bloc">
        <input type="search" id="recherche-ville" placeholder="🔎 Cherche ta ville… (Lyon, Guingamp, Aubervilliers…)"
          autocomplete="off" spellcheck="false">
        <div id="resultats-villes" class="resultats" role="listbox"></div>
        <button id="ville-hasard" class="btn-lien">🎲 Une commune au hasard</button>
      </div>
      <div id="etape-ambiance" class="etape-ambiance" hidden>
        <p class="ville-choisie" id="ville-choisie-txt"></p>
        <div class="profils" id="apercu-ville"></div>
        <p class="note" id="note-decor"></p>
        <label class="tranquille"><input type="checkbox" id="mode-tranquille">
          Mode chill — impossible de perdre (les alertes restent)</label>
        <p style="margin-top:1em"><button class="btn btn-grand" id="btn-demarrer"></button></p>
      </div>
    </div>`;

    const champ = document.getElementById('recherche-ville');
    const resultats = document.getElementById('resultats-villes');
    const etape = document.getElementById('etape-ambiance');

    function afficherResultats() {
      const villes = COMMUNES_FR.chercher(champ.value);
      resultats.innerHTML = villes.map((v, i) =>
        `<button class="resultat-ville" data-i="${i}" role="option">
          <b>${esc(v.nom)}</b> <span class="badge">${esc(v.dept)}</span>
          <span class="resultat-pop">${nb(v.pop)} hab.</span>
        </button>`).join('');
      resultats.querySelectorAll('.resultat-ville').forEach(b =>
        b.addEventListener('click', () => choisir(villes[parseInt(b.dataset.i, 10)])));
    }
    champ.addEventListener('input', afficherResultats);
    document.getElementById('ville-hasard').addEventListener('click', () => choisir(COMMUNES_FR.auHasard()));

    function choisir(v) {
      villeChoisie = v;
      ambiance = ambianceDeLaVille(v);
      champ.value = `${v.nom} (${v.dept})`;
      resultats.innerHTML = '';
      etape.hidden = false;
      document.getElementById('ville-choisie-txt').innerHTML =
        `🏛️ <b>${esc(v.nom)}</b> (${esc(v.dept)}) — ${nb(v.pop)} habitants, et bientôt un maire.`;
      const de = /^[aeiouyhéèêàâîôû]/i.test(v.nom) ? 'd\'' : 'de ';
      document.getElementById('btn-demarrer').textContent = `Devenir maire ${de}${v.nom}`;
      document.getElementById('note-decor').textContent =
        `Décor : ${NOMS_AMBIANCE[ambiance]} — carte stylisée générée pour ${v.nom}, pas un plan réel.`;
      const apercu = document.getElementById('apercu-ville');
      apercu.innerHTML = `
        <div class="carte-profil ambiance choisie apercu-seul">
          <canvas class="mini-carte" id="mini-carte-ville"></canvas>
          <span class="profil-label">${NOMS_AMBIANCE[ambiance]}</span>
        </div>`;
      CarteCommune.dessiner(document.getElementById('mini-carte-ville'), {
        commune: v.nom, profil: ambiance, mois: 1, equipements: [],
        population: v.pop, populationInitiale: v.pop, cadre: { voirie: 70 },
      });
      etape.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    document.getElementById('btn-demarrer').addEventListener('click', () => {
      if (!villeChoisie) return;
      E.nouvellePartie(ambiance, document.getElementById('mode-tranquille').checked, {
        nom: villeChoisie.nom, dept: villeChoisie.dept, pop: villeChoisie.pop,
        voisines: COMMUNES_FR.voisines(villeChoisie.dept, villeChoisie.nom, 7),
      });
      E.sauvegarder();
      vueActive = 'carte';
      FX.son('niveau');
      rendre();
      modaleIntro();
    });
  }

  /* ================= RENDU PRINCIPAL ================= */

  function rendre() {
    const S = E.etat;
    if (!S) return ecranAccueil();
    const note = E.noteVille();
    const nonLues = E.notifsNonLues();
    const sur5 = (note.note / 20).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const clNote = note.note >= 60 ? 'bonne' : note.note >= 40 ? 'moyenne' : 'mauvaise';

    /* passage de niveau : fanfare et confettis */
    if (communeSuivie !== S.commune) { communeSuivie = S.commune; dernierNiveauVu = S.niveau; finJouee = false; }
    if (dernierNiveauVu !== null && S.niveau > dernierNiveauVu) {
      FX.son('niveau');
      FX.confettis(['⭐', '🎉', '✨']);
      toast(`⭐ Niveau ${S.niveau} — te voilà « ${E.titreMaire()} » !`);
    }
    dernierNiveauVu = S.niveau;

    app().innerHTML = `
    <div class="coque">
      <header class="barre-haut">
        <button id="btn-note" class="badge-note ${clNote}" title="La note de ta ville — touche pour le détail">
          <span class="note-etoile">⭐</span><span class="note-val">${sur5}</span><span class="note-max">/5</span>
        </button>
        <div class="titre-app">
          <span class="nom-ville">${esc(S.commune)}</span>
          <span class="date-app">${NOMS_MOIS[E.moisCalendaire()]} · j${S.jourDuMois} · an ${E.annee()} · niv ${S.niveau}${S.tranquille ? ' · 🕊️' : ''}</span>
        </div>
        <div class="chips-haut">
          <span class="chip-ressource ${S.tresorerie < 0 ? 'alerte' : ''}" title="Trésorerie">💰 ${eurCourt(S.tresorerie)}</span>
          <span class="chip-ressource" title="Population">👥 ${nb(S.population)}</span>
          <button id="btn-son" class="btn-cloche" title="${FX.muet ? 'Réactiver le son' : 'Couper le son'}">${FX.muet ? '🔇' : '🔊'}</button>
          <button id="btn-notifs" class="btn-cloche" title="Notifications">🔔${nonLues ? `<span class="pastille">${nonLues}</span>` : ''}</button>
        </div>
      </header>
      ${htmlStripAlerte(S)}
      <main class="vue vue-${vueActive}">${htmlVue(S)}</main>
      <div class="pilule-temps">
        <button id="btn-jour" class="btn-temps">▶ +1 jour</button>
        <button id="btn-semaine" class="btn-temps">⏩ +7</button>
      </div>
      <nav class="barre-bas">
        ${[['carte', '🗺️', 'Carte'], ['courrier', '📬', 'Courrier'], ['construire', '🏗️', 'Construire'], ['business', '💼', 'Business']]
          .map(([id, ic, lbl]) => `<button class="nav-btn ${vueActive === id ? 'actif' : ''}" data-vue="${id}">
            <span class="nav-ic">${ic}${id === 'courrier' && S.questionActive ? '<span class="pastille">1</span>' : ''}</span>
            <span class="nav-lbl">${lbl}</span></button>`).join('')}
      </nav>
      ${notifsOuvertes ? htmlPanneauNotifs(S) : ''}
    </div>`;

    app().querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => {
      vueActive = b.dataset.vue; notifsOuvertes = false; rendre();
    }));
    const carte = document.getElementById('carte');
    if (carte) {
      const placerMarqueur = () => {
        const m = document.getElementById('btn-crise-carte');
        if (!m || !S.criseActive) return;
        const p = CarteCommune.versEcranPct(CarteCommune.posCrise(S.criseActive.criseId, S.profil));
        m.style.left = p.x.toFixed(1) + '%';
        m.style.top = p.y.toFixed(1) + '%';
        m.style.display = p.visible ? '' : 'none';
      };
      CarteCommune.attacher(carte, S, placerMarqueur);
      CarteCommune.dessiner(carte, S);
    }
    brancherEvenements(S);
    afficherModalesAutomatiques(S);
  }

  let minuteurRedim = null;
  window.addEventListener('resize', () => {
    clearTimeout(minuteurRedim);
    minuteurRedim = setTimeout(() => {
      const carte = document.getElementById('carte');
      if (carte && E.etat) CarteCommune.dessiner(carte, E.etat);
    }, 150);
  });

  const EMOJI_SAISON = { hiver: '❄️', printemps: '🌱', ete: '☀️', automne: '🍂' };

  /* Bandeau fin sous le header : uniquement l'urgent */
  function htmlStripAlerte(S) {
    const morceaux = [];
    if (S.criseActive) {
      const c = CRISES.find(x => x.id === S.criseActive.criseId);
      morceaux.push(`<span>🚨 ${c.nom} — ${eurCourt(S.criseActive.coutCourant)}</span><button id="btn-crise" class="btn-mini">Décider</button>`);
    }
    if (S.paliers.fin === 'redressement') {
      morceaux.push(`<span>🟥 Redressement : ${E.joursRedressementRestants()} j restants</span>
        ${E.missionRedressementDispo() ? `<button id="btn-mission" class="btn-mini">🗂️ Mission (+${eurCourt(E.montantMission())})</button>` : '<span class="fait">✓</span>'}`);
    } else if (S.paliers.fin === 'alerte') {
      morceaux.push(`<span>🟧 Caisse basse (${Math.max(0, Math.round(E.joursDeTresorerie()))} j)</span>`);
    }
    if (S.paliers.demo !== 'ok') {
      morceaux.push(`<span>${S.paliers.demo === 'declin' ? '🟥 Exode' : '🟧 Départs'}</span><button id="btn-diag" class="btn-mini">Pourquoi ?</button>`);
    }
    return morceaux.length ? `<div class="strip-alerte">${morceaux.map(m => `<span class="strip-item">${m}</span>`).join('')}</div>` : '';
  }

  /* ================= VUES ================= */

  function htmlVue(S) {
    switch (vueActive) {
      case 'carte': return htmlVueCarte(S);
      case 'courrier': return htmlVueCourrier(S);
      case 'construire': return htmlVueConstruire(S);
      case 'business': return htmlVueBusiness(S);
      case 'note': return htmlVueNote(S);
    }
  }

  /* ---- 🗺️ Carte ---- */

  function htmlVueCarte(S) {
    const saison = E.saison();
    const crise = S.criseActive ? CRISES.find(x => x.id === S.criseActive.criseId) : null;
    const posC = crise ? CarteCommune.posCrise(crise.id, S.profil) : null;
    return `
    <div class="carte-monde pleine">
      <canvas id="carte" role="img" aria-label="Plan de la commune de ${esc(S.commune)}"></canvas>
      <span class="chip-carte">${EMOJI_SAISON[saison]} ${saison === 'ete' ? 'été' : saison}</span>
      <div class="cartouche">
        <div class="surcart">Commune de</div>
        <div class="nomcart">${esc(S.commune)}</div>
        <div class="echelle">500 m</div>
      </div>
      <div class="zoom-controles">
        <button id="zoom-plus" class="btn-zoom" title="Zoomer">+</button>
        <button id="zoom-moins" class="btn-zoom" title="Dézoomer — découvre les villes voisines">−</button>
        <button id="zoom-reset" class="btn-zoom" title="Recentrer sur ta commune">⌖</button>
      </div>
      <span class="chip-aide">🖐️ glisse · 🔍 zoome · dézoome pour voir les villes voisines</span>
      ${crise ? `<button class="marqueur-crise" id="btn-crise-carte" title="${crise.nom} — touche pour décider"
        style="left:${(posC.x * 100).toFixed(1)}%;top:${(posC.y * 100).toFixed(1)}%">${crise.icone}</button>` : ''}
    </div>`;
  }

  /* ---- 📬 Courrier ---- */

  function htmlVueCourrier(S) {
    const q = S.questionActive ? QUESTIONS.find(x => x.id === S.questionActive) : null;
    return `
    <div class="defilable">
      ${q ? `
      <section class="carte courrier-actif">
        <h2>📬 Nouveau courrier</h2>
        <p class="crise-texte">${q.icone} ${q.texte}</p>
        <button class="btn" id="btn-repondre">Répondre</button>
      </section>` : `
      <section class="carte">
        <h2>📬 Boîte aux lettres</h2>
        <p class="note">Rien à signer pour l'instant. Avance les jours, le courrier arrive tout seul — et il n'attend jamais longtemps.</p>
      </section>`}
      ${S.historiqueQuestions.length ? `
      <section class="carte">
        <h2>Tes dernières décisions</h2>
        <ul class="liste-decisions">
          ${S.historiqueQuestions.map(h => `<li><span class="jour-tag">J${h.jour}</span> ${h.icone} <b>${h.libelle}</b><br><span class="decision-note">${h.note}</span></li>`).join('')}
        </ul>
      </section>` : ''}
    </div>`;
  }

  /* ---- 🏗️ Construire ---- */

  function htmlVueConstruire(S) {
    return `
    <div class="defilable">
      <p class="avert">⚠️ <b>Chaque bâtiment coûte tous les mois, pour toujours.</b> Tu verras la projection avant de valider.</p>
      <div class="grille-cartes">
        ${EQUIPEMENTS.map(def => {
          const test = E.peutConstruire(def);
          const dim = E.dimEquip(def);
          const charge = dim.entretien + dim.energie - dim.recettes;
          const dejaN = S.equipements.filter(e => e.type === def.id).length;
          return `<div class="carte equip ${test.ok ? '' : 'grise'}">
            <h3>${def.icone} ${def.nom} ${dejaN ? `<span class="badge">×${dejaN}</span>` : ''}</h3>
            <p class="equip-desc">${def.desc}</p>
            <div class="equip-chiffres">
              <span>💰 <b>${eur(dim.cout)}</b></span>
              <span>${charge > 0 ? '📉' : '📈'} <b class="${charge > 0 ? 'texte-rouge' : 'texte-vert'}">${charge >= 0 ? '−' : '+'}${eur(Math.abs(charge))}/mois</b></span>
              ${dim.capacite ? `<span>👥 +${nb(dim.capacite)}</span>` : ''}
              ${def.effets.attractivite ? `<span>✨ +${def.effets.attractivite}</span>` : ''}
              ${def.effets.popularite ? `<span>❤️ +${def.effets.popularite}</span>` : ''}
            </div>
            <div class="equip-actions">
              <button class="btn btn-construire" data-equip="${def.id}" ${test.ok ? '' : 'disabled'}>Construire</button>
            </div>
            ${!test.ok ? `<p class="note-inline">${test.msg}</p>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  /* ---- 💼 Business ---- */

  function htmlVueBusiness(S) {
    const r = E.recettes(), d = E.depenses();
    const rec = r.fiscalite + r.dotation + r.services;
    const dep = d.personnel + d.energie + d.entretien + d.dette;
    const solde = rec - dep;
    const c = E.conditionsEmprunt();
    const chargesEquip = S.equipements.map(e => {
      const def = E.defEquip(e.type);
      const dim = E.dimEquip(def);
      return [def, dim.entretien + dim.energie - dim.recettes];
    }).filter(([, net]) => net !== 0);
    const presetsEmprunt = [
      ['Petit', arrondi50k(S.population * 40)],
      ['Moyen', arrondi50k(S.population * 80)],
      ['Gros', arrondi50k(S.population * 160)],
    ];
    return `
    <div class="defilable">
      <section class="carte">
        <h2>📊 Le budget, en bref</h2>
        <table class="table-budget">
          <tr><td>Ce qui rentre</td><td class="mont texte-vert">+${eur(rec)}</td></tr>
          <tr><td>Ce qui sort</td><td class="mont texte-rouge">−${eur(dep)}</td></tr>
          <tr class="total ${solde < 0 ? 'texte-rouge' : ''}"><td>Chaque mois</td><td class="mont">${signe(solde)}</td></tr>
        </table>
        <details class="details-budget">
          <summary>Voir le détail</summary>
          <table class="table-budget">
            <tr class="entete-table"><td>Recettes</td><td></td></tr>
            <tr><td>Impôts locaux (${S.taux} %${S.exonerationMois ? ', exonération en cours' : ''})</td><td class="mont">${eur(r.fiscalite)}</td></tr>
            <tr><td>Dotation de l'État</td><td class="mont">${eur(r.dotation)}</td></tr>
            <tr><td>Services (parking, marché…)</td><td class="mont">${eur(r.services)}</td></tr>
            <tr class="entete-table"><td>Dépenses</td><td></td></tr>
            <tr><td>Personnel municipal</td><td class="mont">−${eur(d.personnel)}</td></tr>
            <tr><td>Énergie</td><td class="mont">−${eur(d.energie)}</td></tr>
            <tr><td>Entretien</td><td class="mont">−${eur(d.entretien)}</td></tr>
            <tr><td>Remboursements</td><td class="mont">−${eur(d.dette)}</td></tr>
            ${chargesEquip.length ? `<tr class="entete-table"><td>Dont tes constructions (à vie)</td><td></td></tr>
              ${chargesEquip.map(([def, net]) => `<tr><td>${def.icone} ${def.nom}</td><td class="mont">${net > 0 ? '−' : '+'}${eur(Math.abs(net))}</td></tr>`).join('')}` : ''}
          </table>
        </details>
        <p class="note-inline">Dispo pour construire : ${eur(E.capaciteInvestissement())} (15 jours de caisse gardés de côté).</p>
      </section>
      <section class="carte">
        <h2>💶 Impôts locaux</h2>
        <p class="note">Ton levier principal. Une fois par mois, effet le mois d'après.</p>
        <div class="ligne-taux">
          <input type="range" id="slider-taux" min="${CFG.TAUX_MIN}" max="${CFG.TAUX_MAX}" step="1"
            value="${S.tauxProchain ?? S.taux}" ${S.tauxChangeCeMois ? 'disabled' : ''}>
          <span id="taux-affiche" class="taux-val">${S.tauxProchain ?? S.taux} %</span>
        </div>
        <div id="apercu-taux" class="apercu"></div>
        <button class="btn" id="btn-taux" ${S.tauxChangeCeMois ? 'disabled' : ''}>
          ${S.tauxChangeCeMois ? (S.tauxProchain !== null ? `Voté : ${S.tauxProchain} % au mois prochain` : 'Déjà modifié ce mois-ci') : 'Voter ce taux'}
        </button>
      </section>
      <section class="carte">
        <h2>🧹 Entretien de la ville</h2>
        <div class="presets">
          ${Object.entries(E.NIVEAUX_ENTRETIEN).map(([id, n]) => `
            <button class="preset btn-entretien ${S.niveauEntretien === id ? 'actif' : ''}" data-niveau="${id}">
              <span class="preset-nom">${n.nom}</span>
              <span class="preset-detail">${eur(coutNiveau(S, n.facteur))}/mois</span>
              <span class="preset-note">${id === 'eco' ? 'la ville se dégrade doucement' : id === 'normal' ? 'ça tient la route' : 'propre et nickel'}</span>
            </button>`).join('')}
        </div>
      </section>
      <section class="carte">
        <h2>🏦 Emprunter</h2>
        ${c.bloque ? '<p class="avert">Emprunt indisponible (dette trop élevée ou plan de redressement).</p>' : `
        <p class="note">L'argent tout de suite, une mensualité pour 5 ans. Taux : ${(c.taux * 100).toFixed(1)} %.</p>
        <div class="presets">
          ${presetsEmprunt.map(([lbl, cap]) => {
            const possible = cap <= c.capaciteMax;
            return `<button class="preset btn-emprunt" data-capital="${cap}" ${possible ? '' : 'disabled'}>
              <span class="preset-nom">${lbl}</span>
              <span class="preset-detail">${eur(cap)}</span>
              <span class="preset-note">−${eur(E.mensualite(cap, c.taux, 60))}/mois × 60</span>
            </button>`;
          }).join('')}
        </div>`}
        ${S.emprunts.length ? `<h3>En cours</h3><table class="table-budget">${S.emprunts.map(e =>
          `<tr><td>${eur(e.capital)} · reste ${e.moisRestants} mois</td><td class="mont">−${eur(e.mensualite)}/mois</td></tr>`).join('')}</table>` : ''}
      </section>
      <section class="carte">
        <h2>🏛️ Aides de l'État</h2>
        <div class="composante"><span class="comp-nom">Capital préfecture</span>
          <div class="barre grande"><div class="barre-rempli pref" style="width:${Math.round(S.capitalPrefecture)}%"></div></div>
          <span class="comp-val">${Math.round(S.capitalPrefecture)}</span></div>
        <p class="note">Ça se recharge tout seul (+${CFG.CAPITAL_PREF_REGEN}/mois). Gaspille-le, et la préfecture ne répondra plus le jour du feu de forêt.</p>
        ${AIDES_ETAT.map(a => `
          <div class="ligne-aide">
            <div><b>${a.nom}</b> <span class="badge">−${a.capital} capital</span><br><span class="note-inline">${a.desc}</span></div>
            <button class="btn btn-aide" data-aide="${a.id}" ${S.capitalPrefecture < a.capital ? 'disabled' : ''}>Demander</button>
          </div>`).join('')}
      </section>
      <section class="carte">
        <h2>💼 Offres privées</h2>
        ${S.offresEnCours.length ? S.offresEnCours.map(oe => {
          const o = OFFRES_PRIVEES.find(x => x.id === oe.id);
          return `<div class="offre">
            <p><b>${o.icone} ${o.nom}</b> — ${o.texte}</p>
            <p>💰 <b>${eur(E.montantOffre(o))}</b> tout de suite · 🎁 contrepartie surprise dans <b>${o.delai} jours</b></p>
            <button class="btn btn-offre-oui" data-offre="${o.id}">Prendre l'argent</button>
            <button class="btn-lien btn-offre-non" data-offre="${o.id}">Décliner</button>
          </div>`;
        }).join('') : '<p class="note">Rien pour l\'instant. Les mécènes ont un flair certain pour les mairies fauchées — ils reviendront.</p>'}
        ${S.effetsDifferes.filter(e => e.evenement).length ? `<h3>Ce que tu dois encore…</h3>
          <ul class="liste-simple">${S.effetsDifferes.filter(e => e.evenement).map(e =>
            `<li>⏳ ${esc(e.source || 'Contrepartie')} — dans ${e.jour - S.jour} jour(s)</li>`).join('')}</ul>` : ''}
      </section>
    </div>`;
  }

  function coutNiveau(S, facteur) {
    return Math.round(S.population * COEF.VOIRIE_PLEIN * facteur) + Math.round(S.population * 1.0 * facteur);
  }
  function arrondi50k(v) { return Math.max(20000, Math.round(v / 10000) * 10000); }

  /* ---- 🏅 Note de la ville (via le badge du header) ---- */

  function htmlVueNote(S) {
    const note = E.noteVille();
    const solde = E.soldeMensuel();
    const jours = E.joursDeTresorerie();
    const dette = E.tauxEndettement() * 100;
    const compo = [
      ['💰 Finances', note.composantes.finances, 'jours de caisse et dette'],
      ['❤️ Popularité', note.composantes.popularite, 'ce que pensent les habitants'],
      ['✨ Attractivité', note.composantes.attractivite, 'ce qui fait venir'],
      ['🌳 Cadre de vie', note.composantes.cadre, 'ce qui fait rester'],
    ];
    const etoiles = Math.round(note.note / 20);
    return `
    <div class="defilable">
      <section class="carte">
        <h2>⭐ Niveau ${S.niveau} — ${E.titreMaire()}</h2>
        <div class="composante"><span class="comp-nom">Progression</span>
          <div class="barre grande"><div class="barre-rempli pref" style="width:${Math.round(S.xp / E.xpPourNiveau(S.niveau) * 100)}%"></div></div>
          <span class="comp-val">${S.xp}/${E.xpPourNiveau(S.niveau)}</span></div>
        <p class="note">Réponds au courrier, gère les crises, construis, boucle les mois : tout rapporte de l'XP.</p>
      </section>
      <section class="carte">
        <h2>🏅 La note de ta ville : <span class="etoiles">${'★'.repeat(etoiles)}${'☆'.repeat(5 - etoiles)}</span></h2>
        <div class="composantes">
          ${compo.map(([n, v, aide]) => `<div class="composante" title="${aide}">
            <span class="comp-nom">${n}</span>
            <div class="barre grande"><div class="barre-rempli ${v < 40 ? 'basse' : ''}" style="width:${Math.round(v)}%"></div></div>
            <span class="comp-val">${Math.round(v)}</span></div>`).join('')}
        </div>
      </section>
      <section class="carte">
        <h2>Les trois chiffres qui comptent</h2>
        <div class="ratios">
          ${ratio('Gagné / mois', signe(solde), solde < 0)}
          ${ratio('Jours de caisse', S.tresorerie < 0 ? '—' : Math.round(jours) + ' j', jours < 15)}
          ${ratio('Dette', dette.toFixed(0) + ' %', dette > 100)}
        </div>
        <p style="margin-top:.8em"><button class="btn" id="btn-diag2">🔎 Pourquoi les gens partent ?</button></p>
      </section>
      <section class="carte">
        <h2>Trésorerie</h2>
        ${graphique(S.historique.map(h => h.tresorerie), '#3F97DB', v => eur(v), S.tresorerie)}
      </section>
      <section class="carte">
        <h2>Population</h2>
        ${graphique(S.historique.map(h => h.populationFin), '#62B857', v => nb(v) + ' hab.', S.population)}
      </section>
      <section class="carte">
        <h2>Cadre de vie — le détail</h2>
        ${composantesCadre(S)}
      </section>
      <section class="carte">
        <h2>⚙️ Partie</h2>
        <p class="note">Mandat : mois ${Math.min(S.mois, CFG.MANDAT_MOIS)}/${CFG.MANDAT_MOIS}${S.tranquille ? ' · mode chill 🕊️' : ''}.</p>
        <button class="btn-lien" id="btn-nouvelle">Abandonner et recommencer</button>
      </section>
    </div>`;
  }

  function ratio(nom, val, alerte) {
    return `<div class="ratio ${alerte ? 'alerte' : ''}">
      <span class="ratio-val">${val}</span><span class="ratio-nom">${nom}</span></div>`;
  }

  function composantesCadre(S) {
    const comp = [
      ['💡 Éclairage', S.cadre.eclairage], ['🛣️ Voirie', S.cadre.voirie],
      ['🧹 Propreté', S.cadre.proprete], ['🏠 Logement', S.cadre.logement],
      ['🏪 Commerces & services', S.cadre.proximite],
    ];
    return `<div class="composantes">${comp.map(([n, v]) => `
      <div class="composante"><span class="comp-nom">${n}</span>
        <div class="barre grande"><div class="barre-rempli ${v < 40 ? 'basse' : ''}" style="width:${Math.round(v)}%"></div></div>
        <span class="comp-val">${Math.round(v)}</span></div>`).join('')}</div>`;
  }

  function graphique(valeurs, couleur, fmt, valActuelle) {
    if (valeurs.length < 2) return `<p class="note">Valeur actuelle : <b>${fmt(valActuelle)}</b> — la courbe se dessine à partir du 2ᵉ mois.</p>`;
    const W = 420, H = 120, P = 6;
    const min = Math.min(...valeurs, 0), max = Math.max(...valeurs);
    const y = v => H - P - (max === min ? 0.5 : (v - min) / (max - min)) * (H - 2 * P);
    const x = i => P + i * (W - 2 * P) / (valeurs.length - 1);
    const pts = valeurs.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const zeroY = min < 0 ? y(0) : null;
    const der = valeurs[valeurs.length - 1];
    const baseY = (H - P).toFixed(1);
    return `<svg viewBox="0 0 ${W} ${H}" class="graph" role="img" aria-label="Évolution : dernière valeur ${fmt(der)}">
      <polygon points="${x(0).toFixed(1)},${baseY} ${pts} ${x(valeurs.length - 1).toFixed(1)},${baseY}" fill="${couleur}" opacity="0.15"/>
      ${zeroY !== null ? `<line x1="${P}" x2="${W - P}" y1="${zeroY}" y2="${zeroY}" class="graph-zero"/>` : ''}
      <polyline points="${pts}" fill="none" stroke="${couleur}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="${x(valeurs.length - 1)}" cy="${y(der)}" r="4" fill="${couleur}"/>
    </svg>
    <p class="graph-legende">Fin du mois dernier : <b>${fmt(der)}</b> · ${valeurs.length} mois</p>`;
  }

  /* ---- 🔔 Panneau de notifications ---- */

  function htmlPanneauNotifs(S) {
    return `
    <div class="voile-notifs" id="voile-notifs">
      <aside class="panneau-notifs">
        <div class="panneau-tete">
          <h2>🔔 Notifications</h2>
          <button class="btn-lien" id="fermer-notifs">Fermer</button>
        </div>
        <ul class="liste-notifs">
          ${S.notifications.length ? S.notifications.map((n, i) => `
            <li class="notif ${n.type === 'alerte' ? 'alerte' : ''} ${n.lu ? '' : 'non-lue'}">
              <span class="notif-ic">${n.icone}</span>
              <span class="notif-texte">${n.texte}<br><span class="jour-tag">J${n.jour}</span></span>
              ${n.action ? `<button class="btn-mini btn-notif-action" data-action="${n.action}">Voir</button>` : ''}
            </li>`).join('') : '<li class="notif"><span class="notif-texte">Rien pour l\'instant. Profite du calme, il ne durera pas.</span></li>'}
        </ul>
      </aside>
    </div>`;
  }

  /* ================= MODALES ================= */

  function modale(html, options = {}) {
    modalRoot().innerHTML = `<div class="voile ${options.bloquant ? 'bloquant' : ''}"><div class="modale">${html}</div></div>`;
    if (!options.bloquant) {
      modalRoot().querySelector('.voile').addEventListener('click', (e) => { if (e.target.classList.contains('voile')) fermerModale(); });
    }
  }
  function fermerModale() { modalRoot().innerHTML = ''; }

  function toast(txt) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = txt;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('visible'), 20);
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 400); }, 3600);
  }

  function modaleIntro() {
    const S = E.etat;
    modale(`
      <div class="adjoint"><span class="adjoint-avatar">${ADJOINT.icone}</span>
        <div class="adjoint-bulle"><b>${ADJOINT.nom}</b>, ton adjoint — « Bienvenue patron ! Je m'occupe de la paperasse, toi des décisions. Quatre trucs à savoir : »</div></div>
      <ul class="regles">
        <li>🏗️ <b>Construis</b> pour attirer des habitants — mais chaque bâtiment coûte <b>tous les mois, pour toujours</b>.</li>
        <li>💰 <b>Garde de l'avance</b> : sous 15 jours de caisse, alerte. En négatif, 30 jours pour te rattraper.</li>
        <li>👥 <b>Retiens tes habitants</b> : si 15 % s'en vont, tu perds la ville.</li>
        <li>🔔 <b>Surveille les notifs</b> : courrier, crises, alertes — tout arrive là-haut, à la cloche.</li>
      </ul>
      <div class="modale-boutons"><button class="btn" id="btn-intro-ok">C'est parti !</button></div>`, { bloquant: true });
    document.getElementById('btn-intro-ok').addEventListener('click', fermerModale);
  }

  function modaleProjection({ titre, lignesFixes = [], proj, effets = [], onConfirme, libelleOk = 'Valider' }) {
    const fJours = v => isFinite(v) ? Math.max(0, Math.round(v)) + ' j' : '—';
    modale(`
      <h2>${titre}</h2>
      <table class="table-projection">
        ${lignesFixes.map(([n, v]) => `<tr><td>${n}</td><td class="mont" colspan="3">${v}</td></tr>`).join('')}
        <tr class="entete-table"><td>Dans 30 jours</td><td class="mont">avant</td><td></td><td class="mont">après</td></tr>
        <tr><td>Gagné / mois</td><td class="mont">${signe(proj.soldeAvant)}</td><td class="fleche">→</td>
          <td class="mont ${proj.soldeApres < 0 ? 'texte-rouge' : ''}">${signe(proj.soldeApres)}</td></tr>
        <tr><td>Trésorerie</td><td class="mont">${eur(proj.tresoAvant)}</td><td class="fleche">→</td>
          <td class="mont ${proj.tresoApres < 0 ? 'texte-rouge' : ''}">${eur(proj.tresoApres)}</td></tr>
        <tr><td>Jours de caisse</td><td class="mont">${fJours(proj.joursAvant)}</td><td class="fleche">→</td>
          <td class="mont ${proj.joursApres < 15 ? 'texte-rouge' : ''}">${fJours(proj.joursApres)}</td></tr>
      </table>
      ${effets.length ? `<ul class="liste-effets">${effets.map(e => `<li>▸ ${e}</li>`).join('')}</ul>` : ''}
      ${proj.tresoApres < 0 ? '<p class="avert">⚠️ Avec ça, la caisse passe en négatif sous 30 jours. Tu ne pourras pas dire que tu ne savais pas.</p>'
        : proj.joursApres < 15 ? '<p class="avert">⚠️ Ça passe sous le seuil d\'alerte des 15 jours de caisse.</p>' : ''}
      <div class="modale-boutons">
        <button class="btn-lien" id="modale-annuler">Annuler</button>
        <button class="btn" id="modale-ok">${libelleOk}</button>
      </div>`);
    document.getElementById('modale-annuler').addEventListener('click', fermerModale);
    document.getElementById('modale-ok').addEventListener('click', () => { fermerModale(); onConfirme(); E.sauvegarder(); rendre(); });
  }

  function modaleQuestion(S) {
    const q = QUESTIONS.find(x => x.id === S.questionActive);
    if (!q) return;
    modale(`
      ${bulleAdjoint('courrier')}
      <p class="crise-texte">${q.icone} ${q.texte}</p>
      <div class="crise-options">
        ${q.options.map((o, i) => {
          const cout = o.effets.tresorerie || 0;
          return `<button class="option-crise option-question" data-i="${i}">
            <span class="opt-titre">${o.libelle}</span>
            ${cout ? `<span class="opt-cout ${cout > 0 ? 'texte-vert' : ''}">${signe(cout)}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
      <div class="modale-boutons">
        <button class="btn-lien" id="question-plus-tard">⏳ Plus tard (le temps attendra ta réponse)</button>
      </div>`, { bloquant: true });
    modalRoot().querySelectorAll('.option-question').forEach(b => b.addEventListener('click', () => {
      const i = parseInt(b.dataset.i, 10);
      const cout = q.options[i].effets.tresorerie || 0;
      const res = E.resoudreQuestion(i);
      questionEnAttente = false;
      FX.son(cout > 0 ? 'argent' : 'clic');
      if (cout) FX.flotteEuro(signe(cout, eurCourt), cout > 0);
      fermerModale(); E.sauvegarder(); rendre();
      if (res.note) toast(`${res.icone} ${res.note}`);
    }));
    document.getElementById('question-plus-tard').addEventListener('click', () => {
      questionEnAttente = true;
      fermerModale();
    });
  }

  function modaleCrise(S) {
    const c = S.criseActive;
    if (!c) return;
    const crise = CRISES.find(x => x.id === c.criseId);
    const joursRestants = CFG.CRISE_DELAI_JOURS - (S.jour - c.jourDebut);
    modale(`
      ${bulleAdjoint('crise')}
      <h2>${crise.icone} CRISE — ${crise.nom}</h2>
      <p class="crise-texte">${crise.texte}</p>
      <p><b>Coût actuel : ${eur(c.coutCourant)}</b> — +${Math.round(CFG.CRISE_ESCALADE_JOUR * 100)} % par jour d'attente.
        Sans décision d'ici ${joursRestants} jour(s), l'option par défaut s'applique.</p>
      <div class="crise-options">
        ${crise.options.map(o => {
          const cout = Math.round(c.coutCourant * o.coutFacteur);
          const bloquee = o.capital && S.capitalPrefecture < o.capital;
          return `<button class="option-crise ${o.defaut ? 'defaut' : ''}" data-cle="${o.cle}" ${bloquee ? 'disabled' : ''}>
            <span class="opt-titre">${o.cle} — ${o.libelle} ${o.defaut ? '<span class="badge">défaut</span>' : ''}</span>
            <span class="opt-cout">Coût : ${eur(cout)}${o.capital ? ` · capital préfecture −${o.capital}${bloquee ? ' (pas assez !)' : ''}` : ''}</span>
            <span class="opt-note">${o.note}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="modale-boutons">
        <button class="btn-lien" id="crise-reporter">⏳ Décider demain (le coût grimpera)</button>
      </div>`, { bloquant: true });
    modalRoot().querySelectorAll('.option-crise').forEach(b => b.addEventListener('click', () => {
      const res = E.resoudreCrise(b.dataset.cle);
      if (res.ok === false && res.msg) { alert(res.msg); return; }
      fermerModale(); E.sauvegarder(); rendre();
    }));
    document.getElementById('crise-reporter').addEventListener('click', () => {
      fermerModale(); E.reporterCrise(); E.sauvegarder(); rendre();
    });
  }

  function modaleEvenementDiffere(evt) {
    const def = EVENEMENTS_DIFFERES[evt.evenement];
    modale(`
      ${bulleAdjoint('evenement')}
      <h2>📜 ${def.titre}</h2>
      <p class="crise-texte">${def.texte}</p>
      <div class="crise-options">
        ${def.options.map((o, i) => `<button class="option-crise" data-i="${i}">
          <span class="opt-titre">${o.libelle}</span><span class="opt-note">${o.note}</span></button>`).join('')}
      </div>`, { bloquant: true });
    modalRoot().querySelectorAll('.option-crise').forEach(b => b.addEventListener('click', () => {
      E.resoudreEvenement(evt, parseInt(b.dataset.i, 10));
      fermerModale(); E.sauvegarder(); rendre();
    }));
  }

  function modaleDiagnostic(S) {
    const d = E.calculerMigration().diagnostic;
    const causes = [
      ['💶 Impôts trop hauts (> 18 %)', d.fiscalite, 'Redescends le taux (Business).'],
      ['🌳 Cadre de vie dégradé', d.cadreDeVie, 'Passe l\'entretien en « Soigné », construis des services.'],
      ['🏙️ Ville saturée', d.saturation, 'École, réseau d\'eau, parking : il manque de la place.'],
      ['⏳ Suites d\'événements', d.evenements, 'Ça passera — si rien d\'autre ne casse.'],
    ].sort((a, b) => b[1] - a[1]);
    const max = Math.max(0.01, ...causes.map(c => c[1]));
    modale(`
      <h2>🔎 Pourquoi les gens partent</h2>
      <p class="note">Départs : ${d.depart.toFixed(2)} %/mois · arrivées : ${d.arrivee.toFixed(2)} %/mois</p>
      <div class="composantes">
        ${causes.map(([n, v, conseil], i) => `<div class="composante">
          <span class="comp-nom">${i === 0 && v > 0 ? '➡️ ' : ''}${n}</span>
          <div class="barre grande"><div class="barre-rempli ${v > 0 ? 'basse' : ''}" style="width:${Math.round(v / max * 100)}%"></div></div>
          <span class="comp-val">${v.toFixed(1)}</span>
          <span class="comp-conseil">${v > 0 ? conseil : ''}</span>
        </div>`).join('')}
      </div>
      <div class="modale-boutons"><button class="btn" id="modale-fermer">Compris</button></div>`);
    document.getElementById('modale-fermer').addEventListener('click', fermerModale);
  }

  function modaleFin(S) {
    const g = S.gameOver;
    if (!finJouee) {
      finJouee = true;
      if (g.victoire) { FX.son('niveau'); FX.confettis(); } else FX.son('defaite');
    }
    modale(`
      <h2>${g.victoire ? '🎖️' : '🏳️'} ${g.titre}</h2>
      <p class="crise-texte">${g.texte}</p>
      ${!g.victoire ? '<p class="note">Tu perds la ville, jamais ta progression. Reprends une commune — et cette fois, tu sauras.</p>' : ''}
      <div class="modale-boutons"><button class="btn" id="btn-rejouer">Reprendre une commune</button></div>`, { bloquant: true });
    document.getElementById('btn-rejouer').addEventListener('click', () => {
      E.effacerSauvegarde(); fermerModale(); ecranAccueil();
    });
  }

  /* ================= ÉVÉNEMENTS ================= */

  function brancherEvenements(S) {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };

    const sonDuJour = (avaitCrise, avaitQuestion) => {
      if (!avaitCrise && E.etat.criseActive) { FX.son('crise'); FX.secouer(); }
      else if (!avaitQuestion && E.etat.questionActive) FX.son('question');
      else FX.son('jour');
    };
    on('btn-jour', () => {
      if (E.etat.questionActive) questionEnAttente = false; // le temps n'avance pas sans réponse
      const avaitCrise = !!E.etat.criseActive, avaitQuestion = !!E.etat.questionActive;
      E.avancerJour();
      sonDuJour(avaitCrise, avaitQuestion);
      E.sauvegarder(); rendre();
    });
    on('btn-semaine', () => {
      const avaitCrise = !!E.etat.criseActive, avaitQuestion = !!E.etat.questionActive;
      for (let i = 0; i < 7; i++) {
        if (E.etat.criseActive || E.etat.questionActive || E.etat.gameOver || E.evenementDu()) break;
        E.avancerJour();
      }
      sonDuJour(avaitCrise, avaitQuestion);
      E.sauvegarder(); rendre();
    });
    on('btn-son', () => { FX.basculerMuet(); FX.son('clic'); rendre(); });
    on('btn-nouvelle', () => { if (confirm('Abandonner cette ville et recommencer ?')) { E.effacerSauvegarde(); ecranAccueil(); } });
    on('btn-mission', () => { E.faireMissionRedressement(); E.sauvegarder(); rendre(); });
    on('btn-diag', () => modaleDiagnostic(S));
    on('btn-diag2', () => modaleDiagnostic(S));
    on('btn-crise', () => modaleCrise(S));
    on('btn-crise-carte', () => modaleCrise(S));
    on('btn-repondre', () => modaleQuestion(S));
    on('btn-note', () => { vueActive = vueActive === 'note' ? 'carte' : 'note'; rendre(); });

    /* notifications */
    on('btn-notifs', () => {
      notifsOuvertes = !notifsOuvertes;
      if (notifsOuvertes) E.marquerNotifsLues();
      E.sauvegarder(); rendre();
    });
    on('fermer-notifs', () => { notifsOuvertes = false; rendre(); });
    const voileN = document.getElementById('voile-notifs');
    if (voileN) voileN.addEventListener('click', (e) => { if (e.target.id === 'voile-notifs') { notifsOuvertes = false; rendre(); } });
    app().querySelectorAll('.btn-notif-action').forEach(b => b.addEventListener('click', () => {
      notifsOuvertes = false;
      const action = b.dataset.action;
      if (action === 'crise') { rendre(); modaleCrise(S); }
      else if (action === 'question') { rendre(); if (S.questionActive) modaleQuestion(S); else { vueActive = 'courrier'; rendre(); } }
      else if (action === 'diag') { rendre(); modaleDiagnostic(S); }
      else if (action === 'business') { vueActive = 'business'; rendre(); }
      else rendre();
    }));

    /* zoom de la carte */
    const carte = document.getElementById('carte');
    if (carte) {
      on('zoom-plus', () => CarteCommune.zoomer(carte, S, 1.4));
      on('zoom-moins', () => CarteCommune.zoomer(carte, S, 1 / 1.4));
      on('zoom-reset', () => CarteCommune.recentrer(carte, S));
    }

    /* Impôts : aperçu live + projection avant vote */
    const slider = document.getElementById('slider-taux');
    if (slider) {
      const apercu = () => {
        const t = parseInt(slider.value, 10);
        document.getElementById('taux-affiche').textContent = t + ' %';
        const p = E.projeterTaux(t);
        document.getElementById('apercu-taux').innerHTML = t === S.taux ? '' :
          `Recettes : ${eur(p.fiscAvant)} → <b>${eur(p.fiscApres)}</b>/mois · ❤️ ${p.dPop >= 0 ? '+' : ''}${p.dPop.toFixed(1)} · 👥 ${signe(p.migAvant, nb)} → <b>${signe(p.migApres, nb)}</b>/mois`;
      };
      slider.addEventListener('input', apercu); apercu();
      on('btn-taux', () => {
        const t = parseInt(slider.value, 10);
        if (t === S.taux) return;
        const p = E.projeterTaux(t);
        modaleProjection({
          titre: `Passer les impôts à ${t} %`,
          lignesFixes: [['Recettes mensuelles', `${eur(p.fiscAvant)} → ${eur(p.fiscApres)}`]],
          proj: p,
          effets: [`❤️ Popularité ${p.dPop >= 0 ? '+' : ''}${p.dPop.toFixed(1)} dès le vote`,
                   `👥 Solde migratoire projeté : ${signe(p.migApres, nb)} hab./mois`,
                   'Effet le mois prochain, jamais rétroactif'],
          libelleOk: 'Voter ce taux',
          onConfirme: () => { const r = E.changerTaux(t); if (!r.ok && r.msg) alert(r.msg); },
        });
      });
    }

    /* Entretien : trois niveaux */
    app().querySelectorAll('.btn-entretien').forEach(b => b.addEventListener('click', () => {
      const niveau = b.dataset.niveau;
      if (niveau === S.niveauEntretien) return;
      const coutActuel = S.budgetVoirie + S.budgetProprete;
      const coutNouveau = coutNiveau(S, E.NIVEAUX_ENTRETIEN[niveau].facteur);
      const p = projSimple(coutActuel - coutNouveau);
      modaleProjection({
        titre: `Entretien « ${E.NIVEAUX_ENTRETIEN[niveau].nom} » : ${eur(coutNouveau)}/mois`,
        proj: p,
        effets: [niveau === 'eco' ? '🛣️ La voirie se dégradera doucement (annoncé, réversible)'
          : niveau === 'soigne' ? '🌳 Voirie et propreté vont grimper' : '🌳 Voirie et propreté stables'],
        libelleOk: 'Valider',
        onConfirme: () => E.reglerEntretien(niveau),
      });
    }));

    /* Construction */
    app().querySelectorAll('.btn-construire').forEach(b => b.addEventListener('click', () => {
      const p = E.projeterConstruction(b.dataset.equip);
      const charge = p.def.entretien + p.def.energie - p.def.recettes;
      modaleProjection({
        titre: `${p.def.icone} Construire : ${p.def.nom}`,
        lignesFixes: [['Coût', eur(p.cout)], ['Ensuite', `${charge >= 0 ? '−' : '+'} ${eur(Math.abs(charge))}/mois — pour toujours`]],
        proj: p,
        effets: [
          ...(p.def.effets.attractivite ? [`✨ Attractivité +${p.def.effets.attractivite}`] : []),
          ...(p.def.effets.popularite ? [`❤️ Popularité +${p.def.effets.popularite}`] : []),
          ...(p.def.capacite ? [`👥 +${nb(p.def.capacite)} habitants de place`] : []),
          ...(p.def.proximite ? ['🏪 Commerces & services +6'] : []),
          ...(p.def.chantier === 'voirie' ? ['🛣️ Voirie remise à neuf (95/100)'] : []),
          ...(p.def.chantier === 'eclairage' ? ['💡 Éclairage remis à neuf (92/100)'] : []),
        ],
        libelleOk: 'Construire',
        onConfirme: () => {
          const r = E.construire(b.dataset.equip);
          if (!r.ok && r.msg) { alert(r.msg); return; }
          FX.son('construire');
          FX.confettis(['🏗️', '🎉', '✨', p.def.icone]);
          FX.flotteEuro('−' + eurCourt(p.cout), false);
        },
      });
    }));

    /* Aides État */
    app().querySelectorAll('.btn-aide').forEach(b => b.addEventListener('click', () => {
      const r = E.aideEtat(b.dataset.aide);
      if (!r.ok && r.msg) alert(r.msg);
      else FX.son('argent');
      E.sauvegarder(); rendre();
    }));

    /* Offres privées */
    app().querySelectorAll('.btn-offre-oui').forEach(b => b.addEventListener('click', () => {
      const o = OFFRES_PRIVEES.find(x => x.id === b.dataset.offre);
      const montant = o ? E.montantOffre(o) : 0;
      E.accepterOffre(b.dataset.offre);
      FX.son('argent');
      if (montant) FX.flotteEuro('+' + eurCourt(montant), true);
      E.sauvegarder(); rendre();
    }));
    app().querySelectorAll('.btn-offre-non').forEach(b => b.addEventListener('click', () => {
      E.refuserOffre(b.dataset.offre); E.sauvegarder(); rendre();
    }));

    /* Emprunt : trois tailles */
    app().querySelectorAll('.btn-emprunt').forEach(b => b.addEventListener('click', () => {
      const cap = parseInt(b.dataset.capital, 10);
      const p = E.projeterEmprunt(cap, 60);
      modaleProjection({
        titre: `Emprunter ${eur(cap)} sur 5 ans`,
        lignesFixes: [['Taux', (p.taux * 100).toFixed(1) + ' %'], ['Mensualité', `− ${eur(p.mensualite)}/mois pendant 60 mois`]],
        proj: p,
        effets: ['La mensualité reste dans tes dépenses jusqu\'au bout'],
        libelleOk: 'Signer',
        onConfirme: () => {
          const r = E.emprunter(cap, 60);
          if (!r.ok && r.msg) { alert(r.msg); return; }
          FX.son('argent');
          FX.flotteEuro('+' + eurCourt(cap), true);
        },
      });
    }));
  }

  function projSimple(deltaMensuel) {
    const soldeAvant = E.soldeMensuel();
    const soldeApres = soldeAvant + deltaMensuel;
    const tresoApres = E.etat.tresorerie + soldeApres;
    const depApres = E.depensesMensuelles() - deltaMensuel;
    return {
      soldeAvant, soldeApres,
      tresoAvant: Math.round(E.etat.tresorerie), tresoApres: Math.round(tresoApres),
      joursAvant: E.joursDeTresorerie(), joursApres: tresoApres / (depApres / 30),
    };
  }

  function afficherModalesAutomatiques(S) {
    if (S.gameOver) return modaleFin(S);
    const evt = E.evenementDu();
    if (evt) return modaleEvenementDiffere(evt);
    if (S.criseActive && S.jour === S.criseActive.jourDebut) return modaleCrise(S);
    if (S.questionActive && !questionEnAttente) return modaleQuestion(S);
  }

  return { rendre, ecranAccueil };
})();
