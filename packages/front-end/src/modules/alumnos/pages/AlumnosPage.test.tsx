import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlumnosPage } from './AlumnosPage';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock de navegación y iconos
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('lucide-react', () => ({
  Plus: () => React.createElement('span', { 'data-testid': 'plus-icon' }),
  Search: () => React.createElement('span', { 'data-testid': 'search-icon' }),
  Upload: () => React.createElement('span', { 'data-testid': 'upload-icon' }),
  Download: () => React.createElement('span', { 'data-testid': 'download-icon' }),
  X: () => React.createElement('span', { 'data-testid': 'x-icon' }),
  Calendar: () => React.createElement('span', { 'data-testid': 'calendar-icon' }),
}));

vi.mock('../components/NuevoAlumnoModal', () => ({
  NuevoAlumnoModal: () => React.createElement('div', { 'data-testid': 'mock-nuevo-alumno-modal' })
}));

// Mock de tRPC
const mockGetAllQuery = vi.fn();

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      alumnos: {
        getAll: {
          useQuery: () => mockGetAllQuery()
        },
        create: {
          useMutation: () => ({ mutateAsync: vi.fn() })
        }
      },
      grupos: {
        getNiveles: {
          useQuery: () => ({ data: [{ nivelId: 1, nombre: 'PREESCOLAR' }] })
        }
      }
    }
  };
});

describe('AlumnosPage Component', () => {
  const mockAlumnos = [
    {
      alumnoId: 1,
      nombre: 'Carlos',
      apellidoPaterno: 'Lopez',
      apellidoMaterno: 'Martinez',
      matricula: 'LOMC000000HDFRRS01',
      estado: 'ACTIVO',
      nivel: { nombre: 'PRIMARIA' },
      inscripciones: [{
        grupo: { nombre: '1°A', grado: { nombre: '1°' } }
      }],
      tutoresAlumnos: [{
        esPrincipal: true,
        tutor: { nombreCompleto: 'Juan Lopez', telefono: '5551234567' }
      }]
    },
    {
      alumnoId: 2,
      nombre: 'Ana',
      apellidoPaterno: 'Gomez',
      apellidoMaterno: 'Sanchez',
      matricula: 'GOSA000000MDFRRS02',
      estado: 'ACTIVO',
      nivel: { nombre: 'PREESCOLAR' },
      inscripciones: [],
      tutoresAlumnos: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar el estado de cargando', () => {
    mockGetAllQuery.mockReturnValue({ isLoading: true, data: undefined });

    render(
      <BrowserRouter>
        <AlumnosPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Cargando alumnos...')).toBeInTheDocument();
  });

  it('debería renderizar la lista de alumnos y agrupar visualmente', () => {
    mockGetAllQuery.mockReturnValue({ isLoading: false, data: mockAlumnos });

    render(
      <BrowserRouter>
        <AlumnosPage />
      </BrowserRouter>
    );

    // Búsqueda de información esperada
    expect(screen.getByText('Carlos Lopez Martinez')).toBeInTheDocument();
    expect(screen.getByText('Matrícula: LOMC000000HDFRRS01')).toBeInTheDocument();
    expect(screen.getByText('1°A PRIMARIA')).toBeInTheDocument();
    expect(screen.getByText('Juan Lopez')).toBeInTheDocument();
    expect(screen.getByText('Tel: 5551234567')).toBeInTheDocument();

    expect(screen.getByText('Ana Gomez Sanchez')).toBeInTheDocument();
  });

  it('debería navegar a la página de detalles al hacer click en Ver expediente', () => {
    mockGetAllQuery.mockReturnValue({ isLoading: false, data: [mockAlumnos[0]] });

    render(
      <BrowserRouter>
        <AlumnosPage />
      </BrowserRouter>
    );

    const btn = screen.getByText('Ver expediente');
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/alumnos/1');
  });
});
