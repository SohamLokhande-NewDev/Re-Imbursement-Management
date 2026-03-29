from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import supabase

app = FastAPI(title="Reimbursement Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/test-db")
def test_db_connection():
    try:
        # Attempt to fetch from companies table to test connection
        response = supabase.table("companies").select("*").limit(1).execute()
        return {"status": "success", "message": "Connected to Supabase!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
