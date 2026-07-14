# SGA - Frontend V2 (Sistema de Gestión Académica)

Este paquete contiene la nueva versión del frontend para el Sistema de Gestión Académica (SGA) del Colegio San Diego, reescrito desde cero utilizando una arquitectura moderna, escalable y con un enfoque modular.

## 🛠️ Tecnologías Principales (Tech Stack)

*   **Core:** React 19 + TypeScript + Vite
*   **Estilos y UI:** Tailwind CSS v4, Lucide React (Iconos)
*   **Gráficos:** Recharts
*   **Enrutamiento:** React Router DOM v7
*   **Estado Global:** Zustand
*   **Comunicación Cliente-Servidor:** tRPC (`@trpc/client`, `@trpc/react-query`) + React Query

## 🏗️ Arquitectura del Proyecto

El proyecto está organizado siguiendo un enfoque modular (inspirado en Feature-Sliced Design):

```text
src/
├── assets/         # Imágenes estáticas y logos (e.g., escudo.png, logo.png)
├── components/     # Componentes compartidos globales
│   ├── layout/     # Componentes base del cascarón (Sidebar, Topbar)
│   └── ui/         # Componentes base UI (Botones, Inputs genéricos)
├── hooks/          # Custom hooks compartidos
├── layouts/        # Contenedores estructurales de las páginas
│   ├── AuthLayout  # Layout sin restricciones (usado para el login)
│   └── MainLayout  # Layout protegido con barra lateral de navegación
├── lib/            # Configuración de librerías de terceros (tRPC)
├── modules/        # DOMINIO DE LA APLICACIÓN (Módulos independientes)
│   ├── alumnos/    # Gestión de estudiantes matriculados
│   ├── auth/       # Vistas de autenticación (Login)
│   ├── dashboard/  # Panel de métricas y actividades recientes
│   └── tutores/    # Gestión de padres/tutores de familia
├── router/         # Configuración del árbol de rutas y protección (ProtectedRoute)
├── store/          # Estado global usando Zustand (AuthStore)
├── types/          # Tipados globales compartidos
└── utils/          # Funciones y utilidades de ayuda general
```

## ✨ Funcionalidades Implementadas

1.  **Autenticación y Seguridad (`auth`)**
    *   **Login Moderno:** Interfaz pulida con color `#001429` (azul marino), toogle para visualizar contraseña y estados de carga.
    *   **Protección de Rutas (`ProtectedRoute`):** Redirección forzosa al `/auth/login` si el usuario no tiene una sesión activa (Token validado desde el localStorage).
    *   **Gestión de Sesión:** Manejo de estado del usuario autenticado globalmente usando `useAuthStore` (Zustand).

2.  **Layouts y Navegación Dinámica (`layouts`)**
    *   **Barra Lateral (Sidebar):** Menú lateral persistente que utiliza `NavLink` para marcar la ruta activa. Incluye una sección inferior de perfil dinámico (Nombre completo y Rol) y la acción de "Cerrar sesión".

3.  **Panel de Control (`dashboard`)**
    *   Vista de resúmenes operativos basada en el rol del usuario (`DOCENTE` vs `ADMIN`).
    *   **Métricas en vivo:** Extraídas desde el backend a través de tRPC.
    *   **Gráfica (Mock):** Gráficos financieros integrados con `Recharts`.
    *   **Actividad Reciente:** Historial rápido de acciones recientes en el sistema (Diseño UI).

4.  **Gestión de Alumnos y Tutores (`alumnos`, `tutores`)**
    *   Vistas de listado en formato de tablas estilizadas utilizando Tailwind CSS.
    *   Extracción y visualización asíncrona de datos desde el backend utilizando `trpc.[modulo].getAll.useQuery()`.

## 🚀 Instalación y Ejecución

Al ser parte del entorno general del sistema SGA, el frontend requiere estar conectado al servidor (Backend) que expone la API tRPC.

1.  **Asegúrate de que el backend esté corriendo** en el puerto `3001` (por defecto). En la raíz del monorepo (`sga-monorepo`) ejecuta:
    ```bash
    npm run dev:back-end
    ```

2.  **Instala las dependencias del frontend** (si no lo has hecho):
    ```bash
    cd frontend-v2
    npm install
    ```

3.  **Ejecuta el servidor de desarrollo (Vite):**
    ```bash
    npm run dev
    ```

4.  Ingresa a [http://localhost:5173](http://localhost:5173).

## ⚙️ Notas de Configuración (Troubleshooting)

*   **Error: "A React Element from an older version of React was rendered..."**
    Si esto ocurre, se debe a múltiples copias de la dependencia `react` colisionando entre el backend/monorepo y el frontend. Está solucionado forzando un `dedupe: ['react', 'react-dom']` en la resolución interna de `vite.config.ts`.
*   **Conexión fallida al Backend (Failed to Fetch):**
    El cliente `trpc` (`src/lib/trpc.ts` y `src/App.tsx`) asume que el backend está corriendo en `http://localhost:3001/trpc`. Puedes sobrescribir esta ruta creando un archivo `.env` en la raíz de `frontend-v2` e insertando: `VITE_API_URL=http://tu-url:puerto/trpc`.
