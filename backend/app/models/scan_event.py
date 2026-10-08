import uuid
import json
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.models.database import Base

class ScanEvent(Base):
    __tablename__ = 'scan_events'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    input_type = Column(String(20), nullable=False) # 'url', 'message', 'combined'
    input_hash = Column(String(64), nullable=False)
    input_preview = Column(String(255), nullable=True)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(10), nullable=False) # 'SAFE', 'WARN', 'BLOCK'
    primary_reason = Column(Text, nullable=False)
    signals_json = Column(Text, nullable=True) # JSON array of detected signals
    details_json = Column(Text, nullable=True) # JSON object of full analysis
    external_sources_json = Column(Text, nullable=True) # JSON array of threat intel sources queried
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="scans")
    alerts = relationship("Alert", back_populates="scan_event")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "input_type": self.input_type,
            "input_preview": self.input_preview,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "primary_reason": self.primary_reason,
            "signals": json.loads(self.signals_json) if self.signals_json else [],
            "details": json.loads(self.details_json) if self.details_json else {},
            "external_sources": json.loads(self.external_sources_json) if self.external_sources_json else [],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
