import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de usuarios...');

  // Roles requeridos
  const rolesData = [
    { codigo: 'ADMIN', nombre: 'Administrador' },
    { codigo: 'GESTOR', nombre: 'Gestor' },
    { codigo: 'DOCENTE', nombre: 'Docente' },
  ];

  const rolesMap = new Map();
  for (const r of rolesData) {
    const rol = await prisma.rol.upsert({
      where: { codigo: r.codigo },
      update: {},
      create: r,
    });
    rolesMap.set(r.codigo, rol.rolId);
  }

  const passwordHash = await bcrypt.hash('sandiego', 10);

  const nombres = ['Harry', 'Luis', 'Diana', 'Jessica', 'Pako'];

  const rolesParaAsignar = [
    { rol: 'ADMIN', inicial: 'a' },
    { rol: 'GESTOR', inicial: 'g' },
    { rol: 'DOCENTE', inicial: 'd' }
  ];

  for (const nombre of nombres) {
    for (const r of rolesParaAsignar) {
      const nombreUsuario = `${nombre.toLowerCase()}.${r.inicial}`;
      const usuario = await prisma.usuario.upsert({
        where: { nombreUsuario },
        update: {
          passwordHash,
        },
        create: {
          nombreUsuario,
          nombreCompleto: nombre,
          passwordHash,
          activo: true,
        },
      });

      console.log(`Usuario creado/actualizado: ${nombreUsuario}`);

      // Asignar rol
      const rolId = rolesMap.get(r.rol);
      if (rolId) {
        await prisma.usuarioRol.upsert({
          where: {
            usuarioId_rolId: {
              usuarioId: usuario.usuarioId,
              rolId: rolId,
            }
          },
          update: {},
          create: {
            usuarioId: usuario.usuarioId,
            rolId: rolId,
          }
        });
        console.log(` -> Rol ${r.rol} asignado.`);
      }

      // Asignar permisos de módulo básicos para la interfaz
      const modulos = ['Alumnos', 'Tutores', 'Grupos', 'Materias', 'Pagos', 'Configuracion', 'Usuarios'];
      const nivelPermiso = r.rol === 'ADMIN' ? 'LECTURA_Y_ESCRITURA' : 'LECTURA';
      
      for (const mod of modulos) {
        await prisma.usuarioPermisoModulo.upsert({
          where: {
            usuarioId_modulo: {
              usuarioId: usuario.usuarioId,
              modulo: mod
            }
          },
          update: { nivel: nivelPermiso },
          create: {
            usuarioId: usuario.usuarioId,
            modulo: mod,
            nivel: nivelPermiso,
          }
        });
      }
      console.log(` -> Permisos de módulos asignados.`);
    }
  }

  console.log('Seed de usuarios finalizada.');
}

main()
  .catch((e) => {
    console.error('Error durante la seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
