"""Ligne de commande : python -m voixoff <commande> (ou ./voixoff <commande>)."""
import argparse
import subprocess
import sys
import time
from pathlib import Path

from .config import CACHE


def cmd_construire(a):
    from .timeline import ErreurScript, construire

    t0 = time.time()
    try:
        tl = construire(Path(a.script), Path(a.sortie), forcer=a.forcer, moteur=a.moteur)
    except (ErreurScript, FileNotFoundError) as e:
        print(f"Erreur : {e}", file=sys.stderr)
        return 1
    s = tl["_stats"]
    print(f"\n✓ {len(tl['scenes'])} scènes · {tl['duree']:.2f} s · {tl['frames']} frames à {tl['fps']} i/s")
    for sc in tl["scenes"]:
        d = ", ".join(f"{x['animation']}@{x['debut']:.2f}s" for x in sc["declencheurs"]) or "—"
        print(f"  {sc['id']:<14} {sc['debut']:6.2f} → {sc['fin']:6.2f} s  ({sc['duree']:.2f} s)  mots reconnus {round(sc['reconnus'] * 100)} %  déclencheurs : {d}")
    print(f"  audio : {s['audio_cache']} en cache, {s['audio_genere']} généré(s) · alignement : {s['align_cache']} en cache, {s['align_calcule']} calculé(s)")
    print(f"  fichiers : {a.sortie}/timeline.json, voix_off.wav, sous_titres.ass, sous_titres.srt, apercu.html  ({time.time() - t0:.1f} s)")
    if a.video:
        return cmd_video(argparse.Namespace(sortie=a.sortie))
    return 0


def cmd_video(a):
    """Vidéo de contrôle : fond uni + voix + sous-titres gravés (nécessite ffmpeg)."""
    import json

    d = Path(a.sortie)
    tl = json.loads((d / "timeline.json").read_text("utf-8"))
    v = tl["video"]
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", f"color=c=0x22242b:s={v['largeur']}x{v['hauteur']}:r={tl['fps']}:d={tl['duree']}",
        "-i", "voix_off.wav",
        "-vf", "ass=sous_titres.ass",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "apercu.mp4",
    ]
    try:
        subprocess.run(cmd, cwd=d, check=True)
    except FileNotFoundError:
        print("ffmpeg introuvable : installe-le pour générer la vidéo de contrôle.", file=sys.stderr)
        return 1
    print(f"  vidéo de contrôle : {d}/apercu.mp4")
    return 0


def cmd_dire(a):
    from .config import DEFAUTS
    from .tts import creer_moteur

    cfg = dict(DEFAUTS["voix"])
    if a.moteur:
        cfg.update(moteur=a.moteur, voix=None)
    if a.voix:
        cfg["voix"] = a.voix
    cfg["vitesse"] = a.vitesse
    creer_moteur(cfg).synthetiser(a.texte, Path(a.sortie))
    print(f"✓ {a.sortie}")
    return 0


def cmd_vider(_a):
    from .cache import Cache

    print(f"✓ cache vidé ({Cache(CACHE).vider()} fichiers)")
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(prog="voixoff", description="Voix off locale : Piper/Kokoro + timings faster-whisper.")
    sub = p.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("construire", help="génère voix, timings et sous-titres d'un script")
    c.add_argument("script")
    c.add_argument("-o", "--sortie", default="build")
    c.add_argument("--moteur", choices=["piper", "kokoro", "pocket"], help="force le moteur de voix")
    c.add_argument("--forcer", action="store_true", help="ignore le cache")
    c.add_argument("--video", action="store_true", help="génère aussi apercu.mp4 (ffmpeg)")
    c.set_defaults(f=cmd_construire)

    v = sub.add_parser("video", help="vidéo de contrôle à partir d'un dossier construit")
    v.add_argument("-o", "--sortie", default="build")
    v.set_defaults(f=cmd_video)

    d = sub.add_parser("dire", help="teste la voix sur une phrase")
    d.add_argument("texte")
    d.add_argument("-o", "--sortie", default="test.wav")
    d.add_argument("--moteur", choices=["piper", "kokoro", "pocket"])
    d.add_argument("--voix")
    d.add_argument("--vitesse", type=float, default=1.0)
    d.set_defaults(f=cmd_dire)

    x = sub.add_parser("vider-cache", help="supprime l'audio et les timings en cache")
    x.set_defaults(f=cmd_vider)

    a = p.parse_args(argv)
    return a.f(a)


if __name__ == "__main__":
    sys.exit(main())
