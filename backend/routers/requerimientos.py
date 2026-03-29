from fastapi import APIRouter, HTTPException
from database import get_connection
from models import RequerimientoCreate
from datetime import date, datetime

router = APIRouter()

def generar_id_req(cursor) -> str:
    cursor.execute("SELECT valor FROM config WHERE clave = 'ultimo_correlativo'")
    correlativo = int(cursor.fetchone()["valor"]) + 1
    cursor.execute("SELECT valor FROM config WHERE clave = 'año_actual'")
    año = cursor.fetchone()["valor"]
    cursor.execute(
        "UPDATE config SET valor = ? WHERE clave = 'ultimo_correlativo'",
        (str(correlativo),)
    )
    return f"REQ-{año}-{correlativo:04d}"

@router.get("/")
def listar_requerimientos(tipo: str = None, tiene_orden: int = None):
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM requerimientos WHERE 1=1"
        params = []
        if tipo:
            query += " AND tipo = ?"
            params.append(tipo)
        if tiene_orden is not None:
            query += " AND tiene_orden = ?"
            params.append(tiene_orden)
        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        return [dict(r) for r in cursor.fetchall()]
    
@router.get("/con-orden")
def listar_con_orden(tipo: str = None):
    """
    Devuelve requerimientos con orden asignada,
    incluyendo datos de la tabla ordenes (JOIN).
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT
                r.id, r.id_req, r.descripcion, r.plazo, r.area,
                r.empresa_ganadora, r.numero_pedido, r.referencia,
                r.precio_total, r.tipo, r.fecha_req, r.fecha_registro,
                o.id         AS orden_id,
                o.tipo_orden, o.numero_orden, o.codigo_siaf,
                o.estado,    o.fecha_asignacion, o.fecha_orden,  o.fecha_pago,
                o.pdf_orden_ruta, o.pdf_factura_ruta
            FROM requerimientos r
            JOIN ordenes o ON o.requerimiento_id = r.id
            WHERE r.tiene_orden = 1
        """
        params = []
        if tipo:
            query += " AND r.tipo = ?"
            params.append(tipo)
        query += " ORDER BY r.id DESC"
        cursor.execute(query, params)
        return [dict(r) for r in cursor.fetchall()]

@router.post("/revisar-bajas")
def revisar_bajas():
    """
    Marca como de_baja=1 todos los requerimientos sin orden
    cuya fecha_registro supere los dias_limite configurados.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE requerimientos
            SET de_baja = 1
            WHERE tiene_orden = 0
              AND de_baja = 0
              AND julianday('now') - julianday(fecha_registro) > dias_limite
        """)
        afectados = cursor.rowcount
        return {"mensaje": f"{afectados} requerimiento(s) marcados de baja"}
    
@router.get("/{id_req}")
def obtener_requerimiento(id_req: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM requerimientos WHERE id_req = ?", (id_req,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
        return dict(row)

@router.post("/")
def crear_requerimiento(data: RequerimientoCreate):
    with get_connection() as conn:
        cursor = conn.cursor()
        id_req = generar_id_req(cursor)
        cursor.execute("""
            INSERT INTO requerimientos
                (id_req, descripcion, plazo, area, fecha_req, empresa_ganadora,
                 numero_pedido, referencia, precio_total, tipo, fecha_registro)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (
            id_req, data.descripcion, data.plazo, data.area, data.fecha_req,
            data.empresa_ganadora, data.numero_pedido, data.referencia,
            data.precio_total, data.tipo, str(date.today())
        ))
        return {"id": cursor.lastrowid, "id_req": id_req, "mensaje": "Requerimiento creado"}

@router.delete("/{id}")
def eliminar_requerimiento(id: int):
    with get_connection() as conn:
        conn.execute("DELETE FROM requerimientos WHERE id = ?", (id,))
        return {"mensaje": "Requerimiento eliminado"}

@router.patch("/{id}/dias-limite")
def actualizar_dias_limite(id: int, dias: int):
    """Permite configurar los días límite antes de marcar de baja."""
    with get_connection() as conn:
        conn.execute(
            "UPDATE requerimientos SET dias_limite = ? WHERE id = ?",
            (dias, id)
        )
        return {"mensaje": f"Días límite actualizados a {dias}"}

from pydantic import BaseModel
from typing import Optional

class RequerimientoDatosUpdate(BaseModel):
    numero_pedido: Optional[str] = None
    referencia:    Optional[str] = None
    descripcion:   Optional[str] = None
    plazo:         Optional[str] = None
    area:          Optional[str] = None

@router.patch("/{id}/datos")
def actualizar_datos(id: int, data: RequerimientoDatosUpdate):
    with get_connection() as conn:
        conn.execute("""
            UPDATE requerimientos SET
                numero_pedido = COALESCE(?, numero_pedido),
                referencia    = COALESCE(?, referencia),
                descripcion   = COALESCE(?, descripcion),
                plazo         = COALESCE(?, plazo),
                area          = COALESCE(?, area)
            WHERE id = ?
        """, (
            data.numero_pedido, data.referencia,
            data.descripcion, data.plazo,
            data.area, id
        ))
        return {"mensaje": "Datos actualizados"}
    
@router.patch("/{id}/dar-baja")
def dar_baja_manual(id: int):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, de_baja FROM requerimientos WHERE id = ?", (id,)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
        if row["de_baja"]:
            raise HTTPException(status_code=400, detail="Ya está de baja")
        conn.execute(
            "UPDATE requerimientos SET de_baja = 1 WHERE id = ?", (id,)
        )
        return {"mensaje": "Requerimiento dado de baja correctamente"}