/* ============================================================
   BIG CITY — Interface (version simplifiée)
   4 onglets, 5 jetons, questions à choix multiples,
   projections avant chaque décision qui engage l'argent.
   ============================================================ */

const UI = (() => {
  const app = () => document.getElementById('app');
  const modalRoot = () => document.getElementById('modal-root');
  const E = Engine;
  let ongletActif = 'ville';

  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = E.fmtEuro, nb = E.fmtNb;
  const signe = (v, fmt = eur) => (v >= 0 ? '+' : '−') + fmt(Math.abs(v));

  /* ================= ÉCRAN D'ACCUEIL ================= */

  function ecranAccueil() {
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">Deviens maire · Fais grandir ta ville</p>
      <h1>Big <span class="filet">City</span></h1>
      <p class="sous-titre">Construis, réponds aux habitants, survis aux crises.
      Chaque bâtiment coûte pour toujours, chaque aide se paie un jour. Tu étais prévenu.</p>
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
        Mode chill — impossible de perdre (les alertes restent)</label>
    </div>`;
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
      modaleIntro();
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
        ${[['ville', '🏙️ Ma ville'], ['construire', '🏗️ Construire'], ['argent', '💶 Argent'], ['journal', '📜 Journal']]
          .map(([id, lbl]) => `<button class="onglet ${ongletActif === id ? 'actif' : ''}" data-onglet="${id}">${lbl}</button>`).join('')}
      </nav>
      <main class="contenu">${htmlOnglet(S)}</main>`;

    app().querySelectorAll('.onglet').forEach(b => b.addEventListener('click', () => { ongletActif = b.dataset.onglet; rendre(); }));
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
        <span class="mandat">— mois ${Math.min(S.mois, CFG.MANDAT_MOIS)}/${CFG.MANDAT_MOIS}${S.tranquille ? ' · 🕊️' : ''}</span></div>
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
      <div class="zoom-controles">
        <button id="zoom-plus" class="btn-zoom" title="Zoomer">+</button>
        <button id="zoom-moins" class="btn-zoom" title="Dézoomer — découvre les villes voisines">−</button>
        <button id="zoom-reset" class="btn-zoom" title="Recentrer sur ta commune">⌖</button>
      </div>
      <span class="chip-aide">🖐️ glisse pour te balader · 🔍 molette ou pincement pour zoomer</span>
      ${crise ? `<button class="marqueur-crise" id="btn-crise-carte" title="${crise.nom} — cliquer pour décider"
        style="left:${(posC.x * 100).toFixed(1)}%;top:${(posC.y * 100).toFixed(1)}%">${crise.icone}</button>` : ''}
    </div>
    <div class="jauges">
      <div class="jauge ${clTreso}"><span class="jauge-nom">💰 Trésorerie</span>
        <span class="jauge-val">${eur(S.tresorerie)}</span>
        <span class="jauge-sub">${S.tresorerie < 0 ? '⚠ négative !' : Math.round(jours) + ' j de réserve · ' + signe(solde) + '/mois'}</span></div>
      <div class="jauge ${clPop}"><span class="jauge-nom">👥 Population</span>
        <span class="jauge-val">${nb(S.population)}</span>
        <span class="jauge-sub">${S.dernierSoldeMigratoire === 0 ? 'stable' : signe(S.dernierSoldeMigratoire, nb) + ' le mois dernier'}</span></div>
      ${jauge100('❤️ Popularité', S.popularite)}
      ${jauge100('✨ Attractivité', S.attractivite)}
      ${jauge100('🌳 Cadre de vie', cadre)}
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
      b.push(`<div class="bandeau orange">🟧 <b>Alerte budgétaire</b> — moins de 15 jours de caisse. Monte les impôts, gèle un chantier ou demande de l'aide (onglet 💶 Argent).</div>`);
    if (S.paliers.fin === 'redressement') {
      const j = E.joursRedressementRestants();
      b.push(`<div class="bandeau rouge">🟥 <b>Plan de redressement</b> — ${j} jour(s) pour repasser au-dessus de zéro, sinon tu perds la ville. Constructions gelées, emprunt coupé, impôts plancher à 15 %.
        ${E.missionRedressementDispo() ? `<button id="btn-mission" class="btn-mini">🗂️ Mission du jour (+${eur(CFG.MISSION_REDRESSEMENT)})</button>` : '<span class="fait">mission du jour faite ✓</span>'}</div>`);
    }
    if (S.paliers.demo === 'alerte')
      b.push(`<div class="bandeau orange">🟧 <b>Les habitants commencent à partir</b> (−5 %). <button id="btn-diag" class="btn-mini">Voir pourquoi</button></div>`);
    if (S.paliers.demo === 'declin')
      b.push(`<div class="bandeau rouge">🟥 <b>Exode !</b> Plus de 10 % de départs — à −15 %, c'est fini. <button id="btn-diag" class="btn-mini">Voir pourquoi</button></div>`);
    if (S.criseActive) {
      const c = CRISES.find(x => x.id === S.criseActive.criseId);
      b.push(`<div class="bandeau rouge">🚨 <b>Crise : ${c.nom}</b> — ${eur(S.criseActive.coutCourant)}, et ça grimpe chaque jour. <button id="btn-crise" class="btn-mini">Décider</button></div>`);
    }
    return b.length ? `<div class="bandeaux">${b.join('')}</div>` : '';
  }

  /* ================= ONGLETS ================= */

  function htmlOnglet(S) {
    switch (ongletActif) {
      case 'ville': return htmlVille(S);
      case 'construire': return htmlConstruire(S);
      case 'argent': return htmlArgent(S);
      case 'journal': return htmlJournal(S);
    }
  }

  /* ---- Ma ville ---- */

  function htmlVille(S) {
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
          ${ratio('Gagné / mois', signe(solde), solde < 0, 'recettes − dépenses, chaque mois')}
          ${ratio('Jours de caisse', S.tresorerie < 0 ? '—' : Math.round(jours) + ' j', jours < 15, 'alerte sous 15 jours')}
          ${ratio('Dette', dette.toFixed(0) + ' %', dette > 100, 'emprunt coupé au-delà de 100 %')}
        </div>
      </section>
      <section class="carte">
        <h2>Qui arrive, qui s'en va</h2>
        <p>Tendance : <b>${signe(Math.round(S.population * mig.diagnostic.soldePct / 100), nb)} hab./mois</b></p>
        <p>Place disponible : <b>${nb(E.capaciteEquipements())} hab.</b>
           ${sat > 0 ? `<span class="texte-orange">Ta ville déborde (+${sat.toFixed(0)} %) — construis école, eau ou parking !</span>` : '— ça va.'}</p>
        <button class="btn" id="btn-diag2">🔎 Pourquoi les gens partent ?</button>
      </section>
    </div>
    <div class="grille-2">
      <section class="carte">
        <h2>Trésorerie</h2>
        ${graphique(S.historique.map(h => h.tresorerie), '#3F97DB', v => eur(v), S.tresorerie)}
      </section>
      <section class="carte">
        <h2>Population</h2>
        ${graphique(S.historique.map(h => h.populationFin), '#62B857', v => nb(v) + ' hab.', S.population)}
      </section>
    </div>
    <section class="carte">
      <h2>Cadre de vie — ce qui fait rester les habitants</h2>
      ${composantesCadre(S)}
    </section>`;
  }

  function ratio(nom, val, alerte, aide) {
    return `<div class="ratio ${alerte ? 'alerte' : ''}" title="${aide}">
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

  /* Petit graphique SVG mono-série */
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

  /* ---- Construire ---- */

  function htmlConstruire(S) {
    return `
    <p class="avert">⚠️ <b>Chaque bâtiment coûte tous les mois, pour toujours.</b> Tu verras la projection avant de valider.</p>
    <div class="grille-cartes">
      ${EQUIPEMENTS.map(def => {
        const test = E.peutConstruire(def);
        const charge = def.entretien + def.energie - def.recettes;
        const dejaN = S.equipements.filter(e => e.type === def.id).length;
        return `<div class="carte equip ${test.ok ? '' : 'grise'}">
          <h3>${def.icone} ${def.nom} ${dejaN ? `<span class="badge">×${dejaN}</span>` : ''}</h3>
          <p class="equip-desc">${def.desc}</p>
          <div class="equip-chiffres">
            <span>💰 <b>${eur(def.cout)}</b></span>
            <span>${charge > 0 ? '📉' : '📈'} <b class="${charge > 0 ? 'texte-rouge' : 'texte-vert'}">${charge >= 0 ? '−' : '+'}${eur(Math.abs(charge))}/mois</b></span>
            ${def.capacite ? `<span>👥 +${nb(def.capacite)} de place</span>` : ''}
            ${def.effets.attractivite ? `<span>✨ +${def.effets.attractivite}</span>` : ''}
            ${def.effets.popularite ? `<span>❤️ +${def.effets.popularite}</span>` : ''}
          </div>
          <div class="equip-actions">
            <button class="btn btn-construire" data-equip="${def.id}" ${test.ok ? '' : 'disabled'}>Construire</button>
          </div>
          ${!test.ok ? `<p class="note-inline">${test.msg}</p>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  }

  /* ---- Argent ---- */

  function htmlArgent(S) {
    const r = E.recettes(), d = E.depenses();
    const rec = r.fiscalite + r.dotation + r.services;
    const dep = d.personnel + d.energie + d.entretien + d.dette;
    const solde = rec - dep;
    const c = E.conditionsEmprunt();
    const chargesEquip = S.equipements.map(e => {
      const def = E.defEquip(e.type);
      return [def, def.entretien + def.energie - def.recettes];
    }).filter(([, net]) => net !== 0);
    const presetsEmprunt = [
      ['Petit', arrondi50k(S.population * 40)],
      ['Moyen', arrondi50k(S.population * 80)],
      ['Gros', arrondi50k(S.population * 160)],
    ];
    return `
    <div class="grille-2">
      <section class="carte">
        <h2>💶 Impôts locaux</h2>
        <p class="note">Ton levier principal. Modifiable une fois par mois, effet le mois d'après.</p>
        <div class="ligne-taux">
          <input type="range" id="slider-taux" min="${CFG.TAUX_MIN}" max="${CFG.TAUX_MAX}" step="1"
            value="${S.tauxProchain ?? S.taux}" ${S.tauxChangeCeMois ? 'disabled' : ''}>
          <span id="taux-affiche" class="taux-val">${S.tauxProchain ?? S.taux} %</span>
        </div>
        <div id="apercu-taux" class="apercu"></div>
        <button class="btn" id="btn-taux" ${S.tauxChangeCeMois ? 'disabled' : ''}>
          ${S.tauxChangeCeMois ? (S.tauxProchain !== null ? `Voté : ${S.tauxProchain} % au mois prochain` : 'Déjà modifié ce mois-ci') : 'Voter ce taux'}
        </button>
        <hr>
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
        <p class="note-inline">Dispo pour construire : ${eur(E.capaciteInvestissement())} (15 jours de caisse toujours gardés de côté).</p>
      </section>
    </div>
    <div class="grille-2">
      <section class="carte">
        <h2>🏦 Emprunter</h2>
        ${c.bloque ? '<p class="avert">Emprunt indisponible (dette trop élevée ou plan de redressement).</p>' : `
        <p class="note">L'argent tout de suite, une mensualité pour 5 ans. Taux actuel : ${(c.taux * 100).toFixed(1)} %.</p>
        <div class="presets">
          ${presetsEmprunt.map(([lbl, cap]) => {
            const possible = cap <= c.capaciteMax;
            return `<button class="preset btn-emprunt" data-capital="${cap}" ${possible ? '' : 'disabled'}>
              <span class="preset-nom">${lbl}</span>
              <span class="preset-detail">${eur(cap)}</span>
              <span class="preset-note">−${eur(E.mensualite(cap, c.taux, 60))}/mois pendant 60 mois</span>
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
    </div>
    <section class="carte">
      <h2>💼 Offres privées</h2>
      ${S.offresEnCours.length ? S.offresEnCours.map(oe => {
        const o = OFFRES_PRIVEES.find(x => x.id === oe.id);
        return `<div class="offre">
          <p><b>${o.icone} ${o.nom}</b> — ${o.texte}</p>
          <p>💰 <b>${eur(o.montant)}</b> tout de suite · 🎁 contrepartie surprise dans <b>${o.delai} jours</b></p>
          <button class="btn btn-offre-oui" data-offre="${o.id}">Prendre l'argent</button>
          <button class="btn-lien btn-offre-non" data-offre="${o.id}">Décliner</button>
        </div>`;
      }).join('') : '<p class="note">Rien pour l\'instant. Les mécènes ont un flair certain pour les mairies fauchées — ils reviendront.</p>'}
      ${S.effetsDifferes.filter(e => e.evenement).length ? `<h3>Ce que tu dois encore…</h3>
        <ul class="liste-simple">${S.effetsDifferes.filter(e => e.evenement).map(e =>
          `<li>⏳ ${esc(e.source || 'Contrepartie')} — dans ${e.jour - S.jour} jour(s)</li>`).join('')}</ul>` : ''}
    </section>`;
  }

  function coutNiveau(S, facteur) {
    return Math.round(S.population * COEF.VOIRIE_PLEIN * facteur) + Math.round(S.population * 1.0 * facteur);
  }
  function arrondi50k(v) { return Math.max(100000, Math.round(v / 50000) * 50000); }

  /* ---- Journal ---- */

  function htmlJournal(S) {
    return `
    <div class="grille-2">
      <section class="carte">
        <h2>📜 La vie de la commune</h2>
        <ul class="journal">${S.journal.map(l => `<li><span class="jour-tag">J${l.jour}</span> ${l.txt}</li>`).join('')}</ul>
      </section>
      <section class="carte">
        <h2>📊 Mois par mois</h2>
        ${S.historique.length ? `<div class="table-scroll"><table class="table-budget serree">
          <tr class="entete-table"><td>Mois</td><td class="mont">Solde</td><td class="mont">Population</td></tr>
          ${[...S.historique].reverse().map(h =>
            `<tr><td>${h.nomMois} A${h.annee}</td>
              <td class="mont ${h.solde < 0 ? 'texte-rouge' : ''}">${signe(h.solde)}</td>
              <td class="mont">${nb(h.populationFin)} (${signe(h.soldeMigratoire, nb)})</td></tr>`).join('')}
        </table></div>` : '<p class="note">Premier bilan à la fin du mois.</p>'}
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

  function toast(txt) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = txt;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('visible'), 20);
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 400); }, 3600);
  }

  /* Tutoriel express au premier lancement */
  function modaleIntro() {
    const S = E.etat;
    modale(`
      <h2>👋 Bienvenue à ${esc(S.commune)}, M. le Maire !</h2>
      <ul class="regles">
        <li>🏗️ <b>Construis</b> pour attirer des habitants — mais chaque bâtiment coûte <b>tous les mois, pour toujours</b>.</li>
        <li>💰 <b>Garde de l'avance</b> : sous 15 jours de caisse, alerte. En négatif, 30 jours pour te rattraper.</li>
        <li>👥 <b>Retiens tes habitants</b> : si 15 % s'en vont, tu perds la ville.</li>
        <li>📬 <b>Réponds au courrier</b> et gère les crises. L'État peut aider… avec modération.</li>
      </ul>
      <div class="modale-boutons"><button class="btn" id="btn-intro-ok">C'est parti !</button></div>`, { bloquant: true });
    document.getElementById('btn-intro-ok').addEventListener('click', fermerModale);
  }

  /* L'écran de projection — toujours avant de payer */
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

  /* Courrier du maire : question à choix multiples */
  function modaleQuestion(S) {
    const q = QUESTIONS.find(x => x.id === S.questionActive);
    if (!q) return;
    modale(`
      <h2>📬 Courrier du maire</h2>
      <p class="crise-texte">${q.icone} ${q.texte}</p>
      <div class="crise-options">
        ${q.options.map((o, i) => {
          const cout = o.effets.tresorerie || 0;
          return `<button class="option-crise option-question" data-i="${i}">
            <span class="opt-titre">${o.libelle}</span>
            ${cout ? `<span class="opt-cout ${cout > 0 ? 'texte-vert' : ''}">${signe(cout)}</span>` : ''}
          </button>`;
        }).join('')}
      </div>`, { bloquant: true });
    modalRoot().querySelectorAll('.option-question').forEach(b => b.addEventListener('click', () => {
      const res = E.resoudreQuestion(parseInt(b.dataset.i, 10));
      fermerModale(); E.sauvegarder(); rendre();
      if (res.note) toast(`${res.icone} ${res.note}`);
    }));
  }

  function modaleCrise(S) {
    const c = S.criseActive;
    const crise = CRISES.find(x => x.id === c.criseId);
    const joursRestants = CFG.CRISE_DELAI_JOURS - (S.jour - c.jourDebut);
    modale(`
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
      ['💶 Impôts trop hauts (> 18 %)', d.fiscalite, 'Redescends le taux dans l\'onglet Argent.'],
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

    on('btn-jour', () => { E.avancerJour(); E.sauvegarder(); rendre(); });
    on('btn-semaine', () => {
      for (let i = 0; i < 7; i++) {
        if (E.etat.criseActive || E.etat.questionActive || E.etat.gameOver || E.evenementDu()) break;
        E.avancerJour();
      }
      E.sauvegarder(); rendre();
    });
    on('btn-nouvelle', () => { if (confirm('Abandonner cette ville et recommencer ?')) { E.effacerSauvegarde(); ecranAccueil(); } });
    on('btn-mission', () => { E.faireMissionRedressement(); E.sauvegarder(); rendre(); });
    on('btn-diag', () => modaleDiagnostic(S));
    on('btn-diag2', () => modaleDiagnostic(S));
    on('btn-crise', () => modaleCrise(S));

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
        onConfirme: () => { const r = E.construire(b.dataset.equip); if (!r.ok && r.msg) alert(r.msg); },
      });
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
        onConfirme: () => { const r = E.emprunter(cap, 60); if (!r.ok && r.msg) alert(r.msg); },
      });
    }));
  }

  /* Projection simple pour un delta mensuel */
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
    if (S.questionActive) return modaleQuestion(S);
  }

  return { rendre, ecranAccueil };
})();
