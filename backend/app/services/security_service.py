import uuid
import json
from datetime import datetime, timedelta, timezone
from flask import current_app
from app.extensions import db
from app.models.security import SecurityLog
from app.models.session_log import LoginAttempt
from app.models.user import User
from app.config import Config

class SecurityService:
    @staticmethod
    def _get_config(key, default):
        try:
            return current_app.config.get(key, default)
        except Exception:
            return getattr(Config, key, default)

    @staticmethod
    def log_event(event_type, description, severity="LOW", user_id=None, ip_address=None, metadata=None):
        try:
            metadata_str = json.dumps(metadata) if isinstance(metadata, dict) else (str(metadata) if metadata else None)
            event = SecurityLog(
                event_id=str(uuid.uuid4()),
                user_id=user_id,
                event_type=event_type,
                severity=severity.upper(),
                description=description,
                ip_address=ip_address,
                metadata_json=metadata_str,
                created_at=datetime.now(timezone.utc)
            )
            db.session.add(event)
            db.session.commit()
            return event
        except Exception as e:
            db.session.rollback()
            print(f"[SecurityService.log_event Error]: {e}")
            return None

    @staticmethod
    def record_login_attempt(email, status, user_id=None, ip_address=None, user_agent=None, failure_reason=None):
        try:
            attempt = LoginAttempt(
                email=email,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                status=status,
                failure_reason=failure_reason,
                timestamp=datetime.now(timezone.utc)
            )
            db.session.add(attempt)
            db.session.commit()
            return attempt
        except Exception as e:
            db.session.rollback()
            print(f"[SecurityService.record_login_attempt Error]: {e}")
            return None

    @staticmethod
    def check_suspicious_activity(email, user, ip_address, user_agent):
        now = datetime.now(timezone.utc)
        suspicious_window = SecurityService._get_config("SUSPICIOUS_WINDOW_MINUTES", Config.SUSPICIOUS_WINDOW_MINUTES)
        ten_minutes_ago = now - timedelta(minutes=suspicious_window)
        two_minutes_ago = now - timedelta(minutes=2)

        # Rule 1: Attempt on a locked account
        if user and user.is_currently_locked():
            return True, "Authentication attempt detected on a locked account.", "CRITICAL"

        # Rule 2: Rapid successive failed attempts (>= 3 failures within 2 minutes)
        recent_rapid_failures = LoginAttempt.query.filter(
            LoginAttempt.email == email,
            LoginAttempt.status == "FAILED",
            LoginAttempt.timestamp >= two_minutes_ago
        ).count()
        if recent_rapid_failures >= 3:
            return True, f"High-velocity authentication failure: {recent_rapid_failures} failed attempts in under 2 minutes.", "HIGH"

        # Rule 3: Repeated failures within standard suspicious window
        recent_window_failures = LoginAttempt.query.filter(
            LoginAttempt.email == email,
            LoginAttempt.status == "FAILED",
            LoginAttempt.timestamp >= ten_minutes_ago
        ).count()
        if recent_window_failures >= 4:
            return True, f"Repeated credential trial detected: {recent_window_failures} failures within observation window.", "HIGH"

        # Rule 4: Login from anomalous IP address
        if user:
            previous_successes = LoginAttempt.query.filter(
                LoginAttempt.user_id == user.id,
                LoginAttempt.status == "SUCCESS"
            ).all()
            if len(previous_successes) >= 3:
                known_ips = {att.ip_address for att in previous_successes if att.ip_address}
                if ip_address and ip_address not in known_ips:
                    return True, f"Login attempt originated from unrecognized IP address ({ip_address}).", "MEDIUM"

        return False, None, "LOW"

    @staticmethod
    def handle_failed_login(user, email, ip_address, user_agent, reason="Invalid credentials"):
        max_attempts = SecurityService._get_config("MAX_LOGIN_ATTEMPTS", Config.MAX_LOGIN_ATTEMPTS)
        lockout_duration = SecurityService._get_config("LOCKOUT_DURATION_MINUTES", Config.LOCKOUT_DURATION_MINUTES)

        is_suspicious, susp_reason, severity = SecurityService.check_suspicious_activity(
            email=email,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )

        status = "FAILED"
        if user and user.is_currently_locked():
            status = "LOCKED"

        if is_suspicious:
            SecurityService.log_event(
                event_type="SUSPICIOUS_LOGIN_DETECTED",
                description=f"Suspicious activity for {email}: {susp_reason}",
                severity=severity,
                user_id=user.id if user else None,
                ip_address=ip_address,
                metadata={"reason": susp_reason, "user_agent": user_agent}
            )

        SecurityService.record_login_attempt(
            email=email,
            status=status,
            user_id=user.id if user else None,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=reason
        )

        SecurityService.log_event(
            event_type="LOGIN_FAILED",
            description=f"Failed login attempt for {email}: {reason}",
            severity="LOW" if not is_suspicious else severity,
            user_id=user.id if user else None,
            ip_address=ip_address,
            metadata={"reason": reason}
        )

        if user and not user.is_currently_locked():
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= max_attempts:
                user.is_locked = True
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=lockout_duration)
                db.session.commit()

                SecurityService.log_event(
                    event_type="ACCOUNT_LOCKED",
                    description=f"Account for {email} locked after {user.failed_login_attempts} consecutive failed attempts.",
                    severity="HIGH",
                    user_id=user.id,
                    ip_address=ip_address,
                    metadata={"locked_until": user.locked_until.isoformat()}
                )
                return True, f"Account has been locked due to {max_attempts} consecutive failed attempts. Please contact an administrator or try again in {lockout_duration} minutes."
            db.session.commit()

        attempts_left = (max_attempts - user.failed_login_attempts) if user else None
        return False, attempts_left
