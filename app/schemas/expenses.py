from pydantic import BaseModel
from datetime import date

class ExpenseBase(BaseModel):
    amount: float
    currency: str
    category: str
    description: str
    merchant_name: str
    expense_date: date

class ExpenseCreate(ExpenseBase):
    is_manager_approver: bool = False

class OCRExtractionResult(ExpenseBase):
    pass
