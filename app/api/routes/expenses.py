from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Depends
from app.schemas.expenses import ExpenseCreate, OCRExtractionResult
from app.services.ocr import extract_receipt_data
from app.core.database import supabase
import json

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

async def get_current_user_details(authorization: str = Header(...)):
    # Very basic token split for this scaffolding phase
    try:
        token = authorization.replace("Bearer ", "")
        # In a real app, we'd verify with supabase.auth.get_user(token)
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        # Get custom user details (company_id)
        user_db = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        return user_db.data[0]
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.post("/extract")
async def extract_receipt(file: UploadFile = File(...)):
    try:
        content = await file.read()
        extracted_data = extract_receipt_data(content)
        return {"status": "success", "data": extracted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_expense(expense: ExpenseCreate, user: dict = Depends(get_current_user_details)):
    try:
        payload = {
            "employee_id": user["id"],
            "company_id": user["company_id"],
            "amount": expense.amount,
            "currency": expense.currency,
            "category": expense.category,
            "description": expense.description,
            "merchant_name": expense.merchant_name,
            "expense_date": str(expense.expense_date),
            "status": "Pending"
        }
        
        response = supabase.table("expenses").insert(payload).execute()
        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
