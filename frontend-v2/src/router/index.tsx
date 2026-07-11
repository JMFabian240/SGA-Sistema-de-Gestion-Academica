import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AuthLayout } from '../components/layout/AuthLayout/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';

import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { AlumnosPage } from '../modules/alumnos/pages/AlumnosPage';
import { ExpedienteAlumnoPage } from '../modules/alumnos/pages/ExpedienteAlumnoPage';
import { TutoresPage } from '../modules/tutores/pages/TutoresPage';
import { ExpedienteTutorPage } from '../modules/tutores/pages/ExpedienteTutorPage';
import { ConfiguracionPage } from '../modules/configuracion/pages/ConfiguracionPage';
import { GruposListPage } from '../modules/grupos/pages/GruposListPage';
import { MateriasListPage } from '../modules/grupos/pages/MateriasListPage';
import { UsuariosListPage } from '../modules/usuarios/pages/UsuariosListPage';
import { UsuarioDetailPage } from '../modules/usuarios/pages/UsuarioDetailPage';
import { CajaPage } from '../modules/pagos/pages/CajaPage';
import { ReciboPagoPage } from '../modules/pagos/pages/ReciboPagoPage';

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
      { path: 'alumnos/:id', element: <ExpedienteAlumnoPage /> },
      { path: 'tutores', element: <TutoresPage /> },
      { path: 'tutores/:id', element: <ExpedienteTutorPage /> },
      { path: 'grupos', element: <GruposListPage /> },
      { path: 'materias', element: <MateriasListPage /> },
      { path: 'configuracion', element: <ConfiguracionPage /> },
      { path: 'usuarios', element: <UsuariosListPage /> },
      { path: 'usuarios/:id', element: <UsuarioDetailPage /> },
      { path: 'pagos', element: <CajaPage /> },
      // Aquí se irán registrando las rutas de cada módulo (modules/pagos/...)
    ],
  },
  {
    path: '/pagos/recibo/:pagoId',
    element: (
      <ProtectedRoute>
        <ReciboPagoPage />
      </ProtectedRoute>
    )
  }
]);
