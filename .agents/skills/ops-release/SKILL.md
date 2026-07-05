---
name: ops-release
description: Usa esta skill cuando se te pida compilar, construir, empaquetar o lanzar la aplicación (build, tauri, sidecars, instaladores) o manejar versiones semánticas.
---
# Release Manager Skill

Gestiona la automatización del empaquetado de la aplicación de escritorio usando Tauri y Sidecars de Node.js.

## Construcción del Backend (Sidecar)
- Antes de compilar Tauri, el backend DEBE ser empaquetado con `pkg`.
- Ejecutar: `npm run build:sidecar` en el paquete `@sga/back-end`.
- Verificar que el archivo `back-x86_64-pc-windows-msvc.exe` se genere exitosamente en `app-tauri/src-tauri/binaries/`.

## Construcción del Frontend y Tauri
- El frontend debe compilarse con Vite (`tsc -b && vite build`) antes de armar el paquete Tauri.
- El build final para producción se hace ejecutando comandos Tauri.

## Versionado Semántico
- Cualquier cambio mayor en el release debe actualizar las versiones en `package.json` de cada paquete correspondiente y en `tauri.conf.json`.
