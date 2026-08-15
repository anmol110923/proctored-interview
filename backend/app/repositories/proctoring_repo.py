from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession, selectinload

from app.db.base import SessionLocal
from app.db.models import DetectionStatusRow, EvidenceRow, IncidentRow, ProctoringReportRow, SessionRow
from app.models.proctoring import DetectionStatus, Evidence, Incident, ProctoringReport, ProctoringSession


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _session_from_row(row: SessionRow) -> ProctoringSession:
    return ProctoringSession(
        id=row.id,
        mode=row.mode,
        custom_prompt=row.custom_prompt,
        proctoring_enabled=bool(row.proctoring_enabled),
        proctoring_status=row.proctoring_status,  # type: ignore[arg-type]
        proctoring_started_at=row.proctoring_started_at,
        proctoring_ended_at=row.proctoring_ended_at,
    )


def _status_from_row(row: DetectionStatusRow) -> DetectionStatus:
    return DetectionStatus(
        session_id=row.session_id,
        face_present=bool(row.face_present),
        gaze_direction=row.gaze_direction,
        eye_ratio=row.eye_ratio,
        mouth_moving=bool(row.mouth_moving),
        multiple_faces=bool(row.multiple_faces),
        objects_detected=bool(row.objects_detected),
        audio_detected=bool(row.audio_detected),
        error=row.error,
        timestamp=row.timestamp,
    )


def _incident_from_row(row: IncidentRow) -> Incident:
    return Incident(
        id=row.id,
        session_id=row.session_id,
        type=row.type,  # type: ignore[arg-type]
        severity=row.severity,
        timestamp=row.timestamp,
        status=row.status,  # type: ignore[arg-type]
        metadata=dict(row.extra or {}),
        evidence=[
            Evidence(id=item.id, kind=item.kind, path=item.path, created_at=item.created_at)  # type: ignore[arg-type]
            for item in row.evidence
        ],
    )


def _report_from_row(row: ProctoringReportRow) -> ProctoringReport:
    return ProctoringReport(
        id=row.id,
        session_id=row.session_id,
        status=row.status,  # type: ignore[arg-type]
        path=row.path,
        created_at=row.created_at,
    )


def get_proctoring_session(session_id: str) -> ProctoringSession | None:
    db = SessionLocal()
    try:
        row = db.get(SessionRow, session_id)
        if row is None:
            return None
        return _session_from_row(row)
    finally:
        db.close()


def initialize_status(db: DbSession, session_id: str) -> DetectionStatus:
    existing = db.get(DetectionStatusRow, session_id)
    if existing:
        return _status_from_row(existing)
    row = DetectionStatusRow(session_id=session_id, timestamp=_utcnow())
    db.add(row)
    db.flush()
    return _status_from_row(row)


def set_proctoring_status(
    session_id: str,
    status: str,
    *,
    started: bool = False,
    ended: bool = False,
) -> ProctoringSession | None:
    db = SessionLocal()
    try:
        row = db.get(SessionRow, session_id)
        if row is None:
            return None
        row.proctoring_status = status
        now = _utcnow()
        if started:
            row.proctoring_started_at = now
        if ended:
            row.proctoring_ended_at = now
        db.commit()
        db.refresh(row)
        return _session_from_row(row)
    finally:
        db.close()


def save_status(status: DetectionStatus) -> None:
    db = SessionLocal()
    try:
        row = db.get(DetectionStatusRow, status.session_id)
        if row is None:
            row = DetectionStatusRow(session_id=status.session_id)
            db.add(row)
        row.face_present = status.face_present
        row.gaze_direction = status.gaze_direction
        row.eye_ratio = status.eye_ratio
        row.mouth_moving = status.mouth_moving
        row.multiple_faces = status.multiple_faces
        row.objects_detected = status.objects_detected
        row.audio_detected = status.audio_detected
        row.error = status.error
        row.timestamp = status.timestamp
        db.commit()
    finally:
        db.close()


def get_status(session_id: str) -> DetectionStatus | None:
    db = SessionLocal()
    try:
        row = db.get(DetectionStatusRow, session_id)
        return _status_from_row(row) if row else None
    finally:
        db.close()


def save_incident(incident: Incident) -> None:
    db = SessionLocal()
    try:
        row = db.get(IncidentRow, incident.id)
        if row is None:
            row = IncidentRow(id=incident.id, session_id=incident.session_id)
            db.add(row)
        row.type = incident.type
        row.severity = incident.severity
        row.timestamp = incident.timestamp
        row.status = incident.status
        row.extra = incident.metadata
        existing = {item.id: item for item in row.evidence}
        for evidence in incident.evidence:
            item = existing.get(evidence.id)
            if item is None:
                item = EvidenceRow(id=evidence.id, incident_id=incident.id)
                db.add(item)
            item.kind = evidence.kind
            item.path = evidence.path
            item.created_at = evidence.created_at
        db.commit()
    finally:
        db.close()


def list_incidents(session_id: str) -> list[Incident] | None:
    db = SessionLocal()
    try:
        if db.get(SessionRow, session_id) is None:
            return None
        rows = db.scalars(
            select(IncidentRow)
            .options(selectinload(IncidentRow.evidence))
            .where(IncidentRow.session_id == session_id)
            .order_by(IncidentRow.timestamp.desc())
        ).all()
        return [_incident_from_row(row) for row in rows]
    finally:
        db.close()


def save_report(report: ProctoringReport) -> None:
    db = SessionLocal()
    try:
        row = db.get(ProctoringReportRow, report.id)
        if row is None:
            row = ProctoringReportRow(id=report.id, session_id=report.session_id)
            db.add(row)
        row.status = report.status
        row.path = report.path
        row.created_at = report.created_at
        db.commit()
    finally:
        db.close()


def get_report(report_id: str) -> ProctoringReport | None:
    db = SessionLocal()
    try:
        row = db.get(ProctoringReportRow, report_id)
        return _report_from_row(row) if row else None
    finally:
        db.close()


def list_reports(session_id: str) -> list[ProctoringReport] | None:
    db = SessionLocal()
    try:
        if db.get(SessionRow, session_id) is None:
            return None
        rows = db.scalars(
            select(ProctoringReportRow)
            .where(ProctoringReportRow.session_id == session_id)
            .order_by(ProctoringReportRow.created_at.desc())
        ).all()
        return [_report_from_row(row) for row in rows]
    finally:
        db.close()


def create_report(session_id: str, path: str | None = None, status: str = "pending") -> ProctoringReport:
    report = ProctoringReport(id=str(uuid4()), session_id=session_id, path=path, status=status)  # type: ignore[arg-type]
    save_report(report)
    return report
