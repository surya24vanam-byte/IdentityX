from flask import Blueprint, request, g
from app.services.auth_service import AuthService
from app.services.mfa_service import MFAService
from app.services.security_service import SecurityService
from app.utils.decorators import token_required
from app.utils.helpers import success_response, error_response, get_client_ip
from app.utils.validators import validate_required_fields
from app.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["full_name", "email", "password"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    password = data.get("password")
    confirm_password = data.get("confirm_password")
    if confirm_password and password != confirm_password:
        return error_response("Passwords do not match.", "PASSWORD_MISMATCH", 400)

    ip_address = get_client_ip(request)
    success, message, new_user = AuthService.register_user(
        full_name=data.get("full_name"),
        email=data.get("email"),
        password=password,
        phone=data.get("phone"),
        ip_address=ip_address
    )

    if not success:
        return error_response(message, "REGISTRATION_FAILED", 400)

    return success_response(
        data={"user": new_user.to_dict()},
        message=message,
        status_code=201
    )

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["email", "password"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "Unknown")

    success, message, result = AuthService.login_user(
        email=data.get("email"),
        password=data.get("password"),
        ip_address=ip_address,
        user_agent=user_agent
    )

    if not success:
        status_code = 403 if (result and result.get("locked")) else 401
        return error_response(message, "LOGIN_FAILED", status_code, details=result)

    return success_response(data=result, message=message, status_code=200)

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["user_id", "otp_code"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "Unknown")

    success, message, result = AuthService.verify_mfa_login(
        user_id=data.get("user_id"),
        otp_code=str(data.get("otp_code")),
        ip_address=ip_address,
        user_agent=user_agent
    )

    if not success:
        return error_response(message, "MFA_VERIFICATION_FAILED", 400)

    return success_response(data=result, message=message, status_code=200)

@auth_bp.route("/send-otp", methods=["POST"])
def resend_otp():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    email = data.get("email")

    user = None
    if user_id:
        user = User.query.get(user_id)
    elif email:
        user = User.query.filter_by(email=email.strip().lower()).first()

    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    ip_address = get_client_ip(request)
    code, _ = MFAService.generate_otp(user, purpose="MFA_LOGIN", ip_address=ip_address)

    return success_response(
        data={"demo_otp": code},
        message="A new OTP has been dispatched to your registered channel.",
        status_code=200
    )

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    user = g.current_user
    session_rec = g.current_session
    return success_response(
        data={
            "user": user.to_dict(include_security_score=True),
            "session": session_rec.to_dict()
        },
        message="User profile retrieved successfully."
    )

@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    session_rec = g.current_session
    AuthService.revoke_session(session_rec.session_token, g.current_user.id)
    return success_response(message="Logged out successfully.")

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["email"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    ip_address = get_client_ip(request)
    success, message, result = AuthService.initiate_forgot_password(
        email=data.get("email"),
        ip_address=ip_address
    )
    return success_response(data=result or {}, message=message)

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    is_valid, err = validate_required_fields(data, ["token", "new_password"])
    if not is_valid:
        return error_response(err, "VALIDATION_ERROR", 400)

    confirm_password = data.get("confirm_password")
    if confirm_password and data.get("new_password") != confirm_password:
        return error_response("Passwords do not match.", "PASSWORD_MISMATCH", 400)

    ip_address = get_client_ip(request)
    success, message = AuthService.complete_password_reset(
        token=data.get("token"),
        new_password=data.get("new_password"),
        ip_address=ip_address
    )

    if not success:
        return error_response(message, "RESET_FAILED", 400)

    return success_response(message=message)
