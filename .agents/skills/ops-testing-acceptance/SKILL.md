---
name: ops-testing-acceptance
description: Usa esta skill al diseñar criterios de aceptación de historias de usuario y validar pruebas con el enfoque BDD (Gherkin).
---
# Acceptance Testing (ops-testing-acceptance)

Esta skill regula el diseño y ejecución de pruebas de aceptación para asegurar que los requerimientos de entrega y calidad del cliente sean satisfechos en el sistema SGA.

## Criterios de Aceptación (BDD)
- Todas las funcionalidades desarrolladas deben contar con escenarios descritos en formato Gherkin (Dado/Cuando/Entonces).
- Estos escenarios actúan como el contrato de aceptación entre el equipo técnico y el usuario administrador/cliente.

## Estructura Esperada (Ejemplo)
```gherkin
Escenario: Registro exitoso de pago de colegiatura
  Dado que el Cajero está autenticado en el sistema
  Y que el Alumno tiene un adeudo pendiente de $1500 en el mes de Septiembre
  Cuando el Cajero registra un pago en efectivo por $1500 para este adeudo
  Entonces el sistema debe registrar el Pago y la Aplicación de Pago
  Y el saldo pendiente del adeudo debe ser $0
  Y el estado del cobro debe actualizarse a "PAGADO"
```

## Validación
- Las pruebas de aceptación pueden automatizarse mediante cucumber/playwright o validarse manualmente por el usuario en base a los escenarios definidos en esta skill.
