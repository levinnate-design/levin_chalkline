"""Print every slide deck to PDF, one slide per page, next to the deck (slides.html -> slides.pdf).

Uses reveal.js's own print layout (open a deck with ?print-pdf), printed by the Chrome or
Edge already on the computer, driven by Playwright (in requirements.txt; it waits until the
print layout is really finished, which Chrome's own command-line printing can't). Teacher builds put the speaker notes on their own page after each slide.

Runs automatically after each full render (`post-render` in the extension's _extension.yml). Saving a deck
while `quarto preview` runs doesn't reprint it, so editing stays quick; the launchers
reprint out-of-date decks when they start (scripts/build_if_needed.py). Or by hand:

    python chalkline.py slides-pdf                 every deck, into _site/
    python chalkline.py slides-pdf --stale         only decks whose PDF is older than the web version
    python chalkline.py slides-pdf --deck course/units/05-game-day/slides.qmd
    python chalkline.py slides-pdf --teacher ...   into _site-teacher/, with speaker notes

Videos, animations and live widgets (timer, poll) print as a still frame.
Needs Google Chrome or Microsoft Edge.
"""

import asyncio
import os
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
from catalog import front_matter  # noqa: E402
from extension import ROOT  # noqa: E402

CHANNELS = ["chrome", "msedge"]   # browsers Playwright can use without downloading its own
# Several decks print at once in separate tabs; without these, Chrome slows the tabs it treats
# as "in the background" and their print layout can stall.
NO_THROTTLE = ["--disable-background-timer-throttling", "--disable-renderer-backgrounding",
               "--disable-backgrounding-occluded-windows"]
WORKERS = max(1, min(4, (os.cpu_count() or 2) // 2))
READY = """() => window.Reveal && Reveal.isReady && Reveal.isReady()
           && document.querySelectorAll('.pdf-page').length > 0
           && [...document.images].every(i => i.complete || !i.offsetParent)
           && !document.querySelector('.pdfv[data-pending]')"""
# (images that aren't shown, like the vocab pop-up pictures, load lazily and may never load: skip them;
#  .pdfv[data-pending]: a {{< pdf-viewer >}} still drawing its pages)


def decks():
    """Every slide deck: course files with `type: slides`."""
    return [p for p in sorted((ROOT / "course").rglob("*.qmd"))
            if not p.name.startswith("_") and front_matter(p).get("type") == "slides"]


ORIGIN = "http://chalkline.site/"   # a made-up address; requests to it are answered from the site folder


async def serve_from(context, folder):
    """Answer the browser's requests for ORIGIN straight from `folder` on disk. No web server,
    so nothing can drop connections when several decks load at once. Other addresses (an
    embedded video, say) go out to the internet as usual."""
    async def handle(route):
        path = folder / unquote(urlsplit(route.request.url).path).lstrip("/")
        if path.is_dir():
            path = path / "index.html"
        if path.is_file():
            await route.fulfill(path=str(path))
        else:
            await route.fulfill(status=404, body="not found")
    await context.route(ORIGIN + "**", handle)


async def print_deck(context, limit, url, pdf):
    """Open one deck in print layout, wait until it's laid out, save it as PDF."""
    async with limit:
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="load", timeout=60000)
            await page.wait_for_function(READY, timeout=60000)
            await page.evaluate("document.fonts.ready.then(() => true)")
            try:   # embedded videos (YouTube) keep the network busy; don't wait for them for long
                await page.wait_for_load_state("networkidle", timeout=5000)
            except Exception:
                pass
            await page.wait_for_timeout(300)
            await page.pdf(path=str(pdf), prefer_css_page_size=True, print_background=True)
            print(f"slides_pdf: {pdf.relative_to(ROOT)}")
        except Exception as e:   # one bad deck shouldn't stop the rest
            try:
                state = await page.evaluate("""() => ({reveal: !!(window.Reveal && Reveal.isReady && Reveal.isReady()),
                  pages: document.querySelectorAll('.pdf-page').length,
                  pdfs: document.querySelectorAll('.pdfv[data-pending]').length,
                  waiting: [...document.images].filter(i => !i.complete).map(i => i.src).slice(0, 5)})""")
            except Exception:
                state = "?"
            print(f"slides_pdf: couldn't print {url}: {str(e).splitlines()[0]} (state: {state})")
        finally:
            await page.close()


async def launch(p):
    """Chrome or Edge from the computer; else a Chromium that Playwright installed (`playwright install
    chromium`, for build servers). None if there's neither."""
    for channel in CHANNELS + [None]:
        try:
            return await p.chromium.launch(channel=channel, args=NO_THROTTLE)
        except Exception:
            pass
    return None


async def print_all(folder, jobs):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await launch(p)
        if not browser:
            print("slides_pdf: Google Chrome or Microsoft Edge not found, so slide PDFs were skipped.")
            return
        context = await browser.new_context()
        await serve_from(context, folder)
        limit = asyncio.Semaphore(WORKERS)
        await asyncio.gather(*(print_deck(context, limit, url, pdf) for url, pdf in jobs))
        await browser.close()


def arg(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv[:-1] else None


def main():
    in_quarto = "QUARTO_PROJECT_OUTPUT_DIR" in os.environ
    if in_quarto and not os.environ.get("QUARTO_PROJECT_RENDER_ALL"):
        return   # a save in the preview: decks are reprinted later (see the notes at the top)
    teacher = ("--teacher" in sys.argv or "teacher" in os.environ.get("QUARTO_PROFILE", "").split(",")
               or "teacher" in os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", ""))
    out_dir = ROOT / os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site-teacher" if teacher else "_site")

    todo = []
    only = arg("--deck")
    for src in decks():
        rel = src.relative_to(ROOT)
        if only and rel != Path(only):
            continue
        html, pdf = out_dir / rel.with_suffix(".html"), out_dir / rel.with_suffix(".pdf")
        if not html.exists():
            continue   # not built in this site (a parent build leaves most decks out)
        if "--stale" in sys.argv and pdf.exists() and pdf.stat().st_mtime >= html.stat().st_mtime:
            continue
        todo.append((rel, pdf))
    if not todo:
        return

    query = "?print-pdf" + ("&showNotes=separate-page" if teacher else "")
    asyncio.run(print_all(out_dir, [(ORIGIN + rel.with_suffix(".html").as_posix() + query, pdf) for rel, pdf in todo]))


if __name__ == "__main__":
    main()
