from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
import hashlib

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(data: LoginRequest):
    password_hash = hashlib.sha256(data.password.encode()).hexdigest()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, username FROM usuarios WHERE username = ? AND password = ?",
            (data.username, password_hash)
        )
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
        return {"ok": True, "id": user["id"], "username": user["username"]}