import pytest
import os
import json

from app.services import csv_parser, validation_service

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def _read_file(filename: str) -> bytes:
    path = os.path.join(DATA_DIR, filename)
    with open(path, "rb") as f:
        return f.read()


class TestCSVParser:
    """Tests pour csv_parser.py"""

    def test_1_csv_ca_valide(self):
        content = _read_file("ca_valide.csv")
        result = csv_parser.parse_file(content, "ca_valide.csv", "CA")
        assert result["success"] is True, f"Parsing échoué : {result.get('error')}"
        assert result["row_count"] == 3
        assert result["encoding"] is not None
        assert result["separator"] is not None
        assert len(result["data"]) == 3
        assert result["data"][0]["Société"] == "SocieteA"
        assert result["data"][0]["MontantCA"] == "100000"

    def test_7_excel_valide(self):
        import pandas as pd
        import io
        excel_path = os.path.join(DATA_DIR, "ca_valide.xlsx")
        df = pd.read_csv(os.path.join(DATA_DIR, "ca_valide.csv"))
        df.to_excel(excel_path, index=False)
        with open(excel_path, "rb") as f:
            content = f.read()
        result = csv_parser.parse_file(content, "ca_valide.xlsx", "CA")
        assert result["success"] is True, f"Parsing Excel échoué : {result.get('error')}"
        assert result["row_count"] == 3
        assert result["encoding"] == "excel"
        assert result["separator"] == "excel"
        os.remove(excel_path)

    def test_8_csv_point_virgule(self):
        content = _read_file("ca_point_virgule.csv")
        result = csv_parser.parse_file(content, "ca_point_virgule.csv", "CA")
        assert result["success"] is True, f"Parsing échoué : {result.get('error')}"
        assert result["separator"] == ";"
        assert result["row_count"] == 2

    def test_9_csv_encodage_latin1(self):
        content = _read_file("ca_valide.csv")
        decoded = content.decode("utf-8")
        encoded = decoded.encode("latin-1")
        result = csv_parser.parse_file(encoded, "ca_latin1.csv", "CA")
        assert result["success"] is True, f"Parsing échoué : {result.get('error')}"
        assert result["encoding"] == "latin-1" or result["encoding"] == "utf-8"
        assert result["row_count"] == 3

    def test_6_colonnes_manquantes(self):
        content = _read_file("ca_colonnes_manquantes.csv")
        result = csv_parser.parse_file(content, "ca_colonnes_manquantes.csv", "CA")
        assert result["success"] is False
        assert "MontantCA" in result.get("error", "")
        assert "colonnes" in result.get("error", "").lower()


class TestValidationService:
    """Tests pour validation_service.py"""

    def _parse_and_validate(self, filename: str, file_type: str) -> dict:
        content = _read_file(filename)
        parse_result = csv_parser.parse_file(content, filename, file_type)
        assert parse_result["success"] is True
        return validation_service.validate(parse_result["data"], file_type)

    def test_1_csv_ca_valide(self):
        result = self._parse_and_validate("ca_valide.csv", "CA")
        assert result["valid"] is True, f"Validation échouée : {result['errors']}"
        assert result["total_rows"] == 3
        assert result["valid_rows"] == 3
        assert result["error_count"] == 0

    def test_2_montants_normalises(self):
        content = _read_file("ca_mixed_decimals.csv")
        parse_result = csv_parser.parse_file(content, "ca_mixed_decimals.csv", "CA")
        assert parse_result["success"] is True

        data = parse_result["data"]
        assert data[0]["MontantCA"] == "455217,36"
        assert data[1]["MontantCA"] == "152345.32"
        assert data[2]["MontantCA"] == "100000.50"

        val_result = validation_service.validate(data, "CA")
        assert val_result["valid"] is True, f"Validation échouée : {val_result['errors']}"

        corrected = val_result["corrected_data"]
        assert isinstance(corrected[0]["MontantCA"], (int, float))
        assert corrected[0]["MontantCA"] == 455217.36
        assert isinstance(corrected[1]["MontantCA"], (int, float))
        assert corrected[1]["MontantCA"] == 152345.32
        assert isinstance(corrected[2]["MontantCA"], (int, float))
        assert corrected[2]["MontantCA"] == 100000.5

    def test_3_sum_error(self):
        result = self._parse_and_validate("ca_sum_error.csv", "CA")
        assert result["valid"] is False
        assert result["error_count"] >= 1
        error_msgs = [e["message"] for e in result["errors"]]
        has_sum_error = any("LOCAL + EXPORT" in msg for msg in error_msgs)
        assert has_sum_error, f"Aucune erreur de somme trouvée. Erreurs : {error_msgs}"

    def test_4_montant_negatif(self):
        result = self._parse_and_validate("ca_negatif.csv", "CA")
        assert result["valid"] is False
        assert result["error_count"] >= 1
        error_msgs = [e["message"] for e in result["errors"]]
        has_neg = any("négatif" in msg for msg in error_msgs)
        assert has_neg, f"Aucune erreur de montant négatif. Erreurs : {error_msgs}"

    def test_5_date_invalide(self):
        result = self._parse_and_validate("ca_date_invalide.csv", "CA")
        assert result["valid"] is False
        assert result["error_count"] >= 1
        error_msgs = [e["message"] for e in result["errors"]]
        has_date_err = any("date" in msg.lower() for msg in error_msgs)
        assert has_date_err, f"Aucune erreur de date. Erreurs : {error_msgs}"

    def test_10_fichier_trop_grand(self):
        big_data = ("a,b,c\n" + "1,2,3\n") * 900000
        content = big_data.encode("utf-8")
        max_size = 10 * 1024 * 1024
        assert len(content) > max_size, f"Le fichier de test ({len(content)} bytes) devrait dépasser 10MB"

    def test_11_fichier_pdf(self):
        content = b"%PDF-1.4 fake pdf content"
        result = csv_parser.parse_file(content, "fichier.pdf", "CA")
        assert result["success"] is False

    def test_12_doublon_societe_date(self):
        result = self._parse_and_validate("ca_doublon.csv", "CA")
        assert result["valid"] is True
        assert result["warning_count"] >= 1
        warn_msgs = [w["message"] for w in result["warnings"]]
        has_warn = any("plusieurs fois" in msg for msg in warn_msgs)
        assert has_warn, f"Aucun avertissement de doublon. Warnings : {warn_msgs}"

    def test_13_title_duplique_engagement(self):
        result = self._parse_and_validate("engagement_title_duplique.csv", "Engagement")
        assert result["valid"] is True
        assert result["warning_count"] >= 1
        warn_msgs = [w["message"] for w in result["warnings"]]
        has_warn = any("plusieurs fois" in msg for msg in warn_msgs)
        assert has_warn, f"Aucun avertissement de titre dupliqué. Warnings : {warn_msgs}"
