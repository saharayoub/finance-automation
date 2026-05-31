import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import verify_azure_token

logger = logging.getLogger(__name__)

oauth2_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
) -> dict:
    """
    Dépendance FastAPI qui extrait et valide le token Azure AD.

    À utiliser dans les routes protégées comme paramètre de fonction.
    Exemple:
        @app.get("/api/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            ...

    Args:
        credentials: Credentials extraits du header Authorization (Bearer token)

    Returns:
        Dictionnaire contenant les infos utilisateur (user_id, email, name, roles)

    Raises:
        HTTPException 401: Si token absent ou invalide
    """
    token = credentials.credentials
    logger.info("Tentative d'accès avec token")
    return verify_azure_token(token)
