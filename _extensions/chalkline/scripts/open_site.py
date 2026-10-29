"""Open the student site (or a finished copy of the teacher site): build it if anything changed, then serve the finished files.

    python chalkline.py open student    the student site (no answer keys) at http://localhost:4101
    python chalkline.py open teacher    a finished copy of the teacher site at http://localhost:4103

The everyday site (teacher version) uses `quarto preview` instead, which rebuilds pages as
you edit (the "Start Chalkline" launchers). These are served as plain files, so they can
run alongside it: two Quarto previews of the same project at once get in each other's way.
After editing, stop this (Ctrl+C) and run it again to rebuild.
"""

import functools
import http.server
import subprocess
import sys
import webbrowser
from pathlib import Path

from extension import ROOT  # noqa: E402  (the course folder)
PORTS = {"student": 4101, "teacher": 4103}


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    profile = sys.argv[1] if len(sys.argv) > 1 else ""
    if profile not in PORTS:
        sys.exit("Usage: python chalkline.py open student|teacher")
    student = profile == "student"   # the student site is the plain build, into _site/
    subprocess.run([sys.executable, str(Path(__file__).resolve().parent / "build_if_needed.py")] + ([] if student else ["--profile", profile]), cwd=ROOT)
    site = ROOT / ("_site" if student else f"_site-{profile}")
    port = PORTS[profile]
    url = f"http://localhost:{port}/"
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(QuietHandler, directory=str(site)))
    print(f"Chalkline: the {profile} site is at {url}  (Ctrl+C or close this window to stop)")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
