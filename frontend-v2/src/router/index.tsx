import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AuthLayout } from '../components/layout/AuthLayout/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';

import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { AlumnosPage } from '../modules/alumnos/pages/AlumnosPage';
import { TutoresPage } from '../modules/tutores/pages/TutoresPage';


export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> }
    ]
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'alumnos', element: <AlumnosPage /> },
      { path: 'tutores', element: <TutoresPage /> },
      // Aquí se irán registrando las rutas de cada módulo (modules/pagos/...)
    ],
  },
]);
