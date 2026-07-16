import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  Vaciando la base de datos...');

  // Delete in reverse dependency order (children first)
  await prisma.aplicacionPago.deleteMany();
  await prisma.movimientoSaldo.deleteMany();
  await prisma.recargo.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.calendarioPago.deleteMany();
  await prisma.asignacionBeca.deleteMany();
  await prisma.solicitudBeca.deleteMany();
  await prisma.beca.deleteMany();
  await prisma.calificacion.deleteMany();
  await prisma.asistencia.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.inscripcionCiclo.deleteMany();
  await prisma.ventanaInscripcionTemprana.deleteMany();
  await prisma.grupoMateria.deleteMany();
  await prisma.materia.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.tarifa.deleteMany();
  await prisma.planPago.deleteMany();
  await prisma.tutorAlumno.deleteMany();
  await prisma.datosFiscales.deleteMany();
  await prisma.tutor.deleteMany();
  await prisma.alumno.deleteMany();
  await prisma.grado.deleteMany();
  await prisma.cicloEscolar.deleteMany();
  await prisma.nivelEducativo.deleteMany();
  await prisma.logAuditoria.deleteMany();
  await prisma.configuracionGlobal.deleteMany();
  await prisma.tokenRevocado.deleteMany();
  await prisma.intentoLogin.deleteMany();
  await prisma.usuarioPermisoModulo.deleteMany();
  await prisma.usuarioRol.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.rol.deleteMany();

  console.log('✅ Base de datos vaciada.');

  // Create ADMIN role
  const rol = await prisma.rol.create({
    data: {
      codigo: 'ADMIN',
      nombre: 'Administrador',
    },
  });

  // Also create GESTOR and DOCENTE roles (needed for the app)
  await prisma.rol.create({ data: { codigo: 'GESTOR', nombre: 'Gestor' } });
  await prisma.rol.create({ data: { codigo: 'DOCENTE', nombre: 'Docente' } });

  // Create admin user with hashed password
  const passwordHash = await bcrypt.hash('admin', 10);
  const usuario = await prisma.usuario.create({
    data: {
      nombreUsuario: 'admin',
      nombreCompleto: 'Administrador',
      passwordHash,
      activo: true,
      debeCambiarPwd: false,
    },
  });

  // Assign ADMIN role
  await prisma.usuarioRol.create({
    data: {
      usuarioId: usuario.usuarioId,
      rolId: rol.rolId,
      activo: true,
    },
  });

  // Seed the catalog of Niveles and Grados (needed for imports)
  const niveles = [
    { codigo: 'PRE', nombre: 'Preescolar', orden: 1, grados: [
      { nombre: '1° Grado', numero: 1 },
      { nombre: '2° Grado', numero: 2 },
      { nombre: '3° Grado', numero: 3 },
    ]},
    { codigo: 'PRI', nombre: 'Primaria', orden: 2, grados: [
      { nombre: '1° Grado', numero: 1 },
      { nombre: '2° Grado', numero: 2 },
      { nombre: '3° Grado', numero: 3 },
      { nombre: '4° Grado', numero: 4 },
      { nombre: '5° Grado', numero: 5 },
      { nombre: '6° Grado', numero: 6 },
    ]},
    { codigo: 'SEC', nombre: 'Secundaria', orden: 3, grados: [
      { nombre: '1° Grado', numero: 1 },
      { nombre: '2° Grado', numero: 2 },
      { nombre: '3° Grado', numero: 3 },
    ]},
    { codigo: 'BAC', nombre: 'Bachillerato', orden: 4, grados: [
      { nombre: '1° Semestre', numero: 1 },
      { nombre: '2° Semestre', numero: 2 },
      { nombre: '3° Semestre', numero: 3 },
      { nombre: '4° Semestre', numero: 4 },
      { nombre: '5° Semestre', numero: 5 },
      { nombre: '6° Semestre', numero: 6 },
    ]},
  ];

  for (const n of niveles) {
    const nivel = await prisma.nivelEducativo.create({
      data: { codigo: n.codigo, nombre: n.nombre, orden: n.orden },
    });
    for (const g of n.grados) {
      await prisma.grado.create({
        data: { nombre: g.nombre, numero: g.numero, nivelId: nivel.nivelId },
      });
    }
  }

  console.log('✅ Usuario admin creado (usuario: admin, contraseña: admin)');
  console.log('✅ Roles creados: ADMIN, GESTOR, DOCENTE');
  console.log('✅ Catálogo de niveles y grados recreado');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
