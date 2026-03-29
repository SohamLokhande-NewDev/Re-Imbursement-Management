from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from app.core.database import supabase
from app.services.workflow import process_approval
from app.services.currency import convert_currency

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])


class ApprovalAction(BaseModel):
    action: str  # "approve" | "reject"
    comment: str = ""


async def get_current_user_details(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        user_db = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        return user_db.data[0]
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")


@router.get("/pending")
async def get_pending_approvals(user: dict = Depends(get_current_user_details)):
    """
    Fetch all expenses where this user is the current designated approver.
    Managers also see all company expenses with status=Pending.
    """
    try:
        if user["role"] in ("Manager", "Admin"):
            # Managers/Admins see all pending expenses in their company
            result = supabase.table("expenses") \
                .select("*, users!expenses_employee_id_fkey(first_name, last_name, email)") \
                .eq("company_id", user["company_id"]) \
                .eq("status", "Pending") \
                .execute()
        else:
            # Regular users see expenses awaiting their specific approval
            result = supabase.table("expenses") \
                .select("*, users!expenses_employee_id_fkey(first_name, last_name, email)") \
                .eq("current_approver_id", user["id"]) \
                .eq("status", "Pending") \
                .execute()

        expenses = result.data or []

        # Get company's default currency for conversion
        company_result = supabase.table("companies") \
            .select("default_currency") \
            .eq("id", user["company_id"]) \
            .single() \
            .execute()
        company_currency = (company_result.data or {}).get("default_currency", "USD")

        # Append converted_amount
        for expense in expenses:
            expense["converted_amount"] = convert_currency(
                expense["amount"],
                expense["currency"],
                company_currency
            )
            expense["company_currency"] = company_currency

        return {"status": "success", "data": expenses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{expense_id}/action")
async def action_on_expense(
    expense_id: str,
    body: ApprovalAction,
    user: dict = Depends(get_current_user_details)
):
    """Approve or reject an expense with an optional comment."""
    if user["role"] not in ("Manager", "Admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    if body.action == "reject" and not body.comment:
        raise HTTPException(status_code=400, detail="A comment is required when rejecting an expense")
    
    if body.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    try:
        result = process_approval(expense_id, user, body.action, body.comment)
        return {"status": "success", "data": result}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
