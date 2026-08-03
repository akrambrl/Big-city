/* ============================================================
   BIG CITY LIFE — Interface
   Carte vivante où l'on se déplace de lieu en lieu, chaque
   activité fait avancer le temps d'un mois. Sims × Pokémon.
   ============================================================ */

const UI = (() => {
  const app = () => document.getElementById('app');
  const modalRoot = () => document.getElementById('modal-root');
  const E = Vie;
  let vueActive = 'ville';
  let notifsOuvertes = false;
  let persoSuivi = null;
  let finJouee = false;

  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nb = (v) => Math.round(v).toLocaleString('fr-FR');
  const eur = (v) => nb(v) + ' €';

  /* état pour la carte : décalage pour que les saisons collent (départ en septembre) */
  const etatCarte = () => ({ ...E.etat, mois: E.etat.mois + 5 });

  /* ================= CRÉATION : ville → perso → famille → amis → filière ================= */

  function ambianceDeLaVille(v) {
    if (v.littoral) return 'touristique';
    if (v.pop < 3500) return 'rurale';
    return 'moyenne';
  }

  function ecranAccueil() {
    let villeChoisie = null;
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">Big City Life · Ta vie commence ici</p>
      <h1>Où veux-tu <span class="filet">grandir</span> ?</h1>
      <p class="sous-titre">Choisis ta ville parmi les ${COMMUNES_FR.nombre.toLocaleString('fr-FR')} communes de France.
      Tu y feras ton lycée, tes amis, tes premières payes et tes plus gros fous rires.</p>
      <div class="recherche-bloc">
        <input type="search" id="recherche-ville" placeholder="🔎 Cherche ta ville… (Lille, Aurillac, Bandol…)"
          autocomplete="off" spellcheck="false">
        <div id="resultats-villes" class="resultats" role="listbox"></div>
        <button id="ville-hasard" class="btn-lien">🎲 Une ville au hasard</button>
      </div>
      <div id="etape-ville" class="etape-ambiance" hidden>
        <p class="ville-choisie" id="ville-choisie-txt"></p>
        <div class="profils" id="apercu-ville"></div>
        <p style="margin-top:1em"><button class="btn btn-grand" id="btn-continuer">Grandir ici ▸</button></p>
      </div>
      <p class="note" style="margin-top:2em"><a class="btn-lien" href="maire.html">🏛️ L'autre jeu : deviens maire</a></p>
    </div>`;

    const champ = document.getElementById('recherche-ville');
    const resultats = document.getElementById('resultats-villes');
    function afficherResultats() {
      const villes = COMMUNES_FR.chercher(champ.value);
      resultats.innerHTML = villes.map((v, i) =>
        `<button class="resultat-ville" data-i="${i}"><b>${esc(v.nom)}</b> <span class="badge">${esc(v.dept)}</span>
          <span class="resultat-pop">${nb(v.pop)} hab.</span></button>`).join('');
      resultats.querySelectorAll('.resultat-ville').forEach(b =>
        b.addEventListener('click', () => choisir(villes[parseInt(b.dataset.i, 10)])));
    }
    champ.addEventListener('input', afficherResultats);
    document.getElementById('ville-hasard').addEventListener('click', () => choisir(COMMUNES_FR.auHasard(1000)));

    function choisir(v) {
      villeChoisie = v;
      champ.value = `${v.nom} (${v.dept})`;
      resultats.innerHTML = '';
      document.getElementById('etape-ville').hidden = false;
      document.getElementById('ville-choisie-txt').innerHTML =
        `🏙️ <b>${esc(v.nom)}</b> (${esc(v.dept)}) — ${nb(v.pop)} habitants, dont bientôt toi.`;
      const ambiance = ambianceDeLaVille(v);
      document.getElementById('apercu-ville').innerHTML = `
        <div class="carte-profil ambiance choisie apercu-seul">
          <canvas class="mini-carte" id="mini-carte-ville"></canvas>
          <span class="profil-label">ta ville (carte stylisée)</span>
        </div>`;
      CarteCommune.dessiner(document.getElementById('mini-carte-ville'), {
        commune: v.nom, profil: ambiance, mois: 1, equipements: [],
        population: v.pop, populationInitiale: v.pop, cadre: { voirie: 70 },
      });
    }
    document.getElementById('btn-continuer').addEventListener('click', () => {
      if (!villeChoisie) return;
      FX.son('clic');
      ecranPerso(villeChoisie);
    });
  }

  function ecranPerso(ville) {
    let genre = null, emoji = null;
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">${esc(ville.nom)} · Nouvelle vie</p>
      <h1>Qui es-<span class="filet">tu</span> ?</h1>
      <section class="carte carte-creation">
        <h2>Tu es…</h2>
        <div class="presets choix-genres">
          <button class="preset choix-genre" data-genre="homme"><span class="preset-nom">👦 Un garçon</span></button>
          <button class="preset choix-genre" data-genre="femme"><span class="preset-nom">👧 Une fille</span></button>
        </div>
        <div id="bloc-tete" hidden><h2>Ta tête</h2><div class="grille-tetes" id="grille-tetes"></div></div>
        <div id="bloc-prenom" hidden><h2>Ton prénom</h2>
          <input type="text" id="prenom-perso" maxlength="20" placeholder="Sacha, Jade, Noa…" autocomplete="off"></div>
        <p style="margin-top:1.2em"><button class="btn btn-grand" id="btn-perso-ok" disabled>Continuer ▸</button></p>
      </section>
    </div>`;
    const majBouton = () => {
      document.getElementById('btn-perso-ok').disabled =
        !(genre && emoji && document.getElementById('prenom-perso').value.trim().length >= 2);
    };
    app().querySelectorAll('.choix-genre').forEach(b => b.addEventListener('click', () => {
      genre = b.dataset.genre; emoji = null;
      app().querySelectorAll('.choix-genre').forEach(x => x.classList.toggle('actif', x === b));
      const grille = document.getElementById('grille-tetes');
      grille.innerHTML = AVATARS_VIE[genre].map(a => `<button class="choix-tete" data-emoji="${a}">${a}</button>`).join('');
      document.getElementById('bloc-tete').hidden = false;
      document.getElementById('bloc-prenom').hidden = false;
      grille.querySelectorAll('.choix-tete').forEach(x => x.addEventListener('click', () => {
        emoji = x.dataset.emoji;
        grille.querySelectorAll('.choix-tete').forEach(y => y.classList.toggle('actif', y === x));
        FX.son('clic'); majBouton();
      }));
      majBouton();
    }));
    document.getElementById('prenom-perso').addEventListener('input', majBouton);
    document.getElementById('btn-perso-ok').addEventListener('click', () => {
      FX.son('clic');
      ecranFamille(ville, { prenom: document.getElementById('prenom-perso').value.trim(), genre, emoji });
    });
  }

  function ecranFamille(ville, perso) {
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">Étape 2 / 4</p>
      <h1>Ta <span class="filet">famille</span></h1>
      <p class="sous-titre">On ne la choisit pas, dit-on. Ici, si.</p>
      <div class="grille-cartes" style="max-width:720px;margin:0 auto;text-align:left">
        ${FAMILLES.map(f => `
          <button class="carte equip choix-famille" data-id="${f.id}">
            <h3>${f.icone} ${f.nom}</h3>
            <p class="equip-desc">${f.desc}</p>
            <div class="equip-chiffres"><span>💰 ${f.argentPoche} €/mois d'argent de poche</span></div>
          </button>`).join('')}
      </div>
    </div>`;
    app().querySelectorAll('.choix-famille').forEach(b => b.addEventListener('click', () => {
      FX.son('clic');
      ecranAmis(ville, perso, b.dataset.id);
    }));
  }

  function ecranAmis(ville, perso, familleId) {
    const choisis = new Set();
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">Étape 3 / 4</p>
      <h1>Tes <span class="filet">amis</span></h1>
      <p class="sous-titre">Choisis-en deux. Les meilleurs, ça se compte sur une main de toute façon.</p>
      <div class="grille-cartes" style="max-width:720px;margin:0 auto;text-align:left">
        ${AMIS.map(a => `
          <button class="carte equip choix-ami" data-id="${a.id}">
            <h3>${a.icone} ${a.nom} <span class="badge">${a.titre}</span></h3>
            <p class="equip-desc">${a.desc}</p>
          </button>`).join('')}
      </div>
      <p style="margin-top:1.2em"><button class="btn btn-grand" id="btn-amis-ok" disabled>Continuer ▸ (0/2)</button></p>
    </div>`;
    const maj = () => {
      const btn = document.getElementById('btn-amis-ok');
      btn.textContent = `Continuer ▸ (${choisis.size}/2)`;
      btn.disabled = choisis.size !== 2;
    };
    app().querySelectorAll('.choix-ami').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id;
      if (choisis.has(id)) { choisis.delete(id); b.classList.remove('choisie'); }
      else if (choisis.size < 2) { choisis.add(id); b.classList.add('choisie'); FX.son('clic'); }
      maj();
    }));
    document.getElementById('btn-amis-ok').addEventListener('click', () => {
      ecranFiliere(ville, perso, familleId, [...choisis]);
    });
  }

  function ecranFiliere(ville, perso, familleId, amisIds) {
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">Étape 4 / 4</p>
      <h1>Ta <span class="filet">filière</span></h1>
      <p class="sous-titre">Le lycée commence. Générale, techno ou pro — aucune n'est un piège, toutes mènent quelque part.</p>
      <div class="grille-cartes" style="max-width:720px;margin:0 auto;text-align:left">
        ${FILIERES.map(f => `
          <button class="carte equip choix-filiere" data-id="${f.id}">
            <h3>${f.icone} ${f.nom}</h3>
            <p class="equip-desc">${f.desc}</p>
          </button>`).join('')}
      </div>
    </div>`;
    app().querySelectorAll('.choix-filiere').forEach(b => b.addEventListener('click', () => {
      const ambiance = ambianceDeLaVille(ville);
      E.nouvellePartie({
        ville: { nom: ville.nom, dept: ville.dept, pop: ville.pop, littoral: !!ville.littoral,
          voisines: COMMUNES_FR.voisines(ville.dept, ville.nom, 7) },
        ambiance, perso, familleId, amisIds, filiereId: b.dataset.id,
      });
      E.sauvegarder();
      vueActive = 'ville';
      const famille = FAMILLES.find(f => f.id === familleId);
      const copains = amisIds.map(id => AMIS.find(a => a.id === id));
      cinematique([
        { emoji: '📦', titre: 'La nouvelle vie', texte: `${ville.nom}. ${famille.ambiance} C'est ici que tout va se jouer : le lycée, les potes, les premières payes, les grandes décisions.` },
        { emoji: '🎒', titre: 'Jour de rentrée', texte: `Devant la grille du lycée, sac trop lourd, boule au ventre. ${copains[0].icone} ${copains[0].nom} et ${copains[1].icone} ${copains[1].nom} te font signe : « ${perso.prenom} ! Par ici ! » Ça va aller.` },
        { emoji: '🗺️', titre: 'Ta ville t\'attend', texte: 'Le café, le stade, le parc, le ciné… Chaque sortie fait avancer le temps d\'un mois. À toi de doser : les potes, les cours, le sommeil — et le bac dans trois ans.' },
      ], () => { FX.son('niveau'); FX.confettis(['🎒', '🎉', '✨']); rendre(); });
    }));
  }

  /* ================= RENDU PRINCIPAL ================= */

  function rendre() {
    const S = E.etat;
    if (!S) return ecranAccueil();
    const b = E.bonheur();
    const sur5 = (b.note / 20).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const clNote = b.note >= 60 ? 'bonne' : b.note >= 40 ? 'moyenne' : 'mauvaise';
    const nonLues = E.notifsNonLues();
    if (persoSuivi !== S.perso.prenom + S.commune) { persoSuivi = S.perso.prenom + S.commune; finJouee = false; }
    const obj = E.objectifCourant();

    app().innerHTML = `
    <div class="coque">
      <header class="barre-haut">
        <button id="btn-note" class="badge-note ${clNote}" title="Ton bonheur — touche pour le détail">
          <span class="note-etoile">⭐</span><span class="note-val">${sur5}</span><span class="note-max">/5</span>
        </button>
        <div class="titre-app">
          <span class="nom-ville">${S.perso.emoji} ${esc(S.perso.prenom)} · ${esc(S.commune)}</span>
          <span class="date-app">${E.age()} ans · ${NOMS_MOIS_VIE[E.moisCalendaire()]} · ${E.NOMS_PHASE[E.phase()]} (${E.classeActuelle()})</span>
        </div>
        <div class="chips-haut">
          <span class="chip-ressource" title="Ton argent">💰 ${eur(S.argent)}</span>
          <button id="btn-son" class="btn-cloche" title="${FX.muet ? 'Réactiver le son' : 'Couper le son'}">${FX.muet ? '🔇' : '🔊'}</button>
          <button id="btn-notifs" class="btn-cloche" title="Notifications">🔔${nonLues ? `<span class="pastille">${nonLues}</span>` : ''}</button>
        </div>
      </header>
      <div class="strip-stats">
        ${chipStat('⚡', S.stats.energie)}${chipStat('😊', S.stats.moral)}${chipStat('🧠', S.stats.savoir)}
        ${chipStat('🫂', S.stats.social)}${chipStat('💪', S.stats.forme)}
      </div>
      ${obj ? `<div class="barre-objectif">🎯 <b>Objectif :</b> ${obj.icone} ${obj.texte}
        <span class="obj-recompense">+${obj.xp} XP</span></div>` : ''}
      <main class="vue vue-${vueActive === 'ville' ? 'carte' : 'autre'}">${htmlVue(S)}</main>
      ${vueActive === 'ville' ? `<div class="pilule-temps">
        <button id="btn-passer-mois" class="btn-temps" title="Un mois sans rien de spécial">😴 Passer le mois</button>
      </div>` : ''}
      <nav class="barre-bas">
        ${[['ville', '🗺️', 'Ville'], ['moi', '🎒', 'Moi'], ['amis', '🫂', 'Amis'], ['journal', '📔', 'Journal']]
          .map(([id, ic, lbl]) => `<button class="nav-btn ${vueActive === id ? 'actif' : ''}" data-vue="${id}">
            <span class="nav-ic">${ic}${id === 'ville' && S.sceneActive ? '<span class="pastille">!</span>' : ''}</span>
            <span class="nav-lbl">${lbl}</span></button>`).join('')}
      </nav>
      ${notifsOuvertes ? htmlPanneauNotifs(S) : ''}
    </div>`;

    app().querySelectorAll('.nav-btn').forEach(x => x.addEventListener('click', () => {
      vueActive = x.dataset.vue; notifsOuvertes = false; rendre();
    }));
    const carte = document.getElementById('carte');
    if (carte) {
      CarteCommune.attacher(carte, etatCarte(), placerMarqueurs);
      CarteCommune.dessiner(carte, etatCarte());
    }
    brancherEvenements(S);
    afficherModalesAutomatiques(S);
  }

  function chipStat(ic, v) {
    const cl = v < 25 ? 'basse' : '';
    return `<span class="chip-stat ${cl}" title="${ic} ${Math.round(v)}/100">${ic}
      <span class="chip-stat-barre"><span style="width:${Math.round(v)}%"></span></span></span>`;
  }

  let minuteurRedim = null;
  window.addEventListener('resize', () => {
    clearTimeout(minuteurRedim);
    minuteurRedim = setTimeout(() => {
      const carte = document.getElementById('carte');
      if (carte && E.etat) CarteCommune.dessiner(carte, etatCarte());
    }, 150);
  });

  /* ---- positionnement des lieux et de ton avatar sur la carte ---- */

  function placerMarqueurs() {
    const S = E.etat;
    if (!S) return;
    for (const lieu of LIEUX) {
      const el = document.getElementById(`lieu-${lieu.id}`);
      if (!el) continue;
      const p = CarteCommune.versEcranPct(lieu.pos);
      el.style.left = p.x.toFixed(1) + '%';
      el.style.top = p.y.toFixed(1) + '%';
      el.style.display = p.visible ? '' : 'none';
    }
    const moi = document.getElementById('marqueur-moi');
    if (moi) {
      const lieu = LIEUX.find(l => l.id === S.position) || LIEUX[0];
      const p = CarteCommune.versEcranPct({ x: lieu.pos.x + 0.018, y: lieu.pos.y + 0.02 });
      moi.style.left = p.x.toFixed(1) + '%';
      moi.style.top = p.y.toFixed(1) + '%';
      moi.style.display = p.visible ? '' : 'none';
    }
  }

  /* ================= VUES ================= */

  function htmlVue(S) {
    switch (vueActive) {
      case 'ville': return htmlVueVille(S);
      case 'moi': return htmlVueMoi(S);
      case 'amis': return htmlVueAmis(S);
      case 'journal': return htmlVueJournal(S);
    }
  }

  function htmlVueVille(S) {
    const saison = E.saisonVie();
    const EMOJI_SAISON = { hiver: '❄️', printemps: '🌱', ete: '☀️', automne: '🍂' };
    const lieuxDispo = LIEUX.filter(l => l.id !== 'eau' || S.profil !== 'rurale' || true);
    return `
    <div class="carte-monde pleine">
      <canvas id="carte" role="img" aria-label="Ta ville : ${esc(S.commune)}"></canvas>
      <span class="chip-carte">${EMOJI_SAISON[saison]} ${NOMS_MOIS_VIE[E.moisCalendaire()]} · ${E.age()} ans</span>
      <div class="zoom-controles">
        <button id="zoom-plus" class="btn-zoom">+</button>
        <button id="zoom-moins" class="btn-zoom">−</button>
        <button id="zoom-reset" class="btn-zoom">⌖</button>
      </div>
      <span class="chip-aide">📍 touche un lieu pour y aller — chaque sortie = un mois</span>
      ${lieuxDispo.map(l => `<button class="marqueur-lieu" id="lieu-${l.id}" data-lieu="${l.id}"
        title="${l.nom}" style="left:${l.pos.x * 100}%;top:${l.pos.y * 100}%">${l.icone}</button>`).join('')}
      <span class="marqueur-moi" id="marqueur-moi">${S.perso.emoji}</span>
    </div>`;
  }

  function htmlVueMoi(S) {
    const b = E.bonheur();
    const famille = FAMILLES.find(f => f.id === S.familleId);
    const fil = FILIERES.find(f => f.id === S.filiereId);
    const stats = [['⚡ Énergie', S.stats.energie], ['😊 Moral', S.stats.moral], ['🧠 Savoir', S.stats.savoir],
      ['🫂 Social', S.stats.social], ['💪 Forme', S.stats.forme]];
    return `
    <div class="defilable">
      <section class="carte carte-maire">
        <div class="fiche-maire">
          <span class="maire-avatar">${S.perso.emoji}</span>
          <div>
            <p class="maire-nom">${esc(S.perso.prenom)}, ${E.age()} ans — ${esc(S.commune)}</p>
            <p class="maire-trait">${famille.icone} ${famille.nom} · ${fil.icone} filière ${fil.nom}</p>
            <p class="note-inline">${E.NOMS_PHASE[E.phase()]} : ${E.classeActuelle()} · revenu ${eur(E.revenuMensuel())}/mois</p>
          </div>
        </div>
      </section>
      <section class="carte">
        <h2>⭐ Niveau ${S.niveau} · XP ${S.xp}/${E.xpPourNiveau(S.niveau)}</h2>
        <div class="composantes">
          ${stats.map(([n, v]) => `<div class="composante"><span class="comp-nom">${n}</span>
            <div class="barre grande"><div class="barre-rempli ${v < 30 ? 'basse' : ''}" style="width:${Math.round(v)}%"></div></div>
            <span class="comp-val">${Math.round(v)}</span></div>`).join('')}
        </div>
      </section>
      ${S.rechercheEmploi && !S.metierId ? `<section class="carte courrier-actif">
        <h2>💼 En recherche d'emploi</h2>
        <p class="note">Intérim en attendant (300 €/mois). Choisis un métier et va convaincre en entretien !</p>
        <button class="btn" id="btn-emplois">Voir les métiers & postuler</button>
      </section>` : ''}
      ${(S.talents.foot > 5 || S.talents.musique > 5) ? `<section class="carte">
        <h2>🌟 Tes talents cachés</h2>
        <div class="composantes">
          ${S.talents.foot > 5 ? `<div class="composante"><span class="comp-nom">⚽ Foot</span>
            <div class="barre grande"><div class="barre-rempli pref" style="width:${Math.round(S.talents.foot)}%"></div></div>
            <span class="comp-val">${Math.round(S.talents.foot)}</span></div>` : ''}
          ${S.talents.musique > 5 ? `<div class="composante"><span class="comp-nom">🎤 Chant</span>
            <div class="barre grande"><div class="barre-rempli pref" style="width:${Math.round(S.talents.musique)}%"></div></div>
            <span class="comp-val">${Math.round(S.talents.musique)}</span></div>` : ''}
        </div>
        <p class="note-inline">Entraîne-toi (stade, salle de concert) : à haut niveau, on viendra te chercher…</p>
      </section>` : ''}
      <section class="carte">
        <h2>🎯 Tes objectifs de vie</h2>
        <ul class="liste-simple">
          ${OBJECTIFS_VIE.map((o, i) => `<li>${i < S.objectifIndex ? '✅' : i === S.objectifIndex ? '👉' : '🔒'} ${o.icone} ${o.texte}</li>`).join('')}
        </ul>
      </section>
      <section class="carte">
        <h2>📈 Ton bonheur au fil du temps</h2>
        ${graphique(S.historique.map(h => h.bonheur), '#62B857', v => Math.round(v) + '/100')}
      </section>
      <section class="carte">
        <h2>⚙️ Partie</h2>
        <p class="note">Tu vis à ${esc(S.commune)} jusqu'à tes 30 ans. Bilan final au bout !</p>
        <button class="btn-lien" id="btn-nouvelle">Recommencer une vie</button>
        · <a class="btn-lien" href="maire.html">🏛️ Jouer au maire</a>
      </section>
    </div>`;
  }

  function htmlVueAmis(S) {
    return `
    <div class="defilable">
      ${S.amis.map(a => {
        const def = AMIS.find(x => x.id === a.id);
        return `<section class="carte">
          <div class="fiche-maire">
            <span class="maire-avatar">${def.icone}</span>
            <div style="flex:1">
              <p class="maire-nom">${def.nom} <span class="badge">${def.titre}</span></p>
              <div class="composante"><span class="comp-nom">Amitié</span>
                <div class="barre grande"><div class="barre-rempli ${a.relation < 30 ? 'basse' : ''}" style="width:${Math.round(a.relation)}%"></div></div>
                <span class="comp-val">${Math.round(a.relation)}</span></div>
            </div>
          </div>
          <div class="presets" style="margin-top:.7em">
            <button class="preset plan-ami" data-ami="${a.id}" data-lieu="cafe" data-act="papoter">
              <span class="preset-nom">☕ Café</span><span class="preset-note">−8 €</span></button>
            <button class="preset plan-ami" data-ami="${a.id}" data-lieu="cine" data-act="seance">
              <span class="preset-nom">🎬 Ciné</span><span class="preset-note">−12 €</span></button>
            <button class="preset plan-ami" data-ami="${a.id}" data-lieu="stade" data-act="match">
              <span class="preset-nom">⚽ Match</span><span class="preset-note">gratuit</span></button>
          </div>
          <p class="note-inline">Chaque plan fait avancer le temps d'un mois.</p>
        </section>`;
      }).join('')}
    </div>`;
  }

  function htmlVueJournal(S) {
    return `
    <div class="defilable">
      <section class="carte">
        <h2>📔 Ton journal</h2>
        <ul class="journal">${S.journal.map(l => `<li><span class="jour-tag">${E.age() - Math.floor((S.mois - l.mois) / 12)} ans</span> ${l.txt}</li>`).join('')}</ul>
      </section>
    </div>`;
  }

  function htmlPanneauNotifs(S) {
    return `
    <div class="voile-notifs" id="voile-notifs">
      <aside class="panneau-notifs">
        <div class="panneau-tete"><h2>🔔 Notifications</h2>
          <button class="btn-lien" id="fermer-notifs">Fermer</button></div>
        <ul class="liste-notifs">
          ${S.notifications.length ? S.notifications.map(n => `
            <li class="notif ${n.lu ? '' : 'non-lue'}"><span class="notif-ic">${n.icone}</span>
              <span class="notif-texte">${n.texte}</span></li>`).join('')
          : '<li class="notif"><span class="notif-texte">Rien pour l\'instant. Va vivre un peu !</span></li>'}
        </ul>
      </aside>
    </div>`;
  }

  function graphique(valeurs, couleur, fmt) {
    if (valeurs.length < 2) return '<p class="note">La courbe se dessine à partir du 2ᵉ mois.</p>';
    const W = 420, H = 120, P = 6;
    const min = Math.min(...valeurs, 0), max = Math.max(...valeurs, 1);
    const y = v => H - P - (max === min ? 0.5 : (v - min) / (max - min)) * (H - 2 * P);
    const x = i => P + i * (W - 2 * P) / (valeurs.length - 1);
    const pts = valeurs.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const der = valeurs[valeurs.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" class="graph" role="img">
      <polygon points="${x(0).toFixed(1)},${H - P} ${pts} ${x(valeurs.length - 1).toFixed(1)},${H - P}" fill="${couleur}" opacity="0.15"/>
      <polyline points="${pts}" fill="none" stroke="${couleur}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="${x(valeurs.length - 1)}" cy="${y(der)}" r="4" fill="${couleur}"/>
    </svg><p class="graph-legende">Aujourd'hui : <b>${fmt(der)}</b></p>`;
  }

  /* ================= MODALES & CINÉMATIQUES ================= */

  function modale(html, options = {}) {
    modalRoot().innerHTML = `<div class="voile ${options.bloquant ? 'bloquant' : ''}"><div class="modale">${html}</div></div>`;
    if (!options.bloquant) {
      modalRoot().querySelector('.voile').addEventListener('click', (e) => { if (e.target.classList.contains('voile')) fermerModale(); });
    }
  }
  function fermerModale() { modalRoot().innerHTML = ''; }

  function toast(txt) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = txt;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('visible'), 20);
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 400); }, 3400);
  }

  function cinematique(panneaux, onFin) {
    let i = 0;
    const fin = () => { modalRoot().innerHTML = ''; if (onFin) onFin(); };
    const montrer = () => {
      const p = panneaux[i];
      modalRoot().innerHTML = `
      <div class="cine"><div class="cine-barre"></div>
        <div class="cine-panneau">
          <div class="cine-emoji">${p.emoji}</div>
          <p class="cine-titre">${p.titre}</p>
          <p class="cine-texte">${p.texte}</p>
          <div class="cine-boutons">
            ${panneaux.length > 1 ? '<button class="btn-lien cine-lien" id="cine-passer">Passer ≫</button>' : ''}
            <button class="btn" id="cine-suite">${i === panneaux.length - 1 ? 'C\'est parti' : 'Continuer ▸'}</button>
          </div>
        </div><div class="cine-barre"></div></div>`;
      document.getElementById('cine-suite').addEventListener('click', () => {
        FX.son('clic');
        if (++i < panneaux.length) montrer(); else fin();
      });
      const passer = document.getElementById('cine-passer');
      if (passer) passer.addEventListener('click', fin);
    };
    montrer();
  }

  /* Le menu d'un lieu : choisir l'activité et la compagnie */
  function modaleLieu(S, lieuId) {
    const lieu = LIEUX.find(l => l.id === lieuId);
    let amiChoisi = null;
    const nomLieu = lieuId === 'eau' ? (S.profil === 'touristique' ? 'Plage' : 'Bord de rivière')
      : lieuId === 'ecole' ? (E.phase() === 'lycee' ? 'Lycée' : E.phase() === 'etudes' ? 'Campus' : 'Boulot') : lieu.nom;
    modale(`
      <h2>${lieu.icone} ${nomLieu}</h2>
      <p class="note">Avec qui ?</p>
      <div class="presets" id="choix-compagnie">
        <button class="preset actif" data-ami=""><span class="preset-nom">😎 Seul·e</span></button>
        ${S.amis.map(a => { const d = AMIS.find(x => x.id === a.id);
          return `<button class="preset" data-ami="${a.id}"><span class="preset-nom">${d.icone} ${d.nom}</span>
            <span class="preset-note">amitié ${Math.round(a.relation)}</span></button>`; }).join('')}
      </div>
      <p class="note" style="margin-top:.8em">Quoi faire ? <span class="note-inline">(chaque activité = un mois)</span></p>
      <div class="crise-options">
        ${lieu.activites.map((a, i) => {
          const bloquee = (a.ageMin && E.age() < a.ageMin) || ((a.effets.argent || 0) < 0 && S.argent + a.effets.argent < 0);
          let chips = Object.entries(a.effets).map(([k, v]) => {
            const ic = { energie: '⚡', moral: '😊', savoir: '🧠', social: '🫂', forme: '💪', argent: '💰' }[k];
            return `${ic}${v > 0 ? '+' : ''}${k === 'argent' ? v + '€' : v}`;
          }).join(' · ');
          if (a.talent) chips += ` · ${REVES[a.talent].icone} talent +${a.talentGain}`;
          return `<button class="option-crise act-lieu" data-i="${i}" ${bloquee ? 'disabled' : ''}>
            <span class="opt-titre">${a.nom}</span>
            <span class="opt-note">${chips}${a.ageMin && E.age() < a.ageMin ? ` · dès ${a.ageMin} ans` : ''}</span>
          </button>`;
        }).join('')}
      </div>`);
    modalRoot().querySelectorAll('#choix-compagnie .preset').forEach(b => b.addEventListener('click', () => {
      amiChoisi = b.dataset.ami || null;
      modalRoot().querySelectorAll('#choix-compagnie .preset').forEach(x => x.classList.toggle('actif', x === b));
    }));
    modalRoot().querySelectorAll('.act-lieu').forEach(b => b.addEventListener('click', () => {
      const act = lieu.activites[parseInt(b.dataset.i, 10)];
      const res = E.jouerMois(lieuId, act.id, amiChoisi);
      fermerModale();
      if (!res.ok) { if (res.msg) toast('❌ ' + res.msg); return; }
      FX.son((act.effets.argent || 0) > 0 ? 'argent' : 'clic');
      if (act.effets.argent) FX.flotteEuro(`${act.effets.argent > 0 ? '+' : ''}${act.effets.argent} €`, act.effets.argent > 0);
      E.sauvegarder(); rendre();
      toast(`${lieu.icone} ${res.note}`);
    }));
  }

  /* Scène de vie (QCM avec un interlocuteur) */
  function modaleScene(S) {
    const sc = E.sceneCourante();
    if (!sc) return;
    const tetes = { prof: ['👩‍🏫', 'Le prof'], famille: ['👨‍👩‍👧', 'Ta famille'], boulot: ['🧑‍💼', 'Le taf'] };
    const [emoji, nom] = sc.de && tetes[sc.de] ? tetes[sc.de] : [sc.ami.icone, sc.ami.nom];
    modale(`
      <div class="adjoint"><span class="adjoint-avatar">${emoji}</span>
        <div class="adjoint-bulle"><b>${nom}</b> — il se passe un truc.</div></div>
      <p class="crise-texte">${sc.icone} ${sc.texte}</p>
      <div class="crise-options">
        ${sc.options.map((o, i) => `<button class="option-crise opt-scene" data-i="${i}">
          <span class="opt-titre">${o.txt}</span></button>`).join('')}
      </div>`, { bloquant: true });
    modalRoot().querySelectorAll('.opt-scene').forEach(b => b.addEventListener('click', () => {
      const res = E.resoudreScene(parseInt(b.dataset.i, 10));
      FX.son('clic');
      fermerModale(); E.sauvegarder(); rendre();
      if (res.note) toast(`${res.icone} ${res.note}`);
    }));
  }

  /* Choix d'orientation après le bac */
  function modaleOrientation(S) {
    const possibles = E.orientationsPossibles();
    modale(`
      <h2>🧭 Et maintenant ?</h2>
      <p class="crise-texte">La grande question de l'été${S.bacObtenu ? '' : ' (sans le bac, certaines portes attendront)'} : tu fais quoi de ta vie ?</p>
      <div class="crise-options">
        ${ORIENTATIONS.map(o => {
          const ok = possibles.some(p => p.id === o.id);
          return `<button class="option-crise opt-orientation" data-id="${o.id}" ${ok ? '' : 'disabled'}>
            <span class="opt-titre">${o.icone} ${o.nom}</span>
            <span class="opt-note">${o.desc}${ok ? '' : ' · (pas accessible cette fois)'}</span>
          </button>`;
        }).join('')}
      </div>`, { bloquant: true });
    modalRoot().querySelectorAll('.opt-orientation').forEach(b => b.addEventListener('click', () => {
      E.choisirOrientation(b.dataset.id);
      FX.son('niveau');
      fermerModale(); E.sauvegarder(); rendre();
    }));
  }

  /* Le recruteur attend ta réponse */
  function modaleEssai(S) {
    const reve = REVES[S.essaiPropose];
    const stat = S.essaiPropose === 'foot' ? '💪 forme' : '🫂 social';
    modale(`
      <h2>${reve.icone} Une chance à saisir</h2>
      <p class="crise-texte">${reve.essai}</p>
      <p class="note">Tes atouts : talent ${Math.round(S.talents[S.essaiPropose])}/100 + la moitié de ta ${stat}.
      Il faut un total de 100 pour signer.</p>
      <div class="crise-options">
        <button class="option-crise" id="essai-oui"><span class="opt-titre">🔥 Tenter ta chance</span>
          <span class="opt-note">Quitte ou double. Un mois de préparation intense.</span></button>
        <button class="option-crise" id="essai-non"><span class="opt-titre">⏳ Pas encore prêt·e</span>
          <span class="opt-note">Le recruteur reviendra… si ton talent continue de monter.</span></button>
      </div>`, { bloquant: true });
    document.getElementById('essai-oui').addEventListener('click', () => {
      const r = E.repondreEssai(true);
      FX.son(r.reussi ? 'niveau' : 'crise');
      if (r.reussi) FX.confettis([reve.icone, '🌟', '🎉']);
      fermerModale(); E.sauvegarder(); rendre();
    });
    document.getElementById('essai-non').addEventListener('click', () => {
      E.repondreEssai(false);
      fermerModale(); E.sauvegarder(); rendre();
    });
  }

  /* Le choix du métier, puis l'entretien */
  function modaleEmplois(S) {
    const metiers = E.metiersDisponibles();
    const cooldown = S.mois < S.entretienDispo;
    modale(`
      <h2>💼 Choisis ton métier</h2>
      <p class="note">${cooldown ? 'Dernier entretien encore frais — patiente un peu, puis retente.' :
        'Postule, passe l\'entretien, décroche le poste. Ton 🫂 social et ton 🧠 savoir comptent autant que tes réponses.'}</p>
      <div class="crise-options">
        ${metiers.map(m => `<button class="option-crise choix-metier" data-id="${m.id}" ${m.accessible && !cooldown ? '' : 'disabled'}>
          <span class="opt-titre">${m.icone} ${m.nom}</span>
          <span class="opt-note">${m.salaire} €/mois${m.accessible ? '' : ` · demande ${m.minSavoir} de savoir (tu en as ${Math.round(S.stats.savoir)})`}</span>
        </button>`).join('')}
      </div>
      <div class="modale-boutons"><button class="btn-lien" id="emplois-plus-tard">Plus tard</button></div>`);
    document.getElementById('emplois-plus-tard').addEventListener('click', fermerModale);
    modalRoot().querySelectorAll('.choix-metier').forEach(b => b.addEventListener('click', () => {
      modaleEntretien(S, b.dataset.id);
    }));
  }

  function modaleEntretien(S, metierId) {
    const m = METIERS.find(x => x.id === metierId);
    let i = 0, bonnes = 0;
    const poser = () => {
      const q = QUESTIONS_ENTRETIEN[i];
      const options = [...q.options].sort(() => Math.random() - 0.5);
      modale(`
        <div class="adjoint"><span class="adjoint-avatar">🧑‍💼</span>
          <div class="adjoint-bulle"><b>Entretien ${m.icone} ${m.nom}</b> — question ${i + 1}/${QUESTIONS_ENTRETIEN.length}</div></div>
        <p class="crise-texte">${q.q}</p>
        <div class="crise-options">
          ${options.map((o, j) => `<button class="option-crise rep-entretien" data-bon="${o.bon ? 1 : 0}">
            <span class="opt-titre">${o.txt}</span></button>`).join('')}
        </div>`, { bloquant: true });
      modalRoot().querySelectorAll('.rep-entretien').forEach(b => b.addEventListener('click', () => {
        FX.son('clic');
        if (b.dataset.bon === '1') bonnes++;
        if (++i < QUESTIONS_ENTRETIEN.length) poser();
        else {
          const res = E.passerEntretien(metierId, bonnes);
          fermerModale();
          if (res.ok && res.reussi) { FX.son('niveau'); FX.confettis([m.icone, '💼', '🎉']); }
          else if (res.ok) { FX.son('crise'); toast(`😕 Recalé·e (score ${res.score}/100). Muscle ton social et retente dans 2 mois.`); }
          else if (res.msg) toast('❌ ' + res.msg);
          E.sauvegarder(); rendre();
        }
      }));
    };
    poser();
  }

  function modaleFin(S) {
    const g = S.gameOver;
    if (!finJouee) { finJouee = true; FX.son('niveau'); FX.confettis(['🎂', '🎉', '⭐']); }
    modale(`
      <h2>🎂 ${g.titre}</h2>
      <p class="crise-texte">${g.texte}</p>
      <div class="modale-boutons"><button class="btn" id="btn-rejouer">Vivre une autre vie</button></div>`, { bloquant: true });
    document.getElementById('btn-rejouer').addEventListener('click', () => {
      E.effacerSauvegarde(); fermerModale(); ecranAccueil();
    });
  }

  /* ================= ÉVÉNEMENTS ================= */

  function brancherEvenements(S) {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };

    on('btn-nouvelle', () => { if (confirm('Recommencer une nouvelle vie ?')) { E.effacerSauvegarde(); ecranAccueil(); } });
    on('btn-note', () => { vueActive = 'moi'; rendre(); });
    on('btn-son', () => { FX.basculerMuet(); FX.son('clic'); rendre(); });
    on('btn-notifs', () => {
      notifsOuvertes = !notifsOuvertes;
      if (notifsOuvertes) E.marquerNotifsLues();
      E.sauvegarder(); rendre();
    });
    on('fermer-notifs', () => { notifsOuvertes = false; rendre(); });
    const voileN = document.getElementById('voile-notifs');
    if (voileN) voileN.addEventListener('click', (e) => { if (e.target.id === 'voile-notifs') { notifsOuvertes = false; rendre(); } });

    on('btn-emplois', () => modaleEmplois(S));
    on('btn-passer-mois', () => {
      const res = E.nePasSortir();
      if (res.ok) { FX.son('jour'); E.sauvegarder(); rendre(); }
    });

    /* la carte : zoom + lieux */
    const carte = document.getElementById('carte');
    if (carte) {
      on('zoom-plus', () => CarteCommune.zoomer(carte, etatCarte(), 1.4));
      on('zoom-moins', () => CarteCommune.zoomer(carte, etatCarte(), 1 / 1.4));
      on('zoom-reset', () => CarteCommune.recentrer(carte, etatCarte()));
      app().querySelectorAll('.marqueur-lieu').forEach(b => b.addEventListener('click', () => {
        FX.son('clic');
        modaleLieu(S, b.dataset.lieu);
      }));
      placerMarqueurs();
    }

    /* plans express depuis la vue amis */
    app().querySelectorAll('.plan-ami').forEach(b => b.addEventListener('click', () => {
      const res = E.jouerMois(b.dataset.lieu, b.dataset.act, b.dataset.ami);
      if (!res.ok) { if (res.msg) toast('❌ ' + res.msg); return; }
      FX.son('clic');
      E.sauvegarder(); rendre();
      toast(`${res.icone} ${res.note}`);
    }));
  }

  function afficherModalesAutomatiques(S) {
    if (S.gameOver) return modaleFin(S);
    if (S.cinematiques && S.cinematiques.length) {
      const scenes = S.cinematiques.splice(0);
      E.sauvegarder();
      return cinematique(scenes, () => rendre());
    }
    if (S.choixOrientation) return modaleOrientation(S);
    if (S.essaiPropose) return modaleEssai(S);
    if (S.sceneActive) return modaleScene(S);
    if (S.rechercheEmploi && !S.metierId && !S.jobBoardVu) {
      S.jobBoardVu = true; E.sauvegarder();
      return modaleEmplois(S);
    }
  }

  return { rendre, ecranAccueil };
})();
