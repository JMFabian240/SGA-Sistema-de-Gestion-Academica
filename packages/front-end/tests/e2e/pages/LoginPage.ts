import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input[type="text"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: /Iniciar Sesión/i });
    this.errorMessage = page.locator('.bg-red-50'); // Clase del contenedor de error
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForURL(/.*\/login/);
    await this.usernameInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
