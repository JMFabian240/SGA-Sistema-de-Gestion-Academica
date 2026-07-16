import { PagosService } from './src/modules/pagos/pagos.service';

PagosService.createTarifa({ cicloId: 1, nivelId: 1, concepto: 'INSCRIPCION', monto: 1500 }).then(console.log).catch(console.error);
