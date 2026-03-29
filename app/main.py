import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import supabase
from app.core.config import settings
from app.api.routes import auth, expenses, approvals, users

# Initialize Gemini
genai.configure(api_key=settings.API_KEY)

app = FastAPI(title="Reimbursement Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(approvals.router)
app.include_router(users.router)

@app.get("/api/test-db")
def test_db_connection():
    try:
        response = supabase.table("companies").select("*").limit(1).execute()
        return {"status": "success", "message": "Connected to Supabase!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@app.get("/api/test-gemini")
def test_gemini():
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content("Return the word SUCCESS")
        return {"status": "success", "data": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini test failed: {str(e)}")
