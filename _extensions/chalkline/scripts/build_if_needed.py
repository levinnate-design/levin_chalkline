"""Before the preview starts: do a full build if anything changed since the last one.

Run by the "Start Chalkline" launchers and VS Code's preview task, just before
`quarto preview`. The preview builds an out-of-date page when you open it, which can
take 10-20 seconds a page. After pulling a batch of updates many pages are out of
date at once, so this builds everything first (about a minute) and every click after
that is fast. If nothing changed, it only rebuilds PDF bundles (unit packets, slide PDFs)
that are older than their sources: the preview doesn't rebuild those on every save, so
editing stays quick. Pages you edited with the preview running were already rebuilt by
it, so they don't count as changed.

    python chalkline.py build                    build only if something changed
    python chalkline.py build --force            build anyway
    python chalkline.py build --profile teacher  the teacher site (_site-teacher/); none: the student site
"""

import os
import subprocess
import sys
import time
from pathlib import Path

from extension import ROOT  # noqa: E402  (the course folder)
import setup  # noqa: E402
HERE = Path(__file__).resolve().parent   # Chalkline's scripts
PROFILE = sys.argv[sys.argv.index("--profile") + 1] if "--profile" in sys.argv[:-1] else ""
SITE = ROOT / (f"_site-{PROFILE}" if PROFILE else "_site")
STAMP = SITE / ".last-full-build"
BUNDLES = ["packets.py", "slides_pdf.py", "slide_pictures.py"]   # PDFs and slide pictures: skip preview saves; run with --stale at startup
WATCH = ["index.qmd", "_quarto.yml", "course", "brand", "_extensions", "scripts", "vocab/data", "vocab/config.js"]


def source_files():
    """Every file a build reads."""
    for name in WATCH:
        path = ROOT / name
        files = [path] if path.is_file() else path.rglob("*") if path.is_dir() else []
        for f in files:
            parts = f.relative_to(ROOT).parts
            if any(p.startswith(".") or p.endswith("_files") or p == "__pycache__" for p in parts):
                continue
            if f.is_file() and f.name != "brand.css":   # brand.css is made by the build itself
                yield f


def out_of_date(since):
    """Files changed after `since`, leaving out pages the preview has already rebuilt."""
    stale = []
    for f in source_files():
        if f.stat().st_mtime <= since:
            continue
        built = SITE / f.relative_to(ROOT).with_suffix(".html")
        if f.suffix == ".qmd" and built.exists() and built.stat().st_mtime >= f.stat().st_mtime:
            continue
        stale.append(f)
    return stale


def main():
    setup.ensure()   # a new course: its starter unit and course files, before anything reads them
    if PROFILE != "teacher":
        # Refresh the list of pages the student site leaves out before Quarto reads _quarto-student.yml.
        subprocess.run([sys.executable, str(HERE / "catalog.py")], cwd=ROOT, env=os.environ, capture_output=True)
    stale = out_of_date(STAMP.stat().st_mtime) if STAMP.exists() else None
    if "--force" not in sys.argv and stale == []:
        STAMP.touch()
        print("Chalkline: pages are up to date; checking PDFs.")
        for script in BUNDLES:
            subprocess.run([sys.executable, str(HERE / script), "--stale"] + (["--teacher"] if PROFILE == "teacher" else []),
                           cwd=ROOT, env=os.environ)
        return
    if stale is None:
        reason = "first build"
    elif not stale:
        reason = "--force"
    else:
        names = ", ".join(f.relative_to(ROOT).as_posix() for f in stale[:3]) + (" ..." if len(stale) > 3 else "")
        reason = f"{len(stale)} changed: {names}"
    site = f"{PROFILE} site" if PROFILE else "site"
    print(f"Chalkline: building the whole {site} first ({reason}). This takes a minute or two...")
    start = time.time()
    result = subprocess.run(["quarto", "render"] + (["--profile", PROFILE] if PROFILE else []), cwd=ROOT, env=os.environ)
    if result.returncode != 0:
        print("Chalkline: the build had errors (see above). Starting the preview anyway.")
        return
    STAMP.touch()
    print(f"Chalkline: built in {time.time() - start:.0f} seconds.")


if __name__ == "__main__":
    main()
