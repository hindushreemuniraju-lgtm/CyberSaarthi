import os
import logging
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from backend.app.config.settings import Config
from backend.app.models.database import init_db, db_session
from backend.app.models.user import User, Role, UserPreference, LoginHistory
from backend.app.models.relationship import CaretakerLink, Consent
from backend.app.models.contact import TrustedContact
from backend.app.models.alert import Alert
from backend.app.utils.auth_helpers import hash_password

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger(__name__)

def seed_demo_accounts_if_empty():
    try:
        # 1. Ensure master roles exist
        roles_map = {}
        for r_id, r_name in [(1, 'kid'), (2, 'adult'), (3, 'senior'), (4, 'caretaker')]:
            r_obj = db_session.query(Role).filter_by(role_name=r_name).first()
            if not r_obj:
                r_obj = Role(role_id=r_id, role_name=r_name)
                db_session.add(r_obj)
                db_session.flush()
            roles_map[r_name] = r_obj
        db_session.commit()

        # 2. Check users count
        user_count = db_session.query(User).count()
        if user_count == 0:
            logger.info("Database is empty. Seeding initial demo persona accounts with bcrypt...")
            pwd = hash_password("DemoPass123!")

            # 1. Caretaker
            caretaker = User(
                full_name="Suresh Kumar (Caretaker)",
                email="caretaker@cybersaarthi.org",
                username="suresh_caretaker",
                phone="9800000001",
                password_hash=pwd,
                account_status="ACTIVE",
                preferred_language="en",
                font_scale="normal"
            )
            caretaker.roles.append(roles_map['caretaker'])

            # 2. Senior (Lakshmi)
            senior = User(
                full_name="Lakshmi Amma",
                email="lakshmi@cybersaarthi.org",
                username="lakshmi_amma",
                phone="9800000002",
                password_hash=pwd,
                account_status="ACTIVE",
                preferred_language="kn",
                font_scale="large",
                voice_enabled=True
            )
            senior.roles.append(roles_map['senior'])

            # 3. Kid (Riya)
            kid = User(
                full_name="Riya",
                email="riya@cybersaarthi.org",
                username="riya_kid",
                phone="9800000003",
                password_hash=pwd,
                account_status="ACTIVE",
                preferred_language="en",
                font_scale="normal"
            )
            kid.roles.append(roles_map['kid'])

            # 4. Adult (Arun)
            adult = User(
                full_name="Arun Sharma",
                email="arun@cybersaarthi.org",
                username="arun_adult",
                phone="9800000004",
                password_hash=pwd,
                account_status="ACTIVE",
                preferred_language="en",
                font_scale="normal"
            )
            adult.roles.append(roles_map['adult'])

            db_session.add_all([caretaker, senior, kid, adult])
            db_session.flush()

            # Add preferences
            for u, r_name in [(caretaker, 'caretaker'), (senior, 'senior'), (kid, 'kid'), (adult, 'adult')]:
                pref = UserPreference(
                    user_id=u.user_id,
                    complexity="simple" if r_name in ['kid', 'senior'] else "detailed",
                    show_technical_details=r_name in ['adult', 'caretaker'],
                    animation_level="reduced" if r_name == 'senior' else 'standard'
                )
                db_session.add(pref)

            # Establish Caretaker relationships with Lakshmi and Riya
            rel_senior = CaretakerLink(
                caretaker_user_id=caretaker.user_id,
                linked_user_id=senior.user_id,
                consent_status="ACTIVE",
                alert_scope="BLOCK_ONLY",
                notes="Family Elder Safety"
            )
            rel_kid = CaretakerLink(
                caretaker_user_id=caretaker.user_id,
                linked_user_id=kid.user_id,
                consent_status="ACTIVE",
                alert_scope="BLOCK_AND_WARN",
                notes="Child Internet Monitoring"
            )
            db_session.add_all([rel_senior, rel_kid])

            # Add consents
            consent_senior = Consent(ward_id=senior.user_id, caretaker_id=caretaker.user_id, consent_type="security_monitoring", granted=True)
            consent_kid = Consent(ward_id=kid.user_id, caretaker_id=caretaker.user_id, consent_type="security_monitoring", granted=True)
            db_session.add_all([consent_senior, consent_kid])

            # Add Trusted Contact for Lakshmi
            contact = TrustedContact(
                user_id=senior.user_id,
                name="Suresh Kumar (Son / Caretaker)",
                relationship="Son",
                phone="9800000001",
                is_emergency=True
            )
            db_session.add(contact)

            # Add initial demo alert for Caretaker
            alert = Alert(
                ward_id=senior.user_id,
                caretaker_id=caretaker.user_id,
                severity="HIGH",
                title="Lakshmi Amma: Suspicious bank SMS detected earlier",
                summary="A message claiming 'SBI NetBanking Deactivated - Click sbi-kyc-verify.tk' was analyzed. Threat blocked.",
                status="UNREAD"
            )
            db_session.add(alert)

            db_session.commit()
            logger.info("Demo persona accounts successfully initialized with RDBMS roles.")
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

    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'project': 'CyberSaarthi',
            'database': 'cybersaarthi_db',
            'tagline': 'A safer digital world for everyone.',
            'version': '2.0.0'
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

    @app.errorhandler(404)
    def handle_404(e):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Endpoint not found', 'path': request.path}), 404
        index_file = os.path.join(dist_dir, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(dist_dir, 'index.html')
        return "Frontend build not found. Please run 'npm run build' inside frontend.", 404

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    return app
