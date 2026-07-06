---
name: ops-testing-security
description: Usa esta skill al evaluar y probar aspectos de seguridad del SGA, incluyendo autenticación, autorización basada en roles (RBAC) y sanitización.
---
# Security Testing (ops-testing-security)

Esta skill regula los estándares de validación de seguridad del sistema SGA para mitigar riesgos de filtración de información o manipulación de accesos.

## Puntos de Validación Críticos
1. **Control de Acceso (RBAC):**
   - Asegurar que los procedimientos del backend usen `protectedProcedure` (y no `publicProcedure`) para cualquier dato sensible.
   - Probar que un usuario con rol de `DOCENTE` o `TUTOR` no pueda invocar servicios de `ADMINISTRATIVO` (ej. crear usuarios, modificar tarifas globales).
2. **Autenticación:**
   - Validar que los tokens JWT expiren correctamente (12 horas por defecto).
   - Validar que los tokens revocados en `logout` no puedan ser reutilizados (tabla `TokenRevocado`).
3. **Bloqueo de Cuentas:**
   - Probar que después de 5 intentos fallidos de contraseña en `login`, el usuario sea bloqueado temporalmente por 15 minutos.
4. **Sanitización de Datos:**
   - Prevenir inyección SQL asegurando el uso del query builder parametrizado de Prisma (evitar query strings raw).
   - Validar las entradas de datos en el cliente y servidor mediante schemas estrictos de Zod.
