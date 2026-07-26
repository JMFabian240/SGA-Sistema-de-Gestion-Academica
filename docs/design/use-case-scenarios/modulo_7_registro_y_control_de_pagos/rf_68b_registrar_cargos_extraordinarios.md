# RF-68b: Registrar cargos extraordinarios

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-68b: Registrar cargos extraordinarios |
| **Actor** | Administrador y Gestor Administrativo |
| **Objetivo** | Asignar cobros adicionales y ad-hoc (talleres, excursiones, multas o materiales adicionales) al calendario de adeudos de un alumno. |
| **Flujo Principal** | 1. El actor ingresa a la ficha financiera del alumno.<br>2. Selecciona la acción "Agregar Cargo Extraordinario".<br>3. Ingresa el concepto, monto en MXN y fecha de vencimiento.<br>4. Confirma la creación del cargo.<br>5. El sistema registra el nuevo adeudo y lo incluye en la cartera pendiente de la familia. |
| **Flujo Alterno** | <b>A.</b> Monto inválido:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si el monto es cero o negativo, el sistema impide la creación y solicita un valor válido mayor a $0.00. |
| **Precondiciones** | El alumno debe estar inscrito y en estatus activo. |
| **Postcondiciones** | El cargo se añade al calendario financiero de cobros pendientes y puede pagarse en la caja unificada. |
| **Reglas de negocio involucradas** | • Los cargos extraordinarios no son sujetos de descuentos automáticos de becas ordinarias salvo configuración explícita.<br>• Su vencimiento se rige de manera independiente a las mensualidades estándar. |
