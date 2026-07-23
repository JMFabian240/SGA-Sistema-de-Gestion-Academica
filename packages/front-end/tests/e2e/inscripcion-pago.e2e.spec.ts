import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AlumnosPage } from './pages/AlumnosPage';
import { PagosPage } from './pages/PagosPage';
import { clearDb, seedDbForAuth, seedDbForInscripcion, prisma } from './fixtures/db.fixture';

test.describe('Flujo de Inscripción y Pago', () => {
  let loginPage: LoginPage;
  let alumnosPage: AlumnosPage;
  let pagosPage: PagosPage;

  test.beforeAll(async () => {
    // Limpiar y preparar BD
    await clearDb();
    await seedDbForAuth();
    await seedDbForInscripcion();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    alumnosPage = new AlumnosPage(page);
    pagosPage = new PagosPage(page);

    // Iniciar sesión
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin');
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('Inscribir un nuevo alumno y pagar su inscripción', async ({ page }) => {
    test.setTimeout(120000); // 2 minutos para este flujo complejo

    // 1. Navegar a alumnos y abrir modal
    await alumnosPage.goto();
    await alumnosPage.abrirModalNuevoAlumno();

    // 2. Llenar datos de inscripción
    const matriculaPrueba = `TEST-${Date.now().toString().slice(-6)}`;
    
    // Obtenemos IDs de los catálogos en BD (como esto corre del lado de node, usamos prisma directo)
    const nivel = await prisma.nivelEducativo.findFirst();
    const grado = await prisma.grado.findFirst();
    const grupo = await prisma.grupo.findFirst();
    const planPago = await prisma.planPago.findFirst();

    await alumnosPage.llenarFormulario({
      nombre: 'Juan Perez E2E',
      fechaNacimiento: '2015-05-15',
      sexo: 'M',
      matricula: matriculaPrueba,
      nivelId: String(nivel?.nivelId),
      gradoId: String(grado?.gradoId),
      grupoId: String(grupo?.grupoId),
      planPagoId: String(planPago?.planPagoId)
    });

    // 3. Guardar alumno
    await alumnosPage.guardar();
    // Validar que el primer modal se cierre
    await expect(alumnosPage.modal).toBeHidden({ timeout: 5000 }).catch(() => {});

    // Vincular al tutor de prueba
    await alumnosPage.vincularTutor('Tutor de Prueba');

    // 4. Ir a Pagos (Caja)
    await pagosPage.goto();

    // Buscar al alumno
    await pagosPage.buscarAlumno(matriculaPrueba);
    
    // Esperar a que la página cargue los adeudos (por ejemplo, esperamos que aparezca "Marcar todos")
    await expect(page.getByText(/Marcar todos/i).first()).toBeVisible({ timeout: 15000 });

    // Procesar el primer pago que aparezca (o todos los pendientes)
    await pagosPage.seleccionarPagoPendiente();
    // Usar 'Depósito' o 'Transferencia' que sí están en el UI
    await pagosPage.confirmarPagoEnModal('Depósito');

    // Validar que se muestre el modal de éxito (que dice "¡Cobro Exitoso!")
    await expect(page.getByText(/Cobro Exitoso/i)).toBeVisible({ timeout: 10000 });
  });
});
