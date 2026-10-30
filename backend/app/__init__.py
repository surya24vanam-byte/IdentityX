from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    from app.routes import auth_bp, user_bp, credential_bp, verification_bp, admin_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(credential_bp)
    app.register_blueprint(verification_bp)
    app.register_blueprint(admin_bp)

    # Global Error Handlers for consistent JSON responses
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({
            "success": False,
            "message": str(e.description) if hasattr(e, "description") else "Bad request.",
            "error": "BAD_REQUEST"
        }), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            "success": False,
            "message": "The requested API endpoint or resource was not found.",
            "error": "NOT_FOUND"
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({
            "success": False,
            "message": "HTTP method not allowed on this route.",
            "error": "METHOD_NOT_ALLOWED"
        }), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({
            "success": False,
            "message": "Internal server error encountered.",
            "error": "INTERNAL_SERVER_ERROR"
        }), 500

    # Auto table creation within app context
    with app.app_context():
        db.create_all()

    return app
