# Documentación del Proyecto SGA

Este directorio contiene toda la documentación técnica y de diseño del Sistema de Gestión Académica del Colegio San Diego, organizada en las siguientes carpetas:

---

## Estructura

| Carpeta | Descripción |
|---|---|
| [`architecture/`](./architecture/) | Especificaciones arquitectónicas detalladas de cada capa del sistema |
| [`design/`](./design/) | Mockups, diagramas de flujo, casos de uso y diseño visual de la UI |
| [`test-plans/`](./test-plans/) | Planes y scripts de pruebas (unitarias, de aceptación y E2E) |
| [`despliegue/`](./despliegue/) | Guías y procedimientos para el despliegue en equipos del colegio |
| [`resources/`](./resources/) | Plantillas, datos de ejemplo y materiales de referencia operativa |
| [`tasks/`](./tasks/) | Tareas y pendientes del proyecto |
| `generated/` | Documentación generada automáticamente (reportes, migraciones). No editar manualmente. |

---

## Especificaciones Arquitectónicas

Los documentos de arquitectura en [`architecture/`](./architecture/) describen en detalle cada capa del sistema:

- [`backend-architecture.md`](./architecture/backend-architecture.md) — Patrón de capas (`Router → Service → Repository → Domain`), los 15 módulos del backend y sus algoritmos financieros.
- [`database-architecture.md`](./architecture/database-architecture.md) — Modelo relacional, diagrama ER, los 26 modelos y 8 enums en 6 dominios, reglas de integridad.
- [`frontend-architecture.md`](./architecture/frontend-architecture.md) — Stack LAN, arquitectura modular por dominio, gestión dual de estado, enrutamiento RBAC e integraciones institucionales.

---

## Convención de Edición

> Toda nueva adición a los documentos de diseño y arquitectura debe insertarse dentro de la sección lógica que le corresponde, preservando el orden y la coherencia estructural. No agregar contenido "en pila" al final de los archivos.
