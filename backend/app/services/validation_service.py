import logging
import re
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

AMOUNT_FIELDS = {
    "CA": ["MontantCA", "LOCAL", "EXPORT"],
    "Engagement": ["MontantEngagement"],
    "Versement": ["MontantVersement"],
}

DATE_FIELDS = {
    "CA": ["Date"],
    "Engagement": ["DateEnga"],
    "Versement": ["Date"],
}

REQUIRED_FIELDS = {
    "CA": ["MontantCA", "Société", "Date"],
    "Engagement": ["Title", "MontantEngagement", "BanqueEnga", "DateEnga"],
    "Versement": ["Société", "Date", "MontantVersement", "Banque"],
}


def _normalize_amount(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if value is True or value is False:
            return None
        return float(value)
    s = str(value).strip().replace(" ", "").replace("\u202f", "")
    if not s:
        return None
    if s.count(",") == 0 and s.count(".") == 0:
        try:
            return float(s)
        except ValueError:
            return None
    last_comma = s.rfind(",")
    last_point = s.rfind(".")
    if last_comma == -1 and last_point >= 0:
        clean = s
    elif last_point == -1 and last_comma >= 0:
        clean = s.replace(",", ".")
    else:
        if last_comma > last_point:
            clean = s.replace(".", "").replace(",", ".")
        else:
            clean = s.replace(",", "")
    try:
        return float(clean)
    except ValueError:
        return None


def _normalize_all_amounts(data: list[dict], file_type: str) -> list[dict]:
    fields = AMOUNT_FIELDS.get(file_type, [])
    corrected = []
    for row in data:
        row = dict(row)
        for field in fields:
            if field in row:
                normalized = _normalize_amount(row[field])
                if normalized is not None:
                    row[field] = normalized
        corrected.append(row)
    return corrected


def _validate_date(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, (datetime,)):
        return True
    s = str(value).strip()
    if not s:
        return False
    if re.match(r"^\d{2}/\d{2}/\d{4}$", s):
        try:
            datetime.strptime(s, "%d/%m/%Y")
            return True
        except ValueError:
            return False
    try:
        datetime.fromisoformat(s)
        return True
    except (ValueError, TypeError):
        pass
    return False


def validate(data: list[dict], file_type: str, original_columns: list | None = None) -> dict:
    result = {
        "valid": False,
        "total_rows": len(data),
        "valid_rows": 0,
        "error_count": 0,
        "warning_count": 0,
        "errors": [],
        "warnings": [],
        "corrected_data": [],
    }

    if file_type not in AMOUNT_FIELDS:
        result["errors"].append({"line": 0, "field": "type", "message": f"Type de fichier inconnu : {file_type}"})
        result["error_count"] = 1
        return result

    corrected_data = _normalize_all_amounts(data, file_type)
    errors: list[dict] = []
    warnings: list[dict] = []
    valid_rows = 0

    amount_fields = AMOUNT_FIELDS[file_type]
    date_fields = DATE_FIELDS[file_type]
    required_fields = REQUIRED_FIELDS[file_type]

    seen_combinations: set[tuple] = set()
    seen_titles: set[str] = set()

    for idx, row in enumerate(corrected_data):
        line_num = idx + 1
        row_errors: list[dict] = []
        row_valid = True

        for field in required_fields:
            value = row.get(field)
            if value is None or (isinstance(value, str) and value.strip() == ""):
                row_errors.append({
                    "line": line_num,
                    "field": field,
                    "message": f"Ligne {line_num} : le champ '{field}' est vide.",
                })
                row_valid = False

        for field in amount_fields:
            value = row.get(field)
            if value is not None:
                if isinstance(value, (int, float)):
                    if value < 0:
                        row_errors.append({
                            "line": line_num,
                            "field": field,
                            "message": f"Ligne {line_num} : le champ '{field}' contient un montant négatif ({value}).",
                        })
                        row_valid = False

        for field in date_fields:
            value = row.get(field)
            if value is not None and isinstance(value, str) and value.strip():
                if not _validate_date(value):
                    row_errors.append({
                        "line": line_num,
                        "field": field,
                        "message": f"Ligne {line_num} : le champ '{field}' n'est pas une date valide (format attendu : DD/MM/YYYY). Valeur reçue : '{value}'.",
                    })
                    row_valid = False

        if file_type == "CA":
            montant = row.get("MontantCA")
            local = row.get("LOCAL")
            export = row.get("EXPORT")
            societe = row.get("Société")
            date_val = row.get("Date")
            has_local = original_columns is None or ("LOCAL" in original_columns and "EXPORT" in original_columns)
            if has_local and all(
                v is not None and isinstance(v, (int, float))
                for v in (montant, local, export)
            ):
                diff = abs(local + export - montant)
                if diff > 0.01:
                    row_errors.append({
                        "line": line_num,
                        "field": "MontantCA/LOCAL/EXPORT",
                        "message": (
                            f"Ligne {line_num} : LOCAL + EXPORT ({local + export}) "
                            f"≠ MontantCA ({montant}). Différence : {diff:.2f}."
                        ),
                    })
                    row_valid = False
            if societe is not None and date_val is not None:
                combo = (str(societe).strip(), str(date_val).strip())
                if combo in seen_combinations:
                    warnings.append({
                        "line": line_num,
                        "field": "Société/Date",
                        "message": f"Ligne {line_num} : la combinaison Société/Date '{societe}' / '{date_val}' apparaît plusieurs fois.",
                    })
                else:
                    seen_combinations.add(combo)

        elif file_type == "Engagement":
            title = row.get("Title")
            if title is not None and str(title).strip():
                title_key = str(title).strip()
                if title_key in seen_titles:
                    warnings.append({
                        "line": line_num,
                        "field": "Title",
                        "message": f"Ligne {line_num} : le Title '{title_key}' apparaît plusieurs fois dans le fichier.",
                    })
                else:
                    seen_titles.add(title_key)

        elif file_type == "Versement":
            societe = row.get("Société")
            date_val = row.get("Date")
            banque = row.get("Banque")
            if societe is not None and date_val is not None and banque is not None:
                combo = (str(societe).strip(), str(date_val).strip(), str(banque).strip())
                if combo in seen_combinations:
                    warnings.append({
                        "line": line_num,
                        "field": "Société/Date/Banque",
                        "message": f"Ligne {line_num} : la combinaison Société/Date/Banque apparaît plusieurs fois.",
                    })
                else:
                    seen_combinations.add(combo)

        if row_valid:
            valid_rows += 1
        errors.extend(row_errors)

    result["valid"] = len(errors) == 0
    result["valid_rows"] = valid_rows
    result["error_count"] = len(errors)
    result["warning_count"] = len(warnings)
    result["errors"] = errors
    result["warnings"] = warnings
    result["corrected_data"] = corrected_data

    logger.info(
        "Validation %s : %d lignes, %d valides, %d erreurs, %d avertissements",
        file_type, len(data), valid_rows, len(errors), len(warnings),
    )

    return result
