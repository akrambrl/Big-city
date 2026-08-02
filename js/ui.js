/* ============================================================
   BIG CITY — Interface
   Rendu des écrans, modales de projection, crises, diagnostic.
   ============================================================ */

const UI = (() => {
  const app = () => document.getElementById('app');
  const modalRoot = () => document.getElementById('modal-root');
  const E = Engine;
  let ongletActif = 'tableau';

  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = E.fmtEuro, nb = E.fmtNb;
  const signe = (v, fmt = eur) => (v >= 0 ? '+' : '−') + fmt(Math.abs(v));

  /* ================= ÉCRAN D'ACCUEIL ================= */

  function ecranAccueil() {
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">République française · Atlas communal</p>
      <h1>Big <span class="filet">City</span></h1>
      <p class="sous-titre">Monsieur le Maire, la commune vous attend.
      Chaque équipement construit coûte pour toujours, chaque aide se paie un jour. Vous étiez prévenu.</p>
      <div class="profils">
        ${Object.entries(PROFILS).map(([id, p]) => `
          <button class="carte-profil" data-profil="${id}">
            <canvas class="mini-carte" data-profil-carte="${id}"></canvas>
            <span class="profil-label">${p.icone} ${p.label}</span>
            <span class="profil-nom">${p.nom} — ${nb(p.population)} hab.</span>
            <span class="profil-desc">${p.desc}</span>
          </button>`).join('')}
      </div>
      <label class="tranquille"><input type="checkbox" id="mode-tranquille">
        Mode « ville tranquille » — sans condition de défaite (les alertes restent affichées)</label>
    </div>`;
    /* aperçu cartographique de chaque profil */
    app().querySelectorAll('.mini-carte').forEach(cv => {
      const id = cv.dataset.profilCarte, p = PROFILS[id];
      CarteCommune.dessiner(cv, {
        commune: p.nom, profil: id, mois: 1, equipements: [],
        population: p.population, populationInitiale: p.population,
        cadre: { voirie: 70 },
      });
    });
    app().querySelectorAll('.carte-profil').forEach(b => b.addEventListener('click', () => {
      E.nouvellePartie(b.dataset.profil, document.getElementById('mode-tranquille').checked);
      E.sauvegarder();
      rendre();
    }));
  }

  /* ================= RENDU PRINCIPAL ================= */

  function rendre() {
    const S = E.etat;
    if (!S) return ecranAccueil();
    app().innerHTML = `
      ${htmlEntete(S)}
      ${htmlBandeaux(S)}
      <nav class="onglets">
        ${[['tableau', '🏛️ Tableau de bord'], ['budget', '💶 Budget'], ['construire', '🏗️ Construire'],
           ['aides', '🤝 Aides & finances'], ['journal', '📜 Journal']]
          .map(([id, lbl]) => `<button class="onglet ${ongletActif === id ? 'actif' : ''}" data-onglet="${id}">${lbl}</button>`).join('')}
      </nav>
      <main class="contenu">${htmlOnglet(S)}</main>`;

    app().querySelectorAll('.onglet').forEach(b => b.addEventListener('click', () => { ongletActif = b.dataset.onglet; rendre(); }));
    const carte = document.getElementById('carte');
    if (carte) CarteCommune.dessiner(carte, S);
    const marqueur = document.getElementById('btn-crise-carte');
    if (marqueur) marqueur.addEventListener('click', () => modaleCrise(S));
    brancherEvenements(S);
    afficherModalesAutomatiques(S);
  }

  /* la carte suit la largeur de la fenêtre */
  let minuteurRedim = null;
  window.addEventListener('resize', () => {
    clearTimeout(minuteurRedim);
    minuteurRedim = setTimeout(() => {
      const carte = document.getElementById('carte');
      if (carte && E.etat) CarteCommune.dessiner(carte, E.etat);
    }, 150);
  });

  const EMOJI_SAISON = { hiver: '❄️', printemps: '🌱', ete: '☀️', automne: '🍂' };

  function htmlEntete(S) {
    const jours = E.joursDeTresorerie();
    const solde = E.soldeMensuel();
    const cadre = E.cadreDeVie();
    const clTreso = S.tresorerie < 0 ? 'rouge' : jours < 15 ? 'orange' : '';
    const perte = (S.populationInitiale - S.population) / S.populationInitiale * 100;
    const clPop = perte >= 10 ? 'rouge' : perte >= 5 ? 'orange' : '';
    const saison = E.saison();
    const crise = S.criseActive ? CRISES.find(x => x.id === S.criseActive.criseId) : null;
    const posC = crise ? CarteCommune.posCrise(crise.id, S.profil) : null;
    return `
    <header class="hud">
      <h1>${esc(S.commune)}</h1>
      <div class="date-jeu">Année ${E.annee()} · ${NOMS_MOIS[E.moisCalendaire()]} · jour ${S.jourDuMois}/30
        <span class="mandat">— mandat : mois ${Math.min(S.mois, CFG.MANDAT_MOIS)}/${CFG.MANDAT_MOIS}${S.tranquille ? ' · 🕊️ ville tranquille' : ''}</span></div>
      <div class="controles-temps">
        <button id="btn-jour" class="btn-temps">▶ +1 jour</button>
        <button id="btn-semaine" class="btn-temps">⏩ +7 jours</button>
        <button id="btn-nouvelle" class="btn-lien" title="Abandonner et recommencer">Nouvelle partie</button>
      </div>
    </header>
    <div class="carte-monde">
      <canvas id="carte" role="img" aria-label="Plan de la commune de ${esc(S.commune)}"></canvas>
      <span class="chip-carte">${EMOJI_SAISON[saison]} ${saison === 'ete' ? 'été' : saison} · ${NOMS_MOIS[E.moisCalendaire()]}, année ${E.annee()}</span>
      <div class="cartouche">
        <div class="surcart">Commune de</div>
        <div class="nomcart">${esc(S.commune)}</div>
        <div class="echelle">500 m</div>
      </div>
      ${crise ? `<button class="marqueur-crise" id="btn-crise-carte" title="${crise.nom} — cliquer pour décider"
        style="left:${(posC.x * 100).toFixed(1)}%;top:${(posC.y * 100).toFixed(1)}%">${crise.icone}</button>` : ''}
    </div>
    <div class="jauges">
        <div class="jauge ${clTreso}"><span class="jauge-nom">Trésorerie</span>
          <span class="jauge-val">${eur(S.tresorerie)}</span>
          <span class="jauge-sub">${S.tresorerie < 0 ? '⚠ négative' : Math.round(jours) + ' jours'}</span></div>
        <div class="jauge ${clPop}"><span class="jauge-nom">Population</span>
          <span class="jauge-val">${nb(S.population)}</span>
          <span class="jauge-sub">${S.dernierSoldeMigratoire === 0 ? 'stable' : signe(S.dernierSoldeMigratoire, nb) + ' le mois dernier'}</span></div>
        ${jauge100('Popularité', S.popularite)}
        ${jauge100('Attractivité', S.attractivite)}
        ${jauge100('Cadre de vie', cadre)}
        ${jauge100('Capital préfecture', S.capitalPrefecture, true)}
        <div class="jauge"><span class="jauge-nom">Solde mensuel</span>
          <span class="jauge-val ${solde < 0 ? 'texte-rouge' : ''}">${signe(solde)}</span>
          <span class="jauge-sub">fonctionnement</span></div>
      </div>`;
  }

  function jauge100(nom, v, pref = false) {
    const cl = v < 25 ? 'rouge' : v < 45 ? 'orange' : '';
    return `<div class="jauge ${cl}"><span class="jauge-nom">${nom}</span>
      <span class="jauge-val">${Math.round(v)}<span class="sur100">/100</span></span>
      <div class="barre"><div class="barre-rempli ${pref ? 'pref' : ''}" style="width:${Math.round(v)}%"></div></div></div>`;
  }

  function htmlBandeaux(S) {
    const b = [];
    if (S.paliers.fin === 'alerte')
      b.push(`<div class="bandeau orange">🟧 <b>Alerte budgétaire</b> — moins de 15 jours de trésorerie. Pistes : relever le taux communal, geler un chantier, solliciter l'État (onglet Aides).</div>`);
    if (S.paliers.fin === 'redressement') {
      const j = E.joursRedressementRestants();
      b.push(`<div class="bandeau rouge">🟥 <b>Plan de redressement</b> — ${j} jour(s) pour revenir à l'équilibre, sinon mise sous tutelle. Investissements gelés, emprunt coupé, taux plancher 15 %.
        ${E.missionRedressementDispo() ? `<button id="btn-mission" class="btn-mini">🗂️ Mission du jour (+${eur(CFG.MISSION_REDRESSEMENT)})</button>` : '<span class="fait">mission du jour accomplie ✓</span>'}</div>`);
    }
    if (S.paliers.demo === 'alerte')
      b.push(`<div class="bandeau orange">🟧 <b>Alerte démographique</b> — plus de 5 % de la population est partie. <button id="btn-diag" class="btn-mini">Voir le diagnostic</button></div>`);
    if (S.paliers.demo === 'declin')
      b.push(`<div class="bandeau rouge">🟥 <b>Déclin démographique</b> — plus de 10 % de départs. Le conseil s'inquiète. À −15 %, le mandat prend fin. <button id="btn-diag" class="btn-mini">Voir le diagnostic</button></div>`);
    if (S.criseActive) {
      const c = CRISES.find(x => x.id === S.criseActive.criseId);
      b.push(`<div class="bandeau rouge">🚨 <b>Crise en cours : ${c.nom}</b> — coût actuel ${eur(S.criseActive.coutCourant)}, il augmente chaque jour. <button id="btn-crise" class="btn-mini">Décider</button></div>`);
    }
    return b.length ? `<div class="bandeaux">${b.join('')}</div>` : '';
  }

  /* ================= ONGLETS ================= */

  function htmlOnglet(S) {
    switch (ongletActif) {
      case 'tableau': return htmlTableau(S);
      case 'budget': return htmlBudget(S);
      case 'construire': return htmlConstruire(S);
      case 'aides': return htmlAides(S);
      case 'journal': return htmlJournal(S);
    }
  }

  /* ---- Tableau de bord ---- */

  function htmlTableau(S) {
    const solde = E.soldeMensuel();
    const jours = E.joursDeTresorerie();
    const dette = E.tauxEndettement() * 100;
    const sat = E.saturation();
    const mig = E.calculerMigration();
    return `
    <div class="grille-2">
      <section class="carte">
        <h2>Les trois chiffres qui comptent</h2>
        <div class="ratios">
          ${ratio('Solde mensuel', signe(solde), solde < 0, 'recettes − dépenses de fonctionnement · alerte si < 0')}
          ${ratio('Jours de trésorerie', S.tresorerie < 0 ? '—' : Math.round(jours) + ' j', jours < 15, 'trésorerie ÷ dépense quotidienne · alerte si < 15 j')}
          ${ratio('Taux d\'endettement', dette.toFixed(0) + ' %', dette > 100, 'encours ÷ recettes annuelles · alerte si > 100 %')}
        </div>
      </section>
      <section class="carte">
        <h2>Population & migration</h2>
        <p>Tendance actuelle : <b>${signe(Math.round(S.population * mig.diagnostic.soldePct / 100), nb)} hab./mois</b>
           (arrivées ${mig.diagnostic.arrivee.toFixed(2)} % − départs ${mig.diagnostic.depart.toFixed(2)} %).</p>
        <p>Saturation des services : <b>${sat.toFixed(1)} %</b> — capacité d'accueil ${nb(E.capaciteEquipements())} hab.
           ${sat > 0 ? '<span class="texte-orange">La commune grandit plus vite que ses équipements.</span>' : ''}</p>
        <button class="btn" id="btn-diag2">🔎 Diagnostic des départs</button>
      </section>
    </div>
    <div class="grille-2">
      <section class="carte">
        <h2>Trésorerie (fin de mois)</h2>
        ${graphique(S.historique.map(h => h.tresorerie), '#7FB7E8', v => eur(v), S.tresorerie)}
      </section>
      <section class="carte">
        <h2>Population (fin de mois)</h2>
        ${graphique(S.historique.map(h => h.populationFin), '#74C89A', v => nb(v) + ' hab.', S.population)}
      </section>
    </div>
    <section class="carte">
      <h2>Cadre de vie — le détail</h2>
      <p class="note">Ce qui fait rester les habitants. Négliger une composante, c'est les regarder partir.</p>
      ${composantesCadre(S)}
    </section>`;
  }

  function ratio(nom, val, alerte, aide) {
    return `<div class="ratio ${alerte ? 'alerte' : ''}" title="${aide}">
      <span class="ratio-val">${val}</span><span class="ratio-nom">${nom}</span></div>`;
  }

  function composantesCadre(S) {
    const comp = [
      ['Éclairage public', S.cadre.eclairage, 20], ['État de la voirie', S.cadre.voirie, 25],
      ['Propreté & déchets', S.cadre.proprete, 20], ['Logements vacants', S.cadre.logement, 15],
      ['Équipements de proximité', S.cadre.proximite, 20],
    ];
    return `<div class="composantes">${comp.map(([n, v, p]) => `
      <div class="composante"><span class="comp-nom">${n} <em>(${p} %)</em></span>
        <div class="barre grande"><div class="barre-rempli ${v < 40 ? 'basse' : ''}" style="width:${Math.round(v)}%"></div></div>
        <span class="comp-val">${Math.round(v)}</span></div>`).join('')}</div>`;
  }

  /* Petit graphique SVG mono-série (ligne fine, grille discrète, dernier point étiqueté) */
  function graphique(valeurs, couleur, fmt, valActuelle) {
    if (valeurs.length < 2) return `<p class="note">Valeur actuelle : <b>${fmt(valActuelle)}</b> — l'historique se dessine à partir du 2ᵉ mois.</p>`;
    const W = 420, H = 120, P = 6;
    const min = Math.min(...valeurs, 0), max = Math.max(...valeurs);
    const y = v => H - P - (max === min ? 0.5 : (v - min) / (max - min)) * (H - 2 * P);
    const x = i => P + i * (W - 2 * P) / (valeurs.length - 1);
    const pts = valeurs.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const zeroY = min < 0 ? y(0) : null;
    const der = valeurs[valeurs.length - 1];
    const baseY = (H - P).toFixed(1);
    return `<svg viewBox="0 0 ${W} ${H}" class="graph" role="img" aria-label="Évolution : dernière valeur ${fmt(der)}">
      <polygon points="${x(0).toFixed(1)},${baseY} ${pts} ${x(valeurs.length - 1).toFixed(1)},${baseY}" fill="${couleur}" opacity="0.13"/>
      ${zeroY !== null ? `<line x1="${P}" x2="${W - P}" y1="${zeroY}" y2="${zeroY}" class="graph-zero"/>` : ''}
      <polyline points="${pts}" fill="none" stroke="${couleur}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="${x(valeurs.length - 1)}" cy="${y(der)}" r="3.5" fill="${couleur}"/>
    </svg>
    <p class="graph-legende">Dernière clôture : <b>${fmt(der)}</b> · ${valeurs.length} mois</p>`;
  }

  /* ---- Budget ---- */

  function htmlBudget(S) {
    const r = E.recettes(), d = E.depenses();
    const solde = E.soldeMensuel();
    const lignes = (items) => items.map(([n, v, note]) =>
      `<tr><td>${n}${note ? ` <span class="note-inline">${note}</span>` : ''}</td><td class="mont ${v < 0 ? 'texte-rouge' : ''}">${v < 0 ? '−' : ''}${eur(Math.abs(v))}</td></tr>`).join('');
    const chargesEquip = S.equipements.map(e => {
      const def = E.defEquip(e.type);
      const net = def.entretien + def.energie - def.recettes;
      return [`${def.icone} ${def.nom}`, -net, 'ligne à vie'];
    });
    return `
    <div class="grille-2">
      <section class="carte">
        <h2>Section fonctionnement — chaque mois</h2>
        <table class="table-budget">
          <tr class="entete-table"><td>Recettes</td><td class="mont">${eur(r.fiscalite + r.dotation + r.services)}</td></tr>
          ${lignes([
            [`Fiscalité locale (taux ${S.taux} %${S.exonerationMois ? ', exonération en cours' : ''})`, r.fiscalite],
            ['Dotation de l\'État', r.dotation, `${CFG.DOTATION_HAB_AN} €/hab/an`],
            ['Recettes de service', r.services],
          ])}
          <tr class="entete-table"><td>Dépenses</td><td class="mont">−${eur(d.personnel + d.energie + d.entretien + d.dette)}</td></tr>
          ${lignes([
            ['Personnel (incompressible)', -d.personnel],
            ['Énergie & fluides', -d.energie],
            ['Entretien du patrimoine', -d.entretien],
            ['Remboursements d\'emprunt' + (S.avanceTreso ? ' + avance État' : ''), -d.dette],
          ])}
          <tr class="total ${solde < 0 ? 'texte-rouge' : ''}"><td>Solde mensuel</td><td class="mont">${signe(solde)}</td></tr>
        </table>
        ${chargesEquip.length ? `<h3>Dont lignes créées par vos constructions</h3>
          <table class="table-budget">${lignes(chargesEquip)}</table>` : ''}
      </section>
      <section class="carte">
        <h2>Taux communal — le levier principal</h2>
        <p class="note">Modifiable une fois par mois, appliqué le mois suivant. Jamais rétroactif.</p>
        <div class="ligne-taux">
          <input type="range" id="slider-taux" min="${CFG.TAUX_MIN}" max="${CFG.TAUX_MAX}" step="1"
            value="${S.tauxProchain ?? S.taux}" ${S.tauxChangeCeMois ? 'disabled' : ''}>
          <span id="taux-affiche" class="taux-val">${S.tauxProchain ?? S.taux} %</span>
        </div>
        <div id="apercu-taux" class="apercu"></div>
        <button class="btn" id="btn-taux" ${S.tauxChangeCeMois ? 'disabled' : ''}>
          ${S.tauxChangeCeMois ? (S.tauxProchain !== null ? `Voté : ${S.tauxProchain} % au mois prochain` : 'Déjà modifié ce mois-ci') : 'Voter ce taux (projection avant validation)'}
        </button>
        <hr>
        <h2>Budgets d'entretien mensuels</h2>
        <p class="note">La voirie est la seule chose qui se dégrade toute seule dans ce jeu — lentement, et c'est évitable.</p>
        ${sliderBudget('voirie', 'Entretien de la voirie', S.budgetVoirie, Math.round(S.population * COEF.VOIRIE_PLEIN))}
        ${sliderBudget('proprete', 'Propreté & déchets', S.budgetProprete, Math.round(S.population * COEF.PROPRETE_PLEIN))}
      </section>
    </div>
    <section class="carte">
      <h2>Section investissement</h2>
      <p>Capacité d'investissement : <b>${eur(E.capaciteInvestissement())}</b>
        <span class="note-inline">(trésorerie − ${CFG.RESERVE_FONCTIONNEMENT_J} jours de fonctionnement sanctuarisés : on ne finance jamais du fonctionnement avec de l'investissement, ni l'inverse)</span>
        · Épargne cumulée du mandat : <b>${eur(S.epargneCumulee)}</b></p>
    </section>`;
  }

  function sliderBudget(id, nom, valeur, plein) {
    return `<div class="ligne-budget">
      <label>${nom} <span class="note-inline">recommandé : ${eur(plein)}</span></label>
      <div class="ligne-taux">
        <input type="range" id="slider-${id}" min="0" max="${plein * 2}" step="500" value="${valeur}">
        <span id="val-${id}" class="taux-val">${eur(valeur)}</span>
        <button class="btn-mini" id="btn-${id}">Valider</button>
      </div>
    </div>`;
  }

  /* ---- Construire ---- */

  function htmlConstruire(S) {
    return `
    <p class="avert">⚠️ <b>Chaque équipement crée une dépense de fonctionnement à vie.</b> La projection à 30 jours s'affiche avant toute validation — vous ne pourrez pas dire que vous ne saviez pas.</p>
    <div class="grille-cartes">
      ${EQUIPEMENTS.map(def => {
        const test = E.peutConstruire(def);
        const sub = E.subventionAccordee(def.id);
        const enInstruction = S.subventions.some(s => s.equipId === def.id && s.statut === 'instruction');
        const charge = def.entretien + def.energie - def.recettes;
        const dejaN = S.equipements.filter(e => e.type === def.id).length;
        return `<div class="carte equip ${test.ok ? '' : 'grise'}">
          <h3>${def.icone} ${def.nom} ${dejaN ? `<span class="badge">×${dejaN}</span>` : ''}</h3>
          <p class="equip-desc">${def.desc}</p>
          <div class="equip-chiffres">
            <span>Coût : <b>${eur(E.coutNet(def))}</b>${sub ? ' <span class="badge vert">subv. −50 %</span>' : ''}</span>
            <span>Fonctionnement : <b class="${charge > 0 ? 'texte-rouge' : 'texte-vert'}">${charge >= 0 ? '+' : '−'}${eur(Math.abs(charge))}/mois à vie</b></span>
            ${def.capacite ? `<span>Capacité : +${nb(def.capacite)} hab.</span>` : ''}
            ${def.effets.attractivite ? `<span>Attractivité +${def.effets.attractivite}</span>` : ''}
            ${def.effets.popularite ? `<span>Popularité +${def.effets.popularite}</span>` : ''}
          </div>
          <div class="equip-actions">
            <button class="btn btn-construire" data-equip="${def.id}" ${test.ok ? '' : 'disabled'}>Construire</button>
            ${!sub && !enInstruction ? `<button class="btn-lien btn-dossier" data-equip="${def.id}">📁 Demander une subvention (50 %, ~${CFG.SUBVENTION_DELAI_JOURS} j)</button>` : ''}
            ${enInstruction ? '<span class="note-inline">dossier en instruction…</span>' : ''}
          </div>
          ${!test.ok ? `<p class="note-inline">${test.msg}</p>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  }

  /* ---- Aides & finances ---- */

  function htmlAides(S) {
    const c = E.conditionsEmprunt();
    return `
    <div class="grille-2">
      <section class="carte">
        <h2>🏛️ L'État — rapide, gratuit, rationné</h2>
        <p>Capital préfecture : <b>${Math.round(S.capitalPrefecture)}/100</b> <span class="note-inline">(+${CFG.CAPITAL_PREF_REGEN}/mois, −${CFG.CAPITAL_PREF_MALUS_ALERTE} en période d'alerte budgétaire)</span></p>
        <p class="note">Le joueur qui a appelé la préfecture trois fois pour des broutilles se retrouve à sec le jour du feu de forêt. Les aides de crise (dotation de solidarité, fonds de catastrophe) se demandent pendant les crises.</p>
        ${AIDES_ETAT.map(a => `
          <div class="ligne-aide">
            <div><b>${a.nom}</b> <span class="badge">capital ${a.capital}</span><br><span class="note-inline">${a.desc}</span></div>
            <button class="btn btn-aide" data-aide="${a.id}" ${S.capitalPrefecture < a.capital ? 'disabled' : ''}>Solliciter</button>
          </div>`).join('')}
      </section>
      <section class="carte">
        <h2>🏦 L'emprunt</h2>
        ${c.bloque ? '<p class="avert">Accès à l\'emprunt coupé (endettement > 100 % ou plan de redressement).</p>' : `
        <p>Capacité maximale : <b>${eur(c.capaciteMax)}</b> · taux actuel : <b>${(c.taux * 100).toFixed(2)} %</b>
          <span class="note-inline">(3,5 % + 2 % × taux d'endettement)</span></p>
        <div class="ligne-taux">
          <input type="range" id="slider-emprunt" min="100000" max="${Math.max(100000, c.capaciteMax)}" step="50000" value="${Math.min(500000, c.capaciteMax)}">
          <span id="val-emprunt" class="taux-val">${eur(Math.min(500000, c.capaciteMax))}</span>
        </div>
        <div class="ligne-taux">
          <label>Durée :</label>
          <select id="duree-emprunt"><option value="24">24 mois</option><option value="60" selected>60 mois</option><option value="120">120 mois</option></select>
          <span id="mensualite-emprunt" class="note-inline"></span>
        </div>
        <button class="btn" id="btn-emprunt">Emprunter (projection avant validation)</button>`}
        <p class="note">La mensualité s'inscrit <b>définitivement</b> dans les dépenses de fonctionnement, jusqu'à extinction.</p>
        ${S.emprunts.length ? `<h3>Emprunts en cours</h3><table class="table-budget">${S.emprunts.map(e =>
          `<tr><td>${eur(e.capital)} · ${e.moisRestants} mois restants</td><td class="mont">−${eur(e.mensualite)}/mois</td></tr>`).join('')}</table>` : ''}
      </section>
    </div>
    <div class="grille-2">
      <section class="carte">
        <h2>💼 Le privé — immédiat, peu cher, mais ça se paie plus tard</h2>
        ${S.offresEnCours.length ? S.offresEnCours.map(oe => {
          const o = OFFRES_PRIVEES.find(x => x.id === oe.id);
          return `<div class="offre">
            <p><b>${o.icone} ${o.nom}</b> — ${o.texte}</p>
            <p>Gain immédiat : <b>${eur(o.montant)}</b> · Contrepartie : <b>J+${o.delai}</b> (nature non précisée, évidemment)</p>
            <button class="btn btn-offre-oui" data-offre="${o.id}">Accepter l'argent</button>
            <button class="btn-lien btn-offre-non" data-offre="${o.id}">Décliner</button>
          </div>`;
        }).join('') : '<p class="note">Aucune offre en ce moment. Les mécènes ont un flair certain pour les communes en difficulté — ils reviendront.</p>'}
        ${S.effetsDifferes.filter(e => e.evenement).length ? `<h3>Créances en attente</h3>
          <ul class="liste-simple">${S.effetsDifferes.filter(e => e.evenement).map(e =>
            `<li>⏳ ${esc(e.source || 'Contrepartie')} — échéance J+${e.jour - S.jour} (jour ${e.jour})</li>`).join('')}</ul>` : ''}
      </section>
      <section class="carte">
        <h2>📁 Subventions (département · région · Europe)</h2>
        <p class="note">Jamais pour une crise, uniquement pour un projet : 50 % du coût, ~${CFG.SUBVENTION_DELAI_JOURS} jours d'instruction, ${Math.round(CFG.SUBVENTION_SUCCES * 100)} % de réussite. Les dossiers se déposent depuis l'onglet Construire. Le joueur prévoyant dépose les siens avant d'en avoir besoin.</p>
        ${S.subventions.length ? `<ul class="liste-simple">${S.subventions.map(s => {
          const def = E.defEquip(s.equipId);
          const lbl = { instruction: `⏳ en instruction (verdict jour ${s.jourVerdict})`, accordee: '✅ accordée — utilisable à la construction', refusee: '❌ refusée', consommee: '💶 versée' }[s.statut];
          return `<li>${def.icone} ${def.nom} : ${lbl}</li>`;
        }).join('')}</ul>` : '<p class="note">Aucun dossier déposé.</p>'}
      </section>
    </div>`;
  }

  /* ---- Journal ---- */

  function htmlJournal(S) {
    return `
    <div class="grille-2">
      <section class="carte">
        <h2>📜 Journal de la commune</h2>
        <ul class="journal">${S.journal.map(l => `<li><span class="jour-tag">J${l.jour}</span> ${l.txt}</li>`).join('')}</ul>
      </section>
      <section class="carte">
        <h2>📊 Journal budgétaire mensuel</h2>
        ${S.historique.length ? `<div class="table-scroll"><table class="table-budget serree">
          <tr class="entete-table"><td>Mois</td><td class="mont">Recettes</td><td class="mont">Dépenses</td><td class="mont">Solde</td><td class="mont">Population</td></tr>
          ${[...S.historique].reverse().map(h => {
            const rec = h.recFiscalite + h.recDotation + h.recServices + h.recSubventions;
            const dep = h.depPersonnel + h.depEnergie + h.depEntretien + h.depDette + h.depExceptionnel;
            return `<tr><td>${h.nomMois} A${h.annee}</td><td class="mont">${eur(rec)}</td><td class="mont">−${eur(dep)}</td>
              <td class="mont ${h.solde < 0 ? 'texte-rouge' : ''}">${signe(h.solde)}</td>
              <td class="mont">${nb(h.populationFin)} (${signe(h.soldeMigratoire, nb)})</td></tr>`;
          }).join('')}
        </table></div>` : '<p class="note">Première clôture à la fin du mois.</p>'}
      </section>
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

  /* L'écran de projection — la pièce maîtresse (§8) */
  function modaleProjection({ titre, lignesFixes = [], proj, effets = [], onConfirme, libelleOk = 'Valider' }) {
    const fJours = v => isFinite(v) ? Math.max(0, Math.round(v)) + ' j' : '—';
    modale(`
      <h2>${titre}</h2>
      <table class="table-projection">
        ${lignesFixes.map(([n, v]) => `<tr><td>${n}</td><td class="mont" colspan="3">${v}</td></tr>`).join('')}
        <tr class="entete-table"><td>Projection à 30 jours</td><td class="mont">avant</td><td></td><td class="mont">après</td></tr>
        <tr><td>Solde mensuel</td><td class="mont">${signe(proj.soldeAvant)}</td><td class="fleche">→</td>
          <td class="mont ${proj.soldeApres < 0 ? 'texte-rouge' : ''}">${signe(proj.soldeApres)}</td></tr>
        <tr><td>Trésorerie</td><td class="mont">${eur(proj.tresoAvant)}</td><td class="fleche">→</td>
          <td class="mont ${proj.tresoApres < 0 ? 'texte-rouge' : ''}">${eur(proj.tresoApres)}</td></tr>
        <tr><td>Jours de trésorerie</td><td class="mont">${fJours(proj.joursAvant)}</td><td class="fleche">→</td>
          <td class="mont ${proj.joursApres < 15 ? 'texte-rouge' : ''}">${fJours(proj.joursApres)}</td></tr>
      </table>
      ${effets.length ? `<ul class="liste-effets">${effets.map(e => `<li>▸ ${e}</li>`).join('')}</ul>` : ''}
      ${proj.tresoApres < 0 ? '<p class="avert">⚠️ Cette décision mène la trésorerie en négatif sous 30 jours — plan de redressement en vue. Vous saurez que vous saviez.</p>'
        : proj.joursApres < 15 ? '<p class="avert">⚠️ Cette décision passe sous le seuil d\'alerte des 15 jours de trésorerie.</p>' : ''}
      <div class="modale-boutons">
        <button class="btn-lien" id="modale-annuler">Annuler</button>
        <button class="btn" id="modale-ok">${libelleOk}</button>
      </div>`);
    document.getElementById('modale-annuler').addEventListener('click', fermerModale);
    document.getElementById('modale-ok').addEventListener('click', () => { fermerModale(); onConfirme(); E.sauvegarder(); rendre(); });
  }

  function modaleCrise(S) {
    const c = S.criseActive;
    const crise = CRISES.find(x => x.id === c.criseId);
    const joursRestants = CFG.CRISE_DELAI_JOURS - (S.jour - c.jourDebut);
    modale(`
      <h2>${crise.icone} CRISE — ${crise.nom}</h2>
      <p class="crise-texte">${crise.texte}</p>
      <p><b>Coût de référence actuel : ${eur(c.coutCourant)}</b> — il augmente de ${Math.round(CFG.CRISE_ESCALADE_JOUR * 100)} % par jour d'attente.
        Sans décision d'ici ${joursRestants} jour(s), l'option par défaut s'applique.</p>
      <div class="crise-options">
        ${crise.options.map(o => {
          const cout = Math.round(c.coutCourant * o.coutFacteur);
          const bloquee = o.capital && S.capitalPrefecture < o.capital;
          return `<button class="option-crise ${o.defaut ? 'defaut' : ''}" data-cle="${o.cle}" ${bloquee ? 'disabled' : ''}>
            <span class="opt-titre">${o.cle} — ${o.libelle} ${o.defaut ? '<span class="badge">défaut</span>' : ''}</span>
            <span class="opt-cout">Coût : ${eur(cout)}${o.capital ? ` · Capital préfecture −${o.capital}${bloquee ? ' (insuffisant)' : ''}` : ''}</span>
            <span class="opt-note">${o.note}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="modale-boutons">
        <button class="btn-lien" id="crise-reporter">⏳ Décider demain (le coût augmentera)</button>
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
      ['Fiscalité (taux > 18 %)', d.fiscalite, 'Redescendre le taux communal.'],
      ['Cadre de vie dégradé', d.cadreDeVie, 'Budgets voirie/propreté, équipements de proximité.'],
      ['Saturation des services', d.saturation, 'École, réseau d\'eau, stationnement : la capacité n\'a pas suivi.'],
      ['Suites d\'événements', d.evenements, 'Le temps fera son œuvre — si rien d\'autre ne casse.'],
    ].sort((a, b) => b[1] - a[1]);
    const max = Math.max(0.01, ...causes.map(c => c[1]));
    modale(`
      <h2>🔎 Pourquoi les gens partent</h2>
      <p class="note">Pression de départ totale : ${d.depart.toFixed(2)} %/mois · arrivées : ${d.arrivee.toFixed(2)} %/mois · solde : ${d.soldePct >= 0 ? '+' : ''}${d.soldePct.toFixed(2)} %/mois</p>
      <div class="composantes">
        ${causes.map(([n, v, conseil], i) => `<div class="composante">
          <span class="comp-nom">${i === 0 && v > 0 ? '➡️ ' : ''}${n}</span>
          <div class="barre grande"><div class="barre-rempli ${v > 0 ? 'basse' : ''}" style="width:${Math.round(v / max * 100)}%"></div></div>
          <span class="comp-val">${v.toFixed(2)} %</span>
          <span class="comp-conseil">${v > 0 ? conseil : ''}</span>
        </div>`).join('')}
      </div>
      <div class="modale-boutons"><button class="btn" id="modale-fermer">Compris</button></div>`);
    document.getElementById('modale-fermer').addEventListener('click', fermerModale);
  }

  function modaleFin(S) {
    const g = S.gameOver;
    modale(`
      <h2>${g.victoire ? '🎖️' : '🏳️'} ${g.titre}</h2>
      <p class="crise-texte">${g.texte}</p>
      ${!g.victoire ? '<p class="note">Perdre = perdre la commune. Jamais le compte, jamais le palmarès. Reprenez une commune — celle-ci vous attend, en pire.</p>' : ''}
      <div class="modale-boutons"><button class="btn" id="btn-rejouer">Reprendre une commune</button></div>`, { bloquant: true });
    document.getElementById('btn-rejouer').addEventListener('click', () => {
      E.effacerSauvegarde(); fermerModale(); ecranAccueil();
    });
  }

  /* ================= ÉVÉNEMENTS ================= */

  function brancherEvenements(S) {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };

    on('btn-jour', () => { E.avancerJour(); E.sauvegarder(); rendre(); });
    on('btn-semaine', () => { for (let i = 0; i < 7; i++) { if (E.etat.criseActive || E.etat.gameOver || E.evenementDu()) break; E.avancerJour(); } E.sauvegarder(); rendre(); });
    on('btn-nouvelle', () => { if (confirm('Abandonner cette commune et recommencer ?')) { E.effacerSauvegarde(); ecranAccueil(); } });
    on('btn-mission', () => { E.faireMissionRedressement(); E.sauvegarder(); rendre(); });
    on('btn-diag', () => modaleDiagnostic(S));
    on('btn-diag2', () => modaleDiagnostic(S));
    on('btn-crise', () => modaleCrise(S));

    /* Taux : aperçu live + projection avant vote */
    const slider = document.getElementById('slider-taux');
    if (slider) {
      const apercu = () => {
        const t = parseInt(slider.value, 10);
        document.getElementById('taux-affiche').textContent = t + ' %';
        const p = E.projeterTaux(t);
        document.getElementById('apercu-taux').innerHTML = t === S.taux ? '' :
          `Recettes fiscales : ${eur(p.fiscAvant)} → <b>${eur(p.fiscApres)}</b>/mois · Popularité ${p.dPop >= 0 ? '+' : ''}${p.dPop.toFixed(1)} · Solde migratoire projeté : ${signe(p.migAvant, nb)} → <b>${signe(p.migApres, nb)}</b> hab./mois`;
      };
      slider.addEventListener('input', apercu); apercu();
      on('btn-taux', () => {
        const t = parseInt(slider.value, 10);
        if (t === S.taux) return;
        const p = E.projeterTaux(t);
        modaleProjection({
          titre: `Voter un taux communal de ${t} %`,
          lignesFixes: [['Recettes fiscales mensuelles', `${eur(p.fiscAvant)} → ${eur(p.fiscApres)}`]],
          proj: p,
          effets: [`Popularité ${p.dPop >= 0 ? '+' : ''}${p.dPop.toFixed(1)} (au vote)`,
                   `Solde migratoire projeté : ${signe(p.migApres, nb)} hab./mois`,
                   'Application au mois prochain, jamais rétroactive'],
          libelleOk: 'Voter ce taux',
          onConfirme: () => { const r = E.changerTaux(t); if (!r.ok && r.msg) alert(r.msg); },
        });
      });
    }

    /* Budgets voirie / propreté */
    for (const id of ['voirie', 'proprete']) {
      const sl = document.getElementById(`slider-${id}`);
      if (!sl) continue;
      sl.addEventListener('input', () => { document.getElementById(`val-${id}`).textContent = eur(parseInt(sl.value, 10)); });
      on(`btn-${id}`, () => {
        const v = parseInt(sl.value, 10);
        const actuel = id === 'voirie' ? S.budgetVoirie : S.budgetProprete;
        const p = EngineProj(actuel - v);
        modaleProjection({
          titre: `Budget ${id === 'voirie' ? 'entretien voirie' : 'propreté & déchets'} : ${eur(v)}/mois`,
          proj: p,
          effets: [id === 'voirie'
            ? (v >= S.population * COEF.VOIRIE_PLEIN ? 'Voirie entretenue : plus aucune dégradation automatique' : 'Budget partiel : la voirie se dégradera lentement (annoncé, évitable)')
            : `La propreté convergera vers ${Math.round(Math.min(100, 100 * v / (S.population * COEF.PROPRETE_PLEIN)))}/100`],
          libelleOk: 'Valider ce budget',
          onConfirme: () => {
            if (id === 'voirie') S.budgetVoirie = v; else S.budgetProprete = v;
          },
        });
      });
    }

    /* Construction + dossiers */
    app().querySelectorAll('.btn-construire').forEach(b => b.addEventListener('click', () => {
      const p = E.projeterConstruction(b.dataset.equip);
      const charge = p.def.entretien + p.def.energie - p.def.recettes;
      modaleProjection({
        titre: `${p.def.icone} Construire : ${p.def.nom}`,
        lignesFixes: [['Coût', eur(p.cout)], ['Fonctionnement', `${charge >= 0 ? '+' : '−'} ${eur(Math.abs(charge))}/mois — à vie`]],
        proj: p,
        effets: [
          ...(p.def.effets.attractivite ? [`Attractivité +${p.def.effets.attractivite}`] : []),
          ...(p.def.effets.popularite ? [`Popularité +${p.def.effets.popularite}`] : []),
          ...(p.def.capacite ? [`Capacité d'accueil +${nb(p.def.capacite)} hab.`] : []),
          ...(p.def.proximite ? ['Équipements de proximité +6 (cadre de vie)'] : []),
          ...(p.def.chantier === 'voirie' ? ['État de la voirie remis à 95/100'] : []),
          ...(p.def.chantier === 'eclairage' ? ['Éclairage public remis à 92/100'] : []),
        ],
        libelleOk: 'Construire',
        onConfirme: () => { const r = E.construire(b.dataset.equip); if (!r.ok && r.msg) alert(r.msg); },
      });
    }));
    app().querySelectorAll('.btn-dossier').forEach(b => b.addEventListener('click', () => {
      E.deposerDossier(b.dataset.equip); E.sauvegarder(); rendre();
    }));

    /* Aides État */
    app().querySelectorAll('.btn-aide').forEach(b => b.addEventListener('click', () => {
      const r = E.aideEtat(b.dataset.aide);
      if (!r.ok && r.msg) alert(r.msg);
      E.sauvegarder(); rendre();
    }));

    /* Offres privées */
    app().querySelectorAll('.btn-offre-oui').forEach(b => b.addEventListener('click', () => {
      E.accepterOffre(b.dataset.offre); E.sauvegarder(); rendre();
    }));
    app().querySelectorAll('.btn-offre-non').forEach(b => b.addEventListener('click', () => {
      E.refuserOffre(b.dataset.offre); E.sauvegarder(); rendre();
    }));

    /* Emprunt */
    const se = document.getElementById('slider-emprunt');
    if (se) {
      const maj = () => {
        const cap = parseInt(se.value, 10);
        const duree = parseInt(document.getElementById('duree-emprunt').value, 10);
        document.getElementById('val-emprunt').textContent = eur(cap);
        const c = E.conditionsEmprunt();
        document.getElementById('mensualite-emprunt').textContent = `mensualité : ${eur(E.mensualite(cap, c.taux, duree))}`;
      };
      se.addEventListener('input', maj);
      document.getElementById('duree-emprunt').addEventListener('change', maj);
      maj();
      on('btn-emprunt', () => {
        const cap = parseInt(se.value, 10);
        const duree = parseInt(document.getElementById('duree-emprunt').value, 10);
        const p = E.projeterEmprunt(cap, duree);
        modaleProjection({
          titre: `Emprunter ${eur(cap)} sur ${duree} mois`,
          lignesFixes: [['Taux', (p.taux * 100).toFixed(2) + ' %'], ['Mensualité', `− ${eur(p.mensualite)}/mois, jusqu'à extinction`]],
          proj: p,
          effets: ['La mensualité s\'inscrit définitivement au fonctionnement'],
          libelleOk: 'Signer l\'emprunt',
          onConfirme: () => { const r = E.emprunter(cap, duree); if (!r.ok && r.msg) alert(r.msg); },
        });
      });
    }
  }

  /* Projection simple pour un delta mensuel (budgets d'entretien) */
  function EngineProj(deltaMensuel) {
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
  }

  return { rendre, ecranAccueil };
})();
