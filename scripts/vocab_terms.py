"""Read every term in vocab/data/vocab.csv for the {{< vocab "chain wrap" >}} pop-ups.

Runs automatically before each render (`pre-render` in _quarto.yml), so pop-ups always
match the vocab list. Picture and link paths are relative to the site root; the shortcode
adds the "../" a page needs.

Each term also gets the units whose word list (course/vocab/*.yml) has it, and its example
sentence and topic, for the slide games ({{< snowman unit=1 >}} and the others). "units" lists each
unit's number and title, for the Review games page.

Writes:
    generated/vocab-terms.json
"""

import csv
import json
from pathlib import Path

import yaml

from genfile import write_if_changed

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "vocab" / "data" / "vocab.csv"
OUT = ROOT / "generated" / "vocab-terms.json"
UNITS = ROOT / "course" / "vocab"


def unit_lists():
    """({"democracy": [1], ...}, [{"unit": 1, "title": "Ancient Greece"}, ...]) from each unit's word list."""
    found, units = {}, []
    for path in sorted(UNITS.glob("*.yml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        u_num = data.get("unit")
        if isinstance(u_num, int) and u_num < 90:
            units.append({"unit": u_num, "title": data.get("unit_title", "")})
        for t in data.get("terms") or []:
            found.setdefault(str(t.get("term", "")).strip().lower(), []).append(u_num)
    return found, units


def main():
    units, unit_titles = unit_lists()
    terms = []
    with open(SRC, encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            terms.append({
                "id": r["id"],
                "term": r["term_en"],
                "aka": [a.strip() for a in r["aka"].split(";") if a.strip()],
                "zh": r["zh"],                    # shown in pop-ups (reference), never in flashcards or quizzes
                "definition": r["short_def"],
                "image": "vocab/images/" + r["image"] if r["image"] else "",
                "url": "vocab/app/#id=" + r["id"],
                "example": r["example"],
                "topic": r["subdomain"].replace("-", " ").capitalize(),   # "daily-life" -> "Daily life" (Sort it groups)
                "units": units.get(r["term_en"].strip().lower(), []),
            })
    OUT.parent.mkdir(exist_ok=True)
    write_if_changed(OUT, json.dumps({"terms": terms, "units": unit_titles}, ensure_ascii=False, indent=0))
    print(f"vocab_terms.py: {len(terms)} terms")


if __name__ == "__main__":
    main()
