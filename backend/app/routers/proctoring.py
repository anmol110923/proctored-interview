from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from app.db.base import get_db
from app.db.models import SessionRow
from app.models.proctoring import DetectionStatus, Incident, ProctoringSession
from app.services.proctoring.session_manager import session_manager

router = APIRouter(prefix="/sessions", tags=["proctoring"])


@router.post("/{session_id}/proctoring/start", response_model=ProctoringSession)
async def start_proctoring(session_id: str, db: DbSession = Depends(get_db)) -> ProctoringSession:
    row = db.get(SessionRow, session_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if not row.proctoring_enabled:
        raise HTTPException(status_code=400, detail="Proctoring is not enabled for this session")
    if row.status != "active":
        raise HTTPException(status_code=400, detail="Interview is not active")
    if row.proctoring_status == "running":
        existing = session_manager.get_session(session_id)
        if existing:
            return existing

    try:
        from app.services.proctoring.detection_worker import DetectionWorker
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Proctoring failed to load: {exc}. Install backend/requirements-ml.txt if CV/ML packages are missing.",
        ) from exc

    worker = DetectionWorker(session_id)
    session_manager.workers[session_id] = worker
    updated = await session_manager.mark_running(session_id)
    worker.start()
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated


@router.post("/{session_id}/proctoring/stop", response_model=ProctoringSession)
async def stop_proctoring(session_id: str, db: DbSession = Depends(get_db)) -> ProctoringSession:
    row = db.get(SessionRow, session_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    session_manager.stop_worker(session_id, timeout=30)
    updated = session_manager.get_session(session_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated


@router.get("/{session_id}/proctoring/status", response_model=DetectionStatus)
def get_proctoring_status(session_id: str) -> DetectionStatus:
    status = session_manager.get_status(session_id)
    if not status:
        raise HTTPException(status_code=404, detail="Session not found")
    return status


@router.get("/{session_id}/incidents", response_model=list[Incident])
def list_incidents(session_id: str) -> list[Incident]:
    incidents = session_manager.list_incidents(session_id)
    if incidents is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return incidents
