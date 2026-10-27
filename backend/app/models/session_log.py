import uuid
from datetime import datetime, timezone
from app.extensions import db

class SessionRecord(db.Model):
    __tablename__ = "sessions"

    id = db.Column(db.Integer, primary_key=True)
    session_token = db.Column(db.String(128), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    device_info = db.Column(db.String(100), default="Desktop Browser")
    is_active = db.Column(db.Boolean, default=True, index=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_activity = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    revoked_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "session_token": self.session_token,
            "user_id": self.user_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "device_info": self.device_info,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None
        }

class LoginAttempt(db.Model):
    __tablename__ = "login_attempts"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    
    # Status: SUCCESS, FAILED, SUSPICIOUS, LOCKED
    status = db.Column(db.String(30), nullable=False, index=True)
    failure_reason = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "status": self.status,
            "failure_reason": self.failure_reason,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
