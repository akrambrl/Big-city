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
        if "," in s:
            # « 59,90 » -> « cinquante-neuf virgule quatre-vingt-dix » (pas « virgule neuf »)
            entier, decimales = s.split(",")
            mots = f"{num2words(int(entier), lang='fr')} virgule {num2words(int(decimales), lang='fr')}"
        else:
            mots = num2words(int(s), lang="fr")
        return " " + mots.replace("-", " ") + " "
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


_PRIX = re.compile(r"(\d+),(\d{2})\s*(?:€|euros?)\b|(\d+),(\d{2})\s*€")


def en_toutes_lettres(texte: str) -> str:
    """Prépare un texte pour une voix neuronale qui lit mal les chiffres (Pocket TTS) :
    « 64,89 € » -> « soixante-quatre euros quatre-vingt-neuf », « 50 % » -> « cinquante pour cent »,
    « 14 jours » -> « quatorze jours ». La ponctuation est conservée (elle règle les pauses)."""
    if num2words is None:
        return texte
    t = joindre_milliers(texte)

    def prix(m: re.Match) -> str:
        e, c = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
        mots = f"{num2words(int(e), lang='fr')} euros"
        if int(c):
            mots += f" {num2words(int(c), lang='fr')}"
        return mots

    t = _PRIX.sub(prix, t)
    t = re.sub(r"(\d)\s*%", r"\1 pour cent", t)
    t = re.sub(r"(\d)\s*€", r"\1 euros", t)

    def nombre(m: re.Match) -> str:
        s = m.group(0)
        if "," in s:
            e, d = s.split(",")
            return f"{num2words(int(e), lang='fr')} virgule {num2words(int(d), lang='fr')}"
        return num2words(int(s), lang="fr")

    return re.sub(r"\d+(?:,\d+)?", nombre, t)
