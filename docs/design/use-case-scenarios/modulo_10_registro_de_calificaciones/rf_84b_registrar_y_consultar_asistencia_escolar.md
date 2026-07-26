# RF-84b: Registrar y consultar asistencia escolar

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-84b: Registrar y consultar asistencia escolar |
| **Actor** | Administrador, Gestor Administrativo y Docente |
| **Objetivo** | Capturar y monitorear diariamente la asistencia de los estudiantes por grupo y materia para emitir la lista oficial institucional del plantel. |
| **Flujo Principal** | 1. El actor ingresa al módulo Académico y selecciona "Control de Asistencia".<br>2. Elige el ciclo escolar, grado, grupo y fecha actual.<br>3. El sistema despliega la lista de estudiantes inscritos en ese grupo.<br>4. El actor marca el estado de cada alumno (Presente, Ausente, Retardo, Justificado).<br>5. Presiona "Guardar Asistencia".<br>6. El sistema almacena los registros en la base de datos local y permite imprimir la lista de asistencia institucional. |
| **Flujo Alterno** | <b>A.</b> Modificación posterior:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si el actor requiere corregir una asistencia previa (ej. por justificante médico entregado después), busca la fecha pasada y edita el estatus, generando un registro de auditoría. |
| **Precondiciones** | El grupo debe contar con alumnos matriculados y el docente asignado a la materia. |
| **Postcondiciones** | La asistencia diaria queda registrada para el cálculo de estadísticas de puntualidad y reportes de grupo. |
| **Reglas de negocio involucradas** | • La asistencia escolar es consultable y auditable por dirección académica.<br>• El porcentaje de asistencia es un criterio de seguimiento para evaluaciones bimestrales/trimestrales. |
