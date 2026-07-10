export interface PlanPagoData {
  meses: number;
}

export interface BecaData {
  porcentajeDescuento: number;
}

export class CalculadoraPagos {
  /**
   * Genera el arreglo de recibos basados en el Plan de 10 o 12 meses.
   */
  static generarCalendario(
    plan: PlanPagoData, 
    tarifaMensualBase: number, 
    fechaIngreso: Date, 
    beca?: BecaData | null
  ) {
    const meses10 = ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
    const meses12 = ['Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Julio', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];

    const mesesToUse = plan.meses === 12 ? meses12 : meses10;
    const adeudos = [];
    
    // El costo total del ciclo asume que la tarifaMensualBase está planeada a 12 meses
    const costoTotal = tarifaMensualBase * 12;
    // Si son 10 meses, pagan el total dividido entre 10
    const montoMensual10 = costoTotal / 10;
    
    for (let i = 0; i < mesesToUse.length; i++) {
      const mesStr = mesesToUse[i];
      let monto = 0;
      
      // Reglas de negocio
      if (plan.meses === 12) {
        if (mesStr === 'Diciembre') {
          // El monto doble de diciembre
          monto = tarifaMensualBase * 2;
        } else if (mesStr === 'Julio') {
          monto = 0;
        } else {
          monto = tarifaMensualBase;
        }
      } else {
        // Para 10 meses, el pago es uniforme pero 20% más alto
        monto = montoMensual10;
      }

      // Aplicar beca (si no es monto 0)
      if (beca && beca.porcentajeDescuento > 0 && monto > 0) {
        const descuento = (monto * beca.porcentajeDescuento) / 100;
        monto = monto - descuento;
      }

      const fechaVencimiento = new Date(fechaIngreso);
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i + 1);

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
