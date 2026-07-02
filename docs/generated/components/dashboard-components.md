# Componentes del Módulo Dashboard

Este documento detalla los componentes generados e implementados para el módulo `dashboard` en `@sga/front`.

## Rutas Asociadas
- `/` (redirige a `/dashboard`)
- `/dashboard`: Renderiza el `MainLayout` y delega la vista a `DashboardPage`.

## Layouts Globales

### `MainLayout`
- **Ubicación:** `src/layouts/MainLayout/MainLayout.tsx`
- **Propósito:** Contenedor principal para la experiencia post-login. Mantiene la barra lateral (Sidebar), el encabezado superior (Header) y el contenedor central para el Outlet de rutas hijas.

### `Sidebar`
- **Ubicación:** `src/layouts/MainLayout/Sidebar/Sidebar.tsx`
- **Propósito:** Navegación principal de la plataforma. Muestra el branding y los enlaces a cada uno de los 12 submódulos principales del sistema académico utilizando íconos de `lucide-react`. Soporta estados activos (`isActive` via `NavLink`).

### `Header`
- **Ubicación:** `src/layouts/MainLayout/Header/Header.tsx`
- **Propósito:** Encabezado superior. Muestra el nombre de la vista actual y, a la derecha, el nombre del usuario logueado en sesión (extraído globalmente de `useAuth`) con la acción directa para cerrar sesión (`logout`).

## Páginas

### `DashboardPage`
- **Ubicación:** `src/modules/dashboard/pages/DashboardPage/DashboardPage.tsx`
- **Propósito:** Centro de operaciones "en vivo". Consume dos _queries_ desde el backend de manera simultánea para mostrar indicadores críticos del colegio.
- **Datos consumidos:**
  - `trpc.dashboard.obtenerMetricasInscripcion.useQuery()`
  - `trpc.dashboard.obtenerKpisFinancieros.useQuery()`
- **KPIs Mostrados (Card UI):**
  1. Alumnos Activos
  2. Ingresos del Mes (Formato Moneda MXN)
  3. Adeudos Vencidos (Formato Moneda MXN)
  4. Capacidad Total (Lugares)
- **Estados:**
  - Mientras las peticiones resuelven, muestra el componente `<Spinner centered size={40} />`.
  - Muestra una tabla secundaria (Ocupación por Nivel) debajo de los KPIs.
