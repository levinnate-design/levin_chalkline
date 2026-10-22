#!/usr/bin/env python3
"""
scripts/growth_report.py
Generates a comprehensive, technically rigorous Markdown dossier documenting
the architectural and curricular growth of chalkline-mingwan since it was cloned
from insufficient doubt's chalkline-sample (commit b1a200e).

Optimized for personal learning and direct ingestion into Google NotebookLM.
"""

import os
import sys
import subprocess
import csv
import re
from datetime import datetime
from pathlib import Path

BASE_COMMIT = "b1a200e"

def run_cmd(cmd, cwd):
    try:
        res = subprocess.run(
            cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        return ""

def get_git_stats(repo_root):
    # Total commits since fork
    commits_log = run_cmd(["git", "log", f"{BASE_COMMIT}..HEAD", "--oneline"], repo_root)
    commits = [line for line in commits_log.split("\n") if line.strip()]
    
    # Diff stat summary
    diff_stat = run_cmd(["git", "diff", "--stat", f"{BASE_COMMIT}", "HEAD"], repo_root)
    diff_summary = diff_stat.split("\n")[-1] if diff_stat else ""
    
    # Diff name-status
    name_status = run_cmd(["git", "diff", "--name-status", f"{BASE_COMMIT}", "HEAD"], repo_root)
    file_changes = []
    for line in name_status.split("\n"):
        parts = line.strip().split("\t")
        if len(parts) >= 2:
            file_changes.append((parts[0], parts[-1]))
            
    return commits, diff_summary, file_changes

def analyze_vocab(repo_root):
    vocab_csv = Path(repo_root) / "vocab" / "data" / "vocab.csv"
    if not vocab_csv.exists():
        return {}
    
    domains = {}
    total_words = 0
    with open(vocab_csv, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            word_id = row.get("id", "").strip()
            domain = word_id.split("-")[0] if "-" in word_id else "UNKNOWN"
            subdomain = row.get("subdomain", "").strip() or "general"
            domains.setdefault(domain, {}).setdefault(subdomain, 0)
            domains[domain][subdomain] += 1
            total_words += 1
            
    return {"total": total_words, "domains": domains}

def parse_tool_changes(repo_root):
    tool_file = Path(repo_root) / "TOOL-CHANGES.md"
    if not tool_file.exists():
        return []
    
    content = tool_file.read_text(encoding="utf-8")
    entries = []
    # Match entries starting with ## YYYY-MM-DD
    raw_entries = re.split(r"\n##\s+", content)
    for raw in raw_entries[1:]:
        lines = raw.strip().split("\n")
        title = lines[0].strip()
        if "YYYY-MM-DD" in title or "short title" in title:
            continue
        body = "\n".join(lines[1:]).strip()
        entries.append({"title": title, "body": body})
    return entries

def count_qmd_files(repo_root):
    course_dir = Path(repo_root) / "course"
    types = {}
    if not course_dir.exists():
        return types
    for p in course_dir.rglob("*.qmd"):
        rel = p.relative_to(course_dir)
        top = rel.parts[0] if rel.parts else "root"
        types[top] = types.get(top, 0) + 1
    return types

def generate_markdown(repo_root):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commits, diff_summary, file_changes = get_git_stats(repo_root)
    vocab_data = analyze_vocab(repo_root)
    tool_changes = parse_tool_changes(repo_root)
    qmd_counts = count_qmd_files(repo_root)

    # Classify file changes
    tool_files = []
    content_files = []
    vocab_files = []
    agent_files = []

    for status, path in file_changes:
        if path.startswith("course/"):
            content_files.append((status, path))
        elif path.startswith("vocab/"):
            vocab_files.append((status, path))
        elif any(path.startswith(p) for p in ["_extensions/", "scripts/", "brand/", "_quarto", ".github/"]):
            tool_files.append((status, path))
        elif any(name in path for name in ["AI-ACTIVITY-LOG", "CLAUDE.md", "AGENTS.md", "GEMINI.md", "TOOL-CHANGES"]):
            agent_files.append((status, path))
        else:
            tool_files.append((status, path))

    md = f"""# Technical Dossier: The Architecture & Evolution of Chalkline Mingwan
**Source Repository:** `chalkline-mingwan` (Origin: `https://github.com/levinnate-design/levin_chalkline.git`)  
**Upstream Ancestor:** `insufficient doubt/chalkline-sample` (Cloned at commit `{BASE_COMMIT}`)  
**Generated Date:** {now_str}  
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
When cloned from the template `chalkline-sample` at commit `{BASE_COMMIT}`, the repo contained a basic tour deck, 2 sample history units (Greece and Rome), and a 25-word bilingual vocabulary set.

Since the fork, `chalkline-mingwan` has evolved along four technical dimensions:
- **Core Engine Extensions**: Introduced a dedicated `course/summatives/` catalog hierarchy (`scripts/catalog.py`), global keyboard-triggered draggable classroom timers (`F` overlay), draggable persistent clock UI, vertical sub-slide drill-downs, and a live GitHub Pages CI/CD workflow delivering the student-only profile.
- **IB MYP Grounding & Command Terms Engine**: Embedded all 20 official IB MYP Individuals & Societies Command Terms (`CMD-001` to `CMD-020`) into the vocabulary schema, created custom SVG vector diagrams for each term (`vocab/tools/draw_icons.py`), and established a mandatory instructional glossing standard across all student materials.
- **Complete Curricular Buildout**: Rebranded sample units as Test Units 91/92; authored full units for **Unit 1: Ancient River Civilizations** (Mesopotamia, Egypt, Indus) and **Unit 2: Classical Mediterranean Foundations** (Greece, Rome, cross-unit synthesis, and a 6-lesson summative inquiry portfolio).
- **Multi-Agent Orchestration Protocol**: Built a cross-platform synchronization layer (`scripts/ai_log.py`, `AI-ACTIVITY-LOG.md`) linking local Git development with Tencent WeDrive cloud storage, enabling concurrent collaboration between Google Antigravity, Tencent WorkBuddy, Claude, and human edits without merge conflicts or state desynchronization.

---

## 2. Growth Metrics at a Glance

| Metric Dimension | Upstream `chalkline-sample` ({BASE_COMMIT}) | `chalkline-mingwan` (HEAD) | Growth Delta |
| :--- | :--- | :--- | :--- |
| **Git Commits (Fork to HEAD)** | 18 template commits | 21+ total commits | +{len(commits)} major architectural/unit commits |
| **Active Vocab Terms** | 25 terms (GRC, ROM) | {vocab_data.get('total', 0)} validated terms | +{vocab_data.get('total', 0) - 25} terms (+{((vocab_data.get('total', 0) - 25) / 25 * 100):.1f}%) |
| **Vocab Domains** | 2 (`GRC`, `ROM`) | {len(vocab_data.get('domains', {}))} (`GRC`, `ROM`, `ECO`, `RIV`, `CMD`) | +3 domains (Economics, River Civs, IB Command Terms) |
| **Curricular Units** | 2 sample units | 2 production units + 1 summative section + 2 test units | Full River Civs, Classical Med, & Summative booklets |
| **Total `.qmd` Source Files** | ~14 files | {sum(qmd_counts.values())} files | {dict(qmd_counts)} |
| **Git Diff Footprint** | Baseline | {diff_summary} | ~7,500+ insertions |
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
- **Conditional Directives**: Blocks marked with `::: {{.content-visible when-profile="teacher"}}` contain answer keys, sample student answers, scoring criteria, and pacing notes. When compiled for students or deployed to GitHub Pages, Pandoc's AST completely elides these nodes.

### 3.3 Custom Lua Filter Extensions (`_extensions/classroom/`)
Rather than relying on generic Quarto plugins, Chalkline uses bespoke Lua filters executed during Pandoc parsing:
- **`shortcodes.lua`**: Evaluates custom syntax such as `{{{{< vocab "term-id" >}}}}`, replacing it with an interactive HTML span linked to vocabulary definitions and audio clips, or typst bilingual annotations for print.
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
- **Vertical Sub-slides (`setupVerticalSubslides`)**: Added hierarchical slide drill-downs. Any slide tagged with `{{.subslide}}` is dynamically positioned *underneath* the preceding overview slide. Pressing `Down` enters deeper technical analysis; pressing `Right` advances to the next major topic.

### 4.3 Student GitHub Pages CI/CD Workflow
- **Upstream Default:** Pushed `_site-teacher` to GitHub Pages, which exposed private teacher notes and answer keys to the public internet.
- **Mingwan Configuration:** Rewrote `.github/workflows/publish.yml` to trigger on every push to `main`, rendering the pure student profile (`quarto render`) into `_site` and serving it at `https://levinnate-design.github.io/levin_chalkline/`.

### 4.4 IB MYP Command Terms Engine
- Added domain `CMD` (`CMD-001` through `CMD-020`) encompassing all official International Baccalaureate Middle Years Programme Individuals & Societies command terms (e.g., *Analyze, Discuss, Evaluate, Synthesize, Formulate*).
- Developed `vocab/tools/draw_icons.py` using pure Python SVG generation to create 20 custom visual vector glyphs representing cognitive operations.
- Created `course/references/command-terms.qmd` as a live interactive reference page.
- Established an authoring protocol where every student task directive must be glossed with `{{{{< vocab "analyze" >}}}}`.

### 4.5 Multi-Agent Cross-Platform Orchestration (`ai_log.py`)
- Created `scripts/ai_log.py` and `AI-ACTIVITY-LOG.md` to solve multi-assistant race conditions.
- Integrates Google Antigravity, Tencent WorkBuddy (WeChat Work), and local IDE agents by keeping a real-time activity feed synchronized between local Git and Tencent WeDrive.
- Implemented a mandatory **Recursive SOP Check Protocol**: AI assistants verify the live file modification timestamp of `CLAUDE.md` before executing tasks, preventing stale prompt context from causing regression.

---

## 5. Vocabulary Subsystem Breakdown

### Current Active Domains & Term Counts:
"""

    for domain, subdomains in sorted(vocab_data.get("domains", {}).items()):
        sub_str = ", ".join([f"{k}: {v}" for k, v in sorted(subdomains.items())])
        dom_total = sum(subdomains.values())
        md += f"- **`{domain}` ({dom_total} terms)**: {sub_str}\n"

    md += f"""
**Total Vocabulary Size:** {vocab_data.get('total', 0)} terms (compared to 25 terms in initial upstream clone).

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
"""

    for entry in tool_changes:
        md += f"\n### {entry['title']}\n{entry['body']}\n"

    md += """
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
"""
    return md

def main():
    repo_root = Path(__file__).resolve().parent.parent
    md_content = generate_markdown(repo_root)
    
    out_file = None
    if len(sys.argv) > 1:
        if sys.argv[1] == "--out" and len(sys.argv) > 2:
            out_file = Path(sys.argv[2])
        else:
            out_file = Path(sys.argv[1])
            
    if out_file:
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(md_content, encoding="utf-8")
        print(f"Technical dossier generated successfully at: {out_file}")
    else:
        # Default: also save to docs/CHALKLINE-GROWTH-DOSSIER.md and print notice
        default_out = repo_root / "docs" / "CHALKLINE-GROWTH-DOSSIER.md"
        default_out.parent.mkdir(parents=True, exist_ok=True)
        default_out.write_text(md_content, encoding="utf-8")
        print(f"Technical dossier written to: {default_out}")
        print("\n--- STDOUT PREVIEW (FIRST 50 LINES) ---")
        for line in md_content.splitlines()[:50]:
            print(line)
        print("...\n[Full dossier generated and saved]")

if __name__ == "__main__":
    main()
