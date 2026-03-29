from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.database import supabase
from app.api.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/users", tags=["Users"])

class UpdateRoleRequest(BaseModel):
    role: str

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Fetch profile data for the logged in user using their JWT token."""
    return {"user": current_user}

@router.get("/")
async def get_company_users(current_admin: dict = Depends(require_admin)):
    """Retrieve all users in the admin's company to manage their roles/reporting structure."""
    res = supabase.table("users").select("*").eq("company_id", current_admin["company_id"]).execute()
    return {"users": res.data}

@router.put("/{target_user_id}/role")
async def update_user_role(target_user_id: str, payload: UpdateRoleRequest, current_admin: dict = Depends(require_admin)):
    """Allows an Admin to update a worker's role to employee or manager."""
    if payload.role not in ['employee', 'manager']:
        raise HTTPException(status_code=400, detail="Invalid role. Supported roles: 'employee', 'manager'")
        
    # Ensure the target user actually belongs to the same company
    res = supabase.table("users").select("*").eq("id", target_user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    target_user = res.data[0]
    if target_user["company_id"] != current_admin["company_id"]:
        raise HTTPException(status_code=403, detail="You do not have permission to manage users outside your company")
        
    # Perform update
    update_res = supabase.table("users").update({"role": payload.role}).eq("id", target_user_id).execute()
    return {"status": "success", "user": update_res.data[0]}
