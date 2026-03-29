from pydantic import BaseModel

class UserRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    company_name: str
    country: str

class UserLogin(BaseModel):
    email: str
    password: str
