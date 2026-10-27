import pytest
from app import create_app
from app.extensions import db
from app.config import TestConfig
from app.models.user import User
from app.models.rbac import Role, Permission

@pytest.fixture
def app_and_client():
    app = create_app(TestConfig)
    with app.app_context():
        db.drop_all()
        db.create_all()
        user_role = Role(name="USER", description="Default user role")
        admin_role = Role(name="ADMIN", description="Administrator role")
        
        p_profile = Permission(name="VIEW_PROFILE", description="View Profile", category="IDENTITY")
        p_edit = Permission(name="EDIT_PROFILE", description="Edit Profile", category="IDENTITY")
        p_mfa = Permission(name="MANAGE_MFA", description="Manage MFA", category="IDENTITY")
        p_hist = Permission(name="VIEW_LOGIN_HISTORY", description="View History", category="IDENTITY")
        p_manage_users = Permission(name="MANAGE_USERS", description="Manage Users", category="ADMINISTRATION")
        p_lock_user = Permission(name="LOCK_USER", description="Lock Users", category="ADMINISTRATION")
        p_logs = Permission(name="VIEW_SECURITY_LOGS", description="View Logs", category="SECURITY")
        
        user_role.permissions.extend([p_profile, p_edit, p_mfa, p_hist])
        admin_role.permissions.extend([p_profile, p_edit, p_mfa, p_hist, p_manage_users, p_lock_user, p_logs])
        
        db.session.add_all([user_role, admin_role, p_profile, p_edit, p_mfa, p_hist, p_manage_users, p_lock_user, p_logs])
        db.session.commit()
        
    with app.test_client() as client:
        yield app, client

    with app.app_context():
        db.session.remove()
        db.drop_all()

def test_unauthorized_access_blocked_without_token(app_and_client):
    _, client = app_and_client
    res = client.get("/api/users/profile")
    assert res.status_code == 401
    assert res.get_json()["error"] == "AUTHENTICATION_REQUIRED"

def test_regular_user_cannot_access_admin_endpoints(app_and_client):
    _, client = app_and_client
    # Register and login regular user
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Standard User",
        "email": "standard@example.com",
        "password": "Password@123"
    })
    assert reg_res.status_code == 201

    login_res = client.post("/api/auth/login", json={
        "email": "standard@example.com",
        "password": "Password@123"
    })
    assert login_res.status_code == 200
    token = login_res.get_json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Regular user can access own profile
    prof_res = client.get("/api/users/profile", headers=headers)
    assert prof_res.status_code == 200

    # Regular user CANNOT access admin dashboard
    admin_dash_res = client.get("/api/admin/dashboard", headers=headers)
    assert admin_dash_res.status_code == 403
    assert admin_dash_res.get_json()["error"] == "FORBIDDEN_PERMISSION"

    # Regular user CANNOT list all users
    users_res = client.get("/api/admin/users", headers=headers)
    assert users_res.status_code == 403
