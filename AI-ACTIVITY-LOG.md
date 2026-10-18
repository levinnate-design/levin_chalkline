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


---

## Current Project Snapshot

- **Active Course Repo:** `/Users/nathaniellevin/chalkline-mingwan` *(Do NOT use `chalkline-sample`)*
- **GitHub Remote (`origin`):** `https://github.com/levinnate-design/levin_chalkline.git` (`main`)
- **WeDrive Source Folder:** `/Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies`
- **Units & Summatives Status:**
  - `course/units/01-ancient-river-civilizations/` — Built (Unit 1 Overview, Mesopotamia, Ancient Egypt, Indus Valley slides, textbooks, learning sheets, formatives, review matrix/slides, supplemental readings).
  - `course/summatives/02-unit-2-summative/` — Built (6-lesson Classical Mediterranean summative inquiry booklet & slides).
  - `course/references/command-terms.qmd` & `course/references/curriculum-building/` — Built & synced (20 IB MYP Command Terms `CMD-001`–`CMD-020` in `vocab.csv` + official MYP PDFs).
  - `course/units/91-test-unit-1-ancient-greece/` & `92-test-unit-2-ancient-rome/` — Archived sample units rebranded as Test Units 91 & 92.

---

## Activity Feed (Newest First)

<!-- AI_LOG_FEED_START -->

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
