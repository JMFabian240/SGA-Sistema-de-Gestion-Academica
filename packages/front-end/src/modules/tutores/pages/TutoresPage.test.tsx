import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TutoresPage } from './TutoresPage';
import { BrowserRouter } from 'react-router-dom';

// Mocks de navegación y iconos
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
      tutores: {
        getAll: {
          useQuery: () => mockGetAllQuery()
        }
      }
    }
  };
});

describe('TutoresPage Component', () => {
  const mockTutores = [
    {
      id: 1,
      nombre: 'Roberto',
      apellidoPaterno: 'Diaz',
      apellidoMaterno: 'Gomez',
      telefono: '5551234567',
      email: 'roberto@example.com'
    },
    {
      id: 2,
      nombre: 'Maria',
      apellidoPaterno: 'Herrera',
      apellidoMaterno: 'Castillo',
      telefono: '5559876543',
      email: 'maria@example.com'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar el estado de cargando', () => {
    mockGetAllQuery.mockReturnValue({ isLoading: true, data: undefined });

    render(
      <BrowserRouter>
        <TutoresPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Cargando tutores...')).toBeInTheDocument();
  });

  it('debería renderizar la lista de tutores cuando se cargan los datos', () => {
    mockGetAllQuery.mockReturnValue({ isLoading: false, data: mockTutores });

    render(
      <BrowserRouter>
        <TutoresPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Roberto Diaz Gomez')).toBeInTheDocument();
    expect(screen.getByText('Maria Herrera Castillo')).toBeInTheDocument();
    expect(screen.getByText('5551234567')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
  });

  it('debería navegar a la página de detalles al hacer click en una fila', () => {
    mockGetAllQuery.mockReturnValue({ isLoading: false, data: [mockTutores[0]] });

    render(
      <BrowserRouter>
        <TutoresPage />
      </BrowserRouter>
    );

    const row = screen.getByText('Roberto Diaz Gomez').closest('tr');
    expect(row).toBeInTheDocument();

    if (row) {
      fireEvent.click(row);
    }

    expect(mockNavigate).toHaveBeenCalledWith('/tutores/1');
  });
});
