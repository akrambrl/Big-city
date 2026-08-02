/* ============================================================
   BIG CITY — Carte du monde explorable
   Ta commune au centre d'une région : balade-toi (glisser),
   zoome (molette, pincement, boutons) et découvre les villes
   voisines. Canvas 2D, déterministe (graine = nom de commune).
   Coordonnées monde : ta commune occupe [0,1]×[0,1],
   la région s'étend de (−1.1,−0.6) à (2.1,1.6).
   ============================================================ */

const CarteCommune = (() => {

  const MONDE = { x1: -1.1, y1: -0.6, x2: 2.1, y2: 1.6 };
  const ZOOM_MIN = 0.42, ZOOM_MAX = 3.2;

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

  /* Palettes saisonnières */
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

  /* Emplacements des crises (coordonnées monde) */
  const POS_CRISES = {
    crise_feu_foret: { x: 0.63, y: 0.15 },
    crise_inondation: { x: 0.36, y: 0.63 },
    crise_canicule: { x: 0.50, y: 0.47 },
    crise_tempete: { x: 0.33, y: 0.40 },
    crise_neige: { x: 0.60, y: 0.34 },
    crise_fuite_eau: { x: 0.46, y: 0.55 },
    crise_usine: { x: 0.73, y: 0.48 },
  };

  /* Villages voisins (décor) — complétés par les deux autres communes jouables */
  const VILLAGES = [
    { x: -0.55, y: 0.34, nom: 'Montreuil-les-Prés', taille: 26 },
    { x: 1.55, y: 0.30, nom: 'La Ferté-Vieille', taille: 32 },
    { x: -0.58, y: 1.08, nom: 'Beaumont-du-Lac', taille: 22 },
    { x: 1.62, y: 1.14, nom: 'Saint-Elme', taille: 28 },
    { x: 0.48, y: 1.36, nom: 'Vignolles', taille: 20 },
  ];
  const ANCRES_JOUABLES = [{ x: -0.60, y: 0.82 }, { x: 1.60, y: 0.82 }];

  /* ---------- Caméra ---------- */

  let cam = { cx: 0.5, cy: 0.5, zoom: 1 };
  let camCommune = null;
  let apresDessin = null; // rappel UI (repositionner les marqueurs HTML)

  function cameraPour(S) {
    if (camCommune !== S.commune) {
      cam = { cx: 0.5, cy: 0.5, zoom: 1 };
      camCommune = S.commune;
    }
    return cam;
  }

  function clampCam() {
    cam.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, cam.zoom));
    cam.cx = Math.min(MONDE.x2 - 0.2, Math.max(MONDE.x1 + 0.2, cam.cx));
    cam.cy = Math.min(MONDE.y2 - 0.15, Math.max(MONDE.y1 + 0.15, cam.cy));
  }

  function posCrise(criseId, profil) {
    const p = { ...(POS_CRISES[criseId] || { x: 0.5, y: 0.45 }) };
    if (profil === 'touristique' && criseId === 'crise_inondation') p.y = 0.72;
    return p;
  }

  /* Position monde → pourcentages écran (pour les marqueurs HTML) */
  function versEcranPct(pos) {
    const x = 50 + (pos.x - cam.cx) * cam.zoom * 100;
    const y = 50 + (pos.y - cam.cy) * cam.zoom * 100;
    const marge = 5;
    return { x, y, visible: x > marge && x < 100 - marge && y > marge && y < 100 - marge };
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
    cameraPour(S);
    const z = cam.zoom;
    const X = wx => W / 2 + (wx - cam.cx) * z * W;
    const Y = wy => H / 2 + (wy - cam.cy) * z * H;
    const visible = (px, py, marge = 60) => px > -marge && px < W + marge && py > -marge && py < H + marge;
    const s = z; // échelle des épaisseurs et tailles
    const sEtiquette = Math.min(1.5, Math.max(0.62, z)); // les étiquettes restent lisibles

    /* 1. papier */
    ctx.fillStyle = COUL.papier;
    ctx.fillRect(0, 0, W, H);

    /* 2. courbes de niveau au nord de la région */
    ctx.strokeStyle = COUL.contour; ctx.lineWidth = Math.max(0.6, s); ctx.globalAlpha = 0.5;
    for (let l = 0; l < 6; l++) {
      const base = -0.42 + l * 0.08;
      ctx.beginPath();
      let premier = true;
      for (let x = MONDE.x1; x <= MONDE.x2 + 0.001; x += 0.04) {
        const y = base + Math.sin(x * 9 + l * 1.7) * 0.016 + Math.sin(x * 23 + l) * 0.007;
        if (premier) { ctx.moveTo(X(x), Y(y)); premier = false; } else ctx.lineTo(X(x), Y(y));
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* 3. parcelles agricoles sur toute la région */
    const bourgs = bourgsVoisins(S);
    const cols = 34, rows = 13;
    const pasX = (MONDE.x2 - MONDE.x1) / cols, pasY = (MONDE.y2 - MONDE.y1) / rows;
    const coins = [];
    for (let i = 0; i <= cols; i++) {
      coins[i] = [];
      for (let j = 0; j <= rows; j++) {
        coins[i][j] = {
          x: MONDE.x1 + i * pasX + (i > 0 && i < cols ? (rng() - 0.5) * pasX * 0.5 : 0),
          y: MONDE.y1 + j * pasY + (j > 0 && j < rows ? (rng() - 0.5) * pasY * 0.4 : 0),
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
        if (bourgs.some(v => Math.hypot(cx - v.x, (cy - v.y) * 1.3) < 0.085)) continue;
        const px = X(cx), py = Y(cy);
        if (!visible(px, py, 180)) continue;
        ctx.beginPath();
        ctx.moveTo(X(c[0].x), Y(c[0].y));
        for (let k = 1; k < 4; k++) ctx.lineTo(X(c[k].x), Y(c[k].y));
        ctx.closePath();
        ctx.fillStyle = teinte; ctx.fill();
        ctx.strokeStyle = COUL.parcelle; ctx.lineWidth = Math.max(0.5, 0.8 * s); ctx.globalAlpha = 0.7; ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    /* 4. massif forestier : bande nord de toute la région */
    const arbres = FORET[saison];
    for (let i = 0; i < 640; i++) {
      const x = MONDE.x1 + rng() * (MONDE.x2 - MONDE.x1);
      const y = MONDE.y1 + 0.05 + rng() * (geo.foretNord - MONDE.y1 - 0.03) + Math.sin(x * 6) * 0.02;
      const r = (2.2 + rng() * 3.2) * s;
      const px = X(x), py = Y(y);
      if (!visible(px, py)) continue;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 7);
      ctx.fillStyle = arbres[Math.floor(rng() * arbres.length)]; ctx.fill();
      if (saison === 'hiver' && rng() > 0.6) {
        ctx.beginPath(); ctx.arc(px - r * 0.25, py - r * 0.3, r * 0.45, 0, 7);
        ctx.fillStyle = '#F4F6F2'; ctx.fill();
      }
    }

    /* 5. eau : mer (littoral) ou rivière, à travers toute la région */
    if (geo.mer !== null) {
      ctx.beginPath(); ctx.moveTo(X(MONDE.x1), Y(geo.mer - 0.045));
      for (let x = MONDE.x1; x <= MONDE.x2 + 0.001; x += 0.05) ctx.lineTo(X(x), Y(geo.mer - 0.045 + Math.sin(x * 7 + 1) * 0.012));
      ctx.lineTo(X(MONDE.x2), Y(MONDE.y2 + 0.2)); ctx.lineTo(X(MONDE.x1), Y(MONDE.y2 + 0.2)); ctx.closePath();
      ctx.fillStyle = COUL.sable; ctx.fill();
      ctx.beginPath(); ctx.moveTo(X(MONDE.x1), Y(geo.mer));
      for (let x = MONDE.x1; x <= MONDE.x2 + 0.001; x += 0.05) ctx.lineTo(X(x), Y(geo.mer + Math.sin(x * 7) * 0.014));
      ctx.lineTo(X(MONDE.x2), Y(MONDE.y2 + 0.2)); ctx.lineTo(X(MONDE.x1), Y(MONDE.y2 + 0.2)); ctx.closePath();
      ctx.fillStyle = COUL.eau; ctx.fill();
      ctx.strokeStyle = COUL.eauBord; ctx.lineWidth = 1.5 * s; ctx.stroke();
      ctx.strokeStyle = COUL.eauClair; ctx.lineWidth = Math.max(0.7, s);
      for (let i = 0; i < 40; i++) {
        const wx = MONDE.x1 + rng() * (MONDE.x2 - MONDE.x1), wy = geo.mer + 0.05 + rng() * (MONDE.y2 - geo.mer - 0.02);
        const px = X(wx), py = Y(wy);
        if (!visible(px, py)) continue;
        ctx.beginPath(); ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + 8 * s, py - 4 * s, px + 16 * s, py);
        ctx.stroke();
      }
      ctx.strokeStyle = '#9C8B6B'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(0.55), Y(geo.mer - 0.01)); ctx.lineTo(X(0.585), Y(geo.mer + 0.07)); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.font = `${11 * s}px serif`; ctx.textAlign = 'center';
      ctx.fillText('⛵', X(0.63), Y(geo.mer + 0.10));
      ctx.fillText('⛵', X(0.48), Y(geo.mer + 0.14));
      ctx.fillText('⛵', X(1.42), Y(geo.mer + 0.18));
      ctx.fillText('⛵', X(-0.5), Y(geo.mer + 0.22));
    } else {
      const yR = geo.riviere, larg = (S.profil === 'rurale' ? 9 : 13) * s;
      const lit = x => yR + Math.sin(x * 5.2 + 1.3) * 0.05 + Math.sin(x * 11) * 0.018;
      for (const [couleur, lw, alpha] of [[COUL.eau, larg, 1], [COUL.eauClair, 2 * s, 0.8]]) {
        ctx.strokeStyle = couleur; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.globalAlpha = alpha;
        ctx.beginPath();
        let premier = true;
        for (let x = MONDE.x1; x <= MONDE.x2 + 0.001; x += 0.02) {
          const y = lit(x);
          if (premier) { ctx.moveTo(X(x), Y(y)); premier = false; } else ctx.lineTo(X(x), Y(y));
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      geo.litRiviere = lit;
    }

    /* 6. routes régionales vers les villes voisines */
    for (const v of bourgs) {
      const pts = [geo.centre];
      const n = 6;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        pts.push({
          x: geo.centre.x + (v.x - geo.centre.x) * t + (i < n ? (rng() - 0.5) * 0.05 : 0),
          y: geo.centre.y + (v.y - geo.centre.y) * t + (i < n ? (rng() - 0.5) * 0.04 : 0),
        });
      }
      tracer(ctx, pts, X, Y); ctx.strokeStyle = COUL.routeBord; ctx.lineWidth = 4 * s; ctx.stroke();
      tracer(ctx, pts, X, Y); ctx.strokeStyle = '#EFC98F'; ctx.lineWidth = 2.2 * s; ctx.stroke();
    }

    /* 7. routes principales de ta commune (leur couleur dit l'état de la voirie) */
    const voirie = S.cadre.voirie;
    const usure = Math.max(0, Math.min(1, (70 - voirie) / 50));
    const interp = lerpCouleur(COUL.routeBonne, COUL.routeUsee, usure);
    const angles = geo.mer ? [-0.15, Math.PI + 0.15, -Math.PI / 2, -Math.PI / 3.2] : [0.06, Math.PI - 0.06, -Math.PI / 2 + 0.15, Math.PI / 3.4];
    const routes = [];
    for (const a of angles) {
      const pts = [geo.centre];
      let x = geo.centre.x, y = geo.centre.y;
      for (let st = 0; st < 14; st++) {
        x += Math.cos(a) * 0.075 + (rng() - 0.5) * 0.02;
        y += Math.sin(a) * 0.055 + (rng() - 0.5) * 0.015;
        pts.push({ x, y });
        if (x < -0.02 || x > 1.02 || y < -0.02 || y > 1.02) break;
        if (geo.mer && y > geo.mer - 0.05) break;
      }
      routes.push(pts);
    }
    if (geo.mer) {
      routes.push([{ x: -0.02, y: geo.mer - 0.065 }, { x: 0.35, y: geo.mer - 0.075 }, { x: 0.7, y: geo.mer - 0.06 }, { x: 1.02, y: geo.mer - 0.07 }]);
    }
    for (const pts of routes) {
      tracer(ctx, pts, X, Y); ctx.strokeStyle = COUL.routeBord; ctx.lineWidth = 5 * s; ctx.stroke();
      tracer(ctx, pts, X, Y); ctx.strokeStyle = interp; ctx.lineWidth = 3 * s; ctx.stroke();
    }
    if (geo.litRiviere) {
      const xPont = geo.centre.x + Math.cos(-Math.PI / 2 + 0.15) * 0.06;
      const yPont = geo.litRiviere(xPont);
      ctx.save();
      ctx.translate(X(xPont), Y(yPont)); ctx.rotate(0.2);
      ctx.fillStyle = '#F6F1E4'; ctx.strokeStyle = COUL.encre; ctx.lineWidth = s;
      ctx.fillRect(-5 * s, -9 * s, 10 * s, 18 * s); ctx.strokeRect(-5 * s, -9 * s, 10 * s, 18 * s);
      ctx.restore();
    }

    /* 8. rues du bourg */
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a1 = rng() * Math.PI * 2, a2 = a1 + 0.6 + rng() * 1.4;
      const r1 = 0.03 + rng() * 0.10, r2 = 0.03 + rng() * 0.10;
      const p1 = { x: geo.centre.x + Math.cos(a1) * r1, y: geo.centre.y + Math.sin(a1) * r1 * 0.72 };
      const p2 = { x: geo.centre.x + Math.cos(a2) * r2, y: geo.centre.y + Math.sin(a2) * r2 * 0.72 };
      const mx = (p1.x + p2.x) / 2 + (rng() - 0.5) * 0.02, my = (p1.y + p2.y) / 2;
      ctx.beginPath(); ctx.moveTo(X(p1.x), Y(p1.y));
      ctx.quadraticCurveTo(X(mx), Y(my), X(p2.x), Y(p2.y));
      ctx.strokeStyle = COUL.rueBord; ctx.lineWidth = 3 * s; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(p1.x), Y(p1.y));
      ctx.quadraticCurveTo(X(mx), Y(my), X(p2.x), Y(p2.y));
      ctx.strokeStyle = COUL.rue; ctx.lineWidth = 1.8 * s; ctx.stroke();
    }
    ctx.lineCap = 'butt';

    /* 9. bâti de ta commune — densité liée à la population */
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
      const px = X(p.x), py = Y(p.y);
      if (!visible(px, py)) continue;
      const vacante = i >= nbMaisons - nbVacantes;
      ctx.save();
      ctx.translate(px, py); ctx.rotate(p.r);
      ctx.fillStyle = vacante ? COUL.vacant : COUL.maison;
      ctx.strokeStyle = vacante ? COUL.vacantBord : COUL.maisonBord;
      ctx.lineWidth = 0.7 * s;
      ctx.fillRect(-p.w * s / 2, -p.h * s / 2, p.w * s, p.h * s);
      ctx.strokeRect(-p.w * s / 2, -p.h * s / 2, p.w * s, p.h * s);
      ctx.restore();
    }

    /* 10. les autres villes de la région */
    for (const v of bourgs) {
      const rngV = mulberry32(graine(v.nom));
      for (let i = 0; i < v.taille; i++) {
        const a = rngV() * Math.PI * 2, r = Math.pow(rngV(), 1.4) * 0.055;
        const hx = v.x + Math.cos(a) * r, hy = v.y + Math.sin(a) * r * 0.72;
        const px = X(hx), py = Y(hy);
        if (!visible(px, py)) continue;
        ctx.save();
        ctx.translate(px, py); ctx.rotate(rngV() * Math.PI);
        ctx.fillStyle = COUL.maison; ctx.strokeStyle = COUL.maisonBord; ctx.lineWidth = 0.6 * s;
        const w = (2.5 + rngV() * 2.5) * s, h = (2 + rngV() * 2) * s;
        ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }
      const px = X(v.x), py = Y(v.y);
      if (visible(px, py, 120)) {
        plaque(ctx, px, py, v.icone || '⛪', v.nom.toUpperCase(), 12 * sEtiquette);
        if (z >= 1.15 && v.population) {
          ctx.font = `500 ${8 * sEtiquette}px "Fredoka", system-ui, sans-serif`;
          ctx.fillStyle = COUL.encre; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(`${v.population.toLocaleString('fr-FR')} hab.`, px, py + 12 * sEtiquette * 2.4);
        }
      }
    }

    /* 11. monuments de ta commune */
    plaque(ctx, X(geo.centre.x), Y(geo.centre.y), '🏛️', 'MAIRIE', 15 * sEtiquette);
    plaque(ctx, X(geo.centre.x + 0.045), Y(geo.centre.y - 0.075), '⛪', '', 13 * sEtiquette);

    /* 12. équipements construits */
    const slots = slotsEquipements(geo);
    const uniques = [];
    for (const e of S.equipements) {
      const def = EQUIPEMENTS.find(d => d.id === e.type);
      if (!def || def.chantier) continue;
      uniques.push(def);
    }
    uniques.slice(0, slots.length).forEach((def, i) => {
      const px = X(slots[i].x), py = Y(slots[i].y);
      if (visible(px, py, 120)) plaque(ctx, px, py, def.icone, def.nom.split(' ')[0].toUpperCase(), 13 * sEtiquette);
    });

    /* 13. neige et grain de papier (espace écran) */
    if (saison === 'hiver') {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 160; i++) { ctx.fillRect(rng() * W, rng() * H, 1.4, 1.4); }
    }
    ctx.fillStyle = 'rgba(70,55,30,0.04)';
    for (let i = 0; i < 350; i++) { ctx.fillRect(rng() * W, rng() * H, 1, 1); }

    /* 14. rose des vents (espace écran) */
    ctx.font = '600 10px "Fredoka", system-ui, sans-serif';
    ctx.fillStyle = COUL.encre; ctx.textAlign = 'center'; ctx.globalAlpha = 0.75;
    ctx.beginPath(); ctx.moveTo(W - 26, 34); ctx.lineTo(W - 22, 22); ctx.lineTo(W - 18, 34); ctx.closePath();
    ctx.fill();
    ctx.fillText('N', W - 22, 46);
    ctx.globalAlpha = 1;

    if (apresDessin) apresDessin();
  }

  /* Villes voisines : cinq villages + les deux autres communes jouables */
  function bourgsVoisins(S) {
    const geo = geometrie(S.profil);
    const bourgs = VILLAGES.map(v => {
      const rngV = mulberry32(graine(v.nom));
      return { ...v, y: ajusterY(v.y, geo), population: 400 + Math.floor(rngV() * 2600) };
    });
    let i = 0;
    for (const [id, p] of Object.entries(PROFILS)) {
      if (id === S.profil || i >= ANCRES_JOUABLES.length) continue;
      const a = ANCRES_JOUABLES[i++];
      bourgs.push({
        x: a.x, y: ajusterY(a.y, geo),
        nom: p.nom, icone: p.icone, taille: 55, population: p.population,
      });
    }
    return bourgs;
  }
  function ajusterY(y, geo) {
    let r = Math.max(y, geo.foretNord + 0.10);
    if (geo.mer) r = Math.min(r, geo.mer - 0.12);
    return r;
  }

  /* ---------- Interactions : glisser, molette, pincement ---------- */

  function attacher(canvas, S, rappel) {
    apresDessin = rappel || null;
    const pointeurs = new Map();
    let dernierEcart = null;

    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      zoomAutour(canvas, S, Math.pow(1.15, -e.deltaY / 100),
        (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
    }, { passive: false });

    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!pointeurs.has(e.pointerId)) return;
      const avant = pointeurs.get(e.pointerId);
      pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const rect = canvas.getBoundingClientRect();
      if (pointeurs.size === 1) {
        cam.cx -= (e.clientX - avant.x) / (cam.zoom * rect.width);
        cam.cy -= (e.clientY - avant.y) / (cam.zoom * rect.height);
        clampCam();
        dessiner(canvas, S);
      } else if (pointeurs.size === 2) {
        const [p1, p2] = [...pointeurs.values()];
        const ecart = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dernierEcart) {
          const mx = ((p1.x + p2.x) / 2 - rect.left) / rect.width;
          const my = ((p1.y + p2.y) / 2 - rect.top) / rect.height;
          zoomAutour(canvas, S, ecart / dernierEcart, mx, my);
        }
        dernierEcart = ecart;
      }
    });
    const fin = (e) => {
      pointeurs.delete(e.pointerId);
      if (pointeurs.size < 2) dernierEcart = null;
      if (!pointeurs.size) canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointerup', fin);
    canvas.addEventListener('pointercancel', fin);
  }

  function zoomAutour(canvas, S, facteur, fx = 0.5, fy = 0.5) {
    const ancien = cam.zoom;
    cam.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, cam.zoom * facteur));
    const reel = cam.zoom / ancien;
    // le point sous le curseur reste sous le curseur
    cam.cx += (fx - 0.5) * (reel - 1) / cam.zoom;
    cam.cy += (fy - 0.5) * (reel - 1) / cam.zoom;
    clampCam();
    dessiner(canvas, S);
  }

  function zoomer(canvas, S, facteur) { zoomAutour(canvas, S, facteur); }
  function recentrer(canvas, S) {
    cam.cx = 0.5; cam.cy = 0.5; cam.zoom = 1;
    dessiner(canvas, S);
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
      ctx.font = `600 ${Math.max(7, taille * 0.58)}px "Fredoka", system-ui, sans-serif`;
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

  return { dessiner, posCrise, attacher, zoomer, recentrer, versEcranPct };
})();
