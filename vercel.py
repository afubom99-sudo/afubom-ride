from pathlib import Path
import sys


project_directory = Path(__file__).resolve().parent
for import_directory in (project_directory / "backend" / "app", project_directory / "backend"):
    if str(import_directory) not in sys.path:
        sys.path.insert(0, str(import_directory))

from app.main import app