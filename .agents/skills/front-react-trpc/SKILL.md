---
name: front-react-trpc
description: Reglas y patrones para desarrollar en el paquete @sga/front-end. Activar al crear o modificar UI, componentes o consumir la API tRPC.
---

# Front-End Skill (@sga/front-end)

Guía para mantener la consistencia y arquitectura de la capa de UI.

## Tecnologías Principales

- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS 4** para los estilos y diseño de la UI (usando el plugin `@tailwindcss/vite`).
  - Usar las clases utilitarias y variables definidas en el sistema de diseño (ver skill `front-sga-design`). No usar colores hardcodeados.
  - Para diseños de layout (Sidebar/Header) basarse en los patrones establecidos.
- **Zustand 5** para manejo de estado global en el cliente.
- **TanStack Query v4** (React Query) para manejo de estado asíncrono y caché del servidor.
- **React Router v7** para navegación de vistas.
- **tRPC** para comunicación fuertemente tipada con el backend.

## Convenciones de Nombres y Estructura

- Nombra los archivos de componentes en PascalCase: `MiComponente.tsx`.
- Nombra los hooks personalizados en camelCase empezando con `use`: `useUsuarios.ts`.
- Estructura recomendada para un componente:
  ```
  components/
  └── MiComponente/
      ├── MiComponente.tsx
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

export const UsuarioLista: React.FC = () => {
  const { data: usuarios, isLoading, error } = trpc.usuarios.listar.useQuery();

  if (isLoading) return <div className="text-gray-500">Cargando...</div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  return (
    <ul className="space-y-2">
      {usuarios?.map((u) => (
        <li key={u.id} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <span className="font-medium text-gray-900">{u.name}</span> <span className="text-sm text-gray-500">({u.email})</span>
        </li>
      ))}
    </ul>
  );
};
```
