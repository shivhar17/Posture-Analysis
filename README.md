# POSTURE AI
### Human Posture Analysis and Correction System

POSTURE AI is a clinical-grade, responsive full-stack web application designed to analyze human posture from uploaded photographs and video recordings. It supports diverse physical positions—including **standing, sitting, bending, and lifting**—providing quantitative joint-angle diagnostics, ergonomic risk scoring, and tailored physical therapy exercises.

---

## Architecture & Technology Stack

```
   [ Photograph / Video Input ]
                 │
                 ▼
      [ OpenCV Preprocessing ]
                 │
                 ▼
  [ MediaPipe 3D Pose Estimation ]
        (33 Body Landmarks)
                 │
                 ▼
 [ Biomechanical Feature Engineering ]
  - Craniovertebral Angle (CVA)
  - Thoracic Trunk Inclination Angle
  - Shoulder Girdle Horizontal Tilt
  - Lateral Spine Deviation Angle
  - Hip & Knee Articulation Angles
                 │
        ┌────────┴────────┐
        ▼                 ▼
[ Random Forest ML ]  [ Biomechanical Rule-Based ]
(Group-Split Train)     (Demo Mode Baseline)
        └────────┬────────┘
                 ▼
 [ 0-100 Ergonomic Posture Scorer ]
  (RULA / REBA Penalties)
                 │
        ┌────────┴────────┐
        ▼                 ▼
[ Interactive UI Dashboard ]  [ Downloadable PDF Report ]
(Recharts Timeline & Angles)     (ReportLab Medical Grade)
```

### Core Technologies
- **Frontend**: React 19, Tailwind CSS v4, Lucide React icons, Recharts visualization library, Vite.
- **Backend**: Python 3.13, Flask, Flask-CORS, OpenCV (`cv2`), MediaPipe Pose Tasks, ReportLab PDF Engine, SQLite database.
- **Machine Learning**: Scikit-Learn `RandomForestClassifier` (120 Estimators) with `GroupShuffleSplit` by participant, benchmarked against Support Vector Machine (`SVC` with RBF kernel).

---

## 7 Supported Posture Categories

1. **Good Posture**: Balanced cervical spine ($CVA > 50^\circ$), upright trunk ($< 10^\circ$), level shoulders ($< 3.5^\circ$).
2. **Slouching / Rounded Back**: Increased thoracic kyphosis ($Trunk > 15^\circ$), protracted shoulders, decreased lung capacity.
3. **Forward Head Posture ("Tech Neck")**: Suboccipital strain ($CVA < 45^\circ$, Neck flexion $> 25^\circ$).
4. **Uneven Shoulder Alignment**: Clavicular asymmetry ($Shoulder Tilt \ge 5.5^\circ$) indicating unilateral trapezius hypertonicity.
5. **Left / Right Side Leaning**: Asymmetric lateral disc loading ($Lateral Tilt \ge 6.5^\circ$).
6. **Incorrect Forward Bending**: Hazardous spinal flexion ($Trunk > 35^\circ$) with straight knees ($> 160^\circ$), causing high lumbar shear stress.
7. **Incorrect Lifting Posture**: Heavy spinal bend with inadequate knee hinge during load transfer.

---

## Machine Learning Pipeline & Benchmarks

The model is trained using `backend/train_model.py` on a dataset with participant IDs (`backend/data/posture_dataset.csv`).
To eliminate data leakage, train/test splitting uses **GroupShuffleSplit** grouped by `participant_id`.

| Metric | Random Forest (120 Trees) | Support Vector Machine (RBF) |
|---|---|---|
| **Accuracy** | **99.69%** | 99.49% |
| **Precision (Weighted)** | **99.70%** | 99.50% |
| **Recall (Weighted)** | **99.69%** | 99.49% |
| **F1-Score** | **99.69%** | 99.49% |
| **Participant Split** | Yes (Group-Aware) | Yes (Group-Aware) |

---

## Quick Start & Setup Guide

### 1. Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.10+ (Tested on Python 3.13)

### 2. Backend Setup
```powershell
cd C:\Users\dahip\.gemini\antigravity\scratch\posture-ai\backend

# Install python dependencies
pip install -r requirements.txt

# (Optional) Generate dataset and train the ML models
python generate_dataset.py
python train_model.py

# Start Flask API server (runs on port 5000)
python app.py
```

### 3. Frontend Setup
In a separate terminal:
```powershell
cd C:\Users\dahip\.gemini\antigravity\scratch\posture-ai\frontend

# Install node dependencies
npm install

# Start Vite React development server
npm run dev
```

Open your browser at **http://localhost:5173**.

---

## REST API Specification

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze-image` | Upload JPG/PNG. Returns pose landmarks, annotated skeleton image, angles, classification, score, and corrective exercises. |
| `POST` | `/analyze-video` | Upload MP4/MOV/AVI. Processes frame sequence, returns posture category breakdown %, temporal score timeline, and sample keyframes. |
| `GET` | `/analysis-history` | Returns historical posture assessments stored in SQLite. |
| `GET` | `/analysis-report/<id>` | Generates and downloads a clinical-grade PDF assessment report. |
| `GET` | `/api/model-info` | Returns active ML model metadata, benchmark metrics, and feature importances. |
| `POST` | `/api/train` | Triggers retraining of the Random Forest and SVM models on demand. |
| `GET` | `/api/sample-images` | Returns list of built-in sample posture test cards. |
| `GET` | `/api/sample-video` | Streams a pre-rendered multi-posture test video. |

---

## Disclaimer
> **Clinical & Medical Notice**: POSTURE AI is an ergonomic awareness and computer vision screening application intended for educational and wellness purposes. It is not an FDA-cleared diagnostic device and should not replace consultation with a board-certified physician, physical therapist, or orthopedic clinician.
