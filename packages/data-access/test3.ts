import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const tutores = await p.tutor.findMany();
  console.log("Tutores:");
  console.table(tutores.map(t => ({ id: t.tutorId, nombre: t.nombreCompleto, tel: t.telefono, correo: t.correoElectronico })));

  const alumnos = await p.alumno.findMany();
  console.log("Alumnos:");
  console.table(alumnos.map(a => ({ id: a.alumnoId, nombre: a.nombreCompleto, matricula: a.matricula })));
}
main();
