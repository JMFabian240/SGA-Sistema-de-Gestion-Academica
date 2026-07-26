# RF-77b: Consultar panel de morosidad en Dashboard

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-77b: Consultar panel de morosidad en Dashboard |
| **Actor** | Administrador y Gestor Administrativo |
| **Objetivo** | Monitorear en tiempo real desde la pantalla principal los indicadores financieros clave de cartera vencida, identificando rápidamente a los principales deudores de la institución. |
| **Flujo Principal** | 1. El actor inicia sesión en el sistema y accede al Dashboard Principal.<br>2. El sistema consulta automáticamente las funciones de morosidad (`obtenerTopDeudores` y `obtenerCuentasPendientes`).<br>3. El sistema muestra los widgets con la lista del Top 5 de deudores agrupados por familia y el total de la cartera vencida.<br>4. El actor puede hacer clic en una familia para navegar directamente a su estado de cuenta. |
| **Flujo Alterno** | <b>A.</b> Sin morosidad en el plantel:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si no hay adeudos vencidos, los widgets exhiben "$0.00 en cartera vencida" y el mensaje "No hay deudores registrados". |
| **Precondiciones** | Sesión activa con rol Administrador o Gestor Administrativo. |
| **Postcondiciones** | El usuario obtiene una visión analítica del estado financiero sin generar modificaciones de datos. |
| **Reglas de negocio involucradas** | • La agrupación por tutor consolida la deuda de hermanos en un solo registro de cobro familiar.<br>• Los datos se calculan en tiempo real sobre la base de datos local. |
