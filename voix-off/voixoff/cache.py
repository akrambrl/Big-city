"""Cache : l'audio et son alignement ne sont recalculés que si le texte (ou la voix) change."""
import hashlib
import json
import shutil
from pathlib import Path

from .config import CACHE, VERSION_CACHE


def cle(*parts) -> str:
    brut = json.dumps([VERSION_CACHE, *parts], ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(brut.encode("utf-8")).hexdigest()[:24]


class Cache:
    def __init__(self, dossier: Path = CACHE):
        self.dossier = Path(dossier)
        self.dossier.mkdir(parents=True, exist_ok=True)

    def chemin(self, k: str, ext: str) -> Path:
        return self.dossier / f"{k}.{ext}"

    def a(self, k: str, ext: str) -> bool:
        p = self.chemin(k, ext)
        return p.exists() and p.stat().st_size > 0

    def lire_json(self, k: str):
        return json.loads(self.chemin(k, "json").read_text("utf-8"))

    def ecrire_json(self, k: str, data) -> None:
        tmp = self.chemin(k, "json.tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), "utf-8")
        tmp.replace(self.chemin(k, "json"))

    def vider(self) -> int:
        n = sum(1 for _ in self.dossier.iterdir())
        shutil.rmtree(self.dossier)
        self.dossier.mkdir(parents=True)
        return n
