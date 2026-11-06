import os
import io
import json
import sqlite3
import uuid
from datetime import datetime
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import base64

from pose_detector import PoseDetector
from posture_classifier import PostureClassifier
from video_processor import VideoProcessor
from pdf_generator import generate_posture_pdf

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
DATA_DIR = os.path.join(BASE_DIR, "data")
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")
DB_PATH = os.path.join(BASE_DIR, "posture_history.db")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)

# Initialize CV & ML Modules
detector = PoseDetector(model_path=os.path.join(DATA_DIR, "pose_landmarker_lite.task"))
classifier = PostureClassifier(model_path=os.path.join(DATA_DIR, "posture_rf_model.pkl"))
video_proc = VideoProcessor(detector, classifier)

# Initialize SQLite DB
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS analysis_history (
            id TEXT PRIMARY KEY,
            created_at TEXT,
            input_type TEXT,
            filename TEXT,
            category TEXT,
            score INTEGER,
            status TEXT,
            mode TEXT,
            summary TEXT,
            details_json TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

ALLOWED_IMAGE_EXTS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_VIDEO_EXTS = {"mp4", "mov", "avi", "webm", "m4v"}

def allowed_file(filename, allowed_set):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_set

# --- Health & Info Endpoints ---
@app.route("/", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "POSTURE AI Analysis API",
        "ml_model_loaded": classifier.is_ml_mode,
        "mode": classifier.analyze.__name__ if classifier.is_ml_mode else "Demo / Rule-Based Baseline"
    })

@app.route("/api/model-info", methods=["GET"])
def get_model_info():
    metadata_path = os.path.join(DATA_DIR, "model_metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            meta = json.load(f)
        return jsonify(meta)
    else:
        return jsonify({
            "status": "demo_mode",
            "message": "No trained model file found. Running in Biomechanical Rule-Based Demo Mode.",
            "classes": [
                "Good Posture", "Slouching / Rounded Back", "Forward Head Posture",
                "Uneven Shoulder Alignment", "Left / Right Side Leaning",
                "Incorrect Forward Bending", "Incorrect Lifting Posture"
            ]
        })

@app.route("/api/train", methods=["POST"])
def retrain_model():
    try:
        from train_model import train_and_evaluate
        meta = train_and_evaluate(
            dataset_path=os.path.join(DATA_DIR, "posture_dataset.csv"),
            output_dir=DATA_DIR
        )
        # Reload classifier
        global classifier, video_proc
        classifier = PostureClassifier(model_path=os.path.join(DATA_DIR, "posture_rf_model.pkl"))
        video_proc = VideoProcessor(detector, classifier)
        return jsonify({
            "success": True,
            "message": "Model retrained and loaded successfully!",
            "metadata": meta
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# --- Image Analysis Endpoint ---
@app.route("/analyze-image", methods=["POST"])
@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Please select an image file."}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400
        
    if not allowed_file(file.filename, ALLOWED_IMAGE_EXTS):
        return jsonify({"error": f"Invalid format. Supported image types: {', '.join(ALLOWED_IMAGE_EXTS)}"}), 400
        
    session_id = f"PAI-IMG-{uuid.uuid4().hex[:8].upper()}"
    filename = secure_filename(f"{session_id}_{file.filename}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    try:
        # Read image with OpenCV
        image = cv2.imread(filepath)
        if image is None:
            return jsonify({"error": "Failed to decode image file. File may be corrupted."}), 400
            
        h, w = image.shape[:2]
        
        # Detect pose
        detection = detector.detect_landmarks(image)
        if not detection["detected"]:
            return jsonify({
                "detected": False,
                "error": "No human body detected. Please ensure full upper body is clearly visible in the photo.",
                "visibility_warning": detection.get("visibility_warning")
            }), 422
            
        # Classify posture & compute biomechanical angles
        analysis = classifier.analyze(detection["landmarks_pixel"])
        
        # Generate annotated skeleton overlay image
        annotated_img = detector.draw_skeleton(
            image,
            detection["landmarks_pixel"],
            posture_status=analysis["status"]
        )
        
        # Encode annotated image to Base64 for instant frontend display
        _, buffer = cv2.imencode(".jpg", annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
        annotated_b64 = base64.b64encode(buffer).decode("utf-8")
        annotated_data_url = f"data:image/jpeg;base64,{annotated_b64}"
        
        summary_text = f"{analysis['category']} - Score {analysis['score']}/100 ({analysis['rating']})"
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Save analysis to database
        record_payload = {
            "id": session_id,
            "created_at": created_at,
            "input_type": "image",
            "filename": file.filename,
            "category": analysis["category"],
            "score": analysis["score"],
            "status": analysis["status"],
            "mode": analysis["mode"],
            "angles": analysis["angles"],
            "alignments": analysis["alignments"],
            "concerns": analysis["concerns"],
            "recommendations": analysis["recommendations"],
            "penalties": analysis["penalties"],
            "visibility_warning": detection["visibility_warning"],
            "num_people": detection["num_people"]
        }
        
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO analysis_history (id, created_at, input_type, filename, category, score, status, mode, summary, details_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id, created_at, "image", file.filename,
            analysis["category"], analysis["score"], analysis["status"],
            analysis["mode"], summary_text, json.dumps(record_payload)
        ))
        conn.commit()
        conn.close()
        
        # Response
        return jsonify({
            "id": session_id,
            "detected": True,
            "created_at": created_at,
            "category": analysis["category"],
            "confidence": analysis["confidence"],
            "score": analysis["score"],
            "status": analysis["status"],
            "rating": analysis["rating"],
            "mode": analysis["mode"],
            "is_ml_mode": analysis["is_ml_mode"],
            "angles": analysis["angles"],
            "alignments": analysis["alignments"],
            "concerns": analysis["concerns"],
            "recommendations": analysis["recommendations"],
            "penalties": analysis["penalties"],
            "visibility_warning": detection["visibility_warning"],
            "num_people": detection["num_people"],
            "annotated_image": annotated_data_url,
            "image_dims": {"width": w, "height": h}
        })
        
    finally:
        # Cleanup uploaded original file to prevent disk exhaustion
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass

# --- Video Analysis Endpoint ---
@app.route("/analyze-video", methods=["POST"])
@app.route("/api/analyze-video", methods=["POST"])
def analyze_video():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Please select a video file."}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400
        
    if not allowed_file(file.filename, ALLOWED_VIDEO_EXTS):
        return jsonify({"error": f"Invalid format. Supported video types: {', '.join(ALLOWED_VIDEO_EXTS)}"}), 400
        
    session_id = f"PAI-VID-{uuid.uuid4().hex[:8].upper()}"
    filename = secure_filename(f"{session_id}_{file.filename}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    try:
        # Process video frames across time
        result = video_proc.process_video(filepath, max_frames=120, target_fps=3)
        
        if not result.get("detected"):
            return jsonify({
                "detected": False,
                "error": result.get("error", "No visible subject detected in the video.")
            }), 422
            
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        summary_text = f"{result['dominant_posture']} (Dominant) - Avg Score {result['average_score']}/100"
        
        # Save to database
        record_payload = {
            "id": session_id,
            "created_at": created_at,
            "input_type": "video",
            "filename": file.filename,
            "category": result["dominant_posture"],
            "score": result["average_score"],
            "status": result["overall_status"],
            "mode": "Temporal Multi-Frame Analysis",
            "concerns": result["concerns"],
            "recommendations": result["recommendations"],
            "category_breakdown": result["category_breakdown"],
            "duration_sec": result["duration_sec"],
            "total_frames_analyzed": result["total_frames_analyzed"]
        }
        
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO analysis_history (id, created_at, input_type, filename, category, score, status, mode, summary, details_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id, created_at, "video", file.filename,
            result["dominant_posture"], result["average_score"], result["overall_status"],
            "Temporal Multi-Frame Analysis", summary_text, json.dumps(record_payload)
        ))
        conn.commit()
        conn.close()
        
        result["id"] = session_id
        result["created_at"] = created_at
        return jsonify(result)
        
    finally:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass

# --- History & Reports Endpoints ---
@app.route("/analysis-history", methods=["GET"])
@app.route("/api/analysis-history", methods=["GET"])
def get_analysis_history():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT id, created_at, input_type, filename, category, score, status, mode, summary, details_json
        FROM analysis_history
        ORDER BY created_at DESC
        LIMIT 50
    """)
    rows = cur.fetchall()
    conn.close()
    
    history_list = []
    for r in rows:
        item = dict(r)
        try:
            item["details"] = json.loads(item["details_json"])
        except Exception:
            item["details"] = {}
        history_list.append(item)
        
    return jsonify(history_list)

@app.route("/analysis-report/<report_id>", methods=["GET"])
@app.route("/api/analysis-report/<report_id>", methods=["GET"])
def download_analysis_report(report_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM analysis_history WHERE id = ?", (report_id,))
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return jsonify({"error": f"Report ID '{report_id}' not found."}), 404
        
    record = dict(row)
    try:
        details = json.loads(record["details_json"])
        record.update(details)
    except Exception:
        pass
        
    pdf_bytes = generate_posture_pdf(record)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"posture_ai_report_{report_id}.pdf"
    )

# --- Sample Images Generator / Server ---
@app.route("/api/sample-images", methods=["GET"])
def list_sample_images():
    samples = [
        {
            "id": "good_standing",
            "name": "Good Upright Standing",
            "category": "Good Posture",
            "description": "Balanced cervical alignment, level shoulders, neutral spine."
        },
        {
            "id": "slouching_seated",
            "name": "Slouching & Rounded Back",
            "category": "Slouching / Rounded Back",
            "description": "Forward thoracic flexion, elevated neck strain, posterior pelvis tilt."
        },
        {
            "id": "forward_head",
            "name": "Forward Head & Tech Neck",
            "category": "Forward Head Posture",
            "description": "Protracted cervical spine, decreased Craniovertebral Angle."
        },
        {
            "id": "uneven_shoulders",
            "name": "Uneven Shoulder Asymmetry",
            "category": "Uneven Shoulder Alignment",
            "description": "Lateral clavicle height discrepancy, unilateral muscle elevation."
        }
    ]
    return jsonify(samples)

@app.route("/api/sample-image/<sample_id>", methods=["GET"])
def get_sample_image(sample_id):
    sample_file = os.path.join(SAMPLES_DIR, f"{sample_id}.jpg")
    if not os.path.exists(sample_file):
        img = create_synthetic_posture_image(sample_id)
        cv2.imwrite(sample_file, img)
    return send_file(sample_file, mimetype="image/jpeg")

@app.route("/api/sample-video", methods=["GET"])
def get_sample_video():
    video_file = os.path.join(SAMPLES_DIR, "sample_posture_video.mp4")
    if not os.path.exists(video_file):
        from create_sample_video import generate_sample_video
        generate_sample_video(video_file)
    return send_file(video_file, mimetype="video/mp4")

def create_synthetic_posture_image(sample_id):
    """Generates an aesthetic stylized anatomical posture illustration test card."""
    h, w = 720, 540
    img = np.full((h, w, 3), (245, 247, 250), dtype=np.uint8) # Soft light gray
    
    # Grid lines
    for y in range(0, h, 40):
        cv2.line(img, (0, y), (w, y), (230, 235, 240), 1)
    for x in range(0, w, 40):
        cv2.line(img, (x, 0), (x, h), (230, 235, 240), 1)
        
    cx = w // 2
    
    # Configure anatomical joints based on sample_id
    if sample_id == "slouching_seated":
        head_pos = (cx + 55, 180)
        shoulder_l = (cx - 45, 240)
        shoulder_r = (cx + 35, 245)
        hip_l = (cx - 50, 420)
        hip_r = (cx + 30, 420)
        knee_l = (cx - 50, 560)
        knee_r = (cx + 30, 560)
    elif sample_id == "forward_head":
        head_pos = (cx + 70, 160)
        shoulder_l = (cx - 50, 230)
        shoulder_r = (cx + 30, 230)
        hip_l = (cx - 45, 410)
        hip_r = (cx + 35, 410)
        knee_l = (cx - 45, 570)
        knee_r = (cx + 35, 570)
    elif sample_id == "uneven_shoulders":
        head_pos = (cx, 150)
        shoulder_l = (cx - 65, 210) # Elevated left shoulder
        shoulder_r = (cx + 65, 260) # Depressed right shoulder
        hip_l = (cx - 50, 410)
        hip_r = (cx + 50, 410)
        knee_l = (cx - 50, 570)
        knee_r = (cx + 50, 570)
    else: # good_standing
        head_pos = (cx, 150)
        shoulder_l = (cx - 60, 225)
        shoulder_r = (cx + 60, 225)
        hip_l = (cx - 45, 410)
        hip_r = (cx + 45, 410)
        knee_l = (cx - 45, 570)
        knee_r = (cx + 45, 570)
        
    # Draw body silhouette
    # Head
    cv2.circle(img, head_pos, 35, (40, 50, 70), -1, cv2.LINE_AA)
    # Neck
    neck_bottom = ((shoulder_l[0] + shoulder_r[0]) // 2, (shoulder_l[1] + shoulder_r[1]) // 2)
    cv2.line(img, head_pos, neck_bottom, (50, 60, 80), 12, cv2.LINE_AA)
    # Torso
    pts = np.array([shoulder_l, shoulder_r, hip_r, hip_l], np.int32)
    cv2.fillPoly(img, [pts], (70, 85, 110), cv2.LINE_AA)
    # Arms
    cv2.line(img, shoulder_l, (shoulder_l[0] - 25, 340), (60, 75, 100), 10, cv2.LINE_AA)
    cv2.line(img, shoulder_r, (shoulder_r[0] + 25, 340), (60, 75, 100), 10, cv2.LINE_AA)
    # Legs
    cv2.line(img, hip_l, knee_l, (60, 75, 100), 14, cv2.LINE_AA)
    cv2.line(img, hip_r, knee_r, (60, 75, 100), 14, cv2.LINE_AA)
    cv2.line(img, knee_l, (knee_l[0], 680), (60, 75, 100), 12, cv2.LINE_AA)
    cv2.line(img, knee_r, (knee_r[0], 680), (60, 75, 100), 12, cv2.LINE_AA)
    
    # Title badge
    cv2.rectangle(img, (20, 20), (w - 20, 70), (255, 255, 255), -1)
    cv2.rectangle(img, (20, 20), (w - 20, 70), (200, 210, 225), 1)
    cv2.putText(img, f"POSTURE AI SAMPLE: {sample_id.upper()}", (35, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (30, 41, 59), 2, cv2.LINE_AA)
    
    return img

if __name__ == "__main__":
    print("[POSTURE AI] Server starting on http://127.0.0.1:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=False)
