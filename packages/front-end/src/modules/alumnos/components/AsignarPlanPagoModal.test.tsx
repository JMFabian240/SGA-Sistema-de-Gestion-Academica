import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsignarPlanPagoModal } from './AsignarPlanPagoModal';
import React from 'react';

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  Calculator: () => <span data-testid="icon-calc" />,
  Save: () => <span data-testid="icon-save" />
}));

let mockPlanes: any[] | undefined = [
  { planPagoId: 1, nombre: 'Plan 10 Meses', meses: 10, eliminadoEn: null },
  { planPagoId: 2, nombre: 'Plan 12 Meses', meses: 12, eliminadoEn: null }
];
let mockTarifa = 10000; // Tarifa base anual de prueba

const mockMutate = vi.fn();
const mockInvalidate = vi.fn();

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    useUtils: () => ({
      alumnos: {
        getById: { invalidate: mockInvalidate }
      }
    }),
    inscripciones: {
      getPlanesPago: { useQuery: () => ({ data: mockPlanes }) },
      getTarifaColegiatura: { useQuery: () => ({ data: mockTarifa }) },
      asignarPlanPago: {
        useMutation: (options: any) => ({
          mutate: (data: any) => {
            mockMutate(data);
            if (options?.onSuccess) {
              options.onSuccess();
            }
          }
        })
      }
    }
  }
}));

describe('AsignarPlanPagoModal Component', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    
    mockPlanes = [
      { planPagoId: 1, nombre: 'Plan 10 Meses', meses: 10, eliminadoEn: null },
      { planPagoId: 2, nombre: 'Plan 12 Meses', meses: 12, eliminadoEn: null }
    ];
    mockTarifa = 10000;
  });

  it('no renderiza nada si isOpen es false', () => {
    const { container } = render(<AsignarPlanPagoModal isOpen={false} onClose={onClose} inscripcionId={5} alumnoId={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza planes de pago correctamente', () => {
    render(<AsignarPlanPagoModal isOpen={true} onClose={onClose} inscripcionId={5} alumnoId={1} />);
    
    expect(screen.getByText('Plan 10 Meses')).toBeInTheDocument();
    expect(screen.getByText('Plan 12 Meses')).toBeInTheDocument();
    
    // El botón debe estar deshabilitado porque no se ha seleccionado ninguno
    const submitBtn = screen.getByRole('button', { name: /Asignar Plan/i });
    expect(submitBtn).toBeDisabled();
  });

  it('llama a asignarPlanPago al seleccionar un plan y enviar', async () => {
    render(<AsignarPlanPagoModal isOpen={true} onClose={onClose} inscripcionId={5} alumnoId={99} />);
    
    // Seleccionar el plan 10 meses
    const planDiv = screen.getByText('Plan 10 Meses');
    fireEvent.click(planDiv);

    // Al seleccionar el plan, se debe mostrar la simulación del calendario
    expect(screen.getByText(/Simulación del Calendario/i)).toBeInTheDocument();
    
    const submitBtn = screen.getByRole('button', { name: /Asignar Plan/i });
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const args = mockMutate.mock.calls[0][0];
    
    expect(args.inscripcionId).toBe(5);
    expect(args.planPagoId).toBe(1);
    
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Plan de pago asignado'));
    expect(mockInvalidate).toHaveBeenCalledWith(99);
    expect(onClose).toHaveBeenCalled();
  });
});