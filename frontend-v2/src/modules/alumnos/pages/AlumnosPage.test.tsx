import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlumnosPage } from './AlumnosPage';
import { BrowserRouter } from 'react-router-dom';

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
  Plus: () => <span data-testid="plus-icon" />,
  Search: () => <span data-testid="search-icon" />,
}));

// Mock de tRPC
const mockGetAllQuery = vi.fn();

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      alumnos: {
        getAll: {
          useQuery: () => mockGetAllQuery()
        }
      }
    }
  };
});

describe('AlumnosPage Component', () => {
  const mockAlumnos = [
    {
      id: 1,
      nombre: 'Carlos',
      apellidoPaterno: 'Lopez',
      apellidoMaterno: 'Martinez',
      curp: 'LOMC000000HDFRRS01',
      estado: 'ACTIVO'
    },
    {
      id: 2,
      nombre: 'Ana',
      apellidoPaterno: 'Gomez',
      apellidoMaterno: 'Sanchez',
      curp: 'GOSA000000MDFRRS02',
      estado: 'INACTIVO'
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

  it('debería renderizar la lista de alumnos cuando se cargan los datos', () => {
    mockGetAllQuery.mockReturnValue({ isLoading: false, data: mockAlumnos });

    render(
      <BrowserRouter>
        <AlumnosPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Carlos Lopez Martinez')).toBeInTheDocument();
    expect(screen.getByText('Ana Gomez Sanchez')).toBeInTheDocument();
    expect(screen.getByText('LOMC000000HDFRRS01')).toBeInTheDocument();
    expect(screen.getByText('GOSA000000MDFRRS02')).toBeInTheDocument();
  });

  it('debería navegar a la página de detalles al hacer click en una fila', () => {
    mockGetAllQuery.mockReturnValue({ isLoading: false, data: [mockAlumnos[0]] });

    render(
      <BrowserRouter>
        <AlumnosPage />
      </BrowserRouter>
    );

    const row = screen.getByText('Carlos Lopez Martinez').closest('tr');
    expect(row).toBeInTheDocument();

    if (row) {
      fireEvent.click(row);
    }

    expect(mockNavigate).toHaveBeenCalledWith('/alumnos/1');
  });
});
