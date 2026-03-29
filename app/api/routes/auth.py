import httpx
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.database import supabase
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    country: str
    company_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register_user(payload: RegisterRequest):
    # Check if user already exists
    existing = supabase.table("users").select("id").eq("email", payload.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email is already registered")

    # Fetch currency
    currency = "USD"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://restcountries.com/v3.1/name/{payload.country}?fullText=true", timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()[0]
                currencies = data.get("currencies", {})
                if currencies:
                    currency = list(currencies.keys())[0]
    except Exception as e:
        pass # use USD fallback

    # Check or Create Company
    company_res = supabase.table("companies").select("*").eq("name", payload.company_name).execute()
    if company_res.data and len(company_res.data) > 0:
        company_id = company_res.data[0]["id"]
        role = "employee"
    else:
        new_company = supabase.table("companies").insert({
            "name": payload.company_name,
            "currency": currency
        }).execute()
        company_id = new_company.data[0]["id"]
        role = "admin"

    # Insert entirely into our public.users table (Bypassing Supabase GoTrue Auth)
    user_id = str(uuid.uuid4())
    pw_hash = get_password_hash(payload.password)

    new_user = supabase.table("users").insert({
        "id": user_id,
        "email": payload.email,
        "full_name": payload.full_name,
        "company_id": company_id,
        "role": role,
        "password_hash": pw_hash
    }).execute()

    # Generate custom JSON Web Token
    token = create_access_token({"sub": user_id, "email": payload.email, "role": role})
    return {"status": "success", "token": token, "user": new_user.data[0]}

@router.post("/login")
async def login_user(payload: LoginRequest):
    res = supabase.table("users").select("*").eq("email", payload.email).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
        
    user = res.data[0]
    if not verify_password(payload.password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid login credentials")
        
    token = create_access_token({"sub": user["id"], "email": payload.email, "role": user["role"]})
    return {"token": token, "user": user}
