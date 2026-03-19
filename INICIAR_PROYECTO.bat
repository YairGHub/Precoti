@echo off
title Lanzador Zion Project 1
echo 🚀 Iniciando el sistema Zion Project 1...
echo ------------------------------------------

:: 1. Intentar activar el entorno virtual (si existe)
if exist ".venv\Scripts\activate" (
    echo [INFO] Entorno virtual detectado.
    set "ACTIVATE_CMD=call .\.venv\Scripts\activate &&"
) else (
    echo [INFO] Usando Python global.
    set "ACTIVATE_CMD="
)

:: 2. Lanzar el Backend (Usamos comillas dobles para la ruta del cd)
echo [INFO] Arrancando el servidor Backend...
start "Backend-FastAPI" cmd /k "%ACTIVATE_CMD% cd /d "%~dp0backend" && uvicorn main:app --reload"

:: 3. Esperar 3 segundos
timeout /t 3 /nobreak > nul

:: 4. Lanzar el Frontend y abrir el navegador
echo [INFO] Levantando la interfaz en http://localhost:5500...
start "" "http://localhost:5500"
cd /d "%~dp0frontend"
python -m http.server 5500

pause
