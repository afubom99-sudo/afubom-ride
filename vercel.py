import sys
from pathlib import Path


project_directory = Path(__file__).resolve().parent
backend_directory = project_directory / "backend"
app_directory = backend_directory / "app"

for import_directory in (backend_directory, app_directory):
    import_path = str(import_directory)
    if import_path not in sys.path:
        sys.path.insert(0, import_path)

from app.main import app