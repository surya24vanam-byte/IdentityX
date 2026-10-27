from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from app.models.rbac import user_roles

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Account status & Lockout logic
    is_active = db.Column(db.Boolean, default=True)
    is_locked = db.Column(db.Boolean, default=False)
    locked_until = db.Column(db.DateTime, nullable=True)
    failed_login_attempts = db.Column(db.Integer, default=0)
    
    # Multi-Factor Authentication
    mfa_enabled = db.Column(db.Boolean, default=False)
    mfa_secret = db.Column(db.String(64), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    roles = db.relationship("Role", secondary=user_roles, backref=db.backref("users", lazy="dynamic"))
    credentials = db.relationship("Credential", backref="user", lazy=True, cascade="all, delete-orphan")
    verifications = db.relationship("IdentityVerification", foreign_keys="IdentityVerification.user_id", backref="applicant", lazy=True, cascade="all, delete-orphan")
    sessions = db.relationship("SessionRecord", backref="user", lazy=True, cascade="all, delete-orphan")
    login_attempts = db.relationship("LoginAttempt", backref="user", lazy=True, cascade="all, delete-orphan")
    security_logs = db.relationship("SecurityLog", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="scrypt")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_currently_locked(self):
        if not self.is_locked:
            return False
        if self.locked_until and datetime.now(timezone.utc) > self.locked_until.replace(tzinfo=timezone.utc if self.locked_until.tzinfo is None else None):
            # Lockout expired, clear automatically
            self.is_locked = False
            self.locked_until = None
            self.failed_login_attempts = 0
            db.session.commit()
            return False
        return True

    def has_role(self, role_name):
        return any(role.name.upper() == role_name.upper() for role in self.roles)

    def has_permission(self, permission_name):
        for role in self.roles:
            for permission in role.permissions:
                if permission.name.upper() == permission_name.upper():
                    return True
        return False

    def get_all_permissions(self):
        perms = set()
        for role in self.roles:
            for permission in role.permissions:
                perms.add(permission.name)
        return list(perms)

    def get_verification_status(self):
        # Latest verification status
        latest = next(iter(sorted(self.verifications, key=lambda v: v.submitted_at, reverse=True)), None)
        return latest.status if latest else "UNVERIFIED"

    def calculate_security_score(self):
        """
        Calculates a dynamic security score (0 - 100) based on real user security posture:
        - Active account: +20
        - MFA enabled: +30
        - Identity verified: +25
        - Has verified credentials: +15
        - No active lockout or failed attempts: +10
        - Penalties: -15 for failed attempts > 0, -20 if locked
        """
        score = 0
        factors = []

        if self.is_active:
            score += 20
            factors.append({"factor": "Active Account", "points": 20, "met": True})
        else:
            factors.append({"factor": "Active Account", "points": 20, "met": False})

        if self.mfa_enabled:
            score += 30
            factors.append({"factor": "Multi-Factor Authentication (MFA)", "points": 30, "met": True})
        else:
            factors.append({"factor": "Multi-Factor Authentication (MFA)", "points": 30, "met": False})

        ver_status = self.get_verification_status()
        if ver_status == "APPROVED":
            score += 25
            factors.append({"factor": "Identity Verification", "points": 25, "met": True})
        else:
            factors.append({"factor": "Identity Verification", "points": 25, "met": False})

        has_verified_creds = any(c.status == "VERIFIED" for c in self.credentials)
        if has_verified_creds:
            score += 15
            factors.append({"factor": "Verified Digital Credentials", "points": 15, "met": True})
        else:
            factors.append({"factor": "Verified Digital Credentials", "points": 15, "met": False})

        if not self.is_locked and self.failed_login_attempts == 0:
            score += 10
            factors.append({"factor": "Clean Security Standing", "points": 10, "met": True})
        else:
            factors.append({"factor": "Clean Security Standing", "points": 10, "met": False})

        grade = "EXCELLENT" if score >= 85 else "GOOD" if score >= 65 else "MODERATE" if score >= 45 else "VULNERABLE"

        return {
            "score": min(score, 100),
            "grade": grade,
            "factors": factors
        }

    def to_dict(self, include_security_score=True):
        data = {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "is_active": self.is_active,
            "is_locked": self.is_locked,
            "locked_until": self.locked_until.isoformat() if self.locked_until else None,
            "failed_login_attempts": self.failed_login_attempts,
            "mfa_enabled": self.mfa_enabled,
            "roles": [r.name for r in self.roles],
            "permissions": self.get_all_permissions(),
            "verification_status": self.get_verification_status(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
        if include_security_score:
            data["security_posture"] = self.calculate_security_score()
        return data
