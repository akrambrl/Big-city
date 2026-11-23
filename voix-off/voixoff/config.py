from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
MODELES = RACINE / "models"
CACHE = RACINE / "cache"

# Version du format de cache : à incrémenter si la façon de générer change
VERSION_CACHE = 4

DEFAUTS = {
    "voix": {"moteur": "piper", "voix": "fr_FR-siwis-medium", "vitesse": 1.0},
    "whisper": {"modele": "small", "appareil": "cpu", "calcul": "int8"},
    "marges": {"avant": 0.25, "apres": 0.5},
    "video": {"largeur": 1080, "hauteur": 1920, "fps": 30},
    "sous_titres": {
        "mots_min": 2,
        "mots_max": 4,
        "caracteres_max": 26,
        "police": "Arial",
        "taille": 0,  # 0 = automatique (selon la hauteur de la vidéo)
        "marge_bas": 0,  # 0 = automatique (≈ 22 % de la hauteur)
        "couleur": "#FFFFFF",
        "couleur_active": "#FFE600",
    },
    "prononciation": {},
}


def fusion(base: dict, ajout: dict) -> dict:
    out = dict(base)
    for k, v in (ajout or {}).items():
        out[k] = fusion(base[k], v) if isinstance(v, dict) and isinstance(base.get(k), dict) else v
    return out
