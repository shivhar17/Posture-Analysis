import os
import cv2
import numpy as np

def generate_sample_video(output_path="samples/sample_posture_video.mp4"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    w, h = 640, 480
    fps = 20
    duration_sec = 4
    total_frames = fps * duration_sec
    
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    
    cx = w // 2
    
    for f in range(total_frames):
        t = f / total_frames # 0.0 to 1.0
        frame = np.full((h, w, 3), (245, 247, 250), dtype=np.uint8)
        
        # Grid lines
        for y in range(0, h, 40):
            cv2.line(frame, (0, y), (w, y), (230, 235, 240), 1)
            
        # Posture shifts over time:
        # Phase 1 (0 to 0.4): Good posture
        # Phase 2 (0.4 to 0.7): Slouching / Rounded back
        # Phase 3 (0.7 to 1.0): Forward Bending
        if t < 0.4:
            head_shift_x = 0
            head_shift_y = 0
            trunk_bend = 0
            phase_label = "Phase 1: Good Standing Posture"
        elif t < 0.7:
            # Gradual slouch
            p = (t - 0.4) / 0.3
            head_shift_x = int(35 * p)
            head_shift_y = int(25 * p)
            trunk_bend = int(18 * p)
            phase_label = "Phase 2: Transition to Slouching"
        else:
            # Forward bend
            p = (t - 0.7) / 0.3
            head_shift_x = 35 + int(45 * p)
            head_shift_y = 25 + int(50 * p)
            trunk_bend = 18 + int(35 * p)
            phase_label = "Phase 3: Forward Bending"
            
        head_pos = (cx + head_shift_x, 110 + head_shift_y)
        shoulder_l = (cx - 45 + trunk_bend // 2, 160 + trunk_bend)
        shoulder_r = (cx + 45 + trunk_bend // 2, 160 + trunk_bend)
        hip_l = (cx - 35, 280)
        hip_r = (cx + 35, 280)
        knee_l = (cx - 35, 380)
        knee_r = (cx + 35, 380)
        
        # Draw silhouette
        cv2.circle(frame, head_pos, 26, (40, 50, 70), -1, cv2.LINE_AA)
        neck_pt = ((shoulder_l[0] + shoulder_r[0]) // 2, (shoulder_l[1] + shoulder_r[1]) // 2)
        cv2.line(frame, head_pos, neck_pt, (50, 60, 80), 10, cv2.LINE_AA)
        pts = np.array([shoulder_l, shoulder_r, hip_r, hip_l], np.int32)
        cv2.fillPoly(frame, [pts], (70, 85, 110), cv2.LINE_AA)
        cv2.line(frame, hip_l, knee_l, (60, 75, 100), 12, cv2.LINE_AA)
        cv2.line(frame, hip_r, knee_r, (60, 75, 100), 12, cv2.LINE_AA)
        cv2.line(frame, knee_l, (knee_l[0], 450), (60, 75, 100), 10, cv2.LINE_AA)
        cv2.line(frame, knee_r, (knee_r[0], 450), (60, 75, 100), 10, cv2.LINE_AA)
        
        # Label overlay
        cv2.rectangle(frame, (15, 15), (w - 15, 55), (255, 255, 255), -1)
        cv2.rectangle(frame, (15, 15), (w - 15, 55), (200, 210, 225), 1)
        cv2.putText(frame, f"TEST VIDEO: {phase_label}", (25, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (30, 41, 59), 2, cv2.LINE_AA)
        
        out.write(frame)
        
    out.release()
    print(f"Generated sample video with {total_frames} frames saved to {output_path}")

if __name__ == "__main__":
    generate_sample_video()
