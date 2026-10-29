"""Take a small picture of every slide, for the All slides page (all-slides.qmd, {{< slide-wall >}}).

Opens each unit's slide decks in the browser (like slides_pdf.py: Chrome or Edge, through Playwright),
shows each slide with all its steps, and saves a picture of it next to the deck:
course/units/01-ancient-greece/city-states-slides-pictures/01.jpg, 02.jpg, ... and slides.json.
Then writes slide-pictures.json at the site root: every unit's decks, in order, with their slides.

Runs automatically after each full render (`post-render`), and the launchers redo decks that changed
when they start, like the slide PDFs. Or by hand:

    python chalkline.py slide-pictures              every deck, into _site/
    python chalkline.py slide-pictures --stale      only decks changed since their pictures
    python chalkline.py slide-pictures --teacher    into _site-teacher/

Needs Google Chrome or Microsoft Edge. Videos and outside pages (GeoGebra, PhET) may show as a blank box.
"""

import asyncio
import json
import os
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image

from extension import ROOT  # noqa: E402  (the course folder)
from catalog import front_matter, load_units  # noqa: E402
from slides_pdf import ORIGIN, WORKERS, decks, launch, serve_from  # noqa: E402

WIDTH = 480           # picture width in pixels (shown at about 160-320 on the page)
FOLDER = "-pictures"  # city-states-slides.html -> city-states-slides-pictures/
INDEX = "slide-pictures.json"
# Only the slides: no toolbox, menus, slide number or progress bar. The logo and footer stay.
HIDE = """
body > :not(.reveal) { display: none !important; }
.reveal > :not(.slides):not(.backgrounds):not(.slide-logo):not(.footer) { display: none !important; }
"""
SLIDES = """() => Reveal.getSlides().map(s => {
  const i = Reveal.getIndices(s);
  const head = s.querySelector('h1, h2, h3');
  return { id: s.id || '', h: i.h, v: i.v || 0, title: head ? head.textContent.trim() : '' };
})"""


async def picture_deck(context, limit, url, folder):
    """Every slide of one deck, as folder/01.jpg ... and folder/slides.json."""
    async with limit:
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="load", timeout=60000)
            await page.wait_for_function("() => window.Reveal && Reveal.isReady && Reveal.isReady()", timeout=60000)
            size = await page.evaluate("() => [Reveal.getConfig().width, Reveal.getConfig().height]")
            w, h = (int(x) if str(x).isdigit() else d for x, d in zip(size, (1050, 700)))
            await page.set_viewport_size({"width": w, "height": h})
            await page.add_style_tag(content=HIDE)
            await page.evaluate("() => Reveal.configure({ transition: 'none', backgroundTransition: 'none', autoSlide: 0 })")
            await page.evaluate("document.fonts.ready.then(() => true)")
            slides = await page.evaluate(SLIDES)
            folder.mkdir(parents=True, exist_ok=True)
            for old in folder.glob("*.jpg"):
                old.unlink()
            for n, s in enumerate(slides, 1):
                # the slide with every step shown (fragments), as at the end of the slide
                await page.evaluate("([h, v]) => { Reveal.slide(h, v); while (Reveal.nextFragment()) {} }", [s["h"], s["v"]])
                await page.wait_for_timeout(250)
                shot = Image.open(BytesIO(await page.screenshot(type="png")))
                shot = shot.convert("RGB").resize((WIDTH, round(WIDTH * shot.height / shot.width)), Image.LANCZOS)
                s["img"] = f"{n:02d}.jpg"
                shot.save(folder / s["img"], quality=78, optimize=True)
            (folder / "slides.json").write_text(json.dumps({"width": w, "height": h, "slides": slides}, ensure_ascii=False),
                                                encoding="utf-8")
            print(f"slide_pictures: {folder.relative_to(ROOT)} ({len(slides)} slides)")
        except Exception as e:   # one bad deck shouldn't stop the rest
            print(f"slide_pictures: couldn't picture {url}: {str(e).splitlines()[0]}")
        finally:
            await page.close()


async def picture_all(site, jobs):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await launch(p)
        if not browser:
            print("slide_pictures: Google Chrome or Microsoft Edge not found, so slide pictures were skipped.")
            return
        context = await browser.new_context()
        await serve_from(context, site)
        limit = asyncio.Semaphore(WORKERS)
        await asyncio.gather(*(picture_deck(context, limit, url, folder) for url, folder in jobs))
        await browser.close()


def write_index(site, unit_decks):
    """slide-pictures.json: each unit (in folder order) with its pictured decks (in `order:`)."""
    units = []
    for unit in load_units():
        found = []
        for src in unit_decks.get(unit["id"], []):
            rel = src.relative_to(ROOT).with_suffix("")
            info = site / f"{rel.as_posix()}{FOLDER}" / "slides.json"
            if not (site / rel.with_suffix(".html")).exists() or not info.exists():
                continue
            meta = front_matter(src)
            data = json.loads(info.read_text(encoding="utf-8"))
            found.append({
                "title": meta.get("title", src.stem),
                "subtitle": meta.get("subtitle", ""),
                "order": meta.get("order", 50),
                "path": rel.with_suffix(".html").as_posix(),
                "pictures": f"{rel.as_posix()}{FOLDER}/",
                "pdf": rel.with_suffix(".pdf").as_posix() if (site / rel.with_suffix(".pdf")).exists() else "",
                "width": data["width"], "height": data["height"],
                "slides": data["slides"],
            })
        if found:
            found.sort(key=lambda d: (d["order"] if isinstance(d["order"], (int, float)) else 50, d["title"]))
            units.append({"title": unit["short"], "path": unit["path"], "decks": found})
    (site / INDEX).write_text(json.dumps({"units": units}, ensure_ascii=False), encoding="utf-8")


def main():
    in_quarto = "QUARTO_PROJECT_OUTPUT_DIR" in os.environ
    if in_quarto and not os.environ.get("QUARTO_PROJECT_RENDER_ALL"):
        return   # a save in the preview: pictures are redone later, like the slide PDFs
    teacher = ("--teacher" in sys.argv or "teacher" in os.environ.get("QUARTO_PROFILE", "").split(",")
               or "teacher" in os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", ""))
    site = ROOT / os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site-teacher" if teacher else "_site")

    unit_decks, jobs = {}, []
    for src in decks():
        parts = src.relative_to(ROOT).parts
        if len(parts) != 4 or parts[0] != "course" or parts[1] not in ("units", "summatives"):
            continue   # only the units' and summatives' own decks (not the Review games page)
        unit_decks.setdefault(parts[2], []).append(src)
        rel = src.relative_to(ROOT).with_suffix("")
        html, folder = site / rel.with_suffix(".html"), site / f"{rel.as_posix()}{FOLDER}"
        if not html.exists():
            continue   # not in this site (a teachers-only deck in the student build)
        info = folder / "slides.json"
        if "--stale" in sys.argv and info.exists() and info.stat().st_mtime >= html.stat().st_mtime:
            continue
        jobs.append((ORIGIN + rel.with_suffix(".html").as_posix(), folder))
    if jobs:
        asyncio.run(picture_all(site, jobs))
    if site.exists():
        write_index(site, unit_decks)


if __name__ == "__main__":
    main()
