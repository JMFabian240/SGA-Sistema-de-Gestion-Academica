# Reporte de Pruebas Funcionales - Backend SGA

**Fecha de Ejecución**: 05 de Julio, 2026
**Comando Ejecutado**: `npm run test:functional`
**Framework**: Vitest v4.1.9

---

## 📊 Resumen Ejecutivo

| Métrica | Total | Exitosas | Fallidas | Porcentaje de Éxito |
| :--- | :---: | :---: | :---: | :---: |
| **Archivos de Prueba Funcional** | 13 | 13 | 0 | 100% |
| **Casos de Prueba (Tests)** | 50 | **50** | **0** | 100% |

---

## 🚀 Desglose por Módulo (Pruebas de Funcionalidad)

Las siguientes pruebas validaron las reglas de negocio críticas, consistencia lógica, constraints relacionales y flujos de negocio simulando peticiones reales contra la base de datos de pruebas PostgreSQL (`sga_test`):

- ✅ `usuarios.test.ts` (7 tests) - *Gestión de usuarios, paginación, roles y restricciones de desactivación de cuenta propia*
- ✅ `auth.test.ts` (6 tests) - *Autenticación, bloqueos temporales por intentos fallidos e inicio indistinto por correo/usuario*
- ✅ `becas.test.ts` (6 tests) - *Soft deletes de becas, solicitudes duplicadas y asignación atómica de becas aprobadas*
- ✅ `configuracion.test.ts` (4 tests) - *Inicialización automática, actualizaciones parciales e incondicionales, y validación de rangos*
- ✅ `grupos.test.ts` (5 tests) - *Inactivación automática de ciclos previos, gestión de materias y asignaciones de nivel y grupo*
- ✅ `inscripciones.test.ts` (4 tests) - *Ventanas de inscripción, planes de pago y control de inscripciones duplicadas por ciclo*
- ✅ `pagos.test.ts` (3 tests) - *Generación de adeudos y conciliación con saldos a favor en transacciones atómicas*
- ✅ `alumnos.test.ts` (2 tests) - *Detalle completo, borrado lógico de alumnos y vinculación/desvinculación atómica con tutores*
- ✅ `tutores.test.ts` (2 tests) - *Borrado lógico de tutores con restricción de eliminación si cuentan con saldo a favor activo*
- ✅ `calificaciones.test.ts` (5 tests) - *Upsert de calificaciones, boleta de calificaciones del ciclo escolar e historial académico (Kárdex)*
- ✅ `reportes.test.ts` (3 tests) - *Reportes financieros (Deudores, Ingresos) y listas de asistencia mensuales filtradas*
- ✅ `auditoria.test.ts` (1 test) - *Paginación, filtros multidimensionales de bitácora y casteo seguro de BigInt a String*
- ✅ `dashboard.test.ts` (2 tests) - *Métricas de inscripciones por nivel y sumatoria acumulada de ingresos del mes actual y deudas*

**Estado Final**: PASÓ (100% de éxito).
