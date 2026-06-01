import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def test_upload_ca_valide():
    path = os.path.join(DATA_DIR, "ca_valide.csv")
    with open(path, "rb") as f:
        response = client.post("/api/upload", files={"file": ("ca_valide.csv", f, "text/csv")}, data={"file_type": "CA"})
    assert response.status_code == 200
    body = response.json()
    assert body["parse"]["success"] is True
    assert body["validation"]["valid"] is True


def test_upload_extension_invalide():
    response = client.post("/api/upload", files={"file": ("test.pdf", b"%PDF-1.4", "application/pdf")}, data={"file_type": "CA"})
    assert response.status_code == 400
    assert "Extension" in response.json()["detail"]


def test_upload_fichier_vide():
    response = client.post("/api/upload", files={"file": ("vide.csv", b"", "text/csv")}, data={"file_type": "CA"})
    assert response.status_code == 400
    assert "vide" in response.json()["detail"].lower()


def test_upload_type_invalide():
    path = os.path.join(DATA_DIR, "ca_valide.csv")
    with open(path, "rb") as f:
        response = client.post("/api/upload", files={"file": ("ca_valide.csv", f, "text/csv")}, data={"file_type": "INVALIDE"})
    assert response.status_code == 400
    assert "invalide" in response.json()["detail"].lower()
