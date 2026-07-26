# RF-42b: Inicializar grupos masivamente

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-42b: Inicializar grupos masivamente |
| **Actor** | Administrador y Gestor Administrativo |
| **Objetivo** | Crear y estructurar de forma simultánea los grupos académicos (A, B, etc.) asociados a los grados de un ciclo escolar seleccionado para iniciar el periodo lectivo en el sistema. |
| **Flujo Principal** | 1. El actor ingresa al módulo de Gestión Académica y selecciona la opción "Inicialización de Grupos".<br>2. El actor elige el ciclo escolar activo o próximo a iniciar.<br>3. El actor selecciona los niveles educativos y grados en los que se crearán grupos.<br>4. El actor hace clic en "Inicializar Grupos".<br>5. El sistema procesa la solicitud, genera los grupos en la base de datos y muestra una confirmación de éxito. |
| **Flujo Alterno** | <b>A.</b> Grupos ya inicializados:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si para el ciclo escolar y grado seleccionado ya existen grupos activos, el sistema emite un aviso para prevenir duplicidad.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. El actor confirma si desea crear grupos adicionales o aborta la operación. |
| **Precondiciones** | El ciclo escolar y los niveles/grados educativos deben existir previamente en el catálogo del sistema. |
| **Postcondiciones** | Los grupos académicos quedan creados y disponibles para matricular alumnos o asociar materias. |
| **Reglas de negocio involucradas** | • La inicialización masiva está restringida a Administrador y Gestor Administrativo.<br>• Cada grupo se crea con su cupo predeterminado según la política institucional. |
