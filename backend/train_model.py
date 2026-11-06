import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

FEATURE_COLS = [
    "craniovertebral_angle",
    "trunk_inclination",
    "shoulder_tilt",
    "lateral_tilt",
    "hip_flexion",
    "knee_flexion",
    "neck_flexion",
    "shoulder_hip_ratio"
]

def train_and_evaluate(dataset_path="data/posture_dataset.csv", output_dir="data"):
    print("=" * 60)
    print("POSTURE AI: MODEL TRAINING & BENCHMARKING PIPELINE")
    print("=" * 60)
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found at {dataset_path}")
        
    df = pd.read_csv(dataset_path)
    print(f"Loaded dataset: {len(df)} samples, {df.shape[1]} columns.")
    
    # Handle missing values
    null_counts = df[FEATURE_COLS].isnull().sum().sum()
    if null_counts > 0:
        print(f"Handling {null_counts} missing values using median imputation...")
        df[FEATURE_COLS] = df[FEATURE_COLS].fillna(df[FEATURE_COLS].median())
    else:
        print("Dataset clean: 0 missing values.")
        
    X = df[FEATURE_COLS].values
    y_raw = df["posture_category"].values
    
    # Encode labels
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    class_names = list(label_encoder.classes_)
    print(f"Target classes ({len(class_names)}): {class_names}")
    
    # Split train/test by participant if participant_id exists
    if "participant_id" in df.columns:
        print("\nPerforming Participant-Aware Group Train/Test Split (GroupShuffleSplit)...")
        groups = df["participant_id"].values
        gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
        train_idx, test_idx = next(gss.split(X, y, groups))
        print(f"Unique participants - Train: {len(set(groups[train_idx]))}, Test: {len(set(groups[test_idx]))}")
    else:
        print("\nStandard Train/Test Split (80/20)...")
        from sklearn.model_selection import train_test_split
        train_idx, test_idx = train_test_split(np.arange(len(X)), test_size=0.2, random_state=42, stratify=y)
        
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]
    
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")
    
    # Train Random Forest Classifier
    print("\n--- Training Random Forest Classifier ---")
    rf = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    
    rf_acc = accuracy_score(y_test, y_pred_rf)
    rf_prec = precision_score(y_test, y_pred_rf, average="weighted")
    rf_rec = recall_score(y_test, y_pred_rf, average="weighted")
    rf_f1 = f1_score(y_test, y_pred_rf, average="weighted")
    rf_cm = confusion_matrix(y_test, y_pred_rf).tolist()
    
    print(f"Random Forest Accuracy:  {rf_acc * 100:.2f}%")
    print(f"Random Forest Precision: {rf_prec * 100:.2f}%")
    print(f"Random Forest Recall:    {rf_rec * 100:.2f}%")
    print(f"Random Forest F1-Score:  {rf_f1 * 100:.2f}%")
    
    # Feature Importances
    feature_importances = dict(zip(FEATURE_COLS, [round(float(v), 4) for v in rf.feature_importances_]))
    print("\nFeature Importances (RF):")
    for feat, imp in sorted(feature_importances.items(), key=lambda item: item[1], reverse=True):
        print(f"  - {feat:25s}: {imp:.4f}")
        
    # Train SVM for comparison
    print("\n--- Training Support Vector Machine (SVM) ---")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    svm = SVC(kernel="rbf", C=1.5, gamma="scale", probability=True, random_state=42)
    svm.fit(X_train_scaled, y_train)
    y_pred_svm = svm.predict(X_test_scaled)
    
    svm_acc = accuracy_score(y_test, y_pred_svm)
    svm_prec = precision_score(y_test, y_pred_svm, average="weighted")
    svm_rec = recall_score(y_test, y_pred_svm, average="weighted")
    svm_f1 = f1_score(y_test, y_pred_svm, average="weighted")
    svm_cm = confusion_matrix(y_test, y_pred_svm).tolist()
    
    print(f"SVM Accuracy:  {svm_acc * 100:.2f}%")
    print(f"SVM Precision: {svm_prec * 100:.2f}%")
    print(f"SVM Recall:    {svm_rec * 100:.2f}%")
    print(f"SVM F1-Score:  {svm_f1 * 100:.2f}%")
    
    # Save Random Forest Model bundle
    os.makedirs(output_dir, exist_ok=True)
    model_bundle = {
        "model": rf,
        "feature_cols": FEATURE_COLS,
        "label_encoder": label_encoder,
        "class_names": class_names,
        "model_type": "RandomForestClassifier",
        "n_features": len(FEATURE_COLS)
    }
    model_path = os.path.join(output_dir, "posture_rf_model.pkl")
    joblib.dump(model_bundle, model_path)
    print(f"\nTrained model successfully saved to: {model_path}")
    
    # Save detailed evaluation metadata for API and UI
    metadata = {
        "status": "trained",
        "model_type": "Random Forest Classifier",
        "comparison_model": "Support Vector Machine (RBF)",
        "features": FEATURE_COLS,
        "class_names": class_names,
        "training_samples": int(len(X_train)),
        "testing_samples": int(len(X_test)),
        "participant_split": True,
        "metrics": {
            "random_forest": {
                "accuracy": round(float(rf_acc), 4),
                "precision": round(float(rf_prec), 4),
                "recall": round(float(rf_rec), 4),
                "f1_score": round(float(rf_f1), 4),
                "confusion_matrix": rf_cm
            },
            "svm": {
                "accuracy": round(float(svm_acc), 4),
                "precision": round(float(svm_prec), 4),
                "recall": round(float(svm_rec), 4),
                "f1_score": round(float(svm_f1), 4),
                "confusion_matrix": svm_cm
            }
        },
        "feature_importances": feature_importances
    }
    
    metadata_path = os.path.join(output_dir, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Model metadata & comparison benchmarks saved to: {metadata_path}")
    print("=" * 60)
    return metadata

if __name__ == "__main__":
    train_and_evaluate()
