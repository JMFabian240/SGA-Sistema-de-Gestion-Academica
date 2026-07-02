# Componentes del Módulo de Reportes

Este documento detalla la estructura implementada para el módulo `reportes` en `@sga/front`, el cual es un módulo 100% analítico y de Solo Lectura. Extrae resúmenes gerenciales que cruzan datos de Pagos, Alumnos y Grupos.

## Rutas Asociadas (Nested Routing)
El enrutador inyecta un Layout principal en `/reportes` y renderiza sub-vistas a todo lo ancho para simular un ambiente de hoja de cálculo:
- `/reportes` -> Renderiza `IngresosReportePage` (Corte de Caja)
- `/reportes/deudores` -> Renderiza `DeudoresReportePage` (Cartera Vencida)
- `/reportes/asistencia` -> Renderiza `AsistenciaReportePage` (Listas de Asistencia)

## Layout

### `ReportesLayout`
- **Ubicación:** `src/modules/reportes/layouts/ReportesLayout/ReportesLayout.tsx`
- **Propósito:** Contenedor superior con pestañas visuales (Iconos). Redirige al usuario entre los tres principales tipos de reportes de este sprint.

## Páginas Analíticas (Tabulares)

### 1. Corte de Ingresos (Caja)
- **Página:** `IngresosReportePage.tsx`
- **Flujo:** Dispone de dos `DatePickers` (Fecha Inicio / Fecha Fin). Al oprimir "Generar Reporte", la página consulta el TRPC (`reporteIngresos`) enviando el rango UTC.
- **Visualización:** Tabla extendida con campos: Folio de Pago, Fecha, Alumno, Tutor, Cajero Responsable y Monto. Muestra un acumulador superior con el Total Ingresado.

### 2. Cartera Vencida (Deudores)
- **Página:** `DeudoresReportePage.tsx`
- **Flujo:** No requiere filtros. Directamente invoca a `reporteDeudores` que trae a los alumnos cuyo calendario de pagos ha excedido la fecha límite (`VENCIDO`).
- **Visualización:** Emplea Badges dinámicos para los días de atraso (Amarillo < 30 días, Rojo > 30 días). Sumariza el total adeudado.

### 3. Listas de Asistencia
- **Página:** `AsistenciaReportePage.tsx`
- **Flujo:** Requiere obligatoriamente un `Grupo` para activarse. Opcionalmente filtra por `mes` y `anio`. Invoca `listaAsistencia`.
- **Visualización:** Divide el espacio en 2 columnas: Lista nominal de inscritos totales vs. el crudo de inasistencias en la tabla, lo cual facilita contrastar la inscripción real con la asistencia diaria del periodo.
