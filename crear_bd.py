import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve()
DB_PATH = BASE_DIR / "base_de_datos" / "sistema.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("PRAGMA foreign_keys = ON")

# ── requerimientos (sin cambios) ───────────────────────
cursor.execute("""
CREATE TABLE IF NOT EXISTS requerimientos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    id_req           TEXT    UNIQUE NOT NULL,
    descripcion      TEXT    NOT NULL,
    plazo            TEXT,
    area             TEXT,
    fecha_req        TEXT,
    empresa_ganadora TEXT,
    numero_pedido    TEXT,
    referencia       TEXT,
    precio_total     REAL,
    tipo             TEXT NOT NULL CHECK(tipo IN ('Propio','Externo')),
    tiene_orden      INTEGER NOT NULL DEFAULT 0 CHECK(tiene_orden IN (0,1)),
    pdf_req_ruta     TEXT,
    fecha_registro   TEXT NOT NULL
)
""")

# ── ordenes (sin cambios) ──────────────────────────────
cursor.execute("""
CREATE TABLE IF NOT EXISTS ordenes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    requerimiento_id INTEGER NOT NULL UNIQUE,
    tipo_orden       TEXT NOT NULL CHECK(tipo_orden IN ('OS','OC')),
    numero_orden     TEXT NOT NULL,
    codigo_siaf      TEXT,
    estado           TEXT NOT NULL DEFAULT 'Espera pago'
                         CHECK(estado IN ('Espera pago','Llegó pago')),
    pdf_orden_ruta   TEXT,
    fecha_asignacion TEXT NOT NULL,
    fecha_pago       TEXT,
    FOREIGN KEY (requerimiento_id) REFERENCES requerimientos(id)
)
""")

# ── items_requerimiento (ACTUALIZADA) ──────────────────
cursor.execute("""
CREATE TABLE IF NOT EXISTS items_requerimiento (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    requerimiento_id    INTEGER NOT NULL,
    numero_item         INTEGER,
    cantidad            REAL,
    unidad_medida       TEXT,
    descripcion         TEXT,
    -- Empresa ganadora
    empresa_ganadora    TEXT,
    valor_unitario      REAL,
    igv                 REAL,
    precio              REAL,
    total_ganadora      REAL,
    -- Empresas perdedoras
    empresa_perdedora_1 TEXT,
    costo_perdedora_1   REAL,
    empresa_perdedora_2 TEXT,
    costo_perdedora_2   REAL,
    FOREIGN KEY (requerimiento_id) REFERENCES requerimientos(id)
)
""")

# ── empresas (NUEVA) ───────────────────────────────────
cursor.execute("""
CREATE TABLE IF NOT EXISTS empresas (
    ruc          TEXT PRIMARY KEY,
    desc_empresa TEXT NOT NULL,
    rubro        TEXT CHECK(rubro IN (
                     'Publicidad',
                     'Servicios generales',
                     'Alq. baños y muebles',
                     'Prendas y alimentos'
                 )),
    correo       TEXT
)
""")

# ── config (sin cambios) ───────────────────────────────
cursor.execute("""
CREATE TABLE IF NOT EXISTS config (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
)
""")

cursor.execute("""
INSERT OR IGNORE INTO config (clave, valor) VALUES
    ('ultimo_correlativo', '0'),
    ('año_actual', '2026')
""")

conn.commit()
conn.close()

print("✓ Tablas creadas: requerimientos, ordenes, items_requerimiento, empresas, config")
print("✓ Base de datos lista en:", DB_PATH)
