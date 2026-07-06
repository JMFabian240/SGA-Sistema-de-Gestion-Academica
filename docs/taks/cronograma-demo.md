# Cronograma de Desarrollo - Demo 2ª Vuelta (5 Días)

Este archivo sirve para llevar el control diario del progreso hacia la segunda demo funcional y autoevaluada por el cliente. **El agente no editará este archivo automáticamente; solo se actualizará bajo indicación explícita del usuario.**

---

## 📊 Tabla de Progreso Diario

| Día | Módulo / Tarea | Estado | Pendientes / Notas |
| :--- | :--- | :---: | :--- |
| **Lunes (Día 1)** | **Configuración Escolar & Precios:**<br>• CRUD de Ciclos Escolares (Tabla, creación, edición y eliminación lógica).<br>• CRUD de Tarifas (Listar, filtrar por ciclo/nivel y modificar montos). | `[ ]` Completado<br>`[ ]` En Proceso | |
| **Martes (Día 2)** | **Control de Acceso & Inscripción:**<br>• CRUD de Usuarios y Roles (RBAC básico: directores, cajeros).<br>• Flujo de Inscripción Express (Botón/modal en Ficha del Alumno para ligar a ciclo y plan de pago, generando adeudos automáticos). | `[ ]` Completado<br>`[ ]` En Proceso | |
| **Miércoles (Día 3)**| **Caja y Pagos - Interfaz & Lógica:**<br>• UI de Caja de Cobro premium (buscador de tutores/alumnos y listado de adeudos).<br>• Lógica interactiva en React/Zustand (selección múltiple, abonos parciales y cálculo de cambio/saldo a favor). | `[ ]` Completado<br>`[ ]` En Proceso | |
| **Jueves (Día 4)** | **Caja y Pagos - Backend & Comprobante:**<br>• Conexión de cobro con la mutación transaccional `registrarPago`.<br>• Generación e impresión de ticket digital básico. | `[ ]` Completado<br>`[ ]` En Proceso | |
| **Viernes (Día 5)** | **Estabilidad y Pulido Visual:**<br>• Pruebas de integración E2E (flujo completo de prueba).<br>• Pulido estético de Tailwind v4, transiciones y manejo de errores elegantes en UI. | `[ ]` Completado<br>`[ ]` En Proceso | |

---

## 📝 Notas de Control de Alcance
* **Respaldo de Base de Datos:** Excluido de la demo funcional por complejidad de infraestructura en Tauri. Se representará con un aviso informativo estático en configuración indicando que los respaldos son automáticos en producción.
* **Promociones y Becas:** Simplificado como un descuento porcentual directo al momento de realizar la inscripción express.
