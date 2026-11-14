import re
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify
from backend.app.config.settings import Config
from backend.app.models.database import db_session
from backend.app.models.user import User

def hash_password(password: str) -> str:
    """Hashes a password securely using bcrypt with 12 salt rounds."""
    if not password:
        raise ValueError("Password cannot be empty")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifies a password against a hash.
    Supports standard bcrypt ($2a$, $2b$, $2y$) and legacy Werkzeug pbkdf2/scrypt hashes.
    """
    if not password or not hashed_password:
        return False
    
    # Check if bcrypt hash
    if hashed_password.startswith(('$2a$', '$2b$', '$2y$')):
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False
            
    # Fallback to Werkzeug check_password_hash for legacy compatibility
    try:
        from werkzeug.security import check_password_hash
        return check_password_hash(hashed_password, password)
    except Exception:
        return False

def validate_email_format(email: str) -> bool:
    """Validates standard RFC-compliant email pattern."""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email.strip()))

def validate_password_strength(password: str) -> dict:
    """
    Validates password complexity:
    - Min 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
    """
    score = 0
    feedback = []

    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Password must be at least 8 characters long.")

    if re.search(r'[A-Z]', password):
        score += 1
    else:
        feedback.append("Include at least one uppercase letter (A-Z).")

    if re.search(r'[a-z]', password):
        score += 1
    else:
        feedback.append("Include at least one lowercase letter (a-z).")

    if re.search(r'[0-9]', password):
        score += 1
    else:
        feedback.append("Include at least one number (0-9).")

    if re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]', password):
        score += 1
    else:
        feedback.append("Include at least one special symbol (!@#$%^&* etc.).")

    level = "weak"
    if score >= 5:
        level = "very_strong"
    elif score >= 4:
        level = "strong"
    elif score >= 3:
        level = "medium"

    return {
        "is_valid": score >= 3 and len(password) >= 6,
        "is_recommended": score >= 4,
        "score": score,
        "level": level,
        "feedback": feedback
    }

def create_access_token(user: User) -> str:
    """Generates a signed JWT with user identity and assigned role."""
    now = datetime.now(timezone.utc)
    payload = {
        'sub': user.user_id,
        'user_id': user.user_id,
        'email': user.email,
        'username': user.username,
        'name': user.full_name,
        'role': user.user_mode,
        'mode': user.user_mode,
        'iat': now,
        'exp': now + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

def decode_token(token: str):
    """Decodes and verifies a JWT token."""
    try:
        return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Enforces valid JWT authentication and loads current_user."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header is missing'}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header format'}), 401

        token = parts[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired. Please sign in again.'}), 401

        user_id = payload.get('sub') or payload.get('user_id')
        user = db_session.query(User).filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User account not found'}), 401

        if user.account_status != 'ACTIVE':
            return jsonify({'error': f'Account is {user.account_status.lower()}. Please contact administrator.'}), 403

        return f(current_user=user, *args, **kwargs)
    return decorated

def role_required(allowed_roles):
    """
    Enforces that the authenticated user possesses at least one of the allowed roles.
    e.g. @role_required(['caretaker'])
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(f):
        @wraps(f)
        @token_required
        def decorated_function(current_user, *args, **kwargs):
            user_roles = [r.role_name.lower() for r in (current_user.roles or [])]
            # Also check user_mode property
            if current_user.user_mode:
                user_roles.append(current_user.user_mode.lower())

            has_permission = any(role.lower() in user_roles for role in allowed_roles)
            if not has_permission:
                return jsonify({
                    'error': f'Access denied: This dashboard/action requires one of the following roles: {", ".join(allowed_roles)}. Your role is {current_user.user_mode}.',
                    'required_roles': allowed_roles,
                    'user_role': current_user.user_mode
                }), 403

            return f(current_user=current_user, *args, **kwargs)
        return decorated_function
    return decorator

def optional_token(f):
    """Optionally attaches current_user if valid JWT is present, without failing if missing."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        current_user = None
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
                payload = decode_token(token)
                if payload:
                    user_id = payload.get('sub') or payload.get('user_id')
                    current_user = db_session.query(User).filter_by(user_id=user_id).first()
        return f(current_user=current_user, *args, **kwargs)
    return decorated
