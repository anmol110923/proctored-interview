import os

import cv2
from mediapipe import Image, ImageFormat
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.core import base_options as base_options


class _LandmarkList:
    def __init__(self, landmarks):
        self.landmark = landmarks


class FaceMeshResults:
    def __init__(self, face_landmarks):
        self.multi_face_landmarks = (
            [_LandmarkList(landmarks) for landmarks in face_landmarks]
            if face_landmarks
            else None
        )


class FaceMeshHelper:
    def __init__(self):
        model_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "models", "face_landmarker.task")
        )
        options = vision.FaceLandmarkerOptions(
            base_options=base_options.BaseOptions(model_asset_path=model_path),
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._landmarker = vision.FaceLandmarker.create_from_options(options)

    def process(self, rgb_frame):
        mp_image = Image(image_format=ImageFormat.SRGB, data=rgb_frame)
        result = self._landmarker.detect(mp_image)
        return FaceMeshResults(result.face_landmarks)
