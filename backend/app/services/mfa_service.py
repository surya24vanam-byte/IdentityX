import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from app.extensions import db
from app.models.security import OTPRecord
from app.config import Config
from app.services.security_service import SecurityService

class MFAService:
    @staticmethod
    def _hash_code(code_str):
        return hashlib.sha256(code_str.encode("utf-8")).hexdigest()

    @staticmethod
    def generate_otp(user, purpose="MFA_LOGIN", ip_address=None):
        """
        Generates a secure 6-digit numeric OTP with strict expiration and one-time validity.
        """
        # Invalidate previous unused OTPs for this user and purpose
        active_otps = OTPRecord.query.filter_by(user_id=user.id, purpose=purpose, is_used=False).all()
        for old in active_otps:
            old.is_used = True
        
        # Cryptographically secure 6-digit code
        code = f"{secrets.randbelow(900000) + 100000}"
        code_hash = MFAService._hash_code(code)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=Config.OTP_EXPIRATION_MINUTES)

        otp_record = OTPRecord(
            user_id=user.id,
            code_hash=code_hash,
            otp_code=code if Config.DEMO_MODE else None,
            purpose=purpose,
            expires_at=expires_at,
            is_used=False,
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(otp_record)
        db.session.commit()

        SecurityService.log_event(
            event_type="OTP_REQUESTED",
            description=f"One-Time Password requested by {user.email} for purpose: {purpose}",
            severity="LOW",
            user_id=user.id,
            ip_address=ip_address,
            metadata={"purpose": purpose, "expires_in_minutes": Config.OTP_EXPIRATION_MINUTES}
        )

        # In production this would trigger Email/SMS dispatch (e.g. Twilio / SendGrid)
        # In demo mode, we return the generated code so the frontend can preview/simulate delivery
        return code, otp_record

    @staticmethod
    def verify_otp(user, code, purpose="MFA_LOGIN", ip_address=None):
        """
        Validates OTP against expiration and one-time usage constraints.
        Returns: (success: bool, message: str)
        """
        if not code or not isinstance(code, str):
            return False, "OTP code is required."

        cleaned_code = code.strip()
        code_hash = MFAService._hash_code(cleaned_code)
        now = datetime.now(timezone.utc)

        # Find matching active OTP record
        record = OTPRecord.query.filter_by(
            user_id=user.id,
            purpose=purpose,
            is_used=False
        ).order_by(OTPRecord.created_at.desc()).first()

        if not record:
            SecurityService.log_event(
                event_type="OTP_VERIFICATION_FAILED",
                description=f"OTP verification failed for {user.email}: No active OTP found.",
                severity="MEDIUM",
                user_id=user.id,
                ip_address=ip_address
            )
            return False, "No active OTP request found. Please request a new one."

        record_expiry = record.expires_at.replace(tzinfo=timezone.utc if record.expires_at.tzinfo is None else None)
        if now > record_expiry:
            record.is_used = True
            db.session.commit()
            SecurityService.log_event(
                event_type="OTP_VERIFICATION_FAILED",
                description=f"OTP verification failed for {user.email}: Code expired.",
                severity="MEDIUM",
                user_id=user.id,
                ip_address=ip_address
            )
            return False, "OTP has expired. Please request a new code."

        if record.code_hash != code_hash:
            SecurityService.log_event(
                event_type="OTP_VERIFICATION_FAILED",
                description=f"OTP verification failed for {user.email}: Invalid code entered.",
                severity="HIGH",
                user_id=user.id,
                ip_address=ip_address
            )
            return False, "Invalid OTP code entered."

        # Mark consumed
        record.is_used = True
        db.session.commit()

        SecurityService.log_event(
            event_type="OTP_VERIFICATION_SUCCESS",
            description=f"OTP successfully verified for {user.email} (purpose: {purpose}).",
            severity="LOW",
            user_id=user.id,
            ip_address=ip_address
        )

        return True, "OTP verified successfully."
