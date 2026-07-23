import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketCheckout } from './TicketCheckout';
import React from 'react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────
vi.mock('lucide-react', () => ({
  CreditCard: () => <span data-testid="icon-credit-card" />,
  Banknote: () => <span data-testid="icon-banknote" />,
  ReceiptText: () => <span data-testid="icon-receipt" />,
  Save: () => <span data-testid="icon-save" />,
  UploadCloud: () => <span data-testid="icon-upload" />,
  X: () => <span data-testid="icon-x" />,
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('react-to-print', () => ({
  useReactToPrint: () => vi.fn(),
}));

vi.mock('./ReciboPrintTemplate', async () => {
  const React = await import('react');
  return {
    ReciboPrintTemplate: React.forwardRef((props, ref) => (
      <div data-testid="print-template" ref={ref as any}>Template</div>
    )),
  };
});

const mockRegistrarPago = vi.fn();
let mockIsPendingCobro = false;
let mockReciboData: any = null;

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    pagos: {
      getReciboPago: {
        useQuery: (args: any, opts: any) => ({
          data: opts?.enabled ? mockReciboData : null,
          isSuccess: opts?.enabled && mockReciboData !== null,
        }),
      },
      registrarPago: {
        useMutation: (options: any) => ({
          mutate: (data: any) => {
            mockRegistrarPago(data);
            if (options?.onSuccess) {
              options.onSuccess({ success: true, pagoId: 101, message: 'OK' });
            }
          },
          isPending: mockIsPendingCobro,
        }),
      },
    },
  },
}));

// ─────────────────────────────────────────────────
// Datos de Prueba
// ─────────────────────────────────────────────────
const mockAlumnoId = 1;
const mockTutorId = 50;

const mockAdeudos = [
  {
    calendarioPagoId: 10,
    concepto: 'Inscripción',
    saldoPendiente: '1000',
    fechaVencimiento: '2026-08-01',
  },
  {
    calendarioPagoId: 11,
    concepto: 'Colegiatura',
    saldoPendiente: 500, // Número o String
    fechaVencimiento: '2026-09-01',
  },
];

// ─────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────
const renderCheckout = (adeudos = mockAdeudos, onSuccess = vi.fn()) =>
  render(
    <TicketCheckout
      alumnoId={mockAlumnoId}
      tutorId={mockTutorId}
      adeudosSeleccionados={adeudos}
      onCheckoutSuccess={onSuccess}
    />
  );

describe('TicketCheckout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPendingCobro = false;
    mockReciboData = null;
  });

  // ─── 1. Estado inicial e Interfaz ─────────────────────────────
  it('debe renderizar el total a pagar correctamente', () => {
    renderCheckout();
    
    // 1000 + 500 = 1500
    expect(screen.getByText('Conceptos Seleccionados:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    
    const inputMonto = screen.getByDisplayValue('1500') as HTMLInputElement;
    expect(inputMonto).toBeInTheDocument();
  });

  it('el botón de cobrar debe estar deshabilitado si no hay adeudos seleccionados', () => {
    renderCheckout([]);
    
    const btnCobrar = screen.getByRole('button', { name: /Cobrar Ticket/i });
    expect(btnCobrar).toBeDisabled();
  });

  it('el botón de cobrar debe mostrar estado "Procesando..." cuando isPending es true', () => {
    mockIsPendingCobro = true;
    renderCheckout();
    expect(screen.getByRole('button', { name: /Procesando/i })).toBeDisabled();
  });

  // ─── 2. Validaciones de Monto ─────────────────────────────────
  it('debe mostrar la alerta de Abono Parcial si el monto ingresado es menor al total', () => {
    renderCheckout();
    const inputMonto = screen.getByDisplayValue('1500');
    
    fireEvent.change(inputMonto, { target: { value: '1000' } });
    
    expect(screen.getByText(/El padre está pagando menos del total adeudado/i)).toBeInTheDocument();
  });

  it('debe mostrar un toast de error si el monto es mayor al total adeudado', () => {
    renderCheckout();
    const inputMonto = screen.getByDisplayValue('1500');
    const btnCobrar = screen.getByRole('button', { name: /Cobrar Ticket/i });
    
    fireEvent.change(inputMonto, { target: { value: '2000' } });
    fireEvent.click(btnCobrar);
    
    expect(toast.error).toHaveBeenCalledWith('El monto no puede ser mayor al total adeudado de los conceptos seleccionados');
    expect(mockRegistrarPago).not.toHaveBeenCalled();
  });

  it('debe mostrar un toast de error si el monto es 0 o inválido', () => {
    renderCheckout();
    const inputMonto = screen.getByDisplayValue('1500');
    const btnCobrar = screen.getByRole('button', { name: /Cobrar Ticket/i });
    
    fireEvent.change(inputMonto, { target: { value: '0' } });
    fireEvent.click(btnCobrar);
    
    expect(toast.error).toHaveBeenCalledWith('El monto ingresado no es válido');
    expect(mockRegistrarPago).not.toHaveBeenCalled();
  });

  it('debe mostrar toast de error si el alumno no tiene un tutor principal vinculado', () => {
    render(
      <TicketCheckout
        alumnoId={1}
        tutorId={null}
        adeudosSeleccionados={mockAdeudos}
        onCheckoutSuccess={vi.fn()}
      />
    );
    const btnCobrar = screen.getByRole('button', { name: /Cobrar Ticket/i });
    fireEvent.click(btnCobrar);

    expect(toast.error).toHaveBeenCalledWith('El alumno no tiene un tutor principal vinculado.');
    expect(mockRegistrarPago).not.toHaveBeenCalled();
  });

  // ─── 3. Flujo Feliz (Cobro y Modal) ───────────────────────────
  it('debe distribuir el pago y enviar la mutación correctamente', async () => {
    const onSuccessCb = vi.fn();
    renderCheckout(mockAdeudos, onSuccessCb);
    
    // Seleccionar método de pago: Transferencia
    const btnTransferencia = screen.getByRole('button', { name: /Transferencia/i });
    fireEvent.click(btnTransferencia);
    
    // Referencia
    const inputReferencia = screen.getByPlaceholderText(/Transferencia, Voucher/i);
    fireEvent.change(inputReferencia, { target: { value: 'TRANSF-1234' } });

    // Click Cobrar
    const btnCobrar = screen.getByRole('button', { name: /Cobrar Ticket/i });
    fireEvent.click(btnCobrar);

    expect(mockRegistrarPago).toHaveBeenCalledTimes(1);
    
    const args = mockRegistrarPago.mock.calls[0][0];
    expect(args.alumnoId).toBe(1);
    expect(args.tutorId).toBe(50);
    expect(args.montoTotal).toBe(1500);
    expect(args.metodoPago).toBe('TRANSFERENCIA');
    expect(args.observaciones).toBe('TRANSF-1234');
    expect(args.aplicaciones).toHaveLength(2);
    
    // El orden de aplicaciones debe respetar la fecha (prioriza el más viejo, inscripción agosto)
    expect(args.aplicaciones[0].calendarioPagoId).toBe(10);
    expect(args.aplicaciones[0].montoAplicado).toBe(1000);
    expect(args.aplicaciones[1].calendarioPagoId).toBe(11);
    expect(args.aplicaciones[1].montoAplicado).toBe(500);

    // Debe abrir modal de éxito
    await waitFor(() => {
      expect(screen.getByText('¡Cobro Exitoso!')).toBeInTheDocument();
    });
    expect(toast.success).toHaveBeenCalledWith('Cobro registrado exitosamente');
    expect(onSuccessCb).toHaveBeenCalled();
  });

  // ─── 4. Validación de Archivos (Comprobante) ──────────────────
  it('debe rechazar archivos mayores a 5MB', () => {
    renderCheckout();
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File([''], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB

    fireEvent.change(fileInput, { target: { files: [bigFile] } });
    
    expect(toast.error).toHaveBeenCalledWith('El archivo es demasiado grande (máx 5MB)');
  });

  // ─── 5. Comprobación del Modal de Impresión ───────────────────
  it('debe mostrar el botón de impresión una vez que getReciboPago retorna data', async () => {
    // 1. Configuramos el mock de recibo para simular que ya cargó la información
    mockReciboData = { pagoId: 101, metodoPago: 'EFECTIVO' };
    
    renderCheckout();
    const btnCobrar = screen.getByRole('button', { name: /Cobrar Ticket/i });
    fireEvent.click(btnCobrar);

    await waitFor(() => {
      expect(screen.getByText('¡Cobro Exitoso!')).toBeInTheDocument();
    });

    // Como isSuccess de getReciboPago es verdadero (mock), debe salir el botón de imprimir
    expect(screen.getByRole('button', { name: /Imprimir o Guardar como PDF/i })).toBeInTheDocument();
  });
});
