import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.models.database import Base

class Alert(Base):
    __tablename__ = 'alerts'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_event_id = Column(String(36), ForeignKey('scan_events.id', ondelete='SET NULL'), nullable=True)
    ward_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    caretaker_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    severity = Column(String(20), nullable=False, default='HIGH') # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    title = Column(String(191), nullable=False)
    summary = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default='UNREAD') # 'UNREAD', 'READ', 'RESOLVED'
    created_at = Column(DateTime, default=datetime.utcnow)

    scan_event = relationship("ScanEvent", back_populates="alerts")
    ward = relationship("User", foreign_keys=[ward_id])
    caretaker = relationship("User", foreign_keys=[caretaker_id])

    def to_dict(self):
        return {
            "id": self.id,
            "scan_event_id": self.scan_event_id,
            "ward_id": self.ward_id,
            "ward_name": self.ward.name if self.ward else "Ward",
            "ward_mode": self.ward.user_mode if self.ward else "unknown",
            "caretaker_id": self.caretaker_id,
            "severity": self.severity,
            "title": self.title,
            "summary": self.summary,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
