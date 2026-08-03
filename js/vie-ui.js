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

  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nb = (v) => Math.round(v).toLocaleString('fr-FR');
  const eur = (v) => nb(v) + ' €';

  /* ================= CRÉATION : ville → perso → famille → amis → filière ================= */

  function ecranAccueil() {
    let villeChoisie = null;
    app().innerHTML = `
    <div class="accueil">
      <p class="surtitre">Big City Life · Une vie en 40 questions</p>
      <h1>Où veux-tu <span class="filet">grandir</span> ?</h1>
      <p class="sous-titre">Choisis ta ville parmi les ${COMMUNES_FR.nombre.toLocaleString('fr-FR')} communes de France.
      Puis réponds : chaque question écrit une saison de ta vie, de 15 à 25 ans.</p>
      <div class="recherche-bloc">
        <input type="search" id="recherche-ville" placeholder="🔎 Cherche ta ville… (Lille, Aurillac, Bandol…)"
          autocomplete="off" spellcheck="false">
        <div id="resultats-villes" class="resultats" role="listbox"></div>
        <button id="ville-hasard" class="btn-lien">🎲 Une ville au hasard</button>
      </div>
      <div id="etape-ville" class="etape-ambiance" hidden>
        <p class="ville-choisie" id="ville-choisie-txt"></p>
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
      <p class="surtitre">${esc(ville.nom)} · Étape 1 / 4</p>
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
      });
      E.sauvegarder();
      const famille = FAMILLES.find(f => f.id === familleId);
      const copains = amisIds.map(id => AMIS.find(a => a.id === id));
      cinematique([
        { emoji: '📦', titre: 'La nouvelle vie', texte: `${ville.nom}. ${famille.ambiance} C'est ici que tout va se jouer : le lycée, les potes, les premières payes, les grandes décisions.` },
        { emoji: '🎒', titre: 'Jour de rentrée', texte: `Devant la grille du lycée, sac trop lourd, boule au ventre. ${copains[0].icone} ${copains[0].nom} et ${copains[1].icone} ${copains[1].nom} te font signe : « ${perso.prenom} ! Par ici ! » Ça va aller.` },
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
      <main class="vue ecran-question">${htmlCarte(S)}</main>
      ${moiOuvert ? htmlPanneauMoi(S) : ''}
      ${notifsOuvertes ? htmlPanneauNotifs(S) : ''}
    </div>`;

    brancherEvenements(S);
    afficherModalesAutomatiques(S);
  }

  function chipStat(ic, v) {
    const cl = v < 25 ? 'basse' : '';
    return `<span class="chip-stat ${cl}" title="${ic} ${Math.round(v)}/100">${ic}
      <span class="chip-stat-barre"><span style="width:${Math.round(v)}%"></span></span></span>`;
  }

  /* ---- La carte-question, plein écran ---- */

  function htmlCarte(S) {
    const carte = E.carteCourante();
    if (!carte) {
      return `<div class="carte-jeu"><p class="note" style="text-align:center">✨ Un grand moment se prépare…</p></div>`;
    }
    const tetes = { prof: ['👩‍🏫', 'Le prof'], famille: ['👨‍👩‍👧', 'Ta famille'], boulot: ['🧑‍💼', 'Le taf'] };
    const [emoji, nom] = carte.type === 'scene'
      ? (carte.de && tetes[carte.de] ? tetes[carte.de] : [carte.ami.icone, carte.ami.nom])
      : ['📆', 'Ta saison'];
    return `
    <div class="carte-jeu">
      <div class="adjoint"><span class="adjoint-avatar">${emoji}</span>
        <div class="adjoint-bulle"><b>${nom}</b></div></div>
      <p class="crise-texte">${carte.icone} ${carte.texte}</p>
      <div class="crise-options">
        ${carte.options.map((o, i) => {
          const chips = Object.entries(o.effets || {}).map(([k, v]) => {
            const ic = { energie: '⚡', moral: '😊', savoir: '🧠', social: '🫂', forme: '💪', argent: '💰', relation: '🫶' }[k];
            return ic ? `${ic}${v > 0 ? '+' : ''}${k === 'argent' ? v + '€' : v}` : '';
          }).filter(Boolean).join(' · ');
          const extra = o.talent ? ` · ${REVES[o.talent].icone} talent +7` : '';
          return `<button class="option-crise opt-carte" data-i="${i}" ${o.bloquee ? 'disabled' : ''}>
            <span class="opt-titre">${o.txt}</span>
            ${chips || extra ? `<span class="opt-note">${chips}${extra}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
    </div>`;
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
          <p class="note">${famille.icone} ${famille.nom} · ${fil.icone} ${fil.nom} · ${E.NOMS_PHASE[E.phase()]} (${E.classeActuelle()})<br>
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

    /* répondre à la question du moment */
    app().querySelectorAll('.opt-carte').forEach(b => b.addEventListener('click', () => {
      const res = E.repondreCarte(parseInt(b.dataset.i, 10));
      if (!res.ok) { if (res.msg) toast('❌ ' + res.msg); return; }
      FX.son('clic');
      E.sauvegarder(); rendre();
      if (res.note) toast(`${res.icone} ${res.note}`);
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
    if (S.rechercheEmploi && !S.metierId && !S.jobBoardVu) {
      S.jobBoardVu = true; E.sauvegarder();
      return modaleEmplois(S);
    }
  }

  return { rendre, ecranAccueil };
})();
