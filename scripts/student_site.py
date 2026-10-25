"""Tidy the student site (the default build, `_quarto-student.yml`) after each render.

Runs after each render (`post-render` in _quarto.yml) and does nothing in the teacher build.
Quarto leaves the pages the student site skips (the teachers-only "drafts" listed at the end of
_quarto-student.yml) as empty stub pages, and still writes their PDFs. This deletes them,
so the student site only holds what's meant for students. It also removes the vocab
app's teacher page (vocab by STEM Lab lesson).
"""

import os
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
TEACHER_ONLY = ["vocab/app/lessons.html"]


def is_student_build():
    return ("teacher" not in os.environ.get("QUARTO_PROFILE", "").split(",")
            and "teacher" not in os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", ""))


def main():
    if not is_student_build():
        return
    out_dir = ROOT / os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site")
    profile = yaml.safe_load((ROOT / "_quarto-student.yml").read_text(encoding="utf-8"))
    removed = 0
    for draft in profile["website"].get("drafts") or []:
        for suffix in (".html", ".pdf", ".docx"):
            out = out_dir / Path(draft).with_suffix(suffix)
            if out.exists():
                out.unlink()
                removed += 1
    for rel in TEACHER_ONLY:
        if (out_dir / rel).exists():
            (out_dir / rel).unlink()
            removed += 1
    if removed:
        print(f"student_site: removed {removed} teachers-only files")


if __name__ == "__main__":
    main()
