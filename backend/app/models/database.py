import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from backend.app.config.settings import Config

logger = logging.getLogger(__name__)

Base = declarative_base()

def get_engine():
    db_url = Config.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")
    connect_args = {"check_same_thread": False} if is_sqlite else {}
    try:
        engine = create_engine(
            db_url,
            pool_pre_ping=not is_sqlite,
            connect_args=connect_args
        )
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info(f"Connected successfully to primary database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
        return engine
    except Exception as e:
        logger.warning(f"Failed to connect to primary DB ({db_url}): {e}. Falling back to SQLite for zero-downtime development.")
        # Fallback to local SQLite db
        if os.getenv('VERCEL') or os.getenv('AWS_LAMBDA_FUNCTION_NAME'):
            sqlite_path = '/tmp/cybersaarthi.db'
        else:
            sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'cybersaarthi.db')
        fallback_url = f"sqlite:///{sqlite_path}"
        engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
        return engine

engine = get_engine()
SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db_session = scoped_session(SessionFactory)

def init_db():
    from backend.app.models import user, contact, relationship, scan_event, alert, safety_tip
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
