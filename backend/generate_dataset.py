import numpy as np
import pandas as pd
import os

def generate_posture_dataset(n_participants=35, samples_per_category=20, output_path="data/posture_dataset.csv"):
    """
    Generates a realistic synthetic biomechanical posture dataset based on ergonomic
    and clinical postural angle criteria (RULA/REBA & Craniovertebral Angle research).
    Includes participant IDs to enable group-based train/test splitting.
    """
    np.random.seed(42)
    categories = [
        "Good Posture",
        "Slouching / Rounded Back",
        "Forward Head Posture",
        "Uneven Shoulder Alignment",
        "Left / Right Side Leaning",
        "Incorrect Forward Bending",
        "Incorrect Lifting Posture"
    ]
    
    rows = []
    
    for p_idx in range(1, n_participants + 1):
        pid = f"PARTICIPANT_{p_idx:02d}"
        # Base participant variation (height/torso differences)
        p_cva_bias = np.random.normal(0, 1.5)
        p_trunk_bias = np.random.normal(0, 1.0)
        p_shoulder_bias = np.random.normal(0, 0.5)
        
        for cat in categories:
            for _ in range(samples_per_category):
                if cat == "Good Posture":
                    cva = np.random.normal(55.0, 3.0) + p_cva_bias
                    trunk = np.random.normal(4.0, 2.5) + p_trunk_bias
                    shoulder_tilt = np.abs(np.random.normal(1.2, 0.8) + p_shoulder_bias)
                    lateral_tilt = np.abs(np.random.normal(1.0, 0.7))
                    hip_flexion = np.random.normal(174.0, 3.5)
                    knee_flexion = np.random.normal(175.0, 3.0)
                    neck_flexion = np.random.normal(8.0, 3.0)
                
                elif cat == "Slouching / Rounded Back":
                    cva = np.random.normal(38.0, 4.0) + p_cva_bias
                    trunk = np.random.normal(22.0, 4.5) + p_trunk_bias
                    shoulder_tilt = np.abs(np.random.normal(2.5, 1.2))
                    lateral_tilt = np.abs(np.random.normal(2.0, 1.0))
                    hip_flexion = np.random.normal(145.0, 8.0)
                    knee_flexion = np.random.normal(160.0, 10.0)
                    neck_flexion = np.random.normal(32.0, 5.0)
                
                elif cat == "Forward Head Posture":
                    cva = np.random.normal(34.0, 3.5) + p_cva_bias # Severe forward head < 45
                    trunk = np.random.normal(7.0, 3.0) + p_trunk_bias # Trunk can be mostly upright
                    shoulder_tilt = np.abs(np.random.normal(2.0, 1.0))
                    lateral_tilt = np.abs(np.random.normal(1.5, 0.8))
                    hip_flexion = np.random.normal(170.0, 5.0)
                    knee_flexion = np.random.normal(172.0, 4.0)
                    neck_flexion = np.random.normal(38.0, 4.5) # High neck flexion
                
                elif cat == "Uneven Shoulder Alignment":
                    cva = np.random.normal(52.0, 4.0)
                    trunk = np.random.normal(5.0, 2.5)
                    shoulder_tilt = np.random.uniform(6.5, 16.0) # Noticeable asymmetry
                    lateral_tilt = np.abs(np.random.normal(3.0, 1.5))
                    hip_flexion = np.random.normal(173.0, 4.0)
                    knee_flexion = np.random.normal(174.0, 3.5)
                    neck_flexion = np.random.normal(11.0, 4.0)
                
                elif cat == "Left / Right Side Leaning":
                    cva = np.random.normal(50.0, 4.5)
                    trunk = np.random.normal(8.0, 3.0)
                    shoulder_tilt = np.random.uniform(4.0, 10.0)
                    lateral_tilt = np.random.uniform(7.5, 20.0) # High lateral spine tilt
                    hip_flexion = np.random.normal(170.0, 5.0)
                    knee_flexion = np.random.normal(172.0, 4.0)
                    neck_flexion = np.random.normal(15.0, 5.0)
                
                elif cat == "Incorrect Forward Bending":
                    cva = np.random.normal(45.0, 6.0)
                    trunk = np.random.normal(52.0, 8.0) # Deep trunk bend
                    shoulder_tilt = np.abs(np.random.normal(2.5, 1.5))
                    lateral_tilt = np.abs(np.random.normal(2.0, 1.2))
                    hip_flexion = np.random.normal(85.0, 12.0) # Sharp hip hinge with straight knees
                    knee_flexion = np.random.normal(170.0, 6.0) # Straight knees = hazardous spinal flexion
                    neck_flexion = np.random.normal(22.0, 6.0)
                
                elif cat == "Incorrect Lifting Posture":
                    cva = np.random.normal(42.0, 5.5)
                    trunk = np.random.normal(45.0, 7.5) # Heavy spinal flexion during lift
                    shoulder_tilt = np.abs(np.random.normal(3.0, 1.8))
                    lateral_tilt = np.abs(np.random.normal(2.8, 1.5))
                    hip_flexion = np.random.normal(105.0, 10.0)
                    knee_flexion = np.random.normal(135.0, 12.0) # Insufficient knee bend while lifting load
                    neck_flexion = np.random.normal(28.0, 6.0)
                
                # Biomechanical ratio
                shoulder_hip_ratio = round(float(shoulder_tilt / (lateral_tilt + 0.1)), 3)
                
                rows.append({
                    "participant_id": pid,
                    "craniovertebral_angle": round(float(np.clip(cva, 15.0, 75.0)), 2),
                    "trunk_inclination": round(float(np.clip(trunk, 0.0, 85.0)), 2),
                    "shoulder_tilt": round(float(np.clip(shoulder_tilt, 0.0, 30.0)), 2),
                    "lateral_tilt": round(float(np.clip(lateral_tilt, 0.0, 30.0)), 2),
                    "hip_flexion": round(float(np.clip(hip_flexion, 40.0, 180.0)), 2),
                    "knee_flexion": round(float(np.clip(knee_flexion, 60.0, 180.0)), 2),
                    "neck_flexion": round(float(np.clip(neck_flexion, 0.0, 60.0)), 2),
                    "shoulder_hip_ratio": shoulder_hip_ratio,
                    "posture_category": cat
                })
                
    df = pd.DataFrame(rows)
    # Shuffle rows
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated dataset with {len(df)} samples across {n_participants} participants saved to {output_path}")
    print("\nClass distribution:")
    print(df['posture_category'].value_counts())
    return df

if __name__ == "__main__":
    generate_posture_dataset()
