---
name: sga-auditorias-generales
description: Estándares de formato, diagramas, matrices y estructura obligatoria para la redacción de informes de auditoría técnica general del SGA.
---

# Guía de Auditorías Generales — SGA

Esta skill define el formato técnico, organización y secciones obligatorias requeridas al redactar cualquier informe de auditoría del Sistema de Gestión Académico (SGA).

---

## 1. Reglas Generales de Redacción
* **Título H1 Único**: Cada documento de auditoría debe iniciar con un único título `# Título de la Auditoría`.
* **Sin Placeholders**: Queda prohibido el uso de secciones incompletas o comodines como `TODO`, `...` o `[Pendiente]`. Toda evaluación de riesgo o gap debe justificarse y detallarse.
* **Integridad Relacional**: Todo enlace a archivos de código, esquemas de base de datos o documentación de requerimientos debe utilizar la sintaxis con el esquema absoluto `file:///` y barras diagonales (forward slashes), evitando el uso de comillas invertidas en el texto del enlace.

---

## 2. Estructura Obligatoria del Documento

Toda auditoría general del SGA debe dividirse estrictamente en las siguientes secciones:

### I. Título y Metadatos
* Título descriptivo e identificador.
* Tabla de metadatos del proyecto que contenga:
  * **Proyecto**: Nombre del sistema evaluado (SGA).
  * **Fecha**: Fecha de emisión de la auditoría (YYYY-MM-DD).
  * **Auditor**: Agente o rol encargado de la auditoría.
  * **Estado General**: Diagnóstico preliminar (ej: Crítico, En Riesgo, Estable).

### II. Propósito y Resumen Ejecutivo
* Justificación del análisis (por qué se realiza la auditoría).
* Alertas visuales destacadas (utilizando los callouts `> [!IMPORTANT]` o `> [!WARNING]`) detallando los **riesgos críticos de negocio** detectados (ej: pérdida de integridad relacional en pagos, aforos excedidos o vulnerabilidades de seguridad).

### III. Análisis de Arquitectura
* Visualización gráfica de la topología o flujo de datos actual del sistema.
* **Estándar**: Obligatorio utilizar diagramas con sintaxis `plantuml` (ej: diagramas de componentes, secuencia o despliegue) para graficar flujos y codependencias físicas.

### IV. Matriz de Deuda Técnica por Módulos
Una evaluación exhaustiva representada mediante **tablas Markdown (matrices)** para cada una de las cuatro capas principales del sistema. Cada tabla debe estructurarse con las columnas: `Módulo / Componente`, `Deuda Técnica / Hallazgo`, `Impacto`, `Esfuerzo` y `Remediación Sugerida`.

1. **Capa Database**:
   * Grado de cumplimiento de la Tercera Forma Normal (3FN).
   * Indexación de columnas clave para búsquedas frecuentes (foreign keys, consultas de fecha).
   * Verificación del uso de tipos exactos (ej: BigInt, Decimal para saldos, Date/DateTime correctos en PostgreSQL).
2. **Capa Backend**:
   * Respeto a los principios SOLID y DRY en servicios y controladores.
   * Separación física en las capas DAO/Repository y Service.
   * Legibilidad y adherencia al Clean Code (nombres autoexplicativos, funciones de responsabilidad única).
3. **Capa Frontend**:
   * Evaluación de interfaces de usuario y patrones de UX/UI.
   * Comprobación de la separación de la lógica del negocio (hooks, context, tRPC) respecto a la vista (componentes presentacionales en React).
4. **Capa Infraestructura**:
   * Configuración de redes, endpoints tRPC expuestos, CLI (Tauri command lines) y seguridad global (sesiones, JWT, encriptación).

### V. Reporte de Rendimiento
Métricas de rendimiento del servidor HTTP/tRPC y base de datos representadas mediante una **tabla Markdown (matriz de rendimiento)**.
* **Formato**:
  | Procedimiento / Endpoint | Tiempo Promedio (ms) | Umbral Límite (ms) | Estado (Óptimo/Alerta/Crítico) | Cuello de Botella Detectado | Acción Recomendada |
  | :--- | :---: | :---: | :---: | :--- | :--- |

### VI. Matriz de Prioridades
Tabla comparativa de hallazgos ordenados por su cuadrante de impacto técnico/operativo frente al esfuerzo necesario para corregirlos.
* **Formato**:
  | Hallazgo / Gap | Impacto (Crítico/Alto/Medio/Bajo) | Esfuerzo (Alto/Medio/Bajo) | Prioridad (Alta/Media/Baja) |
  | :--- | :---: | :---: | :---: |

### VII. Plan de Acción
* Pasos ordenados y secuenciales sugeridos para ejecutar la refactorización o corrección de gaps detectados (separados por fases o hitos de desarrollo).

### VIII. Checklist de Producción y Estado de Avance
* Lista de tareas de despliegue y control final en formato checklist de Markdown (`- [ ]`) indicando el estado de avance actual de la remediación.
