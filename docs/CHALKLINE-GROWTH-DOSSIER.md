# Technical Dossier: The Architecture & Evolution of Chalkline Mingwan
**Source Repository:** `chalkline-mingwan` (Origin: `https://github.com/levinnate-design/levin_chalkline.git`)  
**Upstream Ancestor:** `insufficient doubt/chalkline-sample` (Cloned at commit `b1a200e`)  
**Generated Date:** 2026-10-18 23:58:39  
**Document Purpose:** In-depth technical architecture breakdown and git evolution report for personal learning and Google NotebookLM analysis.

---

## 1. Executive Summary & TL;DR

### What is Chalkline?
Chalkline is an open-source, opinionated curriculum-as-code publishing engine designed by John ("insufficient doubt"). It combines **Quarto**, **Pandoc**, **Typst**, and **Reveal.js** to turn plain Markdown (`.qmd`) into:
1. **Interactive reveal.js slide decks** with embedded classroom timers, clocks, SVG animations, and hover/click vocabulary tooltips.
2. **Typeset classroom printables (PDFs)** rendered through Typst (reading packets, student worksheets, exit tickets, multi-page unit booklets, and full-year course compendiums).
3. **Dual-profile static web application** separating public student content (`_site/`) from private teacher master copies containing rubrics, answer keys, and pedagogical look-fors (`_site-teacher/`).
4. **Client-side bilingual vocabulary platform** with spaced-repetition flashcards, text-to-speech audio, and strict schema validation.

### How has `chalkline-mingwan` grown since the clone?
When cloned from the template `chalkline-sample` at commit `b1a200e`, the repo contained a basic tour deck, 2 sample history units (Greece and Rome), and a 25-word bilingual vocabulary set.

Since the fork, `chalkline-mingwan` has evolved along four technical dimensions:
- **Core Engine Extensions**: Introduced a dedicated `course/summatives/` catalog hierarchy (`scripts/catalog.py`), global keyboard-triggered draggable classroom timers (`F` overlay), draggable persistent clock UI, vertical sub-slide drill-downs, and a live GitHub Pages CI/CD workflow delivering the student-only profile.
- **IB MYP Grounding & Command Terms Engine**: Embedded all 20 official IB MYP Individuals & Societies Command Terms (`CMD-001` to `CMD-020`) into the vocabulary schema, created custom SVG vector diagrams for each term (`vocab/tools/draw_icons.py`), and established a mandatory instructional glossing standard across all student materials.
- **Complete Curricular Buildout**: Rebranded sample units as Test Units 91/92; authored full units for **Unit 1: Ancient River Civilizations** (Mesopotamia, Egypt, Indus) and **Unit 2: Classical Mediterranean Foundations** (Greece, Rome, cross-unit synthesis, and a 6-lesson summative inquiry portfolio).
- **Multi-Agent Orchestration Protocol**: Built a cross-platform synchronization layer (`scripts/ai_log.py`, `AI-ACTIVITY-LOG.md`) linking local Git development with Tencent WeDrive cloud storage, enabling concurrent collaboration between Google Antigravity, Tencent WorkBuddy, Claude, and human edits without merge conflicts or state desynchronization.

---

## 2. Growth Metrics at a Glance

| Metric Dimension | Upstream `chalkline-sample` (b1a200e) | `chalkline-mingwan` (HEAD) | Growth Delta |
| :--- | :--- | :--- | :--- |
| **Git Commits (Fork to HEAD)** | 18 template commits | 21+ total commits | +3 major architectural/unit commits |
| **Active Vocab Terms** | 25 terms (GRC, ROM) | 97 validated terms | +72 terms (+288.0%) |
| **Vocab Domains** | 2 (`GRC`, `ROM`) | 5 (`GRC`, `ROM`, `ECO`, `RIV`, `CMD`) | +3 domains (Economics, River Civs, IB Command Terms) |
| **Curricular Units** | 2 sample units | 2 production units + 1 summative section + 2 test units | Full River Civs, Classical Med, & Summative booklets |
| **Total `.qmd` Source Files** | ~14 files | 45 files | {'references': 1, 'summatives': 3, 'units': 41} |
| **Git Diff Footprint** | Baseline |  182 files changed, 7486 insertions(+), 161 deletions(-) | ~7,500+ insertions |
| **Deployment Targets** | Local preview only | Live Student GitHub Pages + Local Teacher Preview | Automated multi-profile GitHub Actions |

---

## 3. Deep-Dive: Core Technical Architecture of Chalkline

### 3.1 The Quarto Multi-Format Pipeline
Chalkline uses **Quarto** (`_quarto.yml`) as its master compiler. A single source Markdown file (`.qmd`) compiles into two distinct output formats without duplicate content authoring:
- **Reveal.js HTML Presentations**: Rendered via Pandoc to HTML5 reveal.js presentations, incorporating custom CSS (`brand/revealjs.scss`) and custom Lua filter extensions (`_extensions/classroom/`).
- **Typst PDF Printables**: Rendered via Typst into PDF documents with precise typography, CMYK/RGB print boundaries, cut lines, student name headers, and pagination.

```
                      ┌───> [Pandoc + Reveal.js] ───> Interactive Slides (.html)
                      │
source-lesson.qmd ────┼───> [Pandoc + Typst]     ───> Student Handout (.pdf)
                      │
                      └───> [Quarto Profiles]    ───> Teacher Master / Student Site
```

### 3.2 Dual-Profile Visibility Engine
Chalkline uses Quarto profiles (`default` student vs `teacher`):
- Student edition: `quarto render` generates `_site/`.
- Teacher edition: `quarto render --profile teacher` generates `_site-teacher/`.
- **Conditional Directives**: Blocks marked with `::: {.content-visible when-profile="teacher"}` contain answer keys, sample student answers, scoring criteria, and pacing notes. When compiled for students or deployed to GitHub Pages, Pandoc's AST completely elides these nodes.

### 3.3 Custom Lua Filter Extensions (`_extensions/classroom/`)
Rather than relying on generic Quarto plugins, Chalkline uses bespoke Lua filters executed during Pandoc parsing:
- **`shortcodes.lua`**: Evaluates custom syntax such as `{{< vocab "term-id" >}}`, replacing it with an interactive HTML span linked to vocabulary definitions and audio clips, or typst bilingual annotations for print.
- **`filter.lua`**: Injects global classroom features (floating draggable timer, digital clock, draw.io dynamic diagrams) into every slide deck.

### 3.4 Spaced-Repetition Bilingual Vocabulary System
The vocabulary engine (`vocab/`) is a decoupled web application and database:
- **Single Source of Truth (`vocab/data/vocab.csv`)**: Holds immutable term IDs (`DOM-###`), English headwords, simplified Chinese translations (`zh`), CEFR levels, pronunciation audio links, example sentences, and confusion matrices (`confused_with`).
- **Validation Engine (`vocab/validate.py`)**: Runs strict lint checks against `vocab/schema.yaml` (enforcing max 75-character `short_def`, valid domain names, non-empty Chinese translations, and valid image paths).
- **Client-Side SPA (`vocab/app/`)**: Built in lightweight vanilla JavaScript utilizing HTML5 Web Audio synthesis, LocalStorage spaced-repetition scoring, and interactive flashcard/matching mechanics.

---

## 4. Architectural Innovations Added in `chalkline-mingwan`

### 4.1 Dedicated Summative Assessment Directory Hierarchy
- **Problem in Upstream:** `chalkline-sample` only recognized `course/units/`. Summatives had to be shoehorned into regular weekly unit folders.
- **Solution:** Modified `scripts/catalog.py`, `_quarto.yml`, and `_extensions/classroom/shortcodes.lua` to define `SECTION_DIRS = ("units", "summatives")`.
- **Result:** Enabled top-level `course/summatives/` supporting multi-week inquiry projects (such as `course/summatives/02-unit-2-summative/`) with dedicated booklet compilation and automated packet aggregation.

### 4.2 Real-Time Classroom Reveal.js UI Upgrades
- **Draggable Pointer-Event Overlays**: Replaced static corner clocks and inline timers with pointer-event listeners in `_extensions/classroom/clock.html` and `countdown.html`. Teachers on smartboards can touch and drag the timer or clock anywhere on screen. Positions are stored in browser `localStorage`.
- **Global `F` Timer Overlay**: Bound the `F` key across all decks. Hitting `F` toggles a floating countdown timer overlay with presets (1m, 3m, 5m, 10m, 15m) that minimizes to a non-intrusive pill when running.
- **Vertical Sub-slides (`setupVerticalSubslides`)**: Added hierarchical slide drill-downs. Any slide tagged with `{.subslide}` is dynamically positioned *underneath* the preceding overview slide. Pressing `Down` enters deeper technical analysis; pressing `Right` advances to the next major topic.

### 4.3 Student GitHub Pages CI/CD Workflow
- **Upstream Default:** Pushed `_site-teacher` to GitHub Pages, which exposed private teacher notes and answer keys to the public internet.
- **Mingwan Configuration:** Rewrote `.github/workflows/publish.yml` to trigger on every push to `main`, rendering the pure student profile (`quarto render`) into `_site` and serving it at `https://levinnate-design.github.io/levin_chalkline/`.

### 4.4 IB MYP Command Terms Engine
- Added domain `CMD` (`CMD-001` through `CMD-020`) encompassing all official International Baccalaureate Middle Years Programme Individuals & Societies command terms (e.g., *Analyze, Discuss, Evaluate, Synthesize, Formulate*).
- Developed `vocab/tools/draw_icons.py` using pure Python SVG generation to create 20 custom visual vector glyphs representing cognitive operations.
- Created `course/references/command-terms.qmd` as a live interactive reference page.
- Established an authoring protocol where every student task directive must be glossed with `{{< vocab "analyze" >}}`.

### 4.5 Multi-Agent Cross-Platform Orchestration (`ai_log.py`)
- Created `scripts/ai_log.py` and `AI-ACTIVITY-LOG.md` to solve multi-assistant race conditions.
- Integrates Google Antigravity, Tencent WorkBuddy (WeChat Work), and local IDE agents by keeping a real-time activity feed synchronized between local Git and Tencent WeDrive.
- Implemented a mandatory **Recursive SOP Check Protocol**: AI assistants verify the live file modification timestamp of `CLAUDE.md` before executing tasks, preventing stale prompt context from causing regression.

---

## 5. Vocabulary Subsystem Breakdown

### Current Active Domains & Term Counts:
- **`CMD` (20 terms)**: communicating: 1, investigating: 5, knowing: 8, thinking: 6
- **`ECO` (2 terms)**: systems: 2
- **`GRC` (19 terms)**: culture: 7, geography: 2, government: 7, society: 3
- **`RIV` (36 terms)**: egypt: 11, geography: 9, indus: 7, mesopotamia: 8, synthesis: 1
- **`ROM` (20 terms)**: army: 1, daily-life: 4, engineering: 2, government: 11, society: 2

**Total Vocabulary Size:** 97 terms (compared to 25 terms in initial upstream clone).

---

## 6. Curricular Unit Matrix

| Directory | Title | Core Pedagogical Artifacts |
| :--- | :--- | :--- |
| `course/units/01-ancient-river-civilizations/` | Unit 1: Ancient River Civilizations | Mesopotamia, Egypt, Indus Valley textbooks, 15+ slide decks, guided learning sheets, formative quizzes, review matrix, and supplemental reading compendiums. |
| `course/units/02-classical-mediterranean/` | Unit 2: Classical Mediterranean Foundations | 15-slide Reveal.js master deck, Greece & Rome reading inquiry packets, entry/exit tickets, guided notes, and cross-unit comparative matrix (CER synthesis). |
| `course/summatives/02-unit-2-summative/` | Unit 2 Summative Inquiry | 6-lesson cumulative summative project, student investigation booklet, inquiry presentation decks, and IB MYP Criterion A–D rubrics. |
| `course/references/` | Foundational Curriculum & Terms | IB MYP Individuals & Societies Subject Guide, official Command Terms PDF, and interactive bilingual command term directory (`command-terms.qmd`). |
| `course/units/91-test-unit-1-ancient-greece/` | Test Unit 91 (Archived Sample) | Original upstream sample unit preserved for regression testing and slide feature demonstrations. |
| `course/units/92-test-unit-2-ancient-rome/` | Test Unit 92 (Archived Sample) | Original upstream sample unit preserved for draw.io live diagram and typographic tests. |

---

## 7. Tool Changes Changelog (`TOOL-CHANGES.md` Record)

The following architectural modifications were formally registered in `TOOL-CHANGES.md`:

### 2026-10-18: Technical growth report generator (`scripts/growth_report.py`)
- **Asked for:** "Create a script that can be used in Gemini to create a technical description of how my chalkline has grown since it was first cloned from insufficient doubt's chalkline-sample. I will copy and paste this into a notebooklm for my personal learning purposes."
- **Why:** To automatically analyze Git commits, diff statistics, Quarto/Typst/Reveal architecture, vocabulary expansion, and multi-agent workflows since the fork, generating an in-depth technical dossier formatted for ingestion into Google NotebookLM.
- **Changed:**
  - `scripts/growth_report.py` — created script to inspect git history, diffs against clone commit `b1a200e`, parse vocabulary domains, analyze `TOOL-CHANGES.md`, and generate a structured NotebookLM Markdown dossier (`docs/CHALKLINE-GROWTH-DOSSIER.md`).
- **Who it helps:** any Chalkline teacher or developer wanting to track how their custom course fork diverges from upstream or export an architectural summary for NotebookLM/LLM analysis.
- **AI assistant:** Gemini (Antigravity)

### 2026-10-18: Recursive SOP check protocol & live SOP timestamp in `scripts/ai_log.py`
- **Asked for:** "Add a line in the agentic protocols so that they recursively check for updates to their SOP"
- **Why:** So long-running AI sessions (WorkBuddy, Antigravity, etc.) never rely on a stale in-context copy of `CLAUDE.md` and automatically detect and adopt SOP updates before starting or finishing any task.
- **Changed:**
  - `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `AI-ACTIVITY-LOG.md` — added recursive SOP check rule requiring agents to re-read `CLAUDE.md` and `AI-ACTIVITY-LOG.md` from disk on every new task and before handoff.
  - `scripts/ai_log.py` — updated `show` to print a `[SOP Check]` banner displaying the exact last-modified timestamp of `CLAUDE.md`.
- **Who it helps:** any course coordinated by multiple long-running AI sessions.
- **AI assistant:** Gemini (Antigravity)

### 2026-10-18: Unit 2 vocab subdomains `society` and `synthesis`
- **Asked for:** "Update chalkline with Unit 2 materials" — Unit 2: Classical Mediterranean Foundations (Ancient Greece & Rome), built from the Unit 2 reading inquiry booklet, the Classical Mediterranean master deck, and the Rome entry/exit tickets.
- **Why:** Unit 2's vocabulary vaults cover **social structure and forced labour** (helots, metics, latifundia, chattel slavery, corvée labour) and **cross-unit comparison** (continuity), none of which the existing `GRC` / `ROM` / `RIV` subdomains described.
- **Changed:**
  - `vocab/schema.yaml` — `domains`: `GRC` adds `society`, `ROM` adds `society`, `RIV` adds `synthesis`.
  - `vocab/config.js` — `subdomainZh`: added `society: "社会与劳动"` and `synthesis: "跨单元综合"` so the vocab app labels the new cards in 中文.
  - `vocab/data/vocab.csv` — 18 new Unit 2 terms: `GRC-014`–`GRC-019`, `ROM-013`–`ROM-020`, `RIV-033`–`RIV-036`.
  - `course/units/02-classical-mediterranean/` — new unit folder (index + overview + 3-lesson reading packets, guided notes, entry/exit tickets) and `course/vocab/02-classical-mediterranean.yml` (29 terms).
- **Who it helps:** any course whose unit vocabulary includes social structure, coerced labour, or cross-unit synthesis — probably most history and social-science courses.
- **AI assistant:** WorkBuddy

### 2026-10-18: Shared local AI Activity Log (`AI-ACTIVITY-LOG.md` & `scripts/ai_log.py`) for multi-agent sync
- **Asked for:** "I want you include a new Workbuddy account into the chalkline work flow, create something that I can copy and paste into workbuddy to get it set up." / "Create a set up such that the various AI tools have a log on my local storage that they upload to so that all my AI platforms can be up to date with what each of them have been doing."
- **Why:** So multiple AI assistants and accounts (Antigravity subagents, Tencent WorkBuddy accounts, Claude, etc.) working across `chalkline-mingwan` and WeDrive can see what each platform has done or is currently working on without stepping on each other.
- **Changed:**
  - `AI-ACTIVITY-LOG.md` — created shared local activity feed and project snapshot in `chalkline-mingwan` (and mirrored to WeDrive `Social Studies/AI-ACTIVITY-LOG.md`).
  - `scripts/ai_log.py` — added CLI tool (`show`, `add`, `sync`) to read, prepend timestamped activity entries, and automatically mirror `AI-ACTIVITY-LOG.md` between `chalkline-mingwan` and WeDrive.
  - `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` — added canonical paths (`chalkline-mingwan` + WeDrive), GitHub remote, and required `AI-ACTIVITY-LOG.md` read/write rules for all AI assistants.
- **Who it helps:** this course, and any Chalkline teacher using multiple AI assistants on the same course.
- **AI assistant:** Gemini (Antigravity)

### 2026-10-18: Add `RIV` (River Civilizations) vocabulary domain
- **Asked for:** "I want you to rewrite the 'Unit1: Ancient Greece' content and rebrand it as a 'TEST UNIT 1: Ancient Greece' because I want you to upload and format the Unit 1 (Ancient River Civilizations) content to take its place as unit 1 content."
- **Why:** To support Unit 1: Ancient River Civilizations vocabulary (`RIV-001`..`RIV-032`) in the interactive vocab app and inline pop-up glosses across Mesopotamia, Ancient Egypt, and Indus Valley materials.
- **Changed:**
  - `vocab/schema.yaml` — added `RIV` to `id_pattern` and `domains` (`RIV: [geography, mesopotamia, egypt, indus]`).
  - `vocab/config.js` — added `RIV` ("River Civilizations" / "早期河谷文明") and subdomain labels/translations (`mesopotamia`, `egypt`, `indus`).
- **Who it helps:** this course (and any world history Chalkline course covering Ancient River Valley Civilizations).
- **AI assistant:** Gemini (Antigravity)

### 2026-10-18: IB MYP Command Terms vocab topic, dedicated reference page, and instruction glossing
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

### 2026-10-18: Publish student site (`_site`) to GitHub Pages
- **Asked for:** "create a website link for my chalkline" -> selected "Publish online to GitHub Pages (`https://levinnate-design.github.io/levin_chalkline/`)" and "Student version (`_site/`, without answer keys and teacher notes) so you can share the public URL directly with students".
- **Why:** GitHub Pages is public, so a real course's public website link should serve the student edition without answer keys or teacher-only notes.
- **Changed:**
  - `.github/workflows/publish.yml` — changed `quarto render --profile teacher` / `path: _site-teacher` to `quarto render` / `path: _site`.
- **Who it helps:** every Chalkline course publishing a live student-facing site on GitHub Pages.
- **AI assistant:** Gemini (Antigravity)

### 2026-10-18: Draggable clock & timer overlay, dark-slide text contrast, and vertical `.subslide` drill-downs
- **Asked for:** "1. Can the time be a draggable element that I can reposition on the screen? 2. Some text, such as the Chinese text in the title for Week x Lesson x slides, is the same color as the background, double check to make sure all text is sufficiently contrasted with the layer its directly on. 3. Lesson 1 Step 1.1 has a lot of text and not all of it is being shown, in events like this, can there be an overview slide, then more detailed slides that I could access by pressing down (instead of right to proceed to the next slide), allowing for more depth on a topic, before proceeding?"
- **Why:** To let teachers freely reposition the clock and timer anywhere on the board without blocking slide content, make bold/Chinese text visible on dark navy section slides (`{background-color="#003477"}`), and allow overview slides to have optional vertical drill-down slides underneath them.
- **Changed:**
  - `_extensions/classroom/clock.html` — made `#slide-clock` draggable via pointer events and persisted its position in `localStorage`.
  - `_extensions/classroom/countdown.html` — made both the `F` Classroom Timer overlay (`#cd-overlay`) and the minimized timer pill (`#cd-mini`) freely draggable without a full-screen backdrop blocking the slide; added `setupVerticalSubslides()` so any slide marked `{.subslide}` nests vertically under the preceding overview slide (press `Down` for details or `Right` to skip to the next topic).
  - `brand/revealjs.scss` — added high-contrast text rules for `section.has-dark-background` and `section.section-slide` (`#fff` for headings/text, `$orange` for `strong`, `$turquoise` for `.zh`/links, while keeping dark text inside light callouts/cards).
- **Who it helps:** probably every Chalkline course.
- **AI assistant:** Gemini (Antigravity)

### 2026-10-18: Press `F` timer overlay on any slide & compact inline timer layout
- **Asked for:** "Some pages in the slideshow are cut off, the timers numbers are shown, but the UI (start, reset, +1) is hidden and I can't scroll to see it. Alternatively it would also be helpful I could create a timer overlay on any slide by hitting 'F'. Which isn't set up on my chalkline."
- **Why:** When an inline `{{< timer >}}` is placed below bullets or callouts on a slide, the 3.6em font size pushed the Start/Reset/+1 min buttons off the bottom of the 700px slide frame. Additionally, teachers want to pop up a countdown timer on any slide on the fly by pressing `F`.
- **Changed:**
  - `_extensions/classroom/countdown.html` — added a floating Classroom Timer overlay toggled by pressing `F` on any slide (with `1m`–`30m` presets, `−1 min` / `+1 min`, `Start/Pause`, `Reset`, and automatic minimizing to the `#cd-mini` pill at the bottom of the screen while running); also styled `.countdown:not(:first-child)` more compactly so inline timers placed below slide text never clip their control buttons.
  - `_extensions/classroom/filter.lua` — included `countdown.html` on every `revealjs` slide deck so pressing `F` works on any slide in any deck even without an inline `{{< timer >}}` shortcode.
- **Who it helps:** probably every Chalkline course.
- **AI assistant:** Gemini (Antigravity)

### 2026-10-18: Support dedicated `course/summatives/` directory tree
- **Asked for:** "I am concerned about the file tree naming given that I will add more summatives to the course moving forward, there should be a sub file tree within a 'SUMMATIVES' directory for a 'Unit 2 - Summative'".
- **Why:** To keep multi-week summative assessments organized in their own top-level `Summatives` sidebar section (`course/summatives/<summative-folder>/`) separate from regular instructional units as more summatives are added over the year.
- **Changed:**
  - `_quarto.yml` — added `- auto: course/summatives` to the sidebar navigation below `course/units`.
  - `scripts/catalog.py` — updated `load_units()`, `load_packets()`, `load_catalog()`, and `parent_drafts()` to scan both `course/units/` and `course/summatives/` (`SECTION_DIRS = ("units", "summatives")`).
  - `_extensions/classroom/shortcodes.lua` — updated `packet_for_this_page()` so `{{< packet >}}` works on `course/summatives/<folder>/index.qmd` pages as well as `course/units/<folder>/index.qmd`.
- **Who it helps:** probably every Chalkline course that wants a separate `Summatives` section with per-summative packets and overview groupings.
- **AI assistant:** Gemini (Antigravity)

### 2026-10-15: New "Economics" vocab topic (capitalism, communism)
- **Asked for:** "download the vocab csv but add 'capitalism' and 'communism'".
- **Why:** both words are modern economic systems, so they fit neither Ancient Greece nor Ancient Rome. Asked which way to go; the teacher chose to give them their own topic rather than squeeze them into an existing one.
- **Changed:**
  - `vocab/schema.yaml` — vocab `id_pattern` now allows `ECO` as well as `GRC`/`ROM`; added the domain `ECO: [systems]`.
  - `vocab/config.js` — added `ECO` to `domainNames` ("Economics") and `domainZh` (经济学); added `systems` → 制度 to `subdomainZh`.
  - `vocab/data/vocab.csv` — two content rows: `ECO-001` capitalism, `ECO-002` communism, each cross-linked to the other via `confused_with`. No `image` yet, so the app shows "no image" for these two.
- **Who it helps:** the pattern (a domain that isn't one of the two history units) is probably useful to every Chalkline course; the `ECO` domain itself is this course only.
- **AI assistant:** WorkBuddy

---

## 8. NotebookLM Study Prompts & Discussion Starters

When importing this dossier into Google NotebookLM, try using the following prompts to explore the architecture and educational design of your system:

1. **System Architecture Synthesis**:
   > *"Based on this dossier, explain how Chalkline combines Quarto, Typst, Reveal.js, and Lua filters to eliminate the need for teachers to maintain separate slide decks, printouts, and website materials."*

2. **Pedagogical Evaluation**:
   > *"How does the integration of IB MYP Command Terms (CMD-001 through CMD-020) and the vocabulary glossing engine support middle-school English Language Learners (ELLs) in Social Studies?"*

3. **Software Engineering & Multi-Agent Collaboration**:
   > *"Analyze the multi-agent coordination protocol implemented in `scripts/ai_log.py` and `AI-ACTIVITY-LOG.md`. How does it resolve the challenge of coordinating multiple asynchronous AI assistants (e.g., Antigravity, WorkBuddy) across Git and cloud drives (WeDrive)?"*

4. **Curricular Growth Analysis**:
   > *"Contrast the original template structure from insufficient doubt with the current `chalkline-mingwan` repository. What were the key architectural shifts required to transform a generic sample course into an IB MYP-aligned middle school curriculum?"*
