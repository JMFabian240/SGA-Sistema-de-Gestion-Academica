<<<<<<< HEAD
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfiguracionPage } from './ConfiguracionPage';

// Mock de UI Components
vi.mock('../components/CicloFormModal', () => ({
  CicloFormModal: ({ isOpen, onClose, initialData }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="ciclo-modal">
        {initialData ? 'Editar Ciclo' : 'Nuevo Ciclo'}
        <button onClick={onClose} aria-label="Cerrar modal">Cerrar</button>
      </div>
    );
  }
}));

// Mock de alertas y confirmaciones
const mockConfirm = vi.fn();
const mockAlert = vi.fn();
window.confirm = mockConfirm;
window.alert = mockAlert;

// Mocks de tRPC
const mockGetCiclos = vi.fn();
const mockGetNiveles = vi.fn();
const mockGetTarifas = vi.fn();
const mockGetAlumnosCierre = vi.fn();
const mockDeleteCiclo = vi.fn();
const mockUpdateTarifa = vi.fn();
const mockCreateTarifa = vi.fn();
const mockGetGrupos = vi.fn();
const mockCerrarCiclo = vi.fn();
const mockInvalidate = vi.fn();

let loadingCiclos = false;
=======
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfiguracionPage } from './ConfiguracionPage';

// Mock de iconos
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon" />,
  Edit2: () => <span data-testid="edit-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Calendar: () => <span data-testid="calendar-icon" />,
  DollarSign: () => <span data-testid="dollar-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  AlertTriangle: () => <span data-testid="alert-icon" />,
  Check: () => <span data-testid="check-icon" />,
  Info: () => <span data-testid="info-icon" />,
  CheckCircle: () => <span data-testid="check-circle-icon" />,
}));

// Mock del modal hijo
vi.mock('../components/CicloFormModal', () => ({
  CicloFormModal: ({ isOpen, onClose }: any) => isOpen ? (
    <div data-testid="ciclo-modal">
      <button onClick={onClose}>Cerrar Modal</button>
    </div>
  ) : null
}));

// Mock de tRPC
const mockGetCiclos = vi.fn();
const mockGetNiveles = vi.fn();
const mockGetTarifas = vi.fn();
const mockGetGrupos = vi.fn();
const mockGetAlumnosCierreGrupo = vi.fn();
>>>>>>> 8cb2fafe5b5ad39e1ed63c80e52ee04146f25379

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      useContext: () => ({
<<<<<<< HEAD
        grupos: { 
          getCiclos: { invalidate: mockInvalidate },
          getGrupos: { invalidate: mockInvalidate }
        },
        pagos: { getTarifas: { invalidate: mockInvalidate } }
=======
        grupos: { getCiclos: { invalidate: vi.fn() } },
        pagos: { getTarifas: { invalidate: vi.fn() } },
>>>>>>> 8cb2fafe5b5ad39e1ed63c80e52ee04146f25379
      }),
      grupos: {
        getCiclos: { useQuery: () => mockGetCiclos() },
        getNiveles: { useQuery: () => mockGetNiveles() },
<<<<<<< HEAD
        deleteCiclo: { useMutation: () => ({ mutate: mockDeleteCiclo }) },
        getGrupos: { useQuery: () => mockGetGrupos() },
        getAlumnosCierreGrupo: { useQuery: (args: any, options: any) => mockGetAlumnosCierre(args, options) },
        cerrarCicloGrupo: { useMutation: () => ({ mutate: mockCerrarCiclo }) }
      },
      pagos: {
        getTarifas: { useQuery: (options: any, config: any) => mockGetTarifas(options, config) },
        createTarifa: { useMutation: () => ({ mutateAsync: mockCreateTarifa }) },
        updateTarifa: { useMutation: () => ({ mutateAsync: mockUpdateTarifa }) }
=======
        getGrupos: { useQuery: () => mockGetGrupos() },
        getAlumnosCierreGrupo: { useQuery: () => mockGetAlumnosCierreGrupo() },
        deleteCiclo: { useMutation: () => ({ mutate: vi.fn() }) },
        cerrarCicloGrupo: { useMutation: () => ({ mutate: vi.fn() }) },
      },
      pagos: {
        getTarifas: { useQuery: () => mockGetTarifas() },
        createTarifa: { useMutation: () => ({ mutateAsync: vi.fn() }) },
        updateTarifa: { useMutation: () => ({ mutateAsync: vi.fn() }) },
>>>>>>> 8cb2fafe5b5ad39e1ed63c80e52ee04146f25379
      }
    }
  };
});

<<<<<<< HEAD
// Icon mocks
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="icon-plus" />,
  Edit2: () => <div data-testid="icon-edit" />,
  Trash2: () => <div data-testid="icon-trash" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  DollarSign: () => <div data-testid="icon-dollar" />,
  RefreshCw: () => <div data-testid="icon-refresh" />,
  AlertTriangle: () => <div data-testid="icon-alert" />,
  Check: () => <div data-testid="icon-check" />,
  Info: () => <div data-testid="icon-info" />,
  CheckCircle: () => <div data-testid="icon-check-circle" />,
}));

describe('ConfiguracionPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadingCiclos = false;
    
    mockGetCiclos.mockReturnValue({
      data: [
        { cicloId: 1, nombre: 'Ciclo 2024-2025', periodicidad: 'ANUAL', activo: true, fechaInicio: '2024-08-01', fechaFin: '2025-07-01' },
        { cicloId: 2, nombre: 'Ciclo 2024-1', periodicidad: 'SEMESTRAL', activo: false, fechaInicio: '2024-01-01', fechaFin: '2024-06-30' }
      ],
      isLoading: loadingCiclos
    });

    mockGetNiveles.mockReturnValue({
      data: [
        { nivelId: 1, codigo: 'PRI', nombre: 'Primaria' },
        { nivelId: 2, codigo: 'BAC', nombre: 'Bachillerato' }
      ],
      isLoading: false
    });

    mockGetTarifas.mockReturnValue({
      data: [],
      isLoading: false
    });

    mockGetGrupos.mockReturnValue({
      data: [],
      isLoading: false
    });

    mockGetAlumnosCierre.mockReturnValue({
      data: [],
      isLoading: false
    });
  });

  it('debería renderizar la página y las pestañas principales (Renderizado Inicial y Tabs)', () => {
    render(<ConfiguracionPage />);
    
    expect(screen.getByText('Ciclos Escolares')).toBeInTheDocument();
    expect(screen.getByText('Finanzas y Tarifas')).toBeInTheDocument();
    expect(screen.getByText('Operaciones de Ciclo')).toBeInTheDocument();
    
    // Tabla de ciclos
    expect(screen.getByText('Ciclo 2024-2025')).toBeInTheDocument();
    expect(screen.getByText('Ciclo 2024-1')).toBeInTheDocument();
  });

  it('debería mostrar estado de carga y resiliencia de UI', () => {
    mockGetCiclos.mockReturnValue({ data: undefined, isLoading: true });
    
    render(<ConfiguracionPage />);
    
    expect(screen.getByText('Cargando ciclos escolares...')).toBeInTheDocument();
    expect(screen.queryByText('Ciclo 2024-2025')).not.toBeInTheDocument();
  });

  it('debería abrir el modal para Nuevo Ciclo al hacer clic', async () => {
    render(<ConfiguracionPage />);
    
    const btnNuevo = screen.getByRole('button', { name: /Nuevo Ciclo/i });
    fireEvent.click(btnNuevo);
    
    expect(await screen.findByTestId('ciclo-modal')).toHaveTextContent('Nuevo Ciclo');
  });

  it('debería abrir el modal para Editar Ciclo al hacer clic en el botón de edición', async () => {
    render(<ConfiguracionPage />);
    
    const btnEditar = screen.getAllByTitle('Editar Ciclo')[0];
    fireEvent.click(btnEditar);
    
    expect(await screen.findByTestId('ciclo-modal')).toHaveTextContent('Editar Ciclo');
  });

  it('debería confirmar eliminación de un ciclo y llamar a mutación', () => {
    mockConfirm.mockReturnValue(true);
    render(<ConfiguracionPage />);
    
    // El ciclo inactivo tiene botón de eliminar, que es el segundo
    const btnEliminar = screen.getByTitle('Eliminar Ciclo');
    fireEvent.click(btnEliminar);
    
    expect(mockConfirm).toHaveBeenCalledWith('¿Seguro que deseas eliminar este ciclo escolar de forma lógica?');
    expect(mockDeleteCiclo).toHaveBeenCalledWith(2);
  });

  it('debería realizar validaciones límite al intentar guardar tarifas (Manejo de Tarifas)', async () => {
    render(<ConfiguracionPage />);
    
    // Cambiar a la pestaña de tarifas
    fireEvent.click(screen.getByText('Finanzas y Tarifas'));
    
    // Esperar a que se renderice el botón de habilitar edición
    const btnEditar = await screen.findByText('Modificar Montos');
    fireEvent.click(btnEditar);

    // Buscar inputs de tarifas numéricas
    const inputs = await screen.findAllByRole('spinbutton');
    if (inputs.length > 0) {
      // Escribir un valor negativo
      fireEvent.change(inputs[0], { target: { value: '-50' } });
      
      const btnGuardar = screen.getByText('Guardar Montos');
      fireEvent.click(btnGuardar);
      
      expect(mockAlert).toHaveBeenCalledWith('Error de validación: No se permiten montos negativos.');
      expect(mockUpdateTarifa).not.toHaveBeenCalled();
    }
=======
describe('ConfiguracionPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCiclos.mockReturnValue({ isLoading: false, data: [] });
    mockGetNiveles.mockReturnValue({ isLoading: false, data: [] });
    mockGetTarifas.mockReturnValue({ isLoading: false, data: [] });
    mockGetGrupos.mockReturnValue({ isLoading: false, data: [] });
    mockGetAlumnosCierreGrupo.mockReturnValue({ isLoading: false, data: [] });
  });

  it('debería renderizar la pestaña de Ciclos Escolares por defecto', () => {
    render(<ConfiguracionPage />);
    expect(screen.getByText('Configuración General')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo ciclo/i })).toBeInTheDocument();
    expect(screen.getByText('No hay ciclos escolares registrados. Crea uno nuevo.')).toBeInTheDocument();
  });

  it('debería cambiar a la pestaña de Finanzas y Tarifas al hacer click', () => {
    render(<ConfiguracionPage />);

    const finanzasTab = screen.getByRole('button', { name: /finanzas y tarifas/i });
    fireEvent.click(finanzasTab);

    expect(screen.getByText('Tarifas por Nivel Educativo')).toBeInTheDocument();
    expect(screen.getByText('Tarifas de Bachillerato')).toBeInTheDocument();
  });

  it('debería cambiar a la pestaña de Operaciones de Ciclo al hacer click', () => {
    render(<ConfiguracionPage />);

    const operacionesTab = screen.getByRole('button', { name: /operaciones de ciclo/i });
    fireEvent.click(operacionesTab);

    expect(screen.getByText('Cierre de Ciclo por Grupos')).toBeInTheDocument();
  });

  it('debería mostrar el loader mientras cargan los ciclos', () => {
    mockGetCiclos.mockReturnValue({ isLoading: true, data: undefined });
    render(<ConfiguracionPage />);
    expect(screen.getByText('Cargando ciclos escolares...')).toBeInTheDocument();
  });

  it('debería abrir el modal de Nuevo Ciclo al dar click en el botón', () => {
    render(<ConfiguracionPage />);

    const btnNuevo = screen.getByRole('button', { name: /nuevo ciclo/i });
    fireEvent.click(btnNuevo);

    expect(screen.getByTestId('ciclo-modal')).toBeInTheDocument();
>>>>>>> 8cb2fafe5b5ad39e1ed63c80e52ee04146f25379
  });
});
