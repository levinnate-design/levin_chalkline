"""Markdown for the shortcodes that build a block from the course's data (blocks.lua runs this).

    python blocks.py vocab-cards '{"unit": "1", "words": "peninsula, colony", "zh": "true"}'

Prints the Markdown; the shortcode puts it into the page. The same builders that pages used to
call from Python cells (vocab.py, catalog.py, season.py), so the output is the same.
"""

import json
import sys

import vocab
from vocab import load_unit, pick


def _true(x):
    return str(x).lower() in ("true", "yes", "1")


def _terms(a):
    """The unit's words, or only the ones named in words="a, b, c" (in that order)."""
    terms = load_unit(int(a["unit"]))
    names = [w.strip() for w in a.get("words", "").split(",") if w.strip()]
    return pick(terms, *names) if names else terms


def vocab_cards(a):
    return vocab.card_grid(_terms(a), image_dir=a.get("images", "images"), notes=_true(a.get("notes")), zh=_true(a.get("zh")))


def vocab_table(a):
    return vocab.vocab_table(_terms(a), examples=a.get("examples", "true") != "false")


def vocab_list(a):
    return vocab.vocab_list(_terms(a))


def fill_in_the_blank(a):
    return vocab.fill_in_the_blank(_terms(a), seed=int(a["seed"]) if a.get("seed") else None)


def word_bank(a):
    """Groups as "Label: word, word" (one per argument); no label: one group of the unit's words."""
    terms = load_unit(int(a["unit"]))
    groups = {}
    for g in a.get("groups", []):
        label, _, words = g.partition(":")
        groups[label.strip()] = pick(terms, *[w.strip() for w in words.split(",") if w.strip()])
    if not groups:
        groups = {"Words": _terms(a)}
    return vocab.word_bank(groups, title=a.get("title") or "Word bank")


def catalog_part(a):
    import catalog
    parts = {"season": catalog.markdown_season, "by-unit": catalog.markdown_by_unit, "by-type": catalog.markdown_by_type,
             "learning": catalog.markdown_learning, "family-picks": catalog.markdown_family_picks}
    return parts[a["groups"][0]]()


def season_events(a):
    import season
    return season.events_list(upcoming_only=_true(a.get("upcoming")))


BUILDERS = {"vocab-cards": vocab_cards, "vocab-table": vocab_table, "vocab-list": vocab_list,
            "fill-in-the-blank": fill_in_the_blank, "word-bank": word_bank, "overview": catalog_part,
            "season-events": season_events}

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    try:
        print(BUILDERS[sys.argv[1]](json.loads(sys.argv[2])))
    except Exception as e:   # blocks.lua shows it in the render log, and on the page as a warning
        print(f"CHALKLINE-ERROR {e}")
