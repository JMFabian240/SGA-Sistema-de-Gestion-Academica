---
name: importaciones-orientadas-negocio
description: Lineamientos para diseñar e implementar plantillas de importación masiva orientadas a flujos de negocio en lugar de tablas de base de datos.
---

# Guía para Importaciones Orientadas al Negocio

Esta skill define cómo debe abordarse cualquier requerimiento para crear plantillas de importación masiva (CSV/Excel) en el sistema.

## 1. Principio Fundamental
**Las plantillas deben estar orientadas al usuario y al flujo de trabajo, NO a la estructura de la base de datos.**
- ❌ **Mala práctica:** Crear un archivo `tutor.csv`, un archivo `alumno.csv` y pedirle al usuario que cruce los IDs manualmente.
- ✅ **Buena práctica:** Crear una sola plantilla plana `Inscripciones.csv` con columnas descriptivas (`Matricula`, `Nombre Alumno`, `Nivel`, `Nombre Tutor`, `Teléfono Tutor`, etc.).

## 2. Responsabilidades Arquitectónicas

### ¿Quién aplica las reglas de negocio?
- **El Backend (Módulo de Importaciones)** es el **ÚNICO responsable** de aplicar y hacer cumplir las reglas de negocio, validar la integridad referencial y prevenir duplicidades.
- **La Plantilla (CSV/Excel)**: Su única responsabilidad es ser el vehículo de recolección de datos. Las plantillas **NO** garantizan la validez de las reglas de negocio. Solo deben asegurar que exigen las columnas necesarias (ej. pedir "CURP" si es que la regla de negocio lo requiere para la inserción).

### Flujo Técnico Recomendado en el Backend
Cuando el backend reciba la plantilla plana, el orquestador (`importaciones.service.ts`) debe:
1. Parsear el archivo.
2. Abrir una sola transacción en base de datos (`prisma.$transaction`).
3. Normalizar la data en memoria:
   - Buscar o crear catálogos (ej. Nivel Educativo).
   - Buscar o crear entidades raíz (ej. Tutor usando su email/teléfono).
   - Crear entidades secundarias (ej. Alumno) y relacionarlas (`TutorAlumno`).
4. Si una regla de negocio falla (ej. el grupo ya no tiene cupo, o la matrícula ya existe), abortar la transacción entera y devolver al usuario un error descriptivo indicando en qué fila exacta ocurrió el error.

## 3. Ejemplos de Plantillas por Flujo

### A. Flujo "Inscripción de Alumnos"
Columnas de la plantilla:
`Matricula | Nombre Completo Alumno | Fecha Nacimiento | CURP Alumno | Nivel Educativo | Grado | Grupo | Nombre Tutor Principal | Teléfono Tutor | Correo Tutor`

### B. Flujo "Catálogo Académico"
Columnas de la plantilla:
`Nivel Educativo | Grado | Nombre Grupo | Cupo Máximo`

## 4. Lineamientos de Desarrollo
1. Si un desarrollador o agente pide implementar una importación, siempre debe proponer agrupar los datos en "Vistas Planas" (Flat Views) orientadas a un objetivo del colegio.
2. Nunca exponer al usuario conceptos como "IDs", "Llaves Foráneas" o "Tablas Relacionales" en las cabeceras de los archivos a importar.
