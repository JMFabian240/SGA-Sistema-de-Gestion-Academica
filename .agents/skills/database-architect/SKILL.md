---
name: database-architect
description: >
  Usa esta skill cuando se te pida diseñar, modificar, migrar o revisar
  esquemas de base de datos, relaciones de tablas, modelos de Prisma,
  diagramas ER, o cualquier operación sobre el paquete @sga/data-access.
  También activa esta skill cuando se deban exportar tipos de Prisma para
  otros paquetes, o al modificar el cliente singleton de Prisma.
---
# Database Architect Skill — @sga/data-access

Garantiza la solidez del esquema PostgreSQL, la normalización de datos,
el singleton del cliente Prisma y el manejo estricto de migraciones en el
paquete `@sga/data-access`. Este paquete es la **única fuente de verdad**
para todo lo relacionado con la base de datos en el monorepo.

---

## 1. Estructura del Paquete

```
packages/data-access/
├── prisma/
│   ├── schema.prisma    ← Todos los modelos del sistema
│   └── migrations/      ← Historial de migraciones generadas
└── src/
    ├── client.ts        ← Singleton de PrismaClient
    └── index.ts         ← Exportaciones públicas (modelos y tipos)
```

**Regla de exportación:** Solo `src/index.ts` exporta hacia el exterior del
paquete. Ningún paquete consumidor importa directamente desde `prisma/`.

---

## 2. Diseño de Esquema (schema.prisma)

- Todos los modelos en `prisma/schema.prisma`. Sin excepción.
- **Nomenclatura:** PascalCase singular para modelos (`Alumno`, no `alumnos`).
- **IDs:** Usar `@default(uuid())` o `@default(autoincrement())` según la entidad.
- **Soft Delete Obligatorio:** Todo modelo que pueda "eliminarse" debe tener
  el campo `eliminadoEn DateTime?`. Nunca usar `prisma.delete()` ni `prisma.deleteMany()`.
- **Relaciones explícitas:** Definir siempre `onDelete` y `onUpdate` con
  justificación documentada en un comentario.

```prisma
model Alumno {
  id          String    @id @default(uuid())
  nombre      String
  matricula   String    @unique
  createdAt   DateTime  @default(now())
  eliminadoEn DateTime?

  // Relación: eliminar alumno NO elimina tutores
  tutores AlumnoTutor[] @relation(onDelete: NoAction)
}
```

---

## 3. Cliente Prisma — Singleton

```typescript
// src/client.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['error', 'warn'] });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- **PROHIBIDO** instanciar `PrismaClient` fuera de `src/client.ts`.
- **OBLIGATORIO** que `DATABASE_URL` solo se lea en este paquete.

---

## 4. Convención de Migraciones

- **Nunca** alterar la BD directamente sin generar una migración.
- Nombre de migración: minúsculas, descriptivo, sin espacios.
  ```
  npx prisma migrate dev --name add_alumno_estado
  npx prisma migrate dev --name update_pago_monto_nullable
  npx prisma migrate dev --name remove_campo_obsoleto
  ```
- Siempre ejecutar `prisma generate` después de cada migración.

---

## 5. Reglas Críticas de Acceso

| Paquete | Acceso a BD permitido |
|---|---|
| `@sga/data-access` | ✅ Es la fuente de verdad |
| `@sga/back-end` | ✅ Solo importa `prisma` desde `@sga/data-access` |
| `@sga/front-end` / `frontend-v2` | ❌ PROHIBIDO |
| `@sga/app-tauri` | ❌ PROHIBIDO (solo orquesta procesos) |
