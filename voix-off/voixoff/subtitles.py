"""Sous-titres dynamiques : 2 à 4 mots à la fois, mot actif surligné (jaune par défaut)."""
import re

from .textnorm import finit_phrase

# On ne sépare jamais un nombre de son unité (« 650 | euros »)
UNITES = re.compile(r"^(euros?|€|%|pour|ans?|mois|jours?|heures?|minutes?|dollars?|k€|millions?|milliards?)\b", re.I)


def _lie(m: dict, nxt: dict) -> bool:
    return bool(re.search(r"\d$", m["texte"])) and bool(UNITES.match(nxt["texte"]))


def decouper(mots: list[dict], mn=2, mx=4, cmax=26, pause=0.35) -> list[list[dict]]:
    groupes, cur = [], []
    for i, m in enumerate(mots):
        cur.append(m)
        nxt = mots[i + 1] if i + 1 < len(mots) else None
        if nxt is None:
            coupe = True
        elif _lie(m, nxt):
            coupe = False
        elif len(cur) >= mn and i + 2 < len(mots) and _lie(nxt, mots[i + 2]) and len(cur) + 2 > mx:
            coupe = True  # « 650 euros » ne tiendrait pas : on le garde pour le groupe suivant
        elif len(cur) >= mx:
            coupe = True
        elif len(cur) >= mn and (finit_phrase(m["texte"]) or nxt["debut"] - m["fin"] > pause):
            coupe = True
        elif len(cur) >= mn and len(" ".join(w["texte"] for w in cur)) + 1 + len(nxt["texte"]) > cmax:
            coupe = True
        else:
            coupe = False
        if coupe:
            groupes.append(cur)
            cur = []
    # un mot seul en fin de phrase rejoint le groupe précédent s'il reste de la place
    if len(groupes) >= 2 and len(groupes[-1]) == 1 and len(groupes[-2]) < mx:
        groupes[-2].extend(groupes.pop())
    return groupes


def blocs(mots: list[dict], fin_scene: float, st: dict) -> list[dict]:
    """Groupes datés. Un groupe reste affiché jusqu'au suivant (pas de clignotement)."""
    gs = decouper(mots, st["mots_min"], st["mots_max"], st["caracteres_max"])
    out = []
    for i, g in enumerate(gs):
        debut = g[0]["debut"]
        if i + 1 < len(gs) and gs[i + 1][0]["debut"] - g[-1]["fin"] < 0.6:
            fin = gs[i + 1][0]["debut"]
        else:
            fin = min(fin_scene, g[-1]["fin"] + 0.3)
        out.append({"debut": round(debut, 3), "fin": round(max(fin, debut + 0.05), 3), "mots": g})
    return out


# --- Export ASS (gravé avec ffmpeg -vf ass=...) ---

def _t(s: float) -> str:
    cs = int(round(max(0, s) * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    sec, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{sec:02d}.{cs:02d}"


def _couleur_ass(hexa: str) -> str:
    h = hexa.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H00{b}{g}{r}".upper()


def _esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("{", "(").replace("}", ")")


def ass(scenes: list[dict], video: dict, st: dict) -> str:
    W, H = video["largeur"], video["hauteur"]
    taille = st["taille"] or round(H * 0.045)
    marge = st["marge_bas"] or round(H * 0.22)
    blanc, jaune = _couleur_ass(st["couleur"]), _couleur_ass(st["couleur_active"])
    lignes = [
        "[Script Info]",
        "ScriptType: v4.00+",
        f"PlayResX: {W}",
        f"PlayResY: {H}",
        "WrapStyle: 0",
        "ScaledBorderAndShadow: yes",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: VoixOff,{st['police']},{taille},{blanc},{blanc},&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,{max(3, taille // 16)},2,2,60,60,{marge},1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    for sc in scenes:
        for b in sc["sous_titres"]:
            ms = b["mots"]
            for i, m in enumerate(ms):
                d = b["debut"] if i == 0 else m["debut"]
                f = ms[i + 1]["debut"] if i + 1 < len(ms) else b["fin"]
                if f <= d:
                    continue
                parts = []
                for j, w in enumerate(ms):
                    t = _esc(w["texte"])
                    parts.append(f"{{\\c{jaune}\\fscx108\\fscy108}}{t}{{\\c{blanc}\\fscx100\\fscy100}}" if j == i else t)
                lignes.append(f"Dialogue: 0,{_t(d)},{_t(f)},VoixOff,,0,0,0,,{' '.join(parts)}")
    return "\n".join(lignes) + "\n"


def srt(scenes: list[dict]) -> str:
    out, n = [], 1

    def ts(s):
        ms = int(round(s * 1000))
        h, ms = divmod(ms, 3600000)
        m, ms = divmod(ms, 60000)
        sec, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

    for sc in scenes:
        for b in sc["sous_titres"]:
            out.append(f"{n}\n{ts(b['debut'])} --> {ts(b['fin'])}\n{' '.join(w['texte'] for w in b['mots'])}\n")
            n += 1
    return "\n".join(out)
