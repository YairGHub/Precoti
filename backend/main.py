from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import requerimientos, ordenes, items, empresas, ocr, auth

app = FastAPI(title="Sistema de Requerimientos")

app.include_router(auth.router, prefix="/auth", tags=["Autenticación"])

# Permite que el frontend (React) se comunique con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
                    "http://localhost:5173", # Puerto por defecto de React/Vite
                    "http://localhost:5500", # HTML directo con Python server
                    "http://127.0.0.1:5500", # Alternativa con 127.0.0.1
                   ],  
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requerimientos.router, prefix="/requerimientos", tags=["Requerimientos"])
app.include_router(ordenes.router,        prefix="/ordenes",        tags=["Órdenes"])
app.include_router(items.router,          prefix="/items",          tags=["Ítems"])
app.include_router(empresas.router,       prefix="/empresas",       tags=["Empresas"])
app.include_router(ocr.router, prefix="/ocr", tags=["OCR"])

@app.get("/")
def root():
    return {"mensaje": "Backend funcionando correctamente"}