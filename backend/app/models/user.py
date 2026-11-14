import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, synonym
from backend.app.models.database import Base

class Role(Base):
    __tablename__ = 'roles'

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), unique=True, nullable=False) # 'kid', 'adult', 'senior', 'caretaker'

    users = relationship("User", secondary="user_roles", back_populates="roles")

    def to_dict(self):
        return {
            "role_id": self.role_id,
            "role_name": self.role_name
        }

class UserRole(Base):
    __tablename__ = 'user_roles'

    user_id = Column(String(36), ForeignKey('users.user_id', ondelete='CASCADE'), primary_key=True)
    role_id = Column(Integer, ForeignKey('roles.role_id', ondelete='CASCADE'), primary_key=True)

class User(Base):
    __tablename__ = 'users'

    user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(120), nullable=False)
    email = Column(String(191), unique=True, nullable=False)
    username = Column(String(64), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    account_status = Column(String(20), nullable=False, default='ACTIVE') # 'ACTIVE', 'SUSPENDED', 'PENDING'
    preferred_language = Column(String(10), nullable=False, default='en') # 'en', 'kn', 'hi'
    font_scale = Column(String(20), nullable=False, default='normal') # 'normal', 'large', 'xlarge'
    voice_enabled = Column(Boolean, nullable=False, default=False)
    phone = Column(String(32), unique=True, nullable=True) # Optional secondary contact identifier

    # Compatibility synonyms for legacy code & queries
    id = synonym('user_id')
    name = synonym('full_name')

    @property
    def user_mode(self):
        if self.roles and len(self.roles) > 0:
            return self.roles[0].role_name
        return 'adult'

    @user_mode.setter
    def user_mode(self, mode_name):
        from backend.app.models.database import db_session
        if not mode_name:
            return
        role_obj = db_session.query(Role).filter_by(role_name=mode_name.lower()).first()
        if role_obj:
            self.roles = [role_obj]

    def has_role(self, role_name: str) -> bool:
        return any(r.role_name.lower() == role_name.lower() for r in (self.roles or []))

    # Relationships
    roles = relationship("Role", secondary="user_roles", back_populates="users", lazy="joined")
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    trusted_contacts = relationship("TrustedContact", back_populates="user", cascade="all, delete-orphan")
    scans = relationship("ScanEvent", back_populates="user")
    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        role_names = [r.role_name for r in (self.roles or [])]
        primary_role = role_names[0] if role_names else 'adult'
        return {
            "user_id": self.user_id,
            "id": self.user_id,
            "full_name": self.full_name,
            "name": self.full_name,
            "email": self.email,
            "username": self.username,
            "phone": self.phone,
            "account_status": self.account_status,
            "role": primary_role,
            "roles": role_names,
            "user_mode": primary_role,
            "preferred_language": self.preferred_language,
            "font_scale": self.font_scale,
            "voice_enabled": self.voice_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "preferences": self.preferences.to_dict() if self.preferences else None
        }

class UserPreference(Base):
    __tablename__ = 'user_preferences'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    theme = Column(String(32), default='system')
    complexity = Column(String(20), default='detailed') # 'simple', 'detailed'
    show_technical_details = Column(Boolean, default=True)
    animation_level = Column(String(20), default='standard') # 'none', 'reduced', 'standard'
    alert_frequency = Column(String(20), default='instant')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="preferences")

    def to_dict(self):
        return {
            "id": self.id,
            "theme": self.theme,
            "complexity": self.complexity,
            "show_technical_details": self.show_technical_details,
            "animation_level": self.animation_level,
            "alert_frequency": self.alert_frequency
        }

class LoginHistory(Base):
    __tablename__ = 'login_history'

    login_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.user_id', ondelete='SET NULL'), nullable=True)
    login_time = Column(DateTime, default=datetime.utcnow)
    login_status = Column(String(50), nullable=False) # 'SUCCESS', 'FAILED_INVALID_PASSWORD', 'FAILED_USER_NOT_FOUND', 'LOGOUT', 'RATE_LIMITED'
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)

    user = relationship("User", back_populates="login_history")

    def to_dict(self):
        return {
            "login_id": self.login_id,
            "user_id": self.user_id,
            "login_time": self.login_time.isoformat() if self.login_time else None,
            "login_status": self.login_status,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent
        }
