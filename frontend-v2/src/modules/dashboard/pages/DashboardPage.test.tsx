import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { BrowserRouter } from 'react-router-dom';

// Mock de navegación
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

import React from 'react';

// Mock de recharts (para evitar errores en entorno jsdom)
vi.mock('recharts', () => ({
  BarChart: () => React.createElement('div', { 'data-testid': 'bar-chart' }),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => React.createElement('div', null, children),
  CartesianGrid: () => null,
  Cell: () => null,
}));

vi.mock('lucide-react', () => ({
  Users: () => React.createElement('div'),
  AlertTriangle: () => React.createElement('div'),
  TrendingUp: () => React.createElement('div'),
  Award: () => React.createElement('div'),
  CreditCard: () => React.createElement('div'),
  BarChart3: () => React.createElement('div'),
  Clock: () => React.createElement('div'),
}));

// Mock store
let mockUser = { role: 'ADMINISTRADOR' };
vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: mockUser
  })
}));

// Mock tRPC
const mockObtenerMetricas = vi.fn();
const mockObtenerKpis = vi.fn();
const mockObtenerIngresos = vi.fn();
const mockObtenerPagos = vi.fn();

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      dashboard: {
        obtenerMetricasInscripcion: { useQuery: () => mockObtenerMetricas() },
        obtenerKpisFinancieros: { useQuery: () => mockObtenerKpis() },
        obtenerIngresosUltimos7Dias: { useQuery: () => mockObtenerIngresos() },
        obtenerUltimosPagos: { useQuery: () => mockObtenerPagos() }
      }
    }
  };
});

describe('DashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { role: 'ADMINISTRADOR' };
    
    mockObtenerMetricas.mockReturnValue({ data: { alumnosActivos: 150 }, isLoading: false });
    mockObtenerKpis.mockReturnValue({ data: { ingresosMesActual: 15000.50, deudaPendienteTotal: 2500.00 }, isLoading: false });
    mockObtenerIngresos.mockReturnValue({ data: [], isLoading: false });
    mockObtenerPagos.mockReturnValue({ 
      data: [
        { name: 'Juan Perez', type: 'INSCRIPCION', amount: '$500' }
      ], 
      isLoading: false 
    });
  });

  it('debería renderizar la vista de Administrador con todas las tarjetas', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Header
    expect(screen.getByText('Panel Administrativo')).toBeInTheDocument();
    
    // Tarjetas
    expect(screen.getByText('Total Alumnos')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    
    expect(screen.getByText('Ingresos de Hoy')).toBeInTheDocument();
    expect(screen.getByText('$15,000.50')).toBeInTheDocument();

    expect(screen.getByText('Deudores Críticos')).toBeInTheDocument();
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();

    // Tabla de Pagos
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('INSCRIPCION')).toBeInTheDocument();

    // Grafica mockeada
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('debería renderizar la vista de Docente limitando la información financiera', () => {
    mockUser = { role: 'DOCENTE' };

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Total Alumnos')).toBeInTheDocument();
    
    // No debe mostrar información financiera
    expect(screen.queryByText('Ingresos de Hoy')).not.toBeInTheDocument();
    expect(screen.queryByText('Deudores Críticos')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('debería mostrar estado de carga mientras obtiene datos', () => {
    mockUser = { role: 'ADMINISTRADOR' };
    mockObtenerMetricas.mockReturnValue({ data: undefined, isLoading: true });
    
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Muestra "..." cuando está cargando
    const loadingTexts = screen.getAllByText('...');
    expect(loadingTexts.length).toBeGreaterThan(0);
  });
});
