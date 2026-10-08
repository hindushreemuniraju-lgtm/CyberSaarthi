import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship as orm_relationship
from backend.app.models.database import Base

class TrustedContact(Base):
    __tablename__ = 'trusted_contacts'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(120), nullable=False)
    relationship = Column(String(64), nullable=False) # e.g. 'Son', 'Daughter', 'Mother', 'Friend'
    phone = Column(String(32), nullable=False)
    email = Column(String(191), nullable=True)
    is_emergency = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = orm_relationship("User", back_populates="trusted_contacts")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "relationship": self.relationship,
            "phone": self.phone,
            "email": self.email,
            "is_emergency": self.is_emergency,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
