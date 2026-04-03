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
    
@router.get("/metricas")
def obtener_metricas():
    with get_connection() as conn:
        cursor = conn.cursor()

        # ── KPIs básicos ──────────────────────────────────────────────
        cursor.execute("SELECT COUNT(*) FROM requerimientos WHERE de_baja = 0")
        total = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM requerimientos WHERE tiene_orden=1 AND de_baja=0")
        con_orden = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM requerimientos WHERE tiene_orden=0 AND de_baja=0")
        sin_orden = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM requerimientos WHERE de_baja=1")
        de_baja = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM requerimientos WHERE tipo='Propio' AND de_baja=0")
        propio_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM requerimientos WHERE tipo='Externo' AND de_baja=0")
        externo_count = cursor.fetchone()[0]
        cursor.execute("SELECT COALESCE(SUM(precio_total),0) FROM requerimientos WHERE de_baja=0")
        monto_total = cursor.fetchone()[0]

        # ── Estado de pagos ───────────────────────────────────────────
        cursor.execute("SELECT COUNT(*) FROM ordenes WHERE estado='Llegó pago'")
        pagados = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM ordenes WHERE estado='Espera pago'")
        espera_pago = cursor.fetchone()[0]
        cursor.execute("""
            SELECT COUNT(*) FROM ordenes o
            JOIN requerimientos r ON r.id = o.requerimiento_id
            WHERE o.pdf_factura_ruta IS NULL OR o.pdf_factura_ruta = ''
        """)
        sin_factura = cursor.fetchone()[0]
        cursor.execute("SELECT COALESCE(SUM(r.precio_total),0) FROM ordenes o JOIN requerimientos r ON r.id=o.requerimiento_id WHERE o.estado='Llegó pago'")
        monto_pagado = cursor.fetchone()[0]
        cursor.execute("SELECT COALESCE(SUM(r.precio_total),0) FROM ordenes o JOIN requerimientos r ON r.id=o.requerimiento_id WHERE o.estado='Espera pago'")
        monto_espera = cursor.fetchone()[0]

        # ── Tipo de orden OC / OS ─────────────────────────────────────
        cursor.execute("SELECT COUNT(*) FROM ordenes WHERE tipo_orden='OC'")
        oc_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM ordenes WHERE tipo_orden='OS'")
        os_count = cursor.fetchone()[0]

        # ── Activos sin orden (sin baja) ──────────────────────────────
        cursor.execute("SELECT COUNT(*) FROM requerimientos WHERE tiene_orden=0 AND de_baja=0")
        activos_sin_orden = cursor.fetchone()[0]

        # ── Monto por empresa (top 8) ─────────────────────────────────
        cursor.execute("""
            SELECT COALESCE(empresa_ganadora,'Sin empresa') AS empresa,
                   ROUND(SUM(precio_total),2) AS total
            FROM requerimientos
            WHERE de_baja=0 AND empresa_ganadora IS NOT NULL AND empresa_ganadora != ''
            GROUP BY empresa_ganadora
            ORDER BY total DESC
            LIMIT 8
        """)
        monto_por_empresa = [{"empresa": r["empresa"], "total": r["total"]} for r in cursor.fetchall()]

        # ── Evolución mensual año en curso ────────────────────────────
        cursor.execute("SELECT valor FROM config WHERE clave='año_actual'")
        row = cursor.fetchone()
        anio = row["valor"] if row else str(date.today().year)
        evolucion = []
        meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
        for m in range(1, 13):
            mes_str = f"{anio}-{m:02d}"
            cursor.execute("""
                SELECT COUNT(*) FROM requerimientos
                WHERE tipo='Propio' AND strftime('%Y-%m', fecha_registro) = ?
            """, (mes_str,))
            p = cursor.fetchone()[0]
            cursor.execute("""
                SELECT COUNT(*) FROM requerimientos
                WHERE tipo='Externo' AND strftime('%Y-%m', fecha_registro) = ?
            """, (mes_str,))
            e = cursor.fetchone()[0]
            evolucion.append({"mes": meses[m-1], "propio": p, "externo": e})

        # ── Reqs por área (top 9 + "Otras") ──────────────────────────
        cursor.execute("""
            SELECT COALESCE(area,'Sin área') AS area, COUNT(*) AS total
            FROM requerimientos WHERE de_baja=0
            GROUP BY area ORDER BY total DESC
        """)
        todas_areas = cursor.fetchall()
        por_area = [{"area": r["area"], "total": r["total"]} for r in todas_areas[:9]]
        if len(todas_areas) > 9:
            otras = sum(r["total"] for r in todas_areas[9:])
            por_area.append({"area": "Otras", "total": otras})

        # ── Estado agrupado propio/externo ────────────────────────────
        labels_estado = ['Con Orden','Sin Orden','De Baja','Espera Pago','Llegó Pago']
        def cnt(q, p): cursor.execute(q, p); return cursor.fetchone()[0]
        estado_propio = [
            cnt("SELECT COUNT(*) FROM requerimientos WHERE tiene_orden=1 AND de_baja=0 AND tipo=?",('Propio',)),
            cnt("SELECT COUNT(*) FROM requerimientos WHERE tiene_orden=0 AND de_baja=0 AND tipo=?",('Propio',)),
            cnt("SELECT COUNT(*) FROM requerimientos WHERE de_baja=1 AND tipo=?",('Propio',)),
            cnt("SELECT COUNT(*) FROM ordenes o JOIN requerimientos r ON r.id=o.requerimiento_id WHERE o.estado='Espera pago' AND r.tipo=?",('Propio',)),
            cnt("SELECT COUNT(*) FROM ordenes o JOIN requerimientos r ON r.id=o.requerimiento_id WHERE o.estado='Llegó pago' AND r.tipo=?",('Propio',)),
        ]
        estado_externo = [
            cnt("SELECT COUNT(*) FROM requerimientos WHERE tiene_orden=1 AND de_baja=0 AND tipo=?",('Externo',)),
            cnt("SELECT COUNT(*) FROM requerimientos WHERE tiene_orden=0 AND de_baja=0 AND tipo=?",('Externo',)),
            cnt("SELECT COUNT(*) FROM requerimientos WHERE de_baja=1 AND tipo=?",('Externo',)),
            cnt("SELECT COUNT(*) FROM ordenes o JOIN requerimientos r ON r.id=o.requerimiento_id WHERE o.estado='Espera pago' AND r.tipo=?",('Externo',)),
            cnt("SELECT COUNT(*) FROM ordenes o JOIN requerimientos r ON r.id=o.requerimiento_id WHERE o.estado='Llegó pago' AND r.tipo=?",('Externo',)),
        ]

        # ── Últimos 8 requerimientos ──────────────────────────────────
        cursor.execute("""
            SELECT r.id_req, r.fecha_registro, r.empresa_ganadora, r.tipo,
                   r.descripcion, r.precio_total, r.tiene_orden, r.de_baja,
                   o.tipo_orden, o.numero_orden, o.estado AS estado_pago
            FROM requerimientos r
            LEFT JOIN ordenes o ON o.requerimiento_id = r.id
            ORDER BY r.id DESC LIMIT 8
        """)
        ultimos = []
        for row in cursor.fetchall():
            estado = ('De baja' if row['de_baja']
                      else row['estado_pago'] if row['estado_pago']
                      else ('Sin orden' if not row['tiene_orden'] else 'Activo'))
            ultimos.append({
                "id_req": row["id_req"],
                "fecha_registro": row["fecha_registro"] or "—",
                "empresa": row["empresa_ganadora"] or "—",
                "tipo_req": row["tipo"] or "—",
                "descripcion": (row["descripcion"] or "")[:45] + ("…" if len(row["descripcion"] or "") > 45 else ""),
                "precio_total": round(row["precio_total"] or 0, 2),
                "tipo_orden": row["tipo_orden"] or "—",
                "numero_orden": row["numero_orden"] or "—",
                "estado": estado,
            })

        return {
            "total_reqs": total,
            "con_orden": con_orden,
            "sin_orden": sin_orden,
            "de_baja": de_baja,
            "propio_count": propio_count,
            "externo_count": externo_count,
            "monto_total": round(monto_total, 2),
            "pagados": pagados,
            "espera_pago": espera_pago,
            "sin_factura": sin_factura,
            "monto_pagado": round(monto_pagado, 2),
            "monto_espera": round(monto_espera, 2),
            "oc_count": oc_count,
            "os_count": os_count,
            "activos_sin_orden": activos_sin_orden,
            "monto_por_empresa": monto_por_empresa,
            "evolucion": evolucion,
            "por_area": por_area,
            "labels_estado": labels_estado,
            "estado_propio": estado_propio,
            "estado_externo": estado_externo,
            "ultimos": ultimos,
        }

@router.get("/buscar")
def buscar_requerimientos(q: str = ""):
    if not q or len(q.strip()) < 2:
        return []
    term = f"%{q.strip()}%"
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.id, r.id_req, r.descripcion, r.area, r.empresa_ganadora,
                   r.tipo, r.tiene_orden, r.de_baja, r.precio_total,
                   o.tipo_orden, o.numero_orden, o.codigo_siaf, o.estado
            FROM requerimientos r
            LEFT JOIN ordenes o ON o.requerimiento_id = r.id
            WHERE r.id_req          LIKE ? COLLATE NOCASE
               OR r.descripcion     LIKE ? COLLATE NOCASE
               OR r.empresa_ganadora LIKE ? COLLATE NOCASE
               OR r.numero_pedido   LIKE ? COLLATE NOCASE
               OR o.numero_orden    LIKE ? COLLATE NOCASE
               OR o.codigo_siaf     LIKE ? COLLATE NOCASE
            ORDER BY r.id DESC
            LIMIT 30
        """, (term, term, term, term, term, term))
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
                o.pdf_orden_ruta, o.pdf_factura_ruta, o.pdf_detalle_factura_ruta
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