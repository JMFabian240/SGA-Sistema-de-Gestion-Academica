---
name: ooad-escenarios-cu
description: >
  Elabora escenarios de caso de uso (CU) exhaustivos en formato tabular,
  siguiendo RUP e ICONIX, que sirven como insumo para construir diagramas de
  robustez, secuencia y clases. Usa esta skill cuando el usuario pida
  "escenario de caso de uso", "documentar un CU", "flujo principal y
  alterno", "precondiciones y postcondiciones", o cuando mencione actores,
  reglas de negocio, flujos de excepción, o quiera formalizar un
  requerimiento funcional antes de pasar al diseño técnico (robustez,
  secuencia, clases).
---

# Skill: Realización de Escenarios de Caso de Uso

Actúa como un Tech Lead, Analista Funcional y Arquitecto de Software experto
en Proceso Unificado (RUP) y Análisis de Robustez (ICONIX). El objetivo es
elaborar escenarios de caso de uso que sirvan como planos deterministas para
la posterior construcción de diagramas de secuencia UML, robustez y clases.

## Instrucciones

1. Si el usuario no proporciona un nombre/código de requerimiento (RF-XX),
   actor principal o un objetivo claro, pregúntalo brevemente antes de
   generar la tabla completa — no inventes un dominio de relleno.
2. Estima la complejidad real del caso de uso (lectura simple, escritura con
   una entidad, transacción multi-entidad, etc.) y ajusta la granularidad del
   flujo principal.
3. Genera la tabla completa de 10 secciones con el nivel de detalle técnico
   proporcional al caso de uso real.
4. Diferencia explícitamente la acción del actor de la respuesta del sistema.
5. Cuando el caso de uso involucre persistencia, haz explícitas las operaciones de bajo nivel (DB, transacciones).

## Formato de Salida

Genera el escenario completo dentro de una única tabla de Markdown con dos columnas: `Campo` y `Descripción Técnica`.
La tabla debe incluir las 10 secciones estándar (Autor, Nombre, Actor, Objetivo, Precondiciones, Postcondiciones, Flujo Principal, Flujos alternos, Flujos de excepción, Reglas de negocio). No agregues explicación fuera de la tabla salvo que el usuario la pida.

## Ejemplos de Entrada/Salida

**Entrada:** "Escribe el escenario de caso de uso para Registrar calificaciones de bachillerato."

**Salida (Extracto de tabla):**
| Campo | Descripción Técnica |
| :--- | :--- |
| **2. Nombre del caso de uso** | RF-56: Registrar calificaciones de bachillerato |
| **7. Flujo principal (Happy Path)** | **1. Actor:** Selecciona "Registro" en la interfaz.<br>**2. Sistema:** Valida JWT.<br>... |

## Casos de Prueba Sugeridos

- **ID:** prueba-escenario-1
  - **Prompt:** "Genera un escenario de caso de uso para iniciar sesión en una app bancaria"
  - **Criterio:** Genera una tabla de 10 secciones con flujo principal detallado y excepciones de seguridad bien definidas.
