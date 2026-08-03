/* ============================================================
   BIG CITY LIFE — Interface « tout en questions »
   Façon Destiny Eleven : une carte-question par saison, tes
   réponses écrivent ta vie. Pas de carte, pas de menus — le jeu
   EST la question.
   ============================================================ */

const UI = (() => {
  const app = () => document.getElementById('app');
  const modalRoot = () => document.getElementById('modal-root');
  const E = Vie;
  let moiOuvert = false;
  let notifsOuvertes = false;
  let persoSuivi = null;
  let finJouee = false;
  let defiEnCours = null;   // { cle, dateFr, graine } quand on joue le Défi du jour
  let consequence = null;   // la conséquence de la dernière réponse, à afficher avant la suite
  let rareAnnonce = null;   // id du moment rare déjà fêté (son + confettis une seule fois)

  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nb = (v) => Math.round(v).toLocaleString('fr-FR');
  const eur = (v) => nb(v) + ' €';

  /* ================= CRÉATION : région → département → ville → perso → famille → amis → filière ================= */

  function ecranAccueil() {
    defiEnCours = null;
    consequence = null;
    const defi = E.defiDuJour();
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">Big City Life · Une vie en 40 questions</p>
      <h1>Où veux-tu <span class="filet">grandir</span> ?</h1>
      <p class="sous-titre">Chaque question écrit une saison de ta vie, de 15 à 25 ans.</p>
      <button class="carte-defi" id="btn-defi">
        <span class="defi-flamme">🔥</span>
        <span class="defi-txt"><b>Défi du jour · ${defi.dateFr}</b><br>
        Toute la France vit la même vie à <b>${esc(defi.ville.nom)}</b> aujourd'hui.
        Filme ta partie, compare ton score !</span>
        <span class="defi-go">▸</span>
      </button>
      <div id="choix-lieu" class="choix-lieu"></div>
      <p class="note" style="margin-top:2em"><a class="btn-lien" href="maire.html">🏛️ L'autre jeu : deviens maire</a></p>
    </div>`;
    document.getElementById('btn-defi').addEventListener('click', () => {
      defiEnCours = { cle: defi.cle, dateFr: defi.dateFr, graine: defi.graine };
      FX.son('niveau');
      ecranPerso(defi.ville);
    });
    etapeRegion();
  }

  function etapeRegion() {
    const zone = document.getElementById('choix-lieu');
    zone.innerHTML = `
      <h2 class="etape-titre">1 · Ta région</h2>
      <div class="grille-lieux">
        ${REGIONS_FR.map((r, i) => `<button class="choix-pastille choix-region" data-i="${i}">
          <span class="pastille-ic">${r.icone}</span>${esc(r.nom)}</button>`).join('')}
      </div>
      <p style="margin-top:.9em"><button id="ville-hasard" class="btn-lien">🎲 Une ville au hasard</button></p>`;
    zone.querySelectorAll('.choix-region').forEach(b => b.addEventListener('click', () => {
      FX.son('clic');
      etapeDept(REGIONS_FR[parseInt(b.dataset.i, 10)]);
    }));
    document.getElementById('ville-hasard').addEventListener('click', () => {
      FX.son('clic');
      ecranPerso(COMMUNES_FR.auHasard(1000));
    });
  }

  function etapeDept(region) {
    const zone = document.getElementById('choix-lieu');
    zone.innerHTML = `
      <h2 class="etape-titre"><button class="btn-lien fil-retour" id="retour-region">◂ Régions</button>
        2 · Ton département <span class="badge">${region.icone} ${esc(region.nom)}</span></h2>
      <div class="grille-lieux">
        ${region.depts.map(d => `<button class="choix-pastille choix-dept" data-d="${d}">
          <span class="pastille-ic">${esc(d)}</span>${esc(DEPTS_FR[d] || d)}</button>`).join('')}
      </div>`;
    document.getElementById('retour-region').addEventListener('click', etapeRegion);
    zone.querySelectorAll('.choix-dept').forEach(b => b.addEventListener('click', () => {
      FX.son('clic');
      etapeVille(region, b.dataset.d);
    }));
  }

  function etapeVille(region, dept) {
    const zone = document.getElementById('choix-lieu');
    const villes = COMMUNES_FR.parDept(dept);
    zone.innerHTML = `
      <h2 class="etape-titre"><button class="btn-lien fil-retour" id="retour-dept">◂ ${esc(DEPTS_FR[dept] || dept)}</button>
        3 · Ta ville <span class="badge">${villes.length.toLocaleString('fr-FR')} communes</span></h2>
      <div class="liste-villes">
        ${villes.map((v, i) => `<button class="resultat-ville choix-ville" data-i="${i}">
          <b>${esc(v.nom)}</b><span class="resultat-pop">${nb(v.pop)} hab.</span></button>`).join('')}
      </div>`;
    document.getElementById('retour-dept').addEventListener('click', () => etapeDept(region));
    zone.querySelectorAll('.choix-ville').forEach(b => b.addEventListener('click', () => {
      FX.son('clic');
      ecranPerso(villes[parseInt(b.dataset.i, 10)]);
    }));
  }

  function ecranPerso(ville) {
    let genre = null, emoji = null;
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">${defiEnCours ? '🔥 Défi du jour · ' : ''}${esc(ville.nom)} · Étape 1 / 4</p>
      <h1>Qui es-<span class="filet">tu</span> ?</h1>
      <div class="banniere-ville">${skylineVille(ville, 9)}
        <span class="banniere-ville-nom">🏙️ ${esc(ville.nom)} · ${nb(ville.pop)} hab.${ville.littoral ? ' · bord de mer' : ''}</span></div>
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
            <div class="equip-chiffres"><span>💰 ${f.argentPoche} €/saison d'argent de poche</span></div>
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
      <p class="sous-titre">Choisis-en deux. Ils reviendront dans tes questions, tes galères et tes meilleures soirées.</p>
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
      <p class="sous-titre">Le lycée commence. Aucune n'est un piège, toutes mènent quelque part.</p>
      <div class="grille-cartes" style="max-width:720px;margin:0 auto;text-align:left">
        ${FILIERES.map(f => `
          <button class="carte equip choix-filiere" data-id="${f.id}">
            <h3>${f.icone} ${f.nom}</h3>
            <p class="equip-desc">${f.desc}</p>
          </button>`).join('')}
      </div>
    </div>`;
    app().querySelectorAll('.choix-filiere').forEach(b => b.addEventListener('click', () => {
      E.nouvellePartie({
        ville: { nom: ville.nom, dept: ville.dept, pop: ville.pop, littoral: !!ville.littoral },
        ambiance: 'moyenne', perso, familleId, amisIds, filiereId: b.dataset.id,
        graine: defiEnCours ? defiEnCours.graine : undefined,
        defi: defiEnCours ? { cle: defiEnCours.cle, dateFr: defiEnCours.dateFr } : null,
      });
      E.sauvegarder();
      const famille = FAMILLES.find(f => f.id === familleId);
      const copains = amisIds.map(id => AMIS.find(a => a.id === id));
      const monde = E.etat.monde;
      cinematique([
        { emoji: '📦', titre: 'La nouvelle vie', texte: `${ville.nom}. ${famille.ambiance} C'est ici que tout va se jouer : le ${monde.lycee}, les soirées au ${monde.fastfood}, les premières payes, les grandes décisions.` },
        { emoji: '🎒', titre: 'Jour de rentrée', texte: `Devant la grille du ${monde.lycee}, sac trop lourd, boule au ventre. ${copains[0].icone} ${copains[0].nom} et ${copains[1].icone} ${copains[1].nom} te font signe : « ${perso.prenom} ! Par ici ! » Ça va aller.` },
        { emoji: '❓', titre: 'Une vie en 40 questions', texte: 'À chaque saison, une question. Tes réponses font tout : le bac, les amitiés, l\'argent, les rêves. Il n\'y a pas de bonne réponse — il y a TA réponse.' },
      ], () => { FX.son('niveau'); FX.confettis(['🎒', '🎉', '✨']); rendre(); });
    }));
  }

  /* ================= RENDU PRINCIPAL : LA QUESTION ================= */

  function rendre() {
    const S = E.etat;
    if (!S) return ecranAccueil();
    /* filet de sécurité : jamais d'écran vide */
    if (!S.carte && !S.gameOver && !S.choixOrientation && !S.essaiPropose && !S.cinematiques.length) {
      E.nouvelleCarte();
    }
    const b = E.bonheur();
    const sur5 = (b.note / 20).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const clNote = b.note >= 60 ? 'bonne' : b.note >= 40 ? 'moyenne' : 'mauvaise';
    const nonLues = E.notifsNonLues();
    if (persoSuivi !== S.perso.prenom + S.commune) { persoSuivi = S.perso.prenom + S.commune; finJouee = false; }
    const obj = E.objectifCourant();
    const progression = Math.min(100, Math.round(S.mois / VIE_CFG.MOIS_FIN * 100));

    app().innerHTML = `
    <div class="coque">
      <header class="barre-haut">
        <button id="btn-note" class="badge-note ${clNote}" title="Ton bonheur — touche pour ton profil">
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
      <div class="barre-vie"><div class="barre-vie-rempli" style="width:${progression}%"></div>
        <span class="barre-vie-txt">saison ${Math.min(S.mois, VIE_CFG.MOIS_FIN)}/${VIE_CFG.MOIS_FIN}</span></div>
      ${obj ? `<div class="barre-objectif">🎯 <b>Objectif :</b> ${obj.icone} ${obj.texte}
        <span class="obj-recompense">+${obj.xp} XP</span></div>` : ''}
      <main class="vue ecran-question">${consequence ? htmlConsequence(S) : htmlCarte(S)}</main>
      ${moiOuvert ? htmlPanneauMoi(S) : ''}
      ${notifsOuvertes ? htmlPanneauNotifs(S) : ''}
    </div>`;

    brancherEvenements(S);
    if (!consequence) demarrerMachineEcrire();
    /* la conséquence se lit d'abord — les cinématiques et modales attendent le « Continuer » */
    if (!consequence) {
      const carte = E.carteCourante();
      if (carte && carte.rare && rareAnnonce !== S.carte.id) {
        rareAnnonce = S.carte.id;
        FX.son('niveau');
        FX.confettis(['🌟', '✨', '🎉']);
      }
      afficherModalesAutomatiques(S);
    }
  }

  function chipStat(ic, v) {
    const cl = v < 25 ? 'basse' : '';
    return `<span class="chip-stat ${cl}" title="${ic} ${Math.round(v)}/100">${ic}
      <span class="chip-stat-barre"><span style="width:${Math.round(v)}%"></span></span></span>`;
  }

  /* ---- Les puces d'effets (partagées carte / conséquence) ---- */

  function chipsEffets(effets) {
    return Object.entries(effets || {}).map(([k, v]) => {
      const ic = { energie: '⚡', moral: '😊', savoir: '🧠', social: '🫂', forme: '💪', argent: '💰', relation: '🫶', abonnes: '👥' }[k];
      return ic ? `<span class="chip-effet ${v > 0 ? 'plus' : 'moins'}">${ic} ${v > 0 ? '+' : ''}${k === 'argent' ? v + ' €' : v}</span>` : '';
    }).filter(Boolean).join('');
  }

  /* ---- La conséquence de ta réponse — façon Destiny Eleven ---- */

  function htmlConsequence(S) {
    const c = consequence;
    const sc = c.scene || { emoji: c.icone, nom: 'La vie', decor: 'decor-rue', etiquette: '✍️ Conséquence' };
    return `
    <div class="scene-visuelle ${sc.decor} ${c.rare ? 'carte-rare-scene' : ''}">
      <span class="scene-etiquette">${c.rare ? '🌟 MOMENT RARE' : '✍️ Conséquence'}</span>
      ${htmlDecor(sc)}
      <div class="scene-acteurs">
        <div class="scene-perso">${sc.emoji}<span class="ombre-perso"></span></div>
        ${sc.toi ? `<div class="scene-toi">${S.perso.emoji}<span class="ombre-perso"></span></div>` : ''}
      </div>
      <div class="scene-dialogue">
        <span class="scene-nom">${sc.nom}</span>
        <p class="conseq-choix">Tu as choisi : <b>${c.choix}</b></p>
        <p class="scene-texte conseq-texte fini">${c.note}</p>
      </div>
    </div>
    <div class="scene-options pret">
      <div class="conseq-effets" style="justify-content:center;display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px">
        ${chipsEffets(c.effets) || '<span class="chip-effet">Rien ne change… en apparence.</span>'}
      </div>
      <button class="btn btn-grand btn-large" id="btn-conseq-suite">Continuer ▸</button>
    </div>`;
  }

  /* ---- La carte-question, plein écran ---- */

  function htmlCarte(S) {
    const carte = E.carteCourante();
    if (!carte) {
      return `<div class="carte-jeu"><p class="note" style="text-align:center">✨ Un grand moment se prépare…</p></div>`;
    }
    const sc = miseEnScene(S, carte);
    return `
    <div class="scene-visuelle ${sc.decor} ${carte.rare ? 'carte-rare-scene' : ''} ${carte.arc ? 'carte-histoire-scene' : ''}">
      <span class="scene-etiquette">${sc.etiquette}</span>
      ${htmlDecor(sc)}
      <div class="scene-acteurs">
        <div class="scene-perso">${sc.emoji}<span class="ombre-perso"></span></div>
        ${sc.toi ? `<div class="scene-toi">${S.perso.emoji}<span class="ombre-perso"></span></div>` : ''}
      </div>
      <div class="scene-dialogue tape">
        <span class="scene-nom">${sc.nom}</span>
        <p class="scene-texte" id="scene-texte" data-texte="${esc(carte.texte)}">${esc(carte.texte)}</p>
        <span class="fleche-suite">▼</span>
      </div>
    </div>
    <div class="crise-options scene-options" id="zone-options">
      ${carte.options.map((o, i) => {
        const chips = Object.entries(o.effets || {}).map(([k, v]) => {
          const ic = { energie: '⚡', moral: '😊', savoir: '🧠', social: '🫂', forme: '💪', argent: '💰', relation: '🫶', abonnes: '👥' }[k];
          return ic ? `${ic}${v > 0 ? '+' : ''}${k === 'argent' ? v + '€' : v}` : '';
        }).filter(Boolean).join(' · ');
        let extra = o.talent ? ` · ${REVES[o.talent].icone} talent +7` : '';
        if (o.bloquee && o.bloqueeRaison) extra += ` · 🔒 ${o.bloqueeRaison}`;
        return `<button class="option-crise opt-carte" data-i="${i}" ${o.bloquee ? 'disabled' : ''}>
          <span class="opt-titre">${o.txt}</span>
          ${chips || extra ? `<span class="opt-note">${chips}${extra}</span>` : ''}
        </button>`;
      }).join('')}
    </div>`;
  }

  /* Les objets qui meublent chaque décor */
  const PROPS_DECOR = {
    'decor-classe': ['🕰️', '🗺️', '📚', '🪴'],
    'decor-maison': ['🖼️', '🪟', '🛋️', '🐈'],
    'decor-rue': ['🏪', '☁️', '🚲', '🚏'],
    'decor-bureau': ['🕰️', '🪟', '🖥️', '☕'],
    'decor-stade': ['☁️', '🚩', '🥅', '⚽'],
    'decor-rare': ['✨', '⭐', '🎊', '✨'],
    'decor-hiver': ['☁️', '❄️', '🌲', '⛄'],
    'decor-printemps': ['☀️', '☁️', '🌳', '🌷'],
    'decor-ete': ['☀️', '🕊️', '🌻', '🍉'],
    'decor-automne': ['☁️', '🍁', '🌳', '🍂'],
  };

  /* La skyline de TA ville : générée depuis son nom, sa taille, son littoral */
  function graine32(txt) {
    let h = 2166136261;
    for (const c of String(txt)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function skylineVille(ville, n = 7) {
    const g = graine32(ville.nom);
    const pop = ville.pop || 0;
    const pool = pop >= 100000 ? ['🏢', '🏬', '🏛️', '🏨', '🏦', '🏢']
      : pop >= 20000 ? ['🏢', '🏬', '🏫', '🏦', '🏠', '🏢']
      : pop >= 2000 ? ['🏠', '🏢', '🏪', '⛪', '🏡', '🌳']
      : ['🏠', '🏡', '⛪', '🌳', '🏠', '🌳'];
    let batiments = '';
    for (let i = 0; i < n; i++) {
      const e = pool[(g + i * 31) % pool.length];
      const taille = 1.05 + ((g >> (i % 8)) & 3) * 0.24 + (pop >= 100000 ? .45 : pop >= 20000 ? .2 : 0);
      batiments += `<span style="font-size:${taille.toFixed(2)}rem">${e}</span>`;
    }
    if (ville.littoral) batiments = '<span style="font-size:1.25rem">⛵</span><span style="font-size:1.05rem">🌊</span>' + batiments + '<span style="font-size:1.1rem">🌊</span>';
    return `<div class="skyline" aria-hidden="true">${batiments}</div>`;
  }

  const DECORS_EXTERIEURS = ['decor-rue', 'decor-stade', 'decor-hiver', 'decor-printemps', 'decor-ete', 'decor-automne'];

  function htmlDecor(sc) {
    const S = E.etat;
    const props = PROPS_DECOR[sc.decor] || [];
    const dehors = S && DECORS_EXTERIEURS.includes(sc.decor);
    return `<div class="scene-props" aria-hidden="true">${props.map((p, i) => `<span class="prop prop-${i}">${p}</span>`).join('')}</div>
      ${dehors ? skylineVille({ nom: S.commune, pop: S.population, littoral: S.ville && S.ville.littoral }) : ''}`;
  }

  /* Qui parle, où, sur quel décor — la mise en scène de la carte */
  function miseEnScene(S, carte) {
    const saison = E.saisonVie();
    if (carte.rare) return { emoji: carte.icone, nom: 'Moment rare', decor: 'decor-rare', etiquette: '🌟 MOMENT RARE', toi: true };
    if (carte.arc) {
      const foot = String(S.carte.id).startsWith('foot');
      return {
        emoji: foot ? '🧢' : '💫',
        nom: foot ? 'Le recruteur' : 'Les réseaux',
        decor: foot ? 'decor-stade' : 'decor-rue',
        etiquette: '🎬 TON HISTOIRE · épisode',
        toi: true,
      };
    }
    if (carte.type === 'scene') {
      const tetes = { prof: ['👩‍🏫', 'Le prof', 'decor-classe'], famille: ['👨‍👩‍👧', 'Ta famille', 'decor-maison'], boulot: ['🧑‍💼', 'Le taf', 'decor-bureau'] };
      const t = carte.de && tetes[carte.de];
      if (t) return { emoji: t[0], nom: t[1], decor: t[2], etiquette: `${carte.icone} ${E.age()} ans`, toi: true };
      return { emoji: carte.ami.icone, nom: carte.ami.nom, decor: 'decor-rue', etiquette: `${carte.icone} ${E.age()} ans`, toi: true };
    }
    /* rythme : c'est TOI dans le décor de la saison */
    return { emoji: S.perso.emoji, nom: S.perso.prenom, decor: 'decor-' + saison, etiquette: `📆 Ta saison · ${E.age()} ans`, toi: false };
  }

  /* Le texte s'écrit lettre à lettre — toucher le dialogue l'affiche d'un coup */
  function demarrerMachineEcrire() {
    const el = document.getElementById('scene-texte');
    if (!el) return;
    const zone = document.getElementById('zone-options');
    const dlg = el.closest('.scene-dialogue');
    const txt = el.dataset.texte;
    const finir = () => {
      el.textContent = txt;
      el.classList.add('fini');
      if (dlg) dlg.classList.remove('tape');
      if (zone) zone.classList.add('pret');
    };
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return finir();
    let i = 0;
    el.textContent = '';
    const minuteur = setInterval(() => {
      i += 2;
      el.textContent = txt.slice(0, i);
      if (i >= txt.length) { clearInterval(minuteur); finir(); }
    }, 22);
    if (dlg) dlg.addEventListener('click', () => { clearInterval(minuteur); finir(); }, { once: true });
  }

  /* ---- 🎒 Le panneau « Moi » ---- */

  function htmlPanneauMoi(S) {
    const famille = FAMILLES.find(f => f.id === S.familleId);
    const fil = FILIERES.find(f => f.id === S.filiereId);
    const stats = [['⚡ Énergie', S.stats.energie], ['😊 Moral', S.stats.moral], ['🧠 Savoir', S.stats.savoir],
      ['🫂 Social', S.stats.social], ['💪 Forme', S.stats.forme]];
    return `
    <div class="voile-notifs" id="voile-moi">
      <aside class="panneau-notifs">
        <div class="panneau-tete"><h2>🎒 ${esc(S.perso.prenom)}, ${E.age()} ans</h2>
          <button class="btn-lien" id="fermer-moi">Fermer</button></div>
        <div class="liste-notifs" style="display:block;padding:12px 14px">
          <p class="note">${famille.icone} ${famille.nom} · ${fil.icone} ${fil.nom} · ${E.NOMS_PHASE[E.phase()]} (${E.classeActuelle()})${E.phase() === 'lycee' ? ` · 🏫 ${S.monde.lycee}` : ''}<br>
          📍 QG de la bande : ${S.monde.fastfood} · ⚽ ${S.monde.club}<br>
          👥 ${S.abonnes.toLocaleString('fr-FR')} abonnés${S.drapeaux.permis ? ' · 🚗 permis' : ''}${S.drapeaux.voiture ? ' · 🚙 Josiane' : ''}${S.drapeaux.chien ? ' · 🐶 Biscotte' : ''}<br>
          💰 ${eur(S.argent)} · revenu ${eur(E.revenuMensuel())}/saison · ⭐ niveau ${S.niveau}</p>
          <div class="composantes">
            ${stats.map(([n, v]) => `<div class="composante"><span class="comp-nom">${n}</span>
              <div class="barre grande"><div class="barre-rempli ${v < 30 ? 'basse' : ''}" style="width:${Math.round(v)}%"></div></div>
              <span class="comp-val">${Math.round(v)}</span></div>`).join('')}
            ${S.talents.foot > 5 ? `<div class="composante"><span class="comp-nom">⚽ Talent foot</span>
              <div class="barre grande"><div class="barre-rempli pref" style="width:${Math.round(S.talents.foot)}%"></div></div>
              <span class="comp-val">${Math.round(S.talents.foot)}</span></div>` : ''}
            ${S.talents.musique > 5 ? `<div class="composante"><span class="comp-nom">🎤 Talent chant</span>
              <div class="barre grande"><div class="barre-rempli pref" style="width:${Math.round(S.talents.musique)}%"></div></div>
              <span class="comp-val">${Math.round(S.talents.musique)}</span></div>` : ''}
          </div>
          <h3>🫂 Tes amis</h3>
          <div class="composantes">
            ${S.amis.map(a => { const d = AMIS.find(x => x.id === a.id);
              return `<div class="composante"><span class="comp-nom">${d.icone} ${d.nom}</span>
                <div class="barre grande"><div class="barre-rempli ${a.relation < 30 ? 'basse' : ''}" style="width:${Math.round(a.relation)}%"></div></div>
                <span class="comp-val">${Math.round(a.relation)}</span></div>`; }).join('')}
          </div>
          <h3>🎯 Objectifs de vie</h3>
          <ul class="liste-simple">
            ${OBJECTIFS_VIE.map(o => `<li>${S.objectifsFaits[o.id] ? '✅' : (E.objectifCourant() && E.objectifCourant().id === o.id ? '👉' : '⬜')} ${o.icone} ${o.texte}</li>`).join('')}
          </ul>
          ${S.rechercheEmploi && !S.metierId ? `<p style="margin-top:.8em"><button class="btn" id="btn-emplois">💼 Voir les métiers & postuler</button></p>` : ''}
          <h3>📔 Derniers moments</h3>
          <ul class="journal" style="max-height:180px">${S.journal.slice(0, 12).map(l =>
            `<li><span class="jour-tag">${VIE_CFG.AGE_DEPART + Math.floor(((l.mois - 1) * 3 + 8) / 12)} ans</span> ${l.txt}</li>`).join('')}</ul>
          <p style="margin-top:1em"><button class="btn-lien" id="btn-nouvelle">Recommencer une vie</button>
          · <a class="btn-lien" href="maire.html">🏛️ Jouer au maire</a></p>
        </div>
      </aside>
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
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 400); }, 3200);
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

  function modaleOrientation(S) {
    const possibles = E.orientationsPossibles();
    modale(`
      <h2>🧭 Et maintenant ?</h2>
      <p class="crise-texte">La grande question de l'été${S.bacObtenu ? '' : ' (sans le bac, certaines portes attendront)'} : tu fais quoi de ta vie ?</p>
      <div class="crise-options">
        ${ORIENTATIONS.map(o => {
          const ok = possibles.some(p => p.id === o.id);
          let pourquoi = '';
          if (!ok) {
            if (o.pause && S.pauseFaite) pourquoi = ' · (déjà fait — on ne vit qu\'une année off)';
            else if (o.argentMin && S.argent < o.argentMin) pourquoi = ` · (il te faut ${o.argentMin} € de côté)`;
            else if (o.formeMin && S.stats.forme < o.formeMin) pourquoi = ` · (il te faut ${o.formeMin} de 💪 forme)`;
            else if (o.id !== 'travail' && S.bacObtenu === false) pourquoi = ' · (il faut le bac)';
            else pourquoi = ' · (il te manque du savoir)';
          }
          return `<button class="option-crise opt-orientation" data-id="${o.id}" ${ok ? '' : 'disabled'}>
            <span class="opt-titre">${o.icone} ${o.nom}</span>
            <span class="opt-note">${o.desc}${pourquoi}</span>
          </button>`;
        }).join('')}
      </div>`, { bloquant: true });
    modalRoot().querySelectorAll('.opt-orientation').forEach(b => b.addEventListener('click', () => {
      E.choisirOrientation(b.dataset.id);
      FX.son('niveau');
      fermerModale(); E.sauvegarder(); rendre();
    }));
  }

  function modaleEssai(S) {
    const reve = REVES[S.essaiPropose];
    const stat = S.essaiPropose === 'foot' ? '💪 forme' : '🫂 social';
    modale(`
      <h2>${reve.icone} Une chance à saisir</h2>
      <p class="crise-texte">${E.remplacerMonde(reve.essai)}</p>
      <p class="note">Tes atouts : talent ${Math.round(S.talents[S.essaiPropose])}/100 + la moitié de ta ${stat}.
      Il faut un total de 100 pour signer.</p>
      <div class="crise-options">
        <button class="option-crise" id="essai-oui"><span class="opt-titre">🔥 Tenter ta chance</span>
          <span class="opt-note">Quitte ou double.</span></button>
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

  function modaleEmplois(S) {
    const metiers = E.metiersDisponibles();
    const cooldown = S.mois < S.entretienDispo;
    modale(`
      <h2>💼 Choisis ton métier</h2>
      <p class="note">${cooldown ? 'Dernier entretien encore frais — la saison prochaine, promis.' :
        'Postule, passe l\'entretien, décroche le poste. Ton 🫂 social, ton 🧠 savoir et ta 💪 forme comptent autant que tes réponses.'}</p>
      <div class="crise-options">
        ${metiers.map(m => `<button class="option-crise choix-metier" data-id="${m.id}" ${m.accessible && !cooldown ? '' : 'disabled'}>
          <span class="opt-titre">${m.icone} ${m.nom}</span>
          <span class="opt-note">${m.salaire} €/mois${m.accessible ? '' : m.manqueForme
            ? ` · poste physique : demande ${m.minForme} de 💪 forme (tu en as ${Math.round(S.stats.forme)})`
            : ` · demande ${m.minSavoir} de savoir (tu en as ${Math.round(S.stats.savoir)})`}</span>
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
          ${options.map((o) => `<button class="option-crise rep-entretien" data-bon="${o.bon ? 1 : 0}">
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
          else if (res.ok) { FX.son('crise'); toast(`😕 Recalé·e (score ${res.score}/100). Muscle ton social et retente.`); }
          else if (res.msg) toast('❌ ' + res.msg);
          E.sauvegarder(); rendre();
        }
      }));
    };
    poser();
  }

  /* ---- La fin façon « Wrapped » : le bilan qu'on a envie de poster ---- */

  function modaleFin(S) {
    const g = S.gameOver;
    const t = g.titreVie || E.titreDeVie();
    const r = g.recap || { bonheur: 0, amisMoy: 0, argent: Math.round(S.argent), metier: '🧭 Électron libre', bac: S.bacObtenu === true, rares: 0, defi: null };
    if (!finJouee) { finJouee = true; FX.son('niveau'); FX.confettis(['🎂', '🎉', '⭐']); }
    modale(`
      <div class="fin-wrapped">
        <p class="fin-surtitre">${r.defi ? `🔥 Défi du jour · ${r.defi.dateFr}` : '🎒 Big City Life'} · ${esc(S.commune)}</p>
        <div class="fin-avatar">${S.perso.emoji}</div>
        <p class="fin-prenom">${esc(S.perso.prenom)}, 25 ans</p>
        <div class="fin-titrevie">${t.icone} ${t.nom}</div>
        <p class="fin-desc">${t.desc}</p>
        <div class="fin-score"><span class="fin-score-val">${g.score}</span><span class="fin-score-max">/100</span>
          <span class="fin-score-lib">score de vie</span></div>
        <div class="fin-stats">
          <span>${r.bac ? '🎓 Bac ✔' : '🎓 Sans bac'}</span>
          <span>${r.metier}</span>
          <span>😊 ${r.bonheur}</span>
          <span>🫂 ${r.amisMoy}</span>
          <span>💰 ${nb(r.argent)} €</span>
          ${r.rares ? `<span>🌟 ${r.rares} moment${r.rares > 1 ? 's' : ''} rare${r.rares > 1 ? 's' : ''}</span>` : ''}
        </div>
        <div class="fin-boutons">
          <button class="btn btn-grand" id="btn-partager">📸 Partager ma vie</button>
          <button class="btn" id="btn-copier">📋 Copier le récap</button>
          <button class="btn-lien" id="btn-rejouer">🔁 Vivre une autre vie</button>
        </div>
        <p class="note" style="text-align:center;margin-top:.6em">Filme ta partie, poste ton bilan — #BigCityLife</p>
      </div>`, { bloquant: true });
    document.getElementById('btn-partager').addEventListener('click', () => partagerImage(S));
    document.getElementById('btn-copier').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(texteRecap(S));
        toast('📋 Récap copié — colle-le où tu veux !');
      } catch (e) { toast('❌ Copie impossible ici.'); }
    });
    document.getElementById('btn-rejouer').addEventListener('click', () => {
      E.effacerSauvegarde(); fermerModale(); ecranAccueil();
    });
  }

  function texteRecap(S) {
    const g = S.gameOver, t = g.titreVie, r = g.recap;
    return [
      '🎒 BIG CITY LIFE — ma vie en 40 questions',
      r.defi ? `🔥 Défi du jour (${r.defi.dateFr}) à ${S.commune}` : `🏙️ ${S.perso.prenom} a grandi à ${S.commune}`,
      `${t.icone} ${t.nom}`,
      `${r.bac ? '🎓 Bac ✅' : '🎓 Sans bac'} · ${r.metier} · 💰 ${nb(r.argent)} €`,
      `⭐ Score de vie : ${g.score}/100`,
      'Tu feras mieux ? 👀 #BigCityLife',
    ].join('\n');
  }

  /* L'image 9:16 à poster en story / TikTok */
  function imageBilan(S) {
    const g = S.gameOver, t = g.titreVie, r = g.recap;
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1920;
    const x = c.getContext('2d');
    const grad = x.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, '#232655'); grad.addColorStop(.55, '#5A3F8E'); grad.addColorStop(1, '#E86F4A');
    x.fillStyle = grad; x.fillRect(0, 0, 1080, 1920);
    for (let i = 0; i < 80; i++) {
      x.globalAlpha = .18 + ((i * 37) % 40) / 130;
      x.fillStyle = '#fff';
      x.fillRect((i * 173) % 1080, (i * 397) % 950, 4, 4);
    }
    x.globalAlpha = 1;
    x.textAlign = 'center';
    const centre = (txt, y, police, couleur = '#fff') => { x.font = police; x.fillStyle = couleur; x.fillText(txt, 540, y); };
    const enLignes = (txt, larg) => {
      const mots = txt.split(' '); const lignes = []; let l = '';
      for (const m of mots) {
        if ((l + ' ' + m).trim().length > larg) { lignes.push(l.trim()); l = m; } else l += ' ' + m;
      }
      if (l.trim()) lignes.push(l.trim());
      return lignes;
    };
    centre('BIG CITY LIFE', 160, '800 68px Fredoka, sans-serif', '#FFD75E');
    centre('MA VIE EN 40 QUESTIONS', 225, '600 36px Fredoka, sans-serif', 'rgba(255,255,255,.8)');
    if (r.defi) centre(`🔥 DÉFI DU JOUR · ${r.defi.dateFr.toUpperCase()}`, 300, '700 40px Fredoka, sans-serif', '#FFB86B');
    x.beginPath(); x.arc(540, 560, 175, 0, 7);
    x.fillStyle = 'rgba(255,255,255,.14)'; x.fill();
    x.lineWidth = 8; x.strokeStyle = 'rgba(255,255,255,.4)'; x.stroke();
    centre(S.perso.emoji, 630, '190px serif');
    centre(`${S.perso.prenom} · ${S.commune}`, 850, '700 58px Fredoka, sans-serif');
    centre(`${t.icone} ${t.nom}`, 970, '800 80px Fredoka, sans-serif', '#FFD75E');
    let y = 1050;
    for (const ligne of enLignes(t.desc, 38)) { centre(ligne, y, '500 42px Fredoka, sans-serif', 'rgba(255,255,255,.9)'); y += 56; }
    centre('SCORE DE VIE', 1310, '700 40px Fredoka, sans-serif', 'rgba(255,255,255,.75)');
    centre(`${g.score}`, 1480, '800 190px Fredoka, sans-serif', '#FFD75E');
    centre('/100', 1540, '600 48px Fredoka, sans-serif', 'rgba(255,255,255,.75)');
    x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(190, 1590, 700, 26);
    x.fillStyle = '#FFD75E'; x.fillRect(190, 1590, 700 * Math.min(100, g.score) / 100, 26);
    centre(`${r.bac ? '🎓 Bac' : '🚀 Autodidacte'} · ${r.metier} · 💰 ${nb(r.argent)} €`, 1700, '600 40px Fredoka, sans-serif');
    centre('Tu feras mieux ? 👀  #BigCityLife', 1830, '700 46px Fredoka, sans-serif', '#FFD75E');
    return c;
  }

  async function partagerImage(S) {
    try {
      const c = imageBilan(S);
      const blob = await new Promise(res => c.toBlob(res, 'image/png'));
      const fichier = new File([blob], 'ma-vie-bigcitylife.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
        try { await navigator.share({ files: [fichier], title: 'Big City Life' }); return; } catch (e) { /* partage annulé : on télécharge */ }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ma-vie-bigcitylife.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast('📸 Image enregistrée — poste-la en story !');
    } catch (e) { toast('❌ Impossible de générer l\'image ici.'); }
  }

  /* ================= ÉVÉNEMENTS ================= */

  function brancherEvenements(S) {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };

    on('btn-nouvelle', () => { if (confirm('Recommencer une nouvelle vie ?')) { E.effacerSauvegarde(); ecranAccueil(); } });
    on('btn-note', () => { moiOuvert = !moiOuvert; notifsOuvertes = false; rendre(); });
    on('fermer-moi', () => { moiOuvert = false; rendre(); });
    on('btn-son', () => { FX.basculerMuet(); FX.son('clic'); rendre(); });
    on('btn-notifs', () => {
      notifsOuvertes = !notifsOuvertes; moiOuvert = false;
      if (notifsOuvertes) E.marquerNotifsLues();
      E.sauvegarder(); rendre();
    });
    on('fermer-notifs', () => { notifsOuvertes = false; rendre(); });
    on('btn-emplois', () => { moiOuvert = false; rendre(); modaleEmplois(S); });
    for (const idVoile of ['voile-notifs', 'voile-moi']) {
      const v = document.getElementById(idVoile);
      if (v) v.addEventListener('click', (e) => {
        if (e.target.id === idVoile) { notifsOuvertes = false; moiOuvert = false; rendre(); }
      });
    }

    /* répondre à la question du moment → on lit la CONSÉQUENCE avant la suite */
    app().querySelectorAll('.opt-carte').forEach(b => b.addEventListener('click', () => {
      const carteAvant = E.carteCourante();
      const sceneAvant = carteAvant ? miseEnScene(S, carteAvant) : null;
      const res = E.repondreCarte(parseInt(b.dataset.i, 10));
      if (!res.ok) { if (res.msg) toast('❌ ' + res.msg); return; }
      FX.son(res.rare ? 'niveau' : 'clic');
      consequence = { icone: res.icone, note: res.note, effets: res.effets, choix: res.choix, rare: res.rare, scene: sceneAvant };
      E.sauvegarder(); rendre();
    }));
    on('btn-conseq-suite', () => {
      consequence = null;
      FX.son('clic');
      rendre();
    });
  }

  /* ---- Le bilan d'année : gros titre de presse, tuiles, potins ---- */

  function modaleBilanAnnee(S) {
    const b = S.bilanAnnee;
    modale(`
      <div class="bilan-annee">
        <p class="bilan-entete">📋 ANNÉE ${b.saison} · ${esc(S.commune).toUpperCase()}
          <span class="badge badge-classe">${b.classe}</span></p>
        <blockquote class="presse-cita">📰 ${b.titrePresse}</blockquote>
        <div class="bilan-tuiles">
          ${b.tuiles.map(t => `<div class="tuile"><span class="tuile-val">${t.val}</span><span class="tuile-lib">${t.lib}</span></div>`).join('')}
        </div>
        <div class="bilan-lignes">${b.lignes.map(l => `<p>${l}</p>`).join('')}</div>
        <p class="bilan-potin">${b.potin}</p>
        <button class="btn btn-grand btn-large" id="btn-bilan-suite">Continuer</button>
      </div>`, { bloquant: true });
    FX.son('question');
    document.getElementById('btn-bilan-suite').addEventListener('click', () => {
      S.bilanAnnee = null;
      FX.son('clic');
      fermerModale(); E.sauvegarder(); rendre();
    });
  }

  function afficherModalesAutomatiques(S) {
    if (S.gameOver) return modaleFin(S);
    if (S.bilanAnnee) return modaleBilanAnnee(S);
    if (S.cinematiques && S.cinematiques.length) {
      const scenes = S.cinematiques.splice(0).map(p => ({ ...p, texte: E.remplacerMonde(p.texte) }));
      E.sauvegarder();
      return cinematique(scenes, () => rendre());
    }
    if (S.choixOrientation) return modaleOrientation(S);
    if (S.essaiPropose) return modaleEssai(S);
    if (S.rechercheEmploi && !S.metierId && !S.jobBoardVu) {
      S.jobBoardVu = true; E.sauvegarder();
      return modaleEmplois(S);
    }
  }

  return { rendre, ecranAccueil };
})();
