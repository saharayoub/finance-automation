import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
DATA_FILE = os.path.join(DATA_DIR, "submissions.json")


def _ensure_data_file():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def _read() -> list[dict]:
    _ensure_data_file()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def _write(data: list[dict]):
    _ensure_data_file()
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def create_submission(data: dict) -> dict:
    submissions = _read()
    submission = {
        "id": str(uuid.uuid4()),
        "filiale": data.get("filiale", ""),
        "type": data.get("type", ""),
        "periode": data.get("periode", ""),
        "filename": data.get("filename", ""),
        "uploaded_by": data.get("uploaded_by", ""),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "status": "en_attente_validation",
        "validation_result": data.get("validation_result", {}),
        "validated_by": None,
        "validated_at": None,
        "rejection_reason": None,
    }
    submissions.append(submission)
    _write(submissions)
    logger.info("Submission créée : %s", submission["id"])
    return submission


def get_all_submissions() -> list[dict]:
    return _read()


def get_submissions_by_filiales(filiales: list[str]) -> list[dict]:
    filiales_set = set(filiales)
    return [s for s in _read() if s.get("filiale") in filiales_set]


def get_pending_submissions() -> list[dict]:
    return [s for s in _read() if s.get("status") == "en_attente_validation"]


def update_submission(id: str, updates: dict[str, Any]) -> dict | None:
    submissions = _read()
    for i, s in enumerate(submissions):
        if s["id"] == id:
            submissions[i].update(updates)
            _write(submissions)
            logger.info("Submission mise à jour : %s", id)
            return submissions[i]
    logger.warning("Submission introuvable : %s", id)
    return None
