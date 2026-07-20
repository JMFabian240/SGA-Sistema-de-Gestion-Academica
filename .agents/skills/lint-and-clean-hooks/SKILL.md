---
name: lint-and-clean-hooks
description: Analiza y corrige advertencias de dependencias en React hooks (exhaustive-deps) y bloques catch vacíos.
---

# Lint and Clean Hooks Skill

## Propósito
Esta habilidad asegura la limpieza del código de la interfaz de usuario en el frontend, previniendo errores silenciosos por manejo incorrecto de excepciones y ciclos de re-renderizado en React debido a dependencias faltantes en los hooks.

## Cuándo usar
Utiliza esta skill cuando termines de implementar una funcionalidad en `packages/front-end`, cuando se reporten advertencias de eslint, o cuando se requiera estabilizar un componente.

## Procedimiento
1. **Detección de problemas:** Corre el comando `npx eslint . --ext .ts,.tsx` dentro de `packages/front-end` (o usa la salida de errores en consola).
2. **Arreglar exhaustive-deps:**
   - Lee el componente afectado. 
   - Si una dependencia requerida cambia en cada render, envuelve su cálculo en `useMemo` o `useCallback`.
   - Si no, simplemente agrégala al array de dependencias del `useEffect` o `useMemo`.
3. **Manejo de Excepciones:**
   - Busca `catch (e) { }` vacíos usando la herramienta `grep_search`.
   - Modifica el bloque para asegurar que la excepción sea notificada al usuario (ej. usando `toast.error(e.message)` o `alert(e.message)`).
4. **Verificación final:** Vuelve a correr el linter para asegurar que el archivo quedó 100% limpio.
