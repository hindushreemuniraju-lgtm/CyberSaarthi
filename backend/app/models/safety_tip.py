import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from backend.app.models.database import Base

class SafetyTip(Base):
    __tablename__ = 'safety_tips'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category = Column(String(64), nullable=False)
    target_mode = Column(String(20), nullable=False, default='all') # 'all', 'kid', 'adult', 'senior', 'caretaker'
    title_en = Column(String(191), nullable=False)
    title_kn = Column(String(191), nullable=False)
    title_hi = Column(String(191), nullable=False)
    content_en = Column(Text, nullable=False)
    content_kn = Column(Text, nullable=False)
    content_hi = Column(Text, nullable=False)
    icon = Column(String(64), default='shield')
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self, lang='en'):
        title = getattr(self, f"title_{lang}", self.title_en)
        content = getattr(self, f"content_{lang}", self.content_en)
        return {
            "id": self.id,
            "category": self.category,
            "target_mode": self.target_mode,
            "title": title or self.title_en,
            "content": content or self.content_en,
            "icon": self.icon,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action": self.action,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
