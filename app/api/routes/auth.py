from fastapi import APIRouter, HTTPException
from app.schemas.auth import UserRegister, UserLogin
from app.core.database import supabase
import requests as http_requests

router = APIRouter(prefix="/api/auth", tags=["Auth"])

def _get_currency_for_country(country_name: str) -> str:
    """Fetch the primary currency code for a country name via restcountries API."""
    try:
        res = http_requests.get(
            f"https://restcountries.com/v3.1/name/{country_name}",
            params={"fields": "currencies"},
            timeout=5
        )
        data = res.json()
        # data[0]['currencies'] = {'USD': {'name': 'US Dollar', 'symbol': '$'}}
        currencies = data[0].get("currencies", {})
        if currencies:
            return list(currencies.keys())[0]
    except Exception:
        pass
    return "USD"  # Fallback

@router.post("/register")
def register(user: UserRegister):
    try:
        # 1. Check if company with this name already exists (case-insensitive)
        existing = supabase.table("companies") \
            .select("id") \
            .ilike("name", user.company_name) \
            .limit(1) \
            .execute()

        if existing.data:
            # Company EXISTS → Employee
            company_id = existing.data[0]["id"]
            role = "Employee"
        else:
            # Company does NOT exist → fetch currency and create it as Admin
            currency = _get_currency_for_country(user.country)
            new_company = supabase.table("companies").insert({
                "name": user.company_name,
                "default_currency": currency
            }).execute()
            company_id = new_company.data[0]["id"]
            role = "Admin"

        # 2. Sign up user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
        })

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Registration failed in Supabase Auth")

        auth_user_id = auth_response.user.id

        # 3. Insert into custom users table
        new_user = supabase.table("users").insert({
            "id": auth_user_id,
            "company_id": company_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": role
        }).execute()

        return {
            "status": "success",
            "message": f"User registered as {role} for {user.company_name}",
            "data": new_user.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(user: UserLogin):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password,
        })
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        # Fetch custom user details
        user_data = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
        
        return {
            "status": "success", 
            "token": auth_response.session.access_token,
            "user": user_data.data[0] if user_data.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
