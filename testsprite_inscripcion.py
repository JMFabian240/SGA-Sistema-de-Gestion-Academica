import re
import random
# pyrefly: ignore [missing-import]
from playwright.sync_api import Page, expect

def test_inscripcion_y_pago_e2e(page: Page):
    """
    Test E2E de inscripción de un alumno y el cobro en caja 
    adaptado para correr en la infraestructura cloud de TestSprite.
    """
    # 1. Login
    page.goto("/login")
    page.get_by_placeholder("Correo").fill("admin@test.com")
    page.get_by_placeholder("Contraseña").fill("admin")
    page.get_by_role("button", name="Ingresar").click()
    expect(page).to_have_url(re.compile(r".*/$"))
    
    # 2. Navegar a alumnos y abrir modal
    page.goto("/alumnos")
    page.wait_for_url(re.compile(r".*/alumnos"))
    page.get_by_role("button", name="Registrar Alumno").click()
    
    # 3. Llenar datos de inscripción
    matricula_prueba = f"TEST-{random.randint(100000, 999999)}"
    
    # Datos básicos
    page.get_by_placeholder("Ej. Juan Pérez").fill("Juan Perez E2E")
    page.get_by_label("Fecha de Nacimiento").fill("2015-05-15")
    page.locator("select[name='sexo']").select_option("M")
    page.get_by_placeholder("Ej. MAT-2023-001").fill(matricula_prueba)
    
    # En un entorno cloud sin Prisma, seleccionamos los primeros IDs de los catálogos ya existentes
    page.locator("select[name='nivelId']").select_option(index=1)
    page.locator("select[name='gradoId']").select_option(index=1)
    page.locator("select[name='grupoId']").select_option(index=1)
    page.locator("select[name='planPagoId']").select_option(index=1)
    
    # 4. Guardar alumno
    page.get_by_role("button", name="Guardar").click()
    page.wait_for_timeout(2000)
    
    # Vincular al tutor (segundo modal reactivo)
    modal_tutor = page.get_by_role("dialog")
    buscar_tutor = modal_tutor.get_by_placeholder(re.compile(r"Buscar tutor", re.IGNORECASE))
    buscar_tutor.fill("Tutor de Prueba")
    page.wait_for_timeout(1000)
    modal_tutor.locator("button").filter(has_text="Tutor de Prueba").first.click()
    page.get_by_role("button", name="Vincular y Finalizar").click()
    
    # 5. Ir a Pagos (Caja)
    page.goto("/pagos")
    page.wait_for_url(re.compile(r".*/pagos"))
    
    # Buscar al alumno
    busqueda_caja = page.get_by_placeholder(re.compile(r"Buscar alumno", re.IGNORECASE)).or_(page.locator('input[placeholder*="alumno"]'))
    busqueda_caja.fill(matricula_prueba)
    page.wait_for_timeout(1000)
    
    resultado_btn = page.locator(".absolute.top-full button").filter(has_text=matricula_prueba).first
    resultado_btn.click()
    page.wait_for_timeout(1000)
    
    # 6. Seleccionar pago pendiente
    marcar_todos = page.get_by_text(re.compile(r"Marcar todos", re.IGNORECASE))
    marcar_todos.wait_for(state="visible")
    page.wait_for_timeout(500)
    marcar_todos.click()
    page.wait_for_timeout(500)
    
    # 7. Confirmar pago
    page.get_by_role("button", name=re.compile(r"Depósito", re.IGNORECASE)).click()
    cobrar_btn = page.get_by_role("button", name=re.compile(r"Cobrar Ticket", re.IGNORECASE))
    page.wait_for_timeout(500)
    cobrar_btn.click(force=True)
    
    # 8. Validar éxito
    expect(page.get_by_text(re.compile(r"Cobro Exitoso", re.IGNORECASE))).to_be_visible(timeout=10000)
