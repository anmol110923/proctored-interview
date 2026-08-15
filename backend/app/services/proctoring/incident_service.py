from datetime import datetime
from time import monotonic
from uuid import uuid4

from app.models.proctoring import DetectionStatus, Evidence, Incident, IncidentType
from app.services.proctoring.session_manager import session_manager


SEVERITY = {
    "FACE_DISAPPEARED": 1,
    "GAZE_AWAY": 2,
    "MOUTH_MOVING": 3,
    "MULTIPLE_FACES": 4,
    "OBJECT_DETECTED": 5,
    "VOICE_DETECTED": 3,
    "SPEECH_VIOLATION": 3,
    "SESSION_RECORDING": 0,
}


class IncidentService:
    def __init__(self, session_id: str, cooldown_seconds: float) -> None:
        self.session_id = session_id
        self.cooldown_seconds = cooldown_seconds
        self.last_incident_at: dict[str, float] = {}

    def can_emit(self, violation_type: str) -> bool:
        now = monotonic()
        previous = self.last_incident_at.get(violation_type, 0)
        if now - previous < self.cooldown_seconds:
            return False
        self.last_incident_at[violation_type] = now
        return True

    async def emit(
        self,
        violation_type: IncidentType,
        status: DetectionStatus | None = None,
        evidence: list[Evidence] | None = None,
        metadata: dict | None = None,
        apply_cooldown: bool = True,
    ) -> Incident | None:
        if apply_cooldown and not self.can_emit(violation_type):
            return None

        payload = metadata or {}
        if status:
            payload = {**payload, "frame": status.model_dump(mode="json")}

        incident = Incident(
            id=str(uuid4()),
            session_id=self.session_id,
            type=violation_type,
            severity=SEVERITY.get(violation_type, 1),
            timestamp=datetime.utcnow(),
            metadata=payload,
            evidence=evidence or [],
        )
        await session_manager.add_incident(incident)
        return incident


def build_evidence(kind: str, path: str) -> Evidence:
    return Evidence(id=str(uuid4()), kind=kind, path=path)  # type: ignore[arg-type]
