"""Student-edition PDFs for the teacher site.

The teacher build (`quarto render --profile teacher`) prints every PDF with a TEACHER EDITION
tab in the corner and keeps everything wrapped in `::: {.content-visible when-profile="teacher"}`
(answer keys, teacher notes). That is the copy the teacher wants — but it is not the copy to
hand to a class.

This script renders those same printables *again, without the teacher profile*, and writes the
result next to the teacher copy under a name that says so:

    course/units/<unit>/<name>.pdf                      Teacher Edition (answer keys, tab)
    course/units/<unit>/<name>-student-edition.pdf      Student Edition (clean, no tab)

Only printables that actually hold teacher-only content get a second copy; everything else
already looks the same in both builds.

Runs automatically after a full teacher render (`post-render` in _quarto.yml). Like packets.py
it sits out the quick renders `quarto preview` does when you save a file, so editing stays fast.

    python scripts/student_copies.py                every printable with teacher-only content
    python scripts/student_copies.py --teacher      (same; the teacher site is the default target)
    python scripts/student_copies.py --file course/units/02-.../sheet.qmd     just that file

Which files count as printables comes from scripts/catalog.py: worksheets, checklists, handouts
and references with a PDF (typst) format.
"""

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from catalog import PACKET_TYPES  # noqa: E402

TEACHER_ONLY = 'when-profile="teacher"'      # a printable with this has content students don't see
SUFFIX = "-student-edition"


def front_matter(path):
    """The YAML block between the first two --- lines of a .qmd file."""
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    return (yaml.safe_load(m.group(1)) or {}) if m else {}


def is_printable(path):
    """True for a worksheet/checklist/handout/reference with a PDF format and teacher-only content."""
    meta = front_matter(path)
    fmt = meta.get("format", "html")
    names = [fmt] if isinstance(fmt, str) else list(fmt or {})
    if "typst" not in [str(n).split("+")[0] for n in names]:
        return False
    if str(meta.get("type", "")).lower() not in PACKET_TYPES:
        return False
    return TEACHER_ONLY in path.read_text(encoding="utf-8")


def render_student_copy(qmd):
    """Render `qmd` without the teacher profile. Returns the PDF it made, or None if it failed."""
    # A clean environment: no profile, so teacher-only blocks stay out and no edition tab is printed.
    env = {k: v for k, v in os.environ.items() if not k.startswith("QUARTO_") or k == "QUARTO_PYTHON"}
    if not env.get("QUARTO_PYTHON") and (ROOT / ".venv").exists():
        py = ROOT / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        env["QUARTO_PYTHON"] = str(py)
    result = subprocess.run(["quarto", "render", qmd.as_posix(), "--to", "typst"],
                            cwd=ROOT, env=env, capture_output=True, text=True)
    pdf = ROOT / "_site" / qmd.with_suffix(".pdf").relative_to(ROOT)
    if result.returncode != 0 or not pdf.exists():
        print(f"student copies: Quarto failed for {qmd}:\n" + (result.stderr or result.stdout)[-1500:])
        return None
    return pdf


def main():
    # A save while `quarto preview` runs: wait for the next full render (see the notes at the top).
    in_quarto = "QUARTO_PROJECT_OUTPUT_DIR" in os.environ
    if in_quarto and not os.environ.get("QUARTO_PROJECT_RENDER_ALL"):
        return
    teacher = ("--teacher" in sys.argv or "teacher" in os.environ.get("QUARTO_PROFILE", "").split(",")
               or "teacher" in os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", ""))
    out_dir = ROOT / os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site-teacher" if teacher else "_site")
    if not teacher and in_quarto:
        return   # the student site's PDFs are already student editions

    wanted = [a for a in sys.argv[1:] if not a.startswith("--")]
    files = [p for p in sorted((ROOT / "course").rglob("*.qmd")) if is_printable(p)]
    if wanted:
        files = [p for p in files if any(w in p.as_posix() for w in wanted)]

    for qmd in files:
        pdf = render_student_copy(qmd)
        if not pdf:
            continue
        dest = out_dir / qmd.relative_to(ROOT).parent / (qmd.stem + SUFFIX + ".pdf")
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(pdf, dest)
        print(f"student copies: {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
