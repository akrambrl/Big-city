"""Normalisation du texte français pour comparer le script et la transcription Whisper.

Le script dit « 650 euros », Whisper peut écrire « 650 euros » ou « six cent cinquante
euros » : on ramène les deux côtés à la même suite de mots simples (minuscules, sans
accents ni ponctuation, nombres écrits en toutes lettres).
"""
import re
import unicodedata

try:
    from num2words import num2words
except ImportError:  # dépendance facultative : sans elle, les nombres restent en chiffres
    num2words = None

SYMBOLES = {
    "€": " euros ",
    "%": " pour cent ",
    "$": " dollars ",
    "&": " et ",
    "+": " plus ",
}

_GROUPES = re.compile(r"(?<=\d)[\s  .](?=\d{3}\b)")
_NOMBRE = re.compile(r"\d+(?:,\d+)?")


def joindre_milliers(texte: str) -> str:
    """« 1 200 » ou « 1.200 » -> « 1200 » (un seul nombre)."""
    prev = None
    while prev != texte:
        prev = texte
        texte = _GROUPES.sub("", texte)
    return texte


def _nombre_en_lettres(m: re.Match) -> str:
    s = m.group(0)
    if num2words is None:
        return s
    try:
        val = float(s.replace(",", ".")) if "," in s else int(s)
        return " " + num2words(val, lang="fr").replace("-", " ") + " "
    except Exception:
        return s


def sans_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normaliser(texte: str) -> list[str]:
    """Texte -> liste de mots normalisés (« 650€ » -> six, cent, cinquante, euros)."""
    t = joindre_milliers(texte)
    for k, v in SYMBOLES.items():
        t = t.replace(k, v)
    t = _NOMBRE.sub(_nombre_en_lettres, t)
    t = sans_accents(t.lower())
    t = re.sub(r"['’`\-]", " ", t)
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    return t.split()


def decouper_mots(texte: str) -> list[str]:
    """Découpe le script en mots affichables (ponctuation collée au mot).

    Les groupes de milliers restent ensemble (« 1 200 » est un seul mot affiché) et un
    symbole isolé (« € », « % », « ! ») est rattaché au mot précédent par une espace
    insécable.
    """
    lien = "\ue000"  # caractère privé : str.split() couperait sur une espace insécable
    t = re.sub(r"(?<=\d)[\u00a0\u202f ](?=\d{3}\b)", lien, texte)
    mots: list[str] = []
    for b in t.split():
        if mots and not re.search(r"\w", b):
            mots[-1] = mots[-1] + lien + b
        else:
            mots.append(b)
    return [m.replace(lien, "\u00a0") for m in mots]


def finit_phrase(mot: str) -> bool:
    return bool(re.search(r"[.,;:!?…]$", mot))
