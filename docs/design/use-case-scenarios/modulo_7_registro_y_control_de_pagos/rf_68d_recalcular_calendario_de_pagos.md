# RF-68d: Recalcular calendario de pagos

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-68d: Recalcular calendario de pagos |
| **Actor** | Administrador y Gestor Administrativo |
| **Objetivo** | Ejecutar un proceso administrativo de recálculo sobre el historial financiero de un alumno para reconciliar saldos, becas, recargos y convenios aplicados. |
| **Flujo Principal** | 1. El actor ingresa a la vista de calendario de pagos del alumno.<br>2. Hace clic en "Recalcular Calendario".<br>3. El sistema analiza cada cargo, abono, descuento y recargo activo.<br>4. Reajusta los totales de las cuotas pendientes y actualiza el saldo global.<br>5. Muestra el nuevo resumen financiero reconciliado al usuario. |
| **Flujo Alterno** | <b>A.</b> Inconsistencia en convenios:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si un convenio de pago se incumplió, el recálculo reactiva las penalizaciones previamente congeladas y lo notifica al actor. |
| **Precondiciones** | El alumno debe contar con un plan de pagos o adeudos en el ciclo. |
| **Postcondiciones** | El calendario refleja las cantidades exactas y conciliadas a deber. |
| **Reglas de negocio involucradas** | • Respeta los pagos ya consolidados y liquidados sin modificarlos.<br>• Actualiza exclusivamente saldos abiertos de acuerdo con las reglas de morosidad vigentes. |
