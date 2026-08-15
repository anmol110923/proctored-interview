import asyncio
import threading
from datetime import datetime
from typing import Any

import cv2

from app.config import load_detection_config
from app.models.proctoring import DetectionStatus
from app.services.proctoring.alert_bridge import IncidentAlertLogger
from app.services.proctoring.incident_service import IncidentService, build_evidence
from app.services.proctoring.session_manager import session_manager
from detection.audio_detection import AudioMonitor
from detection.face_detection import FaceDetector
from detection.eye_tracking import EyeTracker
from detection.mouth_detection import MouthMonitor
from detection.multi_face import MultiFaceDetector
from detection.object_detection import ObjectDetector
from reporting.report_generator import ReportGenerator
from utils.alert_system import AlertSystem
from utils.screen_capture import ScreenRecorder
from utils.screenshot_utils import ViolationCapturer
from utils.video_utils import VideoRecorder


class DetectionWorker:
    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        self.config = load_detection_config()
        self.stop_event = threading.Event()
        self.thread: threading.Thread | None = None
        self.loop: asyncio.AbstractEventLoop | None = None

    def start(self) -> None:
        if self.thread and self.thread.is_alive():
            return
        self.loop = asyncio.get_running_loop()
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()

    def _submit(self, coroutine: Any) -> None:
        if self.loop:
            asyncio.run_coroutine_threadsafe(coroutine, self.loop)

    def _run(self) -> None:
        incident_service = IncidentService(
            self.session_id,
            cooldown_seconds=float(self.config["logging"].get("alert_cooldown", 10)),
        )
        alert_logger = IncidentAlertLogger(self.config, incident_service, self.loop)
        alert_system = AlertSystem(self.config)
        violation_capturer = ViolationCapturer(self.config)
        video_recorder = VideoRecorder(self.config)
        screen_recorder = ScreenRecorder(self.config)
        report_generator = ReportGenerator(self.config)
        audio_monitor: AudioMonitor | None = None
        screen_data = None
        video_data = None
        failure: str | None = None
        screen_started = False
        video_started = False

        cap = None

        try:
            detectors = [
                FaceDetector(self.config),
                EyeTracker(self.config),
                MouthMonitor(self.config),
                MultiFaceDetector(self.config),
                ObjectDetector(self.config),
            ]

            for detector in detectors:
                if hasattr(detector, "set_alert_logger"):
                    detector.set_alert_logger(alert_logger)

            if self.config["detection"]["audio_monitoring"].get("enabled"):
                audio_monitor = AudioMonitor(self.config)
                audio_monitor.alert_system = alert_system
                audio_monitor.alert_logger = alert_logger
                audio_monitor.start()

            cap = cv2.VideoCapture(self.config["video"]["source"])
            if not cap.isOpened():
                raise RuntimeError("Unable to open configured webcam source")

            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.config["video"]["resolution"][0])
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config["video"]["resolution"][1])

            video_recorder.start_recording()
            video_started = True
            if self.config["screen"]["recording"]:
                screen_recorder.start_recording()
                screen_started = True

            while not self.stop_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    break

                status = DetectionStatus(
                    session_id=self.session_id,
                    face_present=detectors[0].detect_face(frame),
                    timestamp=datetime.utcnow(),
                )
                status.gaze_direction, status.eye_ratio = detectors[1].track_eyes(frame)
                status.mouth_moving = detectors[2].monitor_mouth(frame)
                status.multiple_faces = detectors[3].detect_multiple_faces(frame)
                status.objects_detected = detectors[4].detect_objects(frame)

                self._submit(session_manager.set_status(self.session_id, status))

                violation_type = self._detect_violation_type(status)
                if violation_type:
                    alert_system.speak_alert(violation_type)
                    if incident_service.can_emit(violation_type):
                        capture = violation_capturer.capture_violation(frame, violation_type)
                        self._submit(
                            incident_service.emit(
                                violation_type,
                                status=status,
                                evidence=[build_evidence("image", capture["image_path"])],
                                apply_cooldown=False,
                            )
                        )

                video_recorder.record_frame(frame)
        except Exception as exc:
            failure = str(exc)
            self._submit(session_manager.mark_failed(self.session_id, failure))
        finally:
            if audio_monitor:
                audio_monitor.stop()
            if screen_started:
                screen_data = screen_recorder.stop_recording()
            if video_started:
                video_data = video_recorder.stop_recording()
            if cap and cap.isOpened():
                cap.release()

            session = session_manager.get_session(self.session_id)
            incidents = session_manager.list_incidents(self.session_id) or []
            if session:
                self._persist_recording_evidence(video_data, screen_data)
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
                report_path = report_generator.generate_report(
                    student_info,
                    report_violations,
                    output_format="html",
                )
                if report_path:
                    session_manager.create_report(self.session_id, path=report_path, status="ready")

            if failure is None:
                self._submit(session_manager.mark_completed(self.session_id))

    def _persist_recording_evidence(self, video_data: dict | None, screen_data: dict | None) -> None:
        async def save() -> None:
            if video_data and video_data.get("filename"):
                await session_manager.add_session_evidence(
                    self.session_id,
                    build_evidence("video", video_data["filename"]),
                    {"recording": video_data, "source": "webcam"},
                )
            if screen_data and screen_data.get("filename"):
                await session_manager.add_session_evidence(
                    self.session_id,
                    build_evidence("screen", screen_data["filename"]),
                    {"recording": screen_data, "source": "screen"},
                )

        self._submit(save())

    def _detect_violation_type(self, status: DetectionStatus) -> str | None:
        if not status.face_present:
            return "FACE_DISAPPEARED"
        if status.multiple_faces:
            return "MULTIPLE_FACES"
        if status.objects_detected:
            return "OBJECT_DETECTED"
        if status.mouth_moving:
            return "MOUTH_MOVING"
        return None
