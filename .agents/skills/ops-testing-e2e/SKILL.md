---
name: ops-testing-e2e
description: Usa esta skill al diseñar, implementar o ejecutar pruebas de extremo a extremo (E2E) que simulan interacciones completas de usuario desde el navegador.
---
# End-to-End Testing (ops-testing-e2e)

Esta skill proporciona las guías para escribir y ejecutar pruebas E2E en el sistema SGA.

## Directrices Generales
- Las pruebas E2E prueban el flujo completo de la aplicación: el Frontend interactuando con el Backend real, conectado a la Base de Datos.
- Típicamente usan frameworks como **Playwright** o **Cypress** para interactuar visualmente con el navegador.
- Deben reservarse para flujos críticos (ej. ciclo de cobro de colegiaturas, inscripción completa de un alumno, login y expiración de sesión).

## Estrategia de Ejecución
1. **Ambiente Limpio:** Levantar el backend de prueba y el frontend de producción/dev en puertos dedicados de forma local o en CI/CD.
2. **Base de Datos Dedicada:** Utilizar una base de datos limpia que se inicializa y destruye en cada set de pruebas.
3. **Selectores Resilientes:** Usar selectores semánticos (`getByRole`, `getByLabelText`, `getByTestId`) en vez de clases CSS o estructuras DOM frágiles.
4. **Capturas y Videos:** Guardar reportes visuales en caso de fallo dentro de la ruta `docs/generated/test-reports/e2e/`.
