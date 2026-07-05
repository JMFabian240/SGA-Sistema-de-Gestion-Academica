---
name: ops-testing
description: Usa esta skill cuando se te pida escribir, modificar o documentar pruebas unitarias o de integración en el frontend o backend, o configurar mocks (ej. Prisma mock).
---
# Testing Skill

Estandariza la creación y manejo de pruebas (Vitest) para asegurar calidad y cobertura en todos los paquetes del sistema SGA.

## Reglas Generales
- Las pruebas del frontend usan `@testing-library/react` y `vitest`.
- Las pruebas del backend se separan en unitarias (con Prisma Mock) y de integración (con BD real `sga_test`).
- Todos los reportes generados deben ir estrictamente a `docs/generated/test-reports/[tipo]/`.

## Mocks de Prisma (Backend Unit Tests)
- Importa la instancia de `prisma` desde `@sga/data-access`.
- Utiliza `vitest-mock-extended` para falsear el ORM.
- **Formato esperado**: Configurar el mock antes de las pruebas y usar `mockResolvedValue` para devolver valores estáticos sin tocar la BD real.

## Aislamiento de tRPC
- Para probar endpoints de tRPC, se debe probar el contexto y los procedimientos (routers) utilizando las funciones de `createCaller` de tRPC en lugar de levantar un servidor HTTP completo, a menos que sea una prueba E2E.
