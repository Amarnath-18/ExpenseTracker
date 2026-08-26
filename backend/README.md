# ExpanceTracker Backend

FastAPI backend with a simple MVC-style blueprint.

## Structure

```text
app/
  api/
  controllers/
  core/
  db/
  models/
  schemas/
  services/
tests/
main.py
requirements.txt
Dockerfile
```

## Setup

```powershell
uv pip install -r requirements.txt
```

## Run

```powershell
uv run fastapi dev main.py
```

## Test

```powershell
uv run pytest
```
