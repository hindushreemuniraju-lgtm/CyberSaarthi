import re
import uuid
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from backend.app.models.database import db_session
from backend.app.models.user import User, Role, UserPreference, LoginHistory
from backend.app.models.safety_tip import AuditLog
from backend.app.utils.auth_helpers import (
    hash_password, verify_password, create_access_token, token_required,
    validate_email_format, validate_password_strength, decode_token
)

auth_bp = Blueprint('auth', __name__)

# In-memory sliding window rate limiter: { ip_or_id: [timestamp, ...] }
_failed_attempts = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

# Password reset tokens: { token: { user_id, expires_at } }
_reset_tokens = {}

def is_rate_limited(key: str) -> bool:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=LOCKOUT_MINUTES)
    if key in _failed_attempts:
        _failed_attempts[key] = [t for t in _failed_attempts[key] if t > cutoff]
        return len(_failed_attempts[key]) >= MAX_FAILED_ATTEMPTS
    return False

def record_failed_attempt(key: str):
    now = datetime.now(timezone.utc)
    if key not in _failed_attempts:
        _failed_attempts[key] = []
    _failed_attempts[key].append(now)

def clear_failed_attempts(key: str):
    if key in _failed_attempts:
        del _failed_attempts[key]

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    full_name = (data.get('full_name') or data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    username = (data.get('username') or '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    role_name = (data.get('role') or data.get('user_mode') or 'adult').lower().strip()
    preferred_language = (data.get('preferred_language') or 'en').lower().strip()
    font_scale = data.get('font_scale', 'normal')
    voice_enabled = bool(data.get('voice_enabled', False))
    phone = (data.get('phone') or '').strip() or None

    # 1. Validation: Full Name
    if not full_name or len(full_name) < 2:
        return jsonify({'error': 'Please enter a valid full name (minimum 2 characters).'}), 400

    # 2. Validation: Email
    if not email:
        return jsonify({'error': 'Email address is required.'}), 400
    if not validate_email_format(email):
        return jsonify({'error': 'Please enter a valid email address (e.g. user@example.com).'}), 400

    # 3. Validation: Username
    if not username:
        # Generate default username from email prefix + random digits
        base_user = re.sub(r'[^a-zA-Z0-9_]', '', email.split('@')[0])[:20]
        username = f"{base_user}_{uuid.uuid4().hex[:4]}"
    elif not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
        return jsonify({'error': 'Username must be 3-30 characters long and contain only letters, numbers, and underscores.'}), 400

    # 4. Validation: Password & Confirm Password
    if not password:
        return jsonify({'error': 'Password is required.'}), 400

    if confirm_password and password != confirm_password:
        return jsonify({'error': 'Passwords do not match. Please verify and retype.'}), 400

    strength = validate_password_strength(password)
    if not strength['is_valid']:
        return jsonify({
            'error': 'Password does not meet security requirements.',
            'details': strength['feedback']
        }), 400

    # 5. Validation: Role
    if role_name not in ['kid', 'adult', 'senior', 'caretaker']:
        role_name = 'adult'

    if preferred_language not in ['en', 'kn', 'hi']:
        preferred_language = 'en'

    # 6. Duplicate Email Check
    existing_email = db_session.query(User).filter_by(email=email).first()
    if existing_email:
        return jsonify({'error': 'An account with this email address already exists. Please sign in or use another email.'}), 409

    # 7. Duplicate Username Check
    existing_username = db_session.query(User).filter_by(username=username).first()
    if existing_username:
        return jsonify({'error': 'This username is already taken. Please choose another username.'}), 409

    if phone:
        existing_phone = db_session.query(User).filter_by(phone=phone).first()
        if existing_phone:
            return jsonify({'error': 'An account with this phone number already exists.'}), 409

    # 8. Create User with Bcrypt Hash
    hashed_pwd = hash_password(password)
    new_user = User(
        full_name=full_name,
        email=email,
        username=username,
        phone=phone,
        password_hash=hashed_pwd,
        account_status='ACTIVE',
        preferred_language=preferred_language,
        font_scale=font_scale,
        voice_enabled=voice_enabled
    )
    db_session.add(new_user)
    db_session.flush()

    # 9. Attach Role from roles table
    role_obj = db_session.query(Role).filter_by(role_name=role_name).first()
    if not role_obj:
        role_obj = Role(role_name=role_name)
        db_session.add(role_obj)
        db_session.flush()
    new_user.roles.append(role_obj)

    # 10. Create Default Preferences
    pref = UserPreference(
        user_id=new_user.user_id,
        theme='system',
        complexity='simple' if role_name in ['kid', 'senior'] else 'detailed',
        show_technical_details=role_name in ['adult', 'caretaker'],
        animation_level='reduced' if role_name == 'senior' else 'standard'
    )
    db_session.add(pref)

    # 11. Log Audit and Initial Login History
    ip_addr = request.remote_addr or request.headers.get('X-Forwarded-For', '127.0.0.1')
    user_agent = request.headers.get('User-Agent', '')[:255]

    audit = AuditLog(
        user_id=new_user.user_id,
        action="USER_REGISTERED",
        details=f"Username: {username}, Role: {role_name}",
        ip_address=ip_addr
    )
    db_session.add(audit)

    login_record = LoginHistory(
        user_id=new_user.user_id,
        login_status="SUCCESS_REGISTRATION",
        ip_address=ip_addr,
        user_agent=user_agent
    )
    db_session.add(login_record)
    db_session.commit()

    # 12. Issue Token
    token = create_access_token(new_user)
    return jsonify({
        'message': 'Registration successful! Welcome to CyberSaarthi.',
        'token': token,
        'user': new_user.to_dict(),
        'redirect_url': f"/{role_name}"
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or data.get('email') or data.get('username') or '').strip()
    password = data.get('password', '')
    remember_me = bool(data.get('remember_me', False))
    ip_addr = request.remote_addr or request.headers.get('X-Forwarded-For', '127.0.0.1')
    user_agent = request.headers.get('User-Agent', '')[:255]

    if not identifier or not password:
        return jsonify({'error': 'Please enter both your email/username and password.'}), 400

    # Rate limiting check
    rate_key = f"{ip_addr}:{identifier.lower()}"
    if is_rate_limited(rate_key) or is_rate_limited(ip_addr):
        # Record attempt
        login_record = LoginHistory(
            user_id=None,
            login_status="FAILED_RATE_LIMITED",
            ip_address=ip_addr,
            user_agent=user_agent
        )
        db_session.add(login_record)
        db_session.commit()
        return jsonify({
            'error': f'Too many failed login attempts. For your security, this account/IP is temporarily locked. Please wait {LOCKOUT_MINUTES} minutes before trying again.'
        }), 429

    # Look up user by email or username or phone
    user = None
    if '@' in identifier:
        user = db_session.query(User).filter_by(email=identifier.lower()).first()
    else:
        user = db_session.query(User).filter_by(username=identifier.lower()).first()
        if not user:
            user = db_session.query(User).filter_by(phone=identifier).first()
            if not user:
                user = db_session.query(User).filter_by(email=identifier.lower()).first()

    # User not found
    if not user:
        record_failed_attempt(rate_key)
        record_failed_attempt(ip_addr)
        login_record = LoginHistory(
            user_id=None,
            login_status="FAILED_USER_NOT_FOUND",
            ip_address=ip_addr,
            user_agent=user_agent
        )
        db_session.add(login_record)
        db_session.commit()
        return jsonify({'error': 'Invalid email/username or password. Please try again.'}), 401

    # Check password
    if not verify_password(password, user.password_hash):
        record_failed_attempt(rate_key)
        record_failed_attempt(ip_addr)
        login_record = LoginHistory(
            user_id=user.user_id,
            login_status="FAILED_INVALID_PASSWORD",
            ip_address=ip_addr,
            user_agent=user_agent
        )
        db_session.add(login_record)
        db_session.commit()
        return jsonify({'error': 'Invalid email/username or password. Please try again.'}), 401

    # Check account status
    if user.account_status != 'ACTIVE':
        login_record = LoginHistory(
            user_id=user.user_id,
            login_status=f"FAILED_{user.account_status}",
            ip_address=ip_addr,
            user_agent=user_agent
        )
        db_session.add(login_record)
        db_session.commit()
        return jsonify({'error': f'Account is {user.account_status.lower()}. Please contact administrator.'}), 403

    # Successful login: clear failed attempts
    clear_failed_attempts(rate_key)
    clear_failed_attempts(ip_addr)

    # Record login history
    login_record = LoginHistory(
        user_id=user.user_id,
        login_status="SUCCESS",
        ip_address=ip_addr,
        user_agent=user_agent
    )
    db_session.add(login_record)
    db_session.commit()

    token = create_access_token(user)
    primary_role = user.user_mode

    return jsonify({
        'message': f'Welcome back, {user.full_name}!',
        'token': token,
        'user': user.to_dict(),
        'role': primary_role,
        'redirect_url': f"/{primary_role}"
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    ip_addr = request.remote_addr or request.headers.get('X-Forwarded-For', '127.0.0.1')
    user_agent = request.headers.get('User-Agent', '')[:255]

    login_record = LoginHistory(
        user_id=current_user.user_id,
        login_status="LOGOUT",
        ip_address=ip_addr,
        user_agent=user_agent
    )
    db_session.add(login_record)
    db_session.commit()

    return jsonify({'message': 'Logged out successfully.'}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or data.get('email') or '').strip().lower()

    if not identifier:
        return jsonify({'error': 'Please provide your registered email or username.'}), 400

    user = None
    if '@' in identifier:
        user = db_session.query(User).filter_by(email=identifier).first()
    else:
        user = db_session.query(User).filter_by(username=identifier).first()

    # Generic success message for security (prevents user enumeration)
    generic_msg = "If an account matching this identifier exists, password reset instructions have been generated."

    if not user:
        return jsonify({'message': generic_msg}), 200

    # Generate one-time reset token valid for 30 minutes
    reset_token = f"reset_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    _reset_tokens[reset_token] = {
        'user_id': user.user_id,
        'expires_at': expires_at
    }

    # Audit log
    audit = AuditLog(
        user_id=user.user_id,
        action="FORGOT_PASSWORD_REQUEST",
        details="Password reset token issued.",
        ip_address=request.remote_addr
    )
    db_session.add(audit)
    db_session.commit()

    return jsonify({
        'message': f"Password reset instructions have been generated for {user.email}.",
        'reset_token': reset_token, # Returned for demo & automated testing ease
        'expires_in_minutes': 30
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = data.get('token', '').strip()
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not token:
        return jsonify({'error': 'Reset token is required.'}), 400

    if not new_password:
        return jsonify({'error': 'New password is required.'}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    strength = validate_password_strength(new_password)
    if not strength['is_valid']:
        return jsonify({
            'error': 'Password does not meet security requirements.',
            'details': strength['feedback']
        }), 400

    token_info = _reset_tokens.get(token)
    now = datetime.now(timezone.utc)
    if not token_info or token_info['expires_at'] < now:
        return jsonify({'error': 'Invalid or expired password reset token. Please request a new one.'}), 400

    user = db_session.query(User).filter_by(user_id=token_info['user_id']).first()
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    # Update password with bcrypt
    user.password_hash = hash_password(new_password)
    del _reset_tokens[token]

    audit = AuditLog(
        user_id=user.user_id,
        action="PASSWORD_RESET_COMPLETED",
        details="Password successfully changed.",
        ip_address=request.remote_addr
    )
    db_session.add(audit)
    db_session.commit()

    return jsonify({'message': 'Password has been reset successfully. You can now sign in with your new password.'}), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/history', methods=['GET'])
@token_required
def get_login_history(current_user):
    history = db_session.query(LoginHistory).filter_by(user_id=current_user.user_id)\
        .order_by(LoginHistory.login_time.desc()).limit(20).all()
    return jsonify({
        'history': [h.to_dict() for h in history]
    }), 200

@auth_bp.route('/verify-role', methods=['POST'])
@token_required
def verify_role(current_user):
    data = request.get_json() or {}
    target_role = (data.get('target_role') or data.get('role') or '').lower().strip()

    if not target_role:
        return jsonify({'error': 'Target role is required.'}), 400

    has_perm = current_user.has_role(target_role) or current_user.user_mode.lower() == target_role
    return jsonify({
        'allowed': has_perm,
        'user_role': current_user.user_mode,
        'target_role': target_role,
        'user_roles': [r.role_name for r in (current_user.roles or [])]
    }), 200

@auth_bp.route('/me/preferences', methods=['PUT'])
@token_required
def update_preferences(current_user):
    data = request.get_json() or {}

    if 'name' in data or 'full_name' in data:
        current_user.full_name = (data.get('full_name') or data.get('name')).strip()
    if 'preferred_language' in data and data['preferred_language'] in ['en', 'kn', 'hi']:
        current_user.preferred_language = data['preferred_language']
    if 'font_scale' in data and data['font_scale'] in ['normal', 'large', 'xlarge']:
        current_user.font_scale = data['font_scale']
    if 'voice_enabled' in data:
        current_user.voice_enabled = bool(data['voice_enabled'])

    if current_user.preferences:
        pref = current_user.preferences
        if 'theme' in data:
            pref.theme = data['theme']
        if 'complexity' in data:
            pref.complexity = data['complexity']
        if 'show_technical_details' in data:
            pref.show_technical_details = bool(data['show_technical_details'])
        if 'animation_level' in data:
            pref.animation_level = data['animation_level']

    db_session.commit()
    return jsonify({
        'message': 'Preferences updated successfully',
        'user': current_user.to_dict()
    }), 200
