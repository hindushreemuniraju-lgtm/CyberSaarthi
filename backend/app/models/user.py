import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.models.database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False)
    email = Column(String(191), unique=True, nullable=True)
    phone = Column(String(32), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    user_mode = Column(String(20), nullable=False, default='adult') # 'kid', 'adult', 'senior', 'caretaker'
    preferred_language = Column(String(10), nullable=False, default='en') # 'en', 'kn', 'hi'
    font_scale = Column(String(20), nullable=False, default='normal') # 'normal', 'large', 'xlarge'
    voice_enabled = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    trusted_contacts = relationship("TrustedContact", back_populates="user", cascade="all, delete-orphan")
    scans = relationship("ScanEvent", back_populates="user")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "user_mode": self.user_mode,
            "preferred_language": self.preferred_language,
            "font_scale": self.font_scale,
            "voice_enabled": self.voice_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "preferences": self.preferences.to_dict() if self.preferences else None
        }

class UserPreference(Base):
    __tablename__ = 'user_preferences'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
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
