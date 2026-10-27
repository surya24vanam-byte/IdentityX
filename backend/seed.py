import os
from datetime import datetime, timedelta, timezone
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.rbac import Role, Permission
from app.models.credential import Credential
from app.models.verification import IdentityVerification
from app.models.session_log import LoginAttempt, SessionRecord
from app.models.security import SecurityLog, OTPRecord

app = create_app()

def seed():
    with app.app_context():
        print("Initialising database tables...")
        db.create_all()

        print("Seeding Permissions...")
        permissions_data = [
            # Identity Category
            ("VIEW_PROFILE", "View profile and identity security posture", "IDENTITY"),
            ("EDIT_PROFILE", "Update profile details", "IDENTITY"),
            ("MANAGE_MFA", "Configure and toggle Multi-Factor Authentication", "IDENTITY"),
            ("VIEW_LOGIN_HISTORY", "View self authentication logs and login history", "IDENTITY"),
            
            # Credentials & Verification Category
            ("VIEW_CREDENTIALS", "View digital credential records", "CREDENTIALS"),
            ("ADD_CREDENTIAL", "Add and issue digital credential records", "CREDENTIALS"),
            ("SUBMIT_VERIFICATION", "Submit identity verification documents", "CREDENTIALS"),
            
            # Administration Category
            ("MANAGE_USERS", "List, search, filter and inspect user accounts", "ADMINISTRATION"),
            ("LOCK_USER", "Lock compromised user accounts", "ADMINISTRATION"),
            ("UNLOCK_USER", "Unlock and reinstate user accounts", "ADMINISTRATION"),
            ("MANAGE_ROLES", "Create, edit and manage RBAC roles", "ADMINISTRATION"),
            ("MANAGE_PERMISSIONS", "Assign and modify system permissions", "ADMINISTRATION"),
            
            # Security & Compliance Category
            ("REVIEW_VERIFICATIONS", "Review and approve/reject identity verification proofs", "COMPLIANCE"),
            ("VIEW_SECURITY_LOGS", "Inspect immutable security audit logs", "SECURITY"),
            ("VIEW_LOGIN_ATTEMPTS", "View all login attempts and suspicious signals", "SECURITY")
        ]

        permission_objs = {}
        for name, desc, cat in permissions_data:
            perm = Permission.query.filter_by(name=name).first()
            if not perm:
                perm = Permission(name=name, description=desc, category=cat)
                db.session.add(perm)
            permission_objs[name] = perm
        db.session.commit()

        print("Seeding Roles...")
        roles_data = {
            "ADMIN": list(permission_objs.keys()), # Full permissions
            "USER": [
                "VIEW_PROFILE", "EDIT_PROFILE", "MANAGE_MFA", 
                "VIEW_LOGIN_HISTORY", "VIEW_CREDENTIALS", "ADD_CREDENTIAL", 
                "SUBMIT_VERIFICATION"
            ],
            "SECURITY_ANALYST": [
                "VIEW_PROFILE", "VIEW_SECURITY_LOGS", "VIEW_LOGIN_ATTEMPTS", 
                "MANAGE_USERS", "LOCK_USER"
            ],
            "VERIFIER": [
                "VIEW_PROFILE", "REVIEW_VERIFICATIONS", "VIEW_CREDENTIALS"
            ],
            "AUDITOR": [
                "VIEW_PROFILE", "VIEW_SECURITY_LOGS", "VIEW_LOGIN_ATTEMPTS"
            ]
        }

        role_objs = {}
        for r_name, p_list in roles_data.items():
            role = Role.query.filter_by(name=r_name).first()
            if not role:
                role = Role(name=r_name, description=f"{r_name} role with assigned authorization policies")
                db.session.add(role)
            role.permissions = [permission_objs[p] for p in p_list if p in permission_objs]
            role_objs[r_name] = role
        db.session.commit()

        print("Seeding Users...")
        # 1. Admin Account
        admin = User.query.filter_by(email="admin@identityx.io").first()
        if not admin:
            admin = User(
                full_name="Chief Security Officer",
                email="admin@identityx.io",
                phone="+1 (555) 019-2831",
                is_active=True,
                is_locked=False,
                mfa_enabled=True
            )
            admin.set_password("Admin@123456")
            admin.roles.append(role_objs["ADMIN"])
            db.session.add(admin)

        # 2. Verified Active User
        user1 = User.query.filter_by(email="alex.mercer@identityx.io").first()
        if not user1:
            user1 = User(
                full_name="Alex Mercer",
                email="alex.mercer@identityx.io",
                phone="+1 (555) 392-8172",
                is_active=True,
                is_locked=False,
                mfa_enabled=True
            )
            user1.set_password("User@123456")
            user1.roles.append(role_objs["USER"])
            db.session.add(user1)

        # 3. Pending Verification User
        user2 = User.query.filter_by(email="sarah.connor@identityx.io").first()
        if not user2:
            user2 = User(
                full_name="Sarah Connor",
                email="sarah.connor@identityx.io",
                phone="+1 (555) 987-6543",
                is_active=True,
                is_locked=False,
                mfa_enabled=False
            )
            user2.set_password("User@123456")
            user2.roles.append(role_objs["USER"])
            db.session.add(user2)

        # 4. Locked Account (To demonstrate Lockout / Suspicious Detection)
        user3 = User.query.filter_by(email="marcus.wright@identityx.io").first()
        if not user3:
            user3 = User(
                full_name="Marcus Wright",
                email="marcus.wright@identityx.io",
                phone="+1 (555) 443-2211",
                is_active=True,
                is_locked=True,
                locked_until=datetime.now(timezone.utc) + timedelta(minutes=15),
                failed_login_attempts=5,
                mfa_enabled=False
            )
            user3.set_password("User@123456")
            user3.roles.append(role_objs["USER"])
            db.session.add(user3)

        # 5. Security Analyst
        analyst = User.query.filter_by(email="analyst@identityx.io").first()
        if not analyst:
            analyst = User(
                full_name="Elena Rostova",
                email="analyst@identityx.io",
                phone="+1 (555) 777-8899",
                is_active=True,
                is_locked=False,
                mfa_enabled=True
            )
            analyst.set_password("Analyst@123456")
            analyst.roles.append(role_objs["SECURITY_ANALYST"])
            db.session.add(analyst)

        db.session.commit()

        print("Seeding Verifications & Credentials...")
        # Verification for Alex Mercer (APPROVED)
        v1 = IdentityVerification.query.filter_by(user_id=user1.id).first()
        if not v1:
            v1 = IdentityVerification(
                user_id=user1.id,
                document_type="PASSPORT",
                document_number="P-94827103",
                status="APPROVED",
                reviewer_id=admin.id,
                review_notes="Official biometric passport verified against national registry.",
                submitted_at=datetime.now(timezone.utc) - timedelta(days=2),
                reviewed_at=datetime.now(timezone.utc) - timedelta(days=1)
            )
            v1.set_details({
                "country": "United States",
                "issuer": "Department of State",
                "expiry": "2032-05-15",
                "verification_level": "Tier 3 Biometric"
            })
            db.session.add(v1)

        # Verification for Sarah Connor (PENDING)
        v2 = IdentityVerification.query.filter_by(user_id=user2.id).first()
        if not v2:
            v2 = IdentityVerification(
                user_id=user2.id,
                document_type="NATIONAL_ID",
                document_number="ID-8829104",
                status="PENDING",
                submitted_at=datetime.now(timezone.utc) - timedelta(hours=3)
            )
            v2.set_details({
                "country": "United Kingdom",
                "issuer": "Home Office",
                "expiry": "2029-11-20",
                "verification_level": "Standard Tier 2"
            })
            db.session.add(v2)

        # Digital Credentials for Alex Mercer
        if not Credential.query.filter_by(user_id=user1.id).first():
            c1 = Credential(
                user_id=user1.id,
                credential_type="SECURITY_CLEARANCE",
                title="Level 4 Government Security Clearance",
                issuer="National Security Agency",
                status="VERIFIED",
                created_at=datetime.now(timezone.utc) - timedelta(days=10),
                verified_at=datetime.now(timezone.utc) - timedelta(days=5)
            )
            c1.set_metadata({
                "clearance_level": "Top Secret // SCI",
                "badge_id": "NSA-TS-4091",
                "delegated_authority": "Federal Verification Council"
            })
            
            c2 = Credential(
                user_id=user1.id,
                credential_type="DIGITAL_PASSPORT",
                title="ePassport Identity Token",
                issuer="International Civil Aviation Organization",
                status="VERIFIED",
                created_at=datetime.now(timezone.utc) - timedelta(days=8),
                verified_at=datetime.now(timezone.utc) - timedelta(days=7)
            )
            c2.set_metadata({
                "icao_compliant": True,
                "rfid_signature": "sha256:d89a94e...verified",
                "biometrics_enrolled": True
            })

            c3 = Credential(
                user_id=user1.id,
                credential_type="EMPLOYEE_BADGE",
                title="IdentityX Senior Architect Digital Key",
                issuer="IdentityX Infrastructure Corp",
                status="ACTIVE",
                created_at=datetime.now(timezone.utc) - timedelta(days=1)
            )
            c3.set_metadata({
                "department": "Cryptography & Platform Security",
                "access_zone": "Building A, Datacenter Tier 4"
            })

            db.session.add_all([c1, c2, c3])

        print("Seeding Login Attempts & Security Logs...")
        now = datetime.now(timezone.utc)
        
        # Login attempts
        attempts = [
            LoginAttempt(email="admin@identityx.io", user_id=admin.id, ip_address="192.168.1.100", user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0", status="SUCCESS", timestamp=now - timedelta(hours=1)),
            LoginAttempt(email="alex.mercer@identityx.io", user_id=user1.id, ip_address="10.0.4.52", user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1", status="SUCCESS", timestamp=now - timedelta(hours=3)),
            LoginAttempt(email="marcus.wright@identityx.io", user_id=user3.id, ip_address="198.51.100.44", user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)", status="FAILED", failure_reason="Incorrect password", timestamp=now - timedelta(minutes=20)),
            LoginAttempt(email="marcus.wright@identityx.io", user_id=user3.id, ip_address="198.51.100.44", user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)", status="FAILED", failure_reason="Incorrect password", timestamp=now - timedelta(minutes=19)),
            LoginAttempt(email="marcus.wright@identityx.io", user_id=user3.id, ip_address="198.51.100.44", user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)", status="FAILED", failure_reason="Incorrect password", timestamp=now - timedelta(minutes=18)),
            LoginAttempt(email="marcus.wright@identityx.io", user_id=user3.id, ip_address="198.51.100.44", user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)", status="FAILED", failure_reason="Incorrect password", timestamp=now - timedelta(minutes=17)),
            LoginAttempt(email="marcus.wright@identityx.io", user_id=user3.id, ip_address="198.51.100.44", user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)", status="LOCKED", failure_reason="Account locked due to 5 consecutive failures", timestamp=now - timedelta(minutes=16)),
            LoginAttempt(email="unknown.attacker@darknet.org", user_id=None, ip_address="203.0.113.89", user_agent="Python-requests/2.31.0", status="FAILED", failure_reason="User not found", timestamp=now - timedelta(hours=6)),
        ]
        db.session.add_all(attempts)

        # Security Logs
        logs = [
            SecurityLog(
                event_type="SYSTEM_INITIALIZED",
                severity="LOW",
                description="IdentityX Security Engine initialized and RBAC policy enforced.",
                ip_address="127.0.0.1",
                created_at=now - timedelta(days=3)
            ),
            SecurityLog(
                user_id=admin.id,
                event_type="LOGIN_SUCCESS",
                severity="LOW",
                description="Administrator logged in successfully with MFA token verification.",
                ip_address="192.168.1.100",
                created_at=now - timedelta(hours=1)
            ),
            SecurityLog(
                user_id=user1.id,
                event_type="MFA_ENABLED",
                severity="LOW",
                description="Alex Mercer activated Multi-Factor Authentication via OTP verification.",
                ip_address="10.0.4.52",
                created_at=now - timedelta(days=2)
            ),
            SecurityLog(
                user_id=user1.id,
                event_type="IDENTITY_VERIFICATION_APPROVED",
                severity="LOW",
                description="Identity verification request approved by Chief Security Officer.",
                ip_address="192.168.1.100",
                created_at=now - timedelta(days=1)
            ),
            SecurityLog(
                user_id=user3.id,
                event_type="SUSPICIOUS_LOGIN_DETECTED",
                severity="HIGH",
                description="Suspicious activity for marcus.wright@identityx.io: High-velocity authentication failure (4 consecutive failed passwords).",
                ip_address="198.51.100.44",
                created_at=now - timedelta(minutes=18)
            ),
            SecurityLog(
                user_id=user3.id,
                event_type="ACCOUNT_LOCKED",
                severity="HIGH",
                description="Account marcus.wright@identityx.io locked after 5 consecutive failed login attempts.",
                ip_address="198.51.100.44",
                created_at=now - timedelta(minutes=16)
            ),
            SecurityLog(
                user_id=None,
                event_type="SUSPICIOUS_LOGIN_DETECTED",
                severity="MEDIUM",
                description="Unrecognized automated client user-agent probing authentication endpoints (unknown.attacker@darknet.org).",
                ip_address="203.0.113.89",
                created_at=now - timedelta(hours=6)
            )
        ]
        db.session.add_all(logs)

        db.session.commit()
        print("\nSeed successfully completed!")
        print("="*60)
        print("DEMO CREDENTIALS:")
        print("  1. Admin Account:")
        print("     Email:    admin@identityx.io")
        print("     Password: Admin@123456")
        print("     Roles:    [ADMIN]")
        print("     MFA:      Enabled")
        print("  2. Standard Verified User:")
        print("     Email:    alex.mercer@identityx.io")
        print("     Password: User@123456")
        print("     Roles:    [USER]")
        print("     MFA:      Enabled")
        print("  3. Standard Unverified User:")
        print("     Email:    sarah.connor@identityx.io")
        print("     Password: User@123456")
        print("     Roles:    [USER]")
        print("     MFA:      Disabled")
        print("  4. Locked User (for testing admin unlock):")
        print("     Email:    marcus.wright@identityx.io")
        print("     Password: User@123456")
        print("     Status:   Locked")
        print("  5. Security Analyst:")
        print("     Email:    analyst@identityx.io")
        print("     Password: Analyst@123456")
        print("     Roles:    [SECURITY_ANALYST]")
        print("="*60)

if __name__ == "__main__":
    seed()
