from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from app.core.database import supabase

router = APIRouter(prefix="/api/users", tags=["Users"])

VALID_ROLES = ("Admin", "Manager", "Employee")


class RoleUpdate(BaseModel):
    new_role: str


async def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        user_db = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        return user_db.data[0]
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")


@router.get("/")
async def list_company_users(user: dict = Depends(get_current_user)):
    """Return all users belonging to the admin's company."""
    if user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    result = supabase.table("users") \
        .select("id, first_name, last_name, email, role, created_at") \
        .eq("company_id", user["company_id"]) \
        .order("created_at") \
        .execute()

    return {"status": "success", "data": result.data}


@router.patch("/{target_user_id}/role")
async def update_user_role(
    target_user_id: str,
    body: RoleUpdate,
    user: dict = Depends(get_current_user)
):
    """Allow an Admin to change another user's role within their company."""
    if user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if body.new_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

    # Confirm target user belongs to same company (security check)
    target = supabase.table("users").select("id, company_id").eq("id", target_user_id).execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="User not found")
    if target.data[0]["company_id"] != user["company_id"]:
        raise HTTPException(status_code=403, detail="Cannot modify users from another company")

    supabase.table("users").update({"role": body.new_role}).eq("id", target_user_id).execute()

    return {"status": "success", "message": f"User role updated to {body.new_role}"}
