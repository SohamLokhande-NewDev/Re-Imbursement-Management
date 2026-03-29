from app.core.database import supabase


def _log_action(expense_id: str, approver_id: str, action: str, comment: str, step: int):
    """Write an entry to the audit table."""
    supabase.table("expense_approvals").insert({
        "expense_id": expense_id,
        "approver_id": approver_id,
        "action": action,
        "comment": comment,
        "step": step
    }).execute()


def _mark_approved(expense_id: str):
    supabase.table("expenses").update({
        "status": "Approved",
        "current_approver_id": None,
    }).eq("id", expense_id).execute()


def _mark_rejected(expense_id: str):
    supabase.table("expenses").update({
        "status": "Rejected",
        "current_approver_id": None,
    }).eq("id", expense_id).execute()


def _find_admin(company_id: str) -> str | None:
    """Return the id of any Admin in the company."""
    result = supabase.table("users") \
        .select("id") \
        .eq("company_id", company_id) \
        .eq("role", "Admin") \
        .limit(1) \
        .execute()
    return result.data[0]["id"] if result.data else None


def process_approval(expense_id: str, current_user: dict, action: str, comment: str = "") -> dict:
    """
    2-Step Hierarchical Workflow Engine
    ====================================
    Step 1 — Manager (only when is_manager_approver=True):
        The expense is assigned to the employee's manager_id.
        On manager approval → advance to Step 2 (Admin).

    Step 2 — Admin:
        The expense is assigned to any Admin in the company.
        On Admin approval → RULE 1 fires → Approved immediately.

    RULE 1 (Priority): If the approving user is an Admin, approve the
        expense outright regardless of which step it is on.

    Rejection: Any approver at any step can reject, which ends the flow.
    """
    # ── 1. Fetch expense ──────────────────────────────────────────────────
    result = supabase.table("expenses").select("*").eq("id", expense_id).single().execute()
    expense = result.data
    if not expense:
        raise ValueError("Expense not found")

    current_step = expense.get("approval_step", 1)

    # ── 2. Auth guard (Admins can always act) ─────────────────────────────
    if current_user.get("role") != "Admin":
        if expense.get("current_approver_id") and expense["current_approver_id"] != current_user["id"]:
            raise PermissionError("You are not the designated approver for this expense")

    # ── 3. Audit log ──────────────────────────────────────────────────────
    _log_action(expense_id, current_user["id"], action, comment, current_step)

    # ── 4. REJECT — ends workflow immediately ─────────────────────────────
    if action == "reject":
        _mark_rejected(expense_id)
        return {"status": "Rejected", "message": "Expense has been rejected."}

    # ── 5. APPROVE ────────────────────────────────────────────────────────

    # RULE 1: Admin override — fully approve right now, no further steps
    if current_user.get("role") == "Admin":
        _mark_approved(expense_id)
        return {"status": "Approved", "message": "Expense fully approved by Admin."}

    # Manager approved Step 1 → advance to Step 2 (Admin)
    if current_step == 1:
        admin_id = _find_admin(expense["company_id"])
        supabase.table("expenses").update({
            "approval_step": 2,
            "current_approver_id": admin_id,
        }).eq("id", expense_id).execute()
        return {
            "status": "Pending",
            "message": "Manager approved. Escalated to Admin for final sign-off."
        }

    # Edge-case: step ≥ 2 and approver is NOT Admin (shouldn't normally happen)
    # Stay pending and wait for the Admin to act.
    return {"status": "Pending", "message": "Approval recorded. Awaiting Admin approval."}
