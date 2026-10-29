"""Start a new slide deck or printable from a template.

    python chalkline.py new                                  the templates you can use
    python chalkline.py new slides 02-ancient-rome "Roman Roads"
    python chalkline.py new worksheet 2 "Roads Map Work"     (a unit's number works too)

Makes course/units/<unit>/roman-roads-slides.qmd (the file name comes from the title), with
the title filled in and the next free `order:` in that unit. Templates come from the course's
own templates/ folder first, then Chalkline's. The new file is the course's: a newer template
never changes it.
"""

import re
import sys
from pathlib import Path

from extension import EXT, ROOT  # noqa: E402

FOLDERS = [ROOT / "templates", EXT / "templates"]   # the course's own first


def templates():
    found = {}
    for folder in reversed(FOLDERS):
        for f in sorted(folder.glob("*.qmd")):
            found[f.stem] = f
    return found


def unit_folder(name):
    units = ROOT / "course" / "units"
    if (units / name).is_dir():
        return units / name
    for d in sorted(units.iterdir()):
        if d.is_dir() and name.isdigit() and re.match(rf"0*{int(name)}-", d.name):
            return d
    sys.exit(f"No unit folder {name!r} in course/units/.")


def main():
    found = templates()
    if len(sys.argv) < 4:
        print(__doc__)
        print("Templates: " + ", ".join(found))
        return
    kind, unit, title = sys.argv[1], sys.argv[2], " ".join(sys.argv[3:])
    if kind not in found:
        sys.exit(f"No template called {kind!r}. Templates: {', '.join(found)}")
    folder = unit_folder(unit)
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "new"
    if kind == "slides" and not slug.endswith("slides"):
        slug += "-slides"
    dest = folder / f"{slug}.qmd"
    if dest.exists():
        sys.exit(f"{dest.relative_to(ROOT)} already exists.")
    orders = [int(m) for f in folder.glob("*.qmd") for m in re.findall(r"(?m)^order:\s*(\d+)", f.read_text(encoding="utf-8")[:2000])]
    text = found[kind].read_text(encoding="utf-8")
    text = re.sub(r'(?m)^title: .*$', lambda _: f'title: "{title}"', text, count=1)
    text = re.sub(r'(?m)^order: .*$', f"order: {max(orders, default=0) + 1}", text, count=1)
    m = re.match(r"0*(\d+)-", folder.name)
    if m:
        text = text.replace("unit=1", f"unit={m.group(1)}")
    dest.write_text(text, encoding="utf-8")
    print(f"Made {dest.relative_to(ROOT).as_posix()}. Fill in its labels (subtitle, description, audience) and content.")


if __name__ == "__main__":
    main()
