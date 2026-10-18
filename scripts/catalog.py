"""Build the course catalog from every document's labels (its front matter).

Runs automatically before each full render (`pre-render` in _quarto.yml) and
writes generated/catalog.yml, which the overview page lists, searches and filters.
Nothing is listed by hand: add a document to a unit folder, give it a `type`,
and it appears in the overview, grouped under its unit.

Labels read from each document's front matter:
    title         required
    type          slides, worksheet, checklist, poster, handout, reference, vocab
    description   one line, shown in the overview
    order         optional number, to sort documents within a unit
    packet        optional: false leaves a printable out of its unit packet
    audience      optional list: teacher, student, parent (for future student/parent sites)

Each unit folder's index.qmd describes the unit (title, unit number, objectives).
External resources (official VEX posters, manuals, other school sites) are
listed in course/links.yml. Anything not in a unit folder is grouped as
"Whole year" (the posters, for example).

Also writes generated/packets.json: which printables go in each unit packet
(read by scripts/packets.py and the {{< packet >}} shortcode), and
generated/pdf-pages.json: the page count of every outside PDF in course/ (read by
the {{< pdf "file.pdf" >}} shortcode, since Typst can't count a PDF's pages).

A unit's index.qmd can add outside PDFs to its packet:
    packet-extras:
      - file: scoring-sheet.pdf          # in the unit folder
        title: Official scoring sheet    # shown in the packet's contents
        after: match-checklist.qmd       # optional; without it, the PDF goes at the end

For the family site (`--profile parent`) the catalog holds only items marked
`audience: [..., parent]` (and no packets). Every build also writes the list of pages the
family site leaves out, at the end of _quarto-parent.yml.

Also importable from .qmd files:
    from catalog import load_catalog, load_units, load_packets
"""

import json
import os
import re
from pathlib import Path

import yaml

from genfile import write_if_changed

ROOT = Path(__file__).resolve().parent.parent
COURSE = ROOT / "course"
OUT = ROOT / "generated" / "catalog.yml"
PARENT_PROFILE = ROOT / "_quarto-parent.yml"
PARENT_MARKER = "  # ---- Everything below is written by scripts/catalog.py"

TYPES = {  # type -> (label, sort order)
    "packet": ("Packet", 0),
    "slides": ("Slides", 1),
    "worksheet": ("Worksheet", 2),
    "checklist": ("Checklist", 3),
    "handout": ("Handout", 4),
    "poster": ("Poster", 5),
    "reference": ("Reference", 6),
    "vocab": ("Vocab", 7),
}
FORMATS = {"revealjs": "Slides", "html": "Web", "typst": "PDF", "docx": "Word", "pptx": "PowerPoint"}
YEAR_GROUP = ("Whole year", 90)   # posters and references that aren't tied to one unit
PACKET_TYPES = {"worksheet", "checklist", "handout", "reference"}   # printables that go in unit packets
YEAR_PACKET = "year-packet.pdf"       # every unit packet in one PDF, at the site root


def teacher_copy(pdf):
    """The teacher edition's file name: unit-packet.pdf -> unit-teacher-packet.pdf. (The student copy
    keeps the plain name, the same as on the student site.)"""
    return pdf[: -len("-packet.pdf")] + "-teacher-packet.pdf" if pdf.endswith("-packet.pdf") else pdf


def front_matter(path):
    """The YAML block between the first two --- lines of a .qmd file."""
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    return (yaml.safe_load(m.group(1)) or {}) if m else {}


def formats_of(meta):
    fmt = meta.get("format", "html")
    names = [fmt] if isinstance(fmt, str) else list(fmt or {})
    return [FORMATS.get(n.split("+")[0], n) for n in names]


SECTION_DIRS = ("units", "summatives")


def load_units():
    """One entry per unit or summative folder, in folder order: id, section, number, title, description, objectives."""
    units = []
    for section in SECTION_DIRS:
        sec_dir = COURSE / section
        if not sec_dir.exists():
            continue
        for folder in sorted(sec_dir.iterdir()):
            index = folder / "index.qmd"
            if not folder.is_dir() or not index.exists():
                continue
            meta = front_matter(index)
            units.append({
                "id": folder.name,
                "section": section,
                "number": meta.get("unit"),
                "title": meta.get("title", folder.name),
                "short": meta.get("short-title", meta.get("title", folder.name)),
                "description": meta.get("description", ""),
                "objectives": meta.get("objectives", []),
                "path": index.relative_to(ROOT).with_suffix(".html").as_posix(),
                "order": len(units) + 1,
            })
    return units


def load_packets():
    """Each unit's packet: its printables (PDF-format worksheets, checklists, handouts, references)
    in `order:`, leaving out any marked `packet: false`, plus any outside PDFs listed under
    `packet-extras:` in the unit's index.qmd. Units with neither have no packet.

    Each packet has "chapters" in order: {"qmd": path, "title": ...} or {"pdf": path, "title": ...},
    plus "files" (the .qmd paths) and "extras" (the PDF paths)."""
    packets = []
    for unit in load_units():
        section = unit.get("section", "units")
        folder = COURSE / section / unit["id"]
        found = []
        for path in folder.glob("*.qmd"):
            if path.name.startswith("_") or path.name == "index.qmd":
                continue
            meta = front_matter(path)
            if meta.get("type") in PACKET_TYPES and meta.get("packet", True) and "PDF" in formats_of(meta):
                found.append((meta.get("order", 50), meta.get("title", path.stem), path.relative_to(ROOT).as_posix()))
        chapters = [{"qmd": f, "title": t} for _, t, f in sorted(found)]
        for extra in front_matter(folder / "index.qmd").get("packet-extras", []) or []:
            pdf = (folder / extra["file"]).relative_to(ROOT).as_posix()
            if not (ROOT / pdf).exists():
                print(f"catalog: packet-extras: {pdf} not found")
                continue
            entry = {"pdf": pdf, "title": extra.get("title", Path(pdf).stem)}
            after = (folder / extra["after"]).relative_to(ROOT).as_posix() if extra.get("after") else None
            spot = next((i + 1 for i, c in enumerate(chapters) if c.get("qmd") == after), len(chapters))
            chapters.insert(spot, entry)
        if chapters:
            packets.append({**unit,
                            "pdf": f"course/{section}/{unit['id']}/{unit['id']}-packet.pdf",
                            "chapters": chapters,
                            "files": [c["qmd"] for c in chapters if "qmd" in c],
                            "extras": [c["pdf"] for c in chapters if "pdf" in c]})
    return packets


def pdf_pages():
    """Page count of every outside PDF in course/ (not the PDFs Quarto makes from .qmd files)."""
    try:
        import fitz   # pymupdf
    except ImportError:
        return {}
    counts = {}
    for pdf in sorted(COURSE.rglob("*.pdf")):
        if pdf.with_suffix(".qmd").exists():
            continue
        try:
            counts[pdf.relative_to(ROOT).as_posix()] = fitz.open(pdf).page_count
        except Exception as e:
            print(f"catalog: can't read {pdf.relative_to(ROOT)}: {e}")
    return counts


def load_catalog():
    """Every document and external link, sorted by unit then type."""
    units = {u["id"]: u for u in load_units()}
    items = []

    for path in sorted(COURSE.rglob("*.qmd")):
        if path.name.startswith("_") or path.name == "index.qmd":
            continue
        meta = front_matter(path)
        kind = meta.get("type")
        if kind not in TYPES:
            print(f"catalog: skipping {path.relative_to(ROOT)} (add `type:` to its front matter)")
            continue
        if kind == "slides" and not path.stem.endswith("slides"):
            print(f"catalog: {path.relative_to(ROOT)} won't open in a new tab; name slideshow files ...slides.qmd")
        rel = path.relative_to(COURSE).parts
        if rel[0] in SECTION_DIRS and len(rel) > 1 and rel[1] in units:
            unit = units[rel[1]]
            group, group_order = unit["short"], unit["order"]
        else:
            group, group_order = YEAR_GROUP
        fmts = formats_of(meta)
        html = path.relative_to(ROOT).with_suffix(".html").as_posix()
        items.append({
            "title": meta.get("title", path.stem),
            "path": html,
            "pdf": html[:-5] + ".pdf" if "PDF" in fmts or kind == "slides" else None,   # decks: scripts/slides_pdf.py
            "description": meta.get("description", ""),
            "type": TYPES[kind][0],
            "unit": group,
            "source": "School",
            "formats": " · ".join(fmts + (["PDF"] if kind == "slides" else [])),
            "audience": meta.get("audience", ["teacher"]),
            "_sort": (group_order, TYPES[kind][1], meta.get("order", 50), meta.get("title", "")),
        })

    links_file = COURSE / "links.yml"
    if links_file.exists():
        for link in yaml.safe_load(links_file.read_text(encoding="utf-8")) or []:
            kind = link.get("type", "reference")
            group = link.get("unit")
            if group in units:
                group, group_order = units[group]["short"], units[group]["order"]
            else:
                group, group_order = YEAR_GROUP
            items.append({
                "title": link["title"],
                "path": link["url"],
                "pdf": None,
                "description": link.get("description", ""),
                "type": TYPES.get(kind, (kind.title(), 9))[0],
                "unit": group,
                "source": link.get("source", "Official VEX"),
                "formats": "Link",
                "audience": link.get("audience", ["teacher", "student"]),
                "_sort": (group_order, TYPES.get(kind, ("", 9))[1], 50, link["title"]),
            })

    packets = load_packets()
    teacher = "teacher" in os.environ.get("QUARTO_PROFILE", "").split(",")

    def packet_row(title, pdf, description, unit, order, audience, rank):
        return {"title": title, "path": pdf, "pdf": pdf, "description": description, "type": "Packet",
                "unit": unit, "source": "School", "formats": "PDF", "audience": audience, "_sort": (order, 0, rank, "")}

    everyone = ["teacher", "student", "parent"]
    for p in packets:
        if teacher:   # the teacher site has both: the teacher edition first, then the student copy
            items.append(packet_row(f"🔑 {p['short']} · Teacher edition", teacher_copy(p["pdf"]),
                                    f"Every printable for {p['title']}, WITH answer keys and teacher notes. For you.",
                                    p["short"], p["order"], ["teacher"], 0))
            items.append(packet_row(f"🎒 {p['short']} · Student copy", p["pdf"],
                                    f"Every printable for {p['title']}, without answer keys. Print this for class.",
                                    p["short"], p["order"], everyone, 1))
        else:
            items.append(packet_row(f"{p['short']} packet", p["pdf"],
                                    f"Every printable for {p['title']} in one PDF, in order.",
                                    p["short"], p["order"], everyone, 0))
    if packets and teacher:
        items.append(packet_row("🔑 Year packet · Teacher edition", teacher_copy(YEAR_PACKET),
                                "Every unit packet in one PDF, WITH answer keys and teacher notes.",
                                YEAR_GROUP[0], YEAR_GROUP[1], ["teacher"], 0))
        items.append(packet_row("🎒 Year packet · Student copy", YEAR_PACKET,
                                "Every unit packet in one PDF, without answer keys.",
                                YEAR_GROUP[0], YEAR_GROUP[1], everyone, 1))
    elif packets:
        items.append(packet_row("Year packet: every unit", YEAR_PACKET, "Every unit packet in one PDF, in unit order.",
                                YEAR_GROUP[0], YEAR_GROUP[1], everyone, 0))

    items.sort(key=lambda i: i["_sort"])
    for i in items:
        i.pop("_sort")
        i["categories"] = [i["type"], i["unit"], i["source"]]
    return items


def parent_drafts():
    """Pages the family site leaves out: everything not marked for parents, except the
    overview and the unit pages (their objectives are what families want to see)."""
    drafts = []
    for path in sorted(COURSE.rglob("*.qmd")):
        rel = path.relative_to(ROOT)
        if path.name.startswith("_"):
            continue
        if path.name == "index.qmd" and len(rel.parts) == 4 and rel.parts[1] in SECTION_DIRS:
            continue   # course/units/<unit>/index.qmd or course/summatives/<summative>/index.qmd
        if path.name == "index.qmd" and any("parent" in (front_matter(q).get("audience") or [])
                                            for q in path.parent.rglob("*.qmd") if q != path):
            continue   # a section page (posters, say) with something for families in it
        if "parent" in (front_matter(path).get("audience") or []):
            continue
        drafts.append(rel.as_posix())
    return drafts


def write_parent_profile(drafts):
    """Rewrite the generated end of _quarto-parent.yml (only if it changed)."""
    if not PARENT_PROFILE.exists():
        return
    text = PARENT_PROFILE.read_text(encoding="utf-8")
    head = text.split(PARENT_MARKER)[0]
    marker_line = next(l for l in text.splitlines() if l.startswith(PARENT_MARKER))
    body = yaml.safe_dump({"drafts": drafts}, allow_unicode=True, sort_keys=False)
    body = "".join("  " + line + "\n" for line in body.splitlines())
    write_if_changed(PARENT_PROFILE, head + marker_line + "\n" + body)


def main():
    items = load_catalog()
    if "parent" in os.environ.get("QUARTO_PROFILE", "").split(","):
        items = [i for i in items if "parent" in (i.get("audience") or []) and i["type"] != "Packet"]
    header = "# Generated by scripts/catalog.py before every render. Don't edit by hand.\n"
    OUT.parent.mkdir(exist_ok=True)
    write_if_changed(OUT, header + yaml.safe_dump(items, allow_unicode=True, sort_keys=False))
    print(f"catalog: {len(items)} items -> {OUT.name}")
    packets = {p["id"]: {"pdf": p["pdf"], "files": p["files"], "extras": p["extras"]} for p in load_packets()}
    write_if_changed(OUT.parent / "packets.json", json.dumps(packets, indent=1))
    write_if_changed(OUT.parent / "pdf-pages.json", json.dumps(pdf_pages(), indent=1))
    write_parent_profile(parent_drafts())


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# Markdown builders for the overview page (print from a cell marked  #| output: asis)
# ---------------------------------------------------------------------------

def _row(item):
    title = f"[{item['title']}]({item['path']})"
    links = []
    if item["pdf"]:
        links.append(f"[PDF]({item['pdf']})")
    source = "[School]{.badge .badge-school}" if item["source"] == "School" else f"[{item['source']}]{{.badge .badge-official}}"
    kind = f"[{item['type']}]{{.badge .badge-type}}"
    return f"| {kind} | {title} | {item['description']} | {' '.join(links)} | {source} |"


def _table(items):
    lines = ["| Type | Title | What it is | Print | Source |", "|---|---|---|---|---|"]
    lines += [_row(i) for i in items]
    return "\n".join(lines) + "\n"


def built_catalog():
    """The catalog written before this render (generated/catalog.yml), so the overview's tabs match
    the version being built (teacher, student, family). Code inside a page can't tell which
    version that is; this script, run as a pre-render step, can."""
    if OUT.exists():
        return yaml.safe_load(OUT.read_text(encoding="utf-8")) or []
    return load_catalog()


def markdown_by_unit():
    items = built_catalog()
    out = []
    groups = [(u["short"], u) for u in load_units()] + [(YEAR_GROUP[0], None)]
    for name, unit in groups:
        group = [i for i in items if i["unit"] == name]
        if not group:
            continue
        heading = f"[{unit['title']}]({unit['path']})" if unit else name
        out.append(f"### {heading}\n")
        if unit and unit["description"]:
            out.append(f"{unit['description']}\n")
        out.append(_table(group))
    return "\n".join(out)


def markdown_by_type():
    items = built_catalog()
    out = []
    for label, _ in sorted(TYPES.values(), key=lambda t: t[1]):
        group = [i for i in items if i["type"] == label]
        if group:
            out.append(f"### {label}\n")
            out.append(_table(group))
    return "\n".join(out)


def markdown_learning():
    """For families: each unit and its objectives, in order."""
    out = []
    for u in load_units():
        out.append(f"**[{u['title']}]({u['path']})**  \n{u['description']}\n")
        out += [f"- {o}" for o in u["objectives"]] + [""]
    return "\n".join(out)


def markdown_season():
    """Season name and upcoming events, from course/season.yml."""
    import datetime
    season = yaml.safe_load((COURSE / "season.yml").read_text(encoding="utf-8"))
    today = datetime.date.today()
    upcoming = [e for e in season.get("events", []) if e["date"] >= today]
    # Optional keys: a course without teams or a game just leaves them out of season.yml.
    first = " ".join(x for x in [f"**{season.get('name', '')}", f"{season.get('name_zh', '')}**"] if x.strip("*"))
    rest = [season.get("season"), season.get("game"),
            f"Teams {season['team_numbers']}" if season.get("team_numbers") else None]
    lines = [" · ".join([first] + [x for x in rest if x]) + "\n"]
    if upcoming:   # ("%-d" for the day doesn't work on Windows, so the day number is added separately)
        nxt = ", ".join(f"**{e['name']}** ({e['date']:%b} {e['date'].day}, {(e['date'] - today).days} days)" for e in upcoming[:2])
        lines.append(f"Coming up: {nxt}\n")
    return "\n".join(lines)
