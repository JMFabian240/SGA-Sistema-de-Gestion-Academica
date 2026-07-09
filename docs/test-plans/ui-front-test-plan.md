# Plan de Pruebas de Interfaz (UI Frontend) - SGA

## 1. Propósito
El propósito de las pruebas de interfaz (UI Frontend) es validar el renderizado gráfico, la responsividad de los layouts, el manejo del estado local del cliente de la aplicación web SGA y la correcta interacción de los componentes visuales (como tablas, botones, formularios e inputs) de forma aislada y controlada, sin depender de la consistencia del servidor real.

## 2. Alcance y Priorización de Calidad
Cubre todos los flujos de experiencia de usuario en la aplicación web del frontend:
* **Layouts y Responsividad**: Renderizado correcto y adaptabilidad de pantallas en resoluciones Desktop (1080p), Tablet y Mobile.
* **Componentes de Entrada de Datos**: Validaciones de formularios en vivo, límites de inputs de calificaciones (numérico/cualitativo), botones de acción y loaders.
* **Flujos de Navegación Visual**: Transición entre pantallas, modales de confirmación de pagos y visualización de reportes tabulares.
* **Estados de la Interfaz**: Manejo correcto de estados vacíos (*Empty States*), estados de carga (*Loading States*) y pantallas de error de red.

> [!IMPORTANT]
> **Estrategia de Construcción: Módulo por Módulo**
> Para priorizar la **calidad en el diseño y comportamiento de la interfaz**, las pruebas de UI del frontend se desarrollarán estrictamente **módulo por módulo** (ej. UI de Alumnos, UI de Calificaciones, etc.). El objetivo primario es garantizar que no ocurran layouts rotos, elementos superpuestos o pérdidas de interactividad, evitando acelerar el desarrollo a expensas de la robustez de los tests visuales.

## 3. Estrategia y Entorno
* **Framework**: Vitest + React Testing Library + Happy-DOM.
* **Entorno**: Ejecución aislada simulación de entorno de navegador ligero con Happy-DOM. Las llamadas y dependencias del backend (tRPC y TanStack Query) se mockean mediante mocks de Vitest (`vi.mock`) o interceptando peticiones, garantizando que no se requiera servidor activo para los tests de interfaz.
* **Aislamiento**: Las pruebas se centran puramente en la UI; las peticiones al backend se interceptan y devuelven respuestas predefinidas (tanto respuestas exitosas como errores HTTP/tRPC) para validar cómo responde la interfaz gráficamente a cada escenario del servidor.

## 4. Tipos de Casos a Cubrir
1. **Comportamiento Visual del Estado de Carga**: Comprobar que al disparar una acción de carga lenta de datos (ej. Generar boleta o reporte de ingresos), los botones y formularios muestren loaders y se deshabiliten para impedir clics múltiples del usuario.
2. **Casos Límite de Renderizado**: Cargar tablas de estudiantes o transacciones financieras con grandes volúmenes de datos o descripciones extremadamente largas para validar que la UI no se rompa ni presente problemas de desbordamiento horizontal/vertical.
3. **Manejo de Errores de API (Resiliencia de UI)**: Simular la desconexión del backend o el rechazo de credenciales, y verificar que la interfaz de usuario capture el error y muestre banners claros de alerta sin crashear la página completa de la aplicación.
4. **Accesibilidad e Interacción de Teclado**: Validar el correcto comportamiento de navegación mediante tabulaciones del teclado en formularios críticos (inscripciones, cobros y captura de notas).

## 5. Casos de Uso Reales (Escenarios de UI)

### Módulo de Autenticación (`LoginPage.tsx`)
- **Escenario 1 (Validación en vivo):** Dejar los campos vacíos y dar clic en "Iniciar Sesión". Validar que aparezcan los mensajes de error de Zod bajo los inputs de usuario y contraseña.
- **Escenario 2 (Cargando):** Al dar clic con datos válidos, comprobar que el botón de submit cambie a estado deshabilitado y muestre un spinner mientras la petición tRPC esté activa.
- **Escenario 3 (Resiliencia):** Simular una respuesta fallida de tRPC (ej. "Credenciales incorrectas") y verificar que se renderice una alerta visual roja con el mensaje de error del servidor.

### Módulo de Alumnos y Tutores (`AlumnosForm.tsx`)
- **Escenario 1 (Validaciones estrictas):** Ingresar una CURP con formato incorrecto y comprobar que el formulario muestre inmediatamente un mensaje de error y bloquee la confirmación.
- **Escenario 2 (Modo Edición):** Renderizar el componente pasando un alumno cargado. Verificar que todos los campos del formulario se inicialicen con los datos correspondientes del alumno.

### Módulo de Inscripción Express (`InscripcionExpressModal.tsx`)
- **Escenario 1 (Camino Nominal):** Llenar el formulario del modal seleccionando Ciclo, Plan de Pago y Grupo. Verificar que el botón de confirmación se active.
- **Escenario 2 (Error Académico):** Simular que la petición de inscripción retorne un error `FORBIDDEN` por materias reprobadas. Comprobar que el modal no se cierre y muestre un banner explicativo detallando la situación académica del estudiante.

### Módulo de Caja de Cobro (`CajaCobro.tsx`)
- **Escenario 1 (Selección Múltiple):** Renderizar una lista de adeudos pendientes. Al marcar varios checkboxes, validar en tiempo real que el componente calcule correctamente la suma total a pagar.
- **Escenario 2 (Saldo a Favor):** Marcar un adeudo de $1000 y capturar un pago de $1500. Validar que la interfaz notifique al cajero visualmente que se generarán $500 de "Saldo a Favor" para el tutor.

### Módulo de Calificaciones (`CapturaCalificaciones.tsx`)
- **Escenario 1 (Límites de notas):** Intentar escribir una nota mayor a 10.0 o menor a 0.0 en los inputs y comprobar que el componente fuerce el valor a los límites o muestre error de rango.
- **Escenario 2 (Materias NA):** Seleccionar una materia tipo taller y verificar que cambie el tipo de input de numérico a un selector cualitativo (Acreditado / No Acreditado).

---

## 6. Criterios de Aceptación
* 100% de los componentes web interactivos clave deben contar con aserciones sobre su visibilidad, estado deshabilitado/habilitado y transiciones de carga.
* No deben existir layouts rotos o elementos invisibles/ocultos que impidan la usabilidad del sistema en navegadores móviles (Safari, Chrome Mobile) y de escritorio (Chrome, Firefox, Edge).
* Todos los modales interactivos y diálogos de advertencia deben cerrarse y retornar el foco al botón originador de forma limpia.
