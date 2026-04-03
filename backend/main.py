from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from routers import requerimientos, ordenes, items, empresas, ocr, auth

app = FastAPI(title="Sistema de Requerimientos")

app.include_router(auth.router, prefix="/auth", tags=["Autenticación"])

# Permite que el frontend (React) se comunique con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requerimientos.router, prefix="/requerimientos", tags=["Requerimientos"])
app.include_router(ordenes.router,        prefix="/ordenes",        tags=["Órdenes"])
app.include_router(items.router,          prefix="/items",          tags=["Ítems"])
app.include_router(empresas.router,       prefix="/empresas",       tags=["Empresas"])
app.include_router(ocr.router, prefix="/ocr", tags=["OCR"])

_pdfs_dir = Path(__file__).resolve().parent.parent / "pdfs"
app.mount("/pdfs", StaticFiles(directory=str(_pdfs_dir)), name="pdfs")

@app.get("/")
def root():
    return {"mensaje": "Backend funcionando correctamente"}