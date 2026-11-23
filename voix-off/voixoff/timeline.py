"""Construit la voix off d'une vidéo : audio par scène, timings, déclencheurs, sous-titres."""
import json
import tempfile
from pathlib import Path

import numpy as np

from . import subtitles
from .align import aligner, transcrire, _sous_mots
from .cache import Cache, cle
from .config import DEFAUTS, fusion
from .textnorm import normaliser
from .tts import (appliquer_prononciation, creer_moteur, duree_wav, ecrire_wav, identite_voix,
                  lire_wav, rogner_silences)


class ErreurScript(Exception):
    pass


def trouver_expression(expr: str, mots: list[dict], occurrence: int = 1):
    """Repère « 650 euros » dans les mots datés d'une scène -> (indice premier mot, dernier)."""
    cible = normaliser(expr)
    if not cible:
        raise ErreurScript(f"Déclencheur vide : « {expr} »")
    subs, ref = _sous_mots([m["texte"] for m in mots])
    trouves = [i for i in range(len(subs) - len(cible) + 1) if subs[i:i + len(cible)] == cible]
    if len(trouves) < occurrence:
        return None
    i = trouves[occurrence - 1]
    return ref[i], ref[i + len(cible) - 1]


def construire(script: Path, sortie: Path, forcer=False, moteur=None, log=print) -> dict:
    data = json.loads(Path(script).read_text("utf-8"))
    cfg = fusion(DEFAUTS, {k: v for k, v in data.items() if k != "scenes"})
    if moteur:
        cfg["voix"] = {**cfg["voix"], "moteur": moteur, "voix": None}
    scenes_in = data.get("scenes") or []
    if not scenes_in:
        raise ErreurScript("Le script ne contient aucune scène.")
    ids = [s.get("id") for s in scenes_in]
    if len(set(ids)) != len(ids) or None in ids:
        raise ErreurScript("Chaque scène doit avoir un « id » unique.")

    sortie = Path(sortie)
    (sortie / "audio").mkdir(parents=True, exist_ok=True)
    cache = Cache()
    fps = cfg["video"]["fps"]
    voix_id = identite_voix(cfg["voix"])
    moteur_tts = None
    stats = {"audio_cache": 0, "audio_genere": 0, "align_cache": 0, "align_calcule": 0}

    scenes, pistes = [], []
    t = 0.0
    sr_global = None
    for sc in scenes_in:
        sid, texte = sc["id"], (sc.get("texte") or "").strip()
        if not texte:
            raise ErreurScript(f"Scène « {sid} » : texte vide.")
        regles = {**cfg["prononciation"], **(sc.get("prononciation") or {})}
        texte_voix = appliquer_prononciation(texte, regles)

        # 1) Audio (en cache si le texte et la voix n'ont pas changé)
        # 2) Timing mot par mot avec Whisper (transcription en cache, appariement refait à chaque fois)
        # Contrôle qualité : une voix neuronale peut « dérailler » (mots avalés, bruit). Si Whisper
        # reconnaît moins de 80 % des mots, la scène est regénérée (2 essais de plus, intonation plus sage).
        k_audio = cle("audio", voix_id, texte_voix)
        wav = cache.chemin(k_audio, "wav")
        k_align = cle("whisper", k_audio, texte, cfg["whisper"].get("modele"))
        refaire = forcer
        for essai in range(3):
            if refaire or not cache.a(k_audio, "wav"):
                if moteur_tts is None:
                    log(f"Chargement de la voix ({cfg['voix']['moteur']})…")
                    moteur_tts = creer_moteur(cfg["voix"])
                temp0 = getattr(moteur_tts, "temperature", None)
                if temp0 is not None and essai > 0:
                    moteur_tts.temperature = max(0.5, temp0 - 0.1 * essai)
                log(f"  [{sid}] synthèse…" + (f" (nouvel essai {essai})" if essai else ""))
                with tempfile.TemporaryDirectory() as tmp:
                    brut = Path(tmp) / "brut.wav"
                    moteur_tts.synthetiser(texte_voix, brut)
                    pcm, sr = lire_wav(brut)
                    ecrire_wav(wav, rogner_silences(pcm, sr), sr)
                if temp0 is not None:
                    moteur_tts.temperature = temp0
                stats["audio_genere"] += 1
                refaire = True  # l'alignement doit suivre le nouvel audio
            else:
                stats["audio_cache"] += 1
            duree_voix = duree_wav(wav)
            if refaire or not cache.a(k_align, "json"):
                log(f"  [{sid}] alignement Whisper…")
                cache.ecrire_json(k_align, {"whisper": transcrire(wav, texte, cfg["whisper"])})
                stats["align_calcule"] += 1
            else:
                stats["align_cache"] += 1
            mots_scene, reconnus = aligner(texte, cache.lire_json(k_align)["whisper"], duree_voix)
            if reconnus >= 0.8 or cfg["voix"].get("moteur") not in ("kyutai", "pocket"):
                break
            log(f"  ⚠ [{sid}] {round(reconnus * 100)} % des mots reconnus : la voix a mal lu, on recommence.")
            refaire = True
        al = {"mots": mots_scene, "reconnus": reconnus}
        if reconnus < 0.8:
            log(f"  ⚠ [{sid}] seulement {round(reconnus * 100)} % des mots reconnus par Whisper : "
                "vérifie la prononciation (règles « prononciation ») ou prends un modèle Whisper plus gros.")

        # 3) Durée de la scène calée sur la voix
        avant = float(sc.get("marge_avant", cfg["marges"]["avant"]))
        apres = float(sc.get("marge_apres", cfg["marges"]["apres"]))
        duree = max(float(sc.get("duree_min", 0)), avant + duree_voix + apres)
        debut, voix_debut = t, t + avant

        mots = [{"texte": m["texte"], "debut": round(voix_debut + m["debut"], 3), "fin": round(voix_debut + m["fin"], 3)} for m in al["mots"]]

        # 4) Déclencheurs d'animation sur un mot-clé
        decl = []
        for d in sc.get("declencheurs") or []:
            expr = d.get("mot") or d.get("mots")
            pos = trouver_expression(expr, mots, int(d.get("occurrence", 1)))
            if pos is None:
                raise ErreurScript(f"Scène « {sid} » : « {expr} » introuvable dans le texte.")
            a, b = pos
            moment = mots[b]["fin"] if d.get("moment") == "fin" else mots[a]["debut"]
            at = round(max(debut, moment + float(d.get("decalage", 0))), 3)
            decl.append({
                "animation": d.get("animation"),
                "mot": expr,
                "debut": at,
                "fin_mot": mots[b]["fin"],
                "debut_dans_scene": round(at - debut, 3),
                "frame": round(at * fps),
                "frame_dans_scene": round((at - debut) * fps),
                **({"donnees": d["donnees"]} if "donnees" in d else {}),
            })

        st = subtitles.blocs(mots, debut + duree, cfg["sous_titres"])
        for m in mots:
            m["frame"] = round(m["debut"] * fps)
        scenes.append({
            "id": sid,
            "texte": texte,
            "debut": round(debut, 3),
            "fin": round(debut + duree, 3),
            "duree": round(duree, 3),
            "frames": round(duree * fps),
            "frame_debut": round(debut * fps),
            "voix": {"fichier": f"audio/{sid}.wav", "debut": round(voix_debut, 3), "duree": round(duree_voix, 3)},
            "mots": mots,
            "declencheurs": decl,
            "sous_titres": st,
            "reconnus": round(al["reconnus"], 3),
        })

        pcm, sr = lire_wav(wav)
        if sr_global and sr != sr_global:
            raise ErreurScript("Toutes les scènes doivent utiliser la même voix (fréquence différente).")
        sr_global = sr
        ecrire_wav(sortie / "audio" / f"{sid}.wav", pcm, sr)
        pistes.append((debut + avant, pcm))
        t += duree

    # 5) Piste complète avec les marges entre les scènes
    total = np.zeros(int(round(t * sr_global)) + 1, dtype=np.int32)
    for at, pcm in pistes:
        i = int(round(at * sr_global))
        total[i:i + len(pcm)] += pcm[: max(0, len(total) - i)]
    ecrire_wav(sortie / "voix_off.wav", np.clip(total, -32768, 32767).astype("<i2"), sr_global)

    timeline = {
        "version": 1,
        "fps": fps,
        "video": cfg["video"],
        "duree": round(t, 3),
        "frames": round(t * fps),
        "audio": "voix_off.wav",
        "voix": cfg["voix"],
        "sous_titres_style": cfg["sous_titres"],
        "scenes": scenes,
    }
    (sortie / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2), "utf-8")
    (sortie / "sous_titres.ass").write_text(subtitles.ass(scenes, cfg["video"], cfg["sous_titres"]), "utf-8")
    (sortie / "sous_titres.srt").write_text(subtitles.srt(scenes), "utf-8")
    from .apercu import ecrire_apercu
    ecrire_apercu(sortie, timeline)
    timeline["_stats"] = stats
    return timeline
