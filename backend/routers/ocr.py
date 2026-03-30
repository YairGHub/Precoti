from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from database import get_connection
import requests
import base64
import json
import re
import random
from datetime import date
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

ORDERS_DIR = Path(__file__).resolve().parent.parent.parent 
ORDERS_PATH = ORDERS_DIR / "pdfs" / "ordenes"


router = APIRouter()

API_KEY = os.getenv("GEMINI_API_KEY")
MODELO  = "gemini-2.5-flash"
URL     = f"https://generativelanguage.googleapis.com/v1/models/{MODELO}:generateContent?key={API_KEY}"

PROMPT_REQ = """Extrae los datos de este TDR en formato JSON. 
Campos: organo_unidad, denominacion, items (lista con item, cantidad, 
unidad_de_medida, descripcion, caracteristicas (como una lista de strings)), 
plazo (extrae solo el número, unidad y tipo de plazo de la sección 3. 
de las características y condiciones del servicio, 
por ejemplo '15 días calendario').
Devuelve SOLO el JSON, sin texto adicional, sin bloques markdown."""


def llamar_gemini(pdf_base64: str) -> dict:
    payload = {
        "contents": [{
            "parts": [
                {"text": PROMPT_REQ},
                {
                    "inline_data": {
                        "mime_type": "application/pdf",
                        "data": pdf_base64
                    }
                }
            ]
        }],
        "generationConfig": {}
    }
    headers  = {"Content-Type": "application/json"}
    response = requests.post(URL, headers=headers, json=payload)

    # Log temporal para diagnosticar
    print(f"Status Gemini: {response.status_code}")
    print(f"Respuesta Gemini: {response.text[:500]}")

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Error de Gemini: {response.status_code} - {response.text}"
        )

    texto = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    json_match   = re.search(r"```json\n([\s\S]*?)\n```", texto)
    texto_limpio = json_match.group(1) if json_match else texto

    try:
        return json.loads(texto_limpio)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Gemini no devolvió un JSON válido")


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


def calcular_campos(precio: float, cantidad: float) -> dict:
    precio         = precio or 0
    cantidad       = cantidad or 0
    valor_unitario = round(precio / 1.18, 2)
    igv            = round(valor_unitario * 0.18, 2)
    total          = round(precio * cantidad, 2)
    factor_1       = round(random.uniform(1.05, 1.08), 4)
    factor_2       = round(random.uniform(1.05, 1.08), 4)
    return {
        "valor_unitario":    valor_unitario,
        "igv":               igv,
        "precio":            precio,
        "total_ganadora":    total,
        "costo_perdedora_1": round(total * factor_1, 2),
        "costo_perdedora_2": round(total * factor_2, 2),
    }

PROMPT_ORDEN = """Eres un asistente especializado en leer Órdenes de Servicio y Órdenes de Compra 
del Sistema Integrado de Gestión Administrativa (SIGA) del Perú.

Analiza la cabecera de este documento y extrae exactamente estos campos:

- tipo_orden: puede ser "OS" si dice "ORDEN DE SERVICIO" o "OC" si dice "ORDEN DE COMPRA"
- numero_orden: el número completo que aparece junto a "ORDEN DE SERVICIO Nº" u "ORDEN DE COMPRA Nº", 
  incluyendo todos los ceros (ejemplo: 0012740)
- codigo_siaf: el número completo que aparece junto a "Nº Exp. SIAF" o "N° Exp. SIAF", 
  incluyendo todos los ceros (ejemplo: 0000014735)
- fecha_orden: la fecha en formato DD/MM/YYYY tomada de los campos Dia, Mes, Año de la cabecera

Devuelve ÚNICAMENTE un objeto JSON válido sin texto adicional ni markdown:
{
  "tipo_orden": "OS o OC",
  "numero_orden": "string con ceros incluidos",
  "codigo_siaf": "string con ceros incluidos",
  "fecha_orden": "DD/MM/YYYY"
}

Si algún campo no es legible, usa null."""


def llamar_gemini_orden(pdf_base64: str) -> dict:
    payload = {
        "contents": [{
            "parts": [
                {"text": PROMPT_ORDEN},
                {
                    "inline_data": {
                        "mime_type": "application/pdf",
                        "data": pdf_base64
                    }
                }
            ]
        }],
        "generationConfig": {}
    }

    headers  = {"Content-Type": "application/json"}
    response = requests.post(URL, headers=headers, json=payload)

    print(f"Status Gemini Orden: {response.status_code}")
    print(f"Respuesta Gemini Orden: {response.text[:300]}")

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Error Gemini {response.status_code}: {response.text[:200]}"
        )

    texto = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    json_match   = re.search(r"```json\n([\s\S]*?)\n```", texto)
    texto_limpio = json_match.group(1) if json_match else texto

    try:
        return json.loads(texto_limpio)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Gemini no pudo leer la orden")


@router.post("/leer-orden")
async def leer_orden(archivo: UploadFile = File(...)):
    if not archivo.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")
    contenido  = await archivo.read()
    pdf_base64 = base64.b64encode(contenido).decode("utf-8")
    return llamar_gemini_orden(pdf_base64)

# ── Endpoint 1: solo lectura, devuelve el JSON sin guardar ──────────────────
@router.post("/leer-requerimiento")
async def leer_requerimiento(archivo: UploadFile = File(...)):
    if not archivo.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")
    contenido  = await archivo.read()
    pdf_base64 = base64.b64encode(contenido).decode("utf-8")
    
    return llamar_gemini(pdf_base64)

# ── Endpoint 2: lee el PDF, crea requerimiento e ítems en una sola llamada ──
@router.post("/procesar-requerimiento")
async def procesar_requerimiento(
    archivo: UploadFile = File(...),
    tipo: str = "Propio"   # el usuario indica Propio o Externo al subir
):
    if not archivo.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    # PASO 1: leer el PDF con Gemini
    contenido  = await archivo.read()
    pdf_base64 = base64.b64encode(contenido).decode("utf-8")
    datos      = llamar_gemini(pdf_base64)

    # PASO 2: guardar en la BD
    with get_connection() as conn:
        cursor = conn.cursor()

        # Crear el requerimiento con los campos del JSON
        id_req = generar_id_req(cursor)
        cursor.execute("""
            INSERT INTO requerimientos
                (id_req, descripcion, plazo, area, fecha_req,
                 precio_total, tipo, fecha_registro)
            VALUES (?,?,?,?,?,?,?,?)
        """, (
            id_req,
            datos.get("denominacion"),       # descripcion  ← denominacion
            datos.get("plazo"),              # plazo        ← plazo
            datos.get("organo_unidad"),      # area         ← organo_unidad
            str(date.today()),               # fecha_req    ← fecha actual
            None,                            # precio_total ← se calculará al guardar ítems
            tipo,
            str(date.today()),
        ))
        requerimiento_id = cursor.lastrowid

        # Crear los ítems — precio en 0 hasta que el usuario lo complete
        items_guardados = []
        for it in datos.get("items", []):
            caract = it.get("caracteristicas", [])
            if isinstance(caract, list):
                caract = " | ".join(caract)

            calc = calcular_campos(0, it.get("cantidad", 0))

            cursor.execute("""
                INSERT INTO items_requerimiento
                    (requerimiento_id, numero_item, cantidad, unidad_medida,
                    descripcion, caracteristicas, empresa_ganadora,
                    valor_unitario, igv, precio, total_ganadora,
                    empresa_perdedora_1, costo_perdedora_1,
                    empresa_perdedora_2, costo_perdedora_2)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                requerimiento_id,
                it.get("item"),
                it.get("cantidad"),
                it.get("unidad_de_medida"),
                it.get("descripcion"),
                caract,
                None, 0, 0, 0, 0, None, 0, None, 0,
            ))

            item_id = cursor.lastrowid  # ← captura el id real

            items_guardados.append({
                "id":            item_id,          # ← agrega el id real
                "numero_item":   it.get("item"),
                "cantidad":      it.get("cantidad"),
                "unidad_medida": it.get("unidad_de_medida"),
                "descripcion":   it.get("descripcion"),
                "caracteristicas": caract,
            })

    # PASO 3: devolver todo al frontend para mostrar el formulario prellenado
    return {
        "id_req":           id_req,
        "requerimiento_id": requerimiento_id,
        "descripcion":      datos.get("denominacion"),
        "plazo":            datos.get("plazo"),
        "area":             datos.get("organo_unidad"),
        "fecha_req":        str(date.today()),
        "tipo":             tipo,
        "items":            items_guardados,
        "mensaje":          "Requerimiento e ítems creados. Completa empresa y precios."
    }


# Al final de ocr.py
from pydantic import BaseModel
from typing import Optional

class ItemUpdate(BaseModel):
    empresa_ganadora:    Optional[str]   = None
    precio:              Optional[float] = None
    empresa_perdedora_1: Optional[str]   = None
    empresa_perdedora_2: Optional[str]   = None
    costo_perdedora_1:   Optional[float] = None  
    costo_perdedora_2:   Optional[float] = None

@router.patch("/actualizar-item/{item_id}")
def actualizar_item(item_id: int, data: ItemUpdate):
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT cantidad, requerimiento_id FROM items_requerimiento WHERE id = ?",
            (item_id,)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ítem no encontrado")

        cantidad         = row["cantidad"]
        requerimiento_id = row["requerimiento_id"]

        # Calcular campos de ganadora
        precio         = data.precio or 0
        valor_unitario = round(precio / 1.18, 2) if precio > 0 else 0
        igv            = round(valor_unitario * 0.18, 2)
        total_ganadora = round(precio * cantidad, 2)

        # Usar costos manuales si se enviaron, si no calcular
        costo_p1 = data.costo_perdedora_1 if data.costo_perdedora_1 is not None \
                   else round(total_ganadora * 1.06, 2)
        costo_p2 = data.costo_perdedora_2 if data.costo_perdedora_2 is not None \
                   else round(total_ganadora * 1.07, 2)

        cursor.execute("""
            UPDATE items_requerimiento SET
                empresa_ganadora    = ?,
                precio              = ?,
                valor_unitario      = ?,
                igv                 = ?,
                total_ganadora      = ?,
                empresa_perdedora_1 = ?,
                costo_perdedora_1   = ?,
                empresa_perdedora_2 = ?,
                costo_perdedora_2   = ?
            WHERE id = ?
        """, (
            data.empresa_ganadora,
            precio,
            valor_unitario,
            igv,
            total_ganadora,
            data.empresa_perdedora_1,
            costo_p1,
            data.empresa_perdedora_2,
            costo_p2,
            item_id,
        ))

        # Recalcular precio_total y empresa_ganadora del requerimiento
        cursor.execute("""
            SELECT COALESCE(SUM(total_ganadora), 0) AS total,
                   MAX(empresa_ganadora)             AS empresa
            FROM items_requerimiento
            WHERE requerimiento_id = ?
        """, (requerimiento_id,))
        resumen = cursor.fetchone()

        cursor.execute("""
            UPDATE requerimientos
            SET precio_total     = ?,
                empresa_ganadora = ?
            WHERE id = ?
        """, (resumen["total"], resumen["empresa"], requerimiento_id))

        return {
            "mensaje":          "Ítem actualizado",
            "total_ganadora":   total_ganadora,
            "costo_p1":         costo_p1,
            "costo_p2":         costo_p2,
            "precio_total_req": resumen["total"],
        }

@router.post("/subir-pdf-orden")
async def subir_pdf_orden(
    archivo:          UploadFile = File(...),
    requerimiento_id: int        = Form(0),
    tipo_orden:       str        = Form("OS"),
    numero_orden:     str        = Form("0"),
):
    if not archivo.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan PDFs")

    # Obtener id_req para el nombre estructurado
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id_req FROM requerimientos WHERE id = ?", (requerimiento_id,)
        ).fetchone()
    id_req = row["id_req"] if row else str(requerimiento_id)

    # Formato: OS-0012740_REQ-2026-0043.pdf
    nombre = f"{tipo_orden}-{numero_orden}_{id_req}.pdf"
    ruta   = os.path.join(ORDERS_PATH, nombre)

    contenido = await archivo.read()
    with open(ruta, "wb") as f:
        f.write(contenido)

    return {"mensaje": "PDF guardado", "ruta": str(ruta), "nombre": nombre}


@router.post("/guardar-pdf-req")
async def guardar_pdf_req(
    archivo:          UploadFile = File(...),
    requerimiento_id: int        = Form(...),
    id_req:           str        = Form(...),
):
    if not archivo.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan PDFs")

    REQS_PATH = Path(__file__).resolve().parent.parent.parent / "pdfs" / "requerimientos"
    nombre = f"requerimiento_{id_req}.pdf"
    ruta   = os.path.join(REQS_PATH, nombre)

    contenido = await archivo.read()
    with open(ruta, "wb") as f:
        f.write(contenido)

    with get_connection() as conn:
        conn.execute(
            "UPDATE requerimientos SET pdf_req_ruta = ? WHERE id = ?",
            (str(ruta), requerimiento_id)
        )

    return {"mensaje": "PDF de requerimiento guardado", "ruta": str(ruta)}