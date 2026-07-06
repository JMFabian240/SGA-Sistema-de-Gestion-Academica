# Plan de Pruebas de Regresión - SGA

## 1. Propósito
El propósito de las pruebas de regresión es garantizar de manera continua que las refactorizaciones de código, corrección de errores, optimizaciones de consultas a base de datos y la implementación de nuevas características no rompan, modifiquen ni degraden las funcionalidades estables del sistema SGA.

## 2. Alcance y Priorización de Calidad
Este plan define las reglas para la ejecución histórica y exhaustiva de pruebas en todos los niveles del software:
* **Regresión del Backend**: Ejecución de las suites unitarias, funcionales e integradas.
* **Regresión del Frontend**: Verificación de layouts, interactividad y comunicación del cliente tRPC con el servidor.
* **Regresión del Esquema y Migraciones**: Garantía de compatibilidad retrospectiva con los datos de base de datos históricos.

> [!IMPORTANT]
> **Estrategia de Ejecución: Módulo por Módulo**
> Para priorizar la **calidad total del sistema y evitar errores de regresión en producción**, el proceso de pruebas de regresión se estructurará y reportará de forma estricta **módulo por módulo** (ej. Regresión de Cobros, Regresión de Calificaciones, etc.). Se priorizará la cobertura y aserción de escenarios límite sobre la rapidez en las fases de control de calidad.

## 3. Estrategia y Entorno
* **Entornos de Ejecución**: Las pruebas de regresión se ejecutan de forma local antes de cada fusión de código y de forma automatizada en el pipeline de Integración Continua (CI/CD).
* **Base de Datos**: Se utiliza un clon del esquema de producción con datos limpios sintéticos (`sga_test`) inicializado a través de Prisma en Docker.
* **Automatización (CI)**: Cada Pull Request disparará la suite completa de regresión (`npm run test:all` o equivalente) impidiendo la mezcla de cambios a la rama principal (`main`/`develop`) si se detecta un solo fallo en algún módulo de la suite.

## 4. Tipos de Casos a Cubrir
1. **Regresión sobre Bugs Corregidos (Bug Regression)**: Cada vez que se reporte y solucione un error crítico, se debe anexar un test específico en la suite (funcional o unitario) que prevenga que ese escenario de falla vuelva a ocurrir en el futuro.
2. **Regresión Funcional Cruzada**: Pruebas automáticas enfocadas en comprobar que cambios en la lógica de un módulo (ej. Becas) no introduzcan efectos colaterales indeseados en otros módulos dependientes (ej. Pagos e Inscripciones).
3. **Regresión Visual y CSS**: Ejecución automatizada de comparadores visuales (screenshots de Playwright) en vistas críticas de la UI para garantizar que los estilos globales de CSS de la aplicación no se desalineen o deformen tras cambios estructurales.

## 5. Criterios de Aceptación
* El 100% de las pruebas funcionales, unitarias y de integración deben resultar exitosas en cada ciclo de regresión.
* Ante cambios estructurales de base de datos, se debe validar que el frontend siga funcionando sin reiniciar servidores, lo que simula una actualización de producción sin caída de servicio (Hot-Deploy compatible).
* Cualquier refactorización o cambio de dependencias externas debe ser validado con la suite de regresión completa, documentando la salida antes y después de los cambios.
