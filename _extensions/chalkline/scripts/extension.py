"""Where things are: the course folder and the Chalkline extension in it.

    from extension import ROOT, EXT, typst_format

ROOT is the course (the folder with _quarto.yml). EXT is the Chalkline extension: _extensions/chalkline/
here, or _extensions/<owner>/chalkline/ once it's installed with `quarto add`.
"""

from pathlib import Path

import yaml


def _find_root():
    here = Path(__file__).resolve().parent
    for folder in (here, *here.parents):
        if (folder / "_quarto.yml").exists():
            return folder
    return Path.cwd()


def _find_ext(root):
    here = Path(__file__).resolve().parent
    for folder in (here, *here.parents):   # a script inside the extension
        if (folder / "_extension.yml").exists():
            return folder
    found = sorted(root.glob("_extensions/chalkline/_extension.yml")) + sorted(root.glob("_extensions/*/chalkline/_extension.yml"))
    return found[0].parent if found else root / "_extensions" / "chalkline"


ROOT = _find_root()
EXT = _find_ext(ROOT)


def _merge(base, extra):
    """Quarto's way: dicts merge, lists add up (no repeats), anything else is replaced."""
    if isinstance(base, dict) and isinstance(extra, dict):
        out = dict(base)
        for k, v in extra.items():
            out[k] = _merge(base[k], v) if k in base else v
        return out
    if isinstance(base, list) and isinstance(extra, list):
        return base + [v for v in extra if v not in base]
    return extra


def typst_format(site):
    """The typst format as a render of this course sees it: Chalkline's (paths made relative to the course
    folder), with the course's own `format: typst:` from _quarto.yml (`site`) on top. For builds that can't
    use `project: type: chalkline` themselves (the packets are a book)."""
    ext = yaml.safe_load((EXT / "_extension.yml").read_text(encoding="utf-8"))
    typst = dict(ext["contributes"]["project"]["format"]["typst"])
    rel = EXT.relative_to(ROOT).as_posix()
    for key in ("font-paths", "template-partials"):
        typst[key] = [f"{rel}/{p}" for p in typst.get(key, [])]
    own = (site.get("format") or {}).get("typst")
    return _merge(typst, own if isinstance(own, dict) else {})
