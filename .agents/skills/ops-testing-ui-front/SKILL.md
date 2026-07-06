---
name: ops-testing-ui-front
description: Usa esta skill al escribir o modificar pruebas de componentes de UI y páginas en el frontend con React, Testing Library y Vitest.
---
# Frontend UI Testing (ops-testing-ui-front)

Esta skill define los estándares para probar la interfaz de usuario en el frontend del SGA.

## Directrices Generales
- Las pruebas de frontend se ejecutan bajo un entorno virtual del navegador (JSDOM).
- Se prioriza la interacción del usuario real sobre la verificación del estado interno.
- Archivos de prueba al lado de sus componentes con el sufijo `.test.tsx`.

## Framework y Utilidades
- **Runner:** Vitest.
- **Render:** `@testing-library/react`.
- **Interacciones:** `@testing-library/user-event` (preferiblemente instanciado con `userEvent.setup()`).

## Proveedores y Envolturas (Mocks de Contexto)
- Los componentes de UI suelen depender de contextos globales (tRPC, Temas, Autenticación).
- Debes envolver el componente en la prueba con los proveedores correspondientes, o crear una función helper `renderWithProviders`.
- Ejemplo de Mock de tRPC en tests:
  ```typescript
  vi.mock('../../utils/trpc', () => ({
    trpc: {
      alumnos: {
        getAll: {
          useQuery: () => ({ data: mockAlumnos, isLoading: false })
        }
      }
    }
  }));
  ```
