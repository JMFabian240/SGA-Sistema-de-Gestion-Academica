import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReciboPrintTemplate } from './ReciboPrintTemplate';
import React from 'react';

const mockRecibo = {
  pagoId: 999,
  fechaPago: '2026-07-23T10:00:00Z',
  montoTotal: '1500.50',
  metodoPago: 'TRANSFERENCIA',
  alumno: {
    nombreCompleto: 'JUAN PEREZ LOPEZ'
  },
  aplicacionesPago: [
    {
      montoAplicado: '1000.00',
      calendarioPago: {
        concepto: 'Inscripción',
        mes: null
      }
    },
    {
      montoAplicado: '500.50',
      calendarioPago: {
        concepto: 'Colegiatura',
        mes: 'Septiembre'
      }
    }
  ]
};

describe('ReciboPrintTemplate Component', () => {
  it('no debe renderizar nada si el recibo es null', () => {
    const { container } = render(<ReciboPrintTemplate recibo={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('debe renderizar correctamente la cabecera del recibo', () => {
    render(<ReciboPrintTemplate recibo={mockRecibo} />);
    
    expect(screen.getByText('Colegio San Diego')).toBeInTheDocument();
    expect(screen.getByText('Recibo de Pago No. 999')).toBeInTheDocument();
    expect(screen.getByText('JUAN PEREZ LOPEZ')).toBeInTheDocument();
  });

  it('debe renderizar la lista de conceptos y el método de pago', () => {
    render(<ReciboPrintTemplate recibo={mockRecibo} />);
    
    // Conceptos
    expect(screen.getByText('Inscripción')).toBeInTheDocument();
    expect(screen.getByText('Colegiatura (Septiembre)')).toBeInTheDocument();
    
    // Montos formateados
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('$500.50')).toBeInTheDocument();
    
    // Método de Pago
    expect(screen.getByText('transferencia')).toBeInTheDocument(); // capitalize lo hará "Transferencia" en css
  });

  it('debe renderizar el total pagado correctamente formateado', () => {
    render(<ReciboPrintTemplate recibo={mockRecibo} />);
    
    // Total Pagado
    expect(screen.getByText('Total Pagado:')).toBeInTheDocument();
    expect(screen.getByText('$1,500.50')).toBeInTheDocument();
  });
});
