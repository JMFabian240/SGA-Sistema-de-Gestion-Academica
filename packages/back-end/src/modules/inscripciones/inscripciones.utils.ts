export interface PlanPagoData {
  meses: number;
}

export interface BecaData {
  porcentajeDescuento: number;
}

export interface TarifaData {
  concepto: string;
  monto: number;
}

export class CalculadoraPagos {
  /**
   * Suma días naturales a una fecha dada.
   */
  static addNaturalDays(startDate: Date, days: number): Date {
    const result = new Date(startDate);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Genera el arreglo de recibos basados en las tarifas y el plan de pagos.
   */
  static generarCalendario(
    plan: PlanPagoData, 
    tarifas: TarifaData[], 
    fechaIngreso: Date, 
    beca?: BecaData | null
  ) {
    const meses10 = ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
    const meses12 = ['Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Julio', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];

    const mesesToUse = plan.meses === 12 ? meses12 : meses10;
    const adeudos: any[] = [];
    
    // La tarifa que está configurada en la BD es la Anual
    const tarifaColegiatura = tarifas.find(t => t.concepto.toUpperCase() === 'COLEGIATURA');
    const tarifaAnualColegiatura = tarifaColegiatura ? tarifaColegiatura.monto : 0;
    
    // Dividir entre la cantidad de meses del plan escogido
    const montoMensualColegiatura = tarifaAnualColegiatura / plan.meses;
    
    // Pagos Únicos (solo se cobran en el primer mes)
    const conceptosUnicos = ['INSCRIPCION', 'INSCRIPCIÓN', 'ARANCELES', 'MATERIALES', 'LIBROS'];
    
    const primerMes = mesesToUse[0];
    const fechaPrimerMes = new Date(fechaIngreso);
    // Para simplificar, la fecha base de los adeudos del primer mes es la fecha de ingreso
    
    for (const tarifa of tarifas) {
      const conceptoUpper = tarifa.concepto.toUpperCase();
      if (conceptosUnicos.includes(conceptoUpper)) {
        // Plazo: 60 días naturales para inscripción y materiales. Para otros únicos, podemos usar lo mismo o 5.
        // El requerimiento decía "inscripcion y materiales 60 dias, colegiatura 5 dias".
        const diasPlazo = (conceptoUpper.includes('INSCRIPCION') || conceptoUpper.includes('INSCRIPCIÓN') || conceptoUpper.includes('MATERIALES')) ? 60 : 5;
        const fechaVencimiento = this.addNaturalDays(fechaPrimerMes, diasPlazo);
        
        adeudos.push({
          concepto: tarifa.concepto, // ej. "Inscripción", "Materiales"
          mes: primerMes,
          fechaVencimiento,
          montoOriginal: tarifa.monto,
          saldoPendiente: tarifa.monto,
          estadoCobro: tarifa.monto === 0 ? 'PAGADO' : 'PENDIENTE'
        });
      }
    }

    // Generar mensualidades de Colegiatura
    for (let i = 0; i < mesesToUse.length; i++) {
      const mesStr = mesesToUse[i];
      // Regla general: la colegiatura se divide de manera equitativa entre los meses del plan
      let monto = montoMensualColegiatura;

      // Aplicar beca solo a colegiatura
      if (beca && beca.porcentajeDescuento > 0 && monto > 0) {
        const descuento = (monto * beca.porcentajeDescuento) / 100;
        monto = monto - descuento;
      }

      const fechaBaseColegiatura = new Date(fechaIngreso);
      fechaBaseColegiatura.setMonth(fechaBaseColegiatura.getMonth() + i);
      // Vencimiento de colegiatura: 5 días naturales después del día de cobro ("fechaBase")
      const fechaVencimiento = this.addNaturalDays(fechaBaseColegiatura, 5);

      adeudos.push({
        concepto: `Colegiatura ${mesStr}`,
        mes: mesStr,
        fechaVencimiento,
        montoOriginal: monto,
        saldoPendiente: monto,
        estadoCobro: monto === 0 ? 'PAGADO' : 'PENDIENTE'
      });
    }

    return adeudos;
  }
}
