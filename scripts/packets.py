"""Compatibility wrapper: forwards `python scripts/packets.py ...` to Chalkline's `packets.py`."""

import importlib.util
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT_SCRIPTS = ROOT / "_extensions" / "chalkline" / "scripts"
if str(EXT_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(EXT_SCRIPTS))

if __name__ == "__main__":
    runpy.run_path(str(EXT_SCRIPTS / "packets.py"), run_name="__main__")
else:
    _spec = importlib.util.spec_from_file_location("_chalkline_packets", EXT_SCRIPTS / "packets.py")
    _mod = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)
    globals().update({k: v for k, v in vars(_mod).items() if not k.startswith("__")})
