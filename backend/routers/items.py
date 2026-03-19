from fastapi import APIRouter
from database import get_connection
from models import ItemCreate
import random

router = APIRouter()

def calcular_campos(precio: float, cantidad: float) -> dict:
    precio      = precio or 0
    cantidad    = cantidad or 0
    valor_unitario = round(precio / 1.18, 2)
    igv            = round(valor_unitario * 0.18, 2)
    total          = round(precio * cantidad, 2)
    # Perdedoras: total multiplicado por un factor aleatorio entre 1.05 y 1.08
    factor_1       = round(random.uniform(1.05, 1.08), 4)
    factor_2       = round(random.uniform(1.05, 1.08), 4)
    costo_perd_1   = round(total * factor_1, 2)
    costo_perd_2   = round(total * factor_2, 2)
    return {
        "valor_unitario":  valor_unitario,
        "igv":             igv,
        "precio":          precio,
        "total_ganadora":  total,
        "costo_perdedora_1": costo_perd_1,
        "costo_perdedora_2": costo_perd_2,
    }

@router.post("/")
def crear_items(items: list[ItemCreate]):
    with get_connection() as conn:
        cursor = conn.cursor()
        for item in items:
            calc = calcular_campos(item.precio or 0, item.cantidad or 0)
            cursor.execute("""
                INSERT INTO items_requerimiento
                    (requerimiento_id, numero_item, cantidad, unidad_medida,
                     descripcion, caracteristicas, empresa_ganadora,
                     valor_unitario, igv, precio, total_ganadora,
                     empresa_perdedora_1, costo_perdedora_1,
                     empresa_perdedora_2, costo_perdedora_2)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                item.requerimiento_id,
                item.numero_item,
                item.cantidad,
                item.unidad_medida,
                item.descripcion,
                item.caracteristicas,
                item.empresa_ganadora,
                calc["valor_unitario"],
                calc["igv"],
                calc["precio"],
                calc["total_ganadora"],
                item.empresa_perdedora_1,
                calc["costo_perdedora_1"],
                item.empresa_perdedora_2,
                calc["costo_perdedora_2"],
            ))
        return {"mensaje": f"{len(items)} ítem(s) guardados"}

@router.get("/{requerimiento_id}")
def listar_items(requerimiento_id: int):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM items_requerimiento WHERE requerimiento_id = ? ORDER BY numero_item",
            (requerimiento_id,)
        )
        return [dict(r) for r in cursor.fetchall()]