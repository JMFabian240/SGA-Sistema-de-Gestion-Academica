# RF-42c: Ejecutar cierre de ciclo por grupo

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-42c: Ejecutar cierre de ciclo por grupo |
| **Actor** | Administrador y Gestor Administrativo |
| **Objetivo** | Procesar de forma granular la conclusión del ciclo escolar de un grupo específico que ya finalizó sus actividades y evaluaciones, promoviendo o graduando a sus alumnos. |
| **Flujo Principal** | 1. El actor accede a la administración de grupos en el ciclo activo.<br>2. El actor selecciona el grupo académico cuyo periodo lectivo ha terminado.<br>3. El actor hace clic en "Cerrar Ciclo del Grupo".<br>4. El sistema verifica que las calificaciones y expedientes estén completos.<br>5. El sistema cambia el estatus académico del grupo a cerrado y prepara a los alumnos regulares para la promoción de grado. |
| **Flujo Alterno** | <b>A.</b> Evaluaciones incompletas:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si el grupo tiene alumnos sin calificaciones finales capturadas, el sistema bloquea el cierre del grupo.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. Muestra el reporte de docentes pendientes de captura y el actor solicita complementar las calificaciones. |
| **Precondiciones** | El grupo debe estar activo en el ciclo escolar actual y contar con todas las evaluaciones de las materias cargadas. |
| **Postcondiciones** | El grupo queda en estado cerrado para modificaciones de calificación y sus estudiantes habilitados para transición. |
| **Reglas de negocio involucradas** | • Permite escalonar el cierre escolar sin requerir que toda la escuela concluya el mismo día.<br>• Genera registro de bitácora con el usuario que autorizó el cierre del grupo. |
