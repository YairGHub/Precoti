from pydantic import BaseModel
from typing import Optional

class RequerimientoCreate(BaseModel):
    descripcion:      str
    plazo:            Optional[str] = None
    area:             Optional[str] = None
    fecha_req:        Optional[str] = None
    empresa_ganadora: Optional[str] = None
    numero_pedido:    Optional[str] = None
    referencia:       Optional[str] = None
    precio_total:     Optional[float] = None
    tipo:             str  # 'Propio' o 'Externo'

class OrdenCreate(BaseModel):
    requerimiento_id: int
    tipo_orden:       str   # 'OS' o 'OC'
    numero_orden:     str
    codigo_siaf:      Optional[str] = None

class OrdenEstadoUpdate(BaseModel):
    estado: str  # 'Espera pago' o 'Llegó pago'

class ItemCreate(BaseModel):
    requerimiento_id:    int
    numero_item:         Optional[int]   = None
    cantidad:            Optional[float] = None
    unidad_medida:       Optional[str]   = None
    descripcion:         Optional[str]   = None
    caracteristicas:     Optional[str]   = None  # nuevo
    # Ingresados por el usuario
    empresa_ganadora:    Optional[str]   = None
    precio:              Optional[float] = None   # precio con IGV incluido
    empresa_perdedora_1: Optional[str]   = None
    empresa_perdedora_2: Optional[str]   = None

class EmpresaCreate(BaseModel):
    ruc:          str
    desc_empresa: str
    rubro:        Optional[str] = None
    correo:       Optional[str] = None