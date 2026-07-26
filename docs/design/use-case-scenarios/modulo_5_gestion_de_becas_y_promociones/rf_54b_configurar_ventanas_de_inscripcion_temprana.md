# RF-54b: Configurar ventanas de inscripción temprana

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-54b: Configurar ventanas de inscripción temprana |
| **Actor** | Administrador |
| **Objetivo** | Parametrizar periodos temporales promocionales con descuentos o tarifas especiales de inscripción anticipada en el sistema. |
| **Flujo Principal** | 1. El Administrador accede a Configuración de Promociones.<br>2. Selecciona "Crear Ventana de Inscripción Temprana".<br>3. Define la fecha de inicio, fecha de fin y el porcentaje o monto reducido.<br>4. Guarda la configuración.<br>5. El sistema activa la ventana y la aplica automáticamente en caja a las inscripciones dentro de ese rango de fechas. |
| **Flujo Alterno** | <b>A.</b> Traslape de fechas:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si el rango se traslapa con otra ventana del mismo nivel, el sistema advierte el conflicto y pide ajustar fechas. |
| **Precondiciones** | Sesión de Administrador activa. |
| **Postcondiciones** | La ventana de inscripción temprana queda programada y vinculada a los cálculos automáticos de adeudo. |
| **Reglas de negocio involucradas** | • Cualquier pago de inscripción realizado en fecha aplicable obtiene de forma inmediata el beneficio programado.<br>• Todas las altas o cambios de ventana generan auditoría en bitácora. |
