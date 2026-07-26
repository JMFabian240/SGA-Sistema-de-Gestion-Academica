# Especificación Técnica y Funcional: Sistema de Gestión Académica (SGA) Colegio San Diego

> **Meta-Regla de Edición:** Queda estrictamente prohibido agregar nuevas secciones o puntos "en pila" (*append* general o amontonados al final del archivo). Toda nueva adición a este documento debe categorizarse e insertarse obligatoriamente dentro de la sección lógica que le corresponde (1 al 7) para preservar el orden y la coherencia estructural.

## 1. Contexto general

*   **Propósito del proyecto:** El Sistema de Gestión Académica (SGA) resuelve el problema de la fragmentación y vulnerabilidad de datos causados por llevar la administración del Colegio San Diego (~200 familias) mediante múltiples hojas de Excel manuales. Existe para centralizar el control escolar, automatizar la cobranza, garantizar la integridad histórica de calificaciones y finanzas, y proveer una fuente única de verdad para toda la institución escolar.
*   **Estado actual:** En desarrollo inicial ("Año Cero"). Fase de construcción de arquitectura y módulos fundacionales.
*   **Alcance:**
    *   **SÍ INCLUYE:** Control de expedientes de alumnos y tutores, caja unificada de cobranza (múltiples conceptos), automatización de recargos ($400 MXN), reglas de becas/promociones, registro de calificaciones (historial/Kardex), generación de boletas PDF, notificaciones locales por correo (SMTP) preventivas, reportes locales exportables (Excel/CSV), bitácora de auditoría estricta y arquitectura Offline-LAN.
    *   **NO INCLUYE EXPLÍCITAMENTE:** Portal web accesible desde internet para padres, despliegue en la nube (AWS/Azure/Vercel), integraciones con SAT para timbrado de facturación electrónica, envío de alertas vía SMS o WhatsApp, ni aplicación móvil nativa para Android/iOS.

---

## 2. Arquitectura técnica

### Stack tecnológico
*   **Frontend:** React 19, Vite 8, TypeScript, Tailwind CSS 4, Zustand 5 (estado global), TanStack Query v4 (caché/estado asíncrono), React Router v7.
*   **Backend:** Fastify, tRPC, Zod (validación de esquemas), Node.js.
*   **Orquestador de Escritorio:** Tauri (Rust).
*   **Base de Datos:** PostgreSQL Portable (Windows), Prisma ORM.

### Arquitectura general
El proyecto utiliza una **Arquitectura Híbrida Cliente-Servidor en LAN** implementada como un **Monorepo**.
No existe servidor en la nube. La computadora física de la **Administradora** funge como el servidor local en la escuela.
*   **Nodo Principal (Administradora):** Ejecuta la app de escritorio empaquetada con Tauri. Tauri actúa como orquestador y arranca silenciosamente dos *sidecars* (procesos en segundo plano): el motor de PostgreSQL portable y el servidor backend en Fastify. Además, muestra el frontend renderizado en WebView2.
*   **Nodos Secundarios (Gestores/Docentes):** No instalan la aplicación. Acceden al sistema ingresando la dirección IP local del nodo principal desde cualquier navegador web (ej. `http://192.168.1.100:8080`).

```mermaid
graph TD
    A[App Tauri (Admin PC)] -->|Levanta Sidecar| B[PostgreSQL Portable]
    A -->|Levanta Sidecar| C[Backend Fastify + tRPC]
    A -->|Renderiza UI| D[Frontend WebView2]
    E[Browser Gestor (LAN)] -->|HTTP/IP Local| C
    F[Browser Docente (LAN)] -->|HTTP/IP Local| C
    C -->|Prisma Client| B
```

### Estructura de módulos (Monorepo)
El código se organiza en `packages/*` mediante NPM Workspaces:
*   `@sga/app-tauri`: Configuración en Rust para compilar el ejecutable de escritorio y gestionar sidecars.
*   `@sga/back-end`: Lógica de negocio, rutas protegidas por tRPC, validación con Zod.
    *   **Especificación Arquitectónica Detallada:** Para consultar el modelo por capas (`Router -> Service -> Repository -> Domain`) y el desglose individual de sus 15 módulos y algoritmos (ej. recargos de $400, cálculo financiero, ciclo de vida), revisar [backend-architecture.md](file:///c:/Users/josem/Documents/San_Diego/sga/docs/architecture/backend-architecture.md).
*   `@sga/data-access`: **Única fuente de verdad de la base de datos**. Contiene `schema.prisma`, migraciones y expone el *Singleton* del Prisma Client.
    *   **Especificación del Modelo Relacional:** Para consultar el diagrama ER global, las reglas de integridad monetaria (`Decimal(12, 2)`), borrado suave (`eliminadoEn`) y la especificación técnica de sus 26 modelos y 8 enums agrupados en 6 dominios, revisar [database-architecture.md](file:///c:/Users/josem/Documents/San_Diego/sga/docs/architecture/database-architecture.md).
*   `@sga/front-end` (o `front`): Capa de UI con React.
    *   **Especificación Visual y de Arquitectura Cliente:** Para consultar el stack LAN (React 18, Vite 8, Tailwind v4, tRPC Client), la arquitectura modular por dominio (`src/modules/*`), la gestión dual de estado (`Zustand` / `TanStack Query`), rutas protegidas RBAC y herramientas institucionales (impresión directa de recibos, QR, PDF de boletas), revisar [frontend-architecture.md](file:///c:/Users/josem/Documents/San_Diego/sga/docs/architecture/frontend-architecture.md).
*   `@sga/e2e`: Pruebas de integración end-to-end.

### Dependencias externas
Al ser un sistema diseñado para operar *Offline*, las dependencias externas son mínimas:
*   **Servidor SMTP:** Configurado para envío de alertas y recordatorios de pago automatizados.
*   **Google Drive / OneDrive (Apps nativas):** Para respaldar automáticamente en la nube los volcados `.zip` que el sistema genera localmente vía `pg_dump`.

### Base de datos
*   **Motor:** PostgreSQL.
*   **Regla estricta:** Solo el paquete `@sga/data-access` puede conectarse a la BD. El frontend tiene estrictamente prohibido importar el Prisma Client.
*   **Modelo de datos:** Relacional. Todas las tablas deben usar nombres en singular (ej. `Alumno`). Se prohíbe el uso de `DELETE` duro; todo registro eliminable debe implementar *Soft Delete* (`eliminadoEn: DateTime?`).
*   **Diagrama Entidad-Relación Conceptual:** La estructura base gira en torno a: `Tutor (1) -> (N) Alumno -> (N) Inscripción -> (N) Grupo`. Los aspectos financieros vinculan `Tutor (1) -> (N) Pago -> (N) Concepto`, y los académicos `Alumno (1) -> (N) Calificación`.

### Autenticación y Concurrencia
*   **Sesiones LAN:** Las sesiones de los nodos secundarios (Navegador) se gestionan mediante JWT, incorporando caducidad por inactividad para garantizar la seguridad en equipos compartidos.
*   **Control de Concurrencia:** Las operaciones simultáneas de escritura (ej. múltiples docentes subiendo calificaciones al mismo tiempo) utilizan bloqueo optimista (Optimistic Locking) para prevenir inconsistencias de datos.

---

## 3. Funcionalidades y reglas de negocio

### Casos de uso / Features principales
*   **Seguridad:** Bitácora inmutable visible solo por Root. Roles estrictos (Administradora, Gestor, Docente).
*   **Control Escolar:** Wizard de inscripción, panel interactivo para transición masiva de ciclo (aprobación de pase de año), gestión de grupos y ciclos (anuales y semestrales paralelos).
*   **Caja y Cobranza:** Caja unificada para pago de múltiples conceptos a la vez (inscripción, colegiatura, material). Registro de saldos a favor (crédito) y pagos por adelantado.
*   **Calificaciones:** Historial académico perpetuo. Registro cualitativo (Preescolar) y numérico por periodo. Generación de boletas dinámicas en PDF.

### Reglas de negocio críticas (No obvias)
*   **Recargos Automáticos:** Se aplica un recargo fijo e inapelable de **$400 MXN** transcurridos **5 días hábiles** de gracia posteriores a la fecha original de vencimiento.
*   **Convenios de Pago:** Si un padre de familia firma un convenio por rezago, el sistema **congela** la generación de nuevos recargos ($400) mientras el convenio esté vigente, pero conserva el adeudo original.
*   **Plazo de Inscripción:** Los conceptos relacionados a inscripción (y materiales) tienen un plazo duro de máximo **60 días naturales** para liquidarse. El sistema avisa 5 días antes de cumplirse el plazo.
*   **Máquina de Estados de Alumnos:** `Activo`, `Baja Temporal`, `Baja Definitiva`, `Egresado` y `Transición Pendiente`. Reingresar a un alumno inactivo reactiva su expediente sin crear registros duplicados.
*   **Bloqueo por Adeudo:** Alumnos morosos son restringidos automáticamente; se bloquea la captura de sus calificaciones/exámenes y la visualización de su boleta hasta saldar deudas.
*   **Exclusión Mutua de Becas:** La "Beca de Hermanos" (30% fijo) y las "Promociones Estacionales de Inscripción" (por matriz de descuentos) son mutuamente excluyentes; no se pueden apilar.
*   **Autorización de Becas:** Si un "Gestor" asigna una beca, se genera en estado de "Solicitud Pendiente" y no altera montos hasta que la "Administradora" la apruebe.
*   **Inmutabilidad de Periodos Cerrados:** Una vez que un ciclo escolar o bimestre finaliza oficialmente, el sistema congela esos registros. Modificar calificaciones o adeudos pasados requiere permisos especiales de la Administradora y genera alertas en bitácora.
*   **Corte de Caja Diario:** Todo pago procesado en el día debe conciliarse mediante un flujo de "Cierre de Caja", blindando las transacciones auditadas contra modificaciones futuras.

### Flujos críticos
1.  **Wizard de Nuevo Ingreso:** Paso 1 (Seleccionar/Crear Tutor) -> Paso 2 (Crear Alumno) -> Paso 3 (Definir Contactos Autorizados) -> Paso 4 (Generar primer adeudo de inscripción y colegiaturas según plan 10/12 meses). Esto previene alumnos "huérfanos" sin facturación.
2.  **Transición Masiva de Ciclo:** El sistema pre-filtra y marca como 'Transición Pendiente' a cualquier alumno que detecte con adeudos o con calificaciones < 6.0 (incluyendo materias extra/talleres), requiriendo intervención manual para destrabar el pase de grado.

---

## 4. Convenciones y estándares

*   **Estilo de Código:**
    *   **Frontend:** Componentes en `PascalCase` (`TablaAlumnos.tsx`). Hooks personalizados en `camelCase` (`useAlumnos.ts`). Prohibido hacer llamadas `fetch` directas, todo uso de API debe ser a través de los hooks de `tRPC` (`trpc.usuarios.listar.useQuery()`).
    *   **Base de datos:** Modelos en Prisma en `PascalCase` singular.
    *   **UI/CSS:** Tailwind CSS. Exclusivo uso de colores institucionales definidos en el Design System (`Navy`: `bg-[#001429]`, `Crimson`: `bg-[#CC0000]`). Layout sin header superior (solo Sidebar izquierdo y panel central). **Todos los formularios de creación/edición deben abrirse como Modales superpuestos con fondo borroso (`backdrop-blur`)**.
*   **Estructura de Commits:** No detallada estrictamente aún, pero se recomienda estándar *Conventional Commits* en el monorepo.
### Estrategia y Plan de Pruebas
Dado que el SGA maneja información financiera y académica crítica, la estrategia de calidad (QA) abarca tres niveles:

1.  **Pruebas Unitarias (Unit Tests):**
    *   **Propósito:** Validar el comportamiento aislado de funciones puras, lógica de negocio compleja (ej. cálculo exacto de recargos) y reglas de validación.
    *   **Ubicación:** Co-ubicadas junto al código fuente en cada paquete. Ej. `packages/back-end/src/modules/**/*.test.ts` (como el cálculo financiero).
2.  **Pruebas de Aceptación / Integración:**
    *   **Propósito:** Validar el flujo de la información desde los resolvers de tRPC hasta la inserción correcta en la base de datos (Postgres).
    *   **Ubicación:** Carpetas específicas de tests dentro del backend, evaluando módulos completos.
3.  **Pruebas End-to-End (E2E):**
    *   **Propósito:** Simular el comportamiento real del usuario final operando la interfaz gráfica.
    *   **Ubicación:** En el paquete dedicado `@sga/e2e`.
    *   **Alcance:** Flujos críticos como el Wizard de Inscripción, el Corte de Caja y la Transición de Ciclo.

---

## 5. Configuración y entorno

*   **Variables de Entorno:**
    *   `DATABASE_URL`: Únicamente debe ser consumida en el paquete `@sga/data-access`.
*   **Cómo levantar el proyecto localmente:**
    *   Uso de los scripts del `package.json` raíz.
    *   `npm run dev:back-end` y `npm run dev:front-end` (o `npm run dev` para ambos simultáneamente en entorno web estándar).
    *   `npm run dev:tauri` para correr el entorno de escritorio completo (Frontend + orquestación Rust).
    *   `npm run db:generate` y `npm run db:migrate` para aplicar cambios en Prisma.
*   **Entornos:** No existe división clásica Nube (Staging vs Prod). Todo es entorno Local/On-Premise. El código de desarrollo corre en la PC del programador, y la "Producción" será el binario `.exe` final entregado en la PC de la Administradora del colegio.
*   **Actualizaciones (OTA):** El empaquetado de Tauri incluirá configuración para actualizaciones automáticas, permitiendo desplegar nuevas versiones al equipo de la Administradora sin requerir intervención técnica in situ.
*   **Health Checks de Arranque:** El orquestador Tauri implementa validaciones al inicio para asegurar que los sidecars (BD y backend) levanten correctamente, mostrando errores amigables si puertos están ocupados.
*   **Recuperación ante Desastres (Disaster Recovery):** Debe existir un procedimiento documentado y visible en la UI para restaurar el sistema a partir de los `.zip` (respaldos en la nube) ante cualquier fallo catastrófico del hardware principal.

---

## 6. Historial y decisiones

*   **ADR (Decisiones de Arquitectura Relevantes):**
    *   *¿Por qué Tauri y no Web Pública?* Para cumplir con la restricción estricta de seguridad y fiabilidad: operar 100% Offline y sin exposición a Internet. Tauri garantiza rendimiento nativo integrando los binarios backend.
    *   *¿Por qué tRPC en vez de REST?* Para aprovechar el Monorepo TypeScript y tener seguridad de tipos de extremo a extremo sin tener que definir contratos OpenAPI manualmente.
    *   *¿Por qué PostgreSQL Portable?* Porque requiere cero configuración y conocimientos de sistemas por parte del usuario final (la directora de la escuela).
*   **Deuda técnica / Conocida:** El sistema depende del empaquetamiento robusto del binario de Postgres y Fastify dentro del instalador Tauri. Garantizar el ciclo de vida (startup/shutdown seguro de los sidecars al cerrar la app) es el reto de infraestructura principal actualmente.
*   **Roadmap (Hitos del Proyecto):**
    *   *Fase 1 (MVP)*: Modelado de BD (`@sga/data-access`), Sistema de Autenticación, Roles, y CRUDs administrativos (Alumnos, Tutores, Grupos).
    *   *Fase 2 (Financiera)*: Caja unificada, automatización de recargos ($400), convenios, corte de caja y generación de recibos PDF.
    *   *Fase 3 (Académica)*: Registro de calificaciones, generación de boletas, bitácoras de auditoría, y wizard de transición masiva de ciclo.

---

## 7. Puntos de entrada para el agente

*   **Archivos clave a revisar primero:**
    *   `package.json` en la raíz (para entender dependencias y scripts de workspaces).
    *   `.agents/skills/`: Contiene las reglas absolutas, no-negociables y directrices de UI, Base de Datos, y Arquitectura.
    *   `packages/data-access/prisma/schema.prisma`: Donde reside el diseño de la base de datos y modelo relacional.
*   **Glosario de términos del dominio:**
    *   **Sidecar:** Ejecutables auxiliares empaquetados junto a la app principal. En este proyecto: `postgres.exe` y el backend en node.
    *   **Root / Administradora:** Usuario máximo, dueña del colegio.
    *   **Gestor:** Personal administrativo o secretarias (mueven el sistema diario, caja, altas/bajas, pero no borran historial ni autorizan becas).
    *   **Tutor:** Responsable financiero de uno o varios alumnos (hermanos). A nombre de quien salen los comprobantes y adeudos.
    *   **Soft Delete:** En lugar de borrar registros de la BD con `DELETE`, se actualiza la fecha `eliminadoEn = NOW()`.
    *   **Transición de Ciclo:** El acto masivo de promover a los alumnos del Año X al Año Y al finalizar el periodo escolar.
    *   **Kardex:** Historial inmutable de las calificaciones obtenidas a lo largo de toda la vida estudiantil de un alumno en la institución.
