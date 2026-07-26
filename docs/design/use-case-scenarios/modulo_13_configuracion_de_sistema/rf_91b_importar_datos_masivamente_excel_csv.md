# RF-91b: Importar datos masivamente (Excel/CSV)

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-91b: Importar datos masivamente (Excel/CSV) |
| **Actor** | Administrador y Gestor Administrativo |
| **Objetivo** | Cargar en bloque catálogos (grados, grupos, tarifas), inscripciones, saldos iniciales y pagos históricos desde archivos estructurados Excel (.xlsx) o CSV para inicializar o regularizar la base de datos local. |
| **Flujo Principal** | 1. El actor entra a Configuración -> Importación de Datos.<br>2. Elige el tipo de carga masiva (Catálogos, Inscripciones, Saldos o Pagos Históricos).<br>3. Selecciona y sube el archivo .xlsx o .csv desde su computadora.<br>4. El sistema analiza el archivo, valida formatos, tipos de datos y referencias existentes.<br>5. Muestra un resumen preliminar de registros válidos a importar.<br>6. El actor confirma y ejecuta la importación.<br>7. El sistema inserta los registros de manera transaccional en PostgreSQL y genera el informe final de resultados. |
| **Flujo Alterno** | <b>A.</b> Errores de validación en columnas:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si el archivo tiene filas con identificadores faltantes, formatos incorrectos o referencias inexistentes, el sistema reporta el número de fila y el error específico.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. Cancela la transacción sin insertar datos parciales (rollback), solicitando al actor corregir el archivo y volver a intentarlo. |
| **Precondiciones** | El archivo debe cumplir con el formato y encabezados de plantilla requeridos por el importador. |
| **Postcondiciones** | Los catálogos o transacciones importadas quedan persistidas e indexadas en el sistema de gestión. |
| **Reglas de negocio involucradas** | • Toda importación se ejecuta dentro de una transacción para mantener coherencia atómica (todo o nada).<br>• Se registra en el log de auditoría global la ejecución, nombre del archivo y número de registros importados. |
