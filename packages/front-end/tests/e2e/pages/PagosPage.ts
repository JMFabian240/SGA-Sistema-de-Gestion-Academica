import { Page, Locator } from '@playwright/test';

export class PagosPage {
  readonly page: Page;
  readonly alumnoBusquedaInput: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // UI controls
    this.alumnoBusquedaInput = page.getByPlaceholder(/Buscar alumno/i).or(page.locator('input[placeholder*="alumno"]'));
  }

  async goto() {
    await this.page.goto('/pagos');
    await this.page.waitForURL(/.*\/pagos/);
  }

  async buscarAlumno(matricula: string) {
    await this.alumnoBusquedaInput.fill(matricula);
    await this.page.waitForTimeout(1000); 
    // Seleccionar el alumno del dropdown
    const resultadoBtn = this.page.locator('.absolute.top-full button').filter({ hasText: matricula }).first();
    await resultadoBtn.click();
    await this.page.waitForTimeout(1000); // Esperar a que carguen las deudas
  }

  async seleccionarPagoPendiente(concepto?: string) {
    // Esperamos a que el checkbox / botón de "Marcar todos" esté estable
    const marcarTodosBtn = this.page.getByText(/Marcar todos/i);
    await marcarTodosBtn.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(500); // Dar respiro a React
    await marcarTodosBtn.click();
    await this.page.waitForTimeout(500); // Esperar que cambie el state de TicketCheckout
  }

  async confirmarPagoEnModal(metodoPago: string, monto?: string) {
    // En la nueva UI de Caja, el método de pago se selecciona haciendo click en el botón con su label
    await this.page.getByRole('button', { name: new RegExp(metodoPago, 'i') }).click();
    
    // Y luego se da click a "Cobrar Ticket"
    const cobrarTicketBtn = this.page.getByRole('button', { name: /Cobrar Ticket/i });
    
    // Validar explícitamente que no esté disabled antes de hacer click (importante en Playwright)
    // El botón se habilita cuando adeudosSeleccionados.length > 0 y no hay mutation pending.
    await this.page.waitForTimeout(500); // UI updates
    await cobrarTicketBtn.click({ force: true });
  }
}
