/* ============================================================
   BIG CITY — Effets « jeu »
   Petits sons synthétiques (WebAudio, zéro fichier), confettis,
   montants qui s'envolent, tremblement d'écran. Tout se coupe
   avec le bouton 🔇 et respecte prefers-reduced-motion.
   ============================================================ */

const FX = (() => {
  let ctx = null;
  let muet = false;
  try { muet = localStorage.getItem('bigcity_muet') === '1'; } catch (e) {}

  const mouvementReduit = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sons ---------- */

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function bip(freq, duree, { type = 'sine', gain = 0.10, delai = 0, glisseVers = null } = {}) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime + delai;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glisseVers) o.frequency.exponentialRampToValueAtTime(glisseVers, t + duree);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + duree + 0.05);
  }

  const SONS = {
    jour:      () => bip(520, 0.07, { type: 'triangle', gain: 0.06 }),
    clic:      () => bip(660, 0.05, { type: 'triangle', gain: 0.06 }),
    question:  () => { bip(660, 0.08); bip(880, 0.10, { delai: 0.09 }); },
    argent:    () => { bip(880, 0.09, { type: 'square', gain: 0.05 }); bip(1318, 0.13, { type: 'square', gain: 0.05, delai: 0.09 }); },
    construire: () => [523, 659, 784, 1046].forEach((f, i) => bip(f, 0.12, { delai: i * 0.08 })),
    crise:     () => { bip(190, 0.4, { type: 'sawtooth', gain: 0.08, glisseVers: 85 }); bip(150, 0.4, { type: 'sawtooth', gain: 0.06, delai: 0.12, glisseVers: 70 }); },
    niveau:    () => [659, 784, 988, 1318].forEach((f, i) => bip(f, 0.14, { delai: i * 0.09 })),
    defaite:   () => [392, 349, 311, 262].forEach((f, i) => bip(f, 0.22, { type: 'triangle', delai: i * 0.18 })),
  };

  function son(nom) {
    if (muet) return;
    try { (SONS[nom] || SONS.clic)(); } catch (e) { /* audio indisponible : tant pis */ }
  }

  function basculerMuet() {
    muet = !muet;
    try { localStorage.setItem('bigcity_muet', muet ? '1' : '0'); } catch (e) {}
    return muet;
  }

  /* ---------- Confettis ---------- */

  const EMOJIS_FETE = ['🎉', '✨', '🎊', '⭐', '🏗️', '💛'];

  function confettis(emojis) {
    if (mouvementReduit()) return;
    const lot = emojis || EMOJIS_FETE;
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = lot[Math.floor(Math.random() * lot.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 240;
      s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      s.style.setProperty('--dy', `${Math.sin(angle) * dist - 160}px`);
      s.style.setProperty('--rot', `${(Math.random() - 0.5) * 540}deg`);
      s.style.left = '50%';
      s.style.top = '40%';
      s.style.fontSize = `${14 + Math.random() * 16}px`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1300);
    }
  }

  /* ---------- Montant qui s'envole (depuis le porte-monnaie) ---------- */

  function flotteEuro(texte, positif) {
    const cible = document.querySelector('.chip-ressource');
    const rect = cible ? cible.getBoundingClientRect() : { left: window.innerWidth - 160, top: 20, width: 100, height: 30 };
    const f = document.createElement('div');
    f.className = `flottant ${positif ? 'gain' : 'perte'}`;
    f.textContent = texte;
    f.style.left = `${rect.left + rect.width / 2}px`;
    f.style.top = `${rect.top + rect.height}px`;
    document.body.appendChild(f);
    requestAnimationFrame(() => f.classList.add('envol'));
    setTimeout(() => f.remove(), 1400);
  }

  /* ---------- Tremblement d'écran ---------- */

  function secouer() {
    if (mouvementReduit()) return;
    document.body.classList.remove('secousse');
    void document.body.offsetWidth; // relance l'animation
    document.body.classList.add('secousse');
    setTimeout(() => document.body.classList.remove('secousse'), 600);
  }

  return { son, basculerMuet, get muet() { return muet; }, confettis, flotteEuro, secouer };
})();
