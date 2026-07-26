# @sga/front-end

Capa de interfaz de usuario del Sistema de Gestión Académica del Colegio San Diego. SPA (Single Page Application) construida con React 18 y Vite 8, conectada de forma **tipada end-to-end** al backend mediante tRPC.

> **Especificación Visual y de Arquitectura:** Para el desglose completo de los 8 módulos, la gestión dual de estado, el enrutamiento protegido RBAC y las herramientas institucionales (PDFs, recibos, QR), consulta [`docs/architecture/frontend-architecture.md`](../../docs/architecture/frontend-architecture.md).

---

## Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **React 18.3** + **TypeScript 6** | Núcleo de la UI |
| **Vite 8.1** | Servidor de desarrollo y bundler de producción |
| **Tailwind CSS v4** | Diseño y estilos |
| **Lucide React** | Iconografía |
| **tRPC Client** (`@trpc/react-query`) | Comunicación con el backend, tipada end-to-end |
| **TanStack Query v4** | Caché y sincronización del estado del servidor |
| **Zustand** | Estado global del cliente (sesión, permisos) |
| **React Router DOM v7** | Enrutamiento y rutas protegidas por rol |
| **React Hook Form** + **Zod** | Formularios validados con los mismos esquemas del backend |
| **Recharts** | Gráficas del dashboard de cobranza |
| **react-to-print** | Impresión directa de recibos de caja |
| **html2pdf.js** | Exportación de boletas y Kardex a PDF |
| **qrcode.react** | Códigos QR en comprobantes de pago |

---

## Arquitectura Modular

El código se organiza por dominio de negocio en `src/modules/`, reflejando los módulos del backend:

```
src/
├── components/         # Componentes UI globales compartidos (Button, Modal, Table…)
│   ├── layout/         # Sidebar, Layout principal y AuthLayout
│   └── ui/             # Primitivos de interfaz (Badge, Input, Spinner…)
├── lib/                # Configuración del cliente tRPC
├── modules/            # Módulos por dominio (cada uno con components/, hooks/, pages/)
│   ├── alumnos/        # Expediente, alta, inscripción, ciclo de vida escolar
│   ├── auth/           # Login y recuperación de acceso
│   ├── configuracion/  # Parámetros del colegio, ciclos y planes de pago
│   ├── dashboard/      # KPIs, métricas y gráficas de cobranza
│   ├── grupos/         # Asignación de grados, materias y docentes
│   ├── pagos/          # Caja unificada, recibos, convenios y morosidad
│   ├── tutores/        # Estado de cuenta familiar y datos fiscales
│   └── usuarios/       # Cuentas y roles del personal operativo
├── router/             # Árbol de rutas y ProtectedRoute (RBAC)
├── store/              # useAuthStore (Zustand): sesión, token y permisos
├── types/              # Tipos globales compartidos
└── utils/              # Utilidades (ej. validación de CURP)
```

---

## Inicio Rápido

Asegúrate de que `@sga/back-end` esté corriendo antes de iniciar el frontend.

```bash
# Desde la raíz del monorepo:
npm run dev:front-end

# Solo este paquete:
npm run dev
```

Accede a [http://localhost:5173](http://localhost:5173).

---

## Pruebas

```bash
# Pruebas unitarias de componentes (Vitest + Testing Library):
npm test

# Ejecución única (sin modo watch):
npm run test:run
```

---

## Variables de Entorno

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/trpc` | URL del servidor tRPC del backend |

Crea un archivo `.env` en la raíz de este paquete para sobreescribir en desarrollo:
```env
VITE_API_URL=http://localhost:3001/trpc
```

---

## Notas de Troubleshooting

- **Error "A React Element from an older version of React":** Causado por múltiples copias de `react`. Resuelto con `overrides` en `package.json` y `dedupe: ['react', 'react-dom']` en `vite.config.ts`.
- **"Failed to Fetch" al conectar al backend:** Verifica que el backend esté corriendo en el puerto `3001` y que `VITE_API_URL` apunte a la URL correcta.
