import jwt
from datetime import datetime, timedelta, timezone
import bcrypt

SECRET_KEY = "custom-super-secret-local-dev-key"
ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password: return False
    # Checkpw natively supports the standard bcrypt $2a$ format matching Supabase pgcrypto
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
