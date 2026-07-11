# Cronograma de Desarrollo - Demo 2ª Vuelta (5 Días)

Este archivo sirve para llevar el control diario del progreso hacia la segunda demo funcional y autoevaluada por el cliente. **El agente no editará este archivo automáticamente; solo se actualizará bajo indicación explícita del usuario.**

---

## 📊 Tabla de Progreso Diario

| Día | Módulo / Tarea | Estado | Pendientes / Notas |
| :--- | :--- | :---: | :--- |
| **Lunes (Día 1)** | **Configuración Escolar & Precios:**<br>• CRUD de Ciclos Escolares (Tabla, creación, edición, eliminación lógica y reglas de seguridad).<br>• CRUD de Tarifas (Listar, filtrar por ciclo/nivel, nuevos conceptos y modificar montos con validaciones). | `[x]` Completado | |
| **Martes (Día 2)** | **Alumnos, Tutores & Roles:**<br>• Detalles y validaciones en CRUD de Alumnos y CRUD de Tutores.<br>• CRUD de Usuarios y Roles (RBAC básico: directores, cajeros). | `[x]` Completado<br>`[ ]` En Proceso | |
| **Miércoles (Día 3)**| **Inscripción Express & UI de Caja:**<br>• Flujo de Inscripción Express (Ligar alumno a ciclo/plan y generar adeudos).<br>• UI de Caja de Cobro premium y lógica interactiva en React/Zustand (selección múltiple, abonos y saldos a favor). | `[x ]` Completado<br>`[x]` En Proceso | |
| **Jueves (Día 4)** | **Procesamiento de Pagos & Ticket:**<br>• Integración de backend para registro de pagos (`registrarPago`).<br>• Generación e impresión de ticket digital de cobro. | `[ ]` Completado<br>`[x]` En Proceso | |
| **Viernes (Día 5)** | **Estabilidad y Pulido Visual:**<br>• Pruebas de integración E2E y flujos completos.<br>• Pulido estético de Tailwind v4, transiciones y manejo de errores elegantes en UI. | `[ ]` Completado<br>`[ ]` En Proceso | |

---

## 📝 Notas de Control de Alcance
* **Respaldo de Base de Datos:** Excluido de la demo funcional por complejidad de infraestructura en Tauri. Se representará con un aviso informativo estático en configuración indicando que los respaldos son automáticos en producción.
* **Promociones y Becas:** Simplificado como un descuento porcentual directo al momento de realizar la inscripción express.
