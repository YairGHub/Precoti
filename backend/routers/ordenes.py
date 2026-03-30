from fastapi import APIRouter, HTTPException, UploadFile, File
from database import get_connection
from models import OrdenCreate, OrdenEstadoUpdate
from datetime import date
import os
from pathlib import Path

FACT_DIR = Path(__file__).resolve().parent.parent.parent 
FACTURAS_PATH = FACT_DIR / "pdfs" / "facturas"

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
                (requerimiento_id, tipo_orden, numero_orden,
                 codigo_siaf, fecha_orden, fecha_asignacion, pdf_orden_ruta)
            VALUES (?,?,?,?,?,?,?)
        """, (
            data.requerimiento_id,
            data.tipo_orden,
            data.numero_orden,
            data.codigo_siaf,
            data.fecha_orden,
            str(date.today()),
            data.pdf_orden_ruta,
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
async def cargar_factura(
    id: int,
    archivo: UploadFile = File(None),
    archivo_detalle: UploadFile = File(None)
):
    with get_connection() as conn:
        cursor = conn.cursor()

        # Obtener tipo y número de orden para nombrar los archivos
        cursor.execute(
            "SELECT tipo_orden, numero_orden FROM ordenes WHERE id = ?", (id,)
        )
        orden = cursor.fetchone()
        if not orden:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        tipo   = orden["tipo_orden"]    # OS o OC
        numero = orden["numero_orden"]  # 0011352

        actualizaciones = {}

        # Guardar factura si se envió
        if archivo and archivo.filename:
            if not archivo.filename.endswith(".pdf"):
                raise HTTPException(status_code=400, detail="La factura debe ser PDF")
            nombre_factura = f"factura_{tipo}_{numero}.pdf"
            ruta_factura   = os.path.join(FACTURAS_PATH, nombre_factura)
            contenido      = await archivo.read()
            with open(ruta_factura, "wb") as f:
                f.write(contenido)
            actualizaciones["pdf_factura_ruta"] = ruta_factura

        # Guardar detalle si se envió
        if archivo_detalle and archivo_detalle.filename:
            if not archivo_detalle.filename.endswith(".pdf"):
                raise HTTPException(status_code=400, detail="El detalle debe ser PDF")
            nombre_detalle = f"detalle_factura_{tipo}_{numero}.pdf"
            ruta_detalle   = os.path.join(FACTURAS_PATH, nombre_detalle)
            contenido_det  = await archivo_detalle.read()
            with open(ruta_detalle, "wb") as f:
                f.write(contenido_det)
            actualizaciones["pdf_detalle_factura_ruta"] = ruta_detalle

        if not actualizaciones:
            raise HTTPException(
                status_code=400,
                detail="Debes subir al menos un archivo"
            )

        # Actualizar solo los campos que se enviaron
        sets   = ", ".join([f"{k} = ?" for k in actualizaciones])
        valores = list(actualizaciones.values()) + [id]
        cursor.execute(f"UPDATE ordenes SET {sets} WHERE id = ?", valores)

        return {
            "mensaje":         "Archivos guardados correctamente",
            "factura":         actualizaciones.get("pdf_factura_ruta"),
            "detalle_factura": actualizaciones.get("pdf_detalle_factura_ruta"),
        }