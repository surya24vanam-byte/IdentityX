from datetime import datetime, timezone
from app.extensions import db
from app.models.verification import IdentityVerification
from app.services.security_service import SecurityService

class VerificationService:
    @staticmethod
    def submit_verification(user, document_type, document_number, details=None, ip_address=None):
        existing_pending = IdentityVerification.query.filter_by(
            user_id=user.id,
            status="PENDING"
        ).first()

        if existing_pending:
            return False, "You already have a pending verification request under review.", None

        verification = IdentityVerification(
            user_id=user.id,
            document_type=document_type.strip().upper(),
            document_number=document_number.strip(),
            status="PENDING",
            submitted_at=datetime.now(timezone.utc)
        )
        if details:
            verification.set_details(details)

        db.session.add(verification)
        db.session.commit()

        SecurityService.log_event(
            event_type="IDENTITY_VERIFICATION_SUBMITTED",
            description=f"User {user.email} submitted identity verification request ({document_type}).",
            severity="LOW",
            user_id=user.id,
            ip_address=ip_address,
            metadata={"verification_id": verification.id, "document_type": document_type}
        )

        return True, "Verification request submitted successfully.", verification

    @staticmethod
    def review_verification(verification_id, reviewer, status, review_notes=None, ip_address=None):
        verification = IdentityVerification.query.get(verification_id)
        if not verification:
            return False, "Verification request not found."

        if status not in ("APPROVED", "REJECTED"):
            return False, "Invalid review status. Must be APPROVED or REJECTED."

        verification.status = status
        verification.reviewer_id = reviewer.id
        verification.review_notes = review_notes.strip() if review_notes else None
        verification.reviewed_at = datetime.now(timezone.utc)

        db.session.commit()

        applicant = verification.applicant
        severity = "LOW" if status == "APPROVED" else "MEDIUM"
        SecurityService.log_event(
            event_type=f"IDENTITY_VERIFICATION_{status}",
            description=f"Identity verification for {applicant.email if applicant else 'User'} was {status.lower()} by {reviewer.email}.",
            severity=severity,
            user_id=applicant.id if applicant else None,
            ip_address=ip_address,
            metadata={"reviewer": reviewer.email, "notes": review_notes}
        )

        return True, f"Verification request marked as {status}."
