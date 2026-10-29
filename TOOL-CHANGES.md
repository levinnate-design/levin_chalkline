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

## 2026-10-29: Enable Classroom Toolbox, Packet/Vocab sidebars, and Play at Home on live site
- **Asked for:** "There's no packet overlay on the live site? ... Yes push those features as well as the other tools (stop watch, voice levels, etc)"
- **Why:** So teachers presenting directly from the live GitHub Pages site (and students reviewing slides) have full access to the Classroom Toolbox (`W` menu: Stopwatch, Clock `K`, Voice Level & Noise Meter, Traffic Light, Spotlight, Name Picker, Groups, Scoreboard, QR Code, Music, Dice, Slide Size), the Packet overlay sidebar (`P`), the Vocab sidebar (`V`), and the Play at Home review games page, while keeping answer keys and speaker notes restricted to the local Teacher build.
- **Changed:**
  - `_extensions/classroom/filter.lua` — removed the `and is_teacher()` gate from the reveal.js `classroom-tools` and `pdf-viewer` dependency injection so all slide tools and sidebars (`W`, `P`, `V`, `K`) load on the live student build as well as the teacher build; added `teacher = is_teacher()` to `#chalkline-course` JSON metadata; kept speaker notes (`::: notes`) teacher-only.
  - `_extensions/classroom/toolbox/tools/packet.js` — gated the `"Answer key"` toggle button inside the Packet sidebar on `data.teacher` so the public live site displays the student unit packet PDF without attempting to load teacher-only answer key packets.
  - `course/play.qmd` & `_quarto-student.yml` — updated `audience` to `[teacher, student]` so the Play at Home (`课后闯关`) one-player review games page is published on the live site.
- **Who it helps:** probably every Chalkline course where teachers present from the hosted GitHub Pages URL in the classroom.
- **AI assistant:** Antigravity (Gemini)

## 2026-10-26: Import upstream Chalkline tool features (Toolbox, Sidebars, Review Games, Learning Activities, PDF Viewer, Card Overview) & update Teachers Only Start Here
- **Asked for:** "I want to import newly added features from the original chalkline (insufficient doubt) ... Update the 'Start Here' part of teachers only, but do not import the new units 'Gobekli Tepe' and 'STEM/Robot Lifts'"
- **Why:** To bring in the latest upstream Chalkline tool capabilities (Classroom Toolbox `W` menu, Vocab `V` and Packet `P` slide sidebars, Word Blitz/Jeopardy/Snowman/Bingo review games, interactive learning activities, slide PDF viewer with touch-pen annotation, and card-based overview) while preserving all Mingwan School Social Studies curriculum units, vocabulary, and IB MYP customizations without cluttering the course with sample STEM/Göbekli Tepe units.
- **Changed:**
  - `_extensions/classroom/` & `_extensions/pdf-viewer/` — imported upstream toolbox, games, learning activities, quickref, video-fit, and pdf-viewer extensions while preserving `course/summatives/` and `course/teacher/test-units/` support in `shortcodes.lua` and `filter.lua`.
  - `brand/` — imported upstream card-overview styling, playful print fonts (`Fredoka`, `PatrickHand`), and updated Typst partials while preserving dark-slide contrast rules in `brand/revealjs.scss`.
  - `scripts/catalog.py`, `scripts/packets.py`, `scripts/vocab_terms.py`, `scripts/student_site.py`, `scripts/slides_pdf.py`, `scripts/build_if_needed.py`, `scripts/open_site.py` — imported upstream scripts while preserving `SECTION_DIRS = ("units", "summatives")`, isolating `course/teacher/` from student builds, and excluding test units (`unit >= 90`) from the public game-picker unit dropdown.
  - `_quarto.yml`, `_quarto-teacher.yml`, `_quarto-student.yml`, `index.qmd`, `families.qmd`, `course/review-games.qmd`, `course/play.qmd` — added Review Games, Play at Home, and For Families pages, student profile draft filtering, and QR student-site URL while preserving Mingwan School branding and Teachers Only sidebar navigation.
  - `course/teacher/start-here/slides.qmd` & `course/teacher/test-units/` — updated the Teachers Only Chalkline Tour deck (50-feature interactive catalog, omitting STEM/Göbekli Tepe) and added upstream's demo decks (`review-games-slides.qmd`, `learning-activities-slides.qmd`, `rome-timeline-slides.qmd`) inside `course/teacher/test-units/` (`audience: [teacher]`).
- **Who it helps:** this course (and any Chalkline course selectively upgrading its tool layer from upstream without overwriting local curriculum).
- **AI assistant:** Antigravity (Gemini)

## 2026-10-22: Move Test Units & Tour to Teachers Only and rebrand site to 'Mingwan School · Social Studies'
- **Asked for:** "Remove references to 'Nathan' and 'Chinese Co-teacher' they should be referred to as 'Nate' and 'Xinyi' respectively. Also add a list of suggested AI prompts (such as the prompts that I have been using here) to the teachers only section to help with Chalkline use. Also move all 'TEST' units to the teachers only section and remove all tutorial-like markings outside of the teachers only area."
- **Why:** To make the public and student-facing sites completely authentic to Mingwan School Social Studies (showing only real curriculum units in the catalog and navigation), while keeping tutorial slides (`00-start-here`) and sample test units (`91` & `92`) accessible to teachers under the Teachers Only sidebar section.
- **Changed:**
  - `_quarto.yml` — updated site title to `Mingwan School · Social Studies`.
  - `_quarto-teacher.yml` — expanded `Teachers Only 教师专区` to include `course/teacher/ai-prompts.qmd`, `course/teacher/start-here/slides.qmd`, and test units 91 & 92.
  - `course/teacher/test-units/` — moved `91-test-unit-1-ancient-greece` and `92-test-unit-2-ancient-rome` out of `course/units/` and set `audience: [teacher]`.
  - `course/teacher/start-here/` — moved `00-start-here` out of `course/units/` and set `audience: [teacher]`.
  - `course/teacher/ai-prompts.qmd` — created curated AI prompt library for Nate and Xinyi.
  - `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `AI-ACTIVITY-LOG.md`, `course/teacher/co-teacher-onboarding.qmd` — standardized teacher names to Nate and Xinyi.
- **Who it helps:** this course and any school deploying Chalkline for real students.
- **AI assistant:** Gemini (Antigravity)

## 2026-10-22: Add 'Teachers Only 教师专区' section to teacher profile (`_quarto-teacher.yml`)
- **Asked for:** "Add the new onboarding page for my coteacher to the current Chalkline, under a teachers only section"
- **Why:** To provide an exclusive sidebar section in the Teacher Edition (`_site-teacher/`) for teacher onboarding, setup guides, and co-teaching rubrics without exposing internal developer and git credentials on the student or parent sites.
- **Changed:**
  - `_quarto-teacher.yml` — added `Teachers Only 教师专区` section containing `course/teacher/co-teacher-onboarding.qmd` to the teacher sidebar.
  - `course/teacher/co-teacher-onboarding.qmd` — created bilingual co-teacher onboarding and workstation setup guide.
- **Who it helps:** this course and any co-taught course with internal teacher onboarding workflows.
- **AI assistant:** Gemini (Antigravity)

## 2026-10-20: Add MYP Assessment Criteria to sidebar navigation (`_quarto.yml`)
- **Asked for:** "IB Alignment: Create a page on Chalkine that displays the MYP Individuals and Societies Criterion."
- **Why:** To make the official IB MYP Individuals and Societies Year 3 criteria (Criteria A, B, C, D) directly discoverable from the global sidebar navigation alongside the Command Terms reference.
- **Changed:**
  - `_quarto.yml` — added `course/references/assessment-criteria.qmd` ("Assessment Criteria 评估标准") under `website.sidebar.contents` with the `award` icon.
- **Who it helps:** this course and any MYP course needing a prominent sidebar link to its assessment rubrics.
- **AI assistant:** Antigravity (Gemini)

## 2026-10-19: A Student Edition PDF next to every Teacher Edition PDF (`scripts/student_copies.py`)
- **Asked for:** "create both 'Teacher Edition' and 'Student Edition' pdf copies on my chalkline. The 'Student Edition' should not have any 'Teacher Edition' in the top right header."
- **Why:** the teacher build stamps TEACHER EDITION on every PDF and keeps the answer keys, so there was no clean copy to print for class — and the file was still named after students (`student-summative-booklet.pdf`), which reads as a contradiction.
- **Changed:** new `scripts/student_copies.py`, run from `post-render` in `_quarto.yml`. On the teacher site it re-renders each printable *without* the teacher profile and writes it next to the teacher copy as `<name>-student-edition.pdf`: no TEACHER EDITION tab, no `when-profile="teacher"` content. Only printables that actually contain teacher-only content get a second copy. It sits out the quick renders `quarto preview` does on save, the same way packets do.
- **Who it helps:** probably every Chalkline course — any teacher printing from the teacher site.
- **AI assistant:** WorkBuddy

## 2026-10-19: Draw the missing vocab pictures for Units 1 and 2 (`vocab/tools/draw_icons.py`)
- **Asked for:** "Create image links for both unit 1 and 2 vocab terms in chalkline."
- **Why:** Only 45 of the 97 rows in `vocab/data/vocab.csv` had a picture. The gap was almost entirely Unit 1: all 36 `RIV` terms (Ancient River Civilizations) had none, plus the 14 Unit 2 terms added in the previous task (`GRC-014`–`019`, `ROM-013`–`020`) and the 2 `ECO` words. So {{< vocab >}} pop-ups for those words opened with no image at all.
- **Changed:**
  - `vocab/tools/draw_icons.py` — added 52 entries to `ICONS` (`RIV-001`–`036`, `GRC-014`–`019`, `ROM-013`–`020`, `ECO-001`–`002`), drawn with the same flat five-colour style and 240×180 grid as the existing icons. Added reusable helpers above `ICONS`: `crown`, `tablet` (clay tablet with wedge marks), `scroll`, `no_sign` (the red circle-with-slash), `eye`, `sun`, `sprout`, and `caption` (the bold label across the top). Every new icon is original line art, so there is no image licence to worry about and they work offline.
  - Nothing else about the tool changed — no new config, no new build step. Running `python vocab/tools/draw_icons.py` now writes 97 SVGs into `vocab/images/`.
  - *Note:* the `DIAGRAMS` step in the same script still writes `aqueduct-slope.svg` to `course/units/02-ancient-rome/images/`, a unit folder that was renamed to `02-classical-mediterranean`. That leaves an untracked stray folder each time the script runs. Left alone for now because fixing it means deciding where the diagram should actually live.
- **Who it helps:** probably every Chalkline course — any course whose vocab list outgrows its picture set can extend `ICONS` the same way, and the helpers make coloured icons much quicker to draw.
- **AI assistant:** WorkBuddy

## 2026-10-18: Ignore numbered Quarto scratch artifacts (`*.quarto_ipynb*`)
- **Asked for:** "Keep the stray temp file, maybe its worth creating a misc_dump folder for miscellaneous files with a log (advise please)."
- **Why:** Quarto's Jupyter engine leaves `*.quarto_ipynb` scratch files beside each `.qmd`, and when a render is interrupted it numbers the leftovers (`..._1`, `..._2`). The existing pattern `**/*.quarto_ipynb` did not match the numbered ones, so they showed up as untracked and could be committed by mistake. Advised fixing `.gitignore` rather than creating a `_misc_dump/` folder: these files are regenerated on every render, so they are build noise rather than curriculum content, and a dump folder would slowly collect copies of them.
- **Changed:**
  - `.gitignore` — `**/*.quarto_ipynb` widened to `**/*.quarto_ipynb*` so plain and numbered scratch files are both ignored.
- **Who it helps:** probably every Chalkline course that renders pages containing Python code cells.
- **AI assistant:** WorkBuddy

## 2026-10-18: Technical growth report generator (`scripts/growth_report.py`)
- **Asked for:** "Create a script that can be used in Gemini to create a technical description of how my chalkline has grown since it was first cloned from insufficient doubt's chalkline-sample. I will copy and paste this into a notebooklm for my personal learning purposes."
- **Why:** To automatically analyze Git commits, diff statistics, Quarto/Typst/Reveal architecture, vocabulary expansion, and multi-agent workflows since the fork, generating an in-depth technical dossier formatted for ingestion into Google NotebookLM.
- **Changed:**
  - `scripts/growth_report.py` — created script to inspect git history, diffs against clone commit `b1a200e`, parse vocabulary domains, analyze `TOOL-CHANGES.md`, and generate a structured NotebookLM Markdown dossier (`docs/CHALKLINE-GROWTH-DOSSIER.md`).
- **Who it helps:** any Chalkline teacher or developer wanting to track how their custom course fork diverges from upstream or export an architectural summary for NotebookLM/LLM analysis.
- **AI assistant:** Gemini (Antigravity)

## 2026-10-18: Recursive SOP check protocol & live SOP timestamp in `scripts/ai_log.py`
- **Asked for:** "Add a line in the agentic protocols so that they recursively check for updates to their SOP"
- **Why:** So long-running AI sessions (WorkBuddy, Antigravity, etc.) never rely on a stale in-context copy of `CLAUDE.md` and automatically detect and adopt SOP updates before starting or finishing any task.
- **Changed:**
  - `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `AI-ACTIVITY-LOG.md` — added recursive SOP check rule requiring agents to re-read `CLAUDE.md` and `AI-ACTIVITY-LOG.md` from disk on every new task and before handoff.
  - `scripts/ai_log.py` — updated `show` to print a `[SOP Check]` banner displaying the exact last-modified timestamp of `CLAUDE.md`.
- **Who it helps:** any course coordinated by multiple long-running AI sessions.
- **AI assistant:** Gemini (Antigravity)

## 2026-10-18: Unit 2 vocab subdomains `society` and `synthesis`
- **Asked for:** "Update chalkline with Unit 2 materials" — Unit 2: Classical Mediterranean Foundations (Ancient Greece & Rome), built from the Unit 2 reading inquiry booklet, the Classical Mediterranean master deck, and the Rome entry/exit tickets.
- **Why:** Unit 2's vocabulary vaults cover **social structure and forced labour** (helots, metics, latifundia, chattel slavery, corvée labour) and **cross-unit comparison** (continuity), none of which the existing `GRC` / `ROM` / `RIV` subdomains described.
- **Changed:**
  - `vocab/schema.yaml` — `domains`: `GRC` adds `society`, `ROM` adds `society`, `RIV` adds `synthesis`.
  - `vocab/config.js` — `subdomainZh`: added `society: "社会与劳动"` and `synthesis: "跨单元综合"` so the vocab app labels the new cards in 中文.
  - `vocab/data/vocab.csv` — 18 new Unit 2 terms: `GRC-014`–`GRC-019`, `ROM-013`–`ROM-020`, `RIV-033`–`RIV-036`.
  - `course/units/02-classical-mediterranean/` — new unit folder (index + overview + 3-lesson reading packets, guided notes, entry/exit tickets) and `course/vocab/02-classical-mediterranean.yml` (29 terms).
- **Who it helps:** any course whose unit vocabulary includes social structure, coerced labour, or cross-unit synthesis — probably most history and social-science courses.
- **AI assistant:** WorkBuddy

## 2026-10-18: Shared local AI Activity Log (`AI-ACTIVITY-LOG.md` & `scripts/ai_log.py`) for multi-agent sync
- **Asked for:** "I want you include a new Workbuddy account into the chalkline work flow, create something that I can copy and paste into workbuddy to get it set up." / "Create a set up such that the various AI tools have a log on my local storage that they upload to so that all my AI platforms can be up to date with what each of them have been doing."
- **Why:** So multiple AI assistants and accounts (Antigravity subagents, Tencent WorkBuddy accounts, Claude, etc.) working across `chalkline-mingwan` and WeDrive can see what each platform has done or is currently working on without stepping on each other.
- **Changed:**
  - `AI-ACTIVITY-LOG.md` — created shared local activity feed and project snapshot in `chalkline-mingwan` (and mirrored to WeDrive `Social Studies/AI-ACTIVITY-LOG.md`).
  - `scripts/ai_log.py` — added CLI tool (`show`, `add`, `sync`) to read, prepend timestamped activity entries, and automatically mirror `AI-ACTIVITY-LOG.md` between `chalkline-mingwan` and WeDrive.
  - `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` — added canonical paths (`chalkline-mingwan` + WeDrive), GitHub remote, and required `AI-ACTIVITY-LOG.md` read/write rules for all AI assistants.
- **Who it helps:** this course, and any Chalkline teacher using multiple AI assistants on the same course.
- **AI assistant:** Gemini (Antigravity)

## 2026-10-18: Add `RIV` (River Civilizations) vocabulary domain
- **Asked for:** "I want you to rewrite the 'Unit1: Ancient Greece' content and rebrand it as a 'TEST UNIT 1: Ancient Greece' because I want you to upload and format the Unit 1 (Ancient River Civilizations) content to take its place as unit 1 content."
- **Why:** To support Unit 1: Ancient River Civilizations vocabulary (`RIV-001`..`RIV-032`) in the interactive vocab app and inline pop-up glosses across Mesopotamia, Ancient Egypt, and Indus Valley materials.
- **Changed:**
  - `vocab/schema.yaml` — added `RIV` to `id_pattern` and `domains` (`RIV: [geography, mesopotamia, egypt, indus]`).
  - `vocab/config.js` — added `RIV` ("River Civilizations" / "早期河谷文明") and subdomain labels/translations (`mesopotamia`, `egypt`, `indus`).
- **Who it helps:** this course (and any world history Chalkline course covering Ancient River Valley Civilizations).
- **AI assistant:** Gemini (Antigravity)

## 2026-10-18: IB MYP Command Terms vocab topic, dedicated reference page, and instruction glossing
- **Asked for:** "Please add `/Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies/Curriculum Building` files as a key foundational reference for my chalkline, specifically 'Command Terms' should have their own vocab page on the Chalkline and should be defined similar to vocabulary on any instructions the students see."
- **Why:** To ground all curriculum materials in the IB MYP Individuals & Societies guide and Command Terms, give students a dedicated bilingual Command Terms reference page and interactive vocab cards, and provide inline `{{< vocab >}}` pop-up/print definitions for Command Terms in student-facing instructions across worksheets, slides, and summative booklets.
- **Changed:**
  - `vocab/schema.yaml` — added `CMD` to `id_pattern` and `domains` (`CMD: [knowing, investigating, communicating, thinking]`).
  - `vocab/config.js` — added `CMD` ("Command Terms" / "MYP 指令词"), Criterion A–D subdomain names/translations, and quick-reference links to the Command Terms page and official PDF.
  - `vocab/tools/draw_icons.py` — added 20 custom SVG icons (`CMD-001` to `CMD-020`) illustrating each MYP Command Term.
  - `_quarto.yml` — added `Command Terms 指令词` (`course/references/command-terms.qmd`) to the main sidebar navigation.
  - `CLAUDE.md` — documented the `course/references/curriculum-building/` PDFs as foundational references and added the rule to gloss MYP Command Terms in student instructions.
- **Who it helps:** every IB MYP Chalkline course (and any course that wants instructional command verbs glossed like content vocabulary).
- **AI assistant:** Gemini (Antigravity)

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