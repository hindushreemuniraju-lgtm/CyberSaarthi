import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship as orm_relationship, synonym
from backend.app.models.database import Base

class CaretakerLink(Base):
    __tablename__ = 'caretaker_links'

    link_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    caretaker_user_id = Column(String(36), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    linked_user_id = Column(String(36), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    consent_status = Column(String(20), nullable=False, default='PENDING') # 'PENDING', 'ACTIVE', 'REVOKED'
    alert_scope = Column(String(30), nullable=False, default='BLOCK_ONLY') # 'BLOCK_ONLY', 'BLOCK_AND_WARN', 'ALL_ACTIVITY'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Synonyms for querying and attribute access
    id = synonym('link_id')
    caretaker_id = synonym('caretaker_user_id')
    ward_id = synonym('linked_user_id')
    status = synonym('consent_status')

    caretaker = orm_relationship("User", foreign_keys=[caretaker_user_id])
    linked_user = orm_relationship("User", foreign_keys=[linked_user_id])

    @property
    def ward(self):
        return self.linked_user

    def to_dict(self):
        return {
            "link_id": self.link_id,
            "id": self.link_id,
            "caretaker_user_id": self.caretaker_user_id,
            "caretaker_id": self.caretaker_user_id,
            "linked_user_id": self.linked_user_id,
            "ward_id": self.linked_user_id,
            "caretaker_name": self.caretaker.full_name if self.caretaker else None,
            "ward_name": self.linked_user.full_name if self.linked_user else None,
            "ward_mode": self.linked_user.user_mode if self.linked_user else None,
            "consent_status": self.consent_status,
            "status": self.consent_status,
            "alert_scope": self.alert_scope,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

# CaretakerRelationship alias for seamless compatibility
CaretakerRelationship = CaretakerLink

class Consent(Base):
    __tablename__ = 'consents'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ward_id = Column(String(36), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    caretaker_id = Column(String(36), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
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
