import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NuevoAlumnoModal } from './NuevoAlumnoModal';
import React from 'react';

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  AlertTriangle: () => <span data-testid="icon-alert" />
}));

let mockNiveles: any[] | undefined = [{ nivelId: 1, nombre: 'Primaria' }];
let mockGrados: any[] | undefined = [{ gradoId: 1, nivelId: 1, nombre: '1ro' }];
let mockGrupos: any[] | undefined = [{ grupoId: 1, gradoId: 1, nivelId: 1, nombre: '1ro A', seccion: 'A' }];
let mockCiclos: any[] | undefined = [{ cicloId: 1, nombre: '2023-2024', activo: true }];
let mockPlanesPago: any[] | undefined = [{ planPagoId: 1, nombre: 'Plan 10 Meses' }];

const mockMutateAsync = vi.fn();

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    grupos: {
      getNiveles: { useQuery: () => ({ data: mockNiveles }) },
      getGrados: { useQuery: () => ({ data: mockGrados }) },
      getGrupos: { useQuery: () => ({ data: mockGrupos, isLoading: false }) },
      getCiclos: { useQuery: () => ({ data: mockCiclos, isLoading: false }) },
    },
    inscripciones: {
      getPlanesPago: { useQuery: () => ({ data: mockPlanesPago, isLoading: false }) }
    },
    alumnos: {
      create: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync
        })
      }
    }
  }
}));

describe('NuevoAlumnoModal Component', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockNiveles = [{ nivelId: 1, nombre: 'Primaria' }];
    mockGrados = [{ gradoId: 1, nivelId: 1, nombre: '1ro' }];
    mockGrupos = [{ grupoId: 1, gradoId: 1, nivelId: 1, nombre: '1ro A', seccion: 'A' }];
    mockCiclos = [{ cicloId: 1, nombre: '2023-2024', activo: true }];
    mockPlanesPago = [{ planPagoId: 1, nombre: 'Plan 10 Meses' }];
  });

  it('no debe renderizar nada si isOpen es false', () => {
    const { container } = render(<NuevoAlumnoModal isOpen={false} onClose={onClose} onSuccess={onSuccess} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('debe mostrar alerta de configuración incompleta si no hay ciclos activos', () => {
    mockCiclos = [{ cicloId: 1, nombre: '2023', activo: false }]; // Ninguno activo
    render(<NuevoAlumnoModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.getByText(/Prerrequisitos Incompletos/i)).toBeInTheDocument();
  });

  it('debe mostrar el formulario de registro si la configuración está completa', () => {
    const { container } = render(<NuevoAlumnoModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.getByText('Registrar Nuevo Alumno')).toBeInTheDocument();
    expect(container.querySelector('input[name="nombreCompleto"]')).toBeInTheDocument();
  });

  it('debe mostrar errores de validación si se envía vacío', async () => {
    render(<NuevoAlumnoModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);
    
    const submitBtn = screen.getByRole('button', { name: /Guardar Alumno/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Obligatorio').length).toBeGreaterThan(0);
    });
    
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('debe llamar a createAlumno con los datos correctos', async () => {
    mockMutateAsync.mockResolvedValueOnce({ alumnoId: 99 });
    const { container } = render(<NuevoAlumnoModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);
    
    // Llenar campos
    const inputNombre = container.querySelector('input[name="nombreCompleto"]');
    if (inputNombre) fireEvent.change(inputNombre, { target: { value: 'Pepe' } });
    
    const inputDate = container.querySelector('input[type="date"]');
    if (inputDate) {
      fireEvent.change(inputDate, { target: { value: '2010-01-01' } });
    }
    
    const sexSelects = document.querySelectorAll('select');
    fireEvent.change(sexSelects[0], { target: { value: 'M' } });

    // La matricula no tiene placeholder en el componente, es un input name="matricula"
    const inputMatricula = container.querySelector('input[name="matricula"]');
    if (inputMatricula) {
      fireEvent.change(inputMatricula, { target: { value: 'MAT-123' } });
    }
    
    // Seleccionar nivel
    fireEvent.change(sexSelects[1], { target: { value: '1' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar Alumno/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    const callArgs = mockMutateAsync.mock.calls[0][0];
    expect(callArgs.nombreCompleto).toBe('Pepe');
    expect(callArgs.matricula).toBe('MAT-123');
    expect(callArgs.sexo).toBe('M');
    
    expect(onSuccess).toHaveBeenCalledWith(99);
  });
});