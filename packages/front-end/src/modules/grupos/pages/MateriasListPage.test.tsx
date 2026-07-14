import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MateriasListPage } from './MateriasListPage';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('lucide-react', () => ({
  Plus: () => React.createElement('div', { 'data-testid': 'icon-plus' }),
  Search: () => React.createElement('div', { 'data-testid': 'icon-search' }),
  Edit2: () => React.createElement('div', { 'data-testid': 'icon-edit2' }),
  Trash2: () => React.createElement('div', { 'data-testid': 'icon-trash2' }),
  BookOpen: () => React.createElement('div', { 'data-testid': 'icon-book' }),
}));

vi.mock('../components/MateriaFormModal', () => ({
  MateriaFormModal: ({ isOpen }: any) => {
    if (!isOpen) return null;
    return React.createElement('div', { 'data-testid': 'materia-modal' }, 'Modal de Materia');
  }
}));

const mockConfirm = vi.fn();
window.confirm = mockConfirm;

// Mocks de tRPC
const mockGetMaterias = vi.fn();
const mockGetNiveles = vi.fn();
const mockGetGrados = vi.fn();
const mockGetGrupos = vi.fn();
const mockGetCiclos = vi.fn();
const mockDeleteMateria = vi.fn();

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      useUtils: () => ({
        grupos: { 
          getMaterias: { invalidate: vi.fn() }
        }
      }),
      grupos: {
        getMaterias: { useQuery: () => mockGetMaterias() },
        getNiveles: { useQuery: () => mockGetNiveles() },
        getGrados: { useQuery: () => mockGetGrados() },
        getGrupos: { useQuery: () => mockGetGrupos() },
        getCiclos: { useQuery: () => mockGetCiclos() },
        deleteMateria: { useMutation: () => ({ mutate: mockDeleteMateria }) },
      }
    }
  };
});

describe('MateriasListPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockGetCiclos.mockReturnValue({
      data: [{ cicloId: 1, nombre: '2024-2025', activo: true, periodicidad: 'ANUAL' }]
    });

    mockGetNiveles.mockReturnValue({
      data: [{ nivelId: 1, nombre: 'Primaria', codigo: 'PRI' }]
    });

    mockGetGrados.mockReturnValue({
      data: [{ gradoId: 1, nivelId: 1, nombre: 'Primer Grado', numero: 1 }]
    });

    mockGetGrupos.mockReturnValue({
      data: [{ grupoId: 1, gradoId: 1, cicloId: 1, nombre: '1A', cupoMaximo: 30, estado: 'ACTIVO' }]
    });

    mockGetMaterias.mockReturnValue({
      data: [
        { 
          materiaId: 1, 
          nombre: 'Matemáticas', 
          clave: 'MAT101',
          gradoId: 1,
          tipo: 'curricular',
          grado: { nivel: { codigo: 'PRI' } } 
        }
      ],
      isLoading: false
    });
  });

  it('debería renderizar la lista de materias', () => {
    render(
      <BrowserRouter>
        <MateriasListPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Matemáticas')).toBeInTheDocument();
    expect(screen.getByText('curricular')).toBeInTheDocument();
  });

  it('debería filtrar materias por búsqueda de texto', () => {
    render(
      <BrowserRouter>
        <MateriasListPage />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Buscar por clave, nombre o docente...');
    fireEvent.change(input, { target: { value: 'Ciencias' } });

    // "Matemáticas" ya no debe estar si filtramos por "Ciencias"
    expect(screen.queryByText('Matemáticas')).not.toBeInTheDocument();
  });
});
