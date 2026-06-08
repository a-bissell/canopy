"""Central configuration via environment variables."""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "CANOPY_"}

    # API
    host: str = "0.0.0.0"
    api_port: int = 8080
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # CORS — origins allowed to call the API from a browser.
    # The bundled SPA is served same-origin, so this only matters for the
    # standalone Vite dev server. Override via CANOPY_CORS_ORIGINS (JSON list).
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # MQTT Broker
    mqtt_host: str = "0.0.0.0"
    mqtt_port: int = 17883
    mqtt_use_tls: bool = True
    mqtt_require_auth: bool = True
    mqtt_cert_path: str | None = None
    mqtt_key_path: str | None = None

    # Database
    database_url: str = "sqlite+aiosqlite:///./canopy.db"

    # Data paths
    data_dir: Path = Path("./data")
    package_dir: Path = Path("./data/packages")

    # UPK file server (serves .upk packages to robots for OTA delivery)
    upk_server_host: str = "0.0.0.0"      # bind address
    upk_server_port: int = 8899
    # Host/IP that robots use to reach the UPK file server. This goes into the
    # download URL inside the updateModule command, so it must be reachable
    # *from the robot*. Override via CANOPY_UPK_ADVERTISE_HOST in production.
    upk_advertise_host: str = "127.0.0.1"


settings = Settings()
