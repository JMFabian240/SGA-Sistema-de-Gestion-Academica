# @sga/back-end

Capa de lógica de negocio y API del Sistema de Gestión Académica. Expone todos los procedimientos del sistema mediante **tRPC** (tipado end-to-end), validados con **Zod** y servidos por **Fastify**.

> **Especificación Arquitectónica Detallada:** Para el desglose individual de los 15 módulos, el modelo de capas (`Router → Service → Repository → Domain`) y los algoritmos financieros, consulta [`docs/architecture/backend-architecture.md`](../../docs/architecture/backend-architecture.md).

---

## Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **Fastify** | Servidor HTTP de alto rendimiento |
| **tRPC v10** | API tipada end-to-end con el frontend |
| **Zod** | Validación y parsing de inputs en cada procedimiento |
| **`@sga/data-access`** | Único punto de acceso a la base de datos (Prisma) |

---

## Módulos del Sistema (15)

`alumnos` · `auditoria` · `auth` · `becas` · `calificaciones` · `configuracion` · `dashboard` · `grupos` · `importaciones` · `inscripciones` · `pagos` · `reportes` · `storage` · `tutores` · `usuarios`

Cada módulo implementa el patrón de 4 capas:
```
[modulo].schema.ts    → Validación Zod de inputs/outputs
[modulo].router.ts    → Definición de procedimientos tRPC
[modulo].service.ts   → Lógica de negocio y orquestación
[modulo].repository.ts → Consultas Prisma (boundary de tipos)
[modulo].domain.ts    → Algoritmos puros (sin efectos secundarios)
```

---

## Distribución como Sidecar

El backend se compila como un ejecutable `.exe` autónomo que Tauri arranca como proceso hijo al iniciar la app de escritorio. No requiere Node.js instalado en el equipo del usuario final.

```bash
# Compilar el binario sidecar:
npm run build:sidecar --workspace=@sga/back-end
```

---

## Desarrollo

```bash
# Desde la raíz del monorepo:
npm run dev:back-end

# Solo este paquete:
npm run dev
```

## Pruebas

```bash
# Pruebas unitarias y de integración:
npm test

# Pruebas funcionales (requieren BD activa):
npm run test:functional

# Pruebas de integración (requieren BD activa):
npm run test:integration
```

---

## Notas Importantes

- Es arrancado por Tauri **después** de que PostgreSQL esté activo y aceptando conexiones.
- Es detenido de forma segura (`SIGTERM`) al cerrar la ventana de escritorio.
- Los archivos subidos (comprobantes, documentos) se almacenan en `uploads/comprobantes/`. Esta carpeta está en `.gitignore` ya que contiene datos reales de usuarios.
- El bundle `server.bundle.js` generado por `pkg` también está en `.gitignore`.
