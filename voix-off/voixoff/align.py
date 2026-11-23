"""Timing mot par mot : faster-whisper (word_timestamps) recalé sur le texte du script.

On n'affiche jamais la transcription de Whisper : elle sert seulement à dater les mots.
Les mots du script sont appariés à ceux de Whisper après normalisation (difflib), et les
mots que Whisper n'a pas reconnus reçoivent un temps interpolé entre leurs voisins.
"""
import re
from difflib import SequenceMatcher
from pathlib import Path

from .config import MODELES
from .textnorm import decouper_mots, normaliser

_modele = None
_modele_cle = None


def charger_whisper(cfg: dict):
    global _modele, _modele_cle
    from faster_whisper import WhisperModel

    nom = cfg.get("modele", "small")
    cle = (nom, cfg.get("appareil", "cpu"), cfg.get("calcul", "int8"))
    if _modele is None or _modele_cle != cle:
        local = MODELES / "whisper" / nom
        _modele = WhisperModel(str(local) if local.exists() else nom, device=cle[1], compute_type=cle[2])
        _modele_cle = cle
    return _modele


def charger_16k(chemin: Path):
    """WAV -> float32 mono 16 kHz (on évite le décodeur PyAV de faster-whisper)."""
    import numpy as np

    from .tts import lire_wav

    pcm, sr = lire_wav(chemin)
    x = pcm.astype(np.float32) / 32768.0
    if sr != 16000:
        n = int(round(len(x) * 16000 / sr))
        x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)
    return x


def transcrire(chemin: Path, texte: str, cfg: dict) -> list[dict]:
    """Mots de Whisper : [{texte, debut, fin, proba}]."""
    model = charger_whisper(cfg)
    segments, _info = model.transcribe(
        charger_16k(chemin),
        language="fr",
        word_timestamps=True,
        beam_size=5,
        vad_filter=False,
        condition_on_previous_text=False,
        initial_prompt=texte,  # oriente l'orthographe vers celle du script
    )
    mots = []
    for seg in segments:
        for w in seg.words or []:
            mots.append({"texte": w.word.strip(), "debut": float(w.start), "fin": float(w.end), "proba": float(w.probability)})
    return mots


def _sous_mots(mots: list[str]) -> tuple[list[str], list[int]]:
    """Normalise chaque mot ; renvoie les sous-mots et l'indice du mot d'origine."""
    subs, ref = [], []
    for i, m in enumerate(mots):
        for s in normaliser(m):
            subs.append(s)
            ref.append(i)
    return subs, ref


def aligner(texte: str, mots_whisper: list[dict], duree: float) -> tuple[list[dict], float]:
    """Date chaque mot du script. Renvoie (mots, taux de mots reconnus)."""
    script = decouper_mots(texte)
    s_sub, s_ref = _sous_mots(script)

    # Whisper écrit parfois « 1 200 » en deux mots : on les recolle
    fusion = []
    for w in mots_whisper:
        if fusion and re.fullmatch(r"\d{3}[.,!?]?", w["texte"]) and re.fullmatch(r"\d{1,3}", fusion[-1]["texte"]):
            fusion[-1] = {**fusion[-1], "texte": fusion[-1]["texte"] + w["texte"], "fin": w["fin"]}
        else:
            fusion.append(dict(w))

    # Sous-mots Whisper, chacun avec une part du temps de son mot
    w_sub, w_t = [], []
    for w in fusion:
        parts = normaliser(w["texte"])
        if not parts:
            continue
        d = (w["fin"] - w["debut"]) / len(parts)
        for k, p in enumerate(parts):
            w_sub.append(p)
            w_t.append((w["debut"] + k * d, w["debut"] + (k + 1) * d))

    deb = [None] * len(s_sub)
    fin = [None] * len(s_sub)
    sm = SequenceMatcher(a=s_sub, b=w_sub, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            deb[blk.a + k], fin[blk.a + k] = w_t[blk.b + k]
    reconnus = sum(1 for x in deb if x is not None) / max(1, len(s_sub))

    # Interpolation des sous-mots non reconnus (proportionnelle au nombre de lettres)
    n = len(s_sub)
    i = 0
    while i < n:
        if deb[i] is not None:
            i += 1
            continue
        j = i
        while j < n and deb[j] is None:
            j += 1
        t0 = fin[i - 1] if i > 0 else 0.0
        t1 = deb[j] if j < n else duree
        if t1 < t0:
            t1 = t0
        poids = [max(1, len(s_sub[k])) for k in range(i, j)]
        tot = sum(poids)
        t = t0
        for k, p in zip(range(i, j), poids):
            d = (t1 - t0) * p / tot
            deb[k], fin[k] = t, t + d
            t += d
        i = j

    # Regroupement par mot du script
    mots = []
    for idx, m in enumerate(script):
        ks = [k for k, r in enumerate(s_ref) if r == idx]
        if ks:
            d0, f0 = min(deb[k] for k in ks), max(fin[k] for k in ks)
        else:  # mot sans lettres (ex. « — ») : collé au précédent
            d0 = f0 = mots[-1]["fin"] if mots else 0.0
        mots.append({"texte": m, "debut": d0, "fin": f0})

    # Temps croissants et sans chevauchement
    for k in range(len(mots)):
        if k > 0 and mots[k]["debut"] < mots[k - 1]["fin"]:
            mots[k]["debut"] = mots[k - 1]["fin"]
        if mots[k]["fin"] < mots[k]["debut"]:
            mots[k]["fin"] = mots[k]["debut"]
        mots[k]["debut"] = round(min(mots[k]["debut"], duree), 3)
        mots[k]["fin"] = round(min(mots[k]["fin"], duree), 3)
    return mots, reconnus
