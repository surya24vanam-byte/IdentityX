import uuid
from datetime import datetime, timezone
from app.extensions import db

class OTPRecord(db.Model):
    __tablename__ = "otp_records"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Store plain code only if demo mode, hashed code always
    code_hash = db.Column(db.String(255), nullable=False)
    otp_code = db.Column(db.String(10), nullable=True) # Kept in demo environment for evaluation display
    
    purpose = db.Column(db.String(50), nullable=False) # "MFA_LOGIN", "ENABLE_MFA", "PASSWORD_RESET"
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="otps")

    def is_valid(self):
        now = datetime.now(timezone.utc)
        exp = self.expires_at.replace(tzinfo=timezone.utc if self.expires_at.tzinfo is None else None)
        return not self.is_used and now <= exp

class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = db.Column(db.String(100), unique=True, nullable=False, index=True)
    token_hash = db.Column(db.String(255), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="reset_tokens")

    def is_valid(self):
        now = datetime.now(timezone.utc)
        exp = self.expires_at.replace(tzinfo=timezone.utc if self.expires_at.tzinfo is None else None)
        return not self.is_used and now <= exp

class SecurityLog(db.Model):
    __tablename__ = "security_logs"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    event_type = db.Column(db.String(60), nullable=False, index=True)
    # Severity: LOW, MEDIUM, HIGH, CRITICAL
    severity = db.Column(db.String(20), nullable=False, default="LOW", index=True)
    description = db.Column(db.Text, nullable=False)
    ip_address = db.Column(db.String(50), nullable=True)
    metadata_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "user_email": self.user.email if self.user else "SYSTEM/ANONYMOUS",
            "event_type": self.event_type,
            "severity": self.severity,
            "description": self.description,
            "ip_address": self.ip_address,
            "metadata": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
