"""
CyberSaarthi RDBMS Setup & Migration Script
Initializes MySQL 'cybersaarthi_db' or fallback SQLite database with:
- users, roles, user_roles, caretaker_links, login_history
- user_preferences, trusted_contacts, scan_events, alerts, safety_tips, audit_logs
- Master roles and demo persona accounts
"""

import os
import sys
import re
from pathlib import Path
from sqlalchemy import text, inspect, create_engine

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.config.settings import Config
from backend.app.models.database import engine, db_session, init_db, Base
from backend.app.models.user import User, Role, UserRole, UserPreference, LoginHistory
from backend.app.models.relationship import CaretakerLink
from backend.app.models.contact import TrustedContact
from backend.app.models.alert import Alert
from backend.app.models.safety_tip import SafetyTip, AuditLog
from backend.app.utils.auth_helpers import hash_password

def ensure_mysql_database_exists():
    """If using MySQL, connects to the server and creates 'cybersaarthi_db' if it doesn't exist."""
    db_url = Config.DATABASE_URL
    if db_url.startswith('mysql'):
        try:
            # Parse server URL without database name
            # Format: mysql+pymysql://user:pass@host:port/dbname
            match = re.match(r'^(mysql\+[a-zA-Z0-9]+://[^/]+)/([^?]+)(.*)$', db_url)
            if match:
                server_url, db_name, query_params = match.groups()
                server_engine = create_engine(server_url + ('/' if not query_params else '/?' + query_params.lstrip('?')))
                with server_engine.connect() as conn:
                    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))
                    conn.commit()
                print(f"[+] MySQL Database '{db_name}' ensured on server.")
        except Exception as e:
            print(f"[!] Note: Could not auto-create database on MySQL server ({e}).")

def migrate_schema_if_needed():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if 'users' in tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'user_id' not in columns:
            print("[!] Detected legacy schema without 'user_id' column in 'users'. Upgrading schema...")
            # Drop obsolete tables to recreate with proper RDBMS constraints
            with engine.connect() as conn:
                for tbl in ['user_roles', 'caretaker_links', 'caretaker_relationships', 'consents', 'login_history', 'user_preferences', 'trusted_contacts', 'alerts', 'scan_events', 'audit_logs', 'roles', 'users']:
                    try:
                        conn.execute(text(f"DROP TABLE IF EXISTS {tbl}"))
                    except Exception:
                        pass
                conn.commit()
            print("[+] Legacy tables dropped. Ready for new RDBMS schema.")

def seed_database():
    print("[*] Checking master roles...")
    roles_data = [
        (1, "kid"),
        (2, "adult"),
        (3, "senior"),
        (4, "caretaker")
    ]
    for r_id, r_name in roles_data:
        existing = db_session.query(Role).filter_by(role_name=r_name).first()
        if not existing:
            db_session.add(Role(role_id=r_id, role_name=r_name))
    db_session.commit()
    print("[+] Master roles verified (kid, adult, senior, caretaker).")

    print("[*] Checking demo user accounts...")
    demos = [
        {
            "name": "Suresh Kumar (Caretaker)",
            "email": "caretaker@cybersaarthi.org",
            "username": "suresh_caretaker",
            "password": "DemoPass123!",
            "role": "caretaker",
            "phone": "9800000001",
            "lang": "en",
            "font": "normal",
            "voice": False
        },
        {
            "name": "Lakshmi Amma",
            "email": "lakshmi@cybersaarthi.org",
            "username": "lakshmi_amma",
            "password": "DemoPass123!",
            "role": "senior",
            "phone": "9800000002",
            "lang": "kn",
            "font": "large",
            "voice": True
        },
        {
            "name": "Riya",
            "email": "riya@cybersaarthi.org",
            "username": "riya_kid",
            "password": "DemoPass123!",
            "role": "kid",
            "phone": "9800000003",
            "lang": "en",
            "font": "normal",
            "voice": False
        },
        {
            "name": "Arun Sharma",
            "email": "arun@cybersaarthi.org",
            "username": "arun_adult",
            "password": "DemoPass123!",
            "role": "adult",
            "phone": "9800000004",
            "lang": "en",
            "font": "normal",
            "voice": False
        }
    ]

    created_users = {}
    for d in demos:
        u = db_session.query(User).filter((User.email == d["email"]) | (User.username == d["username"])).first()
        if not u:
            hashed = hash_password(d["password"])
            u = User(
                full_name=d["name"],
                email=d["email"],
                username=d["username"],
                password_hash=hashed,
                account_status="ACTIVE",
                preferred_language=d["lang"],
                font_scale=d["font"],
                voice_enabled=d["voice"],
                phone=d["phone"]
            )
            db_session.add(u)
            db_session.flush()

            # Attach role
            role_obj = db_session.query(Role).filter_by(role_name=d["role"]).first()
            if role_obj:
                u.roles.append(role_obj)

            # Attach preferences
            pref = UserPreference(
                user_id=u.user_id,
                theme="system",
                complexity="simple" if d["role"] in ["kid", "senior"] else "detailed",
                show_technical_details=d["role"] in ["adult", "caretaker"],
                animation_level="reduced" if d["role"] == "senior" else "standard"
            )
            db_session.add(pref)
            db_session.commit()
            print(f"[+] Created user: {u.username} ({d['role']})")
        created_users[d["role"]] = u

    # Caretaker links
    caretaker = created_users.get("caretaker")
    senior = created_users.get("senior")
    kid = created_users.get("kid")

    if caretaker and senior:
        link_senior = db_session.query(CaretakerLink).filter(
            CaretakerLink.caretaker_user_id == caretaker.user_id,
            CaretakerLink.linked_user_id == senior.user_id
        ).first()
        if not link_senior:
            db_session.add(CaretakerLink(
                caretaker_user_id=caretaker.user_id,
                linked_user_id=senior.user_id,
                consent_status="ACTIVE"
            ))

    if caretaker and kid:
        link_kid = db_session.query(CaretakerLink).filter(
            CaretakerLink.caretaker_user_id == caretaker.user_id,
            CaretakerLink.linked_user_id == kid.user_id
        ).first()
        if not link_kid:
            db_session.add(CaretakerLink(
                caretaker_user_id=caretaker.user_id,
                linked_user_id=kid.user_id,
                consent_status="ACTIVE"
            ))

    # Trusted Emergency Contact for Senior
    if senior:
        contact = db_session.query(TrustedContact).filter_by(user_id=senior.user_id).first()
        if not contact:
            db_session.add(TrustedContact(
                user_id=senior.user_id,
                name="Suresh Kumar (Son / Caretaker)",
                relationship="Son",
                phone="9800000001",
                is_emergency=True
            ))

    # Seed initial demo alert
    if caretaker and senior:
        alert = db_session.query(Alert).filter_by(ward_id=senior.user_id, caretaker_id=caretaker.user_id).first()
        if not alert:
            db_session.add(Alert(
                ward_id=senior.user_id,
                caretaker_id=caretaker.user_id,
                severity="HIGH",
                title="Lakshmi Amma: Suspicious bank SMS detected",
                summary="A message claiming 'SBI NetBanking Deactivated - Click sbi-kyc-verify.tk' was analyzed. Threat blocked.",
                status="UNREAD"
            ))

    db_session.commit()
    print("[+] Database seeding completed successfully.")

def main():
    print("=" * 60)
    print("CyberSaarthi RDBMS Initialization & Setup")
    print(f"Target Database URL: {Config.DATABASE_URL}")
    print("=" * 60)

    try:
        ensure_mysql_database_exists()
        migrate_schema_if_needed()
        init_db()
        seed_database()
        print("[SUCCESS] CyberSaarthi database is fully initialized and verified.")
    except Exception as e:
        print(f"[ERROR] Failed to initialize database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
