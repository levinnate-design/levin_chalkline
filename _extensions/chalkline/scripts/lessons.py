"""Build the lesson map from the folders under course/lessons/.

Runs automatically before each render (`pre-render` in the extension's _extension.yml).

How lessons are organized:
    course/lessons/03-engineering/            a strand (its index.qmd has `strand: true`)
    course/lessons/03-engineering/02-intakes/ a lesson
    .../02-intakes/01-rollers/                a lesson that follows on from Intakes

A lesson's ID is its path with the number prefixes dropped: engineering/intakes/rollers.
Folder numbers set the order. Inside a strand, each lesson follows the one
before it, and a lesson's sub-lessons follow it. A strand with `sequence: false`
has lessons that don't follow each other (milestone meetings, for example).

Links between strands go in front matter:
    requires: [engineering/chassis-types, game]   a lesson ID, or a whole strand
A strand's own `requires:` applies to its first lesson.

Writes:
    generated/lessons.json          each lesson's "before this" and "next up" (for {{< lesson-nav >}})
    generated/lesson-map.md         strands and the links between them, then every lesson as a list
    generated/lesson-map-<strand>.md   one strand's map, plus the lessons it needs from other strands
"""

import json
import os
import re
import sys
from pathlib import Path

import yaml

from genfile import write_if_changed

from extension import ROOT  # noqa: E402  (the course folder)
LESSONS = ROOT / "course" / "lessons"
OUT = ROOT / "generated"


def front_matter(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    return (yaml.safe_load(m.group(1)) or {}) if m else {}


def slug(folder):
    return re.sub(r"^\d+-", "", folder.name)


def load():
    """Every strand and lesson, keyed by ID, in folder order."""
    nodes = {}

    def walk(folder, parent, strand):
        for sub in sorted(p for p in folder.iterdir() if (p / "index.qmd").exists()):
            meta = front_matter(sub / "index.qmd")
            node_id = f"{parent}/{slug(sub)}" if parent else slug(sub)
            nodes[node_id] = {
                "id": node_id,
                "title": meta.get("title", slug(sub)),
                "description": meta.get("description", ""),
                "minutes": meta.get("minutes"),
                "strand": strand or node_id,
                "parent": parent,
                "is_strand": parent is None,
                "sequence": meta.get("sequence", True),
                "requires": list(meta.get("requires") or []),
                "path": (sub / "index.qmd").relative_to(ROOT).as_posix(),
                "children": [],
            }
            if parent:
                nodes[parent]["children"].append(node_id)
            walk(sub, node_id, strand or node_id)

    if LESSONS.exists():
        walk(LESSONS, None, None)
    return nodes


def edges(nodes):
    """(from, to, kind) for every "comes before" link. kind: "step" inside a strand, "link" across."""
    out = []
    errors = []
    for n in nodes.values():
        for req in n["requires"]:
            if req not in nodes:
                errors.append(f'{n["path"]}: requires "{req}", which isn\'t a lesson or strand')
            else:
                out.append((req, n["id"], "link"))
        kids = n["children"]
        for i, kid in enumerate(kids):
            if n["is_strand"]:
                if i > 0 and n["sequence"]:
                    out.append((kids[i - 1], kid, "step"))
            elif i == 0:
                out.append((n["id"], kid, "step"))
            else:
                out.append((kids[i - 1], kid, "step"))
    return out, errors


def lessons_in(nodes, node_id):
    """A lesson, or every lesson in a strand, in reading order."""
    n = nodes[node_id]
    if not n["is_strand"]:
        return [node_id]
    out = []

    def add(k):
        out.append(k)
        for kid in nodes[k]["children"]:
            add(kid)

    for kid in n["children"]:
        add(kid)
    return out


def find_cycle(nodes, links):
    """A loop of lessons that each need the one before, or None."""
    after = {k: set() for k in nodes}
    for a, b, _ in links:
        # A strand as a requirement means all of its lessons; a strand as the
        # target means its first lesson (the strand's own requires).
        targets = nodes[b]["children"][:1] if nodes[b]["is_strand"] else [b]
        for x in lessons_in(nodes, a):
            after[x].update(targets)
    state = {}

    def visit(k, trail):
        state[k] = "open"
        for nxt in after[k]:
            if state.get(nxt) == "open":
                return trail[trail.index(nxt):] + [nxt] if nxt in trail else [k, nxt]
            if nxt not in state:
                found = visit(nxt, trail + [nxt])
                if found:
                    return found
        state[k] = "done"
        return None

    for k in nodes:
        if k not in state:
            found = visit(k, [k])
            if found:
                return found
    return None


def html_path(node):
    return node["path"][:-4] + ".html"


def rel_href(node, base):
    """Link from a page in folder `base` (relative to ROOT) to a lesson's page."""
    return os.path.relpath(ROOT / html_path(node), ROOT / base).replace(os.sep, "/")


def mid(node_id):
    return "n_" + re.sub(r"[^A-Za-z0-9]", "_", node_id)


def label(text):
    return text.replace('"', "'")


NAVY, SKY, GREY = "#003477", "#ebf7fd", "#8a9bb0"
STYLES = [
    f"  classDef lesson fill:#fff,stroke:{NAVY},color:{NAVY}",
    f"  classDef outside fill:#fff,stroke:{GREY},stroke-dasharray:4 3,color:#555",
]


def strand_map(nodes, links, strand):
    """One strand as a Mermaid flowchart, plus boxes for the lessons it needs from other strands."""
    base = str(Path(nodes[strand]["path"]).parent)
    lines = ["```{mermaid}", "flowchart TB"]
    mine = set(lessons_in(nodes, strand)) | {strand}
    outside = []
    for a, b, _ in links:
        if b in mine and a not in mine and a not in outside:
            outside.append(a)
    clicks = []
    for a in outside:
        n = nodes[a]
        title = n["title"] if n["is_strand"] else f'{nodes[n["strand"]]["title"]}: {n["title"]}'
        lines.append(f'  {mid(a)}["{label(title)}"]:::outside')
        clicks.append(f'  click {mid(a)} href "{rel_href(n, base)}"')
    lines.append(f'  subgraph {mid(strand)}["{label(nodes[strand]["title"])}"]')
    lines.append("    direction TB")
    for k in lessons_in(nodes, strand):
        lines.append(f'    {mid(k)}["{label(nodes[k]["title"])}"]:::lesson')
        clicks.append(f'  click {mid(k)} href "{rel_href(nodes[k], base)}"')
    lines.append("  end")
    for a, b, kind in links:
        if b in mine and (a in mine or a in outside):
            lines.append(f'  {mid(a)} {"-->" if kind == "step" else "-.->"} {mid(b)}')
    lines += clicks + STYLES
    lines.append(f"  style {mid(strand)} fill:{SKY},stroke:{NAVY},color:{NAVY}")
    lines.append("```")
    return "\n".join(lines) + "\n"


def overview_map(nodes, links):
    """The map page: strands and the arrows between them, then each strand's lessons as a list."""
    base = "course/lessons"
    strands = [n for n in nodes.values() if n["is_strand"]]
    lines = ["```{mermaid}", "flowchart LR"]
    for s in strands:
        count = len(lessons_in(nodes, s["id"]))
        lines.append(f'  {mid(s["id"])}["{label(s["title"])}<br/><small>{count} lessons</small>"]:::lesson')
    pairs = []
    for a, b, _ in links:
        pair = (nodes[a]["strand"], nodes[b]["strand"])
        if pair[0] != pair[1] and pair not in pairs:
            pairs.append(pair)
    lines += [f"  {mid(a)} --> {mid(b)}" for a, b in pairs]
    lines += [f'  click {mid(s["id"])} href "{rel_href(s, base)}"' for s in strands]
    lines += STYLES
    lines.append("```")

    md = ["\n".join(lines), ""]
    for s in strands:
        md.append(f'## [{s["title"]}]({rel_href(s, base)})\n')
        if s["description"]:
            md.append(s["description"] + "\n")
        for k in lessons_in(nodes, s["id"]):
            n = nodes[k]
            depth = k.count("/") - 1
            md.append(f'{"    " * depth}1. [{n["title"]}]({rel_href(n, base)})')
        md.append("")
    return "\n".join(md) + "\n"


def main():
    nodes = load()
    links, errors = edges(nodes)
    for e in errors:
        print(f"lessons: {e}")
    cycle = find_cycle(nodes, links)
    if cycle:
        print("lessons: these lessons each need the one before, in a loop: " + " -> ".join(cycle))

    titles = {k: n["title"] for k, n in nodes.items()}
    nav = {}
    for k, n in nodes.items():
        before = [a for a, b, _ in links if b == k]
        if not n["is_strand"] and n["parent"] == n["strand"] and nodes[n["strand"]]["children"][:1] == [k]:
            before += [a for a, b, _ in links if b == n["strand"]]   # strand's requires apply to its first lesson
        nxt = [b for a, b, _ in links if a == k]
        nav[n["path"]] = {
            "id": k,
            "title": n["title"],
            "strand": titles[n["strand"]],
            "strand_path": nodes[n["strand"]]["path"],
            "minutes": n["minutes"],
            "before": [{"title": titles[a] if nodes[a]["strand"] == n["strand"] else f'{titles[nodes[a]["strand"]]}: {titles[a]}' if not nodes[a]["is_strand"] else f"All of {titles[a]}", "path": nodes[a]["path"]} for a in before],
            "next": [{"title": titles[b] if nodes[b]["strand"] == n["strand"] else f'{titles[nodes[b]["strand"]]}: {titles[b]}' if not nodes[b]["is_strand"] else titles[b], "path": nodes[b]["path"]} for b in nxt],
        }

    OUT.mkdir(exist_ok=True)
    write_if_changed(OUT / "lessons.json", json.dumps(nav, ensure_ascii=False, indent=1))
    write_if_changed(OUT / "lesson-map.md", overview_map(nodes, links))
    for s in (n for n in nodes.values() if n["is_strand"]):
        write_if_changed(OUT / f'lesson-map-{s["id"]}.md', strand_map(nodes, links, s["id"]))
    count = sum(1 for n in nodes.values() if not n["is_strand"])
    print(f"lessons: {count} lessons in {len(nodes) - count} strands -> lesson map")
    if errors or cycle:
        sys.exit(0)   # warn, don't stop the render


if __name__ == "__main__":
    main()
