---
name: sync-prisma-zod
description: Sincroniza los esquemas de Prisma con los esquemas de validación Zod en el backend, previniendo errores de tipado.
---

# Sync Prisma Zod Skill

## Propósito
Esta habilidad asegura que la fuente de verdad (Prisma schema) y la capa de validación (Zod en Fastify) estén 100% alineadas. Los errores por campos faltantes o `enums` desincronizados deben prevenirse automáticamente.

## Cuándo usar
Utiliza esta skill siempre que modifiques `schema.prisma` en `packages/data-access` o cuando la consola devuelva errores tipo `TS2345: Argument of type ... is not assignable to parameter of type` relacionados a modelos de la BD.

## Procedimiento
1. **Analizar la fuente:** Abre y lee `packages/data-access/prisma/schema.prisma`.
2. **Localizar diferencias:** Extrae manualmente todos los `enum` y compáralos con los archivos `*.schema.ts` dentro de `packages/back-end/src/modules/*/`.
3. **Actualizar Zod:** Si un `enum` de Prisma tiene nuevos valores, reescribe el `z.enum([...])` correspondiente agregando los valores faltantes.
4. **Verificar tipado:** Tras sincronizar, siempre debes ejecutar `npx prisma generate` en `packages/data-access` y luego `npm run build` en el backend para confirmar que todo TypeScript compile limpiamente.
