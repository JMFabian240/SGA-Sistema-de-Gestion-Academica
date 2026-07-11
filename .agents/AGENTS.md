## Identidad del Proyecto
- Nombre: SGA
- Propósito: Sistema de gestión escolar de escritorio para
  registro de pagos, gestión de alumnos, tutores y calificaciones
- Distribución: instalable único sin requerir Docker, Node.js
  ni PostgreSQL en el equipo del usuario (Tauri Sidecars)

## Rol del Agente
- El modelo de IA debe asumir en todo momento el rol de un **Full Stack Engineer Senior**. Esto implica entregar código limpio, estructurado, optimizado para rendimiento, con validación estricta de tipos, manejo correcto de errores y aplicando las mejores prácticas de la industria y la arquitectura del proyecto.

## Stack Tecnológico
- @sga/front-end (directorio `frontend-v2`): React 19, Vite 8, TypeScript, Tailwind CSS 4, Zustand 5, tRPC, TanStack Query v4, React Router v7
- @sga/back-end: Fastify, tRPC, Zod
- @sga/data-access: Prisma ORM, PostgreSQL portable
- @sga/app-tauri: Tauri v2, Rust

## Arquitectura de Paquetes
- @sga/front-end → solo UI, renderizado por WebView2
- @sga/back-end → lógica de negocio y endpoints tRPC,
  corre como sidecar
- @sga/data-access → única fuente de verdad de la BD
- @sga/app-tauri → orquestador de procesos sidecar

## Flujo de Datos
Usuario → React (TanStack Query)
       → tRPC client
       → Fastify sidecar (tRPC router + Zod)
       → Prisma ORM
       → PostgreSQL portable (sidecar)

## Convenciones de Código
- TypeScript estricto en todos los paquetes (strict: true)
- Nunca usar 'any' como tipo
- En archivos de prueba (tests), al definir objetos literales con campos restringidos (ej. uniones literales o enums en Zod), usa siempre "Cast a Constante" (`as const`) para indicar al compilador que el string no va a cambiar y evitar errores de inferencia.
- Archivos en kebab-case: mi-componente.tsx
- Componentes React en PascalCase: MiComponente
- Funciones y variables en camelCase: miVariable
- Toda entrada del backend validada con Zod

### Estilos y Componentes UI
- Utilizar Tailwind CSS para el diseño visual, prohibiendo el uso de CSS en línea (`style={{...}}`) a menos que sea estrictamente necesario para valores calculados.
- Reutilizar siempre los componentes base de UI (ubicados en `src/components/ui/`) como `Button`, `Table`, `Badge`, etc., antes de crear nuevas estructuras desde cero.

## Organización de Archivos y Directorios
- **Priorizar el Orden:** Tanto al crear archivos de código como de documentación, prioriza siempre mantener una estructura limpia.
- **Creación de Directorios:** Si vas a crear archivos relacionados, crea un subdirectorio específico para separarlos y estructurar el contenido de forma lógica, evitando dejar archivos revueltos o sueltos.

## Reglas por Capa
- **CRÍTICO - FRONTEND ACTIVO**: Cuando se pida modificar o crear algo en el frontend o UI, los cambios DEBEN hacerse EXCLUSIVAMENTE en el directorio `frontend-v2`. El paquete `packages/front-end` es legacy (obsoleto) y NO debe ser modificado a menos que se te indique explícitamente.
- @sga/front-end: NUNCA importar PrismaClient directamente
- @sga/back-end: TODA comunicación con BD va por data-access
- @sga/data-access: única capa que conecta a PostgreSQL
- @sga/app-tauri: sin lógica de negocio, solo orquesta

### Manejo de Estado en Frontend
- Usar **TanStack Query** a través de tRPC **exclusivamente** para el estado asíncrono, obtención de datos del servidor y caché.
- Usar el store global (Zustand, ej. `useAuthStore`) **únicamente** para el estado global del cliente (como la sesión del usuario, preferencias o estado efímero de UI).

## Reglas de Base de Datos
- Toda modificación al schema va en prisma/schema.prisma
- Nunca modificar la BD directamente sin migración Prisma
- Nombrar migraciones descriptivamente:
  add_tabla_campo / update_tabla_campo / remove_tabla_campo

## Documentación
- **Docs-First**: Toda nueva funcionalidad debe ser documentada primero. Ninguna funcionalidad se considera terminada ni debe programarse sin que antes se hayan generado sus requerimientos y diagramas en `docs/design/`.
- **Ingeniería Inversa**: Si ya existe código sin documentar, utiliza las skills de diseño para leer el código fuente y generar los requerimientos, escenarios y diagramas de forma retrospectiva.
- Artefactos de diseño en docs/design/ → consultar antes
  de implementar cualquier funcionalidad nueva
- Se cuenta con skills específicas para la creación y modificación
  de artefactos de diseño. Úsalas cuando sea necesario.
- Documentación generada en docs/generated/
- Al introducir un nuevo patrón, actualizar el SKILL.md
  del paquete correspondiente

### Pruebas de Backend
El backend utiliza la siguiente configuración para las pruebas:
1. `npm run test`: Pruebas unitarias que utilizan el mock de Prisma (`tests/setup/prisma-mock.ts`).
2. `npm run test:integration`: Pruebas de integración E2E que se ejecutan directamente contra la base de datos de pruebas local de PostgreSQL (`sga_test`).

### Reportes de Pruebas
- Todos los reportes generados como artefactos después de correr o documentar las suites de pruebas (unitarias o de integración) deben guardarse bajo el directorio: `docs/generated/test-reports/`
- Si hay varios reportes de un mismo tipo (ej. múltiples reportes unitarios o de integración), se debe crear un subdirectorio correspondiente para ese tipo de pruebas (ej. `docs/generated/test-reports/unit/` o `docs/generated/test-reports/integration/`).

## Uso de Skills
- Consultar `.agents/skills/[categoria]-[skill]/SKILL.md` antes
  de tocar archivos asociados a esa funcionalidad
- Consultar `.agents/skills/skill-creator/SKILL.md`
  antes de crear o mejorar cualquier skill
- **Organización**: No crear subcarpetas para categorizar skills dentro de `.agents/skills/` (ej. `skills/categoria/mi-skill`), ya que el sistema no detecta subcarpetas anidadas. Mantén una estructura plana usando prefijos de categoría en el nombre de la carpeta (ej. `skills/ooad-diagramas-clases/` o `skills/front-sga-design/`).

### Flujo de Diseño y Arquitectura (Pipeline)
Las skills de diseño han sido analizadas y están diseñadas para complementarse sin conflictos. Sigue este orden lógico al diseñar una nueva funcionalidad:
1. **generador-requisitos**: Convierte ideas en Requerimientos Funcionales estructurados (ej. RF-XX).
2. **principios-diseno**: Evalúa o define la arquitectura de alto nivel.
3. **escenarios-cu**: Detalla un requerimiento en un Escenario de Caso de Uso.
4. **diagramas-robustez**: Convierte el Escenario de CU en un modelo BCE (Boundary-Control-Entity).
5. **diagramas-secuencia**: Mapea el Escenario y el Diagrama de Robustez a interacciones técnicas.
6. **diagramas-clases**: Genera el diseño técnico orientado a objetos.
7. **Implementación**: Escribe el código con las skills de `front`, `back`, etc., basándote en los artefactos previos.

## Prohibiciones
- No instalar dependencias sin consultarme primero
- No eliminar archivos sin confirmar
- No cambiar estructura de carpetas sin avisar
- No conectar @sga/front-end directamente a PostgreSQL
- No subir archivos .env ni binarios .exe al repositorio
- No modificar más de un paquete a la vez sin avisar

## Reglas de Git y Commits
- **CRÍTICO - COMMITS MANUALES:** Bajo NINGUNA circunstancia debes hacer `git commit` o `git push` automáticamente al terminar una tarea. Solo debes hacerlo cuando el usuario te lo pida explícitamente.
- **CRÍTICO - MENSAJES DE COMMIT:** Al momento de realizar un commit (previa autorización), el agente **TIENE** la obligación de redactar el mensaje explicando **exclusivamente el contexto y propósito de los cambios**, omitiendo por completo la lista de archivos modificados. Todo el mensaje debe estar **siempre en español**.
- **Conventional Commits:** Utilizar la convención estándar (ej. `feat(auth): mensaje`, `fix(ui): mensaje`, `chore(core): mensaje`) para estructurar los mensajes.
- **Agrupación Lógica:** Al guardar varios cambios, se deben separar y agrupar de forma lógica por módulo o funcionalidad en commits individuales, no en un solo commit global.
- **Validación Previa:** Antes de hacer commit y push, el código debe estar libre de errores de TypeScript para evitar romper la build de Tauri.

## Reglas de Codependencia y Cambios en Cascada

### 1. Consistencia Técnica y Tipado E2E
* **Cambios en Base de Datos**: Si modificas [schema.prisma](file:///c:/Users/josem/Documents/San_Diego/sga/packages/data-access/prisma/schema.prisma), debes regenerar los tipos ejecutando `npx prisma generate` en `packages/data-access`. Debes ajustar de inmediato los archivos `*.schema.ts`, `*.repository.ts` y `*.service.ts` en `packages/back-end` para evitar errores de compilación de TypeScript.
* **Cambios en la API (tRPC)**: Si alteras o renombras endpoints en `packages/back-end/src/modules/*/` o en router.ts, debes corregir la importación de `AppRouter` únicamente en el frontend activo (`frontend-v2`) y adaptar sus correspondientes llamadas del cliente de tRPC. El paquete legacy `packages/front-end` NO debe ser modificado.
* **Empaquetado de Tauri (Sidecars)**: Al realizar modificaciones en `packages/back-end`, debes compilar de nuevo el binario sidecar ejecutable ejecutando `npm run build:sidecar` en `packages/back-end` para que Tauri empaquete la versión de backend más reciente.

### 2. Consistencia en Cascada de Reglas de Negocio
* **Registro de Pagos**: Toda edición en las tablas `Pago`, `AplicacionPago`, `CalendarioPago` o `Tutor` (saldo a favor) debe mantener la atomicidad transaccional de caja en el método `registrarPagoTransaccion` de [pagos.repository.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/pagos/pagos.repository.ts).
* **Solicitudes de Beca**: La aprobación de becas implica la inserción atómica de `AsignacionBeca` dentro del método transaccional `resolverSolicitudConAsignacion` de [becas.repository.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/becas/becas.repository.ts).
* **Activación de Ciclos**: Al activar un ciclo escolar en [grupos.repository.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/grupos/grupos.repository.ts), se debe desactivar en cascada (`updateMany`) los demás ciclos vigentes con la misma periodicidad.
* **Mantenimiento Alumno-Tutor**: Vincular un tutor como principal debe remover la bandera `esPrincipal` de otros tutores vinculados al alumno. Dar de baja a un tutor exige validar previamente que no tenga `saldoAFavor > 0`.
* **Inscripción y Aforo**: Inscribir a un alumno requiere validar el `cupoMaximo` de `Grupo`. Si el aforo está completo, se debe impedir la inscripción.

