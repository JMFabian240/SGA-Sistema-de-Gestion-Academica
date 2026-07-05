---
name: front-react-trpc
description: Reglas y patrones para desarrollar en el paquete @sga/front-end. Activar al crear o modificar UI, componentes o consumir la API tRPC.
---

# Front-End Skill (@sga/front-end)

Guía para mantener la consistencia y arquitectura de la capa de UI.

## Tecnologías Principales

- **React 18** + **Vite** + **TypeScript**
- **CSS Modules** o Vanilla CSS (sin frameworks de UI estilo Tailwind a menos que se indique).
  - Usar siempre las variables globales CSS definidas en `index.css` (ej. `var(--color-primary)`, `var(--color-bg)`, `var(--color-text)`, `var(--shadow-sm)`). No usar colores hardcodeados.
  - Para diseños de layout (Sidebar/Header) basarse en los patrones establecidos ( Sidebar azul oscuro `--color-sidebar-bg`, Header fondo blanco).
- **TanStack Query** (React Query) para manejo de estado asíncrono y caché del servidor.
- **React Router** para navegación de vistas.
- **tRPC** para comunicación fuertemente tipada con el backend.

## Convenciones de Nombres y Estructura

- Nombra los archivos de componentes en PascalCase: `MiComponente.tsx`.
- Nombra los archivos de estilos usando módulos: `MiComponente.module.css`.
- Nombra los hooks personalizados en camelCase empezando con `use`: `useUsuarios.ts`.
- Estructura recomendada para un componente:
  ```
  components/
  └── MiComponente/
      ├── MiComponente.tsx
      ├── MiComponente.module.css
      └── index.ts
  ```

## Reglas y Prohibiciones

- **PROHIBIDO**: Importar dependencias del backend, como `PrismaClient` o lógica de Node.js nativa.
- **PROHIBIDO**: Escribir llamadas `fetch` o `axios` manuales. Toda comunicación con el servidor debe hacerse exclusivamente a través de tRPC.
- **PERMITIDO**: Importar y usar únicamente *tipos* (interfaces, types) exportados explícitamente de `@sga/data-access` o `@sga/back-end`.

## Consumir tRPC desde el Front

- Usa los hooks generados por `@trpc/react-query`.
- Ejemplo para consultar (Query): `const { data, isLoading } = trpc.usuarios.obtener.useQuery();`
- Ejemplo para mutar (Mutation): `const mutacion = trpc.usuarios.crear.useMutation();`

## Ejemplo Mínimo de un Componente Correcto

**`UsuarioLista.tsx`**

```tsx
import React from 'react';
import { trpc } from '../../utils/trpc';
import styles from './UsuarioLista.module.css';

export const UsuarioLista: React.FC = () => {
  const { data: usuarios, isLoading, error } = trpc.usuarios.listar.useQuery();

  if (isLoading) return <div className={styles.loading}>Cargando...</div>;
  if (error) return <div className={styles.error}>Error: {error.message}</div>;

  return (
    <ul className={styles.lista}>
      {usuarios?.map((u) => (
        <li key={u.id} className={styles.item}>
          {u.name} ({u.email})
        </li>
      ))}
    </ul>
  );
};
```
