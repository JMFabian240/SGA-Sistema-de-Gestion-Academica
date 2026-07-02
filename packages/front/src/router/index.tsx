import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';
import { LoginPage } from '../modules/auth/pages/LoginPage/LoginPage';
import { MainLayout } from '../layouts/MainLayout/MainLayout';
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage/DashboardPage';
import { UsuariosListPage } from '../modules/usuarios/pages/UsuariosListPage/UsuariosListPage';
import { UsuarioFormPage } from '../modules/usuarios/pages/UsuarioFormPage/UsuarioFormPage';
import { GruposLayout } from '../modules/grupos/layouts/GruposLayout/GruposLayout';
import { GruposListPage } from '../modules/grupos/pages/GruposListPage/GruposListPage';
import { CiclosListPage } from '../modules/grupos/pages/CiclosListPage/CiclosListPage';
import { NivelesListPage } from '../modules/grupos/pages/NivelesListPage/NivelesListPage';
import { MateriasListPage } from '../modules/grupos/pages/MateriasListPage/MateriasListPage';
import { InscripcionesLayout } from '../modules/inscripciones/layouts/InscripcionesLayout/InscripcionesLayout';
import { InscripcionesListPage } from '../modules/inscripciones/pages/InscripcionesListPage/InscripcionesListPage';
import { PlanesPagoListPage } from '../modules/inscripciones/pages/PlanesPagoListPage/PlanesPagoListPage';
import { VentanasListPage } from '../modules/inscripciones/pages/VentanasListPage/VentanasListPage';
import { PagosLayout } from '../modules/pagos/layouts/PagosLayout/PagosLayout';
import { RegistroPagoPage } from '../modules/pagos/pages/RegistroPagoPage/RegistroPagoPage';
import { AdeudosListPage } from '../modules/pagos/pages/AdeudosListPage/AdeudosListPage';
import { TarifasListPage } from '../modules/pagos/pages/TarifasListPage/TarifasListPage';
import { BecasLayout } from '../modules/becas/layouts/BecasLayout/BecasLayout';
import { BecasListPage } from '../modules/becas/pages/BecasListPage/BecasListPage';
import { SolicitudesListPage } from '../modules/becas/pages/SolicitudesListPage/SolicitudesListPage';
import { AsignadasListPage } from '../modules/becas/pages/AsignadasListPage/AsignadasListPage';
import { useAuth } from '../hooks/useAuth';

// HOC para proteger rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth(state => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// HOC para redirigir si ya está logueado
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth(state => state.token);
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        index: true,
        element: <LoginPage />
      }
    ]
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'usuarios',
        children: [
          { index: true, element: <UsuariosListPage /> },
          { path: 'nuevo', element: <UsuarioFormPage /> },
          { path: ':id/editar', element: <UsuarioFormPage /> },
          { path: ':id', element: <UsuarioFormPage /> }
        ]
      },
      {
        path: 'grupos',
        element: <GruposLayout />,
        children: [
          { index: true, element: <GruposListPage /> },
          { path: 'ciclos', element: <CiclosListPage /> },
          { path: 'niveles', element: <NivelesListPage /> },
          { path: 'materias', element: <MateriasListPage /> }
        ]
      },
      {
        path: 'inscripciones',
        element: <InscripcionesLayout />,
        children: [
          { index: true, element: <InscripcionesListPage /> },
          { path: 'planes-pago', element: <PlanesPagoListPage /> },
          { path: 'ventanas', element: <VentanasListPage /> }
        ]
      },
      {
        path: 'pagos',
        element: <PagosLayout />,
        children: [
          { index: true, element: <RegistroPagoPage /> },
          { path: 'adeudos', element: <AdeudosListPage /> },
          { path: 'tarifas', element: <TarifasListPage /> }
        ]
      },
      {
        path: 'becas',
        element: <BecasLayout />,
        children: [
          { index: true, element: <BecasListPage /> },
          { path: 'solicitudes', element: <SolicitudesListPage /> },
          { path: 'asignadas', element: <AsignadasListPage /> }
        ]
      }
    ]
  }
]);
