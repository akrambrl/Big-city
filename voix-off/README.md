# Voix off locale

Génère la voix off d'une vidéo à partir d'un script, **100 % en local et gratuitement** : aucun service payant, aucune clé API.

- **Synthèse vocale** : [Piper](https://github.com/OHF-Voice/piper1-gpl), voix française `fr_FR-siwis-medium`. Alternative : [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), voix `ff_siwis`.
- **Timing mot par mot** : [faster-whisper](https://github.com/SYSTRAN/faster-whisper) avec `word_timestamps`.
- **Cache** : l'audio et la transcription ne sont recalculés que si le texte (ou la voix) d'une scène change.

À partir de ces timings, l'outil :
1. cale la durée de chaque scène sur la voix ;
2. date les déclencheurs d'animation sur un mot-clé (le montant apparaît quand la voix dit « 650 euros ») ;
3. génère des sous-titres dynamiques de 2 à 4 mots, mot actif surligné en jaune, en bas au centre.

## Installation

```bash
./install.sh                 # Piper + voix siwis + Whisper « small »
./install.sh --kokoro        # ajoute Kokoro (≈ 340 Mo)
./install.sh --whisper medium  # Whisper plus précis (plus lent)
```

Le script crée `.venv/`, installe les paquets Python et télécharge la voix Piper (Hugging Face), le modèle Whisper et, en option, Kokoro. Il faut Python 3.10 à 3.13. ffmpeg est facultatif : il sert seulement à la vidéo de contrôle.

## Utilisation

```bash
./voixoff.sh construire exemple/script.json -o build          # voix + timings + sous-titres
./voixoff.sh construire exemple/script.json -o build --video  # + apercu.mp4 (ffmpeg)
./voixoff.sh construire exemple/script.json --moteur kokoro   # essayer Kokoro
./voixoff.sh dire "Une phrase pour tester la voix." -o test.wav
./voixoff.sh vider-cache
```

Ouvre `build/apercu.html` dans un navigateur pour vérifier le calage : la voix, les sous-titres et les déclencheurs défilent ensemble.

## Le script (`exemple/script.json`)

```json
{
  "voix": { "moteur": "piper", "voix": "fr_FR-siwis-medium", "vitesse": 1.0 },
  "video": { "largeur": 1080, "hauteur": 1920, "fps": 30 },
  "marges": { "avant": 0.25, "apres": 0.5 },
  "prononciation": { "PEA": "pé eu a" },
  "scenes": [
    {
      "id": "accroche",
      "texte": "Julie a 27 ans et elle économise 650 euros par mois.",
      "declencheurs": [{ "mot": "650 euros", "animation": "montant", "donnees": { "valeur": 650 } }]
    }
  ]
}
```

| Champ | Rôle |
|---|---|
| `marges.avant` / `marges.apres` | Silence avant et après la voix dans chaque scène, en secondes. Modifiable par scène avec `marge_avant` / `marge_apres`. |
| `duree_min` (scène) | Durée minimale d'une scène, même si la voix est plus courte. |
| `prononciation` | Remplacements appliqués **seulement à la voix** (les sous-titres gardent le texte d'origine). Globaux ou par scène. |
| `declencheurs[].mot` | Expression à repérer dans le texte. « 650 euros », « 650 € » ou « six cent cinquante euros » sont équivalents. |
| `declencheurs[].moment` | `debut` (par défaut) ou `fin` de l'expression. |
| `declencheurs[].decalage` | Avance ou retard en secondes (ex. `-0.1` pour anticiper l'animation). |
| `declencheurs[].occurrence` | Si l'expression apparaît plusieurs fois (1 par défaut). |
| `declencheurs[].donnees` | Recopié tel quel dans la timeline pour ton moteur d'animation. |
| `sous_titres` | `mots_min`, `mots_max`, `caracteres_max`, `police`, `taille`, `marge_bas`, `couleur`, `couleur_active`. |
| `whisper.modele` | `small` par défaut ; `medium` ou `large-v3` si des mots sont mal reconnus. |

## Ce qui est produit (`build/`)

| Fichier | Contenu |
|---|---|
| `timeline.json` | Pour ton outil de montage : début, fin et durée de chaque scène (en secondes et en frames), chaque mot daté, les déclencheurs datés (`debut`, `frame`, `frame_dans_scene`), les groupes de sous-titres. |
| `voix_off.wav` | Toute la voix off, marges comprises, prête à poser sur la vidéo. |
| `audio/<scene>.wav` | La voix de chaque scène, sans silence au début ni à la fin. |
| `sous_titres.ass` | Sous-titres karaoké (mot actif en jaune) à graver avec `ffmpeg -vf ass=sous_titres.ass`. |
| `sous_titres.srt` | Les mêmes groupes, sans surlignage. |
| `apercu.html` | Lecteur de contrôle : voix, sous-titres et déclencheurs. |

## Comment le timing est calculé

1. Piper (ou Kokoro) lit le texte de la scène. Le silence au début et à la fin est retiré.
2. faster-whisper transcrit cet audio avec `word_timestamps=True`. Le texte du script lui est donné en `initial_prompt` pour qu'il écrive les mots comme le script.
3. Les mots de Whisper sont appariés aux mots du script, après normalisation : minuscules, sans accents, nombres écrits en lettres (« 650 » → « six cent cinquante »). Un mot que Whisper n'a pas reconnu reçoit un temps interpolé entre ses voisins.
4. **Les sous-titres affichent toujours le texte du script**, jamais la transcription de Whisper.

Le taux de mots reconnus est affiché pour chaque scène, avec un avertissement en dessous de 80 %.

Les sous-titres ne séparent jamais un nombre de son unité (« 650 euros », « 1 200 € », « 30 % »).

## Licences et usage commercial

| Élément | Licence | Usage commercial |
|---|---|---|
| Voix **`fr_FR-siwis-medium`** (Piper) | Corpus SIWIS : **CC BY 4.0** | **Oui, avec attribution** |
| Voix **`ff_siwis`** (Kokoro) | Poids Kokoro : Apache 2.0 ; corpus SIWIS : CC BY 4.0 | **Oui, avec attribution** |
| Piper (`piper-tts`) | GPL-3.0 | Oui. La GPL s'applique au logiciel, pas à l'audio qu'il produit. |
| `kokoro-onnx` | MIT | Oui |
| faster-whisper et modèles Whisper | MIT | Oui |
| num2words | LGPL-2.1 | Oui (utilisé comme bibliothèque) |

**Attribution à mettre dans la description de tes vidéos** (exigée par CC BY 4.0) :

> Voix de synthèse : Piper (fr_FR-siwis-medium), entraînée sur le corpus SIWIS, University of Edinburgh, licence CC BY 4.0.

**Voix écartées pour un usage commercial :**
- `fr_FR-tom-medium` est sous AGPLv3 : la licence est mal adaptée à un modèle de voix et son application à l'audio produit est incertaine.
- `fr_FR-upmc-medium` est sous CC BY-SA 4.0 : la clause « partage à l'identique » pourrait s'étendre à tes vidéos.

Les licences proviennent des fiches des modèles (`MODEL_CARD` de Piper, `VOICES.md` de Kokoro), vérifiées en novembre 2026. L'installation copie la fiche de la voix dans `models/piper/`. Ce n'est pas un avis juridique.
