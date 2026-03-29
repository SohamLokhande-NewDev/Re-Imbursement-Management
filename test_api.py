import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api"
results = {}

# 1. Test Gemini
res_gemini = requests.get(f"{BASE_URL}/test-gemini")
results["gemini"] = {"status": res_gemini.status_code, "body": res_gemini.text}

# 2. Test Auth Register
test_email = f"final_admin_{uuid.uuid4().hex[:8]}@example.com"
test_password = "SecurePassword123!"

register_payload = {
    "email": test_email,
    "password": test_password,
    "first_name": "Admin",
    "last_name": "User"
}

res_register = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
results["register"] = {"status": res_register.status_code, "body": res_register.text}

# 3. Test Auth Login
login_payload = {
    "email": test_email,
    "password": test_password
}

res_login = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
results["login"] = {"status": res_login.status_code, "body": res_login.text}

with open("test_results.json", "w") as f:
    json.dump(results, f, indent=2)

