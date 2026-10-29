#!/bin/bash
# Mac: double-click this file to open the site at http://localhost:4100
# The first time, it sets up Python packages (a few minutes). Close this window to stop the site.

cd "$(dirname "$0")" || exit 1

if ! command -v quarto >/dev/null 2>&1; then
  echo "Quarto isn't installed. Get it from https://quarto.org/docs/get-started/ and try again."
  read -r -p "Press Return to close."; exit 1
fi

if [ ! -x .venv/bin/python ]; then
  echo "First run: setting up Python packages. This takes a few minutes..."
  python3 -m venv .venv && .venv/bin/python -m pip install -q -r requirements.txt || {
    echo "Setup failed. Is Python 3 installed? Get it from https://www.python.org/downloads/"
    rm -rf .venv; read -r -p "Press Return to close."; exit 1
  }
fi

export QUARTO_PYTHON="$PWD/.venv/bin/python"
"$QUARTO_PYTHON" chalkline.py build --profile teacher   # full build first if anything changed, so pages open fast
echo "Starting Chalkline (teacher version) at http://localhost:4100"
echo "Leave this window open while you work. Close it to stop the site."
quarto preview --profile teacher   # the teacher version: answer keys and notes included
