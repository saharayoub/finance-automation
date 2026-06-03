import logging
import os
import math
import uuid
from typing import Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.services import csv_parser, validation_service, ai_service

logger = logging.getLogger(__name__)


def _clean_nans(obj: Any) -> Any:
    if isinstance(obj, float) and math.isnan(obj):
        return None
    if isinstance(obj, list):
        return [_clean_nans(item) for item in obj]
    if isinstance(obj, dict):
        return {k: _clean_nans(v) for k, v in obj.items()}
    return obj

router = APIRouter()

TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp")
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE = 10 * 1024 * 1024
VALID_TYPES = {"CA", "Engagement", "Versement"}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = Form(...),
):
    filename = file.filename or "fichier_inconnu"
    logger.info("Upload reçu : %s, type=%s", filename, file_type)

    if file_type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier invalide : '{file_type}'. Valeurs acceptées : CA, Engagement, Versement.",
        )

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extension de fichier non autorisée : '{ext}'. Extensions acceptées : .csv, .xlsx, .xls.",
        )

    content = await file.read()

    if not content or len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Le fichier est vide. Veuillez envoyer un fichier non vide.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Le fichier dépasse la taille maximale autorisée de 10 Mo. Taille reçue : {len(content) / (1024 * 1024):.2f} Mo.",
        )

    os.makedirs(TEMP_DIR, exist_ok=True)

    unique_id = uuid.uuid4().hex
    temp_path = os.path.join(TEMP_DIR, f"{unique_id}_{filename}")
    try:
        with open(temp_path, "wb") as f:
            f.write(content)
        logger.info("Fichier stocké temporairement : %s", temp_path)
    except OSError as e:
        logger.error("Impossible d'écrire le fichier temporaire %s : %s", temp_path, str(e))
        raise HTTPException(status_code=500, detail="Erreur interne lors du stockage du fichier.")

    parse_result = csv_parser.parse_file(content, filename, file_type)

    if not parse_result["success"]:
        logger.warning(
            "Échec du parsing pour %s : %s", filename, parse_result.get("error", "Erreur inconnue")
        )
        raise HTTPException(
            status_code=422,
            detail={
                "message": parse_result.get("error", "Erreur lors du parsing du fichier."),
                "filename": filename,
                "file_type": file_type,
                "parse_result": parse_result,
            },
        )

    data = parse_result["data"]
    original_columns = parse_result.get("original_columns", [])
    validation_result = validation_service.validate(data, file_type, original_columns=original_columns)

    corrected_data = validation_result.get("corrected_data", data)
    ai_result = await ai_service.analyze_data(corrected_data, file_type, filename)

    response = _clean_nans({
        "parse": parse_result,
        "validation": validation_result,
        "ai_analysis": ai_result,
    })

    if validation_result["valid"]:
        logger.info(
            "Upload réussi pour %s : %d lignes valides sur %d",
            filename, validation_result["valid_rows"], validation_result["total_rows"],
        )
    else:
        logger.warning(
            "Upload avec erreurs pour %s : %d erreurs, %d avertissements",
            filename, validation_result["error_count"], validation_result["warning_count"],
        )

    return response
