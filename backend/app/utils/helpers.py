from flask import jsonify

def success_response(data=None, message="Operation successful", status_code=200):
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    return jsonify(payload), status_code

def error_response(message="An error occurred", error_code="ERROR", status_code=400, details=None):
    payload = {
        "success": False,
        "message": message,
        "error": error_code
    }
    if details:
        payload["details"] = details
    return jsonify(payload), status_code

def get_client_ip(request):
    if request.headers.get("X-Forwarded-For"):
        return request.headers.get("X-Forwarded-For").split(",")[0].strip()
    if request.headers.get("X-Real-IP"):
        return request.headers.get("X-Real-IP").strip()
    return request.remote_addr or "127.0.0.1"

def parse_device_info(user_agent_str):
    if not user_agent_str:
        return "Unknown Device / Browser"
    ua = user_agent_str.lower()
    os_name = "Desktop"
    if "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "linux" in ua:
        os_name = "Linux"
    elif "android" in ua:
        os_name = "Android"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"

    browser = "Web Browser"
    if "edg" in ua:
        browser = "Edge"
    elif "chrome" in ua and "safari" in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua:
        browser = "Safari"

    return f"{os_name} ({browser})"
