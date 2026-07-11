# SGA (Sistema de Gestión Académico)

Este es un monorepo para el Sistema de Gestión Académico "SGA".
Utiliza una arquitectura "Todo en Uno" con Tauri Sidecars para ser distribuido como un único instalable sin requerir Docker, Node.js ni PostgreSQL preinstalados en el equipo del usuario.

## Estructura de paquetes

- `@sga/front-end`: Interfaz de usuario (Vite + React + TypeScript).
- `@sga/back-end`: Servidor HTTP (Fastify + tRPC). Se compila como ejecutable independiente (sidecar).
- `@sga/data-access`: Acceso a datos (Prisma ORM). Único punto de conexión con la base de datos PostgreSQL.
- `@sga/app-tauri`: Contenedor de escritorio (Tauri). Orquesta PostgreSQL y el backend como sidecars.

## Requisitos para desarrollo

1. **Node.js** (v18+)
2. **Rust** y dependencias para Tauri (v2)
3. **Base de Datos (Dos Opciones para Desarrollo):**
   * **Opción A (Recomendada con Docker):** Debes tener Docker Desktop instalado.
   * **Opción B (Sidecars Locales):** Si no usas Docker, debes obtener los binarios de PostgreSQL para tu sistema operativo (`initdb`, `postgres`, `pg_ctl`) y colocarlos en la carpeta `packages/app-tauri/src-tauri/binaries/` con el nombre de tu target triplet de Rust (ej: `initdb-x86_64-pc-windows-msvc.exe`).

## Entorno de Desarrollo

El proyecto está preparado para convivir dinámicamente entre desarrolladores que usan Docker y aquellos que prefieren binarios locales.

1. **Configuración de Variables de Entorno:**
   Crea un archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```
   **¡Importante para la Base de Datos!** 
   * Si elegiste la **Opción A (Docker)**, agrega en tu terminal o en tu `.env` (si lo carga tu entorno) la variable `USE_DOCKER=true`. Esto le dirá a Tauri que ignore los binarios faltantes.
   * Si elegiste la **Opción B (Binarios)**, asegúrate de que `USE_DOCKER` esté en `false` o no exista.

2. **Levantar la Base de Datos (Si usas Docker):**
   ```bash
   docker-compose up -d
   ```

3. **Instalar dependencias y levantar la aplicación:**
   ```bash
   npm install
   npm run dev:tauri
   ```

## Compilación y Validación en Cascada

Este proyecto cuenta con un flujo de tipado y construcción en cascada. Al realizar modificaciones en el backend o en el esquema de base de datos, debes ejecutar la validación completa para comprobar que no se rompan las importaciones o el frontend:

```bash
npm run validate
```

### Flujo de Trabajo para Modificaciones
1. **Modificar Esquema**: Si cambias `packages/data-access/prisma/schema.prisma`, corre `npm run db:generate` para actualizar el cliente.
2. **Backend**: Ajusta la lógica en repositorios/servicios.
3. **Frontend**: tRPC propagará los tipos. Verifica errores de TypeScript corriendo `npm run validate`.
4. **Sidecar de Tauri**: Si modificas el backend y vas a compilar la app de Tauri, recuerda regenerar el binario ejecutable en el backend con:
   ```bash
   npm run build:sidecar --workspace=@sga/back-end
   ```

