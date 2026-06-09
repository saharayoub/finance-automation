import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.submission_service import (
    create_submission,
    get_all_submissions,
    get_pending_submissions,
    get_submissions_by_filiales,
    update_submission,
)

logger = logging.getLogger(__name__)

router = APIRouter()


class SubmissionCreate(BaseModel):
    filiale: str
    type: str
    periode: str
    filename: str
    uploaded_by: str
    validation_result: dict = Field(default_factory=dict)


class SubmissionUpdate(BaseModel):
    validated_by: str
    rejection_reason: str | None = None


@router.post("/submissions")
def api_create_submission(data: SubmissionCreate):
    submission = create_submission(data.model_dump())
    return {"submission": submission}


@router.get("/submissions")
def api_get_all_submissions():
    return {"submissions": get_all_submissions()}


@router.get("/submissions/pending")
def api_get_pending_submissions():
    return {"submissions": get_pending_submissions()}


@router.get("/submissions/by-filiales")
def api_get_submissions_by_filiales(filiales: list[str] = Query(...)):
    return {"submissions": get_submissions_by_filiales(filiales)}


@router.put("/submissions/{id}/validate")
def api_validate_submission(id: str, data: SubmissionUpdate):
    submission = update_submission(id, {
        "status": "valide",
        "validated_by": data.validated_by,
        "validated_at": datetime.now(timezone.utc).isoformat(),
    })
    if submission is None:
        raise HTTPException(status_code=404, detail="Soumission introuvable")
    return {"submission": submission}


@router.put("/submissions/{id}/reject")
def api_reject_submission(id: str, data: SubmissionUpdate):
    if not data.rejection_reason or not data.rejection_reason.strip():
        raise HTTPException(status_code=400, detail="Le motif de rejet est obligatoire")
    submission = update_submission(id, {
        "status": "rejete",
        "validated_by": data.validated_by,
        "validated_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": data.rejection_reason,
    })
    if submission is None:
        raise HTTPException(status_code=404, detail="Soumission introuvable")
    return {"submission": submission}
