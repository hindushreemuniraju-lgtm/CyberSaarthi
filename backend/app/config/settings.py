import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'cybersaarthi_super_secret_jwt_key_2026_dev')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    PORT = int(os.getenv('PORT', 5000))

    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///cybersaarthi.db')

    # Security Engine Centralized Risk Thresholds (Project Blueprint)
    # 0 - 29: SAFE
    # 30 - 64: WARN
    # 65 - 100: BLOCK
    SCORE_SAFE_MAX = 29
    SCORE_WARN_MAX = 64
    SCORE_BLOCK_MIN = 65

    # Threat Intelligence API Keys
    GOOGLE_SAFE_BROWSING_API_KEY = os.getenv('GOOGLE_SAFE_BROWSING_API_KEY', '').strip()
    VIRUSTOTAL_API_KEY = os.getenv('VIRUSTOTAL_API_KEY', '').strip()
    URLSCAN_API_KEY = os.getenv('URLSCAN_API_KEY', '').strip()

    # Voice / AI API Keys (Optional)
    SARVAM_API_KEY = os.getenv('SARVAM_API_KEY', '').strip()
    WHISPER_API_KEY = os.getenv('WHISPER_API_KEY', '').strip()

    # JWT Config
    JWT_EXPIRATION_HOURS = 72
