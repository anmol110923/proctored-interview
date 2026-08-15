from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SessionRow(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    mode: Mapped[str] = mapped_column(String(64), nullable=False)
    custom_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(16), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    focus_areas: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    resume_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    context_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_turns: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")
    evaluation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    token_usage: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    proctoring_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    proctoring_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    proctoring_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    proctoring_ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    proctoring_config_overrides: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    messages: Mapped[list["MessageRow"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="MessageRow.sequence",
    )
    incidents: Mapped[list["IncidentRow"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )
    detection_status: Mapped["DetectionStatusRow | None"] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        uselist=False,
    )
    proctoring_reports: Mapped[list["ProctoringReportRow"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )


class MessageRow(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    session: Mapped[SessionRow] = relationship(back_populates="messages")


class DetectionStatusRow(Base):
    __tablename__ = "detection_statuses"

    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), primary_key=True)
    face_present: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    gaze_direction: Mapped[str] = mapped_column(String(32), nullable=False, default="center")
    eye_ratio: Mapped[float] = mapped_column(Float, nullable=False, default=0.3)
    mouth_moving: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    multiple_faces: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    objects_detected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    audio_detected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    session: Mapped[SessionRow] = relationship(back_populates="detection_status")


class IncidentRow(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="open")
    extra: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)

    session: Mapped[SessionRow] = relationship(back_populates="incidents")
    evidence: Mapped[list["EvidenceRow"]] = relationship(
        back_populates="incident",
        cascade="all, delete-orphan",
    )


class EvidenceRow(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    incident_id: Mapped[str] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    path: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    incident: Mapped[IncidentRow] = relationship(back_populates="evidence")


class ProctoringReportRow(Base):
    __tablename__ = "proctoring_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    path: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    session: Mapped[SessionRow] = relationship(back_populates="proctoring_reports")
