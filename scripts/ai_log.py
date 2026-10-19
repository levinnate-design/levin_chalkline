#!/usr/bin/env python3
"""Shared AI Activity Log helper for Chalkline & WeDrive multi-agent collaboration.

Keeps AI-ACTIVITY-LOG.md synchronized between:
  1. /Users/nathaniellevin/chalkline-mingwan/AI-ACTIVITY-LOG.md
  2. /Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies/AI-ACTIVITY-LOG.md

Usage examples:
  python scripts/ai_log.py show
  python scripts/ai_log.py sync
  python scripts/ai_log.py add --agent "WorkBuddy-2" --status "COMPLETED" \
    --task "Add Ancient China slides" --files "course/units/01-ancient-river-civilizations/china-slides.qmd" \
    --notes "Created 14-slide deck with glossed MYP Command Terms and rendered HTML/PDF."
"""

from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
import shutil
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent
REPO_LOG = REPO_ROOT / "AI-ACTIVITY-LOG.md"
WEDRIVE_DIR = Path(
    "/Users/nathaniellevin/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/明湾学校/Social Studies"
)
WEDRIVE_LOG = WEDRIVE_DIR / "AI-ACTIVITY-LOG.md"
MARKER = "<!-- AI_LOG_FEED_START -->"


def sync_logs(prefer: Path | None = None) -> tuple[Path, bool]:
    """Synchronize REPO_LOG and WEDRIVE_LOG so both have the newest content.

    Returns (source_path, wedrive_synced).
    """
    source = prefer
    if source is None:
        if REPO_LOG.exists() and WEDRIVE_LOG.exists():
            try:
                repo_mtime = REPO_LOG.stat().st_mtime
                wedrive_mtime = WEDRIVE_LOG.stat().st_mtime
                source = WEDRIVE_LOG if wedrive_mtime > repo_mtime + 1.0 else REPO_LOG
            except PermissionError:
                source = REPO_LOG
        elif REPO_LOG.exists():
            source = REPO_LOG
        elif WEDRIVE_LOG.exists():
            source = WEDRIVE_LOG
        else:
            raise FileNotFoundError(f"Neither {REPO_LOG} nor {WEDRIVE_LOG} exists.")

    wedrive_synced = False
    if source == WEDRIVE_LOG and WEDRIVE_LOG.exists():
        shutil.copy2(WEDRIVE_LOG, REPO_LOG)
        wedrive_synced = True
    elif source == REPO_LOG and REPO_LOG.exists():
        try:
            if WEDRIVE_DIR.exists():
                shutil.copy2(REPO_LOG, WEDRIVE_LOG)
                wedrive_synced = True
        except PermissionError:
            wedrive_synced = False

    return REPO_LOG, wedrive_synced


def cmd_show(args: argparse.Namespace) -> int:
    log_path, _ = sync_logs()
    claude_md = REPO_ROOT / "CLAUDE.md"
    if claude_md.exists():
        mtime_str = datetime.fromtimestamp(claude_md.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        print(
            f"[SOP Check] {claude_md} last updated: {mtime_str} "
            f"(Re-read CLAUDE.md from disk if updated since your last check!)\n"
        )
    text = log_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    limit = args.lines
    if limit and limit > 0:
        print("\n".join(lines[:limit]))
    else:
        print(text)
    return 0


def cmd_sync(_args: argparse.Namespace) -> int:
    log_path, wedrive_synced = sync_logs()
    msg = f"Synced {log_path}"
    if wedrive_synced:
        msg += f" <-> {WEDRIVE_LOG}"
    else:
        msg += " (WeDrive mirror skipped or not accessible in sandbox; run outside sandbox to mirror to WeDrive)"
    print(msg)
    return 0


def cmd_add(args: argparse.Namespace) -> int:
    sync_logs()
    if not REPO_LOG.exists():
        print(f"Error: {REPO_LOG} not found.", file=sys.stderr)
        return 1

    text = REPO_LOG.read_text(encoding="utf-8")
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    status = args.status.upper().strip()
    entry = (
        f"\n### [{now_str}] {status} — {args.task.strip()}\n"
        f"- **AI Assistant:** {args.agent.strip()}\n"
        f"- **Status:** {status}\n"
        f"- **Files Touched:** {args.files.strip()}\n"
        f"- **Notes:** {args.notes.strip()}\n"
    )

    if MARKER in text:
        before, after = text.split(MARKER, 1)
        new_text = f"{before}{MARKER}\n{entry}{after.lstrip(chr(10))}"
    else:
        new_text = text.rstrip() + "\n\n" + MARKER + "\n" + entry

    REPO_LOG.write_text(new_text, encoding="utf-8")
    _, wedrive_synced = sync_logs(prefer=REPO_LOG)
    print(f"Added log entry for [{args.agent}] -> {REPO_LOG}")
    if wedrive_synced:
        print(f"Mirrored to WeDrive -> {WEDRIVE_LOG}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Read, add entries to, and sync the shared AI-ACTIVITY-LOG.md across Chalkline and WeDrive."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_show = sub.add_parser("show", help="Show the latest entries in AI-ACTIVITY-LOG.md")
    p_show.add_argument("-n", "--lines", type=int, default=80, help="Number of lines to show (0 for all)")
    p_show.set_defaults(func=cmd_show)

    p_sync = sub.add_parser("sync", help="Sync AI-ACTIVITY-LOG.md between Chalkline repo and WeDrive")
    p_sync.set_defaults(func=cmd_sync)

    p_add = sub.add_parser("add", help="Prepend a new entry to AI-ACTIVITY-LOG.md and sync to WeDrive")
    p_add.add_argument("--agent", required=True, help="AI assistant/account name (e.g. 'WorkBuddy-2', 'Antigravity')")
    p_add.add_argument(
        "--status",
        default="COMPLETED",
        help="Task status: IN PROGRESS, COMPLETED, or HANDOFF (default: COMPLETED)",
    )
    p_add.add_argument("--task", required=True, help="Short title of the task")
    p_add.add_argument("--files", required=True, help="Files or folders created/edited")
    p_add.add_argument("--notes", required=True, help="Summary of changes, commit hash, or handoff notes")
    p_add.set_defaults(func=cmd_add)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
