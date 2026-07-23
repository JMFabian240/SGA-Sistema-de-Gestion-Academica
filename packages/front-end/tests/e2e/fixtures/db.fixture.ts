// @ts-ignore
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function clearDb() {
  await prisma.$transaction([
    prisma.aplicacionPago.deleteMany(),
    prisma.pago.deleteMany(),
    prisma.movimientoSaldo.deleteMany(),
    prisma.calendarioPago.deleteMany(),
    prisma.tarifa.deleteMany(),
    prisma.inscripcionCiclo.deleteMany(),
    prisma.calificacion.deleteMany(),
    prisma.materia.deleteMany(),
    prisma.grupo.deleteMany(),
    prisma.tutorAlumno.deleteMany(),
    prisma.alumno.deleteMany(),
    prisma.tutor.deleteMany(),
    prisma.grado.deleteMany(),
    prisma.nivelEducativo.deleteMany(),
    prisma.planPago.deleteMany(),
    prisma.cicloEscolar.deleteMany(),
    prisma.intentoLogin.deleteMany(),
    prisma.tokenRevocado.deleteMany(),
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
      nombreUsuario: 'admin@test.com',
      passwordHash: '$2b$10$N//f96n0gZdy0mbkyRN5jucJsC/aWz/HXufjnT2cWOlWePEDqENVG',
      activo: true
    }
  });

  await prisma.usuarioRol.create({
    data: { usuarioId: user.usuarioId, rolId: rol.rolId }
  });
}
