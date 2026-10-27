from app.routes.auth_routes import auth_bp
from app.routes.user_routes import user_bp
from app.routes.credential_routes import credential_bp
from app.routes.verification_routes import verification_bp
from app.routes.admin_routes import admin_bp

__all__ = [
    "auth_bp",
    "user_bp",
    "credential_bp",
    "verification_bp",
    "admin_bp"
]
