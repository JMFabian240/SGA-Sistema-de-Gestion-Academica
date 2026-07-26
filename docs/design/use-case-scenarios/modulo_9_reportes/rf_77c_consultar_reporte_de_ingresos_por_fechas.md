# RF-77c: Consultar y exportar reporte de ingresos por rango de fechas

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-77c: Consultar y exportar reporte de ingresos por rango de fechas |
| **Actor** | Administrador y Gestor Administrativo |
| **Objetivo** | Generar y auditar un reporte financiero detallado de ingresos recaudados en un periodo personalizado con capacidad de exportación. |
| **Flujo Principal** | 1. El actor entra a Reportes Financieros.<br>2. Elige "Reporte de Ingresos por Fechas".<br>3. Selecciona la fecha inicial y fecha final en el selector del calendario.<br>4. Presiona "Generar Reporte".<br>5. El sistema lista todos los pagos registrados en ese periodo, agrupados por concepto, método de pago y monto.<br>6. El actor hace clic en "Exportar Excel" o "Exportar PDF" para descargar el informe. |
| **Flujo Alterno** | <b>A.</b> Rango sin transacciones:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si en el rango seleccionado no hubo ingresos, el reporte indica "$0.00 recaudado" sin filas en la tabla. |
| **Precondiciones** | El actor debe tener permisos para consulta financiera. |
| **Postcondiciones** | Se genera el informe en pantalla o archivo descargable. |
| **Reglas de negocio involucradas** | • Incluye todos los conceptos cobrados en caja unificada (colegiaturas, inscripción, cargos extraordinarios y convenios).<br>• Los totales concilian con los reportes diarios de corte de caja. |
