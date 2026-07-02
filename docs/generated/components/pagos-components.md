# Componentes del Módulo de Pagos (Caja y Finanzas)

Este documento detalla la estructura implementada para el módulo `pagos` en `@sga/front`, el cual maneja el ecosistema financiero base (Tarifas, Generación de Adeudos y Caja).

## Rutas Asociadas (Nested Routing)
El enrutador inyecta un Layout principal en `/pagos` y renderiza sub-vistas:
- `/pagos` -> Renderiza `RegistroPagoPage` (Caja)
- `/pagos/adeudos` -> Renderiza `AdeudosListPage`
- `/pagos/tarifas` -> Renderiza `TarifasListPage`

## Layout

### `PagosLayout`
- **Ubicación:** `src/modules/pagos/layouts/PagosLayout/PagosLayout.tsx`
- **Propósito:** Contenedor de navegación local que provee el menú horizontal de pestañas: Caja, Estado de Cuenta (Adeudos) y Catálogo de Tarifas.

## Páginas y Modales

### 1. Caja (Registro de Pagos)
- **Página:** `RegistroPagoPage.tsx`
- **Flujo de Trabajo:** 
  1. Utiliza `trpc.alumnos.getAll` para cargar un dropdown de Alumnos.
  2. Al seleccionar un alumno, carga dinámicamente sus adeudos impagos (PENDIENTES y VENCIDOS) mediante `trpc.pagos.getAdeudos`.
  3. Muestra una tabla con `checkboxes`. Al palomear filas, calcula reactivamente con `useMemo` la suma a liquidar (`montoTotal`).
  4. Envía un arreglo de `aplicaciones` al método `registrarPago` asumiendo por defecto que abonan al `CAPITAL`.
  5. Se limpian los checkboxes y recarga el historial de adeudos inmediatamente después de liquidar.

### 2. Estado de Cuenta (Adeudos y Calendario)
- **Página:** `AdeudosListPage.tsx` -> Replicando el comportamiento de caja, solicita seleccionar a un Alumno (buscador simulado por ahora con dropdown) para cargar su historial individual.
- **Modal:** `AdeudoFormModal.tsx` -> Permite forzar la creación manual de un adeudo para un alumno. Es útil para generar adeudos de índole única (ej. "Reposición de Credencial") o editar el monto/vencimiento de adeudos creados por lotes por el backend.

### 3. Catálogo de Tarifas
- **Página:** `TarifasListPage.tsx` -> Muestra el catálogo general de precios.
- **Modal:** `TarifaFormModal.tsx` -> Cruza los catálogos `getCiclos` y `getNiveles` de TRPC para asociar un monto y un concepto (ej. Inscripción, Colegiatura) a un grado y ciclo en particular. 

## Estilos
Se crearon estilos a la medida en `RegistroPagoPage.module.css` usando Flexbox y un layout "Split" (panel de historial a la izquierda y ticket/resumen fijo a la derecha) para simular la experiencia de Punto de Venta.
