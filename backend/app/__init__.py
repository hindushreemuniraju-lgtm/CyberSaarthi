import os
import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from backend.app.config.settings import Config
from backend.app.models.database import init_db, db_session
from backend.app.models.user import User, UserPreference
from backend.app.models.relationship import CaretakerRelationship, Consent
from backend.app.models.contact import TrustedContact
from backend.app.models.alert import Alert
from backend.app.utils.auth_helpers import hash_password

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger(__name__)

def seed_demo_accounts_if_empty():
    try:
        user_count = db_session.query(User).count()
        if user_count == 0:
            logger.info("Database is empty. Seeding initial demo persona accounts...")
            pwd = hash_password("DemoPass123!")

            # 1. Caretaker
            caretaker = User(
                name="Suresh Kumar (Caretaker)",
                email="caretaker@cybersaarthi.org",
                phone="9800000001",
                password_hash=pwd,
                user_mode="caretaker",
                preferred_language="en",
                font_scale="normal"
            )
            # 2. Senior (Lakshmi)
            senior = User(
                name="Lakshmi Amma",
                email="lakshmi@cybersaarthi.org",
                phone="9800000002",
                password_hash=pwd,
                user_mode="senior",
                preferred_language="kn",
                font_scale="large",
                voice_enabled=True
            )
            # 3. Kid (Riya)
            kid = User(
                name="Riya",
                email="riya@cybersaarthi.org",
                phone="9800000003",
                password_hash=pwd,
                user_mode="kid",
                preferred_language="en",
                font_scale="normal"
            )
            # 4. Adult (Arun)
            adult = User(
                name="Arun Sharma",
                email="arun@cybersaarthi.org",
                phone="9800000004",
                password_hash=pwd,
                user_mode="adult",
                preferred_language="en",
                font_scale="normal"
            )

            db_session.add_all([caretaker, senior, kid, adult])
            db_session.flush()

            # Add preferences
            for u in [caretaker, senior, kid, adult]:
                pref = UserPreference(
                    user_id=u.id,
                    complexity="simple" if u.user_mode in ['kid', 'senior'] else "detailed",
                    show_technical_details=u.user_mode in ['adult', 'caretaker'],
                    animation_level="reduced" if u.user_mode == 'senior' else 'standard'
                )
                db_session.add(pref)

            # Establish Caretaker relationships with Lakshmi and Riya
            rel_senior = CaretakerRelationship(
                caretaker_id=caretaker.id,
                ward_id=senior.id,
                status="ACTIVE",
                alert_scope="BLOCK_ONLY",
                notes="Family Elder Safety"
            )
            rel_kid = CaretakerRelationship(
                caretaker_id=caretaker.id,
                ward_id=kid.id,
                status="ACTIVE",
                alert_scope="BLOCK_AND_WARN",
                notes="Child Internet Monitoring"
            )
            db_session.add_all([rel_senior, rel_kid])

            # Add consents
            consent_senior = Consent(ward_id=senior.id, caretaker_id=caretaker.id, consent_type="security_monitoring", granted=True)
            consent_kid = Consent(ward_id=kid.id, caretaker_id=caretaker.id, consent_type="security_monitoring", granted=True)
            db_session.add_all([consent_senior, consent_kid])

            # Add Trusted Contact for Lakshmi
            contact = TrustedContact(
                user_id=senior.id,
                name="Suresh Kumar (Son / Caretaker)",
                relationship="Son",
                phone="9800000001",
                is_emergency=True
            )
            db_session.add(contact)

            # Add initial demo alert for Caretaker
            alert = Alert(
                ward_id=senior.id,
                caretaker_id=caretaker.id,
                severity="HIGH",
                title="Lakshmi Amma: Suspicious bank SMS detected earlier",
                summary="A message claiming 'SBI NetBanking Deactivated - Click sbi-kyc-verify.tk' was analyzed. Threat blocked.",
                status="UNREAD"
            )
            db_session.add(alert)

            db_session.commit()
            logger.info("Demo persona accounts successfully initialized.")
    except Exception as e:
        logger.error(f"Error seeding demo accounts: {e}")
        db_session.rollback()

def create_app():
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'frontend', 'dist'))

    app = Flask(__name__, static_folder=dist_dir, static_url_path='')
    app.config.from_object(Config)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database
    init_db()
    seed_demo_accounts_if_empty()

    # Blueprints
    from backend.app.routes.auth_routes import auth_bp
    from backend.app.routes.scan_routes import scan_bp
    from backend.app.routes.caretaker_routes import caretaker_bp
    from backend.app.routes.alert_routes import alert_bp
    from backend.app.routes.contact_routes import contact_bp
    from backend.app.routes.tips_routes import tips_bp
    from backend.app.routes.voice_routes import voice_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(scan_bp, url_prefix='/api/scan')
    app.register_blueprint(caretaker_bp, url_prefix='/api/caretaker')
    app.register_blueprint(alert_bp, url_prefix='/api/alerts')
    app.register_blueprint(contact_bp, url_prefix='/api/contacts')
    app.register_blueprint(tips_bp, url_prefix='/api/safety-tips')
    app.register_blueprint(voice_bp, url_prefix='/api/voice')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'project': 'CyberSaarthi',
            'tagline': 'A safer digital world for everyone.',
            'version': '1.0.0'
        }), 200

    # Serve React SPA for all frontend routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        if path != "" and os.path.exists(os.path.join(dist_dir, path)):
            return send_from_directory(dist_dir, path)
        index_file = os.path.join(dist_dir, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(dist_dir, 'index.html')
        return "Frontend build not found. Please run 'npm run build' inside frontend.", 404

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    return app
