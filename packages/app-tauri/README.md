# @sga/app-tauri

Contenedor y orquestador de escritorio del SGA para Windows. Empaqueta el frontend React, el backend Fastify y PostgreSQL en un único instalable autónomo usando **Tauri v2 (Rust)**.

---

## Responsabilidades

1. **Presentación:** Renderiza `@sga/front-end` dentro de un WebView2 nativo de Windows.
2. **Orquestación de Sidecars:** Arranca PostgreSQL y el servidor backend (`@sga/back-end`) como procesos hijo (sidecars) al iniciar la aplicación, y los detiene de forma ordenada al cerrarla.
3. **Gestión de PostgreSQL Portable:** Inicializa el clúster de datos (`initdb`) en el primer arranque y mantiene el servidor activo durante la sesión.

---

## Sidecars Requeridos

Estos binarios deben colocarse en `src-tauri/binaries/` renombrados con el target triplet de Rust (`x86_64-pc-windows-msvc`):

| Binario | Descripción | Cómo obtenerlo |
|---|---|---|
| `sga-back-x86_64-pc-windows-msvc.exe` | Servidor Fastify compilado | `npm run build:sidecar --workspace=@sga/back-end` |
| `query_engine-windows.dll.node` | Motor de consultas de Prisma | `npm run db:generate` en `@sga/data-access` |
| `schema.prisma` | Esquema Prisma para runtime | Copiado automáticamente por el script de build |

> ⚠️ Estos binarios están en `.gitignore` por su peso. Se regeneran mediante los scripts de build.

---

## PostgreSQL Portable

Para que la aplicación sea 100% portable sin requerir instalación de PostgreSQL en el equipo del usuario:

1. Descarga los binarios de PostgreSQL 16 para Windows x64:
   ```
   https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64-binaries.zip
   ```
2. Descomprime el ZIP y coloca **todo su contenido** en la carpeta:
   ```
   packages/app-tauri/src-tauri/pgsql/
   ```
   > Esta carpeta está ignorada por Git (`packages/app-tauri/src-tauri/pgsql/` en `.gitignore`).

---

## Desarrollo

```bash
# Desde la raíz del monorepo:
npm run dev:tauri
```

Para compilar el instalable de producción:
```bash
npm run build:all
```
