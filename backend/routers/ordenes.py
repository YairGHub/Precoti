from fastapi import APIRouter, HTTPException, UploadFile, File
from database import get_connection
from models import OrdenCreate, OrdenEstadoUpdate
from datetime import date
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent   
FACTURAS_PATH = BASE_DIR / os.getenv("FACTURAS_PATH", "pdfs/facturas")

router = APIRouter()

@router.post("/")
def asignar_orden(data: OrdenCreate):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM requerimientos WHERE id = ?", (data.requerimiento_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
        cursor.execute("""
            INSERT INTO ordenes
                (requerimiento_id, tipo_orden, numero_orden, codigo_siaf, fecha_asignacion)
            VALUES (?,?,?,?,?)
        """, (
            data.requerimiento_id, data.tipo_orden,
            data.numero_orden, data.codigo_siaf, str(date.today())
        ))
        cursor.execute(
            "UPDATE requerimientos SET tiene_orden = 1 WHERE id = ?",
            (data.requerimiento_id,)
        )
        return {"mensaje": "Orden asignada correctamente"}

@router.patch("/{id}/estado")
def actualizar_estado(id: int, data: OrdenEstadoUpdate):
    with get_connection() as conn:
        cursor = conn.cursor()
        fecha_pago = str(date.today()) if data.estado == "Llegó pago" else None
        cursor.execute(
            "UPDATE ordenes SET estado = ?, fecha_pago = ? WHERE id = ?",
            (data.estado, fecha_pago, id)
        )
        return {"mensaje": "Estado actualizado"}
    
@router.post("/{id}/cargar-factura")
async def cargar_factura(id: int, archivo: UploadFile = File(...)):
    """Recibe el PDF de la factura y lo guarda en disco."""
    if not archivo.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    nombre   = f"factura_orden_{id}.pdf"
    ruta     = os.path.join(FACTURAS_PATH, nombre)

    contenido = await archivo.read()
    with open(ruta, "wb") as f:
        f.write(contenido)

    with get_connection() as conn:
        conn.execute(
            "UPDATE ordenes SET pdf_factura_ruta = ? WHERE id = ?",
            (ruta, id)
        )

    return {"mensaje": "Factura guardada correctamente", "ruta": ruta}