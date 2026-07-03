import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';

const Dashboard = () => <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>;
const Login = () => <h1 className="text-2xl font-bold text-gray-800">Login</h1>;


export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> }
    ]
  },
  {
    path: '/',
    element: (
      // <ProtectedRoute>
      <MainLayout />
      // </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      // Aquí se irán registrando las rutas de cada módulo (modules/pagos/...)
    ],
  },
]);
