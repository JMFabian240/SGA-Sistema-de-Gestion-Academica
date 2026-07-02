# Documentación de API - Módulo `inscripciones`

Este es el módulo orquestador que matricula a los alumnos en ciclos escolares y coordina los planes de pago y las ventanas promocionales de reinscripción.

> **Nota General**: Todos los procedimientos requieren autenticación (`protectedProcedure`). 

## Procedimientos

### Planes de Pago (`plan_pago`)
- `inscripciones.getPlanesPago` (Query): Obtiene el catálogo de planes de pago (ej. 10 meses, 12 meses, pago anual) disponibles en la institución.
- `inscripciones.createPlanPago` (Mutation): Genera un nuevo plan de pago, indicando el número de meses y las cuotas.
- `inscripciones.updatePlanPago` / `deletePlanPago`: Mantenimiento y soft delete de los planes.

### Ventanas de Inscripción Temprana (`ventana_inscripcion_temprana`)
- `inscripciones.getVentanas` (Query): Trae las configuraciones de inscripciones tempranas. Esto es usado administrativamente para dar descuentos automáticos si el tutor inscribe al alumno en fechas especiales (ej. "Inscripciones en Febrero 20%").
- `inscripciones.createVentana` (Mutation): Crea el rango de fechas (`fechaInicio`, `fechaFin`) ligado a un `cicloId` y a un `becaId`.
- `inscripciones.updateVentana` / `deleteVentana`: Mantenimiento y baja lógica de la ventana.

### Inscripciones a Ciclos (`inscripcion_ciclo`)
- `inscripciones.getInscripciones` (Query): Consulta el padrón de alumnos matriculados. Opcionalmente puede ser filtrado por un ciclo escolar específico (`cicloId`). Incluye detalles del alumno, el grupo y el plan de pago seleccionado.
- `inscripciones.createInscripcion` (Mutation): Realiza el alta/matrícula de un alumno.
  - **Inputs**: `alumnoId`, `cicloId`, `planPagoId`, `fechaIngreso`, `grupoId` (opcional), `estadoEnCiclo`, `estadoFinanciero`, `esIngresoTardio`.
  - **Restricción Zod/Prisma**: Rechaza la solicitud (`BAD_REQUEST`) si el estudiante ya se encontraba inscrito previamente en ese mismo ciclo, garantizando que un alumno no pueda tener inscripciones duplicadas en el mismo año escolar.
- `inscripciones.updateInscripcion` (Mutation): Actualiza detalles de la inscripción (ej. reasignación de grupo o cambio de estado financiero).
- `inscripciones.deleteInscripcion` (Mutation): "Anula" o cancela la inscripción aplicando un Soft Delete y cambiando el estado a `ANULADA`.

## Manejo de Errores
- `BAD_REQUEST`: Duplicidad en la tabla (ej. alumno ya matriculado en ese ciclo) o inconsistencias de validación Zod.
- `NOT_FOUND`: Registro a actualizar o eliminar no existe o ya fue anulado.
