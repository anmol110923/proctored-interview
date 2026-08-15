from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


IncidentType = Literal[
    "FACE_DISAPPEARED",
    "GAZE_AWAY",
    "MOUTH_MOVING",
    "MULTIPLE_FACES",
    "OBJECT_DETECTED",
    "VOICE_DETECTED",
    "SPEECH_VIOLATION",
    "SESSION_RECORDING",
]

IncidentStatus = Literal["open", "reviewed", "dismissed", "confirmed"]
ProctoringStatus = Literal["created", "running", "stopping", "completed", "failed"]
EventType = Literal[
    "session.created",
    "session.started",
    "session.stopped",
    "detection.status",
    "violation.created",
    "recording.started",
    "recording.stopped",
    "report.ready",
    "evidence.created",
    "error",
]


class Evidence(BaseModel):
    id: str
    kind: Literal["image", "video", "audio", "screen", "report"]
    path: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Incident(BaseModel):
    id: str
    session_id: str
    type: IncidentType
    severity: int
    timestamp: datetime
    status: IncidentStatus = "open"
    metadata: dict[str, Any] = Field(default_factory=dict)
    evidence: list[Evidence] = Field(default_factory=list)


class DetectionStatus(BaseModel):
    session_id: str
    face_present: bool = False
    gaze_direction: str = "center"
    eye_ratio: float = 0.3
    mouth_moving: bool = False
    multiple_faces: bool = False
    objects_detected: bool = False
    audio_detected: bool = False
    error: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ProctoringSession(BaseModel):
    id: str
    mode: str
    custom_prompt: str
    proctoring_enabled: bool
    proctoring_status: ProctoringStatus | None = None
    proctoring_started_at: datetime | None = None
    proctoring_ended_at: datetime | None = None


class ProctoringReport(BaseModel):
    id: str
    session_id: str
    status: Literal["pending", "ready", "failed"] = "pending"
    path: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RealtimeEvent(BaseModel):
    type: EventType
    session_id: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: dict[str, Any] = Field(default_factory=dict)


class ProctoringSummary(BaseModel):
    enabled: bool
    status: ProctoringStatus | None = None
    violation_count: int = 0
    severity_total: int = 0
    counts_by_type: dict[str, int] = Field(default_factory=dict)
    incidents: list[Incident] = Field(default_factory=list)
    reports: list[ProctoringReport] = Field(default_factory=list)
    latest_status: DetectionStatus | None = None
