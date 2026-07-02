# Componentes del Módulo de Inscripciones

Este documento detalla la estructura implementada para el módulo `inscripciones` en `@sga/front`, el cual centraliza la vinculación entre los alumnos y su catálogo académico y compromisos financieros utilizando Modales superpuestos y Pestañas.

## Rutas Asociadas (Nested Routing)
El enrutador inyecta un Layout principal en `/inscripciones` y renderiza sub-vistas:
- `/inscripciones` -> Renderiza `InscripcionesListPage`
- `/inscripciones/planes-pago` -> Renderiza `PlanesPagoListPage`
- `/inscripciones/ventanas` -> Renderiza `VentanasListPage`

## Layout

### `InscripcionesLayout`
- **Ubicación:** `src/modules/inscripciones/layouts/InscripcionesLayout/InscripcionesLayout.tsx`
- **Propósito:** Actúa como contenedor de navegación local. Muestra un menú de pestañas horizontal basado en `NavLink` de React Router y renderiza el contenido inferior mediante `<Outlet />`. Reutiliza los estilos CSS del módulo de Grupos.

## Páginas y Modales

### 1. Inscripciones
- **Página:** `InscripcionesListPage.tsx` -> Lista a los alumnos inscritos mostrando a qué Ciclo, Grupo y Plan de Pago están atados, junto con sus semáforos de Estado Académico y Financiero.
- **Modal:** `InscripcionFormModal.tsx` -> Integra múltiples `<select>` cruzando queries de 3 routers distintos (`alumnos.getAll`, `grupos.getCiclos`, `grupos.getGrupos`, `inscripciones.getPlanesPago`). Filtra dinámicamente la lista de Grupos basándose en el Ciclo seleccionado.

### 2. Planes de Pago
- **Página:** `PlanesPagoListPage.tsx` -> Muestra el catálogo de los planes configurados para cobrar.
- **Modal:** `PlanPagoFormModal.tsx` -> Captura costos mensuales y de diciembre, y duración en meses.

### 3. Ventanas de Inscripción (Temprana / Regular)
- **Página:** `VentanasListPage.tsx` -> Indica qué periodos promocionales están abiertos usando lógica de fecha actual vs fecha fin.
- **Modal:** `VentanaFormModal.tsx` -> Vincula un Ciclo con una Beca (que aplica automáticamente el porcentaje) durante un rango de fechas. Usa el estándar nativo `<input type="date">` enviando `ISOString` al backend (Zod).

## Integración TRPC
Cada Modal contiene localmente su propia mutación tRPC (ej. `createPlanPago`, `updateVentana`) utilizando `onSuccess: () => utils.inscripciones.get*.invalidate()` para cerrar el modal y disparar una recarga en la tabla en tiempo real.
