from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import load_detection_config
from app.models.proctoring import ProctoringReport
from app.services.proctoring.session_manager import session_manager

router = APIRouter(tags=["reports"])


@router.post("/sessions/{session_id}/proctoring/report", response_model=ProctoringReport)
def create_proctoring_report(session_id: str) -> ProctoringReport:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    incidents = session_manager.list_incidents(session_id) or []
    report = session_manager.create_report(session_id)

    student_info = {
        "id": session.id,
        "name": f"{session.mode} practice",
        "exam": session.mode,
        "course": session.custom_prompt[:80],
    }
    report_violations = []
    for incident in incidents:
        data = incident.model_dump(mode="json")
        data["timestamp"] = incident.timestamp.strftime("%Y%m%d_%H%M%S_%f")
        if incident.evidence:
            data["image_path"] = incident.evidence[0].path
        report_violations.append(data)

    try:
        from reporting.report_generator import ReportGenerator
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="Proctoring report dependencies are not installed.",
        ) from exc

    path = ReportGenerator(load_detection_config()).generate_report(
        student_info, report_violations, output_format="html"
    )
    if not path:
        failed = report.model_copy(update={"status": "failed"})
        session_manager.save_report(failed)
        return failed

    ready = report.model_copy(update={"status": "ready", "path": path})
    session_manager.save_report(ready)
    return ready


@router.get("/reports/{report_id}", response_model=ProctoringReport)
def get_proctoring_report(report_id: str) -> ProctoringReport:
    report = session_manager.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/reports/{report_id}/download")
def download_proctoring_report(report_id: str) -> FileResponse:
    report = session_manager.get_report(report_id)
    if not report or not report.path:
        raise HTTPException(status_code=404, detail="Report not found")
    path = Path(report.path)
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(path)
