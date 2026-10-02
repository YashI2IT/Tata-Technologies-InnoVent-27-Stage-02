import os
import sys
from pathlib import Path
from datetime import timedelta
import logging

BASE_DIR = Path(__file__).resolve().parent.parent

# Detect whether running in PyInstaller frozen bundle or source tree
IS_FROZEN = getattr(sys, 'frozen', False)

if IS_FROZEN:
    # Read-only bundled resources (in PyInstaller temp extraction dir or alongside executable)
    MEIPASS = getattr(sys, '_MEIPASS', None)
    EXE_DIR = Path(sys.executable).resolve().parent
    RESOURCE_DIR = Path(os.environ.get("AEROEDGE_RESOURCE_DIR", MEIPASS or EXE_DIR))

    # Writable user application data (strictly in %LOCALAPPDATA%\AeroEdge-X)
    local_app_data = os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA") or str(Path.home())
    DEFAULT_DATA_DIR = Path(local_app_data) / "AeroEdge-X"
    DATA_DIR = Path(os.environ.get("AEROEDGE_DATA_DIR", DEFAULT_DATA_DIR))
else:
    RESOURCE_DIR = Path(os.environ.get("AEROEDGE_RESOURCE_DIR", BASE_DIR))
    DATA_DIR = Path(os.environ.get("AEROEDGE_DATA_DIR", BASE_DIR))


class BaseConfig:
    """Base application configuration with production-hardened defaults."""
    # Base filesystem paths
    BASE_DIR = BASE_DIR
    RESOURCE_DIR = RESOURCE_DIR
    DATA_DIR = DATA_DIR

    # Writable Application Data
    DATABASE_PATH = Path(os.environ.get("DATABASE_PATH", DATA_DIR / "database" / "digital_twin.db"))
    UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", DATA_DIR / "uploads"))
    REPORT_DIR = Path(os.environ.get("REPORT_DIR", DATA_DIR / "reports"))
    LOG_DIR = Path(os.environ.get("LOG_DIR", DATA_DIR / "logs"))

    # Read-Only Bundled Resources
    MANUALS_DIR = Path(os.environ.get("MANUALS_DIR", RESOURCE_DIR / "manuals"))
    CHROMA_DIR = Path(os.environ.get("CHROMA_DIR", RESOURCE_DIR / "data" / "chroma"))
    MODEL_PATH = Path(os.environ.get("MODEL_PATH", RESOURCE_DIR / "models" / "best.pt"))

    # Dynamic Port (Default 7860, configurable via AEROEDGE_PORT or --port)
    PORT = int(os.environ.get("AEROEDGE_PORT", os.environ.get("PORT", 7860)))

    # AI Models
    VISION_CONFIDENCE_THRESHOLD = float(os.environ.get("VISION_CONFIDENCE_THRESHOLD", 0.40))
    LLM_MODEL = os.environ.get("LLM_MODEL", "phi3:mini")
    OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    LLM_TIMEOUT_SECONDS = int(os.environ.get("LLM_TIMEOUT_SECONDS", 60))

    # Security & Sessions
    SECRET_KEY = os.environ.get("SECRET_KEY", "aeroedge_x_dev_insecure_local_secret_key_99214")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False  # Enabled in Production with HTTPS
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

    # CORS Configuration
    RAW_ORIGINS = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173")
    FRONTEND_ORIGINS = [origin.strip() for origin in RAW_ORIGINS.split(",") if origin.strip()]

    # Application Metadata
    APP_VERSION = os.environ.get("APP_VERSION", "v2.6.0-hardened")
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

    @classmethod
    def ensure_directories(cls):
        """Ensures required writable runtime directories exist."""
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)
        cls.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cls.REPORT_DIR.mkdir(parents=True, exist_ok=True)
        cls.LOG_DIR.mkdir(parents=True, exist_ok=True)


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = False


class TestingConfig(BaseConfig):
    DEBUG = False
    TESTING = True
    # Isolated test fixtures directory
    DATABASE_PATH = BASE_DIR / "tests" / "fixtures" / "test_digital_twin.db"
    UPLOAD_DIR = BASE_DIR / "uploads"
    REPORT_DIR = BASE_DIR / "reports"
    SECRET_KEY = "test_environment_isolated_secret_key"
    LLM_TIMEOUT_SECONDS = 15


class ProductionConfig(BaseConfig):
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "true").lower() == "true"

    def __init__(self):
        # Enforce that production does not use the default dev secret key
        dev_secret = "aeroedge_x_dev_insecure_local_secret_key_99214"
        if not IS_FROZEN and (not self.SECRET_KEY or self.SECRET_KEY == dev_secret):
            raise ValueError(
                "CRITICAL: Production configuration requires a strong, unique SECRET_KEY. "
                "Set the SECRET_KEY environment variable."
            )
        elif IS_FROZEN and (not self.SECRET_KEY or self.SECRET_KEY == dev_secret):
            self.SECRET_KEY = "offline-desktop-aeroedge-x-secure-fallback-3382"


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(env_name=None):
    """Factory function to load active configuration."""
    if IS_FROZEN:
        env_name = "production"
    elif not env_name:
        env_name = os.environ.get("FLASK_CONFIG", os.environ.get("FLASK_ENV", "development"))
    config_class = CONFIG_MAP.get(str(env_name).lower(), DevelopmentConfig)
    return config_class()
