from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core import config

app = FastAPI(title="Reimbursement Management API")

# Configure CORS for Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Reimbursement Management API"}
