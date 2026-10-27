import re

def validate_email(email):
    if not email or not isinstance(email, str):
        return False, "Email is required."
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, email.strip()):
        return False, "Invalid email address format."
    return True, None

def validate_password(password):
    if not password or not isinstance(password, str):
        return False, "Password is required."
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character (!@#$%^&*...)."
    return True, None

def validate_required_fields(data, required_fields):
    if not isinstance(data, dict):
        return False, "Invalid JSON payload."
    missing = [f for f in required_fields if f not in data or data[f] is None or str(data[f]).strip() == ""]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, None
