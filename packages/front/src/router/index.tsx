import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';
import { LoginPage } from '../modules/auth/pages/LoginPage/LoginPage';
import { MainLayout } from '../layouts/MainLayout/MainLayout';
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage/DashboardPage';
import { UsuariosListPage } from '../modules/usuarios/pages/UsuariosListPage/UsuariosListPage';
import { UsuarioFormPage } from '../modules/usuarios/pages/UsuarioFormPage/UsuarioFormPage';
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
          { path: ':id', element: <UsuarioFormPage /> } // Reusaremos el form en modo solo-lectura si es necesario
        ]
      }
    ]
  }
]);
