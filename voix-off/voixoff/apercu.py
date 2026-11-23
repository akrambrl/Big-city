"""Aperçu HTML autonome : lit voix_off.wav et affiche sous-titres + déclencheurs en direct."""
import json
from pathlib import Path

PAGE = """<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aperçu voix off</title>
<style>
  :root { --jaune: __JAUNE__; --blanc: __BLANC__; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; gap: 12px;
         background: #15161a; color: #eee; font-family: system-ui, sans-serif; }
  #ecran { position: relative; height: min(86vh, 900px); aspect-ratio: __RATIO__; background: #22242b;
           border-radius: 14px; overflow: hidden; box-shadow: 0 10px 40px #0008; }
  #scene { position: absolute; top: 16px; left: 16px; font-size: 13px; opacity: .6; }
  #anim { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
  .pop { font-size: clamp(28px, 6vh, 64px); font-weight: 800; color: var(--jaune);
         animation: pop .5s cubic-bezier(.2,1.6,.4,1); text-align: center; padding: 0 20px; }
  .pop small { display: block; font-size: .35em; color: #fff; opacity: .7; font-weight: 600; }
  @keyframes pop { from { transform: scale(.3); opacity: 0; } }
  #st { position: absolute; left: 6%; right: 6%; bottom: __MARGE__%; text-align: center;
        font-weight: 800; font-size: clamp(18px, 4.3vh, 46px); line-height: 1.15;
        color: var(--blanc); text-shadow: 0 0 6px #000, 0 3px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000; }
  #st span { display: inline-block; transition: transform .08s; }
  #st span.on { color: var(--jaune); transform: scale(1.08); }
  #barre { width: min(90vw, 520px); display: flex; gap: 10px; align-items: center; }
  button { font: inherit; font-weight: 700; border: 0; border-radius: 10px; padding: 10px 18px; background: #ffe600; color: #111; cursor: pointer; }
  input[type=range] { flex: 1; }
  #log { width: min(90vw, 520px); font: 12px ui-monospace, monospace; opacity: .7; max-height: 90px; overflow: auto; }
</style></head>
<body>
<div id="ecran"><div id="scene"></div><div id="anim"></div><div id="st"></div></div>
<div id="barre"><button id="lecture">▶ Lire</button><input id="pos" type="range" min="0" max="1000" value="0"><span id="temps">0.0 s</span></div>
<div id="log"></div>
<audio id="audio" src="voix_off.wav" preload="auto"></audio>
<script>
const T = __TIMELINE__;
const audio = document.getElementById('audio'), st = document.getElementById('st'), anim = document.getElementById('anim');
const scLbl = document.getElementById('scene'), pos = document.getElementById('pos'), temps = document.getElementById('temps'), log = document.getElementById('log');
const blocs = T.scenes.flatMap(s => s.sous_titres);
const decl = T.scenes.flatMap(s => s.declencheurs.map(d => ({...d, scene: s.id})));
let fait = new Set(), dernier = null;
document.getElementById('lecture').onclick = () => audio.paused ? audio.play() : audio.pause();
audio.onplay = () => document.getElementById('lecture').textContent = '❚❚ Pause';
audio.onpause = () => document.getElementById('lecture').textContent = '▶ Lire';
pos.oninput = () => { audio.currentTime = pos.value / 1000 * T.duree; fait = new Set(decl.filter(d => d.debut < audio.currentTime).map(d => d.debut + d.animation)); };
function tick() {
  const t = audio.currentTime;
  pos.value = t / T.duree * 1000; temps.textContent = t.toFixed(1) + ' s';
  const sc = T.scenes.find(s => t >= s.debut && t < s.fin); scLbl.textContent = sc ? 'scène : ' + sc.id : '';
  const b = blocs.find(b => t >= b.debut && t < b.fin);
  if (b !== dernier) { dernier = b; st.innerHTML = b ? b.mots.map(m => '<span></span>').join(' ') : ''; if (b) st.querySelectorAll('span').forEach((el, i) => el.textContent = b.mots[i].texte); }
  if (b) {
    let actif = 0; b.mots.forEach((m, i) => { if (t >= m.debut) actif = i; });
    st.querySelectorAll('span').forEach((el, i) => el.classList.toggle('on', i === actif));
  }
  for (const d of decl) {
    const k = d.debut + d.animation;
    if (t >= d.debut && !fait.has(k)) {
      fait.add(k);
      anim.innerHTML = '<div class="pop">' + d.mot + '<small>animation « ' + d.animation + ' » à ' + d.debut.toFixed(2) + ' s</small></div>';
      log.textContent = '▶ ' + d.debut.toFixed(2) + ' s  ' + d.animation + '  (« ' + d.mot + ' »)\\n' + log.textContent;
    }
  }
  if (sc && !sc.declencheurs.some(d => t >= d.debut)) anim.innerHTML = '';
  requestAnimationFrame(tick);
}
tick();
</script></body></html>
"""


def ecrire_apercu(sortie: Path, timeline: dict) -> None:
    v = timeline["video"]
    st = timeline["sous_titres_style"]
    marge = round((st["marge_bas"] or v["hauteur"] * 0.22) / v["hauteur"] * 100, 1)
    page = (PAGE.replace("__TIMELINE__", json.dumps(timeline, ensure_ascii=False))
            .replace("__RATIO__", f"{v['largeur']} / {v['hauteur']}")
            .replace("__MARGE__", str(marge))
            .replace("__JAUNE__", st["couleur_active"])
            .replace("__BLANC__", st["couleur"]))
    (Path(sortie) / "apercu.html").write_text(page, "utf-8")
