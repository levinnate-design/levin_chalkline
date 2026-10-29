"""Run a Chalkline command. From the course folder:

    python chalkline.py setup                a new course: add a starter unit and the course files it needs
    python chalkline.py new slides 2 "Roman Roads"   start a deck (or worksheet) in unit 2 from a template
    python chalkline.py validate             check vocab/data/vocab.csv (after editing it)
    python chalkline.py packets --unit 3     rebuild unit 3's packet (after finishing a worksheet)
    python chalkline.py slides-pdf           print every slide deck to PDF
    python chalkline.py slide-pictures       a picture of every slide, for the All slides page
    python chalkline.py open student         the student site, at http://localhost:4101
    python chalkline.py export-vocab         Quizlet, Kahoot and Anki files of the vocab
    python chalkline.py import-vocab ...     copy words from vocab/data/vocab.csv into a unit
    python chalkline.py drawio               update draw.io diagrams' pictures
    python chalkline.py build                full build, if anything changed (the launchers run this)

Add --help after a command for its options. The commands are Chalkline's scripts
(_extensions/chalkline/scripts/, or _extensions/<owner>/chalkline/scripts/ once installed with
`quarto add`), so they update with Chalkline. This file only finds them.
"""

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAMES = {"build": "build_if_needed", "open": "open_site", "validate": "validate_vocab"}   # short names; others: packets, slides-pdf, ...


def scripts_folder():
    for pattern in ("_extensions/chalkline/_extension.yml", "_extensions/*/chalkline/_extension.yml"):
        found = sorted(HERE.glob(pattern))
        if found:
            return found[0].parent / "scripts"
    sys.exit("Chalkline isn't in this course: no _extensions/chalkline/ folder. Install it with `quarto add`.")


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help", "help"):
        print(__doc__)
        return
    name = NAMES.get(sys.argv[1], sys.argv[1].replace("-", "_"))
    script = scripts_folder() / f"{name}.py"
    if not script.exists():
        sys.exit(f"No Chalkline command called {sys.argv[1]!r}. Run `python chalkline.py` for the list.")
    sys.exit(subprocess.run([sys.executable, str(script), *sys.argv[2:]], cwd=HERE).returncode)


if __name__ == "__main__":
    main()
