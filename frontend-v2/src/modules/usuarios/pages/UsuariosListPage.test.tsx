import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsuariosListPage } from './UsuariosListPage';
import { BrowserRouter } from 'react-router-dom';

// Mocks de navegación y componentes externos
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
  Edit2: () => <span data-testid="edit-icon" />,
  Shield: () => <span data-testid="shield-icon" />,
  Search: () => <span data-testid="search-icon" />,
}));

vi.mock('../components/RolesModal', () => ({
  RolesModal: ({ isOpen, onClose }: any) => isOpen ? (
    <div data-testid="roles-modal">
      <span>Modal de Roles</span>
      <button onClick={onClose}>Cerrar Roles</button>
    </div>
  ) : null
}));

vi.mock('../components/UsuarioCrearModal', () => ({
  UsuarioCrearModal: ({ isOpen, onClose }: any) => isOpen ? (
    <div data-testid="crear-modal">
      <span>Modal de Crear Usuario</span>
      <button onClick={onClose}>Cerrar Crear</button>
    </div>
  ) : null
}));

// Mock de tRPC
const mockListarUsuariosQuery = vi.fn();
const mockGetRolesQuery = vi.fn();

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      usuarios: {
        listarUsuarios: {
          useQuery: () => mockListarUsuariosQuery()
        },
        getRoles: {
          useQuery: () => mockGetRolesQuery()
        }
      }
    }
  };
});

describe('UsuariosListPage Component', () => {
  const mockUsuarios = [
    {
      usuarioId: 1,
      nombreCompleto: 'Juan Perez',
      nombreUsuario: 'jperez',
      activo: true,
      roles: [{ rolId: 1, rol: { nombre: 'Administrador' } }]
    },
    {
      usuarioId: 2,
      nombreCompleto: 'Maria Gomez',
      nombreUsuario: 'mgomez',
      activo: false,
      roles: [{ rolId: 2, rol: { nombre: 'Docente' } }]
    }
  ];

  const mockRoles = [
    { rolId: 1, nombre: 'Administrador' },
    { rolId: 2, nombre: 'Docente' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRolesQuery.mockReturnValue({ data: mockRoles });
  });

  it('debería renderizar cargando inicialmente', () => {
    mockListarUsuariosQuery.mockReturnValue({ isLoading: true, data: null });

    const { container } = render(
      <BrowserRouter>
        <UsuariosListPage />
      </BrowserRouter>
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('debería renderizar la lista de usuarios correctamente', () => {
    mockListarUsuariosQuery.mockReturnValue({
      isLoading: false,
      data: { data: mockUsuarios, count: 2 }
    });

    render(
      <BrowserRouter>
        <UsuariosListPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    // Maria Gomez no se renderiza por defecto porque su estado es inactivo y el filtro inicial es "activo"
    expect(screen.queryByText('Maria Gomez')).not.toBeInTheDocument();
    expect(screen.getByText('Total de usuarios: 1')).toBeInTheDocument();
  });

  it('debería aplicar el filtro de búsqueda por nombre', () => {
    mockListarUsuariosQuery.mockReturnValue({
      isLoading: false,
      data: { data: mockUsuarios, count: 2 }
    });

    render(
      <BrowserRouter>
        <UsuariosListPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText('Buscar por nombre...');
    fireEvent.change(searchInput, { target: { value: 'Juan' } });

    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.queryByText('Maria Gomez')).not.toBeInTheDocument();
  });

  it('debería filtrar por estado inactivo', () => {
    mockListarUsuariosQuery.mockReturnValue({
      isLoading: false,
      data: { data: mockUsuarios, count: 2 }
    });

    render(
      <BrowserRouter>
        <UsuariosListPage />
      </BrowserRouter>
    );

    // El filtro de estado es el segundo combobox en el componente
    const comboboxes = screen.getAllByRole('combobox');
    const statusSelect = comboboxes[1];
    
    fireEvent.change(statusSelect, { target: { value: 'inactivo' } });

    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
    expect(screen.getByText('Maria Gomez')).toBeInTheDocument();
  });

  it('debería abrir el modal de creación de usuario al dar click en Nuevo Usuario', () => {
    mockListarUsuariosQuery.mockReturnValue({
      isLoading: false,
      data: { data: [], count: 0 }
    });

    render(
      <BrowserRouter>
        <UsuariosListPage />
      </BrowserRouter>
    );

    const newBtn = screen.getByRole('button', { name: /nuevo usuario/i });
    fireEvent.click(newBtn);

    expect(screen.getByTestId('crear-modal')).toBeInTheDocument();
    expect(screen.getByText('Modal de Crear Usuario')).toBeInTheDocument();
  });

  it('debería abrir el modal de roles al dar click en gestionar roles en una fila', () => {
    mockListarUsuariosQuery.mockReturnValue({
      isLoading: false,
      data: { data: [mockUsuarios[0]], count: 1 }
    });

    render(
      <BrowserRouter>
        <UsuariosListPage />
      </BrowserRouter>
    );

    const shieldBtn = screen.getByTestId('shield-icon').closest('button');
    expect(shieldBtn).toBeInTheDocument();
    
    if (shieldBtn) {
      fireEvent.click(shieldBtn);
    }

    expect(screen.getByTestId('roles-modal')).toBeInTheDocument();
    expect(screen.getByText('Modal de Roles')).toBeInTheDocument();
  });
});
