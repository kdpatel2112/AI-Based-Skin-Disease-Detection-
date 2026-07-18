"""
Admin Dashboard endpoints: User Management, database edits, and background
model retraining management.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys
from typing import Literal

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import require_admin
from app.db.mongodb import users_collection, predictions_collection
from app.core.config import settings

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

# Global state to track model retraining task
RETRAIN_STATE = {
    "status": "idle",  # idle, training, completed, failed
    "started_at": None,
    "completed_at": None,
    "epochs": 0,
    "error": None,
}


class RoleUpdateRequest(BaseModel):
    role: Literal["user", "admin"]


class DiseaseUpdateRequest(BaseModel):
    description: str
    symptoms: list[str]
    causes: list[str]
    risk_factors: list[str]
    prevention: list[str]
    self_care: list[str]
    when_to_consult_doctor: list[str]
    emergency_signs: list[str]


@router.get("/users")
async def list_users(_admin: dict = Depends(require_admin)):
    cursor = users_collection.find({}, {"hashed_password": 0})
    users = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        users.append(doc)
    return users


@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, payload: RoleUpdateRequest, _admin: dict = Depends(require_admin)):
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": payload.role}}
    )
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    return {"message": f"User role updated to {payload.role}."}


@router.get("/diseases")
async def list_diseases(_admin: dict = Depends(require_admin)):
    path = Path(__file__).resolve().parent.parent.parent / "data" / "disease_info.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.put("/diseases/{disease_id}")
async def update_disease(disease_id: str, payload: DiseaseUpdateRequest, _admin: dict = Depends(require_admin)):
    path = Path(__file__).resolve().parent.parent.parent / "data" / "disease_info.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if disease_id not in data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Disease {disease_id} not found in database.")

    data[disease_id] = payload.dict()

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    return {"message": f"Disease {disease_id} updated successfully."}


@router.get("/healthcare-directory")
async def get_healthcare_directory(_admin: dict = Depends(require_admin)):
    path = Path(__file__).resolve().parent.parent.parent / "data" / "doctors_hospitals_india.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.put("/healthcare-directory")
async def update_healthcare_directory(payload: dict, _admin: dict = Depends(require_admin)):
    path = Path(__file__).resolve().parent.parent.parent / "data" / "doctors_hospitals_india.json"
    
    # Simple validation
    if "doctors" not in payload or "hospitals" not in payload:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid directory layout. Must contain 'doctors' and 'hospitals'.")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    return {"message": "Healthcare directory updated successfully."}


@router.post("/retrain")
async def trigger_retraining(epochs: int = 2, _admin: dict = Depends(require_admin)):
    global RETRAIN_STATE
    if RETRAIN_STATE["status"] == "training":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Model retraining is already in progress.")

    BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
    train_script = BASE_DIR / "backend" / "ml" / "train.py"
    data_dir = Path("d:/SKIN CARE/data/IMG_CLASSES")

    if not data_dir.exists():
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, 
            f"Dataset directory not found at {data_dir}. Place images there before training."
        )

    # Spawn background retraining task
    log_dir = BASE_DIR / "backend" / "static"
    os.makedirs(log_dir, exist_ok=True)
    log_path = log_dir / "retrain.log"

    # Reset state
    RETRAIN_STATE = {
        "status": "training",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "epochs": epochs,
        "error": None,
    }

    # Run train.py in background via venv python interpreter
    python_exe = sys.executable  # this will run the same interpreter (venv/Scripts/python.exe)
    
    # We run train.py in background, redirecting stdout to static/retrain.log
    def run_train():
        try:
            with open(log_path, "w", encoding="utf-8") as log_file:
                log_file.write(f"=== TRAINING LOG STARTED AT {datetime.now(timezone.utc).isoformat()} ===\n")
                log_file.flush()
                # Run script
                process = subprocess.Popen(
                    [
                        python_exe,
                        str(train_script),
                        "--data_dir",
                        str(data_dir),
                        "--epochs",
                        str(epochs),
                        "--output_dir",
                        str(BASE_DIR / "backend" / "ml" / "saved_model"),
                    ],
                    stdout=log_file,
                    stderr=log_file,
                    cwd=str(BASE_DIR / "backend" / "ml")
                )
                process.wait()
                
                if process.returncode == 0:
                    RETRAIN_STATE["status"] = "completed"
                    # Also move the trained model to standard path if it's there
                    best_model_path = BASE_DIR / "backend" / "ml" / "saved_model" / "skin_model.keras"
                    if best_model_path.exists():
                        print("Background training completed successfully.")
                else:
                    RETRAIN_STATE["status"] = "failed"
                    RETRAIN_STATE["error"] = f"Training script exited with code {process.returncode}."
        except Exception as e:
            RETRAIN_STATE["status"] = "failed"
            RETRAIN_STATE["error"] = str(e)
        finally:
            RETRAIN_STATE["completed_at"] = datetime.now(timezone.utc).isoformat()

    import threading
    thread = threading.Thread(target=run_train)
    thread.start()

    return {"message": "Model retraining triggered in the background.", "state": RETRAIN_STATE}


@router.get("/retrain/status")
async def get_retraining_status(_admin: dict = Depends(require_admin)):
    # Read the last few lines of the log file to show progress
    BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
    log_path = BASE_DIR / "backend" / "static" / "retrain.log"
    recent_logs = ""
    if log_path.exists():
        try:
            with open(log_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                recent_logs = "".join(lines[-30:])  # last 30 lines
        except Exception:
            recent_logs = "Error reading log file."
            
    return {
        "state": RETRAIN_STATE,
        "recent_logs": recent_logs,
        "log_url": f"{settings.backend_url}/static/retrain.log" if log_path.exists() else None
    }
