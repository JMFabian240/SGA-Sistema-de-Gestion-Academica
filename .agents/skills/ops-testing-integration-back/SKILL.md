---
name: ops-testing-integration-back
description: Usa esta skill al escribir o correr pruebas de integración en el backend que utilicen una base de datos real (sga_test).
---
# Backend Integration Testing (ops-testing-integration-back)

Esta skill cubre las pautas para diseñar y correr pruebas de integración en el backend, las cuales interactúan directamente con la base de datos de pruebas.

## Directrices Generales
- Las pruebas de integración validan que los diferentes componentes (servicios, repositorios y base de datos) interactúen de forma correcta.
- Se ejecutan apuntando a la base de datos local de pruebas `sga_test`.
- Deben ser deterministas y limpiar sus efectos secundarios después de correr.

## Ciclo de Vida de Base de Datos y Datos Semilla (Seeds)
- Antes de iniciar la suite de pruebas, la base de datos debe ser migrada al estado más reciente (`npx prisma migrate reset --force` en el entorno de pruebas).
- Utiliza hooks `beforeAll` y `afterAll` de Vitest para establecer conexiones seguras y truncar tablas si es necesario.
- Inserta datos semilla controlados para escenarios comunes.

## Invocación con tRPC
- En lugar de levantar un servidor HTTP completo y hacer llamadas REST, utiliza el `createCaller` de tRPC.
- Esto permite invocar los procedimientos de los routers directamente pasando un contexto simulado (con permisos y usuario autenticado).
- Ejemplo:
  ```typescript
  const caller = appRouter.createCaller({
    prisma,
    user: mockAdminUser,
    token: 'mock-token',
    req: {} as any,
    res: {} as any
  });
  const res = await caller.usuarios.getRoles();
  ```
