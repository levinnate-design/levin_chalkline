# Chalkline sample course

- Read `README.md` first. Content lives in `course/` and `vocab/`, appearance in `brand/`, code in `_extensions/` and `scripts/`.
- Every slide deck and printable has labels at the top: `title`, `type` (slides, worksheet, checklist, handout, reference), `order`, `audience` ([teacher, student, parent]) and `description`. Keep them.
- **Vocab:** `vocab/data/vocab.csv` is the source of truth; run `python vocab/validate.py` after editing it. Follow the rules in `vocab/README.md`: English is the target, 中文 is support; 中文 appears in reference materials, never in review materials (quizzes, flashcards); `short_def` is simple English, 75 characters or fewer; IDs are permanent.
- **Gloss key vocab & Command Terms:** on slides, write key words and IB MYP Command Terms as `{{< vocab "democracy" >}}` or `{{< vocab "analyse" text="Analyze" >}}` (a pop-up with picture and 中文). On printables, use `{{< vocab "democracy" zh=true >}}` and `{{< vocab "explain" text="Explain" zh=true >}}` so the 中文 is printed too, except on quizzes and tests.
- **Foundational MYP Curriculum References:** `course/references/curriculum-building/MYP_Individuals_and_Societies_CommandTerms.pdf` and `course/references/curriculum-building/MYP_Individuals_and_Societies_Guide_20141.pdf` (synced from `/Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies/Curriculum Building`) are required foundational references for all curriculum building. All 20 IB MYP Individuals & Societies Command Terms (`CMD-001` to `CMD-020`) live in `vocab/data/vocab.csv` and have their own dedicated reference page at `course/references/command-terms.qmd`. Whenever you write or edit student instructions on slides, worksheets, or summatives, use and gloss the appropriate MYP Command Term (`{{< vocab "..." >}}`).
- Write for middle-school English learners: short sentences, simple words, one idea per bullet.
- Teacher-only content (answer keys, look-fors) goes inside `::: {.content-visible when-profile="teacher"}`.
- Use original drawings or files with a clear license; credit outside sources in `course/links.yml`.

## Editing printables and slides

Keep the edit loop quick:

1. While working on one worksheet (or deck), re-render **only that file** after each change: `quarto render course/units/<unit>/<file>.qmd` (add `--to typst` to check just the PDF). Don't run a full `quarto render` and don't rebuild packets on every change.
2. When that file is done: save/commit it, then rebuild its unit packet once: `python scripts/packets.py --unit <unit number or folder>`.
3. A full render (`quarto render`) or the launcher's startup check rebuilds everything else (the year packet, slide PDFs).

If `quarto preview` is running, don't run a full `quarto render` at the same time: it empties `_site/` while the preview is serving it.

## Changing the tool (not the content): keep a log

This repo has two kinds of files:

- **Content** (lessons, worksheets, vocab words, pictures): everything in `course/`, plus `vocab/data/` and `vocab/images/`. Change these freely. No log needed.
- **The tool** (how Chalkline works and looks): `_extensions/`, `scripts/`, `brand/`, `vocab/app/`, `vocab/config.js`, `vocab/tools/`, `vocab/validate.py`, `vocab/schema.yaml`, `_quarto*.yml`, `index.qmd`, the `Start Chalkline` launchers, `.vscode/` and `.github/`.

**Whenever you change a tool file, add an entry to the top of `TOOL-CHANGES.md`** (create it if it's missing), in the same change. Use this form:

```markdown
## YYYY-MM-DD: short title
- **Asked for:** what the teacher wanted, in their words if they gave them.
- **Why:** the reason they gave, or "not given".
- **Changed:** each file and what changed in it, in a line or two.
- **Who it helps:** this course only, or probably every Chalkline course.
- **AI assistant:** which one made the change (Claude, Gemini, WorkBuddy, …).
```

Never delete or rewrite earlier entries. These logs are collected as design feedback and may become improvements to Chalkline for everyone, so the reasons matter as much as the changes.
- **Emoji:** avoid 🤖, 💩 and 🔒 in slides and pages. The brand font (Source Sans 3) has its own black-and-white versions of them, so they never show in color. Other common emoji are fine.

## Workspace Paths, WeDrive Access & Multi-Agent Workflow (WorkBuddy + Antigravity)

Multiple AI assistants (including **Tencent WorkBuddy** accounts and **Google Antigravity** subagents) collaborate on this course. Follow this shared protocol:

1. **Canonical Course Repository (ONLY edit here):**
   - Path: `/Users/nathaniellevin/chalkline-mingwan`
   - **Do NOT edit** `/Users/nathaniellevin/WorkBuddy AI/2026-10-14-13-54-04/chalkline-sample` (deprecated sample workspace).
   - GitHub remote (`origin`): `https://github.com/levinnate-design/levin_chalkline.git` (branch: `main`).
2. **Direct WeDrive / Curriculum Source Access:**
   - Path: `/Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies`
   - Key subfolders: `2026-2027/`, `Curriculum Building/`, `Textbooks/`, `Unit 0/`.
   - You have direct read/write access to both `/Users/nathaniellevin/chalkline-mingwan` and the WeDrive folder above. Keep curriculum documents in WeDrive and `.qmd` course files in `chalkline-mingwan` in sync when asked.
3. **Shared Local AI Activity Log (`AI-ACTIVITY-LOG.md`):**
   - Path in repo: `/Users/nathaniellevin/chalkline-mingwan/AI-ACTIVITY-LOG.md`
   - Mirrored in WeDrive: `/Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies/AI-ACTIVITY-LOG.md`
   - **Read before every task:** Run `python scripts/ai_log.py show` (or read `AI-ACTIVITY-LOG.md`) before starting work so you know what other AI tools just finished or are currently editing.
   - **Log every task:** When starting a large task (`--status "IN PROGRESS"`) and whenever finishing a task (`--status "COMPLETED"`), record your work so all AI platforms stay up to date:
     ```bash
     python /Users/nathaniellevin/chalkline-mingwan/scripts/ai_log.py add \
       --agent "<Your AI Name, e.g. WorkBuddy-2 or Antigravity>" \
       --status "COMPLETED" \
       --task "<Short title>" \
       --files "<Files/folders touched>" \
       --notes "<Summary of changes, pending items, or git commit status>"
     ```
4. **Multi-Agent Git & File Coordination (No Collisions):**
   - **Before starting a task:** Run `git status` and `git pull --rebase origin main` in `/Users/nathaniellevin/chalkline-mingwan` to pick up recent changes from other agents.
   - **Scope your edits:** Only edit the unit/files assigned to your task. Render only the single `.qmd` file you are editing (`quarto render course/units/<unit>/<file>.qmd`), never a full `quarto render` while another agent or preview server is active.
   - **Vocab & IDs:** Always read `vocab/data/vocab.csv` right before adding words so IDs don't collide, then run `python vocab/validate.py`.
   - **Tool changes:** Log any tool file change at the top of `TOOL-CHANGES.md` and credit your specific assistant/account under `- **AI assistant:**` (e.g., `WorkBuddy`, `Antigravity`).
   - **Finishing & pushing:** When a task is complete, rebuild the unit packet if printables changed (`python scripts/packets.py --unit <unit>`), log to `AI-ACTIVITY-LOG.md` via `scripts/ai_log.py`, stage only the files you worked on (plus `AI-ACTIVITY-LOG.md`), commit with a clear message, and push to GitHub (`git push origin main`).
5. **Safe Deletion & Archive Rules (For Agents with Deletion Power):**
   - **Never delete protected files:** Never delete `AI-ACTIVITY-LOG.md`, `TOOL-CHANGES.md`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `vocab/data/vocab.csv` (or existing permanent vocab IDs), `course/references/curriculum-building/*`, or `.git/`.
   - **WeDrive deletions require archiving or explicit request:** Because WeDrive (`/Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies`) is not a Git repository, do **not** permanently delete teacher curriculum files there unless explicitly instructed by Nate or Xinyi; when reorganizing or retiring old drafts in WeDrive, prefer moving them into an `_Archive/` subfolder first.
   - **Chalkline repo deletions:** When deleting or replacing files in `/Users/nathaniellevin/chalkline-mingwan`, ensure `git status` is clean or committed beforehand so Git history preserves a recoverable snapshot, and always list deleted files in your `AI-ACTIVITY-LOG.md` entry (`--files "DELETED: ..."`).
6. **Recursive SOP Check (Continuous Protocol Sync):**
   - **Never rely on a stale in-context copy of the SOP:** Before starting **every** new task (and before finalizing any multi-step task), recursively re-read `CLAUDE.md`, `AGENTS.md`, and `AI-ACTIVITY-LOG.md` (`python scripts/ai_log.py show`) from disk to check for updates to your Standard Operating Procedures (SOP). If any SOP file was modified during your session, immediately adopt the updated rules.
