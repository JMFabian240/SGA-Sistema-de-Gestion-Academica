import { PrismaClient, NivelPermiso } from '@prisma/client';

const prisma = new PrismaClient();

const MODULOS_SISTEMA = [
  'Usuarios',
  'Alumnos',
  'Tutores',
  'Grupos',
  'Materias',
  'Pagos',
  'Becas',
  'Reportes',
  'Configuracion'
] as const;

function getDefaultPermissions(roles: string[]): { modulo: string, nivel: NivelPermiso }[] {
  if (roles.includes('ADMIN')) {
    return MODULOS_SISTEMA.map(m => ({ modulo: m, nivel: NivelPermiso.LECTURA_Y_ESCRITURA }));
  }

  if (roles.includes('GESTOR')) {
    return MODULOS_SISTEMA.map(m => {
      if (['Usuarios', 'Configuracion'].includes(m)) return { modulo: m, nivel: NivelPermiso.DENEGADO };
      return { modulo: m, nivel: NivelPermiso.LECTURA_Y_ESCRITURA };
    });
  }

  if (roles.includes('DOCENTE')) {
    return MODULOS_SISTEMA.map(m => {
      if (['Alumnos', 'Grupos', 'Materias'].includes(m)) return { modulo: m, nivel: NivelPermiso.LECTURA };
      return { modulo: m, nivel: NivelPermiso.DENEGADO };
    });
  }

  return MODULOS_SISTEMA.map(m => ({ modulo: m, nivel: NivelPermiso.DENEGADO }));
}

async function main() {
  console.log('Iniciando sincronización de permisos por defecto...');
  
  const usuarios = await prisma.usuario.findMany({
    include: {
      roles: {
        include: { rol: true }
      }
    }
  });

  for (const u of usuarios) {
    const codigosRoles = u.roles.map(r => r.rol.codigo);
    const permisosPorDefecto = getDefaultPermissions(codigosRoles);
    
    await prisma.$transaction(async (tx) => {
      await tx.usuarioPermisoModulo.deleteMany({
        where: { usuarioId: u.usuarioId }
      });
      
      if (permisosPorDefecto.length > 0) {
        await tx.usuarioPermisoModulo.createMany({
          data: permisosPorDefecto.map(p => ({
            usuarioId: u.usuarioId,
            modulo: p.modulo,
            nivel: p.nivel,
            activo: true
          }))
        });
      }
    });

    console.log(`Permisos sincronizados para usuario ID ${u.usuarioId} (${u.nombreUsuario}) con roles: [${codigosRoles.join(', ')}]`);
  }

  console.log('Finalizado.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
