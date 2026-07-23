import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importacionesService } from './importaciones.service';
import { prismaMock } from '../../../tests/setup/prisma-mock';

describe('ImportacionesService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simular que tx es simplemente prismaMock
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
  });

  describe('procesarImportacionInscripciones', () => {
    
    it('1. Parseo de CSV válido y mapeo transaccional exitoso', async () => {
      const csv = `Tipo de Ciclo,Nivel Educativo Destino,Grado Destino,Grupo Destino,CURP Alumno,Matricula,Nombre Alumno,Fecha Nacimiento,Sexo,Estado Alumno,Nombre Tutor,Telefono Tutor,Correo Tutor,Parentesco,Plan de Pago Asignado
ANUAL,Primaria,1ro,1ro A,CURP123,MAT01,Juan Perez,10/12/2010,M,ACTIVO,Tutor Juan,1234,correo@test.com,Padre,Plan 12 Meses`;

      const buffer = Buffer.from(csv, 'utf8');

      // Setup Mocks
      prismaMock.cicloEscolar.findFirst.mockResolvedValue({ cicloId: 10, periodicidad: 'ANUAL', activo: true } as any);
      prismaMock.nivelEducativo.findFirst.mockResolvedValue({ nivelId: 1, nombre: 'Primaria' } as any);
      prismaMock.grado.findFirst.mockResolvedValue({ gradoId: 2, nivelId: 1, nombre: '1ro' } as any);
      prismaMock.grupo.findFirst.mockResolvedValue({ grupoId: 5, gradoId: 2, cicloId: 10, cupoMaximo: 30 } as any);
      
      // Alumno no existe
      prismaMock.alumno.findFirst.mockResolvedValue(null);
      // Tutor no existe
      prismaMock.tutor.findFirst.mockResolvedValue(null);
      // Inscripción no existe y el grupo tiene cupo
      prismaMock.inscripcionCiclo.findFirst.mockResolvedValue(null);
      prismaMock.inscripcionCiclo.count.mockResolvedValue(0);
      prismaMock.planPago.findFirst.mockResolvedValue({ planPagoId: 99, nombre: 'Plan 12 Meses', meses: 12 } as any);

      // Mutaciones
      prismaMock.alumno.create.mockResolvedValue({ alumnoId: 100 } as any);
      prismaMock.tutor.create.mockResolvedValue({ tutorId: 200 } as any);
      prismaMock.tutorAlumno.create.mockResolvedValue({} as any);
      prismaMock.inscripcionCiclo.create.mockResolvedValue({ fechaIngreso: new Date() } as any);
      prismaMock.planPago.findUnique.mockResolvedValue(null); // Evitar calendario pago para simplificar o simular success

      const result = await importacionesService.procesarImportacionInscripciones(buffer);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Se inscribieron 1 alumnos exitosamente');
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.alumno.create).toHaveBeenCalled();
      expect(prismaMock.tutor.create).toHaveBeenCalled();
      expect(prismaMock.inscripcionCiclo.create).toHaveBeenCalled();
    });

    it('2. Parseo de CSV con campos faltantes (Zod validation error)', async () => {
      // Falta Nombre Alumno y Sexo
      const csv = `Tipo de Ciclo,Nivel Educativo Destino,Grado Destino,Grupo Destino,CURP Alumno,Matricula,Nombre Alumno,Fecha Nacimiento,Sexo,Estado Alumno,Nombre Tutor,Telefono Tutor,Correo Tutor,Parentesco,Plan de Pago Asignado
ANUAL,Primaria,1ro,1ro A,CURP123,MAT01,,10/12/2010,,ACTIVO,Tutor Juan,1234,correo@test.com,Padre,Plan 12 Meses`;

      const buffer = Buffer.from(csv, 'utf8');

      await expect(importacionesService.procesarImportacionInscripciones(buffer))
        .rejects.toThrow(/Error de validación en fila 1/);
        
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('3. CSV parse error por mal formato', async () => {
      // Falta header o mal configurado (en papa parse es flexible, pero probemos un error explícito si hay mismatch)
      // Papa parse en modo greedy tira error si hay mismatch grave, pero Zod lo atajará si algo falta.
      // Modificamos a un csv sin columnas
      const csv = `\n\n`;
      const buffer = Buffer.from(csv, 'utf8');
      
      await expect(importacionesService.procesarImportacionInscripciones(buffer))
        .rejects.toThrow();
    });

    it('4. Alumno ya existente en BD (hace update en vez de create)', async () => {
      const csv = `Tipo de Ciclo,Nivel Educativo Destino,Grado Destino,Grupo Destino,CURP Alumno,Matricula,Nombre Alumno,Fecha Nacimiento,Sexo,Estado Alumno,Nombre Tutor,Telefono Tutor,Correo Tutor,Parentesco,Plan de Pago Asignado
ANUAL,Primaria,1ro,1ro A,CURP_EXISTENTE,MAT01,Juan Perez,10/12/2010,M,ACTIVO,Tutor Juan,1234,correo@test.com,Padre,Plan 12 Meses`;

      const buffer = Buffer.from(csv, 'utf8');

      // Setup Mocks
      prismaMock.cicloEscolar.findFirst.mockResolvedValue({ cicloId: 10, periodicidad: 'ANUAL', activo: true } as any);
      prismaMock.nivelEducativo.findFirst.mockResolvedValue({ nivelId: 1, nombre: 'Primaria' } as any);
      prismaMock.grado.findFirst.mockResolvedValue({ gradoId: 2, nivelId: 1, nombre: '1ro' } as any);
      prismaMock.grupo.findFirst.mockResolvedValue({ grupoId: 5, gradoId: 2, cicloId: 10, cupoMaximo: 30 } as any);
      
      // ALUMNO YA EXISTE
      prismaMock.alumno.findFirst.mockResolvedValue({ alumnoId: 888, curp: 'CURP_EXISTENTE' } as any);
      
      prismaMock.tutor.findFirst.mockResolvedValue(null);
      prismaMock.inscripcionCiclo.findFirst.mockResolvedValue(null);
      prismaMock.inscripcionCiclo.count.mockResolvedValue(0);
      prismaMock.planPago.findFirst.mockResolvedValue({ planPagoId: 99, nombre: 'Plan 12 Meses', meses: 12 } as any);

      // Mutaciones
      prismaMock.tutor.create.mockResolvedValue({ tutorId: 200 } as any);
      prismaMock.tutorAlumno.create.mockResolvedValue({} as any);
      prismaMock.inscripcionCiclo.create.mockResolvedValue({ fechaIngreso: new Date() } as any);

      await importacionesService.procesarImportacionInscripciones(buffer);

      // No debe llamar a alumno.create, debe llamar a alumno.update
      expect(prismaMock.alumno.create).not.toHaveBeenCalled();
      expect(prismaMock.alumno.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { alumnoId: 888 }
      }));
    });

    it('5. Importación falla a la mitad y transaccionalidad aborta (simulado)', async () => {
       const csv = `Tipo de Ciclo,Nivel Educativo Destino,Grado Destino,Grupo Destino,CURP Alumno,Matricula,Nombre Alumno,Fecha Nacimiento,Sexo,Estado Alumno,Nombre Tutor,Telefono Tutor,Correo Tutor,Parentesco,Plan de Pago Asignado
ANUAL,Primaria,1ro,1ro A,CURP1,MAT01,Juan,10/12/2010,M,ACTIVO,Tutor Juan,1234,correo@test.com,Padre,Plan 12 Meses`;

      const buffer = Buffer.from(csv, 'utf8');

      prismaMock.cicloEscolar.findFirst.mockResolvedValue({ cicloId: 10, periodicidad: 'ANUAL', activo: true } as any);
      prismaMock.nivelEducativo.findFirst.mockResolvedValue({ nivelId: 1, nombre: 'Primaria' } as any);
      
      // Simulamos que grado no existe ni puede ser creado/encontrado
      prismaMock.grado.findFirst.mockResolvedValue(null);
      
      await expect(importacionesService.procesarImportacionInscripciones(buffer))
        .rejects.toThrow(/El Grado '1ro' no existe/);
    });

  });
});