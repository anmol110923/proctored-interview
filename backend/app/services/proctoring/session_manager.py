from uuid import uuid4

from app.models.proctoring import (
    DetectionStatus,
    Evidence,
    Incident,
    ProctoringReport,
    ProctoringSession,
    RealtimeEvent,
)
from app.repositories import proctoring_repo
from app.services.proctoring.event_bus import event_bus


class ProctoringSessionManager:
    def __init__(self) -> None:
        self.workers: dict[str, object] = {}

    def get_session(self, session_id: str) -> ProctoringSession | None:
        return proctoring_repo.get_proctoring_session(session_id)

    def get_status(self, session_id: str) -> DetectionStatus | None:
        return proctoring_repo.get_status(session_id)

    def list_incidents(self, session_id: str) -> list[Incident] | None:
        return proctoring_repo.list_incidents(session_id)

    async def set_status(self, session_id: str, status: DetectionStatus) -> None:
        proctoring_repo.save_status(status)
        await event_bus.publish(
            RealtimeEvent(type="detection.status", session_id=session_id, payload=status.model_dump(mode="json"))
        )

    async def add_incident(self, incident: Incident) -> None:
        proctoring_repo.save_incident(incident)
        await event_bus.publish(
            RealtimeEvent(type="violation.created", session_id=incident.session_id, payload=incident.model_dump(mode="json"))
        )

    async def add_session_evidence(self, session_id: str, evidence: Evidence, metadata: dict | None = None) -> Incident:
        incident = Incident(
            id=str(uuid4()),
            session_id=session_id,
            type="SESSION_RECORDING",
            severity=0,
            timestamp=evidence.created_at,
            metadata=metadata or {},
            evidence=[evidence],
        )
        proctoring_repo.save_incident(incident)
        await event_bus.publish(
            RealtimeEvent(type="evidence.created", session_id=session_id, payload=incident.model_dump(mode="json"))
        )
        return incident

    async def mark_running(self, session_id: str) -> ProctoringSession | None:
        updated = proctoring_repo.set_proctoring_status(session_id, "running", started=True)
        if not updated:
            return None
        await event_bus.publish(
            RealtimeEvent(type="session.started", session_id=session_id, payload=updated.model_dump(mode="json"))
        )
        return updated

    async def mark_completed(self, session_id: str) -> ProctoringSession | None:
        updated = proctoring_repo.set_proctoring_status(session_id, "completed", ended=True)
        if not updated:
            return None
        await event_bus.publish(
            RealtimeEvent(type="session.stopped", session_id=session_id, payload=updated.model_dump(mode="json"))
        )
        return updated

    async def mark_failed(self, session_id: str, error: str) -> ProctoringSession | None:
        updated = proctoring_repo.set_proctoring_status(session_id, "failed", ended=True)
        if not updated:
            return None
        await event_bus.publish(
            RealtimeEvent(
                type="error",
                session_id=session_id,
                payload={"message": error, "session": updated.model_dump(mode="json")},
            )
        )
        return updated

    def mark_stopping(self, session_id: str) -> ProctoringSession | None:
        return proctoring_repo.set_proctoring_status(session_id, "stopping")

    def create_report(self, session_id: str, path: str | None = None, status: str = "pending") -> ProctoringReport:
        return proctoring_repo.create_report(session_id, path=path, status=status)

    def save_report(self, report: ProctoringReport) -> None:
        proctoring_repo.save_report(report)

    def get_report(self, report_id: str) -> ProctoringReport | None:
        return proctoring_repo.get_report(report_id)

    def list_reports(self, session_id: str) -> list[ProctoringReport] | None:
        return proctoring_repo.list_reports(session_id)

    def stop_worker(self, session_id: str, timeout: float = 30) -> bool:
        worker = self.workers.get(session_id)
        if worker is None:
            return False
        stop = getattr(worker, "stop", None)
        if callable(stop):
            stop()
        self.mark_stopping(session_id)
        thread = getattr(worker, "thread", None)
        if thread is not None:
            thread.join(timeout=timeout)
        return True


session_manager = ProctoringSessionManager()
