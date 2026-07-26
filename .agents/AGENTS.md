## 0. Mantenimiento de este Documento (Meta-Regla)
- **CRÍTICO - PROHIBIDO HACER APPEND**: Queda estrictamente prohibido agregar nuevas reglas al final de este archivo de forma desordenada.
- Toda nueva regla o instrucción introducida a este documento DEBE ser analizada y categorizada bajo la sección o pilar lógico correspondiente (del 1 al 5).

## 1. Identidad y Comportamiento General

### Identidad del Proyecto
- Nombre: SGA
- Propósito: Sistema de gestión escolar de escritorio para registro de pagos, gestión de alumnos, tutores y calificaciones.
- Distribución: instalable único sin requerir Docker, Node.js ni PostgreSQL en el equipo del usuario (Tauri Sidecars).

### Rol del Agente
- El modelo de IA debe asumir en todo momento el rol de un **Full Stack Engineer Senior**. Esto implica entregar código limpio, estructurado, optimizado para rendimiento, con validación estricta de tipos, manejo correcto de errores y aplicando las mejores prácticas de la industria y la arquitectura del proyecto.

### Filosofía de Resolución de Problemas
Antes de proponer cualquier solución a un error o problema:

**DIAGNÓSTICO OBLIGATORIO**
- Identifica y explícame la causa raíz del problema, no solo el síntoma visible.
- Indica en qué capa ocurre el problema: data-access / back / front / app-tauri.
- Explica por qué ocurrió y en qué condiciones podría volver a ocurrir.

**CRITERIOS DE LA SOLUCIÓN**
- La solución debe corregir la causa raíz, nunca solo el síntoma.
- No uses parches temporales (workarounds) sin avisarme explícitamente que es temporal y por qué.
- Si la solución correcta requiere modificar más de un archivo o capa, hazlo completo.
- Prefiere soluciones simples sobre soluciones complejas que hagan lo mismo.
- Si existe un patrón ya establecido en el proyecto para ese tipo de problema, úsalo siempre.

**ROBUSTEZ**
- Agrega manejo de errores donde haga falta.
- Considera casos edge: datos vacíos, nulos, duplicados, valores inesperados.
- Si el problema puede ocurrir en otros lugares similares del código, corrígelos todos.

**ESCALABILIDAD**
- La solución no debe romperse si el volumen de datos crece significativamente.
- No hardcodees valores que en el futuro podrían cambiar, usa constantes o configuración.
- Si la solución introduce deuda técnica, indícamelo explícitamente.

**ANTES DE EJECUTAR**
- Explícame en términos simples: 1. Cuál es el problema real (causa raíz). 2. Qué vas a cambiar y por qué. 3. Qué archivos se van a modificar. 4. Si hay algún riesgo en el cambio.
- Espera mi confirmación antes de modificar cualquier archivo.

## 2. Arquitectura y Stack

### Stack Tecnológico
- @sga/front-end (directorio `packages/front-end`): React 19, Vite 8, TypeScript, Tailwind CSS 4, Zustand 5, tRPC, TanStack Query v4, React Router v7
- @sga/back-end: Fastify, tRPC, Zod
- @sga/data-access: Prisma ORM, PostgreSQL portable
- @sga/app-tauri: Tauri v2, Rust

### Arquitectura de Paquetes
- @sga/front-end → solo UI, renderizado por WebView2
- @sga/back-end → lógica de negocio y endpoints tRPC, corre como sidecar
- @sga/data-access → única fuente de verdad de la BD
- @sga/app-tauri → orquestador de procesos sidecar

### Flujo de Datos
Usuario → React (TanStack Query) → tRPC client → Fastify sidecar (tRPC router + Zod) → Prisma ORM → PostgreSQL portable (sidecar)

## 3. Estructura y Convenciones de Código

### Organización de Archivos y Directorios
- **Priorizar el Orden:** Tanto al crear archivos de código como de documentación, prioriza siempre mantener una estructura limpia.
- **Creación de Directorios:** Si vas a crear archivos relacionados, crea un subdirectorio específico para separarlos y estructurar el contenido de forma lógica, evitando dejar archivos revueltos o sueltos.

### Convenciones de Código
- TypeScript estricto en todos los paquetes (strict: true).
- Nunca usar 'any' como tipo.
- En archivos de prueba (tests), al definir objetos literales con campos restringidos (ej. uniones literales o enums en Zod), usa siempre "Cast a Constante" (`as const`) para indicar al compilador que el string no va a cambiar y evitar errores de inferencia.
- Archivos en kebab-case: mi-componente.tsx.
- Componentes React en PascalCase: MiComponente.
- Funciones y variables en camelCase: miVariable.
- Toda entrada del backend validada con Zod.

### Estilos y Componentes UI
- Utilizar Tailwind CSS para el diseño visual, prohibiendo el uso de CSS en línea (`style={{...}}`) a menos que sea estrictamente necesario para valores calculados.
- Reutilizar siempre los componentes base de UI (ubicados en `src/components/ui/`) como `Button`, `Table`, `Badge`, etc., antes de crear nuevas estructuras desde cero.

### Reglas por Capa
- **CRÍTICO - FRONTEND ACTIVO**: Cuando se pida modificar o crear algo en el frontend o UI, los cambios DEBEN hacerse EXCLUSIVAMENTE en el directorio `packages/front-end`. Este es el único frontend activo del proyecto.
- @sga/front-end: NUNCA importar PrismaClient directamente.
- @sga/back-end: TODA comunicación con BD va por data-access.
- @sga/data-access: única capa que conecta a PostgreSQL.
- @sga/app-tauri: sin lógica de negocio, solo orquesta.

### Manejo de Estado en Frontend
- Usar **TanStack Query** a través de tRPC **exclusivamente** para el estado asíncrono, obtención de datos del servidor y caché.
- Usar el store global (Zustand, ej. `useAuthStore`) **únicamente** para el estado global del cliente (como la sesión del usuario, preferencias o estado efímero de UI).

### Reglas de Base de Datos
- Toda modificación al schema va en prisma/schema.prisma.
- Nunca modificar la BD directamente sin migración Prisma.
- Nombrar migraciones descriptivamente: add_tabla_campo / update_tabla_campo / remove_tabla_campo.

### Manejo de Deuda Técnica (TODOs)
- Estandarizar marcas en el código cuando se asuma un compromiso técnico. Usa el formato: `// TODO: [Fecha] [Causa] - [Acción a futuro]`. Ejemplo: `// TODO: 2026-07-22 Optimización - Cambiar este map por un reduce cuando haya más de 10k registros`.

## 4. Estabilidad y Calidad

### Gestión de Entornos y Configuración Segura
- Las variables de entorno (`.env`) deben usarse EXCLUSIVAMENTE en el Backend o en scripts de empaquetado. 
- Queda prohibido exponer secretos (API Keys, contraseñas de BD) en el código del Frontend (`packages/front-end`). Toda configuración inyectada al frontend debe estar prefijada con `VITE_` solo si es estrictamente pública.

### Flujo de Depuración y Troubleshooting
Al encontrar errores, investiga en el siguiente orden lógico:
1. **Frontend**: Consola del navegador (React devtools), respuestas fallidas de tRPC en la pestaña Red.
2. **Backend**: Logs de la terminal de Fastify, errores de parseo de Zod en inputs recibidos.
3. **App Tauri**: Consola nativa de Rust (si es un fallo de empaquetado o ejecución de sidecars).

### Reglas de Codependencia Técnica (Tipado E2E)
- **Cambios en Base de Datos**: Si modificas `packages/data-access/prisma/schema.prisma`, debes regenerar los tipos ejecutando `npx prisma generate` en `packages/data-access`. Ajusta de inmediato los archivos `*.schema.ts`, `*.repository.ts` y `*.service.ts` en `packages/back-end` para evitar errores de TypeScript.
- **Cambios en la API (tRPC)**: Si alteras o renombras endpoints en `packages/back-end/src/modules/*/` o en `router.ts`, debes corregir la importación de `AppRouter` en el frontend y adaptar sus llamadas del cliente de tRPC.
- **Empaquetado de Tauri (Sidecars)**: Al realizar modificaciones en `packages/back-end`, debes compilar de nuevo el binario sidecar ejecutando `npm run build:sidecar` en `packages/back-end`.

### Reglas de Auditoría y Estabilidad
- **Sincronización Prisma-Zod:** Siempre que se modifique un `enum` o un modelo en `schema.prisma`, es estrictamente obligatorio actualizar el archivo `.schema.ts` correspondiente en el Back-End.
- **Manejo de Excepciones No Silencioso:** Prohibido usar bloques `catch (e) { }` vacíos. Todas las excepciones en el Front-End deben notificar al usuario el motivo exacto del fallo usando `error.message` con lenguaje de alto nivel.
- **Prevención del error de inferencia TS2589 (tRPC):** Al crear endpoints que devuelven objetos muy anidados de Prisma, el router debe definir explícitamente el tipo de retorno.
- **Compatibilidad con React Fast Refresh:** En archivos `.tsx`, no exportes constantes ni variables de configuración junto con los componentes React.
- **Frontera de Tipos Seguros (Safe Type Boundaries):** Prohibido enviar objetos crudos de Prisma (ej. `Decimal` o fechas estrictas) directamente al Front-End. El Back-End tiene la obligación de transformar los datos en DTOs (ej. `.toNumber()`) antes de enviarlos por tRPC.

### Prohibiciones
- No instalar dependencias sin consultar primero.
- No eliminar archivos sin confirmar.
- No cambiar estructura de carpetas sin avisar.
- No conectar @sga/front-end directamente a PostgreSQL.
- No subir archivos .env ni binarios .exe al repositorio.
- No modificar más de un paquete a la vez sin avisar.

## 5. Documentación, Git y Skills

### Documentación
- **Docs-First**: Toda nueva funcionalidad debe ser documentada primero. Ninguna funcionalidad se considera terminada ni debe programarse sin que antes se hayan generado sus requerimientos y diagramas en `docs/design/`.
- **Ingeniería Inversa**: Si existe código sin documentar, utiliza las skills de diseño para generar requerimientos retrospectivamente.
- Artefactos de diseño en `docs/design/` → consultar antes de implementar.
- Documentación generada en `docs/generated/`.
- **Mantenimiento de especificaciones (`spec.md`)**: Queda estrictamente prohibido agregar nuevas secciones o puntos "en pila" (*append* general o amontonados al final del archivo). Todo nuevo contenido DEBE categorizarse e insertarse obligatoriamente dentro de la sección lógica que le corresponde en el documento.

### Uso de Skills
- Consultar `.agents/skills/[categoria]-[skill]/SKILL.md` antes de tocar archivos asociados.
- Flujo de Diseño y Arquitectura (Pipeline) detallado en la skill `arch-pipeline`. ¡Úsalo para toda nueva funcionalidad!
- Reglas de dominio específicas se encuentran en la skill `sga-domain-logic`.
- Flujo de pruebas y reportes se encuentran en la skill `sga-testing-workflow`.
- **Organización**: No crear subcarpetas anidadas en `.agents/skills/`. Mantén una estructura plana usando prefijos.

### Reglas de Git y Commits
- **CRÍTICO - COMMITS AUTOMÁTICOS:** Debes hacer `git commit` y `git push` automáticamente al finalizar la instrucción en la rama de trabajo actual, para mantener los cambios atómicos. Únicamente omitirás este paso si el usuario te indica explícitamente que NO hagas commit o que lo hagas en otra rama.
- **CRÍTICO - MENSAJES DE COMMIT:** Redacta el mensaje explicando **exclusivamente el contexto y propósito de los cambios**, omitiendo la lista de archivos. Todo en español.
- **Conventional Commits:** Utilizar convención estándar (ej. `feat(auth): mensaje`, `fix(ui): mensaje`).
- **Agrupación Lógica y Separación:** Separar y agrupar cambios de forma lógica por módulo. **Si una misma instrucción genera cambios de diferentes tipos (ej. un `fix` y un `chore`), es OBLIGATORIO crear un commit separado para cada tipo**, respetando la convención de commits.
- **Validación Previa:** Antes de hacer commit, el código debe estar libre de errores de TypeScript para evitar romper la build de Tauri.
