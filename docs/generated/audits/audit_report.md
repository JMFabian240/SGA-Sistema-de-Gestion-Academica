# Reporte de Auditoría General del Backend

Este documento presenta una auditoría general del backend del **Sistema de Gestión Académica (SGA)**, ubicado en el monorepo bajo los paquetes `@sga/back-end` y `@sga/data-access`.

El backend está construido con **Fastify** como servidor web, **tRPC** para la comunicación segura tipo RPC, **Zod** para la validación de esquemas y **Prisma ORM** como motor de acceso a datos de PostgreSQL.

A continuación, se detallan los hallazgos categorizados por severidad, impacto e inconsistencias del código, junto con recomendaciones para su solución.

---

## 1. Hallazgos de Seguridad Críticos

### 🚨 Almacenamiento de Contraseñas en Texto Plano
* **Archivo:** [usuarios.router.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/usuarios/usuarios.router.ts#L94)
* **Descripción:** Al crear un nuevo usuario mediante el procedimiento `crearUsuario`, la contraseña se almacena directamente en la base de datos sin aplicar hashing:
  ```typescript
  passwordHash: input.password, // TODO: Hashear con bcrypt
  ```
* **Impacto:**
  1. **Brecha de Seguridad:** Si la base de datos se ve comprometida, todas las contraseñas de los nuevos usuarios quedarán expuestas en texto plano.
  2. **Incompatibilidad de Login:** `AuthService.login` utiliza `bcrypt.compare` contra `passwordHash`. Dado que el valor guardado no es un hash de bcrypt válido, **ningún usuario recién creado podrá iniciar sesión en el sistema**, resultando en un error persistente de "Credenciales inválidas".
* **Solución Recomendada:** Hashear la contraseña con `bcrypt` utilizando la misma configuración del seed de usuarios antes de insertarla:
  ```typescript
  const passwordHash = await bcrypt.hash(input.password, 10);
  ```

### 🚨 Falta de Control de Acceso Basado en Roles (RBAC) en Procedures
* **Archivo:** [router.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/router.ts) y todos los routers de módulos.
* **Descripción:** A pesar de que la base de datos define modelos de `Rol` y `UsuarioRol` y de que el frontend requiere restringir acciones por privilegios, **todos los procedures protegidos del sistema utilizan únicamente el middleware `isAuthed`**:
  ```typescript
  export const protectedProcedure = t.procedure.use(isAuthed).use(auditMiddleware);
  ```
  El middleware `isAuthed` en [trpc.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/trpc.ts#L11) solo verifica que la firma del token JWT sea válida y que el token no esté revocado. No realiza comprobaciones sobre los roles o permisos específicos del usuario.
* **Impacto:** Cualquier usuario autenticado en el sistema (por ejemplo, un docente o un alumno) puede invocar procedures administrativos sensibles mediante llamadas directas a tRPC, lo que permite:
  * Crear, desactivar o modificar usuarios y asignarles roles de administrador ([usuarios.router.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/usuarios/usuarios.router.ts)).
  * Modificar parámetros de configuración global de costos y recargos ([configuracion.router.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/configuracion/configuracion.router.ts)).
  * Consultar bitácoras de auditoría de todo el sistema ([auditoria.router.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/auditoria/auditoria.router.ts)).
  * Visualizar y exportar reportes deudores y financieros ([reportes.router.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/reportes/reportes.router.ts)).
* **Solución Recomendada:** Implementar un middleware de autorización que verifique los roles del usuario. Puesto que los roles no están guardados en el token JWT, se debe:
  1. Modificar `isAuthed` o crear un nuevo middleware `hasRole(['ADMIN', 'GESTOR'])` que consulte la relación de roles del usuario en la base de datos (o incluir los roles codificados en el JWT si no son excesivamente dinámicos).
  2. Aplicar estas restricciones a nivel de procedure.

### 🚨 Secreto JWT por Defecto (Hardcoded Fallback)
* **Archivos:** [trpc.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/trpc.ts#L17) y [auth.service.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/auth/auth.service.ts#L8)
* **Descripción:** Si la variable de entorno `JWT_SECRET` no está configurada, el backend utiliza el secreto por defecto `'supersecret'`.
* **Impacto:** En caso de un despliegue erróneo donde no se carguen las variables de entorno, el sistema utilizará una firma predecible. Un atacante podría firmar sus propios tokens JWT con privilegios de cualquier identificador de usuario y comprometer por completo el sistema.
* **Solución Recomendada:** Eliminar el valor por defecto y lanzar un error explícito durante la inicialización del sistema si `process.env.JWT_SECRET` no está definido.

---

## 2. Errores Lógicos e Inconsistencias de Código

### ⚠️ Pruebas Unitarias Rotas en `AuthService`
* **Archivo:** [auth.service.test.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/auth/auth.service.test.ts)
* **Descripción:** Al ejecutar el comando de pruebas, el archivo `auth.service.test.ts` arroja **5 fallos críticos**. Esto se debe a que la suite de pruebas simula el comportamiento de la base de datos esperando que se llame a `prisma.usuario.findUnique`:
  ```typescript
  prismaMock.usuario.findUnique.mockResolvedValue(...)
  ```
  Sin embargo, la implementación real de `AuthService.login` en [auth.service.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/auth/auth.service.ts#L12) cambió para usar `prisma.usuario.findFirst` para permitir búsquedas tanto por correo como por nombre de usuario (`OR` query).
* **Impacto:** Las pruebas automatizadas fallan persistentemente en el flujo de integración continua (CI) y bloquean la validación rápida de cambios.
* **Solución Recomendada:** Actualizar la suite de pruebas unitarias para que haga mock de `findFirst` en lugar de `findUnique` para los flujos de autenticación.

### ⚠️ Uso de Aritmética de Punto Flotante en Transacciones Financieras
* **Archivo:** [pagos.service.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/pagos/pagos.service.ts#L140-L141)
* **Descripción:** Los campos `montoPagado` y `saldoPendiente` en Prisma son de tipo `Decimal`. Sin embargo, al procesar aplicaciones de pago, los valores se convierten a números nativos de JavaScript (`Number`) para realizar operaciones aritméticas:
  ```typescript
  const nuevoMontoPagado = Number(adeudo.montoPagado) + app.montoAplicado;
  const nuevoSaldoPendiente = Number(adeudo.saldoPendiente) - app.montoAplicado;
  ```
* **Impacto:** JavaScript maneja números en formato IEEE 754 de punto flotante de doble precisión. Esto introduce errores de redondeo acumulativos (por ejemplo, `0.1 + 0.2 = 0.30000000000000004`). Con el tiempo, los saldos pendientes de los alumnos pueden mostrar decimales fantasmas (como `$0.00000001` o `$100.00000002`), impidiendo que los adeudos se marquen exactamente como `PAGADO` (saldo `<= 0`).
* **Solución Recomendada:** Utilizar la clase `Decimal` nativa de Prisma para las operaciones aritméticas, o forzar un redondeo a dos decimales (`.toFixed(2)` o multiplicando por 100 para trabajar con centavos enteros) antes de guardar de vuelta en la base de datos.

### ⚠️ Inconsistencia en la Serialización de Decimales (tRPC)
* **Archivo:** [dashboard.router.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/dashboard/dashboard.router.ts#L42-L43)
* **Descripción:** En la consulta `obtenerKpisFinancieros`, los valores de ingresos y deudas se devuelven directamente como objetos `Prisma.Decimal`:
  ```typescript
  return {
    ingresosMesActual: sumaIngresos._sum.montoTotal || 0,
    deudaPendienteTotal: sumaDeudaPendiente._sum.saldoPendiente || 0,
  };
  ```
  En cambio, en [reportes.router.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/reportes/reportes.router.ts#L32) se transforman explícitamente a `Number` para evitar fallos de serialización JSON.
* **Impacto:** Puesto que tRPC no tiene configurado un transformer como `superjson` para manejar tipos complejos nativamente, enviar objetos `Decimal` de Prisma directamente al cliente puede provocar problemas de parseo en el front-end o que los campos se muestren con la estructura interna del objeto Decimal de JavaScript en lugar de un número simple.
* **Solución Recomendada:** Convertir a `Number()` en el router o configurar `superjson` en tRPC para serializar automáticamente tipos complejos (`Date`, `Map`, `Set`, `BigInt`, `Decimal`).

---

## 3. Omisiones y Deficiencias en Reglas de Negocio

### 🔍 Falta de Validación de Cupo Máximo en Inscripciones
* **Archivo:** [inscripciones.service.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/inscripciones/inscripciones.service.ts#L92)
* **Descripción:** El método `createInscripcion` valida correctamente que el alumno no se inscriba dos veces en el mismo ciclo, pero no verifica si el grupo seleccionado (`grupoId`) ya ha alcanzado su límite de alumnos matriculados (`cupoMaximo` definido en la tabla [grupo](file:///c:/Users/josem/Documents/San_Diego/sga/packages/data-access/prisma/schema.prisma#L258)).
* **Impacto:** Es posible sobreinscribir alumnos en grupos que ya han excedido su capacidad física o pedagógica, lo que corrompe la consistencia operativa del colegio.
* **Solución Recomendada:** Antes de crear la inscripción, realizar un conteo de los registros activos en `InscripcionCiclo` para el `grupoId` y compararlo con el `cupoMaximo` del grupo. Si se excede, lanzar un `TRPCError` con código `BAD_REQUEST`.

### 🔍 Ausencia de Validaciones en la Asignación Directa de Becas
* **Archivo:** [becas.service.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/becas/becas.service.ts#L139)
* **Descripción:** A diferencia del flujo de solicitudes (`createSolicitud`), el endpoint de asignación directa de becas (`assignBeca`) no cuenta con ninguna validación lógica.
* **Impacto:** Un administrador podría asignar múltiples becas activas a un mismo alumno en el mismo ciclo escolar, superando potencialmente el 100% de exención de colegiaturas, o asignarle una beca a un alumno dado de baja o inactivo.
* **Solución Recomendada:** Implementar validaciones en `assignBeca` similares a las de solicitudes (verificación de estado del alumno, duplicados de asignación activa en el mismo ciclo y porcentaje acumulado de becas).

### 🔍 Efectos Secundarios en la Baja de Alumnos (Orfandad de Datos)
* **Archivo:** [alumnos.service.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/alumnos/alumnos.service.ts#L116)
* **Descripción:** Cuando se ejecuta `deleteAlumno`, simplemente se actualiza el estado del alumno a `BAJA_DEFINITIVA` y se establece una fecha en `eliminadoEn`. Sin embargo, no se toman acciones respecto a sus inscripciones activas ni sus deudas pendientes en el `calendarioPago`.
* **Impacto:** Los reportes de adeudos y cobros proyectados seguirán contabilizando las deudas del alumno dado de baja como deudas "vencidas" o "pendientes", inflando artificialmente el balance de cartera vencida y deudas globales del colegio.
* **Solución Recomendada:** Al dar de baja a un alumno, la transacción debe decidir si anula o congela las inscripciones del ciclo actual y cancela/elimina los adeudos futuros no devengados del calendario de pagos.

---

## 4. Plan de Acción Recomendado

Para mitigar los riesgos identificados, se sugiere estructurar las correcciones en el siguiente orden de prioridad:

1. **Prioridad 1 (Crítica - Seguridad y Operatividad):**
   * Implementar el hash de contraseñas con `bcrypt` en el procedimiento de creación de usuarios ([usuarios.router.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/usuarios/usuarios.router.ts)).
   * Corregir el mock en `auth.service.test.ts` para usar `findFirst` y restablecer el correcto paso de las pruebas unitarias del backend.
2. **Prioridad 2 (Crítica - Autorización y Privacidad):**
   * Introducir roles en la validación de procedures de tRPC y limitar endpoints administrativos a roles como `ADMIN` o `GESTOR`.
   * Remover el fallback del secreto JWT e invalidar el inicio del servidor si falta `JWT_SECRET` en el entorno.
3. **Prioridad 3 (Estabilidad y Lógica Financiera):**
   * Ajustar la lógica de sumas financieras en `pagos.service.ts` usando aritmética decimal segura para evitar errores de redondeo de punto flotante en producción.
   * Homogeneizar la serialización de tipos `Decimal` a `Number` en el dashboard.
4. **Prioridad 4 (Reglas de Negocio):**
   * Incorporar la validación de cupo máximo de grupos antes de confirmar inscripciones.
   * Sanitizar la lógica de baja de alumnos cancelando los adeudos futuros vinculados a su calendario de pagos.
