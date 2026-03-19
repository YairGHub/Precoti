@echo off
title Lanzador Zion Project 1
echo 🚀 Iniciando el sistema Zion Project 1...
echo ------------------------------------------

:: 1. Intentar activar el entorno virtual si existe
if exist .venv\Scripts\activate (
    echo [INFO] Entorno virtual detectado. Activando...
    set PYTHON_EXEC=call .\.venv\Scripts\activate &&
) else (
    echo [INFO] Usando Python del sistema (asegurate de haber corrido el pip install).
    set PYTHON_EXEC=
)

:: 2. Lanzar el Backend (FastAPI) en una ventana nueva
echo [INFO] Arrancando el servidor Backend...
start "Backend - FastAPI" cmd /k "%PYTHON_EXEC% cd backend && uvicorn main:app --reload"

:: 3. Esperar 3 segundos para que el backend cargue antes de abrir el navegador
timeout /t 3 /nobreak > nul

:: 4. Lanzar el Frontend (Servidor Web) y abrir el navegador automaticamente
echo [INFO] Levantando la interfaz en http://localhost:5500...
start "" http://localhost:5500
cd frontend
python -m http.server 5500

pause