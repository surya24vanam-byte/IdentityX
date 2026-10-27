import uuid
import json
from datetime import datetime, timezone
from app.extensions import db

class IdentityVerification(db.Model):
    __tablename__ = "identity_verifications"

    id = db.Column(db.Integer, primary_key=True)
    verification_uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    document_type = db.Column(db.String(50), nullable=False) # e.g. PASSPORT, NATIONAL_ID, DRIVERS_LICENSE, TAX_ID
    document_number = db.Column(db.String(100), nullable=False) # Safely masked on output if needed
    details_json = db.Column(db.Text, nullable=True) # Full submission payload (issuer, country, expiry, selfie_hash/notes)
    
    # Status: PENDING, APPROVED, REJECTED
    status = db.Column(db.String(30), default="PENDING", nullable=False, index=True)
    
    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    review_notes = db.Column(db.Text, nullable=True)
    
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = db.Column(db.DateTime, nullable=True)

    reviewer = db.relationship("User", foreign_keys=[reviewer_id], backref="reviewed_verifications")

    def get_details(self):
        if not self.details_json:
            return {}
        try:
            return json.loads(self.details_json)
        except Exception:
            return {}

    def set_details(self, data_dict):
        self.details_json = json.dumps(data_dict)

    def to_dict(self):
        return {
            "id": self.id,
            "verification_uuid": self.verification_uuid,
            "user_id": self.user_id,
            "applicant_name": self.applicant.full_name if self.applicant else None,
            "applicant_email": self.applicant.email if self.applicant else None,
            "document_type": self.document_type,
            "document_number": self.document_number,
            "details": self.get_details(),
            "status": self.status,
            "reviewer_id": self.reviewer_id,
            "reviewer_name": self.reviewer.full_name if self.reviewer else None,
            "review_notes": self.review_notes,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None
        }
