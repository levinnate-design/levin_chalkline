"""Shared helpers for reading vocab files.

Used in two places:
  - by blocks.py, for the shortcodes that show vocab on a page ({{< vocab-cards >}}, {{< word-bank >}},
    {{< vocab-table >}}, {{< vocab-list >}}, {{< fill-in-the-blank >}}; see blocks.lua)
  - by export_vocab.py, to build Quizlet / Kahoot / Anki files
"""

import random
from pathlib import Path

import yaml

from extension import ROOT  # noqa: E402

VOCAB_DIR = ROOT / "course" / "vocab"


def load_file(path):
    """Read one unit's .yml file and return its terms as a list of dicts.

    Every term gets "unit" and "unit_title" copied onto it from the top of the file.
    """
    path = Path(path)
    data = yaml.safe_load(path.read_text(encoding="utf-8"))

    for key in ("unit", "unit_title", "terms"):
        if key not in data:
            raise ValueError(f"{path.name}: missing '{key}' at the top of the file")

    terms = []
    for i, entry in enumerate(data["terms"], start=1):
        for key in ("term", "definition"):
            if not entry.get(key):
                raise ValueError(f"{path.name}: term #{i} is missing '{key}'")
        terms.append({
            "term": str(entry["term"]).strip(),
            "definition": str(entry["definition"]).strip(),
            "example": str(entry.get("example", "")).strip(),
            "kahoot_question": str(entry.get("kahoot_question", "")).strip(),
            # Optional extras (filled in by `python chalkline.py import-vocab`):
            "notes": str(entry.get("notes", "")).strip(),     # longer explanation
            "zh": str(entry.get("zh", "")).strip(),           # Chinese: reference materials only
            "image": str(entry.get("image", "")).strip(),     # file name in the unit's images/ folder
            "unit": data["unit"],
            "unit_title": data["unit_title"],
        })
    return terms


def load_all(vocab_dir=VOCAB_DIR):
    """Read every .yml file in the vocab folder. Returns one list of terms, in unit order."""
    terms = []
    for path in sorted(Path(vocab_dir).glob("*.yml")):
        terms.extend(load_file(path))
    return sorted(terms, key=lambda t: t["unit"])


def load_unit(unit, vocab_dir=VOCAB_DIR):
    """Return only the terms for one unit number."""
    terms = [t for t in load_all(vocab_dir) if t["unit"] == unit]
    if not terms:
        raise ValueError(f"No vocab found for unit {unit} in {vocab_dir}")
    return terms


def pick(terms, *names):
    """Return the terms with these names, in the order given. Example: pick(terms, "4-bar", "6-bar")"""
    by_name = {t["term"].lower(): t for t in terms}
    missing = [n for n in names if n.lower() not in by_name]
    if missing:
        raise ValueError(f"Not in this unit's vocab: {', '.join(missing)}")
    return [by_name[n.lower()] for n in names]


# ---------------------------------------------------------------------------
# Markdown builders. Print these from a code cell marked  #| output: asis
# ---------------------------------------------------------------------------

def vocab_table(terms, examples=True):
    """A table of terms and definitions (and example sentences, if any)."""
    if examples and any(t["example"] for t in terms):
        lines = ["| Term | Definition | Example |", "|---|---|---|"]
        for t in terms:
            lines.append(f"| **{t['term']}** | {t['definition']} | {t['example']} |")
    else:
        lines = ["| Term | Definition |", "|---|---|"]
        for t in terms:
            lines.append(f"| **{t['term']}** | {t['definition']} |")
    return "\n".join(lines) + "\n"


def vocab_list(terms):
    """A bulleted list: **term**: definition. Good for slides."""
    return "\n".join(f"- **{t['term']}**: {t['definition']}" for t in terms) + "\n"


def fill_in_the_blank(terms, seed=None):
    """A word bank plus numbered definitions with blanks.

    The answer key is wrapped so it only appears in the teacher build.
    The word bank order is shuffled the same way every time (so student and
    teacher copies match).
    """
    rng = random.Random(seed if seed is not None else terms[0]["unit"])
    bank = [t["term"] for t in terms]
    rng.shuffle(bank)

    lines = ['::: {.callout-tip title="Word bank" icon=false}', " · ".join(f"**{b}**" for b in bank), ":::", ""]
    for i, t in enumerate(terms, start=1):
        lines.append(f"{i}. ____________________ : {t['definition']}")
        lines.append("")

    lines.append('::: {.content-visible when-profile="teacher"}')
    lines.append("::: {.callout-note title=\"Answer key\"}")
    # "\\." stops the line from turning into a numbered list
    lines.append(" · ".join(f"{i}\\. {t['term']}" for i, t in enumerate(terms, start=1)))
    lines.append(":::")
    lines.append(":::")
    return "\n".join(lines) + "\n"


def card_grid(terms, image_dir="images", notes=False, zh=False):
    """Side-by-side cards: picture, term, definition. Made for slides.

    notes=True adds the longer explanation; zh=True adds the Chinese term in small type.
    image_dir is relative to the .qmd file.
    """
    width = f"{100 // len(terms)}%"
    lines = [":::: {.columns .card-grid}"]
    for t in terms:
        lines.append(f'::: {{.column .card width="{width}"}}')
        if t["image"]:
            lines.append(f"![]({image_dir}/{t['image']}){{fig-alt=\"{t['term']}\"}}")
            lines.append("")
        name = f"**{t['term']}**"
        if zh and t["zh"]:
            name += f" [{t['zh']}]{{.zh}}"
        lines.append(name)
        lines.append("")
        lines.append(f"[{t['definition']}]{{.card-def}}")
        if notes and t["notes"]:
            lines.append("")
            lines.append(f"[{t['notes']}]{{.card-notes}}")
        lines.append(":::")
    lines.append("::::")
    return "\n".join(lines) + "\n"


def word_bank(groups, title="Word bank"):
    """A word-bank box with terms in labeled groups.

    groups is a dict like {"Arms": pick(terms, "4-bar", "6-bar"), "Claws": [...]}
    """
    lines = [f'::: {{.callout-tip title="{title}" icon=false}}']
    for label, group in groups.items():
        lines.append(f"**{label}:** " + " · ".join(t["term"] for t in group) + "\\")
    lines[-1] = lines[-1].rstrip("\\")
    lines.append(":::")
    return "\n".join(lines) + "\n"
