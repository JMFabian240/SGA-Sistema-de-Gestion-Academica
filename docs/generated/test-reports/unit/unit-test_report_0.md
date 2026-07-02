# Reporte de Pruebas (Test Report) - Backend SGA

**Fecha de Ejecución**: 02 de Julio, 2026
**Comando Ejecutado**: `npm run test`
**Framework**: Vitest v4.1.9

---

## 📊 Resumen Ejecutivo

| Métrica | Total | Exitosas | Fallidas | Porcentaje de Éxito |
| :--- | :---: | :---: | :---: | :---: |
| **Archivos de Prueba Unitarias** | 10 | 10 | 0 | 100% |
| **Casos de Prueba (Tests)** | 87 | **87** | **0** | 100% |

> [!TIP]
> **Colisión Resuelta**: Se actualizó el archivo `vitest.config.ts` para excluir la carpeta `tests/integration/` de la ejecución principal. Ahora `npm run test` corre **únicamente** la lógica unitaria.

---

## 🔍 Desglose por Módulo (Unitario)

Todos los módulos base del sistema han sido evaluados empleando `prisma-mock.ts` para asegurar que la lógica de negocio y las validaciones respondan correctamente independientemente de la base de datos:

- ✅ `server.test.ts` (1 test)
- ✅ `calificaciones.service.test.ts` (8 tests)
- ✅ `grupos.service.test.ts` (8 tests)
- ✅ `configuracion.service.test.ts` (4 tests)
- ✅ `tutores.service.test.ts` (11 tests)
- ✅ `alumnos.service.test.ts` (10 tests)
- ✅ `pagos.service.test.ts` (11 tests)
- ✅ `becas.service.test.ts` (12 tests)
- ✅ `inscripciones.service.test.ts` (14 tests)
- ✅ `auth.service.test.ts` (8 tests)

---

## 🚀 Pruebas de Integración (End-to-End)

Las pruebas de integración ahora viven de forma aislada e independiente en su propio comando.

> [!NOTE]
> Para ejecutar la suite que valida el almacenamiento real contra **PostgreSQL**, utiliza:
> `npm run test:integration`

El estado actual de las pruebas de integración es:
- **Archivos de Prueba**: 9
- **Casos de Prueba**: 20
- **Cobertura**: 100% Éxito (Auth, Alumnos, Tutores, Grupos, Becas, Inscripciones, Pagos, Calificaciones y Configuración).
