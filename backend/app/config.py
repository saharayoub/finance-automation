from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    azure_client_id: str = ""
    azure_client_secret: str = ""
    azure_tenant_id: str = ""

    sharepoint_site_url: str = ""
    sharepoint_ca_list_name: str = "ChiffreAffaire"
    sharepoint_engagement_list_name: str = "Engagement"
    sharepoint_documents_library: str = "Documents"

    openrouter_api_key: str = ""

    secret_key: str = "dev-secret-change-in-prod"
    environment: str = "development"
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
