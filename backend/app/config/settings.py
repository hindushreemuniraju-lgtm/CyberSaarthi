import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if present
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

def resolve_database_url():
    explicit_db = os.getenv('DATABASE_URL')
    is_serverless = bool(
        os.getenv('VERCEL') or
        os.getenv('VERCEL_ENV') or
        os.getenv('AWS_LAMBDA_FUNCTION_NAME') or
        os.getenv('LAMBDA_TASK_ROOT')
    )

    if explicit_db and not explicit_db.startswith('sqlite'):
        return explicit_db

    if is_serverless:
        tmp_db = '/tmp/cybersaarthi.db'
        # If repo has a bundled db, copy it to writable /tmp
        root_db = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'cybersaarthi.db')
        if not os.path.exists(tmp_db) and os.path.exists(root_db):
            try:
                shutil.copyfile(root_db, tmp_db)
            except Exception:
                pass
        return f"sqlite:///{tmp_db}"

    return explicit_db or 'sqlite:///cybersaarthi.db'

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'cybersaarthi_super_secret_jwt_key_2026_dev')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    PORT = int(os.getenv('PORT', 5000))

    # Database
    DATABASE_URL = resolve_database_url()

    # Security Engine Centralized Risk Thresholds (Project Blueprint)
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
