import asyncio
from typing import Any

from app.models.proctoring import IncidentType
from app.services.proctoring.incident_service import IncidentService
from utils.logging import AlertLogger


INCIDENT_ALERT_TYPES: set[str] = {"VOICE_DETECTED", "SPEECH_VIOLATION"}


class IncidentAlertLogger(AlertLogger):
    def __init__(
        self,
        config: dict[str, Any],
        incident_service: IncidentService,
        loop: asyncio.AbstractEventLoop | None,
    ) -> None:
        super().__init__(config)
        self.incident_service = incident_service
        self.loop = loop

    def log_alert(self, alert_type: str, message: str):
        entry = super().log_alert(alert_type, message)
        if entry and alert_type in INCIDENT_ALERT_TYPES and self.loop:
            asyncio.run_coroutine_threadsafe(
                self.incident_service.emit(
                    alert_type,  # type: ignore[arg-type]
                    metadata={"message": message, "source": "audio"},
                ),
                self.loop,
            )
        return entry
