"""Synthèse vocale locale : Piper (par défaut) ou Kokoro (alternative)."""
import re
import wave
from pathlib import Path

import numpy as np

from .config import MODELES


class MoteurPiper:
    nom = "piper"

    def __init__(self, voix: str = "fr_FR-siwis-medium", vitesse: float = 1.0, locuteur=None):
        from piper import PiperVoice, SynthesisConfig

        self.voix = voix
        modele = MODELES / "piper" / f"{voix}.onnx"
        if not modele.exists():
            raise FileNotFoundError(f"Voix Piper introuvable : {modele}. Lance ./install.sh d'abord.")
        self.modele = modele
        self._voice = PiperVoice.load(str(modele))
        self._cfg = SynthesisConfig(length_scale=1.0 / max(0.25, vitesse), speaker_id=locuteur)
        self.vitesse = vitesse
        self.sample_rate = self._voice.config.sample_rate

    def identite(self) -> dict:
        st = self.modele.stat()
        return {"moteur": "piper", "voix": self.voix, "vitesse": self.vitesse, "modele": [st.st_size, int(st.st_mtime)]}

    def synthetiser(self, texte: str, chemin: Path) -> None:
        with wave.open(str(chemin), "wb") as wf:
            self._voice.synthesize_wav(texte, wf, syn_config=self._cfg)


class MoteurKokoro:
    """Kokoro-82M (Apache 2.0) en ONNX, voix française ff_siwis."""

    nom = "kokoro"

    def __init__(self, voix: str = "ff_siwis", vitesse: float = 1.0, **_):
        from kokoro_onnx import Kokoro

        d = MODELES / "kokoro"
        modele, voix_bin = d / "kokoro-v1.0.onnx", d / "voices-v1.0.bin"
        if not modele.exists():
            raise FileNotFoundError(f"Kokoro introuvable dans {d}. Lance ./install.sh --kokoro d'abord.")
        self.modele = modele
        self._k = Kokoro(str(modele), str(voix_bin))
        self.voix = voix
        self.vitesse = vitesse

    def identite(self) -> dict:
        st = self.modele.stat()
        return {"moteur": "kokoro", "voix": self.voix, "vitesse": self.vitesse, "modele": [st.st_size, int(st.st_mtime)]}

    def synthetiser(self, texte: str, chemin: Path) -> None:
        samples, sr = self._k.create(texte, voice=self.voix, speed=self.vitesse, lang="fr-fr")
        pcm = np.clip(np.asarray(samples) * 32767, -32768, 32767).astype("<i2")
        with wave.open(str(chemin), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            wf.writeframes(pcm.tobytes())


def creer_moteur(cfg: dict):
    moteur = (cfg.get("moteur") or "piper").lower()
    if moteur == "piper":
        return MoteurPiper(cfg.get("voix") or "fr_FR-siwis-medium", float(cfg.get("vitesse", 1.0)), cfg.get("locuteur"))
    if moteur == "kokoro":
        return MoteurKokoro(cfg.get("voix") or "ff_siwis", float(cfg.get("vitesse", 1.0)))
    raise ValueError(f"Moteur inconnu : {moteur} (piper ou kokoro)")


def appliquer_prononciation(texte: str, regles: dict) -> str:
    """Remplacements utilisés seulement pour la voix (ex. « PEA » -> « pé eu a »)."""
    for k, v in (regles or {}).items():
        texte = re.sub(rf"(?<!\w){re.escape(k)}(?!\w)", v, texte)
    return texte


# --- Lecture / écriture WAV (mono 16 bits) ---

def lire_wav(chemin: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(chemin), "rb") as wf:
        sr = wf.getframerate()
        n = wf.getnchannels()
        data = np.frombuffer(wf.readframes(wf.getnframes()), dtype="<i2")
    if n > 1:
        data = data.reshape(-1, n).mean(axis=1).astype("<i2")
    return data, sr


def ecrire_wav(chemin: Path, data: np.ndarray, sr: int) -> None:
    with wave.open(str(chemin), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(np.asarray(data, dtype="<i2").tobytes())


def rogner_silences(data: np.ndarray, sr: int, seuil_db: float = -45.0, garde: float = 0.04) -> np.ndarray:
    """Retire le silence au début et à la fin (on garde 40 ms pour ne pas couper l'attaque)."""
    if data.size == 0:
        return data
    seuil = 32768 * 10 ** (seuil_db / 20)
    fen = max(1, int(sr * 0.01))
    n = data.size // fen
    if n == 0:
        return data
    rms = np.sqrt((data[: n * fen].astype(np.float32).reshape(n, fen) ** 2).mean(axis=1))
    actifs = np.where(rms > seuil)[0]
    if actifs.size == 0:
        return data
    g = int(sr * garde)
    debut = max(0, actifs[0] * fen - g)
    fin = min(data.size, (actifs[-1] + 1) * fen + g)
    return data[debut:fin]


def duree_wav(chemin: Path) -> float:
    with wave.open(str(chemin), "rb") as wf:
        return wf.getnframes() / wf.getframerate()


def fichier_modele(cfg: dict) -> Path:
    moteur = (cfg.get("moteur") or "piper").lower()
    if moteur == "kokoro":
        return MODELES / "kokoro" / "kokoro-v1.0.onnx"
    return MODELES / "piper" / f"{cfg.get('voix') or 'fr_FR-siwis-medium'}.onnx"


def identite_voix(cfg: dict) -> dict:
    """Ce qui définit le son produit (sert de clé de cache) sans charger le modèle."""
    p = fichier_modele(cfg)
    st = p.stat() if p.exists() else None
    return {
        "moteur": (cfg.get("moteur") or "piper").lower(),
        "voix": cfg.get("voix"),
        "vitesse": float(cfg.get("vitesse", 1.0)),
        "locuteur": cfg.get("locuteur"),
        "modele": [st.st_size, int(st.st_mtime)] if st else None,
    }
