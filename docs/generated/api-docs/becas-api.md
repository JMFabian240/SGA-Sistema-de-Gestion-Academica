# Documentación de API - Módulo `becas`

Este módulo se encarga del registro del catálogo de becas, la recepción de solicitudes, y el procesamiento transaccional de resoluciones y asignaciones directas. (RF-27, RF-28, RF-29, RF-30, RF-31).

> **Nota General**: Todos los procedimientos en este módulo están restringidos (`protectedProcedure`) y extraen automáticamente el ID del usuario (`usuarioId`) del contexto para registrar la autoría en auditorías de la base de datos (campos como `solicitadaPor`, `resueltaPor`, `asignadaPor`).

## Procedimientos

### Catálogo de Becas (`beca`)
- `becas.getBecas` (Query): Retorna el listado de becas vigentes en la institución.
- `becas.createBeca` (Mutation): Genera una nueva beca (ej. Beca por Promedio 15%).
- `becas.updateBeca` (Mutation): Modifica parámetros de la beca, como la descripción o el porcentaje a descontar.
- `becas.deleteBeca` (Mutation): Soft Delete de una beca del catálogo.

### Solicitudes de Beca (`solicitud_beca`)
- `becas.getSolicitudes` (Query): Obtiene un histórico de las solicitudes. Permite opcionalmente filtrar por `cicloId` o `alumnoId`. Retorna además información completa del Alumno, la Beca, y los usuarios que solicitaron/resolvieron.
- `becas.createSolicitud` (Mutation): Ingresa una solicitud de beca a revisión.
  - **Inputs**: `alumnoId`, `becaId`, `cicloId`, `motivo` y `observaciones`. El estado arranca en `ACTIVA`.
  - **Validación Especial**: Prisma rechaza internamente (`BAD_REQUEST`) la solicitud si el alumno ya tiene una solicitud pendiente de revisión (`ACTIVA`) para esa misma beca en ese mismo ciclo.
- `becas.resolverSolicitud` (Mutation): Interfaz que dictamina si una solicitud es aprobada o rechazada.
  - **Inputs**: `solicitudId`, `aprobar` (booleano), `observacionesResolucion`.
  - **Comportamiento Transaccional**: Si `aprobar` es `true`, además de cambiar el estado de la solicitud, Prisma ejecutará en la misma transacción un `create` para generar e insertar una instancia real de `asignacion_beca` automáticamente en el perfil del estudiante.

### Asignaciones (`asignacion_beca`)
- `becas.assignBeca` (Mutation): Provee una forma directa (sin mediación de solicitud) de asignarle inmediatamente un descuento a un estudiante.

## Manejo de Errores
- `BAD_REQUEST`: Duplicidad de solicitudes en el mismo ciclo, o si se intenta resolver una solicitud que ya estaba resuelta.
- `NOT_FOUND`: Si la solicitud referenciada no se encuentra o ya fue dada de baja.
