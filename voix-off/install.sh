#!/usr/bin/env bash
# Installe tout ce qu'il faut pour la voix off, en local et gratuitement :
#   - Piper TTS + la voix française fr_FR-siwis-medium (CC BY 4.0, usage commercial OK)
#   - faster-whisper + le modèle Whisper (MIT) pour le timing mot par mot
#   - en option (--kokoro) : Kokoro-82M (Apache 2.0) avec la voix ff_siwis
#
# Usage : ./install.sh [--kokoro] [--whisper small|medium|large-v3]
set -euo pipefail

cd "$(dirname "$0")"
WHISPER_MODELE="small"
AVEC_KOKORO=0
while [ $# -gt 0 ]; do
  case "$1" in
    --kokoro) AVEC_KOKORO=1 ;;
    --whisper) WHISPER_MODELE="$2"; shift ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "Option inconnue : $1"; exit 1 ;;
  esac
  shift
done

VOIX="fr_FR-siwis-medium"
VOIX_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium"
KOKORO_URL="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"

etape() { printf '\n\033[1;33m▶ %s\033[0m\n' "$1"; }

telecharger() { # url destination
  local url="$1" dest="$2"
  if [ -s "$dest" ]; then echo "  déjà présent : $dest"; return; fi
  echo "  téléchargement : $(basename "$dest")"
  curl -fL --retry 4 --retry-delay 3 --progress-bar -o "$dest.part" "$url"
  # une page HTML à la place d'un modèle = lien cassé
  if head -c 200 "$dest.part" | grep -qi "<html"; then
    rm -f "$dest.part"; echo "  ✗ $url ne renvoie pas un fichier de modèle"; exit 1
  fi
  mv "$dest.part" "$dest"
}

etape "Vérification de Python"
PY="${PYTHON:-python3}"
if ! command -v "$PY" >/dev/null; then echo "Python 3.10 à 3.13 est requis."; exit 1; fi
"$PY" - <<'EOF'
import sys
v = sys.version_info
if v < (3, 10):
    sys.exit(f"Python {v.major}.{v.minor} trop ancien : il faut 3.10 ou plus.")
if v >= (3, 14):
    print(f"  attention : Python {v.major}.{v.minor}, Kokoro n'est pas encore compatible (Piper oui).")
print(f"  Python {v.major}.{v.minor} ✓")
EOF
command -v ffmpeg >/dev/null && echo "  ffmpeg ✓ (vidéo de contrôle disponible)" || echo "  ffmpeg absent : facultatif, seulement pour « voixoff video »"

etape "Environnement Python (.venv)"
[ -d .venv ] || "$PY" -m venv .venv
.venv/bin/python -m pip install --upgrade pip -q
.venv/bin/pip install -q -r requirements.txt
echo "  piper-tts, faster-whisper, num2words ✓"

etape "Voix Piper : $VOIX"
mkdir -p models/piper
telecharger "$VOIX_URL/$VOIX.onnx" "models/piper/$VOIX.onnx"
telecharger "$VOIX_URL/$VOIX.onnx.json" "models/piper/$VOIX.onnx.json"
telecharger "$VOIX_URL/MODEL_CARD" "models/piper/$VOIX.MODEL_CARD.txt"
grep -i "license" "models/piper/$VOIX.MODEL_CARD.txt" | sed 's/^/  licence du jeu de données :/'

etape "Modèle Whisper : $WHISPER_MODELE"
mkdir -p models/whisper
.venv/bin/python - "$WHISPER_MODELE" <<'EOF'
import sys
from faster_whisper import download_model
nom = sys.argv[1]
chemin = download_model(nom, output_dir=f"models/whisper/{nom}")
print(f"  {chemin} ✓")
EOF

if [ "$AVEC_KOKORO" = 1 ]; then
  etape "Kokoro (alternative)"
  .venv/bin/pip install -q kokoro-onnx
  mkdir -p models/kokoro
  telecharger "$KOKORO_URL/kokoro-v1.0.onnx" "models/kokoro/kokoro-v1.0.onnx"
  telecharger "$KOKORO_URL/voices-v1.0.bin" "models/kokoro/voices-v1.0.bin"
fi

etape "Test rapide"
.venv/bin/python -m voixoff dire "Bonjour, la voix off est prête." -o models/test.wav
echo
echo "✓ Installation terminée."
echo "  Essai : ./voixoff.sh construire exemple/script.json -o build --video"
