import { NivelPermiso } from '@prisma/client';

export const MODULOS_SISTEMA = [
  'Usuarios',
  'Alumnos',
  'Tutores',
  'Grupos',
  'Materias',
  'Pagos',
  'Becas',
  'Reportes',
  'Configuracion',
  'Calificaciones'
] as const;

export function getDefaultPermissions(roles: string[]): { modulo: string, nivel: NivelPermiso }[] {
  // Administrador: Acceso total a todo
  if (roles.includes('ADMIN')) {
    return MODULOS_SISTEMA.map(m => ({ modulo: m, nivel: NivelPermiso.LECTURA_Y_ESCRITURA }));
  }

  // Gestor: Acceso total excepto a usuarios (permite Configuración para poder ver la pantalla y editar Tarifas)
  if (roles.includes('GESTOR')) {
    return MODULOS_SISTEMA.map(m => {
      if (['Usuarios'].includes(m)) return { modulo: m, nivel: NivelPermiso.DENEGADO };
      return { modulo: m, nivel: NivelPermiso.LECTURA_Y_ESCRITURA };
    });
  }

  // Docente: Acceso solo lectura a módulos académicos (las calificaciones se manejan por su propio endpoint)
  if (roles.includes('DOCENTE')) {
    return MODULOS_SISTEMA.map(m => {
      if (['Alumnos', 'Grupos', 'Materias'].includes(m)) return { modulo: m, nivel: NivelPermiso.LECTURA };
      if (m === 'Calificaciones') return { modulo: m, nivel: NivelPermiso.LECTURA_Y_ESCRITURA };
      return { modulo: m, nivel: NivelPermiso.DENEGADO };
    });
  }

  // Por defecto, denegar todo
  return MODULOS_SISTEMA.map(m => ({ modulo: m, nivel: NivelPermiso.DENEGADO }));
}
