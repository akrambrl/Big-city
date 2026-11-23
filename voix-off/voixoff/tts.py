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


class MoteurPocket:
    """Pocket TTS (Kyutai, poids CC BY 4.0) : voix neuronale naturelle, tourne sur CPU.

    `voix` : une voix du catalogue (ex. « javert », « peter_yearsley ») ou un fichier .wav
    à cloner (le clonage demande d'accepter les conditions du modèle sur Hugging Face).
    Les nombres sont écrits en toutes lettres avant la lecture (le modèle lit mal les chiffres).
    """

    nom = "pocket"

    def __init__(self, voix: str = "javert", vitesse: float = 1.0, langue: str = "french_24l", **_):
        from pocket_tts import TTSModel

        self.voix, self.vitesse, self.langue = voix, vitesse, langue
        self._m = TTSModel.load_model(language=langue)
        self._etat = self._m.get_state_for_audio_prompt(voix)
        self.sample_rate = self._m.sample_rate

    def synthetiser(self, texte: str, chemin: Path) -> None:
        from .textnorm import en_toutes_lettres

        texte = en_toutes_lettres(texte)
        # une phrase à la fois (plus stable), avec une courte respiration entre les phrases
        phrases = [p.strip() for p in re.split(r"(?<=[.!?…])\s+", texte) if p.strip()]
        pause = np.zeros(int(self.sample_rate * 0.18), dtype=np.float32)
        morceaux = []
        for p in phrases:
            a = self._m.generate_audio(self._etat, p).numpy().astype(np.float32)
            morceaux.append(raccourcir_silences(a, self.sample_rate))
            morceaux.append(pause)
        audio = np.concatenate(morceaux[:-1]) if morceaux else np.zeros(1, dtype=np.float32)
        audio = normaliser_volume(audio)
        pcm = (np.clip(audio, -1, 1) * 32767).astype("<i2")
        ecrire_wav(chemin, pcm, self.sample_rate)
        if abs(self.vitesse - 1.0) > 0.01:
            accelerer(chemin, self.vitesse)


def normaliser_volume(audio: np.ndarray, cible_db: float = -18.0, crete: float = 0.95) -> np.ndarray:
    """Volume constant d'une scène à l'autre : niveau moyen visé, sans dépasser la crête."""
    actif = audio[np.abs(audio) > 0.01]
    if actif.size == 0:
        return audio
    rms = float(np.sqrt((actif ** 2).mean()))
    gain = min(10 ** (cible_db / 20) / max(rms, 1e-6), crete / max(float(np.abs(audio).max()), 1e-6))
    return audio * gain


def raccourcir_silences(audio: np.ndarray, sr: int, seuil_db: float = -42.0, max_silence: float = 0.28) -> np.ndarray:
    """Ramène les silences internes trop longs à `max_silence` secondes (rythme plus vif)."""
    fen = max(1, int(sr * 0.01))
    n = len(audio) // fen
    if n == 0:
        return audio
    rms = np.sqrt((audio[: n * fen].reshape(n, fen) ** 2).mean(axis=1))
    silence = rms < 10 ** (seuil_db / 20)
    garde = int(max_silence / 0.01)
    morceaux, i = [], 0
    while i < n:
        j = i
        while j < n and silence[j] == silence[i]:
            j += 1
        bloc = audio[i * fen: j * fen]
        if silence[i] and (j - i) > garde:
            # on garde le début et la fin du silence pour des transitions douces
            moitie = garde * fen // 2
            bloc = np.concatenate([bloc[:moitie], bloc[-moitie:]])
        morceaux.append(bloc)
        i = j
    morceaux.append(audio[n * fen:])
    return np.concatenate(morceaux)


def accelerer(chemin: Path, vitesse: float) -> None:
    """Change le débit sans changer la hauteur de la voix (filtre atempo de ffmpeg)."""
    import shutil
    import subprocess

    if not shutil.which("ffmpeg"):
        return  # sans ffmpeg, on garde la vitesse d'origine
    tmp = chemin.with_suffix(".tmp.wav")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(chemin), "-filter:a", f"atempo={vitesse}", str(tmp)], check=True)
    tmp.replace(chemin)


def creer_moteur(cfg: dict):
    moteur = (cfg.get("moteur") or "piper").lower()
    if moteur == "piper":
        return MoteurPiper(cfg.get("voix") or "fr_FR-siwis-medium", float(cfg.get("vitesse", 1.0)), cfg.get("locuteur"))
    if moteur == "kokoro":
        return MoteurKokoro(cfg.get("voix") or "ff_siwis", float(cfg.get("vitesse", 1.0)))
    if moteur == "pocket":
        return MoteurPocket(cfg.get("voix") or "javert", float(cfg.get("vitesse", 1.0)), cfg.get("langue") or "french_24l")
    raise ValueError(f"Moteur inconnu : {moteur} (piper, kokoro ou pocket)")


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
    if moteur == "pocket":
        v = cfg.get("voix") or "javert"
        return Path(v) if v.endswith(".wav") else MODELES / "pocket"  # catalogue : modèle téléchargé à part
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
        "langue": cfg.get("langue"),
        "modele": [st.st_size, int(st.st_mtime)] if st else None,
    }
