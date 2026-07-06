---
name: ops-testing-unit-back
description: Usa esta skill al escribir, modificar o refactorizar pruebas unitarias del backend utilizando Vitest y simulando base de datos (Prisma mock) y repositorios.
---
# Backend Unit Testing (ops-testing-unit-back)

Esta skill define el estándar para escribir pruebas unitarias en el backend de SGA, enfocándose en la lógica de negocio y aislando las llamadas externas.

## Directrices Generales
- Las pruebas unitarias se ejecutan en memoria, **nunca** deben tocar la base de datos real.
- El tiempo de ejecución por archivo de prueba debe ser inferior a 100ms.
- Ubicación de las pruebas: Junto al archivo de servicio, con el sufijo `.test.ts` (ej. `usuarios.service.test.ts`).

## Mocks de Base de Datos y Repositorios
1. **Mock de Prisma:**
   - Importa `prismaMock` desde `tests/setup/prisma-mock`.
   - Utiliza `mockResolvedValue` para simular retornos exitosos o `mockRejectedValue` para fallos.
   - Si se usa `findFirst`, mockea `findFirst` (y no `findUnique`).
2. **Mock de Repositorios:**
   - Si el servicio que estás probando depende de un `Repository`, debes mockear la clase del repositorio usando `vi.spyOn(Repository, 'methodName')`.
   - Ejemplo:
     ```typescript
     import { UsuariosRepository } from './usuarios.repository';
     vi.spyOn(UsuariosRepository, 'getRoles').mockResolvedValue([...]);
     ```

## Mocks de Módulos Externos
- Utiliza `vi.mock()` en la parte superior del archivo para librerías de terceros (como `bcryptjs`, `jsonwebtoken`, `nodemailer`).
- Restablece los mocks en `beforeEach` usando `vi.clearAllMocks()`.
