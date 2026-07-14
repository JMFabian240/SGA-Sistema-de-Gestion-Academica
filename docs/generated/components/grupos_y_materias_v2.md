# Documentación del Módulo: Grupos y Materias (packages/front-end)

Este módulo gestiona la estructura de grupos y el catálogo de asignaturas del Colegio San Diego en la nueva interfaz unificada.

---

## 1. Estructura de Archivos

El módulo de Grupos se encuentra organizado de la siguiente manera dentro del frontend:

```text
packages/front-end/src/modules/grupos/
├── components/
│   ├── GrupoFormModal.tsx           # Creación y edición de un grupo individual
│   ├── InicializarGruposModal.tsx   # Configuración y selección de grupos a inicializar
│   └── MateriaFormModal.tsx         # Creación y edición de una asignatura (Materia)
└── pages/
    └── GruposListPage.tsx           # Vista principal con navegación por pestañas (Tabs)
```

---

## 2. Anatomía de los Componentes

### A. Página de Listado (`GruposListPage.tsx`)
Presenta un diseño de pestañas estructurado:

1.  **Pestaña Grupos:**
    *   **Filtros de Entrada:** Integra un selector del ciclo escolar que carga automáticamente el ciclo activo inicial, y una barra de búsqueda para filtrar grupos de forma reactiva en el cliente.
    *   **Botón "Inicializar Ciclo":** Abre el modal de configuración por lotes para el ciclo escolar seleccionado.
    *   **Botón "Nuevo Grupo":** Abre el modal del formulario manual.
    *   **Tabla:** Lista las propiedades del grupo (`Nombre`, `Nivel Educativo`, `Grado`, `Cupo`, `Estado`). Los botones de acción (Editar y Eliminar) se bloquean automáticamente si el estado de grupo pasa a cerrado (`g.cerrado === true`).
2.  **Pestaña Materias:**
    *   **Filtros:** Barra de búsqueda que filtra de forma simultánea por el campo `clave` o `nombre` de la asignatura.
    *   **Botón "Nueva Materia":** Abre el formulario de registro de materias.
    *   **Tabla:** Muestra la Clave, Nombre de la Materia y el Grado Escolar asociado.

### B. Modal de Inicialización (`InicializarGruposModal.tsx`)
Permite definir qué grupos arrancar al inicio del ciclo escolar basándose en el catálogo de grados permitidos del periodo:
*   Muestra únicamente los grados que **no tienen** grupos en el ciclo escolar seleccionado.
*   Proporciona una fila con checkbox, columna con nombre propuesto (input de texto editable) y capacidad inicial (input numérico editable).
*   Mapea los datos dinámicamente y los procesa vía mutación a tRPC.

### C. Modal de Grupo (`GrupoFormModal.tsx`)
Formulario unitario para crear/editar grupos individuales.
*   **Selección en Cascada (Cascading Select):** Al seleccionar un nivel educativo (ej. Primaria), se filtra reactivamente el dropdown de Grados para evitar asignaciones inconsistentes (ej. asignar 1º de Secundaria a un grupo de Primaria).

### D. Modal de Materia (`MateriaFormModal.tsx`)
Formulario unitario para crear/editar materias globales.
*   Permite asociar opcionalmente la materia a un Grado. Las materias sin grado asignado se consideran materias generales o extracurriculares.

---

## 3. Estilos y Sistema de Diseño

El módulo adopta el **Colegio San Diego Design System** (`navy-800` para estructura, `crimson` en acentos, espaciados consistentes y radios de tarjeta `rounded-2xl`):
*   **Contenedor de Listados:** `bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden` (tarjetas limpias sin sombras intrusivas).
*   **Interactividad:** Todos los botones de acción cuentan con transiciones de color suavizadas (`transition-colors duration-300`) y estados de hover correspondientes.
*   **Selectores de Fila:** Checkboxes redondeados con bordes integrados en el tema de la marca (`text-blue-600 focus:ring-blue-500`).
