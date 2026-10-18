# Changes to the tool

A log of changes to how Chalkline works or looks (code, styles, settings), as opposed to lesson content. AI assistants add an entry here whenever they change a tool file (see "Changing the tool" in `CLAUDE.md`); you can add entries by hand too.

**Why it matters:** this is design feedback. Send this file to John now and then: useful changes may be built into Chalkline for every teacher.

Newest entries first.

<!-- Entries go below this line. Copy this template:

## YYYY-MM-DD: short title
- **Asked for:** what the teacher wanted, in their words if they gave them.
- **Why:** the reason they gave, or "not given".
- **Changed:** each file and what changed in it.
- **Who it helps:** this course only, or probably every Chalkline course.
- **AI assistant:** which one made the change.
-->

## 2026-10-18: Publish student site (`_site`) to GitHub Pages
- **Asked for:** "create a website link for my chalkline" -> selected "Publish online to GitHub Pages (`https://levinnate-design.github.io/levin_chalkline/`)" and "Student version (`_site/`, without answer keys and teacher notes) so you can share the public URL directly with students".
- **Why:** GitHub Pages is public, so a real course's public website link should serve the student edition without answer keys or teacher-only notes.
- **Changed:**
  - `.github/workflows/publish.yml` — changed `quarto render --profile teacher` / `path: _site-teacher` to `quarto render` / `path: _site`.
- **Who it helps:** every Chalkline course publishing a live student-facing site on GitHub Pages.
- **AI assistant:** Gemini (Antigravity)

## 2026-10-18: Draggable clock & timer overlay, dark-slide text contrast, and vertical `.subslide` drill-downs
- **Asked for:** "1. Can the time be a draggable element that I can reposition on the screen? 2. Some text, such as the Chinese text in the title for Week x Lesson x slides, is the same color as the background, double check to make sure all text is sufficiently contrasted with the layer its directly on. 3. Lesson 1 Step 1.1 has a lot of text and not all of it is being shown, in events like this, can there be an overview slide, then more detailed slides that I could access by pressing down (instead of right to proceed to the next slide), allowing for more depth on a topic, before proceeding?"
- **Why:** To let teachers freely reposition the clock and timer anywhere on the board without blocking slide content, make bold/Chinese text visible on dark navy section slides (`{background-color="#003477"}`), and allow overview slides to have optional vertical drill-down slides underneath them.
- **Changed:**
  - `_extensions/classroom/clock.html` — made `#slide-clock` draggable via pointer events and persisted its position in `localStorage`.
  - `_extensions/classroom/countdown.html` — made both the `F` Classroom Timer overlay (`#cd-overlay`) and the minimized timer pill (`#cd-mini`) freely draggable without a full-screen backdrop blocking the slide; added `setupVerticalSubslides()` so any slide marked `{.subslide}` nests vertically under the preceding overview slide (press `Down` for details or `Right` to skip to the next topic).
  - `brand/revealjs.scss` — added high-contrast text rules for `section.has-dark-background` and `section.section-slide` (`#fff` for headings/text, `$orange` for `strong`, `$turquoise` for `.zh`/links, while keeping dark text inside light callouts/cards).
- **Who it helps:** probably every Chalkline course.
- **AI assistant:** Gemini (Antigravity)

## 2026-10-18: Press `F` timer overlay on any slide & compact inline timer layout
- **Asked for:** "Some pages in the slideshow are cut off, the timers numbers are shown, but the UI (start, reset, +1) is hidden and I can't scroll to see it. Alternatively it would also be helpful I could create a timer overlay on any slide by hitting 'F'. Which isn't set up on my chalkline."
- **Why:** When an inline `{{< timer >}}` is placed below bullets or callouts on a slide, the 3.6em font size pushed the Start/Reset/+1 min buttons off the bottom of the 700px slide frame. Additionally, teachers want to pop up a countdown timer on any slide on the fly by pressing `F`.
- **Changed:**
  - `_extensions/classroom/countdown.html` — added a floating Classroom Timer overlay toggled by pressing `F` on any slide (with `1m`–`30m` presets, `−1 min` / `+1 min`, `Start/Pause`, `Reset`, and automatic minimizing to the `#cd-mini` pill at the bottom of the screen while running); also styled `.countdown:not(:first-child)` more compactly so inline timers placed below slide text never clip their control buttons.
  - `_extensions/classroom/filter.lua` — included `countdown.html` on every `revealjs` slide deck so pressing `F` works on any slide in any deck even without an inline `{{< timer >}}` shortcode.
- **Who it helps:** probably every Chalkline course.
- **AI assistant:** Gemini (Antigravity)

## 2026-10-18: Support dedicated `course/summatives/` directory tree
- **Asked for:** "I am concerned about the file tree naming given that I will add more summatives to the course moving forward, there should be a sub file tree within a 'SUMMATIVES' directory for a 'Unit 2 - Summative'".
- **Why:** To keep multi-week summative assessments organized in their own top-level `Summatives` sidebar section (`course/summatives/<summative-folder>/`) separate from regular instructional units as more summatives are added over the year.
- **Changed:**
  - `_quarto.yml` — added `- auto: course/summatives` to the sidebar navigation below `course/units`.
  - `scripts/catalog.py` — updated `load_units()`, `load_packets()`, `load_catalog()`, and `parent_drafts()` to scan both `course/units/` and `course/summatives/` (`SECTION_DIRS = ("units", "summatives")`).
  - `_extensions/classroom/shortcodes.lua` — updated `packet_for_this_page()` so `{{< packet >}}` works on `course/summatives/<folder>/index.qmd` pages as well as `course/units/<folder>/index.qmd`.
- **Who it helps:** probably every Chalkline course that wants a separate `Summatives` section with per-summative packets and overview groupings.
- **AI assistant:** Gemini (Antigravity)

## 2026-10-15: New "Economics" vocab topic (capitalism, communism)
- **Asked for:** "download the vocab csv but add 'capitalism' and 'communism'".
- **Why:** both words are modern economic systems, so they fit neither Ancient Greece nor Ancient Rome. Asked which way to go; the teacher chose to give them their own topic rather than squeeze them into an existing one.
- **Changed:**
  - `vocab/schema.yaml` — vocab `id_pattern` now allows `ECO` as well as `GRC`/`ROM`; added the domain `ECO: [systems]`.
  - `vocab/config.js` — added `ECO` to `domainNames` ("Economics") and `domainZh` (经济学); added `systems` → 制度 to `subdomainZh`.
  - `vocab/data/vocab.csv` — two content rows: `ECO-001` capitalism, `ECO-002` communism, each cross-linked to the other via `confused_with`. No `image` yet, so the app shows "no image" for these two.
- **Who it helps:** the pattern (a domain that isn't one of the two history units) is probably useful to every Chalkline course; the `ECO` domain itself is this course only.
- **AI assistant:** WorkBuddy