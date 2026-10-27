from flask import Blueprint, request, g
from app.extensions import db
from app.services.auth_service import AuthService
from app.services.mfa_service import MFAService
from app.services.security_service import SecurityService
from app.models.session_log import SessionRecord, LoginAttempt
from app.utils.decorators import token_required, permission_required
from app.utils.helpers import success_response, error_response, get_client_ip
from app.utils.validators import validate_required_fields

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

@user_bp.route("/profile", methods=["GET"])
@token_required
@permission_required("VIEW_PROFILE")
def get_profile():
    user = g.current_user
    return success_response(
        data={"user": user.to_dict(include_security_score=True)},
        message="Profile retrieved."
    )

@user_bp.route("/profile", methods=["PUT"])
@token_required
@permission_required("EDIT_PROFILE")
def update_profile():
    user = g.current_user
    data = request.get_json(silent=True) or {}

    if "full_name" in data and data["full_name"]:
        user.full_name = data["full_name"].strip()
    if "phone" in data:
        user.phone = data["phone"].strip() if data["phone"] else None

    db.session.commit()

    SecurityService.log_event(
        event_type="PROFILE_UPDATED",
        description=f"Profile updated for {user.email}.",
        severity="LOW",
        user_id=user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(
        data={"user": user.to_dict(include_security_score=True)},
        message="Profile updated successfully."
    )

@user_bp.route("/security", methods=["GET"])
@token_required
def get_security_posture():
    user = g.current_user
    score_data = user.calculate_security_score()
    return success_response(
        data={
            "security_score": score_data,
            "mfa_enabled": user.mfa_enabled,
            "verification_status": user.get_verification_status(),
            "failed_login_attempts": user.failed_login_attempts,
            "is_locked": user.is_locked
        },
        message="Security posture retrieved."
    )

@user_bp.route("/mfa/enable-request", methods=["POST"])
@token_required
@permission_required("MANAGE_MFA")
def request_enable_mfa():
    user = g.current_user
    if user.mfa_enabled:
        return error_response("MFA is already enabled on this account.", "ALREADY_ENABLED", 400)

    ip_address = get_client_ip(request)
    code, _ = MFAService.generate_otp(user, purpose="ENABLE_MFA", ip_address=ip_address)

    return success_response(
        data={"demo_otp": code},
        message="A verification OTP has been generated. Submit it to activate MFA."
    )

@user_bp.route("/mfa/confirm-enable", methods=["POST"])
@token_required
@permission_required("MANAGE_MFA")
def confirm_enable_mfa():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["otp_code"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    ip_address = get_client_ip(request)
    valid, msg = MFAService.verify_otp(user, str(data.get("otp_code")), purpose="ENABLE_MFA", ip_address=ip_address)
    if not valid:
        return error_response(msg, "VERIFICATION_FAILED", 400)

    user.mfa_enabled = True
    db.session.commit()

    SecurityService.log_event(
        event_type="MFA_ENABLED",
        description=f"Multi-Factor Authentication enabled for {user.email}.",
        severity="LOW",
        user_id=user.id,
        ip_address=ip_address
    )

    return success_response(
        data={"mfa_enabled": True, "security_score": user.calculate_security_score()},
        message="MFA has been successfully enabled for your account."
    )

@user_bp.route("/mfa/disable", methods=["POST"])
@token_required
@permission_required("MANAGE_MFA")
def disable_mfa():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["password"])
    if not is_valid:
        return error_response("Current password is required to disable MFA.", "VALIDATION_ERROR", 400)

    if not user.check_password(data.get("password")):
        return error_response("Incorrect password.", "INVALID_PASSWORD", 400)

    user.mfa_enabled = False
    db.session.commit()

    SecurityService.log_event(
        event_type="MFA_DISABLED",
        description=f"Multi-Factor Authentication disabled for {user.email}.",
        severity="MEDIUM",
        user_id=user.id,
        ip_address=get_client_ip(request)
    )

    return success_response(
        data={"mfa_enabled": False, "security_score": user.calculate_security_score()},
        message="MFA has been disabled."
    )

@user_bp.route("/sessions", methods=["GET"])
@token_required
def get_user_sessions():
    user = g.current_user
    current_session = g.current_session
    sessions = SessionRecord.query.filter_by(user_id=user.id).order_by(SessionRecord.last_activity.desc()).all()
    
    session_list = []
    for s in sessions:
        item = s.to_dict()
        item["is_current"] = (s.id == current_session.id)
        session_list.append(item)

    return success_response(data={"sessions": session_list}, message="User sessions retrieved.")

@user_bp.route("/sessions/<token>", methods=["DELETE"])
@token_required
def revoke_single_session(token):
    user = g.current_user
    success, msg = AuthService.revoke_session(token, user_id=user.id)
    if not success:
        return error_response(msg, "REVOKE_FAILED", 400)
    return success_response(message=msg)

@user_bp.route("/sessions/revoke-all-others", methods=["POST"])
@token_required
def revoke_other_sessions():
    user = g.current_user
    current_session = g.current_session
    success, msg = AuthService.revoke_all_sessions(user.id, except_token=current_session.session_token)
    return success_response(message=msg)

@user_bp.route("/login-history", methods=["GET"])
@token_required
@permission_required("VIEW_LOGIN_HISTORY")
def get_login_history():
    user = g.current_user
    attempts = LoginAttempt.query.filter_by(user_id=user.id).order_by(LoginAttempt.timestamp.desc()).limit(50).all()
    return success_response(
        data={"login_history": [a.to_dict() for a in attempts]},
        message="Login history retrieved."
    )
