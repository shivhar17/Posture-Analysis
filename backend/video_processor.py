import os
import cv2
import numpy as np
from collections import Counter
import base64

class VideoProcessor:
    def __init__(self, pose_detector, posture_classifier):
        self.detector = pose_detector
        self.classifier = posture_classifier

    def process_video(self, video_path, max_frames=120, target_fps=3):
        """
        Processes a video file by sampling frames at target_fps (up to max_frames).
        Returns a comprehensive multi-frame posture profile, timeline, and summary metrics.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video stream: {video_path}")
            
        orig_fps = cap.get(cv2.CAP_PROP_FPS)
        if orig_fps <= 0 or np.isnan(orig_fps):
            orig_fps = 25.0
            
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_sec = total_frames / orig_fps if total_frames > 0 else 0
        
        # Calculate sample interval
        frame_interval = max(1, int(round(orig_fps / target_fps)))
        
        frame_idx = 0
        sampled_count = 0
        timeline = []
        categories_detected = []
        scores = []
        
        annotated_sample_frames = []
        primary_concerns = set()
        all_recommendations = {}
        
        while cap.isOpened() and sampled_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_idx % frame_interval == 0:
                sampled_count += 1
                timestamp_sec = round(frame_idx / orig_fps, 2)
                
                # Resize large frames for fast processing
                h, w = frame.shape[:2]
                if w > 800:
                    scale = 800.0 / w
                    frame = cv2.resize(frame, (800, int(h * scale)))
                    
                detection = self.detector.detect_landmarks(frame)
                
                if detection["detected"]:
                    analysis = self.classifier.analyze(detection["landmarks_pixel"])
                    cat = analysis["category"]
                    score = analysis["score"]
                    status = analysis["status"]
                    
                    categories_detected.append(cat)
                    scores.append(score)
                    
                    timeline.append({
                        "frame_index": frame_idx,
                        "time_sec": timestamp_sec,
                        "time_str": f"{int(timestamp_sec // 60):02d}:{int(timestamp_sec % 60):02d}",
                        "category": cat,
                        "score": score,
                        "status": status,
                        "trunk_angle": analysis["angles"]["trunk_inclination"],
                        "cva": analysis["angles"]["craniovertebral_angle"]
                    })
                    
                    for c in analysis["concerns"]:
                        primary_concerns.add(c)
                    for rec in analysis["recommendations"]:
                        all_recommendations[rec["title"]] = rec
                        
                    # Save up to 4 key annotated snapshots for visual confirmation
                    if len(annotated_sample_frames) < 4:
                        ann_img = self.detector.draw_skeleton(frame, detection["landmarks_pixel"], status)
                        _, buf = cv2.imencode(".jpg", ann_img, [cv2.IMWRITE_JPEG_QUALITY, 80])
                        b64 = base64.b64encode(buf).decode("utf-8")
                        annotated_sample_frames.append({
                            "time_sec": timestamp_sec,
                            "time_str": f"{int(timestamp_sec // 60):02d}:{int(timestamp_sec % 60):02d}",
                            "category": cat,
                            "score": score,
                            "image_base64": f"data:image/jpeg;base64,{b64}"
                        })
                else:
                    timeline.append({
                        "frame_index": frame_idx,
                        "time_sec": timestamp_sec,
                        "time_str": f"{int(timestamp_sec // 60):02d}:{int(timestamp_sec % 60):02d}",
                        "category": "No Person Detected",
                        "score": 0,
                        "status": "Alert",
                        "trunk_angle": 0,
                        "cva": 0
                    })
                    
            frame_idx += 1
            
        cap.release()
        
        if not scores:
            return {
                "detected": False,
                "error": "No human subjects were detected across the entire video. Please ensure good lighting and full subject visibility."
            }
            
        avg_score = int(round(np.mean(scores)))
        min_score = int(np.min(scores))
        max_score = int(np.max(scores))
        
        # Category breakdown percentages
        cat_counts = Counter(categories_detected)
        total_valid = len(categories_detected)
        category_breakdown = []
        for cat, cnt in cat_counts.most_common():
            pct = round((cnt / total_valid) * 100, 1)
            category_breakdown.append({
                "category": cat,
                "count": cnt,
                "percentage": pct
            })
            
        dominant_posture = category_breakdown[0]["category"] if category_breakdown else "Unknown"
        
        # Determine overall rating
        if avg_score >= 85:
            overall_status = "Good"
            rating = "Optimal Dynamic Alignment"
        elif avg_score >= 68:
            overall_status = "Warning"
            rating = "Moderate Fatigue / Slouching Detected"
        else:
            overall_status = "Alert"
            rating = "High Ergonomic Strain"
            
        return {
            "detected": True,
            "duration_sec": round(duration_sec, 1),
            "total_frames_analyzed": len(timeline),
            "dominant_posture": dominant_posture,
            "average_score": avg_score,
            "min_score": min_score,
            "max_score": max_score,
            "overall_status": overall_status,
            "rating": rating,
            "category_breakdown": category_breakdown,
            "timeline": timeline,
            "sample_frames": annotated_sample_frames,
            "concerns": list(primary_concerns)[:4],
            "recommendations": list(all_recommendations.values())[:4]
        }
