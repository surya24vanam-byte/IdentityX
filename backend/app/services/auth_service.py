import jwt
import uuid
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from app.extensions import db
from app.config import Config
from app.models.user import User
from app.models.rbac import Role
from app.models.session_log import SessionRecord
from app.models.security import PasswordResetToken
from app.services.security_service import SecurityService
from app.services.mfa_service import MFAService
from app.utils.validators import validate_email, validate_password
from app.utils.helpers import parse_device_info

class AuthService:
    @staticmethod
    def generate_token(user, session_token):
        """
        Creates signed JWT containing user ID, role claims, and linked session token.
        """
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "roles": [r.name for r in user.roles],
            "session_token": session_token,
            "iat": now,
            "exp": now + Config.JWT_ACCESS_TOKEN_EXPIRES
        }
        return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")

    @staticmethod
    def decode_token(token):
        """
        Decodes and verifies JWT signature and expiry.
        """
        try:
            return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    @staticmethod
    def register_user(full_name, email, password, phone=None, ip_address=None):
        clean_email = email.strip().lower()
        
        # Validation
        valid_em, em_err = validate_email(clean_email)
        if not valid_em:
            return False, em_err, None

        valid_pw, pw_err = validate_password(password)
        if not valid_pw:
            return False, pw_err, None

        if User.query.filter_by(email=clean_email).first():
            SecurityService.log_event(
                event_type="REGISTRATION_ATTEMPT_DUPLICATE",
                description=f"Registration rejected: Email {clean_email} already exists.",
                severity="LOW",
                ip_address=ip_address
            )
            return False, "An account with this email address already exists.", None

        # Create new user
        new_user = User(
            full_name=full_name.strip(),
            email=clean_email,
            phone=phone.strip() if phone else None,
            is_active=True,
            mfa_enabled=False
        )
        new_user.set_password(password)

        # Assign default USER role
        user_role = Role.query.filter_by(name="USER").first()
        if user_role:
            new_user.roles.append(user_role)

        db.session.add(new_user)
        db.session.commit()

        SecurityService.log_event(
            event_type="USER_REGISTERED",
            description=f"New user registered successfully: {clean_email}",
            severity="LOW",
            user_id=new_user.id,
            ip_address=ip_address
        )

        return True, "Registration successful. You can now log in.", new_user

    @staticmethod
    def create_user_session(user, ip_address, user_agent):
        session_token = str(uuid.uuid4())
        device_info = parse_device_info(user_agent)

        session_rec = SessionRecord(
            session_token=session_token,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            last_activity=datetime.now(timezone.utc)
        )
        db.session.add(session_rec)
        db.session.commit()

        access_token = AuthService.generate_token(user, session_token)
        return session_rec, access_token

    @staticmethod
    def login_user(email, password, ip_address, user_agent):
        clean_email = email.strip().lower()
        user = User.query.filter_by(email=clean_email).first()

        # Check if user exists
        if not user:
            SecurityService.handle_failed_login(
                user=None,
                email=clean_email,
                ip_address=ip_address,
                user_agent=user_agent,
                reason="User not found"
            )
            return False, "Invalid email or password.", None

        # Check if locked
        if user.is_currently_locked():
            SecurityService.handle_failed_login(
                user=user,
                email=clean_email,
                ip_address=ip_address,
                user_agent=user_agent,
                reason="Authentication attempted while account is locked"
            )
            lock_msg = "Account is temporarily locked due to multiple failed login attempts. Please contact an administrator or try again later."
            if user.locked_until:
                mins_left = max(1, int((user.locked_until.replace(tzinfo=timezone.utc if user.locked_until.tzinfo is None else None) - datetime.now(timezone.utc)).total_seconds() // 60))
                lock_msg = f"Account is temporarily locked. Try again in approximately {mins_left} minute(s)."
            return False, lock_msg, {"locked": True}

        # Check active status
        if not user.is_active:
            return False, "Account is disabled. Please contact administrator.", None

        # Verify password
        if not user.check_password(password):
            was_locked, msg = SecurityService.handle_failed_login(
                user=user,
                email=clean_email,
                ip_address=ip_address,
                user_agent=user_agent,
                reason="Incorrect password"
            )
            if was_locked:
                return False, msg, {"locked": True}
            
            try:
                from flask import current_app
                max_att = current_app.config.get("MAX_LOGIN_ATTEMPTS", Config.MAX_LOGIN_ATTEMPTS)
            except Exception:
                max_att = Config.MAX_LOGIN_ATTEMPTS
            attempts_left = max_att - user.failed_login_attempts
            return False, f"Invalid email or password. ({attempts_left} attempt(s) remaining before temporary lockout).", None

        # Password verified! Check if MFA is required
        if user.mfa_enabled:
            otp_code, otp_rec = MFAService.generate_otp(user, purpose="MFA_LOGIN", ip_address=ip_address)
            return True, "Multi-Factor Authentication required. Please enter the OTP sent to your registered device.", {
                "mfa_required": True,
                "user_id": user.id,
                "email": user.email,
                "demo_otp": otp_code if Config.DEMO_MODE else None
            }

        # Successful Login without MFA
        return AuthService.finalize_login(user, ip_address, user_agent)

    @staticmethod
    def finalize_login(user, ip_address, user_agent):
        # Reset failed login count
        user.failed_login_attempts = 0
        db.session.commit()

        # Record attempt
        SecurityService.record_login_attempt(
            email=user.email,
            status="SUCCESS",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )

        # Create session
        session_rec, access_token = AuthService.create_user_session(user, ip_address, user_agent)

        # Security Log
        SecurityService.log_event(
            event_type="LOGIN_SUCCESS",
            description=f"User {user.email} logged in successfully.",
            severity="LOW",
            user_id=user.id,
            ip_address=ip_address,
            metadata={"session_id": session_rec.id, "device": session_rec.device_info}
        )

        return True, "Login successful.", {
            "mfa_required": False,
            "access_token": access_token,
            "user": user.to_dict(),
            "session": session_rec.to_dict()
        }

    @staticmethod
    def verify_mfa_login(user_id, otp_code, ip_address, user_agent):
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return False, "Invalid authentication context.", None

        if user.is_currently_locked():
            return False, "Account is locked.", None

        valid, msg = MFAService.verify_otp(user, otp_code, purpose="MFA_LOGIN", ip_address=ip_address)
        if not valid:
            return False, msg, None

        return AuthService.finalize_login(user, ip_address, user_agent)

    @staticmethod
    def revoke_session(session_token, user_id=None):
        query = SessionRecord.query.filter_by(session_token=session_token, is_active=True)
        if user_id:
            query = query.filter_by(user_id=user_id)
        session_rec = query.first()
        if session_rec:
            session_rec.is_active = False
            session_rec.revoked_at = datetime.now(timezone.utc)
            db.session.commit()

            SecurityService.log_event(
                event_type="SESSION_REVOKED",
                description=f"Session revoked for user ID {session_rec.user_id}.",
                severity="LOW",
                user_id=session_rec.user_id
            )
            return True, "Session revoked."
        return False, "Session not found or already inactive."

    @staticmethod
    def revoke_all_sessions(user_id, except_token=None):
        sessions = SessionRecord.query.filter_by(user_id=user_id, is_active=True).all()
        revoked_count = 0
        for s in sessions:
            if except_token and s.session_token == except_token:
                continue
            s.is_active = False
            s.revoked_at = datetime.now(timezone.utc)
            revoked_count += 1
        db.session.commit()

        SecurityService.log_event(
            event_type="ALL_SESSIONS_REVOKED",
            description=f"Terminated {revoked_count} active session(s) for user ID {user_id}.",
            severity="MEDIUM",
            user_id=user_id
        )
        return True, f"Revoked {revoked_count} session(s)."

    @staticmethod
    def initiate_forgot_password(email, ip_address):
        clean_email = email.strip().lower()
        user = User.query.filter_by(email=clean_email).first()
        
        # Prevent account enumeration: return consistent success message
        if not user:
            return True, "If this email is registered, password reset instructions have been generated.", None

        # Invalidate previous reset tokens
        prev_tokens = PasswordResetToken.query.filter_by(user_id=user.id, is_used=False).all()
        for t in prev_tokens:
            t.is_used = True

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token=raw_token if Config.DEMO_MODE else raw_token[:8] + "...",
            token_hash=token_hash,
            expires_at=expires_at,
            is_used=False,
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(reset_record)
        db.session.commit()

        SecurityService.log_event(
            event_type="PASSWORD_RESET_REQUESTED",
            description=f"Password reset token generated for {user.email}.",
            severity="LOW",
            user_id=user.id,
            ip_address=ip_address
        )

        return True, "Password reset token generated successfully.", {
            "demo_token": raw_token if Config.DEMO_MODE else None,
            "expires_in_minutes": 15
        }

    @staticmethod
    def complete_password_reset(token, new_password, ip_address):
        if not token:
            return False, "Reset token is required."

        valid_pw, pw_err = validate_password(new_password)
        if not valid_pw:
            return False, pw_err

        token_hash = hashlib.sha256(token.strip().encode("utf-8")).hexdigest()
        record = PasswordResetToken.query.filter_by(token_hash=token_hash, is_used=False).first()

        if not record or not record.is_valid():
            return False, "Password reset token is invalid or has expired."

        user = record.user
        user.set_password(new_password)
        user.failed_login_attempts = 0
        user.is_locked = False
        user.locked_until = None
        record.is_used = True

        # Invalidate all active sessions for security upon password reset
        AuthService.revoke_all_sessions(user.id)

        db.session.commit()

        SecurityService.log_event(
            event_type="PASSWORD_RESET_COMPLETED",
            description=f"Password reset completed successfully for {user.email}.",
            severity="MEDIUM",
            user_id=user.id,
            ip_address=ip_address
        )

        return True, "Password has been successfully updated. Please sign in with your new password."
