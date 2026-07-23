// @ts-ignore
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function clearDb() {
  await prisma.$transaction([
    prisma.aplicacionPago.deleteMany(),
    prisma.pago.deleteMany(),
    prisma.movimientoSaldo.deleteMany(),
    prisma.calendarioPago.deleteMany(),
    prisma.cargoExtraordinario.deleteMany(),
    prisma.tarifa.deleteMany(),
    prisma.inscripcionCiclo.deleteMany(),
    prisma.calificacion.deleteMany(),
    prisma.asignacionMateria.deleteMany(),
    prisma.materia.deleteMany(),
    prisma.grupo.deleteMany(),
    prisma.tutorAlumno.deleteMany(),
    prisma.alumno.deleteMany(),
    prisma.tutor.deleteMany(),
    prisma.grado.deleteMany(),
    prisma.nivelEducativo.deleteMany(),
    prisma.planPago.deleteMany(),
    prisma.cicloEscolar.deleteMany(),
    prisma.sesionUsuario.deleteMany(),
    prisma.usuarioRol.deleteMany(),
    prisma.rol.deleteMany(),
    prisma.usuario.deleteMany()
  ]);
}

export async function seedDbForAuth() {
  // Crear un rol admin y un usuario para auth
  const rol = await prisma.rol.create({
    data: { codigo: 'ADMIN', nombre: 'Administrador' }
  });

  const user = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Admin Test',
      correoElectronico: 'admin@test.com',
      contrasenaHash: '$2b$10$XQ8n.lA3nZ7vF6Y6Z6Z6Z.Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6', // asumiendo bcrypt de alguna manera, o si el login no checa hash de verdad en db_test
      activo: true
    }
  });

  await prisma.usuarioRol.create({
    data: { usuarioId: user.usuarioId, rolId: rol.rolId }
  });
}
