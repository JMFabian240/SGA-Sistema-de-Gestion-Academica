---
name: ops-testing-performance
description: Usa esta skill al planificar, ejecutar y analizar pruebas de rendimiento, carga y estrés del SGA.
---
# Performance Testing (ops-testing-performance)

Esta skill define las pautas para evaluar la velocidad, escalabilidad y estabilidad del sistema SGA bajo cargas de trabajo simuladas o picos de tráfico.

## Directrices de Rendimiento
- **Tiempos de Respuesta:** Las respuestas de los endpoints críticos de tRPC (ej. carga de calificaciones de un grupo entero, listado de alumnos) deben mantenerse por debajo de los 300ms en condiciones normales.
- **Páginas de UI:** Evaluar la eficiencia del renderizado del frontend, evitando re-renders innecesarios en listas largas de estudiantes o historial de pagos.

## Pruebas de Carga y Estrés
- Identificar cuellos de botella en consultas SQL (ej. falta de índices en tablas pivote como `TutorAlumno` o `CalendarioPago`).
- Al realizar reportes consolidados (ej. kárdex de egreso, reportes de deudores de toda la institución), evaluar si se requiere almacenamiento en caché, procesamiento en segundo plano o paginación forzada en base de datos.
