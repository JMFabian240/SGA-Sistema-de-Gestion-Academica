# Componentes del Módulo Usuarios

Este documento detalla los componentes generados e implementados para el módulo `usuarios` en `@sga/front`.

## Rutas Asociadas
- `/usuarios`: Renderiza `UsuariosListPage`.
- `/usuarios/nuevo`: Renderiza `UsuarioFormPage` en modo de creación.
- `/usuarios/:id/editar`: Renderiza `UsuarioFormPage` en modo de edición.
- `/usuarios/:id`: Renderiza `UsuarioFormPage` pero cargando el estado inicial (podría bloquear campos más adelante para ser solo-lectura).

## Páginas

### `UsuariosListPage`
- **Ubicación:** `src/modules/usuarios/pages/UsuariosListPage/UsuariosListPage.tsx`
- **Propósito:** Muestra un listado de todos los administradores, docentes, y cajeros que tienen acceso al SGA.
- **Componentes UI base usados:** `<Table>`, `<Button>`, `<Badge>`, `<Spinner>`.
- **Integración TRPC:** Utiliza `trpc.usuarios.listarUsuarios.useQuery` para extraer la lista y simular paginación.
- **Acciones:**
  - Botón primario: Navega a `/usuarios/nuevo`
  - Botón secundario en fila: Navega a `/usuarios/:id/editar`.

### `UsuarioFormPage`
- **Ubicación:** `src/modules/usuarios/pages/UsuarioFormPage/UsuarioFormPage.tsx`
- **Propósito:** Formulario híbrido reactivo utilizado tanto para **crear** como para **editar** personal del sistema.
- **Validación:**
  - Emplea `react-hook-form` integrado con Zod (`@hookform/resolvers/zod`).
  - Muestra mensajes de error en línea debajo de cada campo.
- **Campos:**
  1. Nombre Completo
  2. Correo Electrónico
  3. Contraseña (opcional durante edición)
  4. Rol en el Sistema (Administrador, Director, Docente, Cajero)
- **Integración TRPC:**
  - En modo creación, utiliza `trpc.usuarios.crearUsuario.useMutation`.
  - Invalida la query base (`utils.usuarios.listarUsuarios.invalidate()`) para asegurar el refresco de la grilla en el _List Page_.
