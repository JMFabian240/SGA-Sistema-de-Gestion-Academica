---
name: ooad-generador-requisitos
description: Skill para la generación estructurada de requerimientos funcionales. Asegúrate de usar esta skill siempre que el usuario solicite redactar requerimientos, especificaciones de sistema, historias de usuario, o necesite desglosar un problema técnico en funcionalidades concretas.
---

# Generador de Requerimientos Funcionales

## Objetivo
Transformar descripciones informales, ideas abstractas o contextos de sistemas en requerimientos funcionales rigurosos, reduciendo la ambigüedad y facilitando la arquitectura de software.

## Instrucciones (El Patrón)
Todo requerimiento funcional generado DEBE seguir estrictamente la siguiente estructura en la columna de descripción:
**Actor / Acción / Objeto de Acción / Datos de entrada / Resultado esperado**

Además, cada requerimiento DEBE ser **ATÓMICO**:
* **Atomicidad:** Un requerimiento funcional solo debe representar UNA única acción. No utilices conjunciones (como "y", "además") para agrupar múltiples funcionalidades en un mismo requisito. Si hay múltiples acciones (ej. "crear cuenta y asignar permisos"), divídelas en requerimientos separados.

* **Actor:** El usuario o sistema que ejecuta la funcionalidad en el software.
* **Acción:** La funcionalidad ejecutada por el usuario (su objetivo).
* **Objeto de acción:** La entidad o componente involucrado en la acción.
* **Datos de entrada:** Información necesaria para iniciar la funcionalidad.
* **Resultado esperado:** Información resultante o estado esperado del sistema.

## Formato de Salida Requerido
La salida debe organizarse de manera estandarizada, modular y estructurada:

1. **Agrupación y Secuencia:** Agrupa los requerimientos por módulos claramente identificados. Ordena los módulos y los requerimientos en el orden de construcción técnico (ej. Configuración Inicial > Autenticación > CRUDs Base > Lógica de Negocio > Reportes).
2. **Estructura Tabular:** Utiliza EXCLUSIVAMENTE la siguiente tabla para detallar cada módulo.
3. **Restricción de Formato:** La salida final DEBE ser entregada exclusivamente dentro de un solo bloque de código Markdown (`.md`). Omitir saludos, introducciones, confirmaciones o cualquier texto conversacional fuera de dicho bloque.

## Plantilla Estricta de Salida (Bloque de Código)

```markdown
# Especificación de Requerimientos Funcionales - [Nombre del Proyecto]

## Módulo 1: [Nombre del Módulo Base]
| ID | Descripción | Tipo |
| :--- | :--- | :--- |
| RF-01 | [Actor] debe poder [Acción] el [Objeto de Acción], ingresando [Datos de entrada], para [Resultado esperado]. | (Usuario o Sistema) |

## Módulo N: [Nombre del Módulo Siguiente en Orden de Construcción]
| ID | Descripción | Tipo |
| :--- | :--- | :--- |
| RF-N | [Actor] debe poder [Acción] el [Objeto de Acción], ingresando [Datos de entrada], para [Resultado esperado]. | (Usuario o Sistema) |
```

## Ejemplos de Entrada/Salida

**Entrada:** "Quiero que los usuarios puedan registrarse en la plataforma con su correo y contraseña"

**Salida:**
```markdown
# Especificación de Requerimientos Funcionales - Proyecto

## Módulo 1: Autenticación
| ID | Descripción | Tipo |
| :--- | :--- | :--- |
| RF-01 | El usuario debe poder registrarse en la plataforma, ingresando correo y contraseña, para obtener acceso al sistema. | Usuario |
```

## Casos de Prueba Sugeridos

- **ID:** prueba-registro-1
  - **Prompt:** "El administrador debe poder dar de baja a un alumno proporcionando su ID"
  - **Criterio:** Genera un RF válido con el actor 'administrador', acción 'dar de baja', objeto 'alumno', etc. y la tabla correspondiente.
