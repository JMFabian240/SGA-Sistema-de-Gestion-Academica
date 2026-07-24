import { EstadoCobro } from '@sga/data-access';

export interface AppPoolItem {
  pagoId: number;
  montoAplicado: number;
  aplicadoA: string;
}

export interface AdeudoActual {
  calendarioPagoId: number;
  concepto: string;
  mes?: string | null;
  montoOriginal: number | any;
  montoPagado: number | any;
  saldoPendiente: number | any;
  aplicacionesPago: { pagoId: number; montoAplicado: number | any; aplicadoA: string }[];
}

export interface AdeudoIdeal {
  concepto: string;
  mes?: string | null;
  montoOriginal: number;
}

export interface AplicacionCreate {
  calendarioPagoId: number;
  pagoId: number;
  montoAplicado: number;
  aplicadoA: string;
}

export interface AdeudoUpdate {
  calendarioPagoId: number;
  montoOriginal: number;
  montoPagado: number;
  saldoPendiente: number;
  estadoCobro: EstadoCobro;
  liquidadoAt: Date | null;
}

export class RecalculoFinancieroDomain {
  static conciliarAdeudos(
    adeudosActuales: AdeudoActual[],
    adeudosIdeales: AdeudoIdeal[]
  ) {
    let appPool: AppPoolItem[] = [];
    let excesoSinPagoId = 0;

    const adeudosACambiar: AdeudoUpdate[] = [];
    const calendariosConAplicacionesBorradas: number[] = [];
    const nuevasAplicaciones: AplicacionCreate[] = [];

    for (const adeudo of adeudosActuales) {
      const ideal = adeudosIdeales.find((a) => {
        if (a.concepto === adeudo.concepto) return true;
        if (
          a.mes &&
          adeudo.mes &&
          a.mes === adeudo.mes &&
          a.concepto.toUpperCase().includes('COLEGIATURA') &&
          adeudo.concepto.toUpperCase().includes('COLEGIATURA')
        ) {
          return true;
        }
        return false;
      });

      if (!ideal) continue;

      const nuevaTarifa = Number(ideal.montoOriginal);

      let sumAplicacionesFormales = 0;
      for (const app of adeudo.aplicacionesPago) {
        sumAplicacionesFormales += Number(app.montoAplicado);
        appPool.push({
          pagoId: app.pagoId,
          montoAplicado: Number(app.montoAplicado),
          aplicadoA: app.aplicadoA,
        });
      }

      const montoPagadoActual = Number(adeudo.montoPagado);
      if (montoPagadoActual > sumAplicacionesFormales) {
        excesoSinPagoId += montoPagadoActual - sumAplicacionesFormales;
      }

      if (adeudo.aplicacionesPago.length > 0) {
        calendariosConAplicacionesBorradas.push(adeudo.calendarioPagoId);
      }

      let montoParaEsteAdeudo = 0;
      let nuevasApps: AppPoolItem[] = [];
      let nuevoPool: AppPoolItem[] = [];

      // 1. Usar dinero sin pagoId primero
      if (excesoSinPagoId > 0) {
        if (excesoSinPagoId >= nuevaTarifa) {
          montoParaEsteAdeudo += nuevaTarifa;
          excesoSinPagoId -= nuevaTarifa;
        } else {
          montoParaEsteAdeudo += excesoSinPagoId;
          excesoSinPagoId = 0;
        }
      }

      // 2. Usar dinero formal (appPool) si aún falta
      for (const app of appPool) {
        const faltaParaLlenar = nuevaTarifa - montoParaEsteAdeudo;
        if (faltaParaLlenar > 0) {
          if (app.montoAplicado <= faltaParaLlenar) {
            nuevasApps.push({ ...app });
            montoParaEsteAdeudo += app.montoAplicado;
          } else {
            nuevasApps.push({
              pagoId: app.pagoId,
              montoAplicado: faltaParaLlenar,
              aplicadoA: app.aplicadoA,
            });
            montoParaEsteAdeudo += faltaParaLlenar;
            nuevoPool.push({
              pagoId: app.pagoId,
              montoAplicado: app.montoAplicado - faltaParaLlenar,
              aplicadoA: app.aplicadoA,
            });
          }
        } else {
          nuevoPool.push(app);
        }
      }

      appPool = nuevoPool;

      for (const nuevaApp of nuevasApps) {
        nuevasAplicaciones.push({
          pagoId: nuevaApp.pagoId,
          calendarioPagoId: adeudo.calendarioPagoId,
          montoAplicado: nuevaApp.montoAplicado,
          aplicadoA: nuevaApp.aplicadoA,
        });
      }

      const saldoPendiente = Math.round((nuevaTarifa - montoParaEsteAdeudo) * 100) / 100;
      let estadoCobro: EstadoCobro =
        saldoPendiente <= 0 ? EstadoCobro.PAGADO : EstadoCobro.PENDIENTE;
      if (montoParaEsteAdeudo > 0 && saldoPendiente > 0) {
        estadoCobro = EstadoCobro.ABONO;
      }

      adeudosACambiar.push({
        calendarioPagoId: adeudo.calendarioPagoId,
        montoOriginal: nuevaTarifa,
        montoPagado: montoParaEsteAdeudo,
        saldoPendiente: saldoPendiente,
        estadoCobro: estadoCobro,
        liquidadoAt: estadoCobro === EstadoCobro.PAGADO ? new Date() : null,
      });
    }

    const saldoAFavorAppPool = appPool.reduce((acc, curr) => acc + curr.montoAplicado, 0);

    return {
      adeudosACambiar,
      calendariosConAplicacionesBorradas,
      nuevasAplicaciones,
      appPoolFinal: appPool,
      excesoSinPagoId,
      saldoAFavorTotal: saldoAFavorAppPool + excesoSinPagoId,
    };
  }
}
