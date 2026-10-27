import pytest
from app import create_app
from app.extensions import db
from app.config import TestConfig
from app.models.user import User
from app.models.rbac import Role, Permission

@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.test_client() as client:
        with app.app_context():
            db.drop_all()
            db.create_all()
            # Seed minimal roles
            user_role = Role(name="USER", description="Default user role")
            admin_role = Role(name="ADMIN", description="Administrator role")
            perm_profile = Permission(name="VIEW_PROFILE", description="View Profile")
            perm_edit = Permission(name="EDIT_PROFILE", description="Edit Profile")
            perm_mfa = Permission(name="MANAGE_MFA", description="Manage MFA")
            perm_hist = Permission(name="VIEW_LOGIN_HISTORY", description="View History")
            user_role.permissions.extend([perm_profile, perm_edit, perm_mfa, perm_hist])
            admin_role.permissions.extend([perm_profile, perm_edit, perm_mfa, perm_hist])
            db.session.add_all([user_role, admin_role, perm_profile, perm_edit, perm_mfa, perm_hist])
            db.session.commit()
            yield client
            db.session.remove()
            db.drop_all()

def test_registration_success(client):
    res = client.post("/api/auth/register", json={
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "john.doe@example.com"

def test_duplicate_registration_rejected(client):
    client.post("/api/auth/register", json={
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "password": "Password@123"
    })
    res = client.post("/api/auth/register", json={
        "full_name": "John Clone",
        "email": "john.doe@example.com",
        "password": "Password@123"
    })
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False

def test_login_success(client):
    client.post("/api/auth/register", json={
        "full_name": "Alice Smith",
        "email": "alice@example.com",
        "password": "Password@123"
    })
    res = client.post("/api/auth/login", json={
        "email": "alice@example.com",
        "password": "Password@123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["mfa_required"] is False

def test_login_failure_invalid_password(client):
    client.post("/api/auth/register", json={
        "full_name": "Bob Vance",
        "email": "bob@example.com",
        "password": "Password@123"
    })
    res = client.post("/api/auth/login", json={
        "email": "bob@example.com",
        "password": "WrongPassword@999"
    })
    assert res.status_code == 401
    data = res.get_json()
    assert data["success"] is False

def test_mfa_login_workflow(client):
    client.post("/api/auth/register", json={
        "full_name": "MFA User",
        "email": "mfa.user@example.com",
        "password": "Password@123"
    })
    # Enable MFA directly in DB
    user = User.query.filter_by(email="mfa.user@example.com").first()
    user.mfa_enabled = True
    db.session.commit()

    # Step 1: Login triggers MFA requirement
    login_res = client.post("/api/auth/login", json={
        "email": "mfa.user@example.com",
        "password": "Password@123"
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()["data"]
    assert login_data["mfa_required"] is True
    demo_otp = login_data["demo_otp"]
    assert demo_otp is not None

    # Step 2: Submit valid OTP
    otp_res = client.post("/api/auth/verify-otp", json={
        "user_id": login_data["user_id"],
        "otp_code": demo_otp
    })
    assert otp_res.status_code == 200
    otp_data = otp_res.get_json()["data"]
    assert "access_token" in otp_data
    assert otp_data["user"]["email"] == "mfa.user@example.com"

    # Step 3: Reuse of used OTP is rejected
    reuse_res = client.post("/api/auth/verify-otp", json={
        "user_id": login_data["user_id"],
        "otp_code": demo_otp
    })
    assert reuse_res.status_code == 400
