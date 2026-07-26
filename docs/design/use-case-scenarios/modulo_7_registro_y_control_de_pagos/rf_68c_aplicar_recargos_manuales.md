# RF-68c: Aplicar recargos manuales por morosidad

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-68c: Aplicar recargos manuales por morosidad |
| **Actor** | Administrador y Gestor Administrativo |
| **Objetivo** | Aplicar o ajustar de forma manual una penalización económica por retraso de pago sobre una cuota vencida de un alumno. |
| **Flujo Principal** | 1. El actor entra al estado de cuenta del alumno y selecciona un adeudo vencido.<br>2. Hace clic en "Aplicar Recargo Manual".<br>3. Especifica el monto del recargo e introduce una justificación en texto.<br>4. Guarda el ajuste.<br>5. El sistema suma el recargo al saldo pendiente de esa cuota y registra el movimiento en bitácora. |
| **Flujo Alterno** | <b>A.</b> Adeudo no vencido:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si el adeudo seleccionado aún no ha vencido, el sistema solicita confirmación especial de autorización administrativa. |
| **Precondiciones** | El alumno debe tener una cuenta pendiente registrada. |
| **Postcondiciones** | El saldo total a pagar se incrementa en el monto del recargo aplicado. |
| **Reglas de negocio involucradas** | • Complementa o reemplaza el recargo automático ($400 MXN) en casos que ameriten ajustes administrativos discretos.<br>• Toda aplicación manual de recargo requiere justificación obligatoria. |
