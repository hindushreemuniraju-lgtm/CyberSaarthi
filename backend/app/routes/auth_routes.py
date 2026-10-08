import uuid
from flask import Blueprint, request, jsonify
from backend.app.models.database import db_session
from backend.app.models.user import User, UserPreference
from backend.app.models.safety_tip import AuditLog
from backend.app.utils.auth_helpers import (
    hash_password, verify_password, create_access_token, token_required
)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower() or None
    phone = (data.get('phone') or '').strip() or None
    password = data.get('password', '')
    user_mode = data.get('user_mode', 'adult').lower()
    preferred_language = data.get('preferred_language', 'en').lower()
    font_scale = data.get('font_scale', 'normal')
    voice_enabled = bool(data.get('voice_enabled', False))

    if not name or not password:
        return jsonify({'error': 'Name and password are required.'}), 400

    if not email and not phone:
        return jsonify({'error': 'Either email or phone is required.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

    # Check existing user
    if email:
        existing_email = db_session.query(User).filter_by(email=email).first()
        if existing_email:
            return jsonify({'error': 'An account with this email already exists.'}), 409
    if phone:
        existing_phone = db_session.query(User).filter_by(phone=phone).first()
        if existing_phone:
            return jsonify({'error': 'An account with this phone already exists.'}), 409

    if user_mode not in ['kid', 'adult', 'senior', 'caretaker']:
        user_mode = 'adult'
    if preferred_language not in ['en', 'kn', 'hi']:
        preferred_language = 'en'

    new_user = User(
        name=name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        user_mode=user_mode,
        preferred_language=preferred_language,
        font_scale=font_scale,
        voice_enabled=voice_enabled
    )
    db_session.add(new_user)
    db_session.flush()

    # Create default preferences
    pref = UserPreference(
        user_id=new_user.id,
        theme='system',
        complexity='simple' if user_mode in ['kid', 'senior'] else 'detailed',
        show_technical_details=user_mode in ['adult', 'caretaker'],
        animation_level='reduced' if user_mode == 'senior' else 'standard'
    )
    db_session.add(pref)

    # Audit log
    audit = AuditLog(user_id=new_user.id, action="USER_REGISTERED", details=f"Mode: {user_mode}")
    db_session.add(audit)
    db_session.commit()

    token = create_access_token(new_user.id, new_user.user_mode)
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or data.get('email') or '').strip()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({'error': 'Identifier (email/phone) and password are required.'}), 400

    user = None
    if '@' in identifier:
        user = db_session.query(User).filter_by(email=identifier.lower()).first()
    else:
        user = db_session.query(User).filter_by(phone=identifier).first()
        if not user:
            user = db_session.query(User).filter_by(email=identifier.lower()).first()

    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid credentials.'}), 401

    token = create_access_token(user.id, user.user_mode)
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/me/preferences', methods=['PUT'])
@token_required
def update_preferences(current_user):
    data = request.get_json() or {}

    if 'name' in data:
        current_user.name = data['name'].strip()
    if 'user_mode' in data and data['user_mode'] in ['kid', 'adult', 'senior', 'caretaker']:
        current_user.user_mode = data['user_mode']
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
