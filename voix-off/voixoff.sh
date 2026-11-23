#!/usr/bin/env bash
# Raccourci : ./voixoff.sh construire exemple/script.json -o build
cd "$(dirname "$0")" && exec .venv/bin/python -m voixoff "$@"
