"""Throw away Quarto's saved Python results (_freeze/) when the data they used has changed.

Runs automatically before each render (`pre-render` in the Chalkline project type), first in the list.

`freeze: auto` in _quarto.yml makes full renders reuse each page's saved Python results
unless that page's own file changed. But pages also read other files (season dates, unit
vocab, the scripts) and today's date (event countdowns), and Quarto doesn't know that.
So this script fingerprints those inputs and empties _freeze/ when the fingerprint changes:
the first full render of a day, or after editing season.yml or a vocab file, reruns
everything; later renders are fast.

(Rendering a single file, which is what the preview does when you save, always reruns
that file's code, frozen or not.)
"""

import datetime
import hashlib
import shutil
from pathlib import Path

from extension import EXT, ROOT  # noqa: E402  (the course folder, Chalkline)

FREEZE = ROOT / "_freeze"
STAMP = FREEZE / ".inputs"
INPUTS = ["course/season.yml", "course/links.yml", "course/vocab/*.yml", "scripts/*.py", "vocab/data/*.csv",
          f"{EXT.relative_to(ROOT).as_posix()}/scripts/*.py"]   # the course's own scripts, and Chalkline's


def fingerprint():
    h = hashlib.sha256(datetime.date.today().isoformat().encode())
    for pattern in INPUTS:
        for path in sorted(ROOT.glob(pattern)):
            h.update(path.relative_to(ROOT).as_posix().encode())
            h.update(path.read_bytes())
    return h.hexdigest()


def main():
    fp = fingerprint()
    if STAMP.exists() and STAMP.read_text() == fp:
        return
    if FREEZE.exists():
        shutil.rmtree(FREEZE)
        print("freeze_check: data or date changed, so Python code reruns this time")
    FREEZE.mkdir()
    STAMP.write_text(fp)


if __name__ == "__main__":
    main()
