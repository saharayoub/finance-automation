import logging
import io
import unicodedata
import chardet
import pandas as pd

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = {
    "CA": ["Société", "Date", "MontantCA"],
    "Engagement": ["Title", "DateEnga", "Designation", "Libelle", "BanqueEnga", "MontantEngagement"],
    "Versement": ["Société", "Date", "MontantVersement", "Banque"],
}

OPTIONAL_COLUMNS = {
    "CA": ["LOCAL", "EXPORT"],
}

STANDARD_COLUMNS = {
    "CA": ["Société", "Date", "MontantCA", "LOCAL", "EXPORT"],
    "Engagement": ["Title", "DateEnga", "Designation", "Libelle", "BanqueEnga", "MontantEngagement"],
    "Versement": ["Société", "Date", "MontantVersement", "Banque"],
}

SEPARATORS = [",", ";", "\t"]


def _detect_encoding(content: bytes) -> str:
    detected = chardet.detect(content)
    encoding = detected.get("encoding", "utf-8") or "utf-8"
    encoding = encoding.lower()
    if encoding not in ("utf-8", "utf8", "latin-1", "latin1", "iso-8859-1"):
        encoding = "utf-8"
    if encoding in ("utf8",):
        encoding = "utf-8"
    if encoding in ("latin1", "iso-8859-1"):
        encoding = "latin-1"
    return encoding


def _detect_separator(content: bytes, encoding: str) -> str:
    try:
        decoded = content.decode(encoding)
    except (UnicodeDecodeError, LookupError):
        decoded = content.decode("utf-8", errors="replace")
    first_line = decoded.split("\n")[0] if decoded else ""
    best_sep = ","
    best_count = 0
    for sep in SEPARATORS:
        count = first_line.count(sep)
        if count > best_count:
            best_count = count
            best_sep = sep
    return best_sep


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(how="all")
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    return df


def parse_file(content: bytes, filename: str, file_type: str) -> dict:
    filename_lower = filename.lower()
    is_excel = filename_lower.endswith((".xlsx", ".xls"))

    result = {
        "success": False,
        "filename": filename,
        "type": file_type,
        "row_count": 0,
        "columns_detected": [],
        "data": [],
        "encoding": None,
        "separator": None,
        "warnings": [],
        "error": None,
    }

    if file_type not in REQUIRED_COLUMNS:
        result["error"] = f"Type de fichier inconnu : {file_type}"
        return result

    required = REQUIRED_COLUMNS[file_type]

    try:
        if is_excel:
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
            result["encoding"] = "excel"
            result["separator"] = "excel"
        else:
            encoding = _detect_encoding(content)
            separator = _detect_separator(content, encoding)
            result["encoding"] = encoding
            result["separator"] = separator
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=encoding, sep=separator, dtype=str)
            except (UnicodeDecodeError, pd.errors.ParserError):
                df = pd.read_csv(io.BytesIO(content), encoding="latin-1", sep=separator, dtype=str)
                result["encoding"] = "latin-1"
    except Exception as e:
        result["error"] = f"Erreur de lecture du fichier : {str(e)}"
        logger.error("Erreur de parsing pour %s : %s", filename, str(e))
        return result

    df = _clean_dataframe(df)

    if df.empty:
        result["error"] = "Le fichier est vide ou ne contient aucune ligne de données."
        return result

    def _normalize_col(name: str) -> str:
        name = name.strip().lower()
        name = unicodedata.normalize("NFKD", name)
        name = name.encode("ascii", "ignore").decode("ascii")
        return name

    rename_map = {}
    for col in df.columns:
        for standard in STANDARD_COLUMNS.get(file_type, []):
            if _normalize_col(col) == _normalize_col(standard):
                rename_map[col] = standard
                break
    df = df.rename(columns=rename_map)

    original_columns = [c for c in STANDARD_COLUMNS.get(file_type, []) if c in df.columns]

    optional = OPTIONAL_COLUMNS.get(file_type, [])
    for col in optional:
        if col not in df.columns:
            df[col] = "0"

    columns_detected = list(df.columns)
    result["columns_detected"] = columns_detected

    missing = [col for col in required if col not in columns_detected]
    if missing:
        result["error"] = (
            f"Colonnes obligatoires manquantes pour le type {file_type} : "
            f"{', '.join(missing)}. "
            f"Colonnes détectées : {', '.join(columns_detected)}."
        )
        return result

    all_cols = STANDARD_COLUMNS.get(file_type, required)
    keep_cols = [c for c in all_cols if c in df.columns]
    df = df[keep_cols].copy()

    df = df.replace({pd.NA: None, pd.NaT: None})
    df = df.where(pd.notna(df), None)

    data = df.to_dict(orient="records")

    result["success"] = True
    result["row_count"] = len(data)
    result["data"] = data
    result["original_columns"] = original_columns

    logger.info(
        "Fichier %s parsé avec succès : %d lignes, %d colonnes, encodage=%s, séparateur=%s",
        filename, len(data), len(columns_detected), result["encoding"], result["separator"],
    )

    return result
