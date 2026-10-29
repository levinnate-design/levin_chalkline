"""Build unit packets and the year packet: one fresh PDF each, made by Quarto's book feature.

Runs automatically after each full render (`post-render` in the extension's _extension.yml) and rebuilds every
packet. Saving a worksheet while `quarto preview` runs does NOT rebuild its packet, so editing
stays quick: finish the worksheet, then rebuild its packet by hand. The launchers also rebuild
out-of-date packets when they start (scripts/build_if_needed.py).

    python chalkline.py packets                  every packet and the year packet, into _site/
    python chalkline.py packets --unit 5         one unit's packet (unit number or folder name)
    python chalkline.py packets --stale          only packets older than one of their printables
    python chalkline.py packets --teacher ...    teacher and student packets, into _site-teacher/
    python chalkline.py packets --unit 5 --keep  keep the scratch folder (and Typst source) to debug a packet

Which printables go in each packet comes from scripts/catalog.py (generated/packets.json):
worksheets, checklists, handouts and references with a PDF format, in `order:`.
Add `packet: false` to a printable's front matter to leave it out. Outside PDFs listed
under `packet-extras:` in the unit's index.qmd go in as full pages (see catalog.py).

How it works: for each packet the course is copied to its own scratch folder (so the
preview never sees the build, and packets build in parallel), and Quarto renders it as a
book whose chapters are the unit's printables. Saved Python results (_freeze/) are copied
too, so code isn't rerun. The
book uses the same brand, page layout and settings as _quarto.yml. A cover page lists the
unit's objectives and what's in the packet; each printable starts on a new page.

Writes (in the site folder):
    course/units/<unit>/<unit>-packet.pdf
    year-packet.pdf
The teacher build writes both editions: the teacher edition (answer keys, notes, TEACHER
EDITION tab) under a name that says so, and the student copy under the usual name:
    course/units/<unit>/<unit>-teacher-packet.pdf    course/units/<unit>/<unit>-packet.pdf
    year-teacher-packet.pdf                          year-packet.pdf
It also writes a student copy of every printable next to its teacher edition, for slides:
    course/units/<unit>/<sheet>-student.pdf
(slides show it with {{< pdf-viewer "<sheet>.pdf" >}}; see `pdf-viewer: prefer:` in _quarto-teacher.yml).
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from catalog import YEAR_PACKET, formats_of, front_matter, load_packets, teacher_copy  # noqa: E402
from extension import ROOT, typst_format  # noqa: E402

STUDENT_COPY = "{name}-student.pdf"   # keep in step with `pdf-viewer: prefer:` in _quarto-teacher.yml
COPY = ["course", "brand", "_extensions", "scripts", "generated", "_freeze"]   # scripts/: the course's own, if any
WORKERS = max(1, min(4, (os.cpu_count() or 2) // 2))   # packets built at once (each Quarto run uses ~0.5 GB)

# Each printable starts on a new page (except the first heading, under the cover banner).
# `part` is what Quarto's book output calls for each unit in the year packet: a divider page.
PAGE_BREAKS = """```{=typst}
#let part(body) = {
  pagebreak(weak: true)
  v(1fr)
  align(center, text(size: 30pt, weight: 700, fill: rgb("#003477"), body))
  v(2fr)
}
#show heading.where(level: 1): it => {
  if it.body == [] { return }   // an outside PDF's chapter has no title: no heading, no extra page
  context if query(heading.where(level: 1).before(here())).len() > 1 { pagebreak(weak: true) }
  it
}
```
"""


def book_config(teacher, title, subtitle, chapters):
    """_quarto.yml for one packet: the site's settings, as a book of `chapters`."""
    site = yaml.safe_load((ROOT / "_quarto.yml").read_text(encoding="utf-8"))
    cfg = {k: v for k, v in site.items() if k not in ("project", "website", "format")}
    if teacher:
        extra = yaml.safe_load((ROOT / "_quarto-teacher.yml").read_text(encoding="utf-8")) or {}
        cfg.update({k: v for k, v in extra.items() if k not in ("project", "website")})
    cfg["project"] = {"type": "book", "output-dir": "_book",
                      "execute-dir": site["project"].get("execute-dir", "project")}
    cfg["book"] = {"title": title, "subtitle": subtitle, "output-file": "packet", "chapters": chapters}
    cfg["format"] = {"typst": typst_format(site)}   # Chalkline's PDF layout and the course's settings
    return cfg


def cover(objectives, chapters):
    """The packet's first chapter: objectives, then what's inside."""
    lines = ["---", 'title: "In this packet"', "---", ""]
    if objectives:
        lines += ["**Objectives**", ""] + [f"- {o}" for o in objectives] + [""]
    lines += ["**Contents**", ""]
    lines += [f"{n}. {c['title']}" for n, c in enumerate(chapters, 1)]
    return "\n".join(lines) + "\n\n" + PAGE_BREAKS


def chapter_files(chapters):
    """Book chapter paths for a packet, and the small .qmd files to write for outside PDFs."""
    paths, extra_files = [], {}
    for c in chapters:
        if "qmd" in c:
            paths.append(c["qmd"])
        else:   # an outside PDF: a chapter holding just the {{< pdf >}} shortcode, no title of its own
            pdf = Path(c["pdf"])
            qmd = (pdf.parent / f"packet-extra-{pdf.stem}.qmd").as_posix()
            # A book renders as one document, so give the path from the project root.
            extra_files[qmd] = f'{{{{< pdf "/{pdf.as_posix()}" >}}}}\n'
            paths.append(qmd)
    return paths, extra_files


def printables():
    """Every course file with a PDF version, except slide decks (path from the project root)."""
    for path in sorted((ROOT / "course").rglob("*.qmd")):
        if path.name.startswith("_") or path.name == "index.qmd":
            continue
        meta = front_matter(path)
        if meta.get("type") != "slides" and "PDF" in formats_of(meta):
            yield path.relative_to(ROOT).as_posix()


def student_copy(qmd):
    """course/units/x/sheet.qmd -> course/units/x/sheet-student.pdf"""
    path = Path(qmd)
    return (path.parent / STUDENT_COPY.format(name=path.stem)).as_posix()


def student_copies(files, out_dir):
    """Teacher site: the student copy of each printable (no answer keys), so slides can show it.
    All of them in one Quarto run, in a scratch copy of the course without the teacher profile."""
    with tempfile.TemporaryDirectory(prefix="chalkline-student-") as tmp:
        build = Path(tmp)
        for name in COPY:
            if (ROOT / name).exists():
                shutil.copytree(ROOT / name, build / name,
                                ignore=shutil.ignore_patterns("*_files", ".quarto", "__pycache__", "_*.qmd"))
        site = yaml.safe_load((ROOT / "_quarto.yml").read_text(encoding="utf-8"))
        cfg = {k: v for k, v in site.items() if k not in ("project", "website", "format")}
        cfg["project"] = {"output-dir": "_out", "render": files,
                          "execute-dir": site["project"].get("execute-dir", "project")}
        cfg["format"] = {"typst": typst_format(site)}   # Chalkline's PDF layout and the course's settings
        (build / "_quarto.yml").write_text(yaml.safe_dump(cfg, allow_unicode=True, sort_keys=False), encoding="utf-8")
        result = subprocess.run(["quarto", "render", "--to", "typst"], cwd=build, env=quarto_env(),
                                capture_output=True, text=True)
        for qmd in files:
            pdf = build / "_out" / Path(qmd).with_suffix(".pdf")
            if not pdf.exists():
                print(f"packets: no student copy of {qmd}:\n" + (result.stderr or result.stdout)[-2000:])
                return False
            dest = out_dir / student_copy(qmd)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(pdf, dest)
        print(f"packets: student copies of {len(files)} printable{'s' if len(files) != 1 else ''}")
        return True


def render(cfg, cover_text, dest, extra_files):
    """Render one book in its own scratch folder and copy the PDF to `dest`. True if it worked."""
    keep = "--keep" in sys.argv
    with tempfile.TemporaryDirectory(prefix="chalkline-packet-") as tmp:
        build = Path(tempfile.mkdtemp(prefix="chalkline-packet-")) if keep else Path(tmp)
        if keep:
            cfg.setdefault("format", {}).setdefault("typst", {})["keep-typ"] = True
            print(f"packets: building in {build} (kept)")
        for name in COPY:
            if (ROOT / name).exists():
                shutil.copytree(ROOT / name, build / name,
                                ignore=shutil.ignore_patterns("*_files", ".quarto", "__pycache__", "_*.qmd"))
        for name, text in extra_files.items():
            (build / name).write_text(text, encoding="utf-8")
        root_relative_pdfs(build)
        pdf = render_in(build, cfg, cover_text)
        if not pdf:
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(pdf, dest)
        print(f"packets: {dest.relative_to(ROOT)}")
        return True


PDF_SHORTCODE = re.compile(r'(\{\{<\s*pdf\s+")(?!/)([^"]+)(")')


def root_relative_pdfs(build):
    """In the scratch copy, turn {{< pdf "sheet.pdf" >}} into {{< pdf "/course/.../sheet.pdf" >}}.
    A book renders as one document, so the shortcode can't tell which folder a chapter is in."""
    for qmd in (build / "course").rglob("*.qmd"):
        text = qmd.read_text(encoding="utf-8")
        folder = qmd.parent.relative_to(build).as_posix()
        fixed = PDF_SHORTCODE.sub(lambda m: f"{m[1]}/{folder}/{m[2]}{m[3]}", text)
        if fixed != text:
            qmd.write_text(fixed, encoding="utf-8")


def quarto_env():
    """A clean environment for Quarto in a scratch folder: the outer render's QUARTO_* settings
    (profile, output files) must not leak in."""
    env = {k: v for k, v in os.environ.items() if not k.startswith("QUARTO_") or k == "QUARTO_PYTHON"}
    if env.get("QUARTO_PYTHON") and not Path(env["QUARTO_PYTHON"]).is_absolute():
        env["QUARTO_PYTHON"] = str(ROOT / env["QUARTO_PYTHON"])   # the build runs in another folder
    if "QUARTO_PYTHON" not in env and (ROOT / ".venv").exists():
        py = ROOT / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        env["QUARTO_PYTHON"] = str(py)
    return env


def render_in(build, cfg, cover_text):
    """Render one book in the scratch folder. Returns the PDF path, or None if it failed."""
    (build / "_quarto.yml").write_text(yaml.safe_dump(cfg, allow_unicode=True, sort_keys=False), encoding="utf-8")
    # Teacher packets: switch the teacher profile on too, so `content-visible when-profile="teacher"`
    # (answer keys, teacher notes) is included. Its settings are already merged into cfg.
    teacher = "edition" in cfg
    if teacher:
        (build / "_quarto-teacher.yml").write_text(yaml.safe_dump({"edition": cfg["edition"]}, allow_unicode=True), encoding="utf-8")
    (build / "index.qmd").write_text(cover_text, encoding="utf-8")
    result = subprocess.run(["quarto", "render", "--to", "typst"] + (["--profile", "teacher"] if teacher else []), cwd=build, env=quarto_env(),
                            capture_output=True, text=True)
    pdf = build / "_book" / "packet.pdf"
    if result.returncode != 0 or not pdf.exists():
        print(f"packets: Quarto failed for {cfg['book']['title']}:\n" + (result.stderr or result.stdout)[-2000:])
        return None
    return pdf


def is_stale(packet, out_dir, name=lambda pdf: pdf):
    """True if the packet's PDF (named by `name`) is missing or older than one of its printables."""
    pdf = out_dir / name(packet["pdf"])
    if not pdf.exists():
        return True
    built = pdf.stat().st_mtime
    return any((ROOT / f).stat().st_mtime > built for f in packet["files"] + packet.get("extras", []))


def arg(name):
    """The value after `name` on the command line, or None."""
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv[:-1] else None


def main():
    in_quarto = "QUARTO_PROJECT_OUTPUT_DIR" in os.environ
    teacher = ("--teacher" in sys.argv or "teacher" in os.environ.get("QUARTO_PROFILE", "").split(",")
               or "teacher" in os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", ""))
    out_dir = ROOT / os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site-teacher" if teacher else "_site")

    packets = load_packets()
    if in_quarto and not os.environ.get("QUARTO_PROJECT_RENDER_ALL"):
        return   # a save in the preview: packets wait (see the notes at the top)
    unit = arg("--unit")
    if unit and not any(unit in (p["id"], str(p["number"])) for p in packets):
        sys.exit(f"packets: no unit packet for {unit!r} (units with printables: "
                 + ", ".join(p["id"] for p in packets) + ")")

    # (is it the teacher edition, how its files are named). The teacher site gets both editions.
    editions = [(True, teacher_copy), (False, lambda pdf: pdf)] if teacher else [(False, lambda pdf: pdf)]
    year_all = {"pdf": YEAR_PACKET, "files": [f for p in packets for f in p["files"]],
                "extras": [e for p in packets for e in p.get("extras", [])]}
    jobs = []
    for is_teacher, name in editions:
        label = "Teacher edition · with answer keys" if is_teacher else ("Student copy" if teacher else "Packet")
        if unit:
            todo = [p for p in packets if unit in (p["id"], str(p["number"]))]
        elif "--stale" in sys.argv:
            todo = [p for p in packets if is_stale(p, out_dir, name)]
        else:
            todo = packets
        for p in todo:
            paths, extra_files = chapter_files(p["chapters"])
            jobs.append((book_config(is_teacher, p["title"], label, ["index.qmd"] + paths),
                         cover(p["objectives"], p["chapters"]), out_dir / name(p["pdf"]), extra_files))
        # The year packet: with a full rebuild, or with --stale when it's older than any printable.
        # Never with --unit, which is meant to be quick.
        if packets and not unit and ("--stale" not in sys.argv or is_stale(year_all, out_dir, name)):
            parts, all_extra, all_chapters = [], {}, []
            for p in packets:
                paths, extra_files = chapter_files(p["chapters"])
                parts.append({"part": p["title"], "chapters": paths})
                all_extra.update(extra_files)
                all_chapters += p["chapters"]
            season = yaml.safe_load((ROOT / "course" / "season.yml").read_text(encoding="utf-8"))
            cfg = book_config(is_teacher, f"{season['name']} {season['season']}", f"Year packet · {label}",
                              ["index.qmd"] + parts)
            jobs.insert(0, (cfg, cover([], all_chapters), out_dir / name(YEAR_PACKET), all_extra))  # longest first
    # Teacher site: student copies of the printables (of one unit with --unit; only out-of-date ones with --stale)
    copies = []
    if teacher:
        folders = [f"course/units/{p['id']}/" for p in packets if not unit or unit in (p["id"], str(p["number"]))]
        copies = [f for f in printables() if not unit or f.startswith(tuple(folders))]
        if "--stale" in sys.argv:
            copies = [f for f in copies if not (out_dir / student_copy(f)).exists()
                      or (out_dir / student_copy(f)).stat().st_mtime < (ROOT / f).stat().st_mtime]
    with ThreadPoolExecutor(WORKERS) as pool:
        waiting = pool.submit(student_copies, copies, out_dir) if copies else None
        list(pool.map(lambda job: render(*job), jobs))
        if waiting:
            waiting.result()


if __name__ == "__main__":
    main()
