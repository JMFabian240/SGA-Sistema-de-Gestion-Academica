# Control de Tareas - Desarrollo del Frontend (`packages/front-end`)

Este documento detalla el estado actual del desarrollo del sistema en **`packages/front-end`** (basado en Vite, React, Tailwind CSS v4, Lucide Icons y tRPC).

---

## 🚀 Módulos Completados e Integrados en `packages/front-end`

| Módulo / Característica | Estado técnico | Detalle / Conexión a Base de Datos |
| :--- | :---: | :--- |
| **Arquitectura Base & Ruteo** | **Completado** | Layout principal con sidebar dinámico, ruteo protegido por autenticación, estado global en Zustand y cliente tRPC centralizado. |
| **Autenticación (Auth)** | **Completado** | Formulario premium de inicio de sesión (`LoginPage`), validación de credenciales en el backend, guardado seguro de JWT en `localStorage` y persistencia de sesión. |
| **Panel de Inicio (Dashboard)** | **Completado** | Conexión real a `metricasInscripcion`, `kpisFinancieros`, query de ingresos de los últimos 7 días y la lista dinámica de **"Últimos Pagos Registrados Hoy"**. Cero datos mockeados. |
| **Catálogo de Alumnos** | **En Proceso (Detalles)** | Listado de alumnos con paginación, filtros de búsqueda, visualización de estado de adeudos, y CRUD completo (crear, editar, eliminar lógicamente). |
| **Catálogo de Tutores** | **En Proceso (Detalles)** | Listado completo, asociación a alumnos, CRUD, validación estricta de RFC y datos fiscales en la misma vista, y control de saldo a favor. |

---

## ⏳ Módulos Pendientes en `packages/front-end`

A continuación se listan los módulos que se encuentran implementados en el backend, pero pendientes de diseño e integración con la interfaz premium en `packages/front-end`:

### 1. Módulo de Pagos y Caja (Prioridad Alta)
* [x] **Caja / Registro de Pagos:** Vista para seleccionar un tutor/alumno, listar sus adeudos pendientes, e ingresar un cobro. Debe soportar:
  * Aplicaciones detalladas a múltiples mensualidades/conceptos.
  * Generación y visualización automática del *Saldo a Favor* acumulado si el pago excede el total.
* [X] **Gestión de Tarifas:** CRUD para definir costos de colegiatura, inscripciones y otros conceptos parametrizados por Nivel Educativo y Ciclo Escolar.
* [x] **Calendario de Pagos:** Generación automática y manual de adeudos individuales o masivos para alumnos.

### 2. Módulo de Inscripciones y Ciclos
* [x] **Ciclos Escolares:** Configuración de años escolares lectivos (ej: 2026-2027), marcas de ciclo activo, fechas de inicio y fin.
* [ ] **Ventanas de Inscripción Temprana:** Definición de rangos de fecha y descuentos por pronto pago.
* [x] **Planes de Pago:** CRUD de plazos de financiamiento (ej: Pago de contado, 10 mensualidades, 12 mensualidades).
* [ ] **Proceso de Inscripción:** Formulario para asociar un alumno a un ciclo escolar, grupo, plan de pagos y beca (si aplica) de forma unificada.

### 3. Módulo de Calificaciones y Grupos
* [x] **Grupos Escolares:** Asignación de docentes a materias y niveles.
* [ ] **Evaluaciones:** Formulario de captura de calificaciones parciales/finales por materia, con validación de rangos numéricos.

### 4. Módulo de Becas y Descuentos
* [ ] **Catálogo de Becas:** Registro de porcentajes de descuento y nombres de becas.
* [ ] **Solicitudes de Beca:** Formulario para que tutores/personal soliciten becas para alumnos.
* [ ] **Aprobación de Solicitudes:** Bandeja de entrada para Administradores/Gestores para resolver (aprobar/cancelar) solicitudes de becas y convertirlas en asignaciones activas.

### 5. Reportes Financieros y Académicos
* [ ] **Reporte de Deudores:** Tabla interactiva de alumnos con adeudos `VENCIDOS`, indicando concepto, mes y cálculo preciso de días de atraso.
* [ ] **Exportación de Datos:** Botones para descargar reportes detallados en CSV o Excel.
* [ ] **Filtro de Ingresos:** Selección de rangos de fechas para auditar la captación en caja por cajero y método de pago.

### 6. Administración y Configuración General
* [x] **Administración de Usuarios y Roles (RBAC):** CRUD de usuarios internos (Gestores, Docentes, Administradores) y asignación multirrol.
* [ ] **Bitácora de Auditoría:** Buscador de logs de seguridad del backend (acciones sensibles de usuarios, cambios de saldo, eliminaciones lógicas).
* [ ] **Parámetros Globales:** Configuración del porcentaje de recargos por mora y días de gracia de adeudos.
