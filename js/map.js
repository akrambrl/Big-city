/* ============================================================
   BIG CITY — Carte communale procédurale
   Une planche d'atlas vivante : terrain, eau, routes, bâti,
   équipements construits, saisons et marqueurs de crise.
   Dessin canvas 2D, déterministe (graine = nom de la commune).
   ============================================================ */

const CarteCommune = (() => {

  /* RNG déterministe (mulberry32) */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function graine(txt) {
    let h = 2166136261;
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* Palettes saisonnières des parcelles */
  const CHAMPS = {
    printemps: ['#CBDFA5', '#BFD996', '#D6E6B4', '#C3DCA0', '#DCE9C0', '#CFE3AC'],
    ete:       ['#E3D28E', '#D9C97F', '#CFE0A2', '#E8DA9C', '#C9DB9A', '#EAD9A0'],
    automne:   ['#D9C089', '#C9A96E', '#CBBF8E', '#BFD096', '#D6C79A', '#C4B27E'],
    hiver:     ['#EDEDE6', '#E6E8E0', '#EFEFE9', '#E2E5DC', '#EAEBE2', '#E8EAE1'],
  };
  const FORET = {
    printemps: ['#7FA86B', '#6E9A5B', '#8DB47A'],
    ete:       ['#729D5E', '#618C4F', '#83AA6E'],
    automne:   ['#A98B4F', '#8F7A45', '#7E9057'],
    hiver:     ['#5C7A52', '#4E6B47', '#69855D'],
  };
  const COUL = {
    papier: '#EDE7D5', contour: '#C8B694', parcelle: '#B9AD8F',
    eau: '#8FBEDC', eauBord: '#6FA3C4', eauClair: '#B9D8EA',
    sable: '#EBD9A8',
    routeBord: '#B9782F', routeBonne: '#EFAE55', routeUsee: '#A69A85',
    rueBord: '#C9BCA0', rue: '#FFFFFF',
    maison: '#C96F52', maisonBord: '#8F4A36',
    vacant: '#AFA79A', vacantBord: '#8C8577',
    encre: '#5B4A32',
  };

  /* Emplacements des crises sur la carte (coordonnées relatives) */
  const POS_CRISES = {
    crise_feu_foret: { x: 0.63, y: 0.15 },
    crise_inondation: { x: 0.36, y: 0.63 },
    crise_canicule: { x: 0.50, y: 0.47 },
    crise_tempete: { x: 0.33, y: 0.40 },
    crise_neige: { x: 0.60, y: 0.34 },
    crise_fuite_eau: { x: 0.46, y: 0.55 },
    crise_usine: { x: 0.73, y: 0.48 },
  };

  function posCrise(criseId, profil) {
    const p = { ...(POS_CRISES[criseId] || { x: 0.5, y: 0.45 }) };
    if (profil === 'touristique' && criseId === 'crise_inondation') p.y = 0.72;
    return p;
  }

  /* Géométrie de la commune selon le profil */
  function geometrie(profil) {
    if (profil === 'touristique') return { centre: { x: 0.50, y: 0.58 }, mer: 0.78, riviere: null, foretNord: 0.26 };
    if (profil === 'rurale') return { centre: { x: 0.50, y: 0.56 }, mer: null, riviere: 0.68, foretNord: 0.30 };
    return { centre: { x: 0.50, y: 0.54 }, mer: null, riviere: 0.66, foretNord: 0.16 };
  }

  /* Emplacements d'équipements : spirale d'or autour du centre */
  function slotsEquipements(geo) {
    const slots = [];
    const PHI = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 16; i++) {
      const a = i * PHI + 0.8;
      const r = 0.085 + 0.017 * i;
      let x = geo.centre.x + Math.cos(a) * r;
      let y = geo.centre.y + Math.sin(a) * r * 0.72;
      x = Math.min(0.94, Math.max(0.06, x));
      const yMax = geo.mer ? geo.mer - 0.07 : 0.90;
      y = Math.min(yMax, Math.max(geo.foretNord + 0.09, y));
      slots.push({ x, y });
    }
    return slots;
  }

  /* ---------- Dessin principal ---------- */

  function dessiner(canvas, S) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rng = mulberry32(graine(S.commune));
    const geo = geometrie(S.profil);
    const saison = SAISONS[(MOIS_DEBUT_MANDAT + S.mois - 1) % 12];
    const X = v => v * W, Y = v => v * H;

    /* 1. papier */
    ctx.fillStyle = COUL.papier;
    ctx.fillRect(0, 0, W, H);

    /* 2. courbes de niveau au nord */
    ctx.strokeStyle = COUL.contour; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    for (let l = 0; l < 5; l++) {
      const base = 0.045 + l * 0.055;
      ctx.beginPath();
      for (let x = 0; x <= 1.001; x += 0.04) {
        const y = base + Math.sin(x * 9 + l * 1.7) * 0.016 + Math.sin(x * 23 + l) * 0.007;
        x === 0 ? ctx.moveTo(X(x), Y(y)) : ctx.lineTo(X(x), Y(y));
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* 3. parcelles agricoles (grille irrégulière) */
    const cols = 11, rows = 6;
    const coins = [];
    for (let i = 0; i <= cols; i++) {
      coins[i] = [];
      for (let j = 0; j <= rows; j++) {
        coins[i][j] = {
          x: i / cols + (i > 0 && i < cols ? (rng() - 0.5) * 0.045 : 0),
          y: j / rows + (j > 0 && j < rows ? (rng() - 0.5) * 0.06 : 0),
        };
      }
    }
    const teintes = CHAMPS[saison];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const c = [coins[i][j], coins[i + 1][j], coins[i + 1][j + 1], coins[i][j + 1]];
        const cx = (c[0].x + c[2].x) / 2, cy = (c[0].y + c[2].y) / 2;
        const teinte = teintes[Math.floor(rng() * teintes.length)]; // tirage AVANT les filtres : grille stable
        if (Math.hypot(cx - geo.centre.x, (cy - geo.centre.y) * 1.4) < 0.15) continue;
        if (cy < geo.foretNord + 0.04) continue;
        if (geo.mer && cy > geo.mer - 0.05) continue;
        ctx.beginPath();
        ctx.moveTo(X(c[0].x), Y(c[0].y));
        for (let k = 1; k < 4; k++) ctx.lineTo(X(c[k].x), Y(c[k].y));
        ctx.closePath();
        ctx.fillStyle = teinte; ctx.fill();
        ctx.strokeStyle = COUL.parcelle; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.7; ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    /* 4. massif forestier au nord */
    const arbres = FORET[saison];
    const nbArbres = geo.foretNord > 0.2 ? 220 : 90;
    for (let i = 0; i < nbArbres; i++) {
      const x = rng(), y = rng() * geo.foretNord + 0.02 + Math.sin(x * 6) * 0.02;
      const r = 2.2 + rng() * 3.2;
      ctx.beginPath(); ctx.arc(X(x), Y(y), r, 0, 7);
      ctx.fillStyle = arbres[Math.floor(rng() * arbres.length)]; ctx.fill();
      if (saison === 'hiver' && rng() > 0.6) {
        ctx.beginPath(); ctx.arc(X(x) - r * 0.25, Y(y) - r * 0.3, r * 0.45, 0, 7);
        ctx.fillStyle = '#F4F6F2'; ctx.fill();
      }
    }

    /* 5. eau : mer (littoral) ou rivière */
    if (geo.mer !== null) {
      // plage
      ctx.beginPath(); ctx.moveTo(0, Y(geo.mer - 0.045));
      for (let x = 0; x <= 1.001; x += 0.05) ctx.lineTo(X(x), Y(geo.mer - 0.045 + Math.sin(x * 7 + 1) * 0.012));
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = COUL.sable; ctx.fill();
      // mer
      ctx.beginPath(); ctx.moveTo(0, Y(geo.mer));
      for (let x = 0; x <= 1.001; x += 0.05) ctx.lineTo(X(x), Y(geo.mer + Math.sin(x * 7) * 0.014));
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = COUL.eau; ctx.fill();
      ctx.strokeStyle = COUL.eauBord; ctx.lineWidth = 1.5; ctx.stroke();
      // vaguelettes
      ctx.strokeStyle = COUL.eauClair; ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        const wx = rng(), wy = geo.mer + 0.05 + rng() * (1 - geo.mer - 0.08);
        ctx.beginPath(); ctx.moveTo(X(wx), Y(wy));
        ctx.quadraticCurveTo(X(wx + 0.015), Y(wy - 0.008), X(wx + 0.03), Y(wy));
        ctx.stroke();
      }
      // jetée du port
      ctx.strokeStyle = '#9C8B6B'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(0.55), Y(geo.mer - 0.01)); ctx.lineTo(X(0.585), Y(geo.mer + 0.07)); ctx.stroke();
      ctx.lineCap = 'butt';
      // voiliers
      ctx.font = '11px serif'; ctx.textAlign = 'center';
      ctx.fillText('⛵', X(0.63), Y(geo.mer + 0.10));
      ctx.fillText('⛵', X(0.48), Y(geo.mer + 0.14));
    } else {
      const yR = geo.riviere, larg = S.profil === 'rurale' ? 9 : 13;
      const lit = x => yR + Math.sin(x * 5.2 + 1.3) * 0.05 + Math.sin(x * 11) * 0.018;
      ctx.strokeStyle = COUL.eau; ctx.lineWidth = larg; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let x = 0; x <= 1.001; x += 0.02) { const y = lit(x); x === 0 ? ctx.moveTo(X(x), Y(y)) : ctx.lineTo(X(x), Y(y)); }
      ctx.stroke();
      ctx.strokeStyle = COUL.eauClair; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
      ctx.beginPath();
      for (let x = 0; x <= 1.001; x += 0.02) { const y = lit(x); x === 0 ? ctx.moveTo(X(x), Y(y)) : ctx.lineTo(X(x), Y(y)); }
      ctx.stroke();
      ctx.globalAlpha = 1;
      geo.litRiviere = lit;
    }

    /* 6. routes principales (l'état de la voirie se lit à la couleur) */
    const voirie = S.cadre.voirie;
    const usure = Math.max(0, Math.min(1, (70 - voirie) / 50));
    const interp = lerpCouleur(COUL.routeBonne, COUL.routeUsee, usure);
    const angles = geo.mer ? [-0.15, Math.PI + 0.15, -Math.PI / 2, -Math.PI / 3.2] : [0.06, Math.PI - 0.06, -Math.PI / 2 + 0.15, Math.PI / 3.4];
    const routes = [];
    for (const a of angles) {
      const pts = [geo.centre];
      let x = geo.centre.x, y = geo.centre.y;
      for (let s = 0; s < 14; s++) {
        x += Math.cos(a) * 0.075 + (rng() - 0.5) * 0.02;
        y += Math.sin(a) * 0.055 + (rng() - 0.5) * 0.015;
        pts.push({ x, y });
        if (x < -0.02 || x > 1.02 || y < -0.02 || y > 1.02) break;
        if (geo.mer && y > geo.mer - 0.05) break;
      }
      routes.push(pts);
    }
    if (geo.mer) { // promenade du front de mer
      routes.push([{ x: -0.02, y: geo.mer - 0.065 }, { x: 0.35, y: geo.mer - 0.075 }, { x: 0.7, y: geo.mer - 0.06 }, { x: 1.02, y: geo.mer - 0.07 }]);
    }
    for (const pts of routes) {
      tracer(ctx, pts, X, Y); ctx.strokeStyle = COUL.routeBord; ctx.lineWidth = 5; ctx.stroke();
      tracer(ctx, pts, X, Y); ctx.strokeStyle = interp; ctx.lineWidth = 3; ctx.stroke();
    }
    /* pont sur la rivière (au croisement de la route nord-sud) */
    if (geo.litRiviere) {
      const xPont = geo.centre.x + Math.cos(-Math.PI / 2 + 0.15) * 0.06;
      const yPont = geo.litRiviere(xPont);
      ctx.save();
      ctx.translate(X(xPont), Y(yPont)); ctx.rotate(0.2);
      ctx.fillStyle = '#F6F1E4'; ctx.strokeStyle = COUL.encre; ctx.lineWidth = 1;
      ctx.fillRect(-5, -9, 10, 18); ctx.strokeRect(-5, -9, 10, 18);
      ctx.restore();
    }

    /* 7. rues du bourg */
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a1 = rng() * Math.PI * 2, a2 = a1 + 0.6 + rng() * 1.4;
      const r1 = 0.03 + rng() * 0.10, r2 = 0.03 + rng() * 0.10;
      const p1 = { x: geo.centre.x + Math.cos(a1) * r1, y: geo.centre.y + Math.sin(a1) * r1 * 0.72 };
      const p2 = { x: geo.centre.x + Math.cos(a2) * r2, y: geo.centre.y + Math.sin(a2) * r2 * 0.72 };
      ctx.beginPath(); ctx.moveTo(X(p1.x), Y(p1.y));
      ctx.quadraticCurveTo(X((p1.x + p2.x) / 2 + (rng() - 0.5) * 0.02), Y((p1.y + p2.y) / 2), X(p2.x), Y(p2.y));
      ctx.strokeStyle = COUL.rueBord; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(p1.x), Y(p1.y));
      ctx.quadraticCurveTo(X((p1.x + p2.x) / 2 + (rng() - 0.5) * 0.02), Y((p1.y + p2.y) / 2), X(p2.x), Y(p2.y));
      ctx.strokeStyle = COUL.rue; ctx.lineWidth = 1.8; ctx.stroke();
    }
    ctx.lineCap = 'butt';

    /* 8. bâti — la densité suit la population, les départs laissent des maisons vides */
    const positions = [];
    let essais = 0;
    while (positions.length < 400 && essais < 3000) {
      essais++;
      const surRoute = rng() < 0.45 && routes.length;
      let px, py;
      if (surRoute) {
        const rt = routes[Math.floor(rng() * routes.length)];
        const seg = Math.min(rt.length - 1, 1 + Math.floor(rng() * 4));
        const t = rng();
        px = rt[seg - 1].x + (rt[seg].x - rt[seg - 1].x) * t + (rng() - 0.5) * 0.03;
        py = rt[seg - 1].y + (rt[seg].y - rt[seg - 1].y) * t + (rng() - 0.5) * 0.025;
      } else {
        const a = rng() * Math.PI * 2, r = Math.pow(rng(), 1.6) * 0.14;
        px = geo.centre.x + Math.cos(a) * r;
        py = geo.centre.y + Math.sin(a) * r * 0.72;
      }
      if (px < 0.02 || px > 0.98 || py < geo.foretNord + 0.03) continue;
      if (geo.mer && py > geo.mer - 0.055) continue;
      if (geo.litRiviere && Math.abs(py - geo.litRiviere(px)) < 0.022) continue;
      positions.push({ x: px, y: py, r: rng() * Math.PI, w: 3 + rng() * 3.2, h: 2.5 + rng() * 2.5 });
    }
    const ratioPop = S.population / S.populationInitiale;
    const nbBase = Math.max(40, Math.min(400, Math.round(S.populationInitiale / 55)));
    const nbMaisons = Math.max(30, Math.min(400, Math.round(nbBase * Math.max(ratioPop, 1))));
    const nbVacantes = ratioPop < 1 ? Math.round(nbBase * (1 - ratioPop)) : 0;
    for (let i = 0; i < Math.min(nbMaisons, positions.length); i++) {
      const p = positions[i];
      const vacante = i >= nbMaisons - nbVacantes;
      ctx.save();
      ctx.translate(X(p.x), Y(p.y)); ctx.rotate(p.r);
      ctx.fillStyle = vacante ? COUL.vacant : COUL.maison;
      ctx.strokeStyle = vacante ? COUL.vacantBord : COUL.maisonBord;
      ctx.lineWidth = 0.7;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    /* 9. monuments */
    plaque(ctx, X(geo.centre.x), Y(geo.centre.y), '🏛️', 'MAIRIE', 15);
    plaque(ctx, X(geo.centre.x + 0.045), Y(geo.centre.y - 0.075), '⛪', '', 13);

    /* 10. équipements construits */
    const slots = slotsEquipements(geo);
    const uniques = [];
    for (const e of S.equipements) {
      const def = EQUIPEMENTS.find(d => d.id === e.type);
      if (!def || def.chantier) continue; // les chantiers (voirie, LED) se lisent ailleurs
      uniques.push(def);
    }
    uniques.slice(0, slots.length).forEach((def, i) => {
      plaque(ctx, X(slots[i].x), Y(slots[i].y), def.icone, def.nom.split(' ')[0].toUpperCase(), 13);
    });

    /* 11. neige : voile discret */
    if (saison === 'hiver') {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 160; i++) { ctx.fillRect(rng() * W, rng() * H, 1.4, 1.4); }
    }

    /* 12. grain du papier */
    ctx.fillStyle = 'rgba(70,55,30,0.04)';
    for (let i = 0; i < 350; i++) { ctx.fillRect(rng() * W, rng() * H, 1, 1); }

    /* 13. rose des vents */
    ctx.font = '600 10px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.fillStyle = COUL.encre; ctx.textAlign = 'center'; ctx.globalAlpha = 0.75;
    ctx.beginPath(); ctx.moveTo(W - 26, 34); ctx.lineTo(W - 22, 22); ctx.lineTo(W - 18, 34); ctx.closePath();
    ctx.fill();
    ctx.fillText('N', W - 22, 46);
    ctx.globalAlpha = 1;
  }

  function tracer(ctx, pts, X, Y) {
    ctx.beginPath();
    ctx.moveTo(X(pts[0].x), Y(pts[0].y));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(X(pts[i].x), Y(pts[i].y));
  }

  function plaque(ctx, x, y, emoji, label, taille) {
    ctx.save();
    ctx.shadowColor = 'rgba(60,45,20,0.35)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1.5;
    ctx.fillStyle = '#FBF8EE';
    arrondi(ctx, x - taille * 0.85, y - taille * 0.85, taille * 1.7, taille * 1.7, 4);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#B98F45'; ctx.lineWidth = 1.2;
    arrondi(ctx, x - taille * 0.85, y - taille * 0.85, taille * 1.7, taille * 1.7, 4);
    ctx.stroke();
    ctx.font = `${taille}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y + 1);
    if (label) {
      ctx.font = '600 7.5px "Bricolage Grotesque", system-ui, sans-serif';
      ctx.fillStyle = COUL.encre;
      ctx.strokeStyle = 'rgba(237,231,213,0.85)'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.strokeText(label, x, y + taille * 1.45);
      ctx.fillText(label, x, y + taille * 1.45);
    }
    ctx.restore();
  }

  function arrondi(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function lerpCouleur(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  return { dessiner, posCrise };
})();
