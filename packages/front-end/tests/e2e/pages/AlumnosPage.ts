import { Page, Locator } from '@playwright/test';

export class AlumnosPage {
  readonly page: Page;
  readonly nuevoAlumnoBtn: Locator;
  readonly modal: Locator;
  
  // Formulario nuevo alumno
  readonly nombreCompletoInput: Locator;
  readonly fechaNacimientoInput: Locator;
  readonly sexoSelect: Locator;
  readonly matriculaInput: Locator;
  readonly curpInput: Locator;
  readonly nivelSelect: Locator;
  readonly gradoSelect: Locator;
  readonly grupoSelect: Locator;
  readonly planPagoSelect: Locator;
  readonly guardarBtn: Locator;
  readonly tablaAlumnos: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nuevoAlumnoBtn = page.getByRole('button', { name: /Nuevo Alumno/i });
    this.modal = page.locator('.fixed.inset-0').last(); // Asumiendo que es el último modal abierto
    
    // Inputs (asumiendo que la UI usa <select> estandar)
    this.nombreCompletoInput = page.locator('input[name="nombreCompleto"]');
    this.fechaNacimientoInput = page.locator('input[name="fechaNacimiento"]');
    this.sexoSelect = page.locator('select[name="sexo"]');
    this.matriculaInput = page.locator('input[name="matricula"]');
    this.curpInput = page.locator('input[name="curp"]');
    
    // Selects
    this.nivelSelect = page.locator('select[name="nivelId"]');
    this.gradoSelect = page.locator('select[name="gradoId"]');
    this.grupoSelect = page.locator('select[name="seccionId"]');
    this.planPagoSelect = page.locator('select[name="planPagoId"]');
    
    this.guardarBtn = page.getByRole('button', { name: /Guardar/i });
    this.tablaAlumnos = page.locator('table');
  }

  async goto() {
    await this.page.goto('/alumnos');
    await this.page.waitForURL(/.*\/alumnos/);
  }

  async abrirModalNuevoAlumno() {
    await this.nuevoAlumnoBtn.click();
    await this.nombreCompletoInput.waitFor({ state: 'visible' });
  }

  async llenarFormulario(datos: {
    nombre: string;
    fechaNacimiento: string;
    sexo: string;
    matricula: string;
    nivelId?: string;
    gradoId?: string;
    grupoId?: string;
    planPagoId?: string;
  }) {
    await this.nombreCompletoInput.fill(datos.nombre);
    await this.fechaNacimientoInput.fill(datos.fechaNacimiento);
    await this.sexoSelect.selectOption(datos.sexo);
    await this.matriculaInput.fill(datos.matricula);
    
    if (datos.nivelId) {
      await this.nivelSelect.selectOption(datos.nivelId);
    }
    
    if (datos.gradoId) {
      await this.gradoSelect.selectOption(datos.gradoId);
    }
    
    if (datos.grupoId) {
      await this.grupoSelect.selectOption(datos.grupoId);
    }
    
    if (datos.planPagoId) {
      await this.planPagoSelect.selectOption(datos.planPagoId);
    }
  }

  async guardar() {
    await this.guardarBtn.click();
  }

  async vincularTutor(nombreTutor: string) {
    // El modal de vincular tutor se abre solo
    const buscarTutorInput = this.page.getByPlaceholder(/Buscar por nombre, correo/i);
    await buscarTutorInput.waitFor({ state: 'visible' });
    
    // Si la lista ya lo muestra, simplemente darle a Vincular
    const vincularBtn = this.page.getByRole('button', { name: /Vincular/i }).first();
    await vincularBtn.click();
    
    // Confirmación que el modal se cierra
    await this.page.waitForTimeout(1000); // Darle tiempo a cerrar todo
  }
}
