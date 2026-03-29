from app.core.database import supabase

# -------------------------------------------------------------------------
# Mock Approval Sequence Config
# In a real system, this would be stored per-company in the DB.
# Step 1: Direct Manager  (if is_manager_approver=True, else skip)
# Step 1 (default): Any Finance group member
# Step 2: 60% of Finance group OR someone with role='Admin' (CFO/Director)
# Step 3: Auto-approve after Admin approval or 60% threshold met
# -------------------------------------------------------------------------
APPROVAL_SEQUENCE = {
    1: {"type": "manager", "description": "Direct Manager Approval"},
    2: {"type": "percentage_or_admin", "threshold": 60, "description": "Finance Group (60%) or Admin"},
    3: {"type": "final", "description": "Final Approval"}
}


def _get_pending_approvals_count(expense_id: str) -> list[dict]:
    """Get all approve actions for a given expense."""
    result = supabase.table("expense_approvals") \
        .select("*, users(role)") \
        .eq("expense_id", expense_id) \
        .eq("action", "approve") \
        .execute()
    return result.data or []


def _get_total_eligible_approvers(company_id: str, role: str = "Manager") -> int:
    """Get count of all approvers with a given role in the company."""
    result = supabase.table("users") \
        .select("id") \
        .eq("company_id", company_id) \
        .eq("role", role) \
        .execute()
    return len(result.data or [])


def _evaluate_step(expense: dict, approvals: list[dict], current_approver: dict) -> bool:
    """
    Returns True if the current step is satisfied and we can move to the next.
    
    Rules:
    - Step 1 (manager): Check if the required manager has approved.
    - Step 2+ (percentage_or_admin): 
        * If approver is Admin/CFO -> auto-satisfy immediately (Specific Approver Rule)
        * Else calculate percentage of approvers who have approved (Percentage Rule)
    """
    step = expense.get("approval_step", 1)
    rule = APPROVAL_SEQUENCE.get(step)
    if not rule:
        return True  # No more steps defined, approve

    rule_type = rule.get("type")

    if rule_type == "manager":
        # Satisfied when the current approver (manager) has approved
        return True  # We only call this after checking the action is 'approve'

    elif rule_type == "percentage_or_admin":
        # Specific Approver Rule: Admin approval auto-satisfies
        if current_approver.get("role") in ("Admin", "Manager"):
            return True

        # Percentage Rule: check if 60%+ of Managers in company have approved
        threshold = rule.get("threshold", 60)
        total = _get_total_eligible_approvers(expense["company_id"])
        if total == 0:
            return True
        approved_pct = (len(approvals) / total) * 100.0
        return approved_pct >= threshold

    elif rule_type == "final":
        return True

    return False


def process_approval(expense_id: str, current_user: dict, action: str, comment: str = "") -> dict:
    """
    Main workflow engine. Handles approve/reject actions.
    Returns the updated expense dict.
    """
    # 1. Fetch current expense
    expense_result = supabase.table("expenses").select("*").eq("id", expense_id).single().execute()
    expense = expense_result.data
    if not expense:
        raise ValueError("Expense not found")

    # 2. Guard: Only the current designated approver can act (unless Admin)
    if current_user.get("role") != "Admin":
        if expense.get("current_approver_id") and expense["current_approver_id"] != current_user["id"]:
            raise PermissionError("You are not the designated approver for this expense")

    # 3. Log the action in the audit table
    supabase.table("expense_approvals").insert({
        "expense_id": expense_id,
        "approver_id": current_user["id"],
        "action": action,
        "comment": comment,
        "step": expense.get("approval_step", 1)
    }).execute()

    # 4. Handle REJECT immediately
    if action == "reject":
        supabase.table("expenses").update({
            "status": "Rejected",
            "current_approver_id": None,
            "updated_at": "now()"
        }).eq("id", expense_id).execute()
        return {"status": "Rejected", "message": "Expense has been rejected."}

    # 5. Handle APPROVE: evaluate whether step is satisfied
    all_approvals = _get_pending_approvals_count(expense_id)
    step_satisfied = _evaluate_step(expense, all_approvals, current_user)

    current_step = expense.get("approval_step", 1)
    next_step = current_step + 1
    max_steps = len(APPROVAL_SEQUENCE)

    if step_satisfied and next_step > max_steps:
        # All steps complete → mark as Approved
        supabase.table("expenses").update({
            "status": "Approved",
            "current_approver_id": None,
            "updated_at": "now()"
        }).eq("id", expense_id).execute()
        return {"status": "Approved", "message": "Expense fully approved!"}

    elif step_satisfied:
        # Move to the next approval step
        # Determine next approver (simplified: look for next Manager in company)
        next_approvers = supabase.table("users") \
            .select("id") \
            .eq("company_id", expense["company_id"]) \
            .eq("role", "Manager") \
            .execute()
        next_approver_id = next_approvers.data[0]["id"] if next_approvers.data else None

        supabase.table("expenses").update({
            "approval_step": next_step,
            "current_approver_id": next_approver_id,
            "updated_at": "now()"
        }).eq("id", expense_id).execute()
        return {"status": "Pending", "message": f"Step {current_step} approved. Moved to step {next_step}."}

    else:
        # Step not yet satisfied (e.g., need more approvals for percentage rule)
        return {"status": "Pending", "message": "Approval recorded. Waiting for more approvers."}
