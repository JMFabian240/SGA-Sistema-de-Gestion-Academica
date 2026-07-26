# @sga/data-access

Única fuente de verdad de la base de datos del Sistema de Gestión Académica. Contiene el esquema Prisma, las migraciones SQL y expone el Singleton del Prisma Client para ser consumido exclusivamente por `@sga/back-end`.

> **Especificación del Modelo Relacional:** Para el diagrama ER global, las reglas de integridad monetaria (`Decimal(12, 2)`), borrado suave (`eliminadoEn`) y la especificación técnica de los 26 modelos y 8 enums agrupados en 6 dominios, consulta [`docs/architecture/database-architecture.md`](../../docs/architecture/database-architecture.md).

---

## Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **Prisma ORM** | Modelado del esquema, migraciones y generación del Client |
| **PostgreSQL 16** | Motor de base de datos (portátil, orquestado por Tauri) |

---

## Dominios del Esquema (6 dominios · 26 modelos · 8 enums)

| Dominio | Modelos principales |
|---|---|
| Seguridad y RBAC | `Rol`, `Usuario`, `UsuarioRol`, `IntentoLogin`, `TokenRevocado` |
| Configuración y Auditoría | `ConfiguracionGlobal`, `ConfiguracionRecargo`, `LogAuditoria` |
| Estructura Académica | `NivelEducativo`, `Grado`, `CicloEscolar`, `Grupo`, `Materia`, `Calificacion`, `Asistencia` |
| Padrón Familiar | `Tutor`, `DatosFiscales`, `Alumno`, `TutorAlumno` |
| Finanzas y Cobranza | `Tarifa`, `PlanPago`, `InscripcionCiclo`, `CalendarioPago`, `Pago`, `AplicacionPago`, `Recargo`, `MovimientoSaldo` |
| Becas y Digitalización | `Beca`, `SolicitudBeca`, `AsignacionBeca`, `Documento`, `Notificacion` |

---

## Convenciones del Esquema

- **Idioma:** Modelos y campos en español (`Alumno`, `CalendarioPago`), tablas en SQL en `snake_case` mediante `@map` / `@@map`.
- **Borrado Suave:** Todas las entidades principales incluyen `eliminadoEn DateTime?` en lugar de `DELETE` físico.
- **Precisión Monetaria:** Todos los campos de dinero usan `@db.Decimal(12, 2)` para evitar errores de coma flotante.

---

## Comandos

```bash
# Generar el cliente Prisma después de cambiar schema.prisma:
npm run db:generate

# Crear y aplicar una nueva migración:
npm run db:migrate

# Abrir Prisma Studio (inspector visual de la BD):
npm run db:studio
```

---

## Notas Importantes

- La conexión a PostgreSQL **existe únicamente en este paquete**. Ningún otro paquete importa drivers de BD directamente.
- La variable `DATABASE_URL` debe apuntar a la instancia de PostgreSQL Portable levantada por Tauri (o a Docker en entorno de desarrollo).
- Los archivos `src/client.js` y `src/index.js` son transpilaciones de compatibilidad. El source of truth son los archivos `.ts` equivalentes.
