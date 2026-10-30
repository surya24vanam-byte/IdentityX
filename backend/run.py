import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"IDENTITYX backend server running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
