import os
import math
import joblib
import numpy as np

class PostureClassifier:
    def __init__(self, model_path="data/posture_rf_model.pkl"):
        # Resolve path relative to backend directory
        if not os.path.isabs(model_path):
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.model_path = os.path.join(base_dir, model_path)
        else:
            self.model_path = model_path
            
        self.model_bundle = None
        self.is_ml_mode = False
        
        if os.path.exists(self.model_path):
            try:
                self.model_bundle = joblib.load(self.model_path)
                self.rf_model = self.model_bundle["model"]
                self.label_encoder = self.model_bundle["label_encoder"]
                self.feature_cols = self.model_bundle["feature_cols"]
                self.class_names = self.model_bundle["class_names"]
                self.is_ml_mode = True
                print(f"[PostureClassifier] ML Model loaded successfully from {self.model_path}")
            except Exception as e:
                print(f"[PostureClassifier] Error loading ML model: {e}. Falling back to Rule-Based Mode.")
        else:
            print(f"[PostureClassifier] Model file not found at {self.model_path}. Running in DEMO / RULE-BASED MODE.")

    @staticmethod
    def calculate_angle_2d(p1, p2, p3):
        """Calculates internal angle between vectors p1-p2 and p3-p2 in degrees (0 to 180)."""
        v1 = np.array([p1["x"] - p2["x"], p1["y"] - p2["y"]])
        v2 = np.array([p3["x"] - p2["x"], p3["y"] - p2["y"]])
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 180.0
        cos_theta = np.dot(v1, v2) / (norm1 * norm2)
        cos_theta = np.clip(cos_theta, -1.0, 1.0)
        return float(np.degrees(np.arccos(cos_theta)))

    def extract_angles(self, lm_pixel):
        """
        Extracts key biomechanical joint angles from pixel landmarks.
        """
        ls = lm_pixel["LEFT_SHOULDER"]
        rs = lm_pixel["RIGHT_SHOULDER"]
        le = lm_pixel["LEFT_EAR"]
        re = lm_pixel["RIGHT_EAR"]
        lh = lm_pixel["LEFT_HIP"]
        rh = lm_pixel["RIGHT_HIP"]
        lk = lm_pixel.get("LEFT_KNEE", lh)
        rk = lm_pixel.get("RIGHT_KNEE", rh)
        la = lm_pixel.get("LEFT_ANKLE", lk)
        ra = lm_pixel.get("RIGHT_ANKLE", rk)
        
        # Determine dominant visible side
        left_vis = (ls["visibility"] + le["visibility"] + lh["visibility"]) / 3
        right_vis = (rs["visibility"] + re["visibility"] + rh["visibility"]) / 3
        use_left = left_vis >= right_vis
        
        sh = ls if use_left else rs
        ear = le if use_left else re
        hip = lh if use_left else rh
        knee = lk if use_left else rk
        ankle = la if use_left else ra
        
        # 1. Craniovertebral Angle (CVA)
        # Angle from shoulder to ear relative to horizontal
        dx_ear = abs(ear["x"] - sh["x"])
        dy_ear = abs(sh["y"] - ear["y"]) # Note image y is inverted (top to bottom)
        cva = math.degrees(math.atan2(dy_ear, dx_ear)) if dx_ear > 0 else 90.0
        cva = round(float(np.clip(cva, 15.0, 85.0)), 2)
        
        # 2. Trunk Inclination Angle
        # Angle of spine line (mid-hip to mid-shoulder) relative to vertical
        mid_sh_x = (ls["x"] + rs["x"]) / 2.0
        mid_sh_y = (ls["y"] + rs["y"]) / 2.0
        mid_hp_x = (lh["x"] + rh["x"]) / 2.0
        mid_hp_y = (lh["y"] + rh["y"]) / 2.0
        
        dx_trunk = abs(mid_sh_x - mid_hp_x)
        dy_trunk = abs(mid_hp_y - mid_sh_y) # vertical distance
        trunk_inclination = math.degrees(math.atan2(dx_trunk, dy_trunk)) if dy_trunk > 0 else 0.0
        trunk_inclination = round(float(np.clip(trunk_inclination, 0.0, 85.0)), 2)
        
        # 3. Shoulder Tilt (Frontal plane asymmetry)
        dx_sh = abs(ls["x"] - rs["x"])
        dy_sh = abs(ls["y"] - rs["y"])
        shoulder_tilt = math.degrees(math.atan2(dy_sh, dx_sh)) if dx_sh > 0 else 0.0
        shoulder_tilt = round(float(np.clip(shoulder_tilt, 0.0, 35.0)), 2)
        
        # 4. Lateral Spine Tilt (Side leaning)
        lateral_tilt = round(float(np.clip(trunk_inclination if abs(ls["x"] - rs["x"]) > 10 else 0.0, 0.0, 30.0)), 2)
        # If frontal view (both shoulders visible), lateral tilt is difference in shoulder-hip vertical offsets
        if abs(ls["x"] - rs["x"]) > 30:
            left_side_len = math.hypot(ls["x"] - lh["x"], ls["y"] - lh["y"])
            right_side_len = math.hypot(rs["x"] - rh["x"], rs["y"] - rh["y"])
            if max(left_side_len, right_side_len) > 0:
                side_diff_pct = abs(left_side_len - right_side_len) / max(left_side_len, right_side_len)
                lateral_tilt = round(float(side_diff_pct * 40.0), 2)
                
        # 5. Hip Flexion (Shoulder - Hip - Knee)
        hip_flexion = round(self.calculate_angle_2d(sh, hip, knee), 2)
        
        # 6. Knee Flexion (Hip - Knee - Ankle)
        has_lower_body = knee["visibility"] > 0.35 and ankle["visibility"] > 0.35
        knee_flexion = round(self.calculate_angle_2d(hip, knee, ankle), 2) if has_lower_body else 175.0
        
        # 7. Neck Flexion
        # Angle between trunk vector and neck vector
        neck_flexion = round(float(abs(90.0 - cva) * 0.75 + trunk_inclination * 0.25), 2)
        
        # 8. Shoulder-Hip Asymmetry Ratio
        shoulder_hip_ratio = round(float(shoulder_tilt / (lateral_tilt + 0.1)), 3)
        
        return {
            "craniovertebral_angle": cva,
            "trunk_inclination": trunk_inclination,
            "shoulder_tilt": shoulder_tilt,
            "lateral_tilt": lateral_tilt,
            "hip_flexion": hip_flexion,
            "knee_flexion": knee_flexion,
            "neck_flexion": neck_flexion,
            "shoulder_hip_ratio": shoulder_hip_ratio,
            "has_lower_body": has_lower_body
        }

    def classify_rule_based(self, angles):
        """
        Deterministic, validated biomechanical baseline for when ML model is absent or comparison.
        """
        cva = angles["craniovertebral_angle"]
        trunk = angles["trunk_inclination"]
        sh_tilt = angles["shoulder_tilt"]
        lat_tilt = angles["lateral_tilt"]
        hip = angles["hip_flexion"]
        knee = angles["knee_flexion"]
        
        # Check bending / lifting first (dynamic or sagittal trunk displacement)
        if trunk > 32.0 or hip < 125.0:
            if knee > 155.0:
                return "Incorrect Forward Bending", 0.92
            else:
                return "Incorrect Lifting Posture", 0.88
                
        # Check lateral asymmetry
        if lat_tilt >= 7.0:
            return "Left / Right Side Leaning", 0.89
            
        if sh_tilt >= 5.5:
            return "Uneven Shoulder Alignment", 0.90
            
        # Check sagittal head/spine posture
        if cva < 46.0 and trunk > 15.0:
            return "Slouching / Rounded Back", 0.91
            
        if cva < 46.0:
            return "Forward Head Posture", 0.93
            
        return "Good Posture", 0.95

    def compute_ergonomic_score(self, angles, category):
        """
        Calculates a clinical 0-100 Posture Assessment Score based on RULA/REBA angle penalties.
        """
        score = 100.0
        penalties = {}
        
        # 1. CVA Penalty (Optimal: 53-65 deg)
        cva = angles["craniovertebral_angle"]
        if cva < 50.0:
            cva_pen = min(25.0, (50.0 - cva) * 1.0)
            score -= cva_pen
            penalties["cva_penalty"] = round(cva_pen, 1)
            
        # 2. Trunk Inclination Penalty (Optimal: 0-10 deg in static, smooth in bend)
        trunk = angles["trunk_inclination"]
        if trunk > 12.0:
            trunk_pen = min(25.0, (trunk - 12.0) * 0.7)
            score -= trunk_pen
            penalties["trunk_penalty"] = round(trunk_pen, 1)
            
        # 3. Shoulder Asymmetry Penalty (Optimal: < 3 deg)
        sh_tilt = angles["shoulder_tilt"]
        if sh_tilt > 3.5:
            sh_pen = min(20.0, (sh_tilt - 3.5) * 1.5)
            score -= sh_pen
            penalties["shoulder_penalty"] = round(sh_pen, 1)
            
        # 4. Lateral Tilt Penalty (Optimal: < 3.5 deg)
        lat_tilt = angles["lateral_tilt"]
        if lat_tilt > 4.0:
            lat_pen = min(20.0, (lat_tilt - 4.0) * 1.4)
            score -= lat_pen
            penalties["lateral_penalty"] = round(lat_pen, 1)
            
        # 5. Lifting / Bending hazardous spinal loading
        if category in ["Incorrect Forward Bending", "Incorrect Lifting Posture"]:
            score -= 15.0
            penalties["biomechanical_load_penalty"] = 15.0
            
        final_score = int(round(np.clip(score, 15.0, 100.0)))
        
        # Status rating
        if final_score >= 85:
            status = "Good"
            rating = "Optimal / Acceptable Posture"
        elif final_score >= 68:
            status = "Warning"
            rating = "Moderate Postural Fatigue"
        else:
            status = "Alert"
            rating = "High Ergonomic Risk"
            
        return final_score, status, rating, penalties

    def get_ergonomic_feedback(self, category, angles, score):
        """
        Returns structured ergonomic concerns and personalized corrective exercises.
        """
        concerns = []
        recommendations = []
        
        cva = angles["craniovertebral_angle"]
        trunk = angles["trunk_inclination"]
        sh_tilt = angles["shoulder_tilt"]
        lat_tilt = angles["lateral_tilt"]
        
        if cva < 50.0 or category in ["Forward Head Posture", "Slouching / Rounded Back"]:
            concerns.append(f"Forward head displacement (Craniovertebral Angle {cva}° vs normal >50°), increasing cervical spine shear strain by up to 300%.")
            recommendations.append({
                "title": "Chin Tucks (Cervical Retraction)",
                "duration": "10 reps x 5s hold, 3 sets daily",
                "purpose": "Strengthens deep neck flexors and relieves suboccipital compression.",
                "area": "Cervical Spine"
            })
            
        if trunk > 15.0 or category in ["Slouching / Rounded Back"]:
            concerns.append(f"Excessive thoracic flexion (Trunk Inclination {trunk}°), leading to rounded shoulders and decreased lung tidal volume.")
            recommendations.append({
                "title": "Doorway Pectoral Stretch & Thoracic Extensions",
                "duration": "30s hold x 3 sets",
                "purpose": "Opens tight pectoralis minor and restores natural thoracic kyphosis curve.",
                "area": "Thoracic & Chest"
            })
            
        if sh_tilt > 4.5 or category == "Uneven Shoulder Alignment":
            concerns.append(f"Shoulder elevation asymmetry ({sh_tilt}° tilt), suggesting unilateral upper trapezius or levator scapulae hypertonicity.")
            recommendations.append({
                "title": "Unilateral Trapezius Stretch & Scapular Squeezes",
                "duration": "20s hold per side, 3 reps",
                "purpose": "Balances bilateral shoulder girdle muscle recruitment and alleviates neck tension.",
                "area": "Shoulders & Upper Back"
            })
            
        if lat_tilt > 5.0 or category == "Left / Right Side Leaning":
            concerns.append(f"Lateral spinal deviation ({lat_tilt}° lateral tilt), distributing asymmetric compressive force across lumbar intervertebral discs.")
            recommendations.append({
                "title": "Side Planks & Quadratus Lumborum Release",
                "duration": "20-30s per side, 3 sets",
                "purpose": "Activates lateral core stabilizers and aligns the pelvis-lumbar axis.",
                "area": "Core & Lumbar Spine"
            })
            
        if category == "Incorrect Forward Bending":
            concerns.append("Spinal flexion bending with straight knees, placing extreme mechanical shear force (>3000N) on L4-S1 lumbar discs.")
            recommendations.append({
                "title": "Hip Hinge Re-education & Hamstring Mobility",
                "duration": "12 controlled reps x 3 sets",
                "purpose": "Teaches proper posterior chain hinge mechanism to protect the lower spine.",
                "area": "Hips & Lumbar Spine"
            })
            
        if category == "Incorrect Lifting Posture":
            concerns.append("Insufficient knee flexion during load lifting, transferring ground reaction moments directly to the lumbar spine.")
            recommendations.append({
                "title": "Squat-to-Stand Drill & Neutral Lumbar Lift Practice",
                "duration": "10 reps x 3 sets",
                "purpose": "Trains gluteal and quadriceps power initiation while keeping spine neutral and load close to body.",
                "area": "Lower Body & Core"
            })
            
        if not concerns:
            concerns.append("No significant musculoskeletal postural deformities detected. Biomechanical angles are within healthy parameters.")
            recommendations.append({
                "title": "Postural Maintenance & Ergonomic Micro-breaks",
                "duration": "Every 45 minutes of prolonged positioning",
                "purpose": "Preserves healthy neuromuscular tone and prevents static postural fatigue.",
                "area": "Full Body"
            })
            
        return concerns, recommendations

    def analyze(self, landmarks_pixel):
        """
        Complete end-to-end analysis of landmarks.
        Returns:
            dict of features, category, confidence, mode, score, status, rating, concerns, recommendations.
        """
        angles = self.extract_angles(landmarks_pixel)
        
        # Classification
        if self.is_ml_mode:
            try:
                feature_vector = np.array([[
                    angles["craniovertebral_angle"],
                    angles["trunk_inclination"],
                    angles["shoulder_tilt"],
                    angles["lateral_tilt"],
                    angles["hip_flexion"],
                    angles["knee_flexion"],
                    angles["neck_flexion"],
                    angles["shoulder_hip_ratio"]
                ]])
                pred_idx = self.rf_model.predict(feature_vector)[0]
                category = self.class_names[pred_idx]
                probs = self.rf_model.predict_proba(feature_vector)[0]
                confidence = float(probs[pred_idx])
                mode_str = "ML Model (Random Forest)"
            except Exception as e:
                category, confidence = self.classify_rule_based(angles)
                mode_str = f"Rule-Based Baseline (Fallback: {e})"
        else:
            category, confidence = self.classify_rule_based(angles)
            mode_str = "DEMO MODE (Biomechanical Rule-Based Baseline)"
            
        score, status, rating, penalties = self.compute_ergonomic_score(angles, category)
        concerns, recommendations = self.get_ergonomic_feedback(category, angles, score)
        
        # Alignment breakdowns for dashboard cards
        alignments = {
            "neck": {
                "name": "Neck & Cervical Alignment",
                "angle": angles["craniovertebral_angle"],
                "unit": "°",
                "normal_range": "50° - 65°",
                "status": "Good" if angles["craniovertebral_angle"] >= 50 else ("Warning" if angles["craniovertebral_angle"] >= 45 else "Alert"),
                "description": "Craniovertebral angle measuring head forward protrusion."
            },
            "shoulder": {
                "name": "Shoulder Girdle Alignment",
                "angle": angles["shoulder_tilt"],
                "unit": "°",
                "normal_range": "< 4.0°",
                "status": "Good" if angles["shoulder_tilt"] < 4.0 else ("Warning" if angles["shoulder_tilt"] < 6.5 else "Alert"),
                "description": "Bilateral clavicle horizontal parity."
            },
            "torso": {
                "name": "Torso / Spine Inclination",
                "angle": angles["trunk_inclination"],
                "unit": "°",
                "normal_range": "< 12.0°",
                "status": "Good" if angles["trunk_inclination"] < 12.0 else ("Warning" if angles["trunk_inclination"] < 25.0 else "Alert"),
                "description": "Deviation of spinal axis from true vertical."
            },
            "hip_knee": {
                "name": "Pelvis & Lower Extremities",
                "angle": angles["hip_flexion"],
                "unit": "°",
                "normal_range": "160° - 180°",
                "status": "Good" if angles["hip_flexion"] >= 150 else ("Warning" if angles["hip_flexion"] >= 120 else "Alert"),
                "description": "Hip-thigh articulation and sagittal bending angle."
            }
        }
        
        return {
            "category": category,
            "confidence": round(confidence * 100, 1),
            "mode": mode_str,
            "is_ml_mode": self.is_ml_mode,
            "score": score,
            "status": status,
            "rating": rating,
            "angles": angles,
            "alignments": alignments,
            "concerns": concerns,
            "recommendations": recommendations,
            "penalties": penalties
        }
