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

    # UPK file server (for OTA delivery)
    upk_server_port: int = 8899


settings = Settings()
