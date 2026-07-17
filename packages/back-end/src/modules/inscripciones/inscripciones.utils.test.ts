import { describe, it, expect } from 'vitest';
import { CalculadoraPagos } from './inscripciones.utils';

describe('CalculadoraPagos', () => {
  const fechaIngreso = new Date('2025-08-15');

  it('debe calcular correctamente un plan de 10 meses', () => {
    const plan = { meses: 10 };
    const tarifas = [{ concepto: 'Colegiatura', monto: 12000 }]; // 12000 anual
    const recibos = CalculadoraPagos.generarCalendario(plan, tarifas, fechaIngreso, 1);

    expect(recibos.length).toBe(10);
    expect(recibos[0].mes).toBe('Septiembre');
    expect(recibos[0].montoOriginal).toBe(1200);

    const dic = recibos.find(r => r.mes === 'Diciembre');
    expect(dic?.montoOriginal).toBe(1200); // Sin cobro doble
  });

  it('debe calcular un plan de 12 meses dividiendo equitativamente la tarifa, y calcular pagos únicos', () => {
    const plan = { meses: 12 };
    const tarifas = [
      { concepto: 'Colegiatura', monto: 12000 },
      { concepto: 'Inscripción', monto: 2000 },
      { concepto: 'Uniformes', monto: 1500 } // No debe autogenerarse por ser opcional o al menos no tiene regla especial de fechas. 
      // Wait, uniformes is not in the list of 'INSCRIPCION', 'ARANCELES', etc, so it won't be generated in the one-time loop.
    ];

    const recibos = CalculadoraPagos.generarCalendario(plan, tarifas, fechaIngreso, 1);

    // 12 meses colegiatura + 1 inscripción = 13 recibos
    expect(recibos.length).toBe(13);
    
    // Verificamos Inscripción
    const insc = recibos.find(r => r.concepto === 'Inscripción');
    expect(insc).toBeDefined();
    expect(insc?.montoOriginal).toBe(2000);
    expect(insc?.mes).toBe('Agosto'); // Primer mes

    // Verificamos Colegiaturas
    const ago = recibos.find(r => r.concepto === 'Colegiatura Agosto');
    expect(ago?.montoOriginal).toBe(1000);

    const dic = recibos.find(r => r.concepto === 'Colegiatura Diciembre');
    expect(dic?.montoOriginal).toBe(1000);

    const jul = recibos.find(r => r.concepto === 'Colegiatura Julio');
    expect(jul?.montoOriginal).toBe(1000);
    expect(jul?.estadoCobro).toBe('PENDIENTE');
  });

  it('debe aplicar el descuento de beca correctamente a las mensualidades', () => {
    const plan = { meses: 12 };
    const tarifas = [{ concepto: 'Colegiatura', monto: 12000 }];
    const beca = { porcentajeDescuento: 15 }; // 15% de descuento

    const recibos = CalculadoraPagos.generarCalendario(plan, tarifas, fechaIngreso, 1, beca);

    const ago = recibos.find(r => r.concepto === 'Colegiatura Agosto');
    expect(ago?.montoOriginal).toBe(850); // 15% de 1000

    const dic = recibos.find(r => r.concepto === 'Colegiatura Diciembre');
    expect(dic?.montoOriginal).toBe(850); // 15% de 1000

    const jul = recibos.find(r => r.concepto === 'Colegiatura Julio');
    expect(jul?.montoOriginal).toBe(850);
  });
});
