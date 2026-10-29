"""Turn draw.io diagrams into SVG pictures for slides and pages.

    python chalkline.py drawio course/units/02-ancient-rome/drawio/republic.drawio
    python chalkline.py drawio            every .drawio file in course/

Edit the .drawio file in draw.io (the desktop app or app.diagrams.net), save it, then run this:
it writes republic.svg next to it. Needs the draw.io desktop app (https://www.drawio.com).

draw.io stores each text label twice in an SVG: as live text, and as a picture of the text for old
viewers. Browsers use the live text, so this removes the pictures (a 550 KB file becomes about 20 KB).
Each shape keeps its draw.io id (data-cell-id), which pages can use for hover effects.

No draw.io app? In draw.io use File > Export as > SVG and save over the .svg file. It works the same,
just bigger.
"""

import re
import shutil
import subprocess
import sys
from pathlib import Path

from extension import ROOT  # noqa: E402  (the course folder)
APPS = ["/Applications/draw.io.app/Contents/MacOS/draw.io",
        r"C:\Program Files\draw.io\draw.io.exe",
        "drawio", "draw.io"]


def drawio_app():
    for a in APPS:
        if Path(a).exists() or shutil.which(a):
            return a
    sys.exit("drawio.py: the draw.io desktop app wasn't found. Get it from https://www.drawio.com, "
             "or export from draw.io by hand (File > Export as > SVG).")


def export(app, src):
    out = src.with_suffix(".svg")
    subprocess.run([app, "--export", "--format", "svg", "--theme", "light", "--border", "10",
                    "--output", str(out), str(src)], check=True, capture_output=True)
    svg = out.read_text(encoding="utf-8")
    slim = re.sub(r"<image\b[^>]*/>", "", svg)   # the picture-of-text fallbacks (and nothing else uses <image>)
    out.write_text(slim, encoding="utf-8")
    print(f"drawio.py: {out.relative_to(ROOT)} ({len(slim) // 1024} KB)")


def main():
    files = [Path(a).resolve() for a in sys.argv[1:]] or sorted((ROOT / "course").rglob("*.drawio"))
    if not files:
        print("drawio.py: no .drawio files found")
        return
    app = drawio_app()
    for f in files:
        export(app, f)


if __name__ == "__main__":
    main()
