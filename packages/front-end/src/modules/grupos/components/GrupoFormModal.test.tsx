import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GrupoFormModal } from './GrupoFormModal';

// Mock del componente Modal
vi.mock('../../../components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title }: any) => isOpen ? (
    <div data-testid="mock-modal">
      <h1>{title}</h1>
      {children}
    </div>
  ) : null
}));

// Mock de tRPC
const mockInvalidate = vi.fn();
const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
let mockOnError: any = null;

const mockGetCiclos = vi.fn();
const mockGetNiveles = vi.fn();
const mockGetGrados = vi.fn();

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      useUtils: () => ({
        grupos: {
          getGrupos: {
            invalidate: mockInvalidate
          }
        }
      }),
      grupos: {
        getCiclos: { useQuery: () => mockGetCiclos() },
        getNiveles: { useQuery: () => mockGetNiveles() },
        getGrados: { useQuery: () => mockGetGrados() },
        createGrupo: {
          useMutation: (options?: any) => ({
            mutate: (payload: any) => {
              mockCreateMutate(payload);
              if (mockOnError && options?.onError) {
                options.onError({ message: 'Error de servidor' });
              } else if (options?.onSuccess) {
                options.onSuccess();
              }
            },
            isPending: false
          })
        },
        updateGrupo: {
          useMutation: (options?: any) => ({
            mutate: (payload: any) => {
              mockUpdateMutate(payload);
              if (mockOnError && options?.onError) {
                options.onError({ message: 'Error al actualizar' });
              } else if (options?.onSuccess) {
                options.onSuccess();
              }
            },
            isPending: false
          })
        }
      }
    }
  };
});

describe('GrupoFormModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnError = null;
    mockGetCiclos.mockReturnValue({ data: [{ cicloId: 1, nombre: '2026-2027' }] });
    mockGetNiveles.mockReturnValue({ data: [{ nivelId: 1, nombre: 'Primaria' }] });
    mockGetGrados.mockReturnValue({ data: [{ gradoId: 1, nombre: 'Primero', nivelId: 1 }] });
  });

  it('no debería renderizar nada si isOpen es false', () => {
    const { container } = render(
      <GrupoFormModal isOpen={false} onClose={mockOnClose} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('debería renderizar el formulario vacío para Nuevo Grupo', () => {
    const { container } = render(
      <GrupoFormModal isOpen={true} onClose={mockOnClose} />
    );

    expect(screen.getByText('Nuevo Grupo')).toBeInTheDocument();
    const inputs = container.querySelectorAll('input');
    expect(inputs[0]).toHaveValue(''); // nombre
    expect(inputs[1]).toHaveValue(30); // cupo maximo default
  });

  it('debería inicializarse con default values si se pasan como props y ocultar selectores', async () => {
    const { container } = render(
      <GrupoFormModal
        isOpen={true}
        onClose={mockOnClose}
        defaultCicloId={1}
        defaultNivelId={1}
        defaultGradoId={1}
      />
    );

    expect(screen.getByText('Nuevo Grupo')).toBeInTheDocument();

    // Selectores are hidden via class="hidden" on their wrapper container, but they exist
    // We can just submit and see if it takes the default values
    const inputs = container.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: 'A' } }); // nombre
    fireEvent.change(inputs[1], { target: { value: '25' } }); // cupoMaximo

    const submitBtn = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith({
        nombre: 'A',
        cupoMaximo: 25,
        cicloId: 1,
        nivelId: 1,
        gradoId: 1
      });
    });
  });

  it('debería renderizar datos precargados en modo edición', async () => {
    const initialData = {
      nombre: 'B',
      cupoMaximo: 20,
      cicloId: 1,
      nivelId: 1,
      gradoId: 1
    };

    const { container } = render(
      <GrupoFormModal isOpen={true} onClose={mockOnClose} grupoId={10} initialData={initialData} />
    );

    expect(screen.getByText('Editar Grupo')).toBeInTheDocument();
    const inputs = container.querySelectorAll('input');
    expect(inputs[0]).toHaveValue('B');
    expect(inputs[1]).toHaveValue(20);

    const submitBtn = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        grupoId: 10,
        nombre: 'B',
        cupoMaximo: 20,
        cicloId: 1,
        nivelId: 1,
        gradoId: 1
      });
    });
    expect(mockInvalidate).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
