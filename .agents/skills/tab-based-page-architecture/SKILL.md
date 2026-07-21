---
name: tab-based-page-architecture
description: Implementa y refactoriza la arquitectura de pestañas (Container-Component Pattern) en páginas que crecen demasiado.
---

# Arquitectura de Páginas con Pestañas (Container-Component)

Esta skill define el estándar para manejar páginas complejas que utilizan pestañas (tabs) en este proyecto (por ejemplo `ConfiguracionPage.tsx`, `PagosPage.tsx`).

## Problema
Cuando una página tiene muchas pestañas, a menudo los desarrolladores tienden a colocar todo el estado (hooks, variables) y la interfaz de usuario de todas las pestañas dentro de un único archivo `*Page.tsx`. Esto provoca:
- Archivos masivos (+1000 líneas) difíciles de leer y mantener.
- Re-renders innecesarios en toda la página cuando el estado de una sola pestaña cambia.
- Mayor probabilidad de conflictos de Git al trabajar en equipo.

## Solución (Arquitectura)
El patrón exige separar responsabilidades:

1. **La Página Contenedora (`*Page.tsx`)**:
   - Actúa únicamente como enrutador y contenedor.
   - Su única responsabilidad es mantener el estado de la pestaña activa (`activeTab`).
   - Renderiza el menú de navegación de las pestañas.
   - Renderiza condicionalmente los componentes de las pestañas (`<MiPestanaPanel />`).
   - **NO** debe contener lógica de negocio, mutaciones tRPC o estados que correspondan a una pestaña específica.

2. **Los Componentes de Pestaña (`*Panel.tsx`)**:
   - Cada pestaña debe ser un componente independiente ubicado en el directorio `components/` correspondiente.
   - Estos componentes manejan su propia interfaz de usuario.
   - Aislan sus propios hooks, variables de estado local (`useState`) y llamadas al servidor (`useQuery`, `useMutation`).

## Pasos para Implementar / Refactorizar

Si encuentras una página monolítica con pestañas o vas a crear una nueva:

1. Identifica los bloques lógicos de cada pestaña dentro del archivo original.
2. Crea un nuevo componente `MiNuevaPestañaPanel.tsx`.
3. Mueve las importaciones, consultas tRPC y estados locales exclusivos de esa pestaña al nuevo archivo.
4. Mueve el JSX correspondiente a la pestaña al `return` del nuevo componente.
5. En el archivo `*Page.tsx` original, elimina el código extraído, importa tu nuevo componente y móntalo en su renderizado condicional.
6. Asegúrate de pasar mediante `props` únicamente aquellos estados compartidos globales que sean estrictamente necesarios (ej. un manejador de modales compartidos o un ID de entidad padre).

## Ejemplo de Estructura de Contenedor

```tsx
// src/modules/modulo-ejemplo/pages/EjemploPage.tsx
import { useState } from 'react';
import { GeneralPanel } from '../components/GeneralPanel';
import { ConfiguracionPanel } from '../components/ConfiguracionPanel';

type TabType = 'general' | 'configuracion';

export function EjemploPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  return (
    <div>
      {/* Menú de Pestañas */}
      <nav>
        <button onClick={() => setActiveTab('general')}>General</button>
        <button onClick={() => setActiveTab('configuracion')}>Configuración</button>
      </nav>

      {/* Contenedor de Pestañas */}
      <div className="mt-4">
        {activeTab === 'general' && <GeneralPanel />}
        {activeTab === 'configuracion' && <ConfiguracionPanel />}
      </div>
    </div>
  );
}
```
