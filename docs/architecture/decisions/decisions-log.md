# Registro de Decisiones de Diseño y Arquitectura (ADR)

Este documento registra decisiones importantes tomadas durante el desarrollo del sistema SGA.

## Fecha: 2026-07-09
### Funcionalidad: Formulario de Nuevo Alumno

#### Decisión 1: Campos de Nombre de Alumno
- **Contexto**: El mockup del frontend solicita campos separados para "Nombre(s)", "Apellido Paterno" y "Apellido Materno". Sin embargo, el esquema actual de Prisma en la tabla `Alumno` almacena un único campo `nombreCompleto`.
- **Decisión Tomada**: Se decidió mantener temporalmente los campos separados en el frontend para mejor experiencia de usuario, pero el frontend se encargará de concatenarlos y enviarlos como `nombreCompleto` al backend.
- **Alternativa Descartada**: Modificar la base de datos y dividir `nombreCompleto` en tres columnas separadas. Se descartó por el momento para evitar romper otras partes del sistema y requerir migraciones complejas.

#### Decisión 2: Planes de Pago al Crear Alumno
- **Contexto**: El mockup del formulario incluye la selección de un "Plan de Pago". Esto implica que crear el alumno automáticamente generaría su calendario de pagos y su inscripción financiera, lo cual añade gran complejidad a un simple registro.
- **Decisión Tomada**: Se descartó incluir el campo "Plan de Pago" en el modal de Nuevo Alumno por el momento. El proceso financiero y de asignación de planes de pago se manejará posteriormente (o en una pantalla dedicada de inscripciones).
- **Alternativa Descartada**: Crear la lógica transaccional de inscripción al ciclo + asignación de plan de pago desde el propio endpoint de `createAlumno`.
