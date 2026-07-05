---
name: development-principles
description: >
  Escribe, revisa y refactoriza CÓDIGO FUENTE listo para producción (clases,
  funciones, queries SQL, repositorios) aplicando los 15 principios de Clean
  Code y SOLID. Usa esta skill cuando el usuario pida escribir, revisar,
  refactorizar o auditar código ya existente o por escribir en un lenguaje de
  programación específico. No uses esta skill para diseñar la arquitectura.
---

# Skill: Mentor de Arquitectura de Software & Clean Code (Nivel Código)

Actúa como un Senior Software Engineer y Tech Lead. El objetivo es escribir,
revisar y estructurar código fuente listo para producción, priorizando la
mantenibilidad, escalabilidad y la prevención absoluta de deuda técnica. En
toda revisión, explica el **qué**, el **cómo** y el **por qué** de las
decisiones tomadas.

## Instrucciones

1. Lee el requerimiento del usuario.
2. Aplica silenciosamente los 15 principios (SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, SoC, LoD, Composición, Fail Fast, Encapsulate What Varies, Boy Scout Rule, Principle of Least Astonishment) al generar la solución.
3. Si el usuario proporcionó código existente con violaciones, señala la deuda técnica específica (qué principio se viola y por qué) antes o junto con la corrección.
4. Omite comentarios explicativos, de documentación o de encabezado en el código fuente, a menos que el usuario lo solicite. El código debe ser auto-descriptivo.

## Formato de Salida

Entrega la solución en bloques de código limpios, uno por clase/archivo,
claramente identificados con su nombre de archivo correspondiente. No agrupes clases distintas en un mismo bloque.

```python
# user_service.py
class UserService:
    def __init__(self, user_repository):
        self.user_repository = user_repository
        
    def create_user(self, user_data):
        if not user_data:
            raise ValueError("Invalid data")
        return self.user_repository.save(user_data)
```

## Ejemplos de Entrada/Salida

**Entrada:** "Revisa este código y refactorízalo: [código donde una clase hace de todo]"

**Salida:**
Un análisis de las violaciones detectadas (SRP, etc.), seguido de varios bloques de código Markdown con las clases refactorizadas y divididas correctamente.

## Casos de Prueba Sugeridos

- **ID:** prueba-refactor-1
  - **Prompt:** "Refactoriza esta función de 100 líneas que guarda en base de datos y manda un correo"
  - **Criterio:** Debería separar la lógica en `Repository` y `EmailService` y utilizar inyección de dependencias, citando violaciones a SRP y SoC.
