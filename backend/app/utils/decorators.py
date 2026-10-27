from functools import wraps
from flask import request, g
from datetime import datetime, timezone
from app.extensions import db
from app.services.auth_service import AuthService
from app.models.user import User
from app.models.session_log import SessionRecord
from app.utils.helpers import error_response

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return error_response(
                message="Authentication token is missing. Please provide a Bearer token.",
                error_code="AUTHENTICATION_REQUIRED",
                status_code=401
            )

        parts = auth_header.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return error_response(
                message="Invalid Authorization header format. Format must be 'Bearer <token>'.",
                error_code="INVALID_TOKEN_FORMAT",
                status_code=401
            )

        token = parts[1]
        decoded = AuthService.decode_token(token)
        if not decoded:
            return error_response(
                message="Authentication token is invalid or has expired.",
                error_code="TOKEN_EXPIRED_OR_INVALID",
                status_code=401
            )

        sub_val = decoded.get("sub")
        user_id = int(sub_val) if sub_val is not None else None
        session_token = decoded.get("session_token")

        user = User.query.get(user_id) if user_id else None
        if not user or not user.is_active:
            return error_response(
                message="User account associated with this token is inactive or no longer exists.",
                error_code="ACCOUNT_INACTIVE",
                status_code=401
            )

        if user.is_currently_locked():
            return error_response(
                message="User account is currently locked due to security policy.",
                error_code="ACCOUNT_LOCKED",
                status_code=403
            )

        # Check session validity
        session_rec = SessionRecord.query.filter_by(
            session_token=session_token,
            user_id=user.id,
            is_active=True
        ).first()

        if not session_rec:
            return error_response(
                message="Session has expired or was revoked. Please sign in again.",
                error_code="SESSION_REVOKED",
                status_code=401
            )

        # Update last activity
        session_rec.last_activity = datetime.now(timezone.utc)
        db.session.commit()

        g.current_user = user
        g.current_session = session_rec
        return f(*args, **kwargs)

    return decorated

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated_function(*args, **kwargs):
            user = g.current_user
            user_role_names = [r.name.upper() for r in user.roles]

            if not any(role.upper() in user_role_names for role in allowed_roles):
                return error_response(
                    message=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}.",
                    error_code="FORBIDDEN_ROLE",
                    status_code=403
                )
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def permission_required(*required_permissions):
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated_function(*args, **kwargs):
            user = g.current_user
            missing = [perm for perm in required_permissions if not user.has_permission(perm)]

            if missing:
                return error_response(
                    message=f"Access denied. Missing permission(s): {', '.join(missing)}.",
                    error_code="FORBIDDEN_PERMISSION",
                    status_code=403
                )
            return f(*args, **kwargs)
        return decorated_function
    return decorator
