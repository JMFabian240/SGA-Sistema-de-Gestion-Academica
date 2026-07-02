# Componentes del Módulo Grupos y Catálogos Académicos

Este documento detalla la estructura implementada para el módulo `grupos` en `@sga/front`, el cual centraliza la gestión de la estructura académica del colegio utilizando Modales superpuestos y Pestañas.

## Rutas Asociadas (Nested Routing)
El enrutador inyecta un Layout principal en `/grupos` y renderiza sub-vistas:
- `/grupos` -> Renderiza `GruposListPage`
- `/grupos/ciclos` -> Renderiza `CiclosListPage`
- `/grupos/niveles` -> Renderiza `NivelesListPage`
- `/grupos/materias` -> Renderiza `MateriasListPage`

## Layout

### `GruposLayout`
- **Ubicación:** `src/modules/grupos/layouts/GruposLayout/GruposLayout.tsx`
- **Propósito:** Actúa como contenedor de navegación local. Muestra un menú de pestañas horizontal basado en `NavLink` de React Router y renderiza el contenido inferior mediante `<Outlet />`.

## Páginas y Modales

### 1. Grupos
- **Página:** `GruposListPage.tsx` -> Muestra la tabla principal con todos los grupos y sus catálogos cruzados (ej. "1ro A - Primaria - 2025").
- **Modal:** `GrupoFormModal.tsx` -> Integra `<select>` atados a `getCiclos` y `getNiveles` vía tRPC. Permite asociar un Grupo a un Nivel y a un Ciclo específicos estableciendo su cupo máximo.

### 2. Ciclos Escolares
- **Página:** `CiclosListPage.tsx` -> Lista los ciclos.
- **Modal:** `CicloFormModal.tsx` -> Formulario que procesa fechas nativas del navegador (`type="date"`) en strings `YYYY-MM-DD` que el backend entiende mediante Zod.

### 3. Niveles Educativos
- **Página:** `NivelesListPage.tsx` -> Catálogo base (Primaria, Secundaria, etc.).
- **Modal:** `NivelFormModal.tsx` -> Formulario para establecer el nombre, código interno (ej. PRI), número de RVOE (si aplica) y orden jerárquico.

### 4. Materias
- **Página:** `MateriasListPage.tsx` -> Listado de materias disponibles.
- **Modal:** `MateriaFormModal.tsx` -> Formulario con `nombre` y `clave`.

## Integración TRPC
Cada Modal contiene localmente su propia mutación tRPC (ej. `createNivel`, `updateNivel`) utilizando `onSuccess: () => utils.grupos.getNiveles.invalidate()` para cerrar el modal y disparar una actualización automática en la tabla subyacente de la página correspondiente. No requieren un manejador de estado global.
