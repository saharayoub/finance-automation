import logging
import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

AZURE_JWKS_URL = (
    f"https://login.microsoftonline.com/{settings.azure_tenant_id}"
    "/discovery/v2.0/keys"
)
AZURE_ISSUER = (
    f"https://login.microsoftonline.com/{settings.azure_tenant_id}/v2.0"
)


def _get_jwks_keys() -> list[dict]:
    """
    Récupère les clés publiques Microsoft pour valider la signature du JWT.

    Returns:
        Liste des clés JWKS (JSON Web Key Set)

    Raises:
        HTTPException 502: Si le service Microsoft est injoignable
    """
    try:
        response = httpx.get(AZURE_JWKS_URL, timeout=10)
        response.raise_for_status()
        return response.json().get("keys", [])
    except httpx.RequestError as exc:
        logger.error("Impossible de récupérer les clés JWKS: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Service d'authentification Microsoft indisponible"
        )


def verify_azure_token(token: str) -> dict:
    """
    Valide un token JWT Azure AD et retourne les informations utilisateur.

    Vérifie la signature du token contre les clés publiques Microsoft,
    l'expiration, l'audience (client ID) et l'issuer (tenant).

    Args:
        token: Token JWT Azure AD (format Bearer)

    Returns:
        Dictionnaire contenant les infos utilisateur:
        - user_id: Identifiant unique (sub ou oid)
        - email: Email de l'utilisateur
        - name: Nom d'affichage
        - roles: Liste des rôles

    Raises:
        HTTPException 401: Si le token est invalide, expiré ou mal formé
    """
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        logger.warning("Token JWT mal formé reçu")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token mal formé"
        )

    kid = header.get("kid")
    if not kid:
        logger.warning("Token sans kid (key ID)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide: clé manquante"
        )

    keys = _get_jwks_keys()
    rsa_key = None
    for key in keys:
        if key.get("kid") == kid:
            rsa_key = key
            break

    if not rsa_key:
        logger.warning("Aucune clé JWKS trouvée pour kid=%s", kid)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide: signature non vérifiable"
        )

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256", "RS384", "RS512"],
            audience=settings.azure_client_id,
            issuer=AZURE_ISSUER,
            options={
                "verify_exp": True,
                "verify_iat": True,
            }
        )
    except jwt.ExpiredSignatureError:
        logger.warning("Token expiré")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expiré"
        )
    except jwt.JWTError as exc:
        logger.warning("Échec validation token: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )

    user_info = {
        "user_id": payload.get("sub") or payload.get("oid"),
        "email": payload.get("preferred_username") or payload.get("email"),
        "name": payload.get("name", ""),
        "roles": payload.get("roles", []),
    }

    logger.info("Token validé pour %s (rôles: %s)", user_info["email"], user_info["roles"])
    return user_info
