# Componentes del Módulo de Becas y Apoyos

Este documento detalla la estructura implementada para el módulo `becas` en `@sga/front`, el cual gestiona el ciclo de vida completo de un descuento: configuración (Catálogo), solicitud (Revisión) y otorgamiento (Asignación).

## Rutas Asociadas (Nested Routing)
El enrutador inyecta un Layout principal en `/becas` y renderiza sub-vistas:
- `/becas` -> Renderiza `BecasListPage` (Catálogo)
- `/becas/solicitudes` -> Renderiza `SolicitudesListPage`
- `/becas/asignadas` -> Renderiza `AsignadasListPage`

## Layout

### `BecasLayout`
- **Ubicación:** `src/modules/becas/layouts/BecasLayout/BecasLayout.tsx`
- **Propósito:** Contenedor de navegación local que provee el menú horizontal de pestañas: Catálogo de Becas, Solicitudes en Revisión y Becas Asignadas. Reutiliza los estilos estándar de Grupos/Pagos.

## Páginas y Modales

### 1. Catálogo de Becas
- **Página:** `BecasListPage.tsx`
- **Modal:** `BecaFormModal.tsx`
- **Operaciones:** CRUD del esquema `createBecaSchema`. Permite crear apoyos definiendo su `criterio` (Académica, Socioeconómica, Promoción Temprana, etc.) y el `porcentaje` exacto de descuento. 

### 2. Solicitudes de Becas (En Revisión)
- **Página:** `SolicitudesListPage.tsx` -> Lista todas las solicitudes de beca. Las acciones de la tabla no editan el registro, sino que ofrecen botones directos de "Aprobar" (Icono Check Verde) y "Rechazar" (Icono X Rojo) que consumen el endpoint `resolverSolicitud`.
- **Modal:** `SolicitudFormModal.tsx` -> Formulario para capturar una petición. Cruza los queries de Alumnos, Becas (catálogo) y Ciclos. Almacena observaciones y el motivo de la petición. El estado inicial se marca internamente como ACTIVA (pendiente).

### 3. Becas Asignadas (Vigentes)
- **Página:** `AsignadasListPage.tsx` -> Proyectada para listar a los alumnos que actualmente poseen una beca (ya sea por resolución de solicitud o directa). 
- **Modal:** `AsignarBecaModal.tsx` -> Dispara la mutación `assignBeca` la cual ignora el proceso de solicitud y le otorga directamente una beca a un alumno en el ciclo actual. Ideal para automatizaciones u otorgamiento masivo por decreto institucional.
