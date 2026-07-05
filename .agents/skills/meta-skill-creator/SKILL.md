---
name: meta-skill-creator
description: Guía solo en Markdown para crear, evaluar y mejorar skills; plantillas, preguntas clave y proceso iterativo (sin scripts ni comandos).
---

# Creator Skill

Guía práctica y conceptual para crear nuevas skills y mejorarlas iterativamente, formulada exclusivamente en Markdown y sin dependencias ni instrucciones de ejecución.

## Resumen del proceso

- Definir intención y alcance de la skill.
- Redactar un borrador de la skill (frontmatter + cuerpo).
- Diseñar 2–5 casos de prueba representativos.
- Ejecutar las pruebas manualmente o con la herramienta que prefieras (sin instrucciones aquí).
- Recopilar retroalimentación cualitativa y cuantitativa.
- Revisar la skill según la retroalimentación y repetir.

## Comunicación con el usuario

Adecúa el lenguaje según la familiaridad técnica del usuario. Pregunta si deben usarse términos como "JSON", "aserción" o "benchmark" antes de introducirlos.

## Capturar intención

Antes de escribir la skill, clarifica:

1. ¿Qué debe permitir que haga la skill?
2. ¿Cuándo (en qué frases o contextos) debería activarse?
3. ¿Cuál es el formato de salida esperado?
4. ¿Qué criterios de éxito o casos de prueba propones?

Registra las respuestas y pide ejemplos de entrada/salida.

## Entrevista e investigación

- Pregunta por casos extremos, formatos, dependencias y archivos de ejemplo.
- Si hay documentación relevante, pídela o pide un extracto.
- Propón ejemplos de prompts de usuario realistas para las pruebas.

## Escribir `SKILL.md`

Componentes recomendados:

- Nombre: identificador corto y claro.
- Descripción: cuándo usarla y qué hace (hazla insistente para mejorar activación).
- Compatibilidad (opcional): dependencias conceptuales.
- Instrucciones: pasos que debe seguir el modelo para generar la salida.
- Formato de salida: plantillas concretas en Markdown.
- Ejemplos de entrada/salida.
- Casos de prueba sugeridos.

### Estructura sugerida

```
nombre-de-skill/
├── SKILL.md  (frontmatter + instrucciones)
├── references/ (opcional, documentos de apoyo)
└── scripts/ (opcional, descrito pero no incluido aquí)
```

(NOTA: en esta guía evitamos scripts; la estructura anterior es meramente organizativa.)

## Plantillas útiles (Markdown)

**Plantilla de informe**

# [Título]

## Resumen ejecutivo

## Hallazgos clave

## Recomendaciones

**Ejemplo de prompt / salida**

**Entrada:** "Resume este documento técnico en 3 puntos clave"

**Salida esperada:**

- Punto 1: ...
- Punto 2: ...
- Punto 3: ...

## Casos de prueba

- Diseña 2–5 prompts reales que representen tareas comunes.
- Para cada prompt, anota la intención, el criterio de éxito y ejemplos de salida aceptable.

Ejemplo de caso de prueba (texto):

- ID: prueba-resumen-1
- Prompt: "Resume el archivo X y extrae 5 métricas clave"
- Criterio: lista de 5 métricas presentes y explicadas brevemente.

## Ejecutar y evaluar (conceptual)

1. Ejecuta cada caso de prueba con la skill y sin la skill (o con la versión anterior cuando corresponda).
2. Recolecta las salidas y compáralas con los criterios de éxito.
3. Recopila retroalimentación humana (comentarios por caso) y registra observaciones de análisis.
4. Para métricas cuantitativas (p. ej., tasa de cumplimiento de aserciones, tiempo aproximado), organiza los resultados en tablas Markdown.
5. Resume hallazgos y propone cambios concretos en la skill.

No se incluyen comandos ni scripts; el objetivo es dejar claro el flujo de trabajo para ser ejecutado con la herramienta que prefieras.

## Mejorar la skill (iteración)

- Generaliza a partir de la retroalimentación; evita sobreajustar la skill a ejemplos particulares.
- Simplifica instrucciones que no aportan valor.
- Si varias pruebas requieren la misma transformación, sugiere centralizar esa lógica en una sección de instrucciones o en un recurso reutilizable (descríbelo en Markdown).
- Reescribe el prompt de la skill explicando el porqué de cada paso para mejorar la comprensión del modelo.

## Optimización de la descripción (activador)

- Crea un conjunto de consultas de evaluación: mezcla de situaciones que deberían activar la skill y situaciones que no.
- Revisa las consultas con el usuario y afina la descripción para mejorar precisión.
- Documenta los resultados y la versión final de la descripción.

## Principios y buenas prácticas

- Principio de falta de sorpresa: la skill no debe contener sorpresas ni comportamientos ocultos.
- Mantén el `SKILL.md` claro y por debajo de unas 500 líneas idealmente; si crece, divide por variantes y referencias.
- Prefiere ejemplos y plantillas claras en lugar de reglas rígidas en mayúsculas.
- Evita instrucciones operativas o de ejecución; concentra la guía en formato y contenido.
