import uuid
import json
from datetime import datetime, timezone
from app.extensions import db

class Credential(db.Model):
    __tablename__ = "credentials"

    id = db.Column(db.Integer, primary_key=True)
    credential_uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    credential_type = db.Column(db.String(50), nullable=False) # e.g. NATIONAL_ID, PASSPORT, DRIVERS_LICENSE, EMPLOYEE_BADGE, SECURITY_CLEARANCE
    title = db.Column(db.String(120), nullable=False)
    issuer = db.Column(db.String(120), nullable=False)
    metadata_json = db.Column(db.Text, nullable=True) # JSON dictionary with custom safe attributes
    
    # Status: ACTIVE, PENDING_VERIFICATION, VERIFIED, REVOKED, EXPIRED
    status = db.Column(db.String(30), default="ACTIVE", nullable=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    verified_at = db.Column(db.DateTime, nullable=True)

    def get_metadata(self):
        if not self.metadata_json:
            return {}
        try:
            return json.loads(self.metadata_json)
        except Exception:
            return {}

    def set_metadata(self, data_dict):
        self.metadata_json = json.dumps(data_dict)

    def to_dict(self):
        return {
            "id": self.id,
            "credential_uuid": self.credential_uuid,
            "user_id": self.user_id,
            "user_email": self.user.email if self.user else None,
            "credential_type": self.credential_type,
            "title": self.title,
            "issuer": self.issuer,
            "metadata": self.get_metadata(),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None
        }
