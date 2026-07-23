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

export async function seedDbForInscripcion() {
  const nivel = await prisma.nivelEducativo.create({
    data: { codigo: 'PRIMARIA', nombre: 'Primaria', orden: 1 }
  });

  const grado = await prisma.grado.create({
    data: { nivelId: nivel.nivelId, numero: 1, nombre: '1er Grado' }
  });

  const ciclo = await prisma.cicloEscolar.create({
    data: { 
      nombre: '2026-2027', 
      fechaInicio: new Date('2026-08-01T00:00:00.000Z'), 
      fechaFin: new Date('2027-07-15T00:00:00.000Z'),
      activo: true, 
      abierto: true 
    }
  });

  const grupo = await prisma.grupo.create({
    data: { nivelId: nivel.nivelId, gradoId: grado.gradoId, cicloId: ciclo.cicloId, nombre: 'A', cupoMaximo: 30 }
  });

  const planPago = await prisma.planPago.create({
    data: { nombre: 'Plan 10 Meses', meses: 10, montoMensual: 2000, activo: true }
  });

  const tutor = await prisma.tutor.create({
    data: { nombreCompleto: 'Tutor de Prueba', telefono: '5551234567', correoElectronico: 'tutor@test.com' }
  });
}
