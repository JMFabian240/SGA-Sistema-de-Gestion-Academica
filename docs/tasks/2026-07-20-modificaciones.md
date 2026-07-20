# Modificaciones del día (20 de Julio 2026)

## 1. Migración de Métodos de Pago
- Se eliminó el método de pago 'Efectivo'.
- Se migró toda la lógica, esquemas y registros de la base de datos hacia 'Depósito' como método principal.
- Refactorizado el componente 'TicketCheckout' para evitar pagos en efectivo.

## 2. Validación en Cargos Extraordinarios
- Se aplicaron restricciones estrictas en 'NuevoCargoModal.tsx' para el campo de monto:
  - Bloqueo de números negativos.
  - Bloqueo de caracteres especiales y letras.
  - Soporte y precisión para números grandes evitando el uso de librerías externas o notación científica incorrecta.

## 3. Implementación Híbrida de Recargos
- **Automático:** Se instaló 'node-cron' y se configuró una tarea de fondo ('recargos.cron.ts') que procesa diariamente los adeudos vencidos, sumando automáticamente el 'montoRecargoDefecto' a aquellos que rebasen sus días de gracia.
- **Manual:** Se añadió un botón en la interfaz de 'CajaPage' para aplicar manualmente el recargo a adeudos vencidos que aún no lo tengan aplicado, a través del nuevo endpoint tRPC 'aplicarRecargoManual'.
