import logging
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth_middleware import get_current_user
from app.services.auth_service import authenticate_test_user, create_test_token

logger = logging.getLogger(__name__)

router = APIRouter()


class LoginTestRequest(BaseModel):
    email: str
    password: str


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    """
    Retourne les informations de l'utilisateur connecté.

    Nécessite un token Azure AD valide dans le header Authorization.
    """
    logger.info("Infos utilisateur demandées pour %s", user.get("email"))
    return {
        "user_id": user.get("user_id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "roles": user.get("roles", []),
    }


@router.post("/logout")
def logout():
    """
    Confirme la déconnexion.

    Le vrai logout est géré côté frontend par MSAL (Microsoft).
    Cet endpoint sert uniquement à la traçabilité (logs).
    """
    logger.info("Utilisateur déconnecté")
    return {"message": "Déconnexion réussie"}


@router.post("/login-test")
def login_test(body: LoginTestRequest):
    """
    Authentifie un utilisateur via les comptes de test hardcodés.

    Retourne un token JWT et les informations utilisateur si succès.
    """
    user_info = authenticate_test_user(body.email, body.password)
    token = create_test_token(user_info)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_info,
    }
