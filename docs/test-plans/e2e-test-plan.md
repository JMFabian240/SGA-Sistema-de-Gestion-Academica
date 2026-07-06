# Plan de Pruebas End-to-End (E2E) - SGA

## 1. Propósito
El propósito de las pruebas End-to-End (E2E) es verificar que los flujos de usuario completos del sistema de control escolar SGA funcionen de manera correcta y cohesiva a través de toda la pila tecnológica. Estas pruebas simulan el comportamiento del usuario final interactuando con la interfaz web real, validando la comunicación entre el frontend, la capa de comunicación (tRPC), el backend, el ORM (Prisma) y la base de datos de pruebas (PostgreSQL).

## 2. Alcance y Priorización de Calidad
Las pruebas abarcan las rutas de usuario e interacciones complejas de todos los módulos del sistema escolar:
* **Autenticación**: Login, redirección inicial por rol, cambio obligado de contraseña, expiración de sesión y bloqueo por reintentos.
* **Alumnos y Tutores**: Vinculación de estudiantes, carga de expedientes y actualización de información personal en la UI.
* **Inscripciones y Pagos**: Selección de grupos, asignación de planes de pago, generación automática de adeudos y cobro/conciliación desde la caja registradora virtual.
* **Calificaciones**: Captura masiva de notas, validación visual de alertas por reprobación, generación de boletas de calificaciones e impresión de kárdex.
* **Dashboard y Reportes**: Visualización de gráficas de inscripción, exportación de reportes de asistencia y deudores.

> [!IMPORTANT]
> **Estrategia de Creación: Módulo por Módulo**
> Con el fin de priorizar la **calidad técnica y exhaustividad** de las pruebas sobre la rapidez del despliegue, la suite de pruebas E2E debe ser construida de forma rigurosa **módulo por módulo**. No se avanzará al siguiente módulo hasta que las pruebas del módulo anterior cubran todos los flujos excepcionales, de rendimiento de renderizado y aserciones de red.

## 3. Estrategia y Entorno
* **Framework**: Playwright
* **Entorno**: Servidor de desarrollo frontend (Vite) y backend (Fastify/tRPC) apuntando de forma obligatoria a la base de datos de pruebas dedicada `sga_test`.
* **Aislamiento**: Uso de base de datos limpia al inicio de cada archivo de pruebas para garantizar la idempotencia de los flujos de usuario.
* **Patrón de Diseño**: Se exige el uso del patrón **Page Object Model (POM)** para aislar la lógica de selectores de los componentes visuales de los casos de prueba de E2E, garantizando mantenibilidad a largo plazo.

## 4. Tipos de Casos a Cubrir
1. **Flujos Críticos Nominales (Happy Paths)**: Recorrido completo de un usuario sin excepciones (ej. Inscribir un alumno nuevo de principio a fin, realizar su primer pago, capturar su calificación y verificar el Kárdex).
2. **Validación de Límites y Mensajes de Error (Sad Paths)**: Simulación de errores comunes en los formularios para verificar que la interfaz visual muestra correctamente los mensajes de alerta (Zod/tRPC) y no se queda congelada.
3. **Flujos Multi-Rol**: Pruebas cruzadas donde un Administrador configura un periodo académico, un Profesor sube calificaciones, y un Tutor o Director consulta la boleta del estudiante.
4. **Respuestas de Red Lentas**: Simulación de latencia en Playwright para garantizar que el frontend maneja de forma correcta los estados de carga (*skeletons*, indicadores de progreso) sin permitir clics dobles del usuario.

## 5. Criterios de Aceptación
* El 100% de la suite de pruebas E2E se ejecuta correctamente sin falsos positivos en el entorno de testing.
* El código de las pruebas no debe contener *hardcodeo* de tiempos de espera (`page.waitForTimeout`); se deben utilizar siempre selectores orientados a estados de la interfaz (`page.waitForSelector`, `locator.toBeVisible`).
* Todas las aserciones de la base de datos después de una acción en la UI deben ser verificadas mediante llamadas directas al cliente Prisma de pruebas para validar la persistencia real de los datos.
