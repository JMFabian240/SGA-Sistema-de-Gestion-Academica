# Componentes del Módulo de Auditoría

Este documento describe la arquitectura implementada para el módulo de `auditoria` en `@sga/front`, el cual funciona como una bitácora inmutable de solo lectura para el rastreo de seguridad.

## Rutas Asociadas (Nested Routing)
El enrutador protege e inyecta la siguiente vista en `/auditoria`:
- `/auditoria` -> Renderiza `AuditoriaListPage`

## Layout

### `AuditoriaLayout`
- **Ubicación:** `src/modules/auditoria/layouts/AuditoriaLayout/AuditoriaLayout.tsx`
- **Propósito:** Contenedor superior con un diseño simplificado (solo 1 pestaña) que mantiene la coherencia visual con el resto del SGA, exponiendo el acceso a la "Bitácora de Eventos".

## Páginas y Modales

### 1. Visor de Logs
- **Página:** `AuditoriaListPage.tsx`
- **Flujo:** 
  1. Expone una barra de filtros dinámica (Acción, Tabla y Fechas).
  2. Implementa paginación local delegando la carga al servidor (a través de `pagina` y `limite` en `ObtenerLogsSchema`).
  3. Despliega una tabla con codificación de colores para identificar visualmente las operaciones (Verde = INSERT, Amarillo = UPDATE, Rojo = DELETE).
- **Operación TRPC:** Consume el endpoint `obtenerLogs` el cual retorna metadatos de paginación (`meta.total`, `meta.totalPaginas`) junto a la `data`.

### 2. Modal de Inspección JSON
- **Componente:** `DetalleLogModal.tsx`
- **Flujo:** Al pulsar el icono de "Ojo" (Detalles) en cualquier fila de la tabla, se abre este modal pasando el registro completo.
- **Renderizado Seguro:** Cuenta con una función `renderJson` que analiza `datosAnteriores` y `datosNuevos` (ya sea que vengan como Object o String) y los pinta en dos bloques oscuros `<pre>` (estilo consola) de manera lado-a-lado, facilitando encontrar las discrepancias y alteraciones en la base de datos a nivel atributo.
