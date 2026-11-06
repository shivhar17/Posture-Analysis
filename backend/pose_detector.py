import os
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Landmark indices for MediaPipe Pose
LANDMARKS = {
    "NOSE": 0,
    "LEFT_EYE": 2,
    "RIGHT_EYE": 5,
    "LEFT_EAR": 7,
    "RIGHT_EAR": 8,
    "LEFT_SHOULDER": 11,
    "RIGHT_SHOULDER": 12,
    "LEFT_ELBOW": 13,
    "RIGHT_ELBOW": 14,
    "LEFT_WRIST": 15,
    "RIGHT_WRIST": 16,
    "LEFT_HIP": 23,
    "RIGHT_HIP": 24,
    "LEFT_KNEE": 25,
    "RIGHT_KNEE": 26,
    "LEFT_ANKLE": 27,
    "RIGHT_ANKLE": 28
}

POSE_CONNECTIONS = [
    ("LEFT_EAR", "LEFT_EYE"), ("LEFT_EYE", "NOSE"),
    ("RIGHT_EAR", "RIGHT_EYE"), ("RIGHT_EYE", "NOSE"),
    ("LEFT_SHOULDER", "RIGHT_SHOULDER"),
    ("LEFT_SHOULDER", "LEFT_ELBOW"), ("LEFT_ELBOW", "LEFT_WRIST"),
    ("RIGHT_SHOULDER", "RIGHT_ELBOW"), ("RIGHT_ELBOW", "RIGHT_WRIST"),
    ("LEFT_SHOULDER", "LEFT_HIP"), ("RIGHT_SHOULDER", "RIGHT_HIP"),
    ("LEFT_HIP", "RIGHT_HIP"),
    ("LEFT_HIP", "LEFT_KNEE"), ("LEFT_KNEE", "LEFT_ANKLE"),
    ("RIGHT_HIP", "RIGHT_KNEE"), ("RIGHT_KNEE", "RIGHT_ANKLE"),
]

class PoseDetector:
    def __init__(self, model_path="data/pose_landmarker_lite.task"):
        # Resolve path relative to backend directory
        if not os.path.isabs(model_path):
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.model_path = os.path.join(base_dir, model_path)
        else:
            self.model_path = model_path
            
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"MediaPipe Pose model not found at {self.model_path}")
            
        base_options = python.BaseOptions(model_asset_path=self.model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            output_segmentation_masks=False,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            num_poses=3 # Support multiple people detection
        )
        self.detector = vision.PoseLandmarker.create_from_options(options)
        
    def detect_landmarks(self, image_bgr):
        """
        Detects body pose landmarks in a BGR OpenCV image.
        Returns:
            dict containing:
                'detected': bool,
                'num_people': int,
                'landmarks_normalized': list of landmarks or None,
                'landmarks_pixel': dict of key points in (x, y, z, vis),
                'visibility_warning': str or None
        """
        h, w, _ = image_bgr.shape
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        
        result = self.detector.detect(mp_image)
        
        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return {
                "detected": False,
                "num_people": 0,
                "landmarks_normalized": None,
                "landmarks_pixel": None,
                "visibility_warning": "No human body detected in the frame. Please ensure full upper body visibility."
            }
            
        num_people = len(result.pose_landmarks)
        
        # If multiple people detected, pick the one with the largest bounding box area
        best_idx = 0
        max_area = -1
        for idx, pose_lm in enumerate(result.pose_landmarks):
            xs = [lm.x for lm in pose_lm]
            ys = [lm.y for lm in pose_lm]
            area = (max(xs) - min(xs)) * (max(ys) - min(ys))
            if area > max_area:
                max_area = area
                best_idx = idx
                
        primary_landmarks = result.pose_landmarks[best_idx]
        
        # Map key landmarks to pixel coordinates
        landmarks_pixel = {}
        for name, idx in LANDMARKS.items():
            lm = primary_landmarks[idx]
            px = int(lm.x * w)
            py = int(lm.y * h)
            vis = getattr(lm, "visibility", 1.0)
            if vis is None:
                vis = 1.0
            landmarks_pixel[name] = {
                "x": px,
                "y": py,
                "z": lm.z,
                "norm_x": lm.x,
                "norm_y": lm.y,
                "visibility": round(float(vis), 3)
            }
            
        # Check landmark visibility
        vis_warning = None
        critical_landmarks = ["LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP", "RIGHT_HIP"]
        low_vis = [k for k in critical_landmarks if landmarks_pixel[k]["visibility"] < 0.4]
        
        if low_vis:
            vis_warning = f"Reduced visibility on key joints ({', '.join(low_vis)}). For clinical accuracy, ensure unobstructed view and good lighting."
            
        if num_people > 1:
            multi_note = f"Multiple individuals detected ({num_people}). Analysis prioritized on the primary subject in focus."
            vis_warning = f"{multi_note} {vis_warning if vis_warning else ''}".strip()
            
        return {
            "detected": True,
            "num_people": num_people,
            "landmarks_normalized": primary_landmarks,
            "landmarks_pixel": landmarks_pixel,
            "visibility_warning": vis_warning
        }
        
    def draw_skeleton(self, image_bgr, landmarks_pixel, posture_status="Good"):
        """
        Draws professional glowing skeleton overlay onto the image.
        posture_status can be: 'Good', 'Warning', 'Alert'
        """
        if not landmarks_pixel:
            return image_bgr
            
        overlay = image_bgr.copy()
        
        # Accent colors (BGR)
        COLOR_TEAL = (220, 180, 14)      # #0eb4dc
        COLOR_GREEN = (80, 205, 50)      # #32cd50
        COLOR_ORANGE = (30, 140, 245)    # #f58c1e
        COLOR_RED = (50, 50, 235)        # #eb3232
        COLOR_WHITE = (255, 255, 255)
        
        if posture_status == "Good":
            joint_color = COLOR_GREEN
            bone_color = COLOR_TEAL
        elif posture_status == "Warning":
            joint_color = COLOR_ORANGE
            bone_color = (180, 180, 240)
        else:
            joint_color = COLOR_RED
            bone_color = (160, 160, 250)
            
        # Draw skeleton connections
        for start_name, end_name in POSE_CONNECTIONS:
            if start_name in landmarks_pixel and end_name in landmarks_pixel:
                p1 = landmarks_pixel[start_name]
                p2 = landmarks_pixel[end_name]
                
                # Draw only if both landmarks have reasonable visibility
                if p1["visibility"] > 0.25 and p2["visibility"] > 0.25:
                    pt1 = (p1["x"], p1["y"])
                    pt2 = (p2["x"], p2["y"])
                    # Outer thicker line for glow
                    cv2.line(overlay, pt1, pt2, (40, 40, 40), 6, cv2.LINE_AA)
                    # Main colored bone line
                    cv2.line(overlay, pt1, pt2, bone_color, 3, cv2.LINE_AA)
                    
        # Draw spine center axis (mid-shoulder to mid-hip)
        if all(k in landmarks_pixel for k in ["LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP", "RIGHT_HIP"]):
            ls, rs = landmarks_pixel["LEFT_SHOULDER"], landmarks_pixel["RIGHT_SHOULDER"]
            lh, rh = landmarks_pixel["LEFT_HIP"], landmarks_pixel["RIGHT_HIP"]
            mid_shoulder = (int((ls["x"] + rs["x"]) / 2), int((ls["y"] + rs["y"]) / 2))
            mid_hip = (int((lh["x"] + rh["x"]) / 2), int((lh["y"] + rh["y"]) / 2))
            cv2.line(overlay, mid_shoulder, mid_hip, (255, 255, 0), 3, cv2.LINE_AA)
            
        # Draw key joint landmark circles
        for name, p in landmarks_pixel.items():
            if p["visibility"] > 0.3:
                pt = (p["x"], p["y"])
                # Outer shadow circle
                cv2.circle(overlay, pt, 7, (20, 20, 20), -1, cv2.LINE_AA)
                # Colored joint circle
                cv2.circle(overlay, pt, 5, joint_color, -1, cv2.LINE_AA)
                # Inner white pinpoint
                cv2.circle(overlay, pt, 2, COLOR_WHITE, -1, cv2.LINE_AA)
                
        # Blend overlay with slight transparency
        annotated = cv2.addWeighted(overlay, 0.9, image_bgr, 0.1, 0)
        return annotated
