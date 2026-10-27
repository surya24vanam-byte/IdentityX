import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "identityx-super-secret-system-key-2026-xyz")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "identityx-jwt-secure-signing-key-998877")
    
    # SQLite Database
    basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{os.path.join(basedir, 'identityx.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Security Policy Configuration
    OTP_EXPIRATION_MINUTES = int(os.getenv("OTP_EXPIRATION_MINUTES", "5"))
    MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
    LOCKOUT_DURATION_MINUTES = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))
    SUSPICIOUS_WINDOW_MINUTES = int(os.getenv("SUSPICIOUS_WINDOW_MINUTES", "10"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_HOURS", "24")))
    
    # Demo Mode: Allows inspecting simulated OTP in dev mode for easy testing/grading
    DEMO_MODE = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")

class TestConfig(Config):
    TESTING = True
    basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(basedir, 'test_identityx.db')}"
    MAX_LOGIN_ATTEMPTS = 3
    LOCKOUT_DURATION_MINUTES = 5
