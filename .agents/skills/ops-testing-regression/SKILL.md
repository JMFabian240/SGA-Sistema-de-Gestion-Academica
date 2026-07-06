---
name: ops-testing-regression
description: Usa esta skill al ejecutar o planificar pruebas de regresión para asegurar que los cambios de código no rompen la funcionalidad actual.
---
# Regression Testing (ops-testing-regression)

Esta skill establece las pautas para asegurar que los cambios de código, refactorizaciones y corrección de bugs no alteren negativamente las funcionalidades que ya operaban correctamente en el sistema SGA.

## Directrices de Regresión
- Se debe correr la suite de pruebas unitarias completa (`npx vitest run`) del backend en cada refactorización y antes de realizar un merge/PR.
- En el frontend, se debe ejecutar la compilación (`npm run build`) para verificar la integridad de tipos en los contratos de tRPC.

## Estrategia frente a Bugs (Test-Driven Bug Fixing)
1. Al detectar un bug en producción o desarrollo, primero escribe una prueba unitaria o de integración que reproduzca el comportamiento erróneo (el test debe fallar).
2. Modifica el código para solucionar el error.
3. Verifica que la prueba pase y que el resto de las pruebas de regresión sigan pasando exitosamente.
4. Esto previene que el mismo bug vuelva a introducirse en el futuro.
