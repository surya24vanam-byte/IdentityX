import pytest
from app import create_app
from app.extensions import db
from app.config import TestConfig
from app.models.user import User
from app.models.rbac import Role, Permission
from app.models.security import SecurityLog

@pytest.fixture
def app_and_client():
    app = create_app(TestConfig) # Config has MAX_LOGIN_ATTEMPTS=3
    with app.app_context():
        db.drop_all()
        db.create_all()
        user_role = Role(name="USER", description="Default user role")
        admin_role = Role(name="ADMIN", description="Administrator role")
        
        p_profile = Permission(name="VIEW_PROFILE", description="View Profile", category="IDENTITY")
        p_cred_view = Permission(name="VIEW_CREDENTIALS", description="View Credentials", category="CREDENTIALS")
        p_cred_add = Permission(name="ADD_CREDENTIAL", description="Add Credentials", category="CREDENTIALS")
        p_ver_sub = Permission(name="SUBMIT_VERIFICATION", description="Submit Verification", category="CREDENTIALS")
        p_ver_rev = Permission(name="REVIEW_VERIFICATIONS", description="Review Verification", category="COMPLIANCE")
        p_manage_users = Permission(name="MANAGE_USERS", description="Manage Users", category="ADMINISTRATION")
        p_lock_user = Permission(name="LOCK_USER", description="Lock Users", category="ADMINISTRATION")
        p_unlock_user = Permission(name="UNLOCK_USER", description="Unlock Users", category="ADMINISTRATION")
        p_logs = Permission(name="VIEW_SECURITY_LOGS", description="View Logs", category="SECURITY")
        
        user_role.permissions.extend([p_profile, p_cred_view, p_cred_add, p_ver_sub])
        admin_role.permissions.extend([p_profile, p_cred_view, p_cred_add, p_ver_sub, p_ver_rev, p_manage_users, p_lock_user, p_unlock_user, p_logs])
        
        db.session.add_all([user_role, admin_role, p_profile, p_cred_view, p_cred_add, p_ver_sub, p_ver_rev, p_manage_users, p_lock_user, p_unlock_user, p_logs])
        db.session.commit()
        
    with app.test_client() as client:
        yield app, client

    with app.app_context():
        db.session.remove()
        db.drop_all()

def test_account_lockout_after_max_failed_attempts(app_and_client):
    app, client = app_and_client
    # Register user
    reg = client.post("/api/auth/register", json={
        "full_name": "Target User",
        "email": "target@example.com",
        "password": "Password@123"
    })
    assert reg.status_code == 201

    # MAX_LOGIN_ATTEMPTS is 3 in TestConfig
    # Attempt 1: Fail
    res1 = client.post("/api/auth/login", json={"email": "target@example.com", "password": "WrongPassword"})
    assert res1.status_code == 401
    assert "2 attempt(s) remaining" in res1.get_json()["message"]

    # Attempt 2: Fail
    res2 = client.post("/api/auth/login", json={"email": "target@example.com", "password": "WrongPassword"})
    assert res2.status_code == 401
    assert "1 attempt(s) remaining" in res2.get_json()["message"]

    # Attempt 3: Triggers Lockout!
    res3 = client.post("/api/auth/login", json={"email": "target@example.com", "password": "WrongPassword"})
    assert res3.status_code == 403
    assert "locked" in res3.get_json()["message"].lower()

    # Attempt 4: Even with CORRECT password, authentication is rejected because account is locked
    res4 = client.post("/api/auth/login", json={"email": "target@example.com", "password": "Password@123"})
    assert res4.status_code == 403
    assert res4.get_json()["details"]["locked"] is True

    # Verify security log contains ACCOUNT_LOCKED
    with app.app_context():
        lock_log = SecurityLog.query.filter_by(event_type="ACCOUNT_LOCKED").first()
        assert lock_log is not None
        assert lock_log.severity == "HIGH"

def test_credential_creation_and_identity_verification_workflow(app_and_client):
    app, client = app_and_client
    
    # 1. Register & Login regular user
    reg1 = client.post("/api/auth/register", json={
        "full_name": "Citizen One",
        "email": "citizen@example.com",
        "password": "Password@123"
    })
    assert reg1.status_code == 201
    user_token = client.post("/api/auth/login", json={"email": "citizen@example.com", "password": "Password@123"}).get_json()["data"]["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 2. Register & Login admin
    reg2 = client.post("/api/auth/register", json={
        "full_name": "Officer Admin",
        "email": "officer@example.com",
        "password": "Password@123"
    })
    assert reg2.status_code == 201

    # Elevate officer to ADMIN role in db
    with app.app_context():
        user_obj = User.query.filter_by(email="officer@example.com").first()
        admin_role = Role.query.filter_by(name="ADMIN").first()
        user_obj.roles.append(admin_role)
        db.session.commit()

    admin_token = client.post("/api/auth/login", json={"email": "officer@example.com", "password": "Password@123"}).get_json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. User creates credential
    cred_res = client.post("/api/credentials", headers=user_headers, json={
        "credential_type": "PASSPORT",
        "title": "International Travel Document",
        "issuer": "Department of Foreign Affairs",
        "metadata": {"country": "CA", "passport_no": "C998877"}
    })
    assert cred_res.status_code == 201
    cred_id = cred_res.get_json()["data"]["credential"]["id"]

    # 4. User requests verification for this credential
    req_res = client.post(f"/api/credentials/{cred_id}/verify", headers=user_headers)
    assert req_res.status_code == 200
    assert req_res.get_json()["data"]["credential"]["status"] == "PENDING_VERIFICATION"

    # 5. User submits identity verification request
    ver_res = client.post("/api/verification", headers=user_headers, json={
        "document_type": "PASSPORT",
        "document_number": "C998877",
        "details": {"citizenship": "Canadian"}
    })
    assert ver_res.status_code == 201
    ver_id = ver_res.get_json()["data"]["verification"]["id"]

    # 6. Admin approves verification
    review_res = client.post(f"/api/verification/{ver_id}/review", headers=admin_headers, json={
        "status": "APPROVED",
        "review_notes": "Valid biometric verification completed."
    })
    assert review_res.status_code == 200
    assert review_res.get_json()["data"]["verification"]["status"] == "APPROVED"
