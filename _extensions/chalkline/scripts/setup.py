"""Fill in a new course: a starter unit (one slide deck, one handout, four vocab words) and the
course files a build needs, from Chalkline's starter/ folder.

    python chalkline.py setup

`python chalkline.py build` (the launchers and VS Code) runs this first, so a new course made with
`quarto use template` has a working unit the first time it starts. It never replaces a file that's
already there, and it adds the starter unit only to a course with no units yet. When it does, it also
swaps the sample course's title in the settings for "My Course", to change. (GENERIC_BRAND below
does the same for the school's name and logo.)
"""

import shutil
import sys

from extension import EXT, ROOT  # noqa: E402

STARTER = EXT / "starter"
UNIT_ONLY = ("course/units/", "course/vocab/")   # only for a course with no units yet
# A new course is a copy of the Chalkline sample's settings: the course's names become placeholders.
# It keeps the school's (Mingwan's) name, logo and colors: every Chalkline course is at Mingwan for now.
NEW_NAMES = {
    "_quarto.yml": [('title: "Chalkline Sample"', 'title: "My Course"'),
                    ('vocab-title: "History Vocab"', 'vocab-title: "Course Vocab"'), ('"History vocab 词汇"', '"Vocab 词汇"')],
    "_quarto-teacher.yml": [('"Chalkline Sample (TEACHER)"', '"My Course (TEACHER)"')],
    "families.qmd": [("[History vocab 词汇:", "[Vocab 词汇:")],
}
# For courses at other schools: set GENERIC_BRAND = True to start them as "Your School", with the
# sailboat icon as the logo (and add brand/logos/logo-emblem.png to .quartoignore). The colors stay
# Mingwan's until the school changes them in brand/_brand.yml.
GENERIC_BRAND = False
GENERIC_NAMES = {
    "_quarto.yml": [('"Mingwan School"', '"Your School"'), ('"Mingwan School sailboat icon"', '"Sailboat icon"')],
    "brand/_brand.yml": [("name: Mingwan School", "name: Your School"),
                         ("path: logos/logo-emblem.png\n      alt: Mingwan School emblem",
                          "path: logos/icon-sailboat.svg\n      alt: Sailboat icon (put your school's logo in brand/logos/)"),
                         ("alt: Mingwan School sailboat icon", "alt: Sailboat icon")],
}


def has_units():
    units = ROOT / "course" / "units"
    return units.is_dir() and any(d.is_dir() and (d / "index.qmd").exists() for d in units.iterdir())


def ensure(quiet=False):
    """Copy every starter file that's missing. Returns the files added."""
    add_unit = not has_units()
    added = []
    for src in sorted(STARTER.rglob("*")):
        rel = src.relative_to(STARTER).as_posix()
        dest = ROOT / rel
        if src.is_dir() or dest.exists() or (rel.startswith(UNIT_ONLY) and not add_unit):
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        added.append(rel)
    if add_unit:
        for rel, swaps in list(NEW_NAMES.items()) + (list(GENERIC_NAMES.items()) if GENERIC_BRAND else []):
            path = ROOT / rel
            if path.exists():
                text = original = path.read_text(encoding="utf-8")
                for old, new in swaps:
                    text = text.replace(old, new)
                if text != original:
                    path.write_text(text, encoding="utf-8")
                    added.append(rel + " (names)")
    if added and not quiet:
        print("Chalkline setup: added " + ", ".join(added))
        if add_unit:
            print("Your first unit is in course/units/01-first-unit/. Copy it to make more units.")
    return added


def main():
    if not ensure():
        print("Chalkline setup: nothing to add; this course has everything it needs.")


if __name__ == "__main__":
    sys.exit(main())
