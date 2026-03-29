from fastapi import APIRouter, HTTPException
from app.schemas.auth import UserRegister, UserLogin
from app.core.database import supabase

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register")
def register(user: UserRegister):
    try:
        # 1. Sign up user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Registration failed in Supabase Auth")
            
        auth_user_id = auth_response.user.id
        
        # 2. Check if any company exists
        companies = supabase.table("companies").select("*").limit(1).execute()
        
        if not companies.data:
            # Create Default Corp
            new_company = supabase.table("companies").insert({
                "name": "Default Corp",
                "default_currency": "USD"
            }).execute()
            company_id = new_company.data[0]["id"]
            role = "Admin"
        else:
            company_id = companies.data[0]["id"]
            role = "Employee"
            
        # 3. Insert into custom users table
        new_user = supabase.table("users").insert({
            "id": auth_user_id,
            "company_id": company_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": role
        }).execute()
        
        return {"status": "success", "message": "User registered successfully", "data": new_user.data[0]}
        
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
