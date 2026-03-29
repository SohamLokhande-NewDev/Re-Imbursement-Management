import jwt
from fastapi import Header, HTTPException, Depends
from app.core.database import supabase
from app.core.security import SECRET_KEY, ALGORITHM

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")
    
    token = authorization.split(" ")[1]
    
    try:
        # Decode custom JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        # Get full user profile from the database
        db_user = supabase.table("users").select("*").eq("id", user_id).single().execute()
        if not db_user.data:
            raise HTTPException(status_code=404, detail="User profile not found in database.")
        return db_user.data
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required to perform this action")
    return current_user
