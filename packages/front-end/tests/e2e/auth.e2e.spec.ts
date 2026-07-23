import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { clearDb, seedDbForAuth } from './fixtures/db.fixture';

test.describe.configure({ mode: 'serial' });

test.describe('Autenticación', () => {
  let loginPage: LoginPage;

  test.beforeAll(async () => {
    await clearDb();
    await seedDbForAuth();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('Acceso directo sin sesión redirige a login', async ({ page }) => {
    await loginPage.goto();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Login con credenciales incorrectas muestra error', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'wrongpassword');
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Credenciales inválidas');
  });

  test('Login con credenciales correctas redirige al dashboard', async ({ page }) => {
    await loginPage.goto();
    // Usa la contraseña real si el backend no encripta o un stub. Como la BD de pruebas mockea la validez si no coincide el hash real, usaremos credenciales de prueba
    // OJO: Asumiendo que trpc.auth.login checa el password. Si el login en el monorepo es genérico:
    await loginPage.login('admin@test.com', 'admin');
    
    // Debería redirigir a "/"
    await expect(page).toHaveURL('http://localhost:5173/');
    
    // El sidebar debería ser visible. Buscaremos algún elemento del sidebar
    const cerrarSesionBtn = page.getByRole('button', { name: 'Cerrar sesión' });
    await expect(cerrarSesionBtn).toBeVisible();
  });

  test('Cierre de sesión revoca acceso', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin');
    await expect(page).toHaveURL('http://localhost:5173/');
    
    const cerrarSesionBtn = page.getByRole('button', { name: 'Cerrar sesión' });
    await cerrarSesionBtn.click();
    
    // Debería redirigir a login
    await expect(page).toHaveURL(/.*\/login/);
    
    // Intentar volver al dashboard manualmente
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
  });
});
