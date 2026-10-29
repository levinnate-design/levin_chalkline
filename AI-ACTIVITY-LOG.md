# Shared AI Activity Log (`AI-ACTIVITY-LOG.md`)

This file is the **shared local memory and handoff log** across all AI assistants working on Nate & Xinyi's curriculum (**Google Antigravity**, **Tencent WorkBuddy** accounts, **Claude**, **Cursor**, **Codex**, etc.).

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
5. **Log All Deletions & Protect Non-Git Files:** If you delete or move files (in `chalkline-mingwan` or WeDrive), explicitly prefix them with `DELETED:` or `MOVED:` in `--files`. Never delete `AI-ACTIVITY-LOG.md`, `TOOL-CHANGES.md`, `CLAUDE.md`, `vocab/data/vocab.csv`, or foundational MYP PDFs. In WeDrive (which has no Git history), move retired drafts to an `_Archive/` folder unless Nate or Xinyi explicitly asks for permanent deletion.
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

### [2026-10-29 10:04] COMPLETED — Enable Classroom Toolbox, Packet/Vocab sidebars, and Play at Home on live site
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** _extensions/classroom/filter.lua, _extensions/classroom/toolbox/tools/packet.js, course/play.qmd, _quarto-student.yml, TOOL-CHANGES.md, AI-ACTIVITY-LOG.md
- **Notes:** Enabled Classroom Toolbox (W menu: Stopwatch, Clock K, Voice Level & Noise Meter, Traffic Light, Spotlight, Name Picker, Groups, Scoreboard, QR Code, Music, Dice, Slide Size), Packet overlay sidebar (P), Vocab sidebar (V), and Play at Home review games on the live student site while keeping answer keys and speaker notes restricted to the local Teacher build.
### [2026-10-29 09:41] COMPLETED — Verify repository status and live Chalkline site deployment
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** AI-ACTIVITY-LOG.md
- **Notes:** Checked git status on origin/main (up to date at 0157d77). Verified GitHub Actions Publish student site workflow completed successfully (run 40245716973) and live site at https://levinnate-design.github.io/levin_chalkline/ is responding with 200 OK and serving the latest build.
### [2026-10-26 07:38] COMPLETED — Import upstream Chalkline tool features and update Teachers Only Start Here without sample units
- **AI Assistant:** Antigravity
- **Status:** COMPLETED
- **Files Touched:** _extensions/classroom/, _extensions/pdf-viewer/, brand/, scripts/catalog.py, scripts/packets.py, scripts/vocab_terms.py, scripts/student_site.py, _quarto.yml, _quarto-teacher.yml, _quarto-student.yml, index.qmd, families.qmd, course/review-games.qmd, course/play.qmd, course/teacher/start-here/slides.qmd, course/teacher/test-units/*, TOOL-CHANGES.md, DELETED: _extensions/classroom/clock.html, DELETED: _quarto-parent.yml, DELETED: scripts/parent_site.py, DELETED: course/teacher/test-units/91-test-unit-1-ancient-greece/match/*
- **Notes:** Imported all upstream Chalkline tool features (Classroom Toolbox W menu, V/P slide sidebars, Review Games/Word Blitz/Jeopardy/Snowman/Bingo, Learning Activities, Slide PDF Viewer with touch-pen annotation, Card Overview, For Families page) while preserving Mingwan Social Studies curriculum, summatives, and IB MYP references. Updated Teachers Only Start Here (course/teacher/start-here/slides.qmd) and test-unit demo decks without importing Gobekli Tepe or STEM/Robot Lifts. Verified renders with zero errors.
### [2026-10-26 07:25] IN PROGRESS — Import upstream Chalkline tool features and update Teachers Only Start Here without sample units
- **AI Assistant:** Antigravity
- **Status:** IN PROGRESS
- **Files Touched:** _extensions/, brand/, scripts/, _quarto*.yml, index.qmd, course/teacher/start-here/, TOOL-CHANGES.md
- **Notes:** Fetching upstream/main from project-chalkline, importing new tool features (Classroom Toolbox, Slide Sidebars, Review Games/Word Blitz/Jeopardy, Learning Activities, PDF Viewer, Card Overview) and updating course/teacher/start-here/ while excluding Gobekli Tepe and STEM sample units.
### [2026-10-22 08:43] COMPLETED — Reformat AI prompt guide into copy-and-paste non-coder prompts
- **AI Assistant:** Antigravity
- **Status:** COMPLETED
- **Files Touched:** course/teacher/ai-prompts.qmd
- **Notes:** Reformatted all prompts in course/teacher/ai-prompts.qmd into clean, one-click copyable prompts written in natural teacher language without code syntax or technical paths; synced across chalkline-mingwan and chalkline-g6.
### [2026-10-22 08:39] COMPLETED — Fix YAML frontmatter delimiter formatting in index.qmd files
- **AI Assistant:** Antigravity
- **Status:** COMPLETED
- **Files Touched:** course/teacher/start-here/index.qmd, course/teacher/test-units/91-test-unit-1-ancient-greece/index.qmd, course/teacher/test-units/92-test-unit-2-ancient-rome/index.qmd
- **Notes:** Fixed missing newline after opening --- delimiter in moved teacher index.qmd files across chalkline-mingwan and chalkline-g6, resolving Quarto render error.
### [2026-10-22 08:31] COMPLETED — Update teacher names to Nate & Xinyi, add AI Prompt Guide, move TEST units to Teachers Only
- **AI Assistant:** Antigravity
- **Status:** COMPLETED
- **Files Touched:** CLAUDE.md, AGENTS.md, GEMINI.md, AI-ACTIVITY-LOG.md, _quarto.yml, _quarto-teacher.yml, course/links.yml, course/teacher/*, TOOL-CHANGES.md
- **Notes:** Standardized teacher names to Nate and Xinyi; created course/teacher/ai-prompts.qmd; moved 91, 92, and 00-start-here out of course/units/ into course/teacher/; rebranded site to Mingwan School · Social Studies; mirrored updates to chalkline-g6.
### [2026-10-22 08:10] COMPLETED — Add Co-Teacher Onboarding page to Teacher Portal & initialize Grade 6 repo
- **AI Assistant:** Antigravity
- **Status:** COMPLETED
- **Files Touched:** course/teacher/co-teacher-onboarding.qmd, _quarto-teacher.yml, TOOL-CHANGES.md, /Users/nathaniellevin/chalkline-g6/*
- **Notes:** Added Co-Teacher Onboarding under Teachers Only section in _quarto-teacher.yml; created independent chalkline-g6 repository emphasizing IB MYP Year 1 strand rubrics and scaffolding.
### [2026-10-20 11:37] COMPLETED — Create MYP Individuals and Societies Assessment Criteria page
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** course/references/assessment-criteria.qmd, course/references/command-terms.qmd, _quarto.yml, TOOL-CHANGES.md
- **Notes:** Created official IB MYP Individuals & Societies Year 3 Assessment Criteria reference page covering Criteria A, B, C, and D with official achievement level descriptors (0, 1-2, 3-4, 5-6, 7-8), bilingual strand definitions, progression callouts, and 1-7 final grade conversion. Added sidebar link in _quarto.yml, cross-link in command-terms.qmd, and logged tool change in TOOL-CHANGES.md. Verified HTML and Typst PDF compilation.
### [2026-10-20 11:29] IN PROGRESS — Create IB MYP Individuals and Societies Assessment Criteria page
- **AI Assistant:** Antigravity (Gemini)
- **Status:** IN PROGRESS
- **Files Touched:** course/references/assessment-criteria.qmd, _quarto.yml
- **Notes:** Building the official IB MYP Year 3 Assessment Criteria reference page covering Criteria A, B, C, and D with level descriptors, student-friendly explanations, and 中文 support, and adding sidebar navigation.
### [2026-10-20 09:29] COMPLETED — Pushed pending commits to origin main to trigger GitHub Pages publish
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** git: origin/main
- **Notes:** Pushed 4 pending commits (f9a5cde, 39a6254, a60e622, e14ee0c) to origin/main. This triggers the GitHub Actions 'Publish student site' workflow to rebuild and deploy to GitHub Pages.
### [2026-10-19 12:07] COMPLETED — Summative booklet layout precision: 11 pages, zero splits, exact TOC pagination
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** course/summatives/02-unit-2-summative/student-summative-booklet.qmd,course/summatives/02-unit-2-summative/summative-slides.qmd
- **Notes:** Finalized student summative booklet precision layout: exactly 11 pages (p.1 TOC, p.2 Action Plan & Tracker, pp.3-6 Step 1, pp.7-8 Step 2, p.9 Step 3, p.10 Step 4, p.11 Step 5). Zero mid-table splits, zero empty pages, perfectly matching TOC page numbers, and verified clean student edition PDF with no teacher rubric leakage.
### [2026-10-19 11:33] COMPLETED — Compress summative booklet: page numbers in TOC, compact tracker, sourcing table, loose-leaf 2nd draft, and student proficient rubric
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** course/summatives/02-unit-2-summative/student-summative-booklet.qmd, course/summatives/02-unit-2-summative/summative-slides.qmd
- **Notes:** Completed 5 requested updates: 1) Added exact page numbers to the TOC (10-page layout). 2) Compacted Class-by-Class tracker table with concise bulleted goals and reflection lines. 3) Unified Sources 1-4 into a compact 4-row Sourcing table with MLA drafting column. 4) Step 4 adapted for loose-leaf lined paper drafting while keeping Step 4.6 Works Cited Organizer (10 lines) in the booklet. 5) Step 5 rubric displays focused Proficient target (PR) for students while keeping the full 4-band rubric inside teacher-visible block.
### [2026-10-19 11:31] IN PROGRESS — Compress summative booklet: page numbers in TOC, compact tracker, sourcing table, loose-leaf 2nd draft, and student proficient rubric
- **AI Assistant:** Antigravity (Gemini)
- **Status:** IN PROGRESS
- **Files Touched:** course/summatives/02-unit-2-summative/student-summative-booklet.qmd, course/summatives/02-unit-2-summative/summative-slides.qmd
- **Notes:** Starting content updates: 1) Add page numbers to TOC. 2) Compact tracker table. 3) Step 1.3 sourcing table for Sources 1-4. 4) Step 4 loose-leaf instructions + Step 4.6 works cited organizer. 5) Step 5 rubric: Proficient target only for students, full rubric for teachers.
### [2026-10-19 11:07] COMPLETED — Format Unit 2 summative booklet & slides (compact TOC, table tracker, 2-page 2nd draft)
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** course/summatives/02-unit-2-summative/student-summative-booklet.qmd, course/summatives/02-unit-2-summative/summative-slides.qmd
- **Notes:** 1) Replaced bloated TOC with a 5-row compact Table of Contents at the front. 2) Preserved clean table format for the Class-by-Class tracker, removed teacher check, and added dedicated reflection prompts ('What actions led to success?' and 'What can you do to be more successful next class?'). 3) Standardized Step 1-5 nomenclature across booklet and slides (2.1 Intro, 2.2 Legal Body, 2.3 Slavery Body, 2.4 Counter-Claim Adv, 2.5 Conclusion, Step 3 Peer Audit, Step 4 2nd Draft, Step 5 Type Final Essay & Rubrics). 4) Step 4 streamlined to exactly 2 pages with a note allowing students to attach separate lined paper if needed. 5) Step 1.3 includes MLA quick templates and entry drafting boxes under each source. 6) Vocab bank bolding updated per requirements.
### [2026-10-19 11:02] IN PROGRESS — Format Unit 2 summative booklet & slides (compact TOC, table tracker, 2-page 2nd draft)
- **AI Assistant:** Antigravity (Gemini)
- **Status:** IN PROGRESS
- **Files Touched:** course/summatives/02-unit-2-summative/student-summative-booklet.qmd, course/summatives/02-unit-2-summative/summative-slides.qmd
- **Notes:** Implementing user's streamlined formatting: compact front TOC, table-format class tracker with specific reflection prompts, standardized Step nomenclature (Steps 1-5), 2-page Step 4 2nd draft, Step 1.3 MLA entry templates, and vocab bank bolding.
### [2026-10-19 10:46] COMPLETED — Revert Unit 2 summative packet and companion slides to eb0e416
- **AI Assistant:** Antigravity (Gemini)
- **Status:** COMPLETED
- **Files Touched:** course/summatives/02-unit-2-summative/student-summative-booklet.qmd, course/summatives/02-unit-2-summative/summative-slides.qmd
- **Notes:** Reverted changes from commit 5906e33 on both the student summative booklet and companion slides back to commit eb0e416, restoring original section structure and removing the step-based TOC/reflections per user request.
### [2026-10-19 09:48] COMPLETED — Summative booklet: TOC, Step-based nomenclature, reflection tracker, MLA scaffolds, consistent 2nd-draft paging
- **AI Assistant:** WorkBuddy
- **Status:** COMPLETED
- **Files Touched:** course/summatives/02-unit-2-summative/student-summative-booklet.qmd, course/summatives/02-unit-2-summative/summative-slides.qmd
- **Notes:** 1) Class-by-class tracker: removed the teacher sign-off column, replaced with per-lesson blocks giving two reflection prompts (What actions led to success? / What can you do to be more successful next class?) each with 2 full-width writing lines. 2) Added a Contents/目录 checklist table at the front (every step + a tick box) and standardized nomenclature across booklet AND slides: Step 1 (1.1-1.4), Step 2 1st Draft (2.1 Intro, 2.2 Legal Body, 2.3 Slavery Body, 2.4 Counter-Claim Advanced, 2.5 Conclusion), Step 3 Peer Audit, Step 4 2nd Draft (4.1-4.6), Step 5 Type Final Essay. All Body 1/Body 2/Body 3 and Section refs updated. 3) Step 4 now one paragraph per page with exactly 16 lines on each of the 5 pages (4.1-4.5); removed the pagebreak-created blank page by giving 2.4 and 2.5 their own pages. 4) Step 1.3 gained an MLA Works Cited template callout plus a 2-line MLA draft box under each of the 4 sources, referenced from Step 4.6. 5) Vocab bank bolding fixed: Twelve Tables, due process, chattel slavery, latifundia, civic exclusion now bold; gladiators unbolded. Verified with PyMuPDF: all pages >=45% fill except final rubric page, 34 pages, no Toddle, no teacher sign-off.
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
