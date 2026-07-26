# **Documento de Alcance del Proyecto: Sistema Escolar Colegio San Diego**

## **1\. Contexto y Objetivos del Proyecto**

El Colegio San Diego (\~200 familias) requiere digitalizar y automatizar su gestión administrativa y escolar, reemplazando procesos manuales en Excel por un sistema centralizado de escritorio que opere en Red de Área Local (LAN).

## **2\. Requerimientos del Sistema (Funcionales)**

### **2.1 Módulo de Usuarios y Roles**

La jerarquía de permisos está definida bajo el principio de menor privilegio:

* **Administradora :** Acceso total.  
* **Gestor:** Gestión operativa, reportes y configuración flexible (con registro de auditoría).  
* **Docente:** Captura de calificaciones (filtro dinámico por grupos asignados).  
* **Protocolo de Recuperación de Accesos (Offline/KISS):**  
  * *Gestor y Docentes:* Restablecimiento manual por la Administradora desde el panel de usuarios.  
  * *Administradora (Root):* Restablecimiento exclusivo mediante acceso físico al Servidor (CLI).

#### **Matriz de Permisos de Usuario**

| Funcionalidad / Módulo | Administrador | Gestor  | Docente |
| :---- | :---- | :---- | :---- |
| **CRUD Alumnos** | R/W | R/W | R (Lectura parcial / Básico) |
| **CRUD Tutores** | R/W | R/W | R |
| **CRUD Grupos** | R/W | R/W | R |
| **CRUD Pagos** | R/W | R/W | No |
| **CRUD Becas** | R/W | W (Token Autorización) | No |
| **CRUD Colegiaturas** | R/W | R/W | No |
| **Configuración Operativa** | R/W | R/W | No |
| **Configuración Crítica** | R/W | No | No |
| **Auditoría / Bitácora** | R/W | No | No |
| **CRUD Usuarios** | R/W | No | No |
| **Reportes** | R/W | R | No |
| **Captura de Calificaciones** | R/W | R/W | R/W (Grupos asignados) |

### **2.2 Módulos Funcionales**

* **Control Escolar (Gestión de Alumnos):** \* Gestión de alumnos con **Soft Delete** (baja lógica para preservación de historial).
  * **Estatus del Alumno (Ciclo de Vida):** El sistema gestiona una máquina de estados estricta para cada alumno con los siguientes estatus: 'Activo', 'Baja Temporal', 'Baja Definitiva', 'Egresado' y 'Transición Pendiente'. Se permite el **Reingreso** de alumnos inactivos (Baja Definitiva o Egresados) reanudando su expediente sin crear duplicados.
  * **Gestión de Estructura Académica:** Módulo para administrar Ciclos Escolares (soportando periodicidad Anual y Semestral con coexistencia paralela de un ciclo activo por cada tipo de periodicidad), Grados y Grupos.
  * **Inicialización Masiva y Cierre Granular por Grupo:** Herramientas para inicializar en bloque los grados y grupos seleccionados por ciclo escolar, y realizar cierres o transiciones de ciclo de forma granular a nivel de grupo específico.
  * **Control de Asistencia Escolar:** Módulo para el seguimiento de asistencias por grupo y materia, con capacidad de consulta por parte de docentes y generación de la lista oficial institucional de asistencia.
  * **Inscripción (Nuevo Ingreso) y Bloqueo Académico:** Flujo guiado (Wizard) para captura simultánea de Tutor, Alumno, Autorizados y generación de primer adeudo. Se valida que el alumno no arrastre materias reprobadas (calificación menor a 6.0) ni talleres "NO ACREDITADOS", o adeudos del ciclo previo.
  * **Transición de Ciclo Escolar (Matriculación Masiva):** Panel interactivo (Data Grid) para promover alumnos al siguiente ciclo en bloque por Nivel Educativo, permitiendo transiciones semestrales (Bachillerato) y anuales (Resto de niveles), con filtros y exclusiones individuales. Valida el estado financiero y escolar bloqueando a los alumnos irregulares en estatus 'Transición Pendiente'.
* **Tutores:** Gestión de tutores, vinculación 1:N con alumnos y directorio fiscal opcional .
* **Ingresos (Cobranza):** 
  * **Catálogo de Conceptos de Cobro:** Soporte nativo y estructurado para: Inscripción, Arancel, Material, Libros, Uniforme, Colegiatura y Conceptos Abiertos (Otros).
  * **Caja de Cobro Unificada:** Capacidad de cobrar múltiples conceptos en una sola transacción, registrar abonos parciales a adeudos de colegiaturas y gestionar saldos a favor (crédito) generados por pagos excedentes, aplicables a cobros futuros.
  * **Cargos Extraordinarios:** Creación y asignación de cobros ad-hoc al calendario de pagos (excursiones, materiales complementarios, multas administrativas, talleres) con montos personalizados.
  * **Expediente Digital Offline:** Carga de comprobantes de pago adjuntos directamente al expediente del tutor (nombrados internamente por UUID para evitar colisiones y almacenados en el sistema de archivos local del servidor LAN mediante el adaptador local offline).
  * **Recálculo de Calendario y Recargos Manuales:** Funciones de auditoría para recalcular adeudos e incorporar recargos o descuentos de manera manual por personal autorizado con registro en bitácora.
  * **Importación Masiva de Datos:** Carga masiva de catálogos (grados, grupos, tarifas), inscripciones, saldos iniciales y registros de pago históricos a través de archivos Excel (.xlsx) y CSV.
  * **Métodos de Pago Aceptados:** Registro estricto para Transferencia, Depósito y Tarjeta de Crédito/Débito (sistema diseñado para operar sin manejo de efectivo físico ni cheques).
  * **Adelanto de Pagos:** Capacidad de registrar pagos adelantados aplicables a meses futuros.
* **Becas y Promociones:** 
  * **Beca de Hermanos:** Descuento fijo del 30% exclusivo e independiente por nivel o grado.
  * **Promociones Estacionales de Inscripción:** Descuentos configurables mediante una matriz dinámica de porcentajes según el Nivel Educativo y Grado escolar específico del alumno.
  * **Ventanas de Inscripción Temprana:** Configuración de plazos promocionales con tarifas y descuentos asociados a fechas de pago anticipado.
* **Calificaciones:** 
  * Captura y módulo de **Historial Académico (Kardex)**.
  * **Periodos de Evaluación:** Parametrizados por nivel (Secundaria \= Trimestral \[3 bloques \+ final\]; Bachillerato \= Bimestral\[3 parciales\] ).
* **Reportes:** \* **Generación de reportes operativos:** Diario, mensual, anual, y por ciclo escolar.
  * **Listados y Reportes Financieros:** Lista de deudores, alumnos con examen pendiente por adeudo, reporte por rango de fechas para ingresos y reporte consolidado de morosidad.
  * **Exportación de datos:** Formatos Excel (.xlsx), CSV y PDF.
* **Alertas (In-App):**   
  * **Alertas en Dashboard:** Integración directa de la lógica de negocio con los widgets de "Deudores Críticos", Top 5 deudores agrupados por familia, cuentas pendientes y "Alertas de Becas" en la pantalla principal.
* **Notificaciones Automatizadas (SMTP):**
  * Envío de recordatorios automáticos por correo electrónico a los padres/tutores antes de la fecha de vencimiento de un pago (umbrales configurables, por defecto 5, 3 y 1 día antes).
  * Envío de aviso preventivo por correo electrónico 5 días antes de que concluya el plazo máximo de 60 días naturales para el pago de inscripción y materiales.

## **3\. Reglas de Negocio y Configuración**

* **Flexibilidad:** El sistema permite modificar umbrales de baja automática.  
* **Planes de Pago:** 10 meses estándar; 12 meses (con pago doble en diciembre para mensualidades de dic-ene).  
* **Bajas:** Automáticas según configuración, con posibilidad de reversión.  
* **Configuración de Alertas SMTP:** Los umbrales de tiempo (días de anticipación) para el envío de recordatorios automáticos de pago son parametrizables por el administrador.
* **Recargo Automático por Morosidad:** Aplicación de un recargo fijo de **$400 MXN** a la cuenta del alumno al transcurrir **5 días hábiles** de gracia posteriores a la fecha de vencimiento original.
* **Recargos Manuales y Ajustes de Calendario:** Adicionalmente al recargo programado por cron, el usuario autorizado puede imputar recargos personalizados o recalcular el calendario de pagos para reconciliaciones de saldo.
* **Convenios de Pago por Rezago:** Mecanismo para consolidar adeudos vencidos de un tutor en un plan de pagos compromiso. Al registrar un convenio activo, se congela temporalmente la generación automática de nuevos recargos por morosidad ($400 MXN) en tanto se cumplan los pagos acordados.
* **Plazo de inscripción:** Conceptos como inscripción y materiales tienen hasta **60 días naturales** de plazo para ser liquidados.
* **Cierre de Ciclo por Grupo:** Permite procesar el cierre o transición de ciclo a nivel de un grupo académico específico, una vez concluidas sus evaluaciones correspondientes.
* **Ventanas de Inscripción Temprana:** Los pagos e inscripciones registradas dentro del rango temporal de una ventana configurada aplican de manera automática las promociones o tarifas reducidas asociadas.  

## **4\. Requerimientos Técnicos (Blindaje y Robustez)**

* **Stack Tecnológico:** Arquitectura Híbrida Cliente-Servidor en LAN vía navegador. Solo el equipo del Administrador instala la app de escritorio Tauri completa (que actúa como servidor local con base de datos y backend empaquetados). El Personal Administrativo y Docentes no instalan ninguna app; acceden mediante un navegador web estándar a la IP del servidor (ejemplo: puerto 8080) dentro de la misma LAN.  
  * **Capa de Base de Datos Integrada (Embedded Data):** PostgreSQL Portable para Windows, empaquetado con `initdb.exe`, `postgres.exe` y `pg_ctl.exe` como sidecar. Tauri inicializa el clúster de datos en `AppData` del usuario al primer arranque y levanta PostgreSQL en segundo plano sobre un puerto libre o predefinido.  
  * **ORM y Acceso a Datos:** Prisma ORM, comunicándose con la instancia local de PostgreSQL de forma transparente.  
  * **Capa Backend Empaquetada:** Fastify / tRPC / Zod, compilado como ejecutable independiente mediante Node sidecar o binario único. Tauri lo arranca después de PostgreSQL y lo detiene de forma segura al cerrar la app.  
  * **Capa Frontend (UI Nativa):** Vite + React + TypeScript, renderizado por WebView2 a través de Tauri. UI construida con Vanilla CSS / CSS Modules, TanStack Query y React Router.  
  * **Capa de Empaquetado y Distribución:** Tauri (Rust) como contenedor de escritorio y orquestador interno, responsable de iniciar PostgreSQL, iniciar el backend, abrir la ventana gráfica y cerrar correctamente los procesos auxiliares.  
* **Integridad Transaccional (ACID):** Todas las operaciones financieras se ejecutarán bajo transacciones atómicas.  
* **Identidad Visual e Interfaz (UI/UX):** \* **Diseño UI:** Minimalista, limpia y enfocada a usuarios con bajo dominio tecnológico.  
  * **Identidad Visual:** Integración del escudo institucional y los colores oficiales de la escuela:  
    * Azul marino: RGB(5, 14, 119\)  
    * Rojo: RGB(249, 3, 0\)  
    * Blanco   
* **Bitácora de Auditoría:** Registro inalterable (append-only) de toda acción sensible.  
* **Estrategia de Respaldo Híbrido (KISS):** Respaldo "Bajo Demanda" (pg\_dump \+ .zip) almacenado localmente en el propio dispositivo y en Google Drive/OneDrive local.

## **5\. Fuera del Alcance (Exclusiones Técnicas y Operativas)**

* **Arquitectura Web Pública (Nube 24/7):** No se desarrollará un portal web accesible desde Internet para padres.  
* **APIs de Mensajería de Terceros (WhatsApp, SMS):** Descartados. No se integrará el envío de alertas vía WhatsApp o SMS (el sistema se limitará a notificaciones por correo electrónico SMTP y notificaciones In-App).  
* **Integración SAT (Facturación Electrónica):** El sistema funge como repositorio de directorio fiscal, pero no timbra CFDI.

## 