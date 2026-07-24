import { EstadoCobro } from '@sga/data-access';
import { RecalculoFinancieroDomain, AdeudoActual, AdeudoIdeal } from './recalculoFinanciero.domain';

describe('RecalculoFinancieroDomain', () => {
  it('debe conciliar correctamente cuando el monto pagado coincide con la nueva tarifa', () => {
    const adeudosActuales: AdeudoActual[] = [
      {
        calendarioPagoId: 1,
        concepto: 'Colegiatura Septiembre',
        mes: 'Septiembre',
        montoOriginal: 1000,
        montoPagado: 1000,
        saldoPendiente: 0,
        aplicacionesPago: [
          { pagoId: 10, montoAplicado: 1000, aplicadoA: 'Colegiatura Septiembre' }
        ]
      }
    ];

    const adeudosIdeales: AdeudoIdeal[] = [
      { concepto: 'Colegiatura Septiembre', mes: 'Septiembre', montoOriginal: 1000 }
    ];

    const resultado = RecalculoFinancieroDomain.conciliarAdeudos(adeudosActuales, adeudosIdeales);

    expect(resultado.adeudosACambiar.length).toBe(1);
    expect(resultado.adeudosACambiar[0].montoOriginal).toBe(1000);
    expect(resultado.adeudosACambiar[0].montoPagado).toBe(1000);
    expect(resultado.adeudosACambiar[0].saldoPendiente).toBe(0);
    expect(resultado.adeudosACambiar[0].estadoCobro).toBe(EstadoCobro.PAGADO);
    
    expect(resultado.nuevasAplicaciones.length).toBe(1);
    expect(resultado.nuevasAplicaciones[0].montoAplicado).toBe(1000);
    expect(resultado.saldoAFavorTotal).toBe(0);
  });

  it('debe generar saldo a favor si la tarifa ideal bajó', () => {
    const adeudosActuales: AdeudoActual[] = [
      {
        calendarioPagoId: 2,
        concepto: 'Colegiatura Octubre',
        mes: 'Octubre',
        montoOriginal: 1000,
        montoPagado: 1000,
        saldoPendiente: 0,
        aplicacionesPago: [
          { pagoId: 11, montoAplicado: 1000, aplicadoA: 'Colegiatura Octubre' }
        ]
      }
    ];

    // La nueva tarifa ideal bajó a 800 (ej. se aplicó beca)
    const adeudosIdeales: AdeudoIdeal[] = [
      { concepto: 'Colegiatura Octubre', mes: 'Octubre', montoOriginal: 800 }
    ];

    const resultado = RecalculoFinancieroDomain.conciliarAdeudos(adeudosActuales, adeudosIdeales);

    expect(resultado.adeudosACambiar[0].montoOriginal).toBe(800);
    expect(resultado.adeudosACambiar[0].montoPagado).toBe(800);
    expect(resultado.adeudosACambiar[0].saldoPendiente).toBe(0);
    expect(resultado.adeudosACambiar[0].estadoCobro).toBe(EstadoCobro.PAGADO);

    // Quedan 200 a favor
    expect(resultado.saldoAFavorTotal).toBe(200);
  });

  it('debe aumentar saldo pendiente si la tarifa ideal subió', () => {
    const adeudosActuales: AdeudoActual[] = [
      {
        calendarioPagoId: 3,
        concepto: 'Inscripción',
        mes: 'Agosto',
        montoOriginal: 2000,
        montoPagado: 2000,
        saldoPendiente: 0,
        aplicacionesPago: [
          { pagoId: 12, montoAplicado: 2000, aplicadoA: 'Inscripción' }
        ]
      }
    ];

    // La nueva tarifa ideal subió a 2500
    const adeudosIdeales: AdeudoIdeal[] = [
      { concepto: 'Inscripción', mes: 'Agosto', montoOriginal: 2500 }
    ];

    const resultado = RecalculoFinancieroDomain.conciliarAdeudos(adeudosActuales, adeudosIdeales);

    expect(resultado.adeudosACambiar[0].montoOriginal).toBe(2500);
    expect(resultado.adeudosACambiar[0].montoPagado).toBe(2000);
    expect(resultado.adeudosACambiar[0].saldoPendiente).toBe(500);
    expect(resultado.adeudosACambiar[0].estadoCobro).toBe(EstadoCobro.ABONO);
    expect(resultado.saldoAFavorTotal).toBe(0);
  });

  it('debe utilizar dinero huérfano (excesoSinPagoId) para abonar', () => {
    const adeudosActuales: AdeudoActual[] = [
      {
        calendarioPagoId: 4,
        concepto: 'Colegiatura Noviembre',
        mes: 'Noviembre',
        montoOriginal: 1000,
        montoPagado: 500,
        saldoPendiente: 500,
        aplicacionesPago: [] // Sin aplicaciones formales (dinero importado de CSV)
      }
    ];

    const adeudosIdeales: AdeudoIdeal[] = [
      { concepto: 'Colegiatura Noviembre', mes: 'Noviembre', montoOriginal: 1000 }
    ];

    const resultado = RecalculoFinancieroDomain.conciliarAdeudos(adeudosActuales, adeudosIdeales);

    // El sistema debe detectar los 500 como excesoSinPagoId y usarlo para la nueva tarifa
    expect(resultado.adeudosACambiar[0].montoPagado).toBe(500);
    expect(resultado.adeudosACambiar[0].saldoPendiente).toBe(500);
    expect(resultado.adeudosACambiar[0].estadoCobro).toBe(EstadoCobro.ABONO);
  });
});
