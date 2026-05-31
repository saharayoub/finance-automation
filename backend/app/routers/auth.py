import logging
from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


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
