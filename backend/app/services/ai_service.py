import logging
import json
import math
import statistics
import time
from collections import defaultdict
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "deepseek/deepseek-chat-v3-0324"
MAX_ROWS_FOR_FULL = 500
TIMEOUT = 45


def _clean_nans(obj: Any) -> Any:
    if isinstance(obj, float) and math.isnan(obj):
        return None
    if isinstance(obj, list):
        return [_clean_nans(item) for item in obj]
    if isinstance(obj, dict):
        return {k: _clean_nans(v) for k, v in obj.items()}
    return obj


def _build_statistical_summary(data: list[dict], file_type: str, filename: str) -> dict:
    amount_field = {
        "CA": "MontantCA",
        "Engagement": "MontantEngagement",
        "Versement": "MontantVersement",
    }.get(file_type, "")

    societies: dict[str, list[float]] = defaultdict(list)
    for row in data:
        societe = row.get("Société") or row.get("Title") or "Inconnu"
        soc_str = str(societe).strip()
        amount = row.get(amount_field)
        if amount is not None and isinstance(amount, (int, float)) and not (isinstance(amount, float) and math.isnan(amount)):
            societies[soc_str].append(float(amount))

    summary: dict[str, Any] = {
        "type": file_type,
        "filename": filename,
        "total_rows": len(data),
        "societes": [],
    }

    for soc_name, amounts in societies.items():
        soc: dict[str, Any] = {
            "nom": soc_name,
            "nombre_lignes": len(amounts),
            "moyenne": round(sum(amounts) / len(amounts), 2) if amounts else 0,
            "minimum": round(min(amounts), 2) if amounts else 0,
            "maximum": round(max(amounts), 2) if amounts else 0,
            "ecart_type": round(statistics.stdev(amounts), 2) if len(amounts) > 1 else 0,
        }
        if file_type == "CA":
            local_vals = []
            export_vals = []
            for row in data:
                if str(row.get("Société", "")).strip() == soc_name:
                    loc = row.get("LOCAL")
                    exp = row.get("EXPORT")
                    if loc is not None and isinstance(loc, (int, float)) and not (isinstance(loc, float) and math.isnan(loc)):
                        local_vals.append(float(loc))
                    if exp is not None and isinstance(exp, (int, float)) and not (isinstance(exp, float) and math.isnan(exp)):
                        export_vals.append(float(exp))
            soc["total_local"] = round(sum(local_vals), 2) if local_vals else 0
            soc["total_export"] = round(sum(export_vals), 2) if export_vals else 0
        summary["societes"].append(soc)

    return summary


_BUILD_RULES_PROMPT = {
    "CA": """Règles d'analyse pour CA (Chiffre d'Affaire):
Règle 1 — Écart M vs M-1: Pour chaque société, comparer le MontantCA du mois actuel avec le mois précédent. AVERTISSEMENT si écart > 30%, ANOMALIE si écart > 50%.
Règle 2 — Ratio année/année: Pour chaque société, calculer le ratio de croissance entre le même mois cette année et l'année précédente. AVERTISSEMENT si le ratio s'écarte de plus de 15% par rapport aux autres mois de la même société. ANOMALIE si écart > 30%.
Règle 3 — Cohérence LOCAL vs EXPORT: Si une société a toujours déclaré uniquement LOCAL et déclare soudain de l'EXPORT (ou inversement), générer un AVERTISSEMENT.""",
    "Engagement": """Règles d'analyse pour Engagement:
Règle 1 — Montant inhabituel: Si le montant d'un engagement dépasse 3 fois la moyenne des engagements de la même société, générer un AVERTISSEMENT.
Règle 2 — Concentration bancaire: Si plus de 80% des engagements d'une société sont avec une seule banque, générer un AVERTISSEMENT informatif.""",
    "Versement": """Règles d'analyse pour Versement:
Règle 1 — Montant inhabituel: Si un versement dépasse 3 fois la moyenne des versements de la même société, générer un AVERTISSEMENT.
Règle 2 — Écart M vs M-1: Comparer le total des versements du mois actuel avec le mois précédent par société. AVERTISSEMENT si écart > 30%, ANOMALIE si écart > 50%.
Règle 3 — Fréquence inhabituelle: Si une société fait beaucoup plus de versements ce mois que sa moyenne habituelle, générer un AVERTISSEMENT.""",
}


def _build_prompt(payload: dict, file_type: str) -> str:
    rules = _BUILD_RULES_PROMPT.get(file_type, "")
    data_json = json.dumps(payload, ensure_ascii=False, indent=2, default=str)

    return f"""Tu es un expert en analyse financière. Analyse les données suivantes et applique les règles ci-dessous.

{data_json}

{rules}

Retourne UNIQUEMENT un JSON valide sans texte autour, sans markdown, sans backticks, sans commentaires. Format exact:
{{
  "anomalies": [
    {{
      "type": "ANOMALIE ou AVERTISSEMENT",
      "societe": "nom société",
      "regle": "nom de la règle",
      "message": "explication claire en français",
      "lignes_concernees": [1, 2],
      "valeurs": {{
        "valeur_actuelle": 500000,
        "valeur_reference": 100000,
        "ecart_pourcentage": 400
      }}
    }}
  ],
  "resume": {{
    "total_anomalies": 1,
    "total_avertissements": 2,
    "conclusion": "résumé en français"
  }}
}}

Si aucune anomalie ou avertissement n'est détecté, retourne des listes vides."""


async def analyze_data(data: list[dict], file_type: str, filename: str) -> dict:
    """
    Analyze financial data using DeepSeek AI via OpenRouter.

    Args:
        data: List of row dicts (corrected/normalized data) from CSV/Excel parsing
        file_type: One of "CA", "Engagement", "Versement"
        filename: Original uploaded filename

    Returns:
        dict with keys:
            - anomalies: list of detected anomalies/warnings
            - resume: summary dict with counts and conclusion
            - ia_available: bool indicating if AI responded
    """
    start = time.time()
    total_rows = len(data)

    settings = get_settings()
    api_key = settings.openrouter_api_key

    if not api_key:
        logger.warning("OPENROUTER_API_KEY non configurée — analyse IA désactivée")
        return {
            "anomalies": [],
            "resume": {
                "total_anomalies": 0,
                "total_avertissements": 0,
                "conclusion": "Analyse IA non disponible",
            },
            "ia_available": False,
        }

    cleaned_data = _clean_nans(data)

    if total_rows > MAX_ROWS_FOR_FULL:
        payload = _build_statistical_summary(cleaned_data, file_type, filename)
        logger.info("Résumé statistique envoyé à l'IA (%d sociétés pour %d lignes)", len(payload["societes"]), total_rows)
    else:
        payload = {
            "type": file_type,
            "filename": filename,
            "total_rows": total_rows,
            "data": cleaned_data,
        }

    prompt = _build_prompt(payload, file_type)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
    }

    request_body = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 3000,
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(OPENROUTER_URL, headers=headers, json=request_body)
            response.raise_for_status()
            response_data = response.json()
    except httpx.TimeoutException:
        logger.error("Timeout appel DeepSeek (%ds) pour %s %s", TIMEOUT, file_type, filename)
        return {
            "anomalies": [],
            "resume": {"total_anomalies": 0, "total_avertissements": 0, "conclusion": "Analyse IA non disponible"},
            "ia_available": False,
        }
    except httpx.HTTPStatusError as e:
        logger.error("Erreur HTTP DeepSeek %s pour %s %s", e.response.status_code, file_type, filename)
        return {
            "anomalies": [],
            "resume": {"total_anomalies": 0, "total_avertissements": 0, "conclusion": "Analyse IA non disponible"},
            "ia_available": False,
        }
    except Exception as e:
        logger.error("Erreur appel DeepSeek pour %s %s: %s", file_type, filename, str(e))
        return {
            "anomalies": [],
            "resume": {"total_anomalies": 0, "total_avertissements": 0, "conclusion": "Analyse IA non disponible"},
            "ia_available": False,
        }

    try:
        content = response_data["choices"][0]["message"]["content"]
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1]
            content = content.rsplit("```", 1)[0]
        content = content.strip()
        if content.startswith("json"):
            content = content[4:].strip()
        result = json.loads(content)
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        logger.error("Impossible de parser la réponse DeepSeek pour %s %s: %s", file_type, filename, str(e))
        return {
            "anomalies": [],
            "resume": {"total_anomalies": 0, "total_avertissements": 0, "conclusion": "Analyse IA non disponible"},
            "ia_available": False,
        }

    duration = time.time() - start
    anomalies = result.get("anomalies", [])
    resume = result.get("resume", {})
    total_anomalies = resume.get("total_anomalies", 0) if isinstance(resume, dict) else 0
    total_avertissements = resume.get("total_avertissements", 0) if isinstance(resume, dict) else 0

    logger.info(
        "Analyse IA %s %s: %d lignes, durée=%.1fs, %d anomalies, %d avertissements",
        file_type, filename, total_rows, duration, total_anomalies, total_avertissements,
    )

    result["ia_available"] = True
    return result
