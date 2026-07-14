---
name: arch-pipeline
description: >
  Orquesta la implementación completa de una nueva funcionalidad en el SGA
  siguiendo los principios de Arquitectura Limpia (Clean Architecture).
  SOLO activa esta skill cuando el cambio afecta MÁS DE UNA capa del
  sistema simultáneamente: por ejemplo, cuando se necesite crear o modificar
  tanto el backend (tRPC/BD) como el frontend (React) al mismo tiempo, o
  cuando el usuario pida un módulo, flujo o funcionalidad nueva de extremo
  a extremo. NO usar para cambios aislados de UI (usa `front-sga-design` y `front-react-trpc`),
  ni para cambios aislados de backend (usa `back-fastify-trpc`), ni solo de base de datos
  (usa `back-database`).
---

# Skill: Arquitectura Limpia — Implementación End-to-End (SGA)

Actúa como un Tech Lead Full-Stack experto en la arquitectura del SGA.
Esta skill define el pipeline obligatorio para implementar cualquier
funcionalidad nueva, desde la idea hasta el código funcionando, sin saltarse
pasos ni capas.

---

## Pipeline de Implementación

Antes de escribir una sola línea de código, ejecuta las siguientes fases
**en orden estricto**. No avances a la siguiente fase sin haber completado
la anterior o sin aprobación explícita del usuario.

---

### FASE 1 — Diseño (No tocar código)

**Objetivo:** Definir QUÉ se construye antes de saber CÓMO.

1. **Clarificar el requerimiento**: Si el usuario no especificó actor,
   objetivo concreto y resultado esperado, pregunta lo mínimo necesario
   antes de continuar. No inventes ni asumas.

2. **Generar Requerimiento Funcional (RF)**: Usa el patrón de la skill
   `ooad-generador-requisitos`. Cada acción atómica = un RF separado.
   ```
   RF-XX: [Actor] debe poder [Acción] el [Objeto], ingresando [Datos], para [Resultado].
   ```

3. **Pipeline de diagramas (si aplica):** Para funcionalidades complejas o
   nuevos módulos, sigue el flujo de análisis antes de escribir código:
   - `escenarios-cu` → Tabla formal del caso de uso.
   - `robustness-diagrams` → Diagrama Boundary/Control/Entity (.puml).
   - `diagramas-de-secuencia` → Interacciones técnicas entre capas (.puml).
   - `diagramas-de-clases` → Modelo de dominio OOP (.puml).
   > Este pipeline es **opcional para correcciones o features pequeñas**
   > y **obligatorio para módulos nuevos completos**.

4. **Definir el Mockup o Wireframe**: Si la funcionalidad tiene interfaz
   de usuario, genera primero un wireframe textual usando la skill
   `front-sga-design` antes de tocar React. El wireframe debe describir:
   - Distribución de la pantalla conforme al layout oficial (sidebar + contenido).
   - Componentes necesarios (tablas, formularios, cards, modales).
   - Estados de la UI (cargando, vacío, con datos, error).
   - Asegurarse de que colores, tipografía y espaciado sigan el Design System.

5. **Pedir aprobación** del wireframe y del RF al usuario antes de
   continuar a la Fase 2.

---

### FASE 2 — Base de Datos

**Objetivo:** Asegurar que el esquema de datos soporte la funcionalidad.
Usa las reglas de la skill `back-database`.

1. Revisar `packages/data-access/prisma/schema.prisma` para identificar
   si los modelos y relaciones necesarios ya existen.

2. Si faltan modelos o campos, agregarlos al `schema.prisma` siguiendo
   las convenciones del proyecto (UUIDs, `eliminadoEn` para soft-delete,
   relaciones con `onDelete` explícito).

3. Ejecutar la migración con nombre descriptivo:
   ```
   npx prisma migrate dev --name add_[tabla]_[campo]
   ```

4. Verificar que `packages/data-access/src/index.ts` exporte los tipos
   necesarios para que los paquetes consumidores (`back-end`) puedan usarlos.

---

### FASE 3 — Backend

**Objetivo:** Exponer la funcionalidad como endpoint tRPC.
Usa las reglas de la skill `back-fastify-trpc` (Backend tRPC Pattern) y aplica los
principios de la skill `arch-clean-code` a todo el código generado.

Crea o modifica los siguientes archivos en `packages/back-end/src/modules/[modulo]/`:

1. **`[modulo].schema.ts`** — Validación Zod de inputs y outputs.
   ```ts
   // Solo Zod. Sin lógica de negocio.
   export const CrearAlumnoInput = z.object({ ... });
   ```

2. **`[modulo].service.ts`** — Lógica de negocio pura.
   ```ts
   // Solo lógica. Importa prisma de @sga/data-access.
   // Usa $transaction si modifica múltiples tablas.
   // Usa soft-delete (eliminadoEn) en lugar de delete.
   ```

3. **`[modulo].router.ts`** — Procedimiento tRPC.
   ```ts
   // Usa protectedProcedure si requiere autenticación.
   // Delega inmediatamente al service, sin lógica aquí.
   ```

4. **Registrar** el nuevo router en `packages/back-end/src/router.ts`.

**Checklist de calidad de código (obligatorio, basado en `arch-clean-code`):**
- [ ] SRP: cada clase/función tiene una única responsabilidad.
- [ ] No hay lógica de negocio en el router (solo delegar al service).
- [ ] No hay consultas Prisma en el router (solo en el service).
- [ ] Los errores se lanzan con `TRPCError`, no con `throw new Error()` genérico.
- [ ] Sin uso de `any`. Todos los tipos son inferidos o declarados explícitamente.

---

### FASE 4 — Frontend

**Objetivo:** Construir la interfaz de usuario en `packages/front-end`.
Usa las reglas de la skill `front-react-trpc` (Front-End Skill) **y** la skill `front-sga-design`
para garantizar la identidad visual del sistema.

Estructura a crear en `packages/front-end/src/modules/[modulo]/`:

```
[modulo]/
├── pages/
│   └── [Modulo]Page.tsx       ← Página principal (registrada en el router)
├── components/
│   └── [Componente]/
│       ├── [Componente].tsx   ← Componente específico del módulo
│       └── index.ts
└── hooks/
    └── use[Modulo].ts         ← Lógica reactiva (tRPC queries/mutations)
```

**Reglas de construcción:**

- Toda llamada al backend va exclusivamente a través de tRPC (sin fetch manual).
- Los hooks personalizados centralizan la lógica de llamadas API.
  ```ts
  // hooks/useAlumnos.ts
  export function useAlumnos() {
    const lista = trpc.alumnos.listar.useQuery();
    const crear = trpc.alumnos.crear.useMutation();
    return { lista, crear };
  }
  ```
- Las páginas son "contenedores finos": importan hooks y componentes,
  no contienen lógica de negocio ni llamadas directas a tRPC.
- Registrar la nueva ruta en `packages/front-end/src/router/index.tsx`.
- Agregar el enlace al menú lateral en `packages/front-end/src/components/layout/Sidebar.tsx`.

**Checklist de diseño (obligatorio, basado en `front-sga-design`):**
- [ ] Colores: solo de la paleta Navy / Crimson / grises neutros.
- [ ] Fuente: Inter (`font-sans`), sin otras familias tipográficas.
- [ ] Tablas: patrón `bg-white rounded-2xl shadow-sm border border-gray-100`.
- [ ] Botones: variantes definidas, sin estilos ad-hoc.
- [ ] Espaciado: `p-8` de página, `p-6` en cards, `px-6 py-4` en celdas.
- [ ] Animaciones: `transition-colors` en interactivos, `animate-in fade-in` en páginas.

---

### FASE 5 — Pruebas

**Objetivo:** Verificar que la funcionalidad funciona correctamente.
Usa las reglas de la skill `ops-testing`.

- Escribir al menos una prueba unitaria para el **service** del backend,
  usando el mock de Prisma (`vitest-mock-extended`).
- Verificar manualmente en el navegador los flujos principales del mockup
  (datos cargando, formulario enviando, errores mostrándose).

---

### FASE 6 — Integración y Cierre

1. **Verificar** que no hay errores de TypeScript (`tsc --noEmit`).
2. **Hacer commit** con un mensaje en español describiendo el contexto
   y propósito del cambio (sin listar archivos modificados).
3. **Hacer push** a la rama activa.

---

## Árbol de Decisión Rápido

| Pregunta | Acción |
|---|---|
| ¿El cambio toca solo UI? | **No usar esta skill** → usar `front-sga-design` + `front-react-trpc` |
| ¿El cambio toca solo backend? | **No usar esta skill** → usar `back-fastify-trpc` |
| ¿El cambio toca solo BD? | **No usar esta skill** → usar `back-database` |
| ¿Toca 2+ capas? | ✅ Usar esta skill, ejecutar todas las fases |
| ¿Tiene UI? | Wireframe obligatorio en Fase 1 con `front-sga-design` |
| ¿Requiere nuevos datos en BD? | Fase 2 completa con migración Prisma |
| ¿Afecta autenticación? | Usar `protectedProcedure` en Fase 3 |

---

## Ejemplo de Activación

**Entrada:** "Quiero agregar una pantalla para registrar pagos de alumnos"

**Flujo esperado:**
1. Crear RF: `RF-XX: El gestor debe poder registrar un pago de un alumno...`
2. Generar wireframe textual de la pantalla de registro de pagos.
3. Verificar/añadir modelo `Pago` en `schema.prisma`.
4. Crear `pagos.service.ts`, `pagos.schema.ts`, `pagos.router.ts`.
5. Crear `PagosPage.tsx`, `FormularioPago.tsx`, `usePagos.ts`.
6. Registrar ruta y enlace en sidebar.
7. Prueba unitaria del service de pagos.
8. Commit + push.
