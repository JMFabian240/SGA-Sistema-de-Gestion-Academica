import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpedienteAlumnoPage } from './ExpedienteAlumnoPage';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
  Edit2: () => <span data-testid="edit-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  UserRound: () => <span data-testid="user-icon" />,
  MapPin: () => <span data-testid="pin-icon" />,
  Mail: () => <span data-testid="mail-icon" />,
  Phone: () => <span data-testid="phone-icon" />,
  Briefcase: () => <span data-testid="briefcase-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  FileText: () => <span data-testid="file-icon" />,
  Banknote: () => <span data-testid="banknote-icon" />,
  Link2Off: () => <span data-testid="unlink-icon" />,
  ChevronLeft: () => <span data-testid="chevron-left-icon" />,
  User: () => <span data-testid="user-icon2" />,
  Crown: () => <span data-testid="crown-icon" />,
  BookOpen: () => <span data-testid="book-icon" />,
  Users: () => <span data-testid="users-icon" />,
  Calculator: () => <span data-testid="calculator-icon" />,
  UploadCloud: () => <span data-testid="upload-icon" />,
  Eye: () => <span data-testid="eye-icon" />
}));

vi.mock('../components/EditarAlumnoModal', () => ({
  EditarAlumnoModal: () => <div data-testid="mock-editar-alumno-modal" />
}));

vi.mock('../components/VincularTutorModal', () => ({
  VincularTutorModal: () => <div data-testid="mock-vincular-tutor-modal" />
}));

vi.mock('../components/InscribirAlumnoModal', () => ({
  InscribirAlumnoModal: () => <div data-testid="mock-inscribir-alumno-modal" />
}));

vi.mock('../components/AsignarPlanPagoModal', () => ({
  AsignarPlanPagoModal: () => <div data-testid="mock-asignar-plan-modal" />
}));

const mockGetById = vi.fn();
const mockUnlinkTutor = vi.fn();
const mockUtilsInvalidate = vi.fn();

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      useUtils: () => ({
        alumnos: { getById: { invalidate: mockUtilsInvalidate } }
      }),
      alumnos: {
        getById: {
          useQuery: () => mockGetById()
        },
        update: {
          useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false })
        },
        unlinkTutor: {
          useMutation: () => ({ mutate: mockUnlinkTutor, mutateAsync: mockUnlinkTutor })
        }
      },
      inscripciones: {
        quitarPlanPago: {
          useMutation: () => ({ mutateAsync: vi.fn(), isPending: false })
        }
      },
      pagos: {
        pagar: {
          useMutation: () => ({ mutateAsync: vi.fn(), isPending: false })
        },
        recalcularCalendario: {
          useMutation: () => ({ mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false })
        },
        adjuntarComprobante: {
          useMutation: () => ({ mutateAsync: vi.fn(), isPending: false })
        },
        getEstadoCuenta: {
          useQuery: (_: any, opts: any) => opts?.enabled ? { data: null, isLoading: false } : { data: null, isLoading: false }
        }
      }
    }
  };
});

describe('ExpedienteAlumnoPage Component', () => {
  const mockAlumno = {
    alumnoId: 1,
    nombreCompleto: 'Luna Alejandra Osorio',
    matricula: 'LUNA01',
    estado: 'ACTIVO',
    sexo: 'F',
    fechaNacimiento: '2010-01-01',
    tutoresAlumnos: [
      {
        tutorAlumnoId: 10,
        esPrincipal: true,
        parentesco: 'Padre',
        tutor: {
          tutorId: 2,
          nombreCompleto: 'Luis Fernando Kempez',
          telefono: '5551234567',
          ocupacion: 'Ingeniero'
        }
      }
    ],
    inscripciones: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar el componente de cargando', () => {
    mockGetById.mockReturnValue({ isLoading: true, data: undefined });
    const { container } = render(<BrowserRouter><ExpedienteAlumnoPage /></BrowserRouter>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('debería renderizar la información del alumno y sus responsables', () => {
    mockGetById.mockReturnValue({ isLoading: false, data: mockAlumno });
    render(<BrowserRouter><ExpedienteAlumnoPage /></BrowserRouter>);

    expect(screen.getAllByText('Luna Alejandra Osorio').length).toBeGreaterThan(0);
    expect(screen.getByText('LUNA01')).toBeInTheDocument();
    expect(screen.getByText('Luis Fernando Kempez')).toBeInTheDocument();
  });

  it('debería llamar a unlinkTutor al confirmar desvinculación', async () => {
    mockGetById.mockReturnValue({ isLoading: false, data: mockAlumno });
    mockUnlinkTutor.mockResolvedValue({});
    
    // Simular el window.confirm
    window.confirm = vi.fn().mockImplementation(() => true);

    render(<BrowserRouter><ExpedienteAlumnoPage /></BrowserRouter>);
    
    const btnDesvincular = screen.getByTitle('Desvincular tutor');
    fireEvent.click(btnDesvincular);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUnlinkTutor).toHaveBeenCalledWith({ tutorAlumnoId: 10 });
  });
});
