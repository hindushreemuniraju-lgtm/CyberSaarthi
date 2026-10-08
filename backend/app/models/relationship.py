import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship as orm_relationship
from backend.app.models.database import Base

class CaretakerRelationship(Base):
    __tablename__ = 'caretaker_relationships'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    caretaker_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    ward_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(20), nullable=False, default='PENDING') # 'PENDING', 'ACTIVE', 'REVOKED'
    alert_scope = Column(String(30), nullable=False, default='BLOCK_ONLY') # 'BLOCK_ONLY', 'BLOCK_AND_WARN', 'ALL_ACTIVITY'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    caretaker = orm_relationship("User", foreign_keys=[caretaker_id])
    ward = orm_relationship("User", foreign_keys=[ward_id])

    def to_dict(self):
        return {
            "id": self.id,
            "caretaker_id": self.caretaker_id,
            "ward_id": self.ward_id,
            "caretaker_name": self.caretaker.name if self.caretaker else None,
            "ward_name": self.ward.name if self.ward else None,
            "ward_mode": self.ward.user_mode if self.ward else None,
            "status": self.status,
            "alert_scope": self.alert_scope,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Consent(Base):
    __tablename__ = 'consents'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ward_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    caretaker_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    consent_type = Column(String(64), nullable=False) # 'security_monitoring', 'alert_notifications'
    granted = Column(Boolean, nullable=False, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)

    ward = orm_relationship("User", foreign_keys=[ward_id])
    caretaker = orm_relationship("User", foreign_keys=[caretaker_id])

    def to_dict(self):
        return {
            "id": self.id,
            "ward_id": self.ward_id,
            "caretaker_id": self.caretaker_id,
            "consent_type": self.consent_type,
            "granted": self.granted,
            "granted_at": self.granted_at.isoformat() if self.granted_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None
        }
