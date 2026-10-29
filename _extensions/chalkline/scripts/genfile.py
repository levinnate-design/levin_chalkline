"""Write generated files only when their contents change.

The pre-render scripts run before every render, including each re-render while
`quarto preview` is open. The preview watches the project, so rewriting a file with
the same contents still counts as a change: it reloads the browser, which renders
again, which rewrites the file again... Comparing first keeps that from looping.
"""

from pathlib import Path


def write_if_changed(path, text):
    """Write `text` to `path` unless the file already holds exactly that. True if written."""
    path = Path(path)
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return True
