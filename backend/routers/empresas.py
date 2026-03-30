import sqlite3
from fastapi import APIRouter, HTTPException
from database import get_connection
from models import EmpresaCreate

router = APIRouter()

@router.get("/")
def listar_empresas(rubro: str = None):
    with get_connection() as conn:
        cursor = conn.cursor()
        if rubro:
            cursor.execute("SELECT * FROM empresas WHERE rubro = ?", (rubro,))
        else:
            cursor.execute("SELECT * FROM empresas ORDER BY desc_empresa")
        return [dict(r) for r in cursor.fetchall()]

@router.post("/")
def crear_empresa(data: EmpresaCreate):
    with get_connection() as conn:
        try:
            conn.execute("""
                INSERT INTO empresas (ruc, desc_empresa, rubro, correo)
                VALUES (?,?,?,?)
            """, (data.ruc, data.desc_empresa, data.rubro, data.correo))
            return {"mensaje": "Empresa registrada"}
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="El RUC ya existe")

@router.delete("/{ruc}")
def eliminar_empresa(ruc: str):
    with get_connection() as conn:
        conn.execute("DELETE FROM empresas WHERE ruc = ?", (ruc,))
        return {"mensaje": "Empresa eliminada"}