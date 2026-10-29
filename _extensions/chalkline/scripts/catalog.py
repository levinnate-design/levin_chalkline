"""Build the course catalog from every document's labels (its front matter).

Runs automatically before each full render (`pre-render` in the extension's _extension.yml) and
writes generated/catalog.yml, which the overview page lists, searches and filters.
Nothing is listed by hand: add a document to a unit folder, give it a `type`,
and it appears in the overview, grouped under its unit.

Labels read from each document's front matter:
    title         required
    type          slides, worksheet, checklist, poster, handout, reference, vocab
    description   one line, shown in the overview
    order         optional number, to sort documents within a unit
    packet        optional: false leaves a printable out of its unit packet
    audience      list: teacher, student, parent. `student`: on the student site (else teachers only);
                  `parent`: also listed on the student site's "For families" page

Each unit folder's index.qmd describes the unit (title, unit number, objectives).
External resources (posters, manuals, other websites) are
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

For the student site (the default build) the catalog holds only items marked
`audience: [..., student]`. Every build also writes the list of pages the student site leaves
out (teachers-only pages), at the end of _quarto-student.yml.

The overview's parts (markdown_season, markdown_by_unit, ...) are shown with {{< overview ... >}}
(blocks.lua and blocks.py). Other scripts import load_catalog, load_units and load_packets.
"""

import json
import os
import re
from html import escape
from pathlib import Path

import yaml

from genfile import write_if_changed

from extension import ROOT  # noqa: E402  (the course folder)
COURSE = ROOT / "course"
OUT = ROOT / "generated" / "catalog.yml"
STUDENT_PROFILE = ROOT / "_quarto-student.yml"
PROFILE_MARKER = "  # ---- Everything below is written by scripts/catalog.py"

TYPES = {  # type -> (label, sort order)
    "packet": ("Packet", 0),
    "slides": ("Slides", 1),
    "worksheet": ("Worksheet", 2),
    "checklist": ("Checklist", 3),
    "handout": ("Handout", 4),
    "poster": ("Poster", 5),
    "reference": ("Reference", 6),
    "vocab": ("Vocab", 7),
    "game": ("Game", 8),       # a web page of games to play (course/play.qmd)
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
        elif rel[0] == "teacher" and len(rel) > 2 and rel[1] == "test-units":
            t_idx = COURSE / "teacher" / "test-units" / rel[2] / "index.qmd"
            t_meta = front_matter(t_idx) if t_idx.exists() else {}
            group = t_meta.get("short-title", t_meta.get("title", rel[2]))
            group_order = int(t_meta.get("unit", 95))
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
                "source": link.get("source", "Website"),
                "formats": "Link",
                "audience": link.get("audience", ["teacher", "student"]),
                "_sort": (group_order, TYPES.get(kind, ("", 9))[1], 50, link["title"]),
            })

    packets = load_packets()
    teacher = "teacher" in os.environ.get("QUARTO_PROFILE", "").split(",")

    def packet_row(title, pdf, description, unit, order, audience, rank, edition=None):
        row = {"title": title, "path": pdf, "pdf": pdf, "description": description, "type": "Packet",
               "unit": unit, "source": "School", "formats": "PDF", "audience": audience, "_sort": (order, 0, rank, "")}
        if edition:   # "teacher" or "student": the overview marks them with a key or a backpack
            row["edition"] = edition
        return row

    everyone = ["teacher", "student", "parent"]
    for p in packets:
        if teacher:   # the teacher site has both: the teacher edition first, then the student copy
            items.append(packet_row(f"{p['short']} · Teacher edition", teacher_copy(p["pdf"]),
                                    f"Every printable for {p['title']}, WITH answer keys and teacher notes. For you.",
                                    p["short"], p["order"], ["teacher"], 0, "teacher"))
            items.append(packet_row(f"{p['short']} · Student copy", p["pdf"],
                                    f"Every printable for {p['title']}, without answer keys. Print this for class.",
                                    p["short"], p["order"], everyone, 1, "student"))
        else:
            items.append(packet_row(f"{p['short']} packet", p["pdf"],
                                    f"Every printable for {p['title']} in one PDF, in order.",
                                    p["short"], p["order"], everyone, 0))
    if packets and teacher:
        items.append(packet_row("Year packet · Teacher edition", teacher_copy(YEAR_PACKET),
                                "Every unit packet in one PDF, WITH answer keys and teacher notes.",
                                YEAR_GROUP[0], YEAR_GROUP[1], ["teacher"], 0, "teacher"))
        items.append(packet_row("Year packet · Student copy", YEAR_PACKET,
                                "Every unit packet in one PDF, without answer keys.",
                                YEAR_GROUP[0], YEAR_GROUP[1], everyone, 1, "student"))
    elif packets:
        items.append(packet_row("Year packet: every unit", YEAR_PACKET, "Every unit packet in one PDF, in unit order.",
                                YEAR_GROUP[0], YEAR_GROUP[1], everyone, 0))

    items.sort(key=lambda i: i["_sort"])
    for i in items:
        i.pop("_sort")
        i["categories"] = [i["type"], i["unit"], i["source"]]
    return items


def student_drafts():
    """Pages the student site leaves out: those whose `audience` label leaves out students,
    plus everything under course/teacher/. (Unit and section pages, which have no label, always stay.)"""
    drafts = []
    for path in sorted(COURSE.rglob("*.qmd")):
        if path.name.startswith("_"):
            continue
        rel = path.relative_to(COURSE).parts
        if rel and rel[0] == "teacher":
            drafts.append(path.relative_to(ROOT).as_posix())
            continue
        if path.name == "index.qmd":
            continue
        audience = front_matter(path).get("audience")
        if audience is not None and "student" not in audience:
            drafts.append(path.relative_to(ROOT).as_posix())
    return drafts


def write_student_profile(drafts):
    """Rewrite the generated end of _quarto-student.yml (only if it changed)."""
    if not STUDENT_PROFILE.exists():
        return
    text = STUDENT_PROFILE.read_text(encoding="utf-8")
    head = text.split(PROFILE_MARKER)[0]
    marker_line = next(l for l in text.splitlines() if l.startswith(PROFILE_MARKER))
    body = yaml.safe_dump({"drafts": drafts}, allow_unicode=True, sort_keys=False, default_flow_style=False)
    body = "".join("  " + line + "\n" for line in body.splitlines())
    write_if_changed(STUDENT_PROFILE, head + marker_line + "\n" + body)


def main():
    items = load_catalog()
    if "teacher" not in os.environ.get("QUARTO_PROFILE", "").split(","):   # the student site: only what's marked for students
        items = [i for i in items if "student" in (i.get("audience") or [])]
    header = "# Generated by scripts/catalog.py before every render. Don't edit by hand.\n"
    OUT.parent.mkdir(exist_ok=True)
    write_if_changed(OUT, header + yaml.safe_dump(items, allow_unicode=True, sort_keys=False))
    write_if_changed(OUT.with_suffix(".json"), json.dumps(items, ensure_ascii=False, indent=1))   # for the ::: {.quick-ref} slide (quickref.lua)
    print(f"catalog: {len(items)} items -> {OUT.name}")
    packets = {p["id"]: {"pdf": p["pdf"], "files": p["files"], "extras": p["extras"]} for p in load_packets()}
    write_if_changed(OUT.parent / "packets.json", json.dumps(packets, indent=1))
    units = [{"id": u["id"], "number": u["number"], "short": u["short"]} for u in load_units()]
    write_if_changed(OUT.parent / "units.json", json.dumps(units, ensure_ascii=False, indent=1))   # for the toolbox's Vocab and Packet (filter.lua)
    write_if_changed(OUT.parent / "pdf-pages.json", json.dumps(pdf_pages(), indent=1))
    write_student_profile(student_drafts())


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# Builders for the overview page (print from a cell marked  #| output: asis).
# They write HTML: a card for each unit, a row for each document, line icons instead of emoji.
# The look is in _extensions/chalkline/styles/styles.scss ("Overview"), with the same design values as the classroom tools.
# ---------------------------------------------------------------------------

ICONS = {  # Lucide line icons (ISC licence: _extensions/chalkline/ui/LUCIDE-LICENSE.txt), drawn inline
    "presentation": '<path d="M2 3h20" /> <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /> <path d="m7 21 5-5 5 5" />',
    "file-pen-line": '<path d="m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" /> <path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /> <path d="M8 18h1" />',
    "list-checks": '<path d="m3 17 2 2 4-4" /> <path d="m3 7 2 2 4-4" /> <path d="M13 6h8" /> <path d="M13 12h8" /> <path d="M13 18h8" />',
    "newspaper": '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /> <path d="M18 14h-8" /> <path d="M15 18h-5" /> <path d="M10 6h8v4h-8V6Z" />',
    "book-open": '<path d="M12 7v14" /> <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />',
    "image": '<rect width="18" height="18" x="3" y="3" rx="2" ry="2" /> <circle cx="9" cy="9" r="2" /> <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />',
    "languages": '<path d="m5 8 6 6" /> <path d="m4 14 6-6 2-3" /> <path d="M2 5h12" /> <path d="M7 2h1" /> <path d="m22 22-5-10-5 10" /> <path d="M14 18h6" />',
    "gamepad-2": '<line x1="6" x2="10" y1="11" y2="11" /> <line x1="8" x2="8" y1="9" y2="13" /> <line x1="15" x2="15.01" y1="12" y2="12" /> <line x1="18" x2="18.01" y1="10" y2="10" /> <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />',
    "package": '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /> <path d="M12 22V12" /> <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" /> <path d="m7.5 4.27 9 5.15" />',
    "key-round": '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" /> <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />',
    "backpack": '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /> <path d="M8 10h8" /> <path d="M8 18h8" /> <path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" /> <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />',
    "file-down": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /> <path d="M14 2v4a2 2 0 0 0 2 2h4" /> <path d="M12 18v-6" /> <path d="m9 15 3 3 3-3" />',
    "external-link": '<path d="M15 3h6v6" /> <path d="M10 14 21 3" /> <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />',
    "calendar-days": '<path d="M8 2v4" /> <path d="M16 2v4" /> <rect width="18" height="18" x="3" y="4" rx="2" /> <path d="M3 10h18" /> <path d="M8 14h.01" /> <path d="M12 14h.01" /> <path d="M16 14h.01" /> <path d="M8 18h.01" /> <path d="M12 18h.01" /> <path d="M16 18h.01" />',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <circle cx="9" cy="7" r="4" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <path d="M16 3.13a4 4 0 0 1 0 7.75" />',
    "house": '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /> <circle cx="12" cy="12" r="3" />',
}

TYPE_ICONS = {"Packet": "package", "Slides": "presentation", "Worksheet": "file-pen-line",
              "Checklist": "list-checks", "Handout": "newspaper", "Poster": "image",
              "Reference": "book-open", "Vocab": "languages", "Game": "gamepad-2"}
EDITIONS = {"teacher": ("key-round", "Teacher edition"), "student": ("backpack", "Student copy")}
YEAR_DESCRIPTION = "For the whole course: every unit packet in one PDF, review games for any unit, and more."


def _icon(name):
    return ('<svg class="ov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')


def _html(s):
    """Raw HTML in the page (Pandoc would otherwise read the indentation as code)."""
    return "\n```{=html}\n" + s + "\n```\n"


def _outside(item):
    return item["path"].startswith(("http://", "https://"))


def _link(item, cls, inner):
    extra = ' target="_blank" rel="noopener"' if _outside(item) else ""
    return f'<a class="{cls}" href="{escape(item["path"])}"{extra}>{inner}</a>'


def _who(item):
    """Who sees it (shown when the teacher turns on "Who sees it"): from the file's audience label."""
    aud = item.get("audience") or []
    chips = []
    if "student" in aud:
        chips.append(f'<span class="ov-aud ov-aud-student">{_icon("users")}Students</span>')
    if "parent" in aud and item["type"] != "Packet":   # listed on the "For families" page (no packets there)
        chips.append(f'<span class="ov-aud ov-aud-parent">{_icon("house")}For families</span>')
    if not chips:
        chips.append(f'<span class="ov-aud ov-aud-teacher">{_icon("lock")}Teachers only</span>')
    return '<span class="ov-who">' + "".join(chips) + "</span>"


def _audience_class(item):
    aud = item.get("audience") or []
    if "parent" in aud and item["type"] != "Packet":
        return "ov-to-families"
    return "ov-to-students" if "student" in aud else "ov-to-teachers"


def _item(item, show_unit=False):
    """One document: its icon, title and description, then what it is and a PDF button."""
    kind = item["type"]
    icon = EDITIONS[item["edition"]][0] if item.get("edition") else TYPE_ICONS.get(kind, "book-open")
    label = escape(item["unit"] if show_unit else kind)
    acts = []
    if _outside(item):
        acts.append(_link(item, "ov-source", escape(item["source"]) + _icon("external-link")))
    elif item["pdf"] and item["pdf"] != item["path"]:
        acts.append(f'<a class="ov-btn" href="{escape(item["pdf"])}" title="Download the PDF">{_icon("file-down")}PDF</a>')
    group = "link" if _outside(item) else kind.lower()
    return (f'<li class="ov-item ov-t-{kind.lower()}{" ov-outside" if _outside(item) else ""} {_audience_class(item)}" data-f="{group}">'
            f'<span class="ov-badge">{_icon(icon)}</span>'
            f'<span class="ov-main">{_link(item, "ov-title", escape(item["title"]))}'
            f'<span class="ov-desc">{escape(item["description"])}</span>{_who(item)}</span>'
            f'<span class="ov-kind">{label if show_unit else ("Outside link" if _outside(item) else label)}</span>'
            f'<span class="ov-acts">{"".join(acts)}</span></li>')


def _packet_button(item):
    edition = item.get("edition")
    icon, text = EDITIONS[edition] if edition else ("package", "Unit packet")
    cls = {"teacher": "ov-pack ov-pack-teacher", "student": "ov-pack ov-pack-student"}.get(edition, "ov-pack")
    return (f'<a class="{cls}" href="{escape(item["pdf"])}" title="{escape(item["description"])}">'
            f'{_icon(icon)}<span>{text}<small>PDF</small></span></a>')


def _number(unit):
    n = unit.get("number") if unit else None
    if n:
        return f'<span class="ov-num">{n}</span>'
    return f'<span class="ov-num ov-num-icon">{_icon("book-open" if unit else "calendar-days")}</span>'


def built_catalog():
    """The catalog written before this render (generated/catalog.yml), so the overview's tabs match
    the version being built (teacher, student, family). Code inside a page can't tell which
    version that is; this script, run as a pre-render step, can."""
    if OUT.exists():
        return yaml.safe_load(OUT.read_text(encoding="utf-8")) or []
    return load_catalog()


def _chips(items):
    """Buttons that show only one kind of document (index.qmd's script does the filtering)."""
    rows = [i for i in items if i["type"] != "Packet"]
    groups = [(label.lower(), label + ("s" if label in ("Worksheet", "Checklist", "Handout", "Poster") else ""))
              for label, _ in sorted(TYPES.values(), key=lambda t: t[1])]
    chips = [f'<button type="button" class="ov-chip ov-on" data-f="all">All<span>{len(rows)}</span></button>']
    for key, label in groups + [("link", "Outside links")]:
        n = sum(1 for i in rows if ("link" if _outside(i) else i["type"].lower()) == key)
        if n:
            cls = "ov-t-reference ov-outside" if key == "link" else f"ov-t-{key}"
            chips.append(f'<button type="button" class="ov-chip {cls}" data-f="{key}"><i></i>{label}<span>{n}</span></button>')
    if _teacher_build(items):
        chips.append(f'<button type="button" class="ov-who-toggle" aria-pressed="false" title="Show which files students and families can see">'
                     f'{_icon("eye")}Who sees it<i></i></button>')
    return _html('<div class="ov-chips" role="group" aria-label="Show only">' + "".join(chips) + "</div>"
                 + '<div class="ov-who-legend"><span class="ov-aud ov-aud-parent">' + _icon("house") + 'For families</span> green rows are also listed on the For families page. '
                 + '<span class="ov-aud ov-aud-teacher">' + _icon("lock") + 'Teachers only</span> rows are only here. Everything else is for students.</div>')


def _teacher_build(items):
    """The teacher site: its catalog has the teacher editions of the packets."""
    return "teacher" in os.environ.get("QUARTO_PROFILE", "").split(",") or any(i.get("edition") == "teacher" for i in items)


def markdown_by_unit():
    items = built_catalog()
    out = [_chips(items)]
    groups = [(u["short"], u) for u in load_units()] + [(YEAR_GROUP[0], None)]
    for name, unit in groups:
        group = [i for i in items if i["unit"] == name]
        if not group:
            continue
        # the student copy first: printing it for class is what teachers do most; the answer keys come second
        packets = sorted((i for i in group if i["type"] == "Packet"), key=lambda i: i.get("edition") == "teacher")
        rest = [i for i in group if i["type"] != "Packet"]
        title = f'<a href="{escape(unit["path"])}">{escape(unit["title"])}</a>' if unit else escape(name)
        about = unit["description"] if unit else YEAR_DESCRIPTION
        head = (f'<header class="ov-unit-head">{_number(unit)}'
                f'<div class="ov-unit-text"><h3>{title}</h3><p>{escape(about)}</p></div>'
                f'<div class="ov-packs">{"".join(_packet_button(p) for p in packets)}</div></header>')
        rows = f'<ul class="ov-list">{"".join(_item(i) for i in rest)}</ul>' if rest else ""
        out.append(_html(f'<section class="ov-unit">{head}{rows}</section>'))
    return "\n".join(out)


def markdown_by_type():
    items = built_catalog()
    out = []
    for label, _ in sorted(TYPES.values(), key=lambda t: t[1]):
        group = [i for i in items if i["type"] == label]
        if group:
            head = (f'<header class="ov-type-head ov-t-{label.lower()}"><span class="ov-badge">{_icon(TYPE_ICONS[label])}</span>'
                    f'<h3>{label}</h3><span class="ov-count">{len(group)}</span></header>')
            out.append(_html(f'<section class="ov-unit">{head}<ul class="ov-list">'
                             + "".join(_item(i, show_unit=True) for i in group) + "</ul></section>"))
    return "\n".join(out)


def markdown_family_picks():
    """For the "For families" page: the files marked audience: [..., parent], by unit."""
    items = [i for i in built_catalog() if "parent" in (i.get("audience") or []) and i["type"] != "Packet"]
    out = []
    groups = [(u["short"], u) for u in load_units()] + [(YEAR_GROUP[0], None)]
    for name, unit in groups:
        group = [i for i in items if i["unit"] == name]
        if not group:
            continue
        title = f'<a href="{escape(unit["path"])}">{escape(unit["title"])}</a>' if unit else escape(name)
        head = f'<header class="ov-unit-head">{_number(unit)}<div class="ov-unit-text"><h3>{title}</h3></div></header>'
        out.append(_html(f'<section class="ov-unit">{head}<ul class="ov-list">{"".join(_item(i) for i in group)}</ul></section>'))
    return "\n".join(out)


def markdown_learning():
    """For families: each unit and its objectives, in order."""
    out = []
    for u in load_units():
        goals = "".join(f"<li>{escape(o)}</li>" for o in u["objectives"])
        out.append(_html(f'<section class="ov-unit"><header class="ov-unit-head">{_number(u)}'
                         f'<div class="ov-unit-text"><h3><a href="{escape(u["path"])}">{escape(u["title"])}</a></h3>'
                         f'<p>{escape(u["description"])}</p></div></header>'
                         + (f'<ul class="ov-goals">{goals}</ul>' if goals else "") + "</section>"))
    return "\n".join(out)


def markdown_season():
    """The page's header: course name, season, what's in it, and the next two events (course/season.yml)."""
    import datetime
    season = yaml.safe_load((COURSE / "season.yml").read_text(encoding="utf-8"))
    today = datetime.date.today()
    upcoming = [e for e in season.get("events", []) if e["date"] >= today]
    # Optional keys: a course without teams or a game just leaves them out of season.yml.
    zh = f' <span class="ov-hero-zh">{escape(season["name_zh"])}</span>' if season.get("name_zh") else ""
    items = [i for i in built_catalog() if i["source"] == "School"]
    units = [u for u in load_units() if u.get("number")]
    decks = sum(1 for i in items if i["type"] == "Slides")
    prints = sum(1 for i in items if i["type"].lower() in PACKET_TYPES | {"poster"})
    facts = [season.get("season"), season.get("game"),
             f"Teams {season['team_numbers']}" if season.get("team_numbers") else None,
             f"{len(units)} units" if units else None,
             f"{decks} slide decks" if decks else None, f"{prints} printables" if prints else None]
    meta = "".join(f"<span>{escape(str(x))}</span>" for x in facts if x)
    events = ""
    for e in upcoming[:2]:   # ("%-d" for the day doesn't work on Windows, so the day number is added separately)
        days = (e["date"] - today).days
        when = "today" if days == 0 else "tomorrow" if days == 1 else f"in {days} days"
        events += (f'<div class="ov-event"><span class="ov-date"><small>{e["date"]:%b}</small>{e["date"].day}</span>'
                   f'<span><b>{escape(e["name"])}</b><small>{when}</small></span></div>')
    events = f'<div class="ov-events"><span class="ov-events-label">Coming up</span>{events}</div>' if events else ""
    return _html(f'<div class="ov-hero"><div class="ov-hero-main"><span class="ov-eyebrow">Course overview</span>'
                 f'<div class="ov-hero-title">{escape(season.get("name", ""))}{zh}</div>'
                 f'<div class="ov-hero-meta">{meta}</div></div>{events}</div>')
