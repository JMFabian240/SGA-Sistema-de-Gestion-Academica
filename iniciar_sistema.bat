@echo off
echo ==================================================
echo      Iniciando Sistema de Gestion Academico
echo ==================================================
echo.

echo Iniciando Backend (Puerto 3001)...
start "SGA Backend" cmd /k "cd packages\back-end && npm run dev"

echo Iniciando Frontend (Puerto 5173)...
start "SGA Frontend" cmd /k "cd frontend-v2 && npm run dev"

echo.
echo Los servicios se estan ejecutando en ventanas separadas.
echo Puedes cerrar esta ventana.
