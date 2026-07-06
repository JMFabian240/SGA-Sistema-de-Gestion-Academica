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
* **Framework**: Playwright Component Testing o Vitest + React Testing Library (según corresponda a la tecnología del cliente frontend).
* **Entorno**: Ejecución aislada con un servidor de mocks para las llamadas a la API de tRPC.
* **Aislamiento**: Las pruebas se centran puramente en la UI; las peticiones al backend se interceptan y devuelven respuestas predefinidas (tanto respuestas exitosas como errores HTTP/tRPC) para validar cómo responde la interfaz gráficamente a cada escenario del servidor.

## 4. Tipos de Casos a Cubrir
1. **Comportamiento Visual del Estado de Carga**: Comprobar que al disparar una acción de carga lenta de datos (ej. Generar boleta o reporte de ingresos), los botones y formularios muestren loaders y se deshabiliten para impedir clics múltiples del usuario.
2. **Casos Límite de Renderizado**: Cargar tablas de estudiantes o transacciones financieras con grandes volúmenes de datos o descripciones extremadamente largas para validar que la UI no se rompa ni presente problemas de desbordamiento horizontal/vertical.
3. **Manejo de Errores de API (Resiliencia de UI)**: Simular la desconexión del backend o el rechazo de credenciales, y verificar que la interfaz de usuario capture el error y muestre banners claros de alerta sin crashear la página completa de la aplicación.
4. **Accesibilidad e Interacción de Teclado**: Validar el correcto comportamiento de navegación mediante tabulaciones del teclado en formularios críticos (inscripciones, cobros y captura de notas).

## 5. Criterios de Aceptación
* 100% de los componentes web interactivos clave deben contar con aserciones sobre su visibilidad, estado deshabilitado/habilitado y transiciones de carga.
* No deben existir layouts rotos o elementos invisibles/ocultos que impidan la usabilidad del sistema en navegadores móviles (Safari, Chrome Mobile) y de escritorio (Chrome, Firefox, Edge).
* Todos los modales interactivos y diálogos de advertencia deben cerrarse y retornar el foco al botón originador de forma limpia.
