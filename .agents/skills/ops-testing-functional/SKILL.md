---
name: ops-testing-functional
description: Usa esta skill al escribir o evaluar pruebas funcionales para asegurar que los requerimientos lógicos y de negocio del SGA se cumplen de forma exacta.
---
# Functional Testing (ops-testing-functional)

Esta skill define cómo estructurar pruebas enfocadas en el comportamiento funcional de los casos de uso del sistema SGA.

## Directrices Generales
- Se centran en verificar que la aplicación haga exactamente lo que el usuario espera a nivel de reglas lógicas.
- No se limitan a la base de datos o a la interfaz, sino al resultado de negocio final.
- Deben contrastarse contra la matriz de requerimientos del sistema.

## Escenarios Comunes a Evaluar
1. **Reglas de Inscripción:** Validar que no se permita inscribir a un alumno si el cupo del grupo está al máximo.
2. **Generación de Deudas:** Validar que al inscribir un alumno en un plan de pago, se generen automáticamente las cuotas correctas con sus fechas de vencimiento según la configuración global.
3. **Cálculo de Recargos:** Probar que los recargos se calculen y apliquen automáticamente una vez pasados los días de gracia de la fecha de vencimiento.
4. **Vínculos de Tutoría:** Validar que si se elimina un tutor con saldo a favor, el sistema lo impida de forma consistente.

## Metodología
- Escribir casos de prueba basados en historias de usuario y diagramas de secuencia/robustez definidos en la fase de análisis OOAD.
