import { describe, it, expect } from 'vitest';
import { CalculadoraPagos } from './inscripciones.utils';

describe('CalculadoraPagos', () => {
  const fechaIngreso = new Date('2025-08-15');

  it('debe calcular correctamente un plan de 10 meses sin Diciembre doble', () => {
    const plan = {
      meses: 10
    };
    const tarifa = 1000;

    const recibos = CalculadoraPagos.generarCalendario(plan, tarifa, fechaIngreso);

    expect(recibos.length).toBe(10);
    // Verificamos que arranque en Septiembre
    expect(recibos[0].mes).toBe('Septiembre');
    expect(recibos[0].montoOriginal).toBe(1000);

    // Verificamos Diciembre
    const dic = recibos.find(r => r.mes === 'Diciembre');
    expect(dic).toBeDefined();
    expect(dic?.montoOriginal).toBe(1000); // Sin cobro doble

    // Verificamos último mes
    expect(recibos[9].mes).toBe('Junio');
  });

  it('debe calcular un plan de 12 meses con Agosto, Diciembre doble y Julio 0', () => {
    const plan = {
      meses: 12
    };
    const tarifa = 1000;

    const recibos = CalculadoraPagos.generarCalendario(plan, tarifa, fechaIngreso);

    // Son 12 recibos en arreglo físico
    expect(recibos.length).toBe(12);
    
    // Verificamos que arranque en Agosto
    expect(recibos[0].mes).toBe('Agosto');
    expect(recibos[0].montoOriginal).toBe(1000);

    // Verificamos Diciembre (Debe ser el doble)
    const dic = recibos.find(r => r.mes === 'Diciembre');
    expect(dic).toBeDefined();
    expect(dic?.montoOriginal).toBe(2000);

    // Verificamos Julio (Monto 0, PAGADO)
    const jul = recibos.find(r => r.mes === 'Julio');
    expect(jul).toBeDefined();
    expect(jul?.montoOriginal).toBe(0);
    expect(jul?.estadoCobro).toBe('PAGADO');
  });

  it('debe aplicar el descuento de beca correctamente a las mensualidades (excepto Julio)', () => {
    const plan = {
      meses: 12
    };
    const tarifa = 1000;
    const beca = { porcentajeDescuento: 15 }; // 15% de descuento

    const recibos = CalculadoraPagos.generarCalendario(plan, tarifa, fechaIngreso, beca);

    const ago = recibos.find(r => r.mes === 'Agosto');
    // 15% de 1000 = 150. Paga 850.
    expect(ago?.montoOriginal).toBe(850);

    const dic = recibos.find(r => r.mes === 'Diciembre');
    // 15% de 2000 = 300. Paga 1700.
    expect(dic?.montoOriginal).toBe(1700);

    const jul = recibos.find(r => r.mes === 'Julio');
    // Monto 0 - 0% = 0.
    expect(jul?.montoOriginal).toBe(0);
  });
});
