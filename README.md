# SGA — Sistema de Gestión Académica
### Colegio San Diego

Sistema de administración escolar **offline-first** distribuido como una aplicación de escritorio autónoma (sin requerir Docker, Node.js ni PostgreSQL preinstalados en el equipo). Opera en red LAN del colegio mediante una arquitectura **Todo-en-Uno** orquestada por Tauri.

---

## 🗂️ Estructura del Monorepo

El código se organiza en `packages/*` bajo NPM Workspaces:

| Paquete | Descripción |
|---|---|
| `@sga/app-tauri` | Contenedor de escritorio (Tauri + Rust). Orquesta PostgreSQL y el backend como sidecars. |
| `@sga/back-end` | Servidor HTTP (Fastify + tRPC + Zod). Compilado como ejecutable independiente (sidecar). |
| `@sga/data-access` | Única fuente de verdad de la BD. Contiene `schema.prisma`, migraciones y el Singleton de Prisma Client. |
| `@sga/front-end` | Capa de UI (React 18 + Vite 8 + Tailwind CSS v4 + tRPC Client). |
| `@sga/e2e` | Pruebas de integración end-to-end con Playwright. |

> **Documentación técnica detallada:** Consulta [`docs/architecture/`](./docs/architecture/) para la especificación profunda de cada capa.

---

## 📋 Requisitos para Desarrollo

1. **Node.js** v18+ y **npm** v10+
2. **Rust** y dependencias para Tauri v2 (`cargo`, `rustup`)
3. **Base de datos (dos opciones):**
   - **Opción A — Docker (recomendada para desarrollo):** Instala Docker Desktop. El `docker-compose.yml` en la raíz levanta PostgreSQL automáticamente.
   - **Opción B — Binarios portátiles:** Coloca los binarios de PostgreSQL 16 en `packages/app-tauri/src-tauri/pgsql/` y `packages/app-tauri/src-tauri/binaries/` según las instrucciones del [README de app-tauri](./packages/app-tauri/README.md).

---

## 🚀 Inicio Rápido (Desarrollo)

### 1. Clonar y configurar variables de entorno
```bash
git clone <url-del-repo>
cd sga
cp .env.example .env
# Editar .env con las credenciales de la base de datos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Levantar la base de datos
```bash
# Opción A (Docker):
docker-compose up -d

# Opción B (binarios portátiles):
# Asegúrate de tener los binarios en src-tauri/binaries/
```

### 4. Ejecutar migraciones y generar el cliente Prisma
```bash
npm run db:migrate
npm run db:generate
```

### 5. Iniciar el servidor de desarrollo
```bash
# Solo backend + frontend (sin Tauri):
npm run dev

# Con Tauri (ventana de escritorio):
npm run dev:tauri
```

---

## 🛠️ Scripts Principales

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia backend + frontend en modo desarrollo |
| `npm run dev:tauri` | Inicia la app completa con ventana de escritorio Tauri |
| `npm run validate` | Valida la cadena completa: genera Prisma → compila backend → compila frontend |
| `npm run db:generate` | Regenera el cliente Prisma después de cambios en `schema.prisma` |
| `npm run db:migrate` | Aplica las migraciones pendientes a la base de datos |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar la BD |
| `npm run test:e2e` | Ejecuta las pruebas E2E con Playwright |

---

## 🔄 Flujo de Trabajo para Modificaciones

```
1. Cambiar schema.prisma
       │
       ▼
2. npm run db:generate  (regenera el Prisma Client)
       │
       ▼
3. Ajustar repositorios / servicios en @sga/back-end
       │
       ▼
4. El cliente tRPC propaga los tipos al frontend automáticamente
       │
       ▼
5. npm run validate  (compila todo y verifica errores de TypeScript)
       │
       ▼
6. (Si vas a compilar Tauri) npm run build:sidecar --workspace=@sga/back-end
```

---

## 📁 Estructura de Documentación

```
docs/
├── architecture/       # Especificaciones técnicas profundas por capa
│   ├── backend-architecture.md
│   ├── database-architecture.md
│   └── frontend-architecture.md
├── design/             # Mockups, diagramas y casos de uso
├── test-plans/         # Planes y scripts de pruebas
└── resources/          # Plantillas, datos y materiales de referencia
spec/
└── spec.md             # Especificación general del proyecto (fuente de verdad)
```
