#!/usr/bin/env python3
"""Check data/*.csv against schema.yaml.

Usage: python chalkline.py validate   (from the course folder)
Exit code 0 = no errors (warnings allowed), 1 = errors found.
"""
import csv
import difflib
import io
import re
import sys
from pathlib import Path

import yaml

from extension import ROOT as COURSE  # noqa: E402

ROOT = COURSE / "vocab"   # the course's vocab folder: schema.yaml, data/, images/
errors = []
warnings = []


def err(where, msg):
    errors.append(f"{where}: {msg}")


def warn(where, msg):
    warnings.append(f"{where}: {msg}")


def suggest(value, allowed):
    match = difflib.get_close_matches(value, [str(a) for a in allowed], n=1, cutoff=0.5)
    return f' (did you mean "{match[0]}"?)' if match else ""


def split_list(cell, sep):
    return [part.strip() for part in cell.split(sep) if part.strip()]


_lookups = {}


def lookup(rel_path, column):
    """Set of values in one column of a reference CSV (cached)."""
    key = (rel_path, column)
    if key not in _lookups:
        with open(ROOT / rel_path, encoding="utf-8") as f:
            _lookups[key] = {row[column] for row in csv.DictReader(f)}
    return _lookups[key]


def read_csv(path):
    """Return (header, rows) or None if the file can't be parsed safely."""
    raw = path.read_bytes()
    name = path.relative_to(ROOT).as_posix()
    if raw.startswith(b"\xef\xbb\xbf"):
        err(name, "file starts with a BOM; save as UTF-8 without BOM")
        return None
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        err(name, f"not valid UTF-8 (byte {e.start}); Chinese text may be garbled. Re-save as UTF-8")
        return None
    if "\r" in text:
        err(name, "uses Windows (CRLF) line endings; save with LF (\\n) line endings")
        return None
    reader = csv.reader(io.StringIO(text))
    try:
        rows = list(reader)
    except csv.Error as e:
        err(name, f"CSV parse error: {e}")
        return None
    if not rows:
        err(name, "file is empty; it needs at least a header row")
        return None
    return rows[0], rows[1:]


def check_table(key, schema):
    """Validate one table. Returns ({id: line}, [(where, column, ref_id)])."""
    table = schema[key]
    path = ROOT / table["file"]
    name = table["file"]
    if not path.exists():
        err(name, "file not found")
        return {}, []
    parsed = read_csv(path)
    if parsed is None:
        return {}, []
    header, rows = parsed

    columns = table["columns"]
    expected = [c["name"] for c in columns]
    if header != expected:
        err(name, f"header must be exactly: {','.join(expected)}")
        return {}, []

    sep = schema["list_separator"]
    levels = [str(l) for l in schema["levels"]]
    statuses = schema["statuses"]
    domains = table.get("domains", {})
    id_re = re.compile(table["id_pattern"])
    seen = {}
    deferred_refs = []  # (where, column, ref_id) checked after all IDs are known

    for line_no, cells in enumerate(rows, start=2):
        if not any(c.strip() for c in cells):
            warn(f"{name}:{line_no}", "blank row")
            continue
        if len(cells) != len(expected):
            err(f"{name}:{line_no}", f"has {len(cells)} cells, expected {len(expected)} (check quoting of commas)")
            continue
        row = dict(zip(expected, cells))
        rid = row["id"].strip() or f"line {line_no}"
        where = f"{name}:{line_no} {rid}"

        for col, value in row.items():
            if value != value.strip():
                err(where, f"{col} has leading/trailing spaces")

        # ID
        if not id_re.match(row["id"]):
            err(where, f'id "{row["id"]}" doesn\'t match {table["id_pattern"]}')
        elif row["id"] in seen:
            err(where, f"duplicate id (also on line {seen[row['id']]})")
        else:
            seen[row["id"]] = line_no

        # Domain / subdomain (vocab only)
        domain = row.get("domain")
        if domains:
            if domain not in domains:
                err(where, f'domain "{domain}" not allowed{suggest(domain, domains)}')
                domain = None
            else:
                if not row["id"].startswith(domain + "-"):
                    err(where, f'id prefix must match domain "{domain}"')
                sub = row["subdomain"]
                if sub and sub not in domains[domain]:
                    err(where, f'subdomain "{sub}" not allowed for {domain}{suggest(sub, domains[domain])}')

        # Shared enums
        if row["level"] and row["level"] not in levels:
            err(where, f'level "{row["level"]}" must be one of {", ".join(levels)}')
        status = row["status"]
        if status and status not in statuses:
            err(where, f'status "{status}" not allowed{suggest(status, statuses)}')

        # Per-column rules
        for c in columns:
            col, value = c["name"], row[c["name"]]
            if c.get("required") and not value:
                err(where, f"{col} is required")
            if status in c.get("required_when_status", []) and not value:
                err(where, f"{col} is required when status is {status}")
            if status in c.get("warn_if_missing_when_status", []) and not value:
                warn(where, f"{col} is empty on a {status} row")
            if domain and domain in c.get("required_for_domains", []) and not value:
                err(where, f"{col} is required for {domain}")
            if not value:
                continue
            if "allowed" in c and value not in c["allowed"]:
                err(where, f'{col} "{value}" not allowed{suggest(value, c["allowed"])}')
            if "max_length" in c and len(value) > c["max_length"]:
                err(where, f"{col} is {len(value)} characters (max {c['max_length']})")
            if "pattern" in c and not re.match(c["pattern"], value):
                err(where, f'{col} "{value}" doesn\'t match {c["pattern"]}')
            if domain and "only_for_domains" in c and domain not in c["only_for_domains"]:
                err(where, f"{col} is only used for {', '.join(c['only_for_domains'])} rows")
            if "file_in" in c and not (ROOT / c["file_in"] / value).is_file():
                err(where, f"{col} file {c['file_in']}/{value} not found")
            if "in_file" in c:
                known = lookup(c["in_file"]["path"], c["in_file"]["column"])
                for item in split_list(value, sep):
                    if item not in known:
                        err(where, f'{col} "{item}" not found in {c["in_file"]["path"]}')
            if c.get("refs"):
                for ref in split_list(value, sep):
                    deferred_refs.append((where, col, ref))

    return seen, deferred_refs


def main():
    schema = yaml.safe_load((ROOT / "schema.yaml").read_text(encoding="utf-8"))

    vocab_ids, vocab_refs = check_table("vocab", schema)
    frame_ids, frame_refs = check_table("frames", schema)

    for where, col, ref in vocab_refs + frame_refs:
        if ref not in vocab_ids:
            err(where, f'{col} refers to "{ref}", which isn\'t a vocab id')

    # Images with no matching row
    image_dir = ROOT / "images"
    if image_dir.is_dir():
        for f in sorted(image_dir.iterdir()):
            if f.name.startswith(".") or f.suffix.lower() not in (".png", ".jpg", ".jpeg"):
                continue
            base = re.sub(r"-[a-z]$", "", f.stem)
            if base not in vocab_ids:
                warn(f"images/{f.name}", "no vocab row with this id")

    for w in warnings:
        print(f"warning  {w}")
    for e in errors:
        print(f"ERROR    {e}")
    counts = f"{len(vocab_ids)} vocab rows, {len(frame_ids)} frames"
    if errors:
        print(f"\n✗ {len(errors)} error(s), {len(warnings)} warning(s) — {counts}")
        sys.exit(1)
    print(f"✓ OK, {len(warnings)} warning(s) — {counts}")


if __name__ == "__main__":
    main()
