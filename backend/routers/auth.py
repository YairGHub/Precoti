from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
import hashlib
import sqlite3

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class CambiarPasswordRequest(BaseModel):
    username: str
    password_actual: str
    password_nueva: str

class EditarPerfilRequest(BaseModel):
    username_actual: str
    username_nuevo: str
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

@router.patch("/cambiar-password")
def cambiar_password(data: CambiarPasswordRequest):
    hash_actual = hashlib.sha256(data.password_actual.encode()).hexdigest()
    hash_nueva  = hashlib.sha256(data.password_nueva.encode()).hexdigest()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM usuarios WHERE username = ? AND password = ?",
            (data.username, hash_actual)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=401, detail="La contraseña actual es incorrecta")
        cursor.execute(
            "UPDATE usuarios SET password = ? WHERE username = ?",
            (hash_nueva, data.username)
        )
    return {"ok": True, "mensaje": "Contraseña actualizada correctamente"}

@router.patch("/editar-perfil")
def editar_perfil(data: EditarPerfilRequest):
    hash_pass = hashlib.sha256(data.password.encode()).hexdigest()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM usuarios WHERE username = ? AND password = ?",
            (data.username_actual, hash_pass)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")
        try:
            cursor.execute(
                "UPDATE usuarios SET username = ? WHERE username = ?",
                (data.username_nuevo, data.username_actual)
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Ese nombre de usuario ya existe")
    return {"ok": True, "mensaje": "Perfil actualizado"}