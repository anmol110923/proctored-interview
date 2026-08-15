from pathlib import Path
from urllib.parse import unquote

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import settings

router = APIRouter(prefix="/media", tags=["media"])

ALLOWED_ROOT_NAMES = {"reports", "recordings"}


@router.get("/{encoded_path:path}")
def get_media(encoded_path: str) -> FileResponse:
    root = settings.project_root.resolve()
    path = Path(unquote(encoded_path))
    if not path.is_absolute():
        path = root / path
    resolved = path.resolve()

    try:
        relative = resolved.relative_to(root)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail="Media path is outside project storage") from exc

    if not relative.parts or relative.parts[0] not in ALLOWED_ROOT_NAMES:
        raise HTTPException(status_code=403, detail="Media path is not allowed")
    if not resolved.exists() or not resolved.is_file():
        raise HTTPException(status_code=404, detail="Media file not found")

    return FileResponse(resolved)
