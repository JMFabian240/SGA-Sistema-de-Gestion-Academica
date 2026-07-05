---
name: front-sga-design
description: >
  Sistema de diseño visual oficial del SGA (Colegio San Diego). Usa esta
  skill SIEMPRE que vayas a crear, modificar o revisar cualquier elemento
  de la interfaz en el frontend: páginas, componentes, tablas, botones,
  formularios, modales, colores, fuentes, espaciado o cualquier decisión
  visual. Esta skill garantiza que todos los cambios de UI mantengan la
  identidad visual institucional del Colegio San Diego de forma consistente
  y reconocible a través de toda la aplicación.
---

# SGA Design System — Identidad Visual Oficial

Esta skill define los tokens, patrones y reglas de diseño que se deben
respetar en **todo** elemento de la interfaz del Sistema de Gestión
Académica del Colegio San Diego. Ningún componente nuevo puede desviarse
de estos lineamientos sin aprobación explícita.

---

## 1. Paleta de Colores

La identidad del Colegio San Diego se basa en dos colores institucionales:
**Navy** (azul oscuro) y **Crimson** (rojo). Todos los colores usados en la
aplicación deben provenir de esta paleta o de los grises neutros definidos.

### Navy — Color Principal de Navegación y Estructura
| Token Tailwind | Valor Hex | Uso |
|---|---|---|
| `navy-800` | `#001429` | Fondo del sidebar, área más oscura |
| `navy-700` | `#001f3d` | Gradiente del sidebar |
| `navy-600` | `#002952` | Variantes hover del sidebar |
| `navy-500` | `#003366` | Color base de la marca |
| `navy-100` | `#d9e2ef` | Fondos sutiles de badges y chips |
| `navy-50` | `#eef2f8` | Fondos alternativos muy claros |

**En clases Tailwind:** `bg-navy-800`, `text-navy-700`, `border-navy-500`, etc.
**En hardcode (cuando no hay token):** `bg-[#001429]`, `bg-[#000f20]`

### Crimson — Color de Acento y Acción
| Token Tailwind | Valor Hex | Uso |
|---|---|---|
| `crimson-500` | `#CC0000` | Avatar del usuario, badge activo en sidebar |
| `crimson-600` | `#a30000` | Botón primario de acción (ej. "Pago Rápido") |
| `crimson-700` | `#7a0000` | Hover del botón primario |
| `crimson-400` | `#ff4d4d` | Icono activo en la navegación del sidebar |

**En clases Tailwind:** `bg-crimson-600`, `hover:bg-crimson-700`, `text-crimson-400`
**En código Tailwind literal (indicador activo sidebar):** `shadow-[inset_3px_0_0_#CC0000]`

### Grises Neutros — Para contenido y superficies
| Uso | Clase Tailwind |
|---|---|
| Fondo de la app | `bg-[#F8FAFE]` o `bg-slate-50` |
| Superficie de tarjetas/tablas | `bg-white` |
| Fondo de encabezados de tabla | `bg-gray-50` |
| Bordes | `border-gray-100` o `border-gray-200` |
| Texto principal | `text-gray-900` |
| Texto secundario / metadatos | `text-gray-500` o `text-gray-600` |
| Texto muy tenue | `text-gray-400` |

---

## 2. Tipografía

- **Fuente única:** `Inter` (importada de Google Fonts).
  - Declaración global: `font-family: 'Inter', system-ui, sans-serif;`
  - Ya está configurada como `--font-sans` en el tema de Tailwind.
- **Nunca usar** otras fuentes (ej. serif, monospace) en elementos de UI general.

### Escala tipográfica de referencia
| Elemento | Clases Tailwind |
|---|---|
| Título de página (H2) | `text-2xl font-bold text-navy-800` |
| Subtítulo / descripción | `text-sm text-gray-500` |
| Encabezado de tarjeta (H3) | `text-sm font-medium text-gray-500 mb-0.5` |
| Número KPI (valor grande) | `text-2xl font-bold text-gray-900` |
| Cuerpo de tabla | `text-sm text-left` |
| Encabezado de columna en tabla | `text-sm font-semibold text-gray-600` |
| Metadato / etiqueta pequeña | `text-xs text-gray-500` |
| Categorías del sidebar | `text-[0.7rem] font-semibold tracking-wider text-white/40 uppercase` |

---

## 3. Layout y Estructura General

La aplicación usa un layout de **dos columnas fijas**: Sidebar izquierdo + área de contenido principal.

```
┌──────────────────────────────────────────────────────┐
│  SIDEBAR (w-64 / 256px)  │   CONTENIDO PRINCIPAL     │
│  bg-[#001429]            │   bg-[#F8FAFE]            │
│  (fijo, h-screen)        │   (scrolleable)           │
│                          │   max-w-8xl mx-auto p-8   │
└──────────────────────────────────────────────────────┘
```

- El sidebar tiene ancho fijo de `w-64`.
- El área de contenido usa `flex-1 overflow-y-auto` y padding interno de `p-8`.
- No existe un header superior; la pantalla empieza directamente con el contenido de la página.

---

## 4. Sidebar — Anatomía del Menú Lateral

```
┌─────────────────────────┐
│  [Logo] SGA             │  ← Sección de marca (border-b)
│  Colegio San Diego      │
├─────────────────────────┤
│  PRINCIPAL              │  ← Categoría (texto tenue, uppercase)
│  > Panel Administrativo │  ← Ítem activo (inset shadow crimson)
│  Alumnos                │
├─────────────────────────┤
│  ACADÉMICO              │
│  Directorio Escolar     │
│  Padres & Tutores       │
│  ...                    │
├─────────────────────────┤
│  [Avatar] Usuario       │  ← Footer del usuario (border-t)
│  Rol                    │
│              [Logout]   │
└─────────────────────────┘
```

**Patrones del sidebar:**
- Fondo: `bg-gradient-to-b from-navy-500 to-navy-700` (en la versión completa) o `bg-[#001429]` sólido.
- Ítem **activo**: `bg-white/10 text-white shadow-[inset_3px_0_0_#CC0000]`
- Ítem **hover**: `hover:bg-white/5 hover:text-white`
- Ítem **normal**: `text-white/75`
- El avatar del usuario usa `bg-crimson-500` con la inicial del nombre.

---

## 5. Componentes de UI

### Botones

El sistema de botones tiene 5 variantes definidas. Toda acción de la UI debe
usar estas variantes sin inventar estilos nuevos.

| Variante | Clases (referencia) | Cuándo usar |
|---|---|---|
| `primary` | `bg-blue-600 text-white hover:bg-blue-700` | Acciones neutras (guardar, confirmar) |
| `danger` | `bg-red-600 text-white hover:bg-red-700` | Eliminar, cancelar irreversible |
| `outline` | `border border-gray-300 text-gray-700 hover:bg-gray-50` | Acciones secundarias |
| `ghost` | `text-gray-700 hover:bg-gray-100` | Acciones terciarias |
| **Acción CTA** | `bg-crimson-600 text-white hover:bg-crimson-700` | Acción principal de la página (ej. "Pago Rápido", "Nuevo Alumno") |

**Tamaños:** `sm` (px-3 py-1.5 text-sm) · `md` (px-4 py-2 text-sm) · `lg` (px-6 py-3 text-base)

**Radios:** Siempre `rounded-xl` para botones de acción prominentes. `rounded-lg` para botones secundarios en tablas.

**Íconos:** Siempre de `lucide-react`, tamaño `18px` o `20px` para botones estándar, `14px` para botones compactos en tablas.

### Inputs y Campos de Formulario

```tsx
// Estilo estándar de input
className="px-4 py-2 rounded-xl border border-gray-200
           focus:ring-2 focus:ring-navy-500 outline-none"

// Input con error
className="border-red-300 text-red-900 focus:ring-red-500"

// Label
className="block text-sm font-medium text-gray-700 mb-1"

// Mensaje de error debajo del input
className="mt-1 text-sm text-red-600"
```

### Tablas de Datos

El patrón estándar de tabla usa una tarjeta blanca como contenedor.

```tsx
// Contenedor de la tabla
<div className="bg-white rounded-2xl shadow-sm border border-gray-100
                overflow-hidden flex flex-col">
  <div className="overflow-x-auto flex-1">
    <table className="w-full text-sm text-left">

      // Encabezado
      <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
        <tr>
          <th className="px-6 py-4 font-semibold">Columna</th>
        </tr>
      </thead>

      // Filas
      <tbody>
        <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
          <td className="px-6 py-4">
            <div className="font-medium text-gray-900">Dato principal</div>
            <div className="text-xs text-gray-500">Metadato</div>
          </td>
        </tr>
      </tbody>

    </table>
  </div>

  // Paginación (cuando aplique)
  <div className="flex items-center justify-between py-3 px-6
                  border-t border-gray-100 bg-gray-50/50">
    <span className="text-sm text-gray-500">Página X de Y · Z resultados</span>
    // Botones de paginación
  </div>
</div>
```

**Regla de acción en tabla:** Los botones de acción dentro de filas son compactos:
```tsx
className="px-3 py-1.5 text-xs font-medium text-navy-600
           bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors"
```

### Tarjetas de KPI / Dashboard

```tsx
<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100
                flex items-center gap-4">
  // Icono
  <div className="w-12 h-12 bg-blue-50 text-blue-600
                  rounded-full flex items-center justify-center">
    <Icon size={24} />
  </div>
  // Contenido
  <div>
    <h3 className="text-gray-500 text-sm font-medium mb-0.5">Etiqueta KPI</h3>
    <p className="text-2xl font-bold text-gray-900">Valor</p>
  </div>
</div>
```

### Modales

Los modales usan un overlay oscuro y un panel centrado con bordes redondeados `rounded-2xl`.
El botón de cierre (X) siempre está en la esquina superior derecha del panel.
El fondo del modal es `bg-white`, el overlay es `bg-black/50`.

### Selects y Filtros

```tsx
className="px-4 py-2 rounded-xl border border-gray-200
           focus:ring-2 focus:ring-navy-500 outline-none"
```

### Badges / Chips de Estado

```tsx
// Badge genérico (ej. contador de resultados)
<span className="bg-navy-50 text-navy-700 px-3 py-1 rounded-full text-sm font-medium">
  Resultados: {n}
</span>

// Badge de estado "Activo"
<span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
  Activo
</span>
```

---

## 6. Espaciado y Radios

- **Radio de esquinas:** `rounded-2xl` (16px) para tarjetas, tablas y contenedores.
  `rounded-xl` (12px) para botones e inputs prominentes. `rounded-lg` (8px) para elementos compactos.
- **Sombras:** Solo `shadow-sm` (sutil). No usar sombras fuertes (`shadow-lg`, `shadow-xl`) salvo en el sidebar.
- **Separación entre secciones:** `space-y-6` dentro de las páginas.
- **Padding de página:** El contenido principal tiene `p-8` externo.
- **Padding interno de tarjetas:** `p-6`.
- **Padding de celdas de tabla:** `px-6 py-4`.

---

## 7. Micro-interacciones y Animaciones

- **Regla base:** Todo elemento interactivo DEBE tener estado hover explícito y `transition-colors` o `transition-all duration-300`.
- **Entrada de páginas:** `animate-in fade-in duration-500` en el contenedor principal de la página.
- **Spinner de carga:** SVG animado con `animate-spin` en los botones con `isLoading`.
- **Sin animaciones complejas:** Evitar animaciones de JS (framer-motion, etc.) a menos que el usuario lo pida explícitamente.

---

## 8. Flujo de Trabajo para Nuevos Componentes

1. **Verificar primero** si el componente existe en `frontend-v2/src/components/ui/` o si el patrón está en una página existente.
2. **Derivar** colores y espaciados exclusivamente de las tablas de esta skill.
3. **Generar un wireframe textual** (en Markdown) del componente antes de escribir JSX, si es una pantalla nueva.
4. **Pedir aprobación** del wireframe al usuario antes de codificar, si hay incertidumbre en el diseño.
5. **Nunca usar** colores hardcodeados que no estén en la paleta institucional.
6. **Nunca usar** librerías de componentes externas (MUI, Chakra, Ant Design). El sistema es custom con Tailwind.
