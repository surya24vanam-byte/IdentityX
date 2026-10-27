from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, g
from sqlalchemy import func
from app.extensions import db
from app.models.user import User
from app.models.rbac import Role, Permission
from app.models.credential import Credential
from app.models.verification import IdentityVerification
from app.models.session_log import SessionRecord, LoginAttempt
from app.models.security import SecurityLog
from app.services.security_service import SecurityService
from app.services.auth_service import AuthService
from app.utils.decorators import token_required, permission_required, role_required
from app.utils.helpers import success_response, error_response, get_client_ip
from app.utils.validators import validate_required_fields

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/dashboard", methods=["GET"])
@token_required
@permission_required("VIEW_SECURITY_LOGS")
def get_dashboard_metrics():
    # Real database-backed statistics
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    
    # Verified users (users having at least one APPROVED verification)
    verified_user_ids = db.session.query(IdentityVerification.user_id).filter_by(status="APPROVED").distinct()
    verified_users_count = verified_user_ids.count()
    
    mfa_enabled_users = User.query.filter_by(mfa_enabled=True).count()
    failed_login_attempts = LoginAttempt.query.filter_by(status="FAILED").count()
    
    suspicious_events = SecurityLog.query.filter(
        (SecurityLog.event_type == "SUSPICIOUS_LOGIN_DETECTED") | 
        (SecurityLog.severity.in_(["HIGH", "CRITICAL"]))
    ).count()
    
    locked_accounts = User.query.filter_by(is_locked=True).count()
    active_sessions = SessionRecord.query.filter_by(is_active=True).count()
    pending_verifications = IdentityVerification.query.filter_by(status="PENDING").count()

    # Chart / Trend Data: Logins over last 7 days
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=6)
    
    # Group login attempts by date
    recent_attempts = LoginAttempt.query.filter(LoginAttempt.timestamp >= seven_days_ago).all()
    day_counts = {}
    for i in range(7):
        day_date = (seven_days_ago + timedelta(days=i)).strftime("%Y-%m-%d")
        day_counts[day_date] = {"date": day_date, "success": 0, "failed": 0, "suspicious": 0}

    for att in recent_attempts:
        day_str = att.timestamp.strftime("%Y-%m-%d") if att.timestamp else None
        if day_str in day_counts:
            if att.status == "SUCCESS":
                day_counts[day_str]["success"] += 1
            elif att.status == "FAILED":
                day_counts[day_str]["failed"] += 1
            elif att.status in ("SUSPICIOUS", "LOCKED"):
                day_counts[day_str]["suspicious"] += 1

    trends = sorted(day_counts.values(), key=lambda x: x["date"])

    # Recent security events (top 10)
    recent_logs = SecurityLog.query.order_by(SecurityLog.created_at.desc()).limit(10).all()

    # Severity distribution
    severity_stats = {
        "LOW": SecurityLog.query.filter_by(severity="LOW").count(),
        "MEDIUM": SecurityLog.query.filter_by(severity="MEDIUM").count(),
        "HIGH": SecurityLog.query.filter_by(severity="HIGH").count(),
        "CRITICAL": SecurityLog.query.filter_by(severity="CRITICAL").count(),
    }

    # Roles distribution
    roles = Role.query.all()
    role_distribution = [{"role": r.name, "count": len(r.users.all())} for r in roles]

    return success_response(
        data={
            "metrics": {
                "total_users": total_users,
                "active_users": active_users,
                "verified_users": verified_users_count,
                "mfa_enabled_users": mfa_enabled_users,
                "failed_login_attempts": failed_login_attempts,
                "suspicious_events": suspicious_events,
                "locked_accounts": locked_accounts,
                "active_sessions": active_sessions,
                "pending_verifications": pending_verifications
            },
            "activity_trends": trends,
            "severity_distribution": severity_stats,
            "role_distribution": role_distribution,
            "recent_security_events": [log.to_dict() for log in recent_logs]
        },
        message="Dashboard metrics retrieved."
    )

@admin_bp.route("/users", methods=["GET"])
@token_required
@permission_required("MANAGE_USERS")
def list_users():
    search = request.args.get("search", "").strip()
    role_filter = request.args.get("role", "").strip()
    status_filter = request.args.get("status", "").strip()
    mfa_filter = request.args.get("mfa", "").strip()

    query = User.query

    if search:
        query = query.filter((User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%")))

    if status_filter == "locked":
        query = query.filter(User.is_locked == True)
    elif status_filter == "active":
        query = query.filter(User.is_active == True, User.is_locked == False)
    elif status_filter == "inactive":
        query = query.filter(User.is_active == False)

    if mfa_filter == "true":
        query = query.filter(User.mfa_enabled == True)
    elif mfa_filter == "false":
        query = query.filter(User.mfa_enabled == False)

    users = query.order_by(User.created_at.desc()).all()

    if role_filter:
        users = [u for u in users if any(r.name.upper() == role_filter.upper() for r in u.roles)]

    return success_response(
        data={"users": [u.to_dict(include_security_score=True) for u in users]},
        message="Users retrieved."
    )

@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@token_required
@permission_required("MANAGE_USERS")
def get_user_details(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    # Detailed security profile
    login_history = LoginAttempt.query.filter_by(user_id=user.id).order_by(LoginAttempt.timestamp.desc()).limit(20).all()
    sessions = SessionRecord.query.filter_by(user_id=user.id).order_by(SessionRecord.last_activity.desc()).all()
    verifications = IdentityVerification.query.filter_by(user_id=user.id).order_by(IdentityVerification.submitted_at.desc()).all()
    credentials = Credential.query.filter_by(user_id=user.id).order_by(Credential.created_at.desc()).all()

    return success_response(
        data={
            "user": user.to_dict(include_security_score=True),
            "login_history": [a.to_dict() for a in login_history],
            "sessions": [s.to_dict() for s in sessions],
            "verifications": [v.to_dict() for v in verifications],
            "credentials": [c.to_dict() for c in credentials]
        },
        message="User details retrieved."
    )

@admin_bp.route("/users/<int:user_id>/lock", methods=["POST"])
@token_required
@permission_required("LOCK_USER")
def lock_user(user_id):
    admin_user = g.current_user
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    if user.id == admin_user.id:
        return error_response("Administrators cannot lock their own account.", "FORBIDDEN_SELF_LOCK", 400)

    user.is_locked = True
    user.locked_until = None # Indefinite manual admin lock until explicitly unlocked
    db.session.commit()

    # Invalidate all user sessions
    AuthService.revoke_all_sessions(user.id)

    SecurityService.log_event(
        event_type="ACCOUNT_LOCKED_BY_ADMIN",
        description=f"Account {user.email} was locked by Admin {admin_user.email}.",
        severity="HIGH",
        user_id=user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(
        data={"user": user.to_dict()},
        message=f"User {user.email} has been locked and active sessions terminated."
    )

@admin_bp.route("/users/<int:user_id>/unlock", methods=["POST"])
@token_required
@permission_required("UNLOCK_USER")
def unlock_user(user_id):
    admin_user = g.current_user
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    user.is_locked = False
    user.locked_until = None
    user.failed_login_attempts = 0
    db.session.commit()

    SecurityService.log_event(
        event_type="ACCOUNT_UNLOCKED_BY_ADMIN",
        description=f"Account {user.email} was unlocked by Admin {admin_user.email}. Failed attempt counter reset.",
        severity="LOW",
        user_id=user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(
        data={"user": user.to_dict()},
        message=f"User {user.email} has been unlocked."
    )

@admin_bp.route("/users/<int:user_id>/roles", methods=["PUT"])
@token_required
@permission_required("MANAGE_ROLES")
def update_user_roles(user_id):
    admin_user = g.current_user
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    data = request.get_json(silent=True) or {}
    role_names = data.get("roles", [])

    if not isinstance(role_names, list) or not role_names:
        return error_response("At least one valid role must be specified.", "VALIDATION_ERROR", 400)

    assigned_roles = []
    for r_name in role_names:
        role = Role.query.filter_by(name=r_name.strip().upper()).first()
        if role:
            assigned_roles.append(role)

    if not assigned_roles:
        return error_response("No valid roles found in payload.", "INVALID_ROLES", 400)

    user.roles = assigned_roles
    db.session.commit()

    SecurityService.log_event(
        event_type="USER_ROLES_UPDATED",
        description=f"Roles for {user.email} updated to [{', '.join([r.name for r in assigned_roles])}] by {admin_user.email}.",
        severity="MEDIUM",
        user_id=user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(
        data={"user": user.to_dict()},
        message="User roles updated successfully."
    )

@admin_bp.route("/roles", methods=["GET"])
@token_required
@permission_required("MANAGE_ROLES")
def list_roles():
    roles = Role.query.all()
    return success_response(
        data={"roles": [r.to_dict() for r in roles]},
        message="Roles retrieved."
    )

@admin_bp.route("/roles", methods=["POST"])
@token_required
@permission_required("MANAGE_ROLES")
def create_role():
    admin_user = g.current_user
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["name"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    role_name = data.get("name").strip().upper()
    if Role.query.filter_by(name=role_name).first():
        return error_response(f"Role '{role_name}' already exists.", "DUPLICATE_ROLE", 400)

    role = Role(
        name=role_name,
        description=data.get("description", "").strip()
    )

    # Assign permissions if provided
    permission_names = data.get("permissions", [])
    if isinstance(permission_names, list):
        for p_name in permission_names:
            perm = Permission.query.filter_by(name=p_name.strip().upper()).first()
            if perm:
                role.permissions.append(perm)

    db.session.add(role)
    db.session.commit()

    SecurityService.log_event(
        event_type="ROLE_CREATED",
        description=f"Role '{role.name}' created by {admin_user.email}.",
        severity="MEDIUM",
        user_id=admin_user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(data={"role": role.to_dict()}, message=f"Role '{role.name}' created.", status_code=201)

@admin_bp.route("/roles/<int:role_id>", methods=["PUT"])
@token_required
@permission_required("MANAGE_ROLES")
def update_role(role_id):
    admin_user = g.current_user
    role = Role.query.get(role_id)
    if not role:
        return error_response("Role not found.", "NOT_FOUND", 404)

    data = request.get_json(silent=True) or {}
    if "description" in data:
        role.description = data["description"]

    if "permissions" in data and isinstance(data["permissions"], list):
        new_permissions = []
        for p_name in data["permissions"]:
            perm = Permission.query.filter_by(name=p_name.strip().upper()).first()
            if perm:
                new_permissions.append(perm)
        role.permissions = new_permissions

    db.session.commit()

    SecurityService.log_event(
        event_type="ROLE_PERMISSIONS_UPDATED",
        description=f"Permissions for role '{role.name}' updated by {admin_user.email}.",
        severity="MEDIUM",
        user_id=admin_user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(data={"role": role.to_dict()}, message=f"Role '{role.name}' updated.")

@admin_bp.route("/permissions", methods=["GET"])
@token_required
@permission_required("MANAGE_PERMISSIONS")
def list_permissions():
    perms = Permission.query.order_by(Permission.category, Permission.name).all()
    categories = {}
    for p in perms:
        if p.category not in categories:
            categories[p.category] = []
        categories[p.category].append(p.to_dict())

    return success_response(
        data={"permissions": [p.to_dict() for p in perms], "by_category": categories},
        message="Permissions retrieved."
    )

@admin_bp.route("/security-logs", methods=["GET"])
@token_required
@permission_required("VIEW_SECURITY_LOGS")
def list_security_logs():
    severity = request.args.get("severity")
    event_type = request.args.get("event_type")
    user_id = request.args.get("user_id", type=int)
    limit = min(request.args.get("limit", 100, type=int), 200)

    query = SecurityLog.query
    if severity:
        query = query.filter_by(severity=severity.upper())
    if event_type:
        query = query.filter(SecurityLog.event_type.ilike(f"%{event_type}%"))
    if user_id:
        query = query.filter_by(user_id=user_id)

    logs = query.order_by(SecurityLog.created_at.desc()).limit(limit).all()

    return success_response(
        data={"logs": [l.to_dict() for l in logs]},
        message="Security logs retrieved."
    )

@admin_bp.route("/login-attempts", methods=["GET"])
@token_required
@permission_required("VIEW_LOGIN_ATTEMPTS")
def list_login_attempts():
    status = request.args.get("status")
    email = request.args.get("email")
    limit = min(request.args.get("limit", 100, type=int), 200)

    query = LoginAttempt.query
    if status:
        query = query.filter_by(status=status.upper())
    if email:
        query = query.filter(LoginAttempt.email.ilike(f"%{email}%"))

    attempts = query.order_by(LoginAttempt.timestamp.desc()).limit(limit).all()

    return success_response(
        data={"login_attempts": [a.to_dict() for a in attempts]},
        message="Login attempts retrieved."
    )

@admin_bp.route("/suspicious-events", methods=["GET"])
@token_required
@permission_required("VIEW_SECURITY_LOGS")
def list_suspicious_events():
    limit = min(request.args.get("limit", 50, type=int), 100)
    events = SecurityLog.query.filter(
        (SecurityLog.event_type == "SUSPICIOUS_LOGIN_DETECTED") |
        (SecurityLog.severity.in_(["HIGH", "CRITICAL"]))
    ).order_by(SecurityLog.created_at.desc()).limit(limit).all()

    return success_response(
        data={"suspicious_events": [e.to_dict() for e in events]},
        message="Suspicious events retrieved."
    )
