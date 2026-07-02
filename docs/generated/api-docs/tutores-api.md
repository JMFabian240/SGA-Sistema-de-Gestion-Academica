# Documentación de API - Módulo `tutores`

Este módulo maneja el registro y administración de los tutores (padres o responsables de los alumnos), así como su información fiscal requerida para facturación (RF-18, RF-19, RF-21).

> **Nota General**: Todos los procedimientos en este módulo están restringidos (`protectedProcedure`) y requieren un token de autenticación. Las eliminaciones (`delete`) ejecutan un Soft Delete marcando la fecha en la columna `eliminadoEn`.

## Procedimientos

### Tutores (`tutor` y `datos_fiscales`)

- `tutores.getAll` (Query): Retorna todos los tutores activos en el sistema, ordenados alfabéticamente. Incluye sus datos fiscales (si los tienen).
- `tutores.getById` (Query): Obtiene la información detallada de un tutor a través de su `tutorId`. Incluye sus datos fiscales y la lista de alumnos que tiene asignados (relación `tutores_alumnos`). Lanza `NOT_FOUND` si el tutor no existe o fue eliminado lógicamente.

- `tutores.create` (Mutation): Registra a un nuevo tutor en la plataforma.
  - **Inputs**:
    - `nombreCompleto`, `correoElectronico` (opcional), `telefono` (opcional), `direccion` (opcional), `curp` (opcional), `requiereFactura` (booleano, por defecto falso), `tipoPagoHabitual` (opcional).
    - Puede incluir un objeto `datosFiscales` de forma opcional (RFC, razón social, régimen, etc.).
  - **Validación Especial**: Si se envía `requiereFactura: true`, pero no se proporciona el bloque `datosFiscales`, el servidor rechazará la solicitud devolviendo un `BAD_REQUEST`.

- `tutores.update` (Mutation): Modifica la información del tutor o de sus datos fiscales.
  - **Inputs**: Mismo esquema de creación, pero de forma parcial (`Partial`), incluyendo obligatoriamente el `tutorId`.
  - **Comportamiento**: Si se envían `datosFiscales`, el servidor ejecutará internamente un `upsert` (los crea si no existían, o los actualiza si el tutor ya los poseía). También valida la misma regla de que no se puede habilitar `requiereFactura` si no existen o proveen datos fiscales.

- `tutores.delete` (Mutation): Da de baja a un tutor (Soft Delete).
  - **Inputs**: `tutorId` (entero positivo).
  - **Validación Especial**: Rechaza la eliminación (`BAD_REQUEST`) si el tutor mantiene un `saldoAFavor` activo (mayor a 0).

## Manejo de Errores
- `BAD_REQUEST`: Cuando no se cumplen las reglas de negocio (ej. Facturación sin datos, validaciones Zod, eliminar con saldo a favor).
- `NOT_FOUND`: Cuando el tutor solicitado no existe o fue eliminado lógicamente.
- `UNAUTHORIZED`: Fallo de validación del token de sesión.
