# Shared AI Activity Log (`AI-ACTIVITY-LOG.md`)

This file is the **shared local memory and handoff log** across all AI assistants working on Nathan's curriculum (**Google Antigravity**, **Tencent WorkBuddy** accounts, **Claude**, **Cursor**, **Codex**, etc.).

**Canonical locations (kept in sync by `python scripts/ai_log.py`):**
1. **Chalkline Repo:** `/Users/nathaniellevin/chalkline-mingwan/AI-ACTIVITY-LOG.md`
2. **WeDrive Folder:** `/Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies/AI-ACTIVITY-LOG.md`

---

## Rules for Every AI Assistant

1. **Read First:** Before starting any task, read the top of this file (or run `python scripts/ai_log.py show`) so you know what other AI tools just finished or are currently editing.
2. **Claim Active Work (Optional for Multi-Step Tasks):** When starting a large task, log an `IN PROGRESS` entry so other AI sessions don't edit the same unit at the same time.
3. **Log Every Completed Task:** Whenever you finish creating, editing, syncing, or pushing files in either `chalkline-mingwan` or WeDrive, prepend an entry under **Activity Feed (Newest First)** below using:
   ```bash
   python /Users/nathaniellevin/chalkline-mingwan/scripts/ai_log.py add \
     --agent "<Your AI Name/Account, e.g. WorkBuddy-2 or Antigravity>" \
     --status "COMPLETED" \
     --task "<Short title of what you did>" \
     --files "<Comma-separated list of key files/folders touched>" \
     --notes "<1-3 bullets or sentences on what changed, pending items, or git commit status>"
   ```
   *(If you edit `AI-ACTIVITY-LOG.md` directly instead, run `python /Users/nathaniellevin/chalkline-mingwan/scripts/ai_log.py sync` afterward so the Chalkline and WeDrive copies stay identical.)*
4. **Never Delete Earlier Entries:** Always add new entries at the top of the **Activity Feed** section.
5. **Log All Deletions & Protect Non-Git Files:** If you delete or move files (in `chalkline-mingwan` or WeDrive), explicitly prefix them with `DELETED:` or `MOVED:` in `--files`. Never delete `AI-ACTIVITY-LOG.md`, `TOOL-CHANGES.md`, `CLAUDE.md`, `vocab/data/vocab.csv`, or foundational MYP PDFs. In WeDrive (which has no Git history), move retired drafts to an `_Archive/` folder unless Nathan explicitly asks for permanent deletion.
6. **Recursively Check for SOP Updates:** Before starting **every** new task (and before finishing any multi-step task), re-read `/Users/nathaniellevin/chalkline-mingwan/CLAUDE.md`, `AGENTS.md`, and `AI-ACTIVITY-LOG.md` from disk—never rely solely on an earlier read cached in your conversation context—so any SOP updates take effect immediately.


---

## Current Project Snapshot

- **Active Course Repo:** `/Users/nathaniellevin/chalkline-mingwan` *(Do NOT use `chalkline-sample`)*
- **GitHub Remote (`origin`):** `https://github.com/levinnate-design/levin_chalkline.git` (`main`)
- **WeDrive Source Folder:** `/Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies`
- **Units & Summatives Status:**
  - `course/units/01-ancient-river-civilizations/` — Built (Unit 1 Overview, Mesopotamia, Ancient Egypt, Indus Valley slides, textbooks, learning sheets, formatives, review matrix/slides, supplemental readings).
  - `course/units/02-classical-mediterranean/` — Built (Unit 2 Overview, 15-slide Classical Mediterranean master deck, Lesson 1 Greece reading packet + guided notes/ET1, Lesson 2 Rome reading packet + entry/exit tickets + guided notes/ET2, Lesson 3 cross-unit synthesis reading + comparative matrix & CER draft).
  - `course/summatives/02-unit-2-summative/` — Built (6-lesson Classical Mediterranean summative inquiry booklet & slides).
  - `course/references/command-terms.qmd` & `course/references/curriculum-building/` — Built & synced (20 IB MYP Command Terms `CMD-001`–`CMD-020` in `vocab.csv` + official MYP PDFs).
  - `course/units/91-test-unit-1-ancient-greece/` & `92-test-unit-2-ancient-rome/` — Archived sample units rebranded as Test Units 91 & 92.

---

## Activity Feed (Newest First)

<!-- AI_LOG_FEED_START -->

### [2026-10-19 08:06] COMPLETED — Summative: remove Toddle references and add Student Edition PDFs
- **AI Assistant:** WorkBuddy
- **Status:** COMPLETED
- **Files Touched:** course/summatives/02-unit-2-summative/student-summative-booklet.qmd, course/summatives/02-unit-2-summative/summative-slides.qmd, course/summatives/02-unit-2-summative/index.qmd, scripts/student_copies.py, _quarto.yml, TOOL-CHANGES.md
- **Notes:** Removed every Toddle mention from the Unit 2 summative booklet and slides (assessment table, lesson-6 checklist, rubric header, teacher pacing guide, slide notes) so printed booklets can't contradict the digital workflow later. New tool script scripts/student_copies.py (run from post-render) renders each printable that has teacher-only content again WITHOUT the teacher profile and writes it to the teacher site as <name>-student-edition.pdf: no TEACHER EDITION corner tab, no answer keys. Teacher site now has both editions side by side; the summative index page links them. Rebuilt the summative packet in both editions. Verified: 0 'Toddle' and 0 'teacher edition' in the Student Edition PDFs.
### [2026-10-19 08:04] COMPLETED — Summative: remove Toddle references and add Student Edition PDFs
- **AI Assistant:** WorkBuddy
- **Status:** COMPLETED
- **Files Touched:** course/summatives/02-unit-2-summative/student-summative-booklet.qmd, course/summatives/02-unit-2-summative/summative-slides.qmd, course/summatives/02-unit-2-summative/index.qmd, scripts/student_copies.py, _quarto.yml, TOOL-CHANGES.md
- **Notes:** Removed every Toddle mention from the Unit 2 summative booklet and slides (assessment table, lesson-6 checklist, rubric header, teacher pacing guide, slide notes) so printed booklets can't contradict the digital workflow later. New tool script scripts/student_copies.py (run from post-render) renders each printable that has teacher-only content again WITHOUT the teacher profile and writes it to the teacher site as <name>-student-edition.pdf: no TEACHER EDITION corner tab, no answer keys. Teacher site now has both editions side by side; the summative index page links them. Rebuilt the summative packet in both editions. Verified: 0 'Toddle' and 0 'teacher edition' in the Student Edition PDFs.
### [2026-10-19 07:37] COMPLETED — Draw vocab pictures for Units 1 and 2 (all 97 terms now illustrated)
- **AI Assistant:** WorkBuddy
- **Status:** COMPLETED
- **Files Touched:** vocab/tools/draw_icons.py, vocab/images/*.svg (52 new), vocab/data/vocab.csv, course/vocab/01-ancient-river-civilizations.yml, course/vocab/02-classical-mediterranean.yml, course/units/01-*/images/, course/units/02-classical-mediterranean/images/, TOOL-CHANGES.md
- **Notes:** Closed the picture gap: 52 new flat-style SVGs (RIV-001..036, GRC-014..019, ROM-013..020, ECO-001..002) plus 8 reusable helpers in draw_icons.py; every one of the 97 vocab rows now has an image column and validate.py reports 97 rows, 0 warnings. Re-ran import_vex_vocab.py for units 1 and 2 (images copied into both unit folders) and rebuilt both unit packets. Also fixed the 'missing fonts' warnings: root cause was three unsupported glyphs (PENCIL U+270E x12, LONG LEFT RIGHT ARROW U+27F7 x4, BLACK NIB U+2712 x1) reaching printable output and falling back to macOS .Keyboard/LastResort; swapped them for covered characters (none of the bundled fonts contains any pen or timer glyph, so those became words). All 13 rendered PDFs now embed zero OS fallback fonts. Note: draw_icons.py still writes its DIAGRAMS output to the stale course/units/02-ancient-rome/ folder - left for Nathan to decide.
### [2026-10-18 23:58] COMPLETED — Create technical growth report script and NotebookLM dossier
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** scripts/growth_report.py, docs/CHALKLINE-GROWTH-DOSSIER.md, TOOL-CHANGES.md
- **Notes:** Built scripts/growth_report.py to automatically inspect git history, diffs against clone commit b1a200e, vocab domains, and architectural modifications; generated docs/CHALKLINE-GROWTH-DOSSIER.md ready for NotebookLM ingestion.
### [2026-10-18 23:51] COMPLETED — Add recursive SOP check protocol across all AI instruction files
- **AI Assistant:** Antigravity
- **Status:** COMPLETED
- **Files Touched:** CLAUDE.md, AGENTS.md, GEMINI.md, AI-ACTIVITY-LOG.md, scripts/ai_log.py, TOOL-CHANGES.md
- **Notes:** Added Rule 6 requiring all AI assistants to recursively re-read CLAUDE.md and AI-ACTIVITY-LOG.md from disk before every new task and before handoff; updated scripts/ai_log.py show to print live CLAUDE.md last-modified timestamp.
### [2026-10-18 23:49] COMPLETED — Build Unit 2: Classical Mediterranean Foundations (Greece & Rome)
- **AI Assistant:** WorkBuddy
- **Status:** COMPLETED
- **Files Touched:** course/units/02-classical-mediterranean/*, course/vocab/02-classical-mediterranean.yml, vocab/data/vocab.csv, vocab/schema.yaml, vocab/config.js, TOOL-CHANGES.md
- **Notes:** Added a new unit folder course/units/02-classical-mediterranean with index.qmd, unit-2-overview.qmd (reference), classical-mediterranean-slides.qmd (15-slide revealjs master deck), greece-reading-packet.qmd, greece-guided-notes.qmd, rome-reading-packet.qmd, rome-entry-exit-tickets.qmd, rome-guided-notes.qmd, cross-unit-synthesis.qmd, unit-2-review-matrix.qmd. Content taken only from the three linked WeDrive sources (Unit 2 master student reading inquiry booklet, Classical Mediterranean master deck, Rome Entry:Exit Tickets) plus the existing Summative folder; other WeDrive files were unused reference material. Added 18 new vocab terms (GRC-014..019, ROM-013..020, RIV-033..036) and new subdomains society (GRC/ROM) and synthesis (RIV); vocab validate.py reports 97 rows, 0 warnings. Student site (_site) fully rendered including the 33-page unit packet. Teacher edition (_site-teacher) has all HTML pages but its PDFs/packet still need the launcher's full startup build.
### [2026-10-18 23:47] COMPLETED — Build Unit 2: Classical Mediterranean Foundations (Greece & Rome)
- **AI Assistant:** WorkBuddy
- **Status:** COMPLETED
- **Files Touched:** course/units/02-classical-mediterranean/*, course/vocab/02-classical-mediterranean.yml, vocab/data/vocab.csv, vocab/schema.yaml, vocab/config.js, TOOL-CHANGES.md
- **Notes:** Added a new unit folder course/units/02-classical-mediterranean with index.qmd, unit-2-overview.qmd (reference), classical-mediterranean-slides.qmd (15-slide revealjs master deck), greece-reading-packet.qmd, greece-guided-notes.qmd, rome-reading-packet.qmd, rome-entry-exit-tickets.qmd, rome-guided-notes.qmd, cross-unit-synthesis.qmd, unit-2-review-matrix.qmd. Content taken only from the three linked WeDrive sources (Unit 2 master student reading inquiry booklet, Classical Mediterranean master deck, Rome Entry:Exit Tickets) plus the existing Summative folder; other WeDrive files were unused reference material. Added 18 new vocab terms (GRC-014..019, ROM-013..020, RIV-033..036) and new subdomains society (GRC/ROM) and synthesis (RIV); vocab validate.py reports 97 rows, 0 warnings. Student site (_site) fully rendered including the 33-page unit packet. Teacher edition (_site-teacher) has all HTML pages but its PDFs/packet still need the launcher's full startup build.
### [2026-10-18 22:27] COMPLETED — Make .venv standalone in chalkline-mingwan and commit Git safety checkpoint
- **AI Assistant:** Antigravity
- **Status:** COMPLETED
- **Files Touched:** .gitignore, CLAUDE.md, AI-ACTIVITY-LOG.md, course/units/01-ancient-river-civilizations/*, course/references/*
- **Notes:** Replaced symlinked .venv with a standalone virtual environment in chalkline-mingwan, added safe deletion rules for WorkBuddy, and committed full Git checkpoint.
### [2026-10-18 21:55] COMPLETED — Shared AI Activity Log & Multi-Agent WorkBuddy Workflow Setup
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** `AI-ACTIVITY-LOG.md`, `scripts/ai_log.py`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `TOOL-CHANGES.md`
- **Notes:** Created shared local activity log (`AI-ACTIVITY-LOG.md`) and sync/logging CLI (`scripts/ai_log.py`) mirroring between `/Users/nathaniellevin/chalkline-mingwan` and WeDrive (`Social Studies/AI-ACTIVITY-LOG.md`). Updated `CLAUDE.md`, `AGENTS.md`, and `GEMINI.md` so all WorkBuddy accounts and Antigravity subagents read and update this log on every task.

### [2026-10-18 20:53] COMPLETED — Build Unit 1: Ancient River Civilizations & Rebrand Sample Units as Test Units 91/92
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED (Uncommitted in `chalkline-mingwan` working tree — ready to commit/push)
- **Files Touched:** `course/units/01-ancient-river-civilizations/*`, `course/units/91-test-unit-1-ancient-greece/*`, `course/units/92-test-unit-2-ancient-rome/*`, `vocab/data/vocab.csv`, `vocab/schema.yaml`, `vocab/config.js`
- **Notes:** Moved sample Greece/Rome units to `91-test-unit-1-ancient-greece` and `92-test-unit-2-ancient-rome`. Created full `01-ancient-river-civilizations` unit (Mesopotamia, Egypt, Indus textbooks, slides, learning sheets, formatives, review matrix/slides) and added `RIV-001`–`RIV-032` vocabulary.

### [2026-10-18 20:25] COMPLETED — IB MYP Command Terms Reference Page, Vocab Icons (`CMD-001`–`CMD-020`), and Curriculum Building Sync
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** `course/references/command-terms.qmd`, `course/references/curriculum-building/*`, `vocab/data/vocab.csv`, `vocab/tools/draw_icons.py`, `_quarto.yml`
- **Notes:** Synced IB MYP Guide & Command Terms PDFs from WeDrive `Curriculum Building/`. Added all 20 MYP Command Terms (`CMD-001`–`CMD-020`) with custom SVG icons and glossed Command Terms across student-facing instructions.

### [2026-10-18 20:21] COMPLETED — Unit 2 Summative Booklet & Slides, Draggable Clock/Timer, and Student GitHub Pages Workflow
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED (Committed & pushed in `d5ab501`)
- **Files Touched:** `course/summatives/02-unit-2-summative/*`, `_extensions/classroom/clock.html`, `_extensions/classroom/countdown.html`, `brand/revealjs.scss`, `.github/workflows/publish.yml`
- **Notes:** Added Unit 2 Summative booklet and slides, draggable `F` timer overlay and clock, vertical `.subslide` support, and configured GitHub Pages to publish the student site (`_site`).
