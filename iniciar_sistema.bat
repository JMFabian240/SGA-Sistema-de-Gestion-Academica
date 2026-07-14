@echo off
echo ==================================================
echo      Iniciando Sistema de Gestion Academico
echo ==================================================
echo.

echo Iniciando Backend (Puerto 3001)...
start "SGA Backend" cmd /k "cd packages\back-end && npm run dev"

echo Iniciando Frontend (Puerto 5173)...
start "SGA Frontend" cmd /k "cd packages\front-end && npm run dev"

echo Iniciando Tunnel de Cloudflare (Puerto 5173)...
start "SGA Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:5173"

echo.
echo Los servicios y el tunnel se estan ejecutando en ventanas separadas.
echo Puedes cerrar esta ventana.

