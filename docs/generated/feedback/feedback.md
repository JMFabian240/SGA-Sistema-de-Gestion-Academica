# Retroalimentación — Entrega de Incremento (Módulo de Control de Pagos)
**Sistema Colegio San Diego — Resumen de sesión de demo con Maestra Norma, Elena (control escolar/contadora) y personal administrativo**

---

## 1. Reglas de negocio nuevas o aclaradas

### Becas y promociones (hallazgo importante — requiere rediseño del catálogo)
- El **30% es EXCLUSIVO de la "beca de hermanos"**. Es un porcentaje fijo, no varía por nivel ni por promoción.
- El resto de los porcentajes (25%, 20%, 18%) corresponden a **promociones estacionales de inscripción** (ej. "Marzo-Junio", "Noviembre-Diciembre"), y **el mismo nombre de promoción tiene distinto porcentaje según nivel educativo y, en algunos casos, según grado dentro del mismo nivel**. Ejemplo real dado por la escuela para la promoción "Marzo-Junio":
  - Preescolar: 30% en primero, 25% en segundo y tercero.
  - Primaria: 18% (parejo de 2° a 6°).
  - Secundaria: 18% (parejo en 2° y 3°).
  - Bachillerato: 20% (parejo en los tres semestres/años).
  - Otras promociones (ej. Noviembre-Diciembre) manejan **tablas de porcentaje totalmente distintas**.
- **Conclusión de diseño:** el catálogo de becas no puede ser "1 beca = 1 porcentaje fijo". Necesita una estructura tipo matriz: **Promoción × Nivel educativo × Grado → Porcentaje**.
- **No se permite doble beca/descuento** sobre el mismo alumno: si un padre ya tiene beca de hermanos, no puede además tomar una promoción de inscripción (debe elegir una). En la práctica, la beca de hermanos casi siempre conviene más.
- El campo "motivo/observación" al asignar una beca es opcional (ej. "recomendación de la maestra").
- La escuela va a enviar por WhatsApp los Excels con las tablas completas de becas/promociones por nivel y grado — **pendiente de recibir y codificar**.

### Plan de pagos (10 vs 12 meses) — corrección detectada
- Plan a 12 meses: el pago doble de diciembre **cubre diciembre + julio (mes de vacaciones)**, **NO diciembre + enero** como el equipo lo tenía entendido/programado. Esto es una corrección a aplicar en el sistema (impacta RF-31).
- Plan a 10 meses: pagos corridos, sin ningún pago doble.

### Conceptos de pago
- Catálogo actual: inscripción, arancel, material, uniforme, colegiatura.
- **Falta el concepto "libros"** (los venden en la escuela, igual que uniformes, por paquete o sueltos).
- La escuela pidió que en vez de una lista cerrada y predefinida (que solo el equipo de desarrollo puede modificar), exista **un campo abierto tipo "otros"** para registrar conceptos no contemplados, sin depender de que el equipo reprograme cada vez.

### Adeudos, alertas y suspensión de servicio (tensión de reglas — requiere decisión de negocio)
- El sistema actual está diseñado para dar de baja temporal automáticamente a los 3 meses de adeudo (RF-29/RF-38/RF-39), pero **en la práctica real de la escuela**:
  - Elena (control escolar) pidió que la alerta de deudor sea **visual desde el primer mes de atraso** (no esperar 2-3 meses), para poder cobrar antes de que se acumule.
  - La política interna real es "corte de servicio" a partir del **segundo mes**, pero la contadora aclaró que **legalmente no pueden negar el servicio académico a un alumno solo por adeudo** (tema tipo LFPDPPP/normativa educativa).
  - Por eso, la escuela prefiere que la suspensión de servicio **NO sea automática**, sino una **acción manual** que el administrador active cuando decida ("ya no dar servicio"), apoyada por alertas tempranas del sistema (rojo desde el mes 1), en vez de un corte automático a los 3 meses.
  - **Recomendación:** revisar RF-29/RF-38/RF-39 para separar "alerta visual temprana" (automática, desde mes 1) de "suspensión de servicio" (manual, decidida por el administrador).

### Abonos / pagos parciales / convenios de pago (funcionalidad faltante)
- Actualmente el sistema **solo acepta el monto exacto** de un pago; si el monto no coincide, no lo guarda. La escuela sí necesita registrar **abonos (pagos parciales)**.
- La escuela maneja **convenios de pago** por escrito cuando un padre se atrasa varios meses: se le informa cuánto debe, firma un convenio con una fecha límite de pago, y ya tienen las plantillas impresas listas para que el padre firme. **Esto no existe todavía como funcionalidad del sistema** — se solicitó explorar si se puede incorporar un apartado de "convenios" con fecha compromiso.

### Calificaciones y materias
- Escala de calificación: 0–10, admite decimales (ej. 7.5). Si por error se captura un valor fuera de rango (ej. 26), el sistema debe topar automáticamente a 10 (ya implementado, validado en la demo).
- **Regla de reprobación:** si un alumno debe **cualquier tipo de materia** (curricular, extracurricular/"especiales", o taller) — **aunque sea una sola** — no puede pasar al siguiente ciclo. No se permiten materias de arrastre en ningún tipo.
- Definición de tipos de materia (aclarado en la sesión):
  - **Curriculares**: materias base normales.
  - **Extracurriculares / "especiales"**: inglés, computación y educación física — las dan maestros especiales que atienden a todos los grupos y niveles (no son del taller ni curricular).
  - **Talleres**: electivos por alumno (ej. ajedrez, fotografía, danza), agrupados normalmente por nivel educativo (uno para primaria, otro compartido para secundaria/bachillerato), no por grupo específico. Un maestro puede ofrecer varios talleres distintos.
- **Caso sin resolver (pendiente, sin urgencia inmediata):** ¿qué pasa si un alumno reprueba el examen extraordinario? Costos definidos: 1ª oportunidad $300, extraordinario $500. Nunca ha ocurrido un caso de reprobar el extraordinario, así que la dirección no tiene una regla definida todavía — lo resolverán manualmente/con la dirección general si llega a pasar. **No implementar automatización de este caso hasta que la escuela defina la regla.**

### Grupos (aclaración de estructura organizacional)
- Preescolar y primaria: se organiza por **grado + grupo** (A, B, C…), normalmente **un solo grupo por grado** (no manejan múltiples secciones por grado actualmente, aunque podría llegar a pasar).
- Bachillerato: se organiza **por semestre**, no por "grado" tradicional (1°–6° semestre = 3 años). **No usan códigos tipo "501"**, solo el número de semestre; actualmente solo tiene un grupo por semestre porque apenas están creciendo la matrícula de bachillerato.
- Funcionalidad ya probada y aprobada: al crear un grupo nuevo, se puede **copiar/cargar materias de un grupo ya existente** en vez de capturarlas de nuevo.

### Facturación
- La escuela **no genera factura electrónica dentro del sistema**: usan un servicio externo llamado "Facture" (compran créditos), y la contadora emite y envía la factura por correo desde ahí.
- El sistema solo necesita **almacenar los datos fiscales** necesarios (RFC, régimen fiscal, CURP, etc.) para que la contadora los use externamente — **confirma que NO se requiere integración SAT/CFDI real dentro del sistema**, solo el directorio de datos fiscales (esto ya estaba contemplado en Módulo 9).

---

## 2. Observaciones sobre pantallas ya construidas

| Pantalla | Estado | Pendiente / corrección |
|---|---|---|
| Alta de usuario | Funciona | Solo la administradora puede crear usuarios y cambiar contraseñas (confirma RF-01) |
| Baja de usuario/maestro | Funciona | Se desactiva, no se elimina (por bitácora) — ya correcto |
| Registro de alumno | Funciona, campos aprobados | CURP automática no funciona bien y no es prioritaria — dejarla opcional/manual; considerar quitarla |
| Gestión de becas | Prototipo simulado | Rediseñar catálogo como matriz Promoción×Nivel×Grado (ver sección 1) |
| Grupos y materias | Funciona | Ya soporta copiar materias entre grupos |
| Calificaciones | Funciona | Tope automático a 10 validado; falta terminar boleta |
| Boleta (PDF) | Plantilla muy provisional | Falta: nombre del alumno, grado, grupo, ciclo escolar y nombre del maestro por materia. Datos institucionales (logo, nombre del plantel, firmas) deben corregirse desde el código, la escuela no los puede editar |
| Directorio de tutores | Funciona | Incluye filtro para mostrar solo los que requieren factura |
| Registro de pagos | Funciona para monto exacto | No acepta abonos/pagos parciales — pendiente |
| Adelantar pagos de colegiatura | Funciona | Permite adelantar meses específicos o todo el ciclo |
| Corte de caja (reporte del día) | Funciona y exporta | — |
| Reporte de deudores | Funciona y exporta | Falta opción de mostrar también quién **ya pagó**, no solo deudores |
| Ingresos mensuales | Solo consulta | Falta poder exportarlo (aún no tiene botón de descarga) |
| Panel principal ("Dashboard") | Funciona, base | Traducir la etiqueta "Dashboard" a **"Panel Principal"**; agregar accesos a: total alumnos, ingresos del día, alumnos con beca, deudores, resumen de pagos del día |

---

## 3. Flujo de trabajo / arquitectura confirmada con la escuela

- Arquitectura **cliente-servidor en LAN** confirmada en campo: la computadora de la maestra Norma (administradora) actúa como servidor y debe **permanecer encendida y con el sistema abierto** para que los demás equipos tengan acceso; si se apaga, todos pierden acceso a la base de datos.
- Plan de despliegue: empaquetar como ejecutable/instalable y probar vía USB en las computadoras del plantel.
- La contadora **Rosy** (reemplazó a Esteban, quien ya no trabaja ahí) será quien pruebe el sistema en paralelo con su proceso manual actual en Excel, para validar consistencia de resultados.
- La escuela va a compartir por WhatsApp:
  1. Un Excel con la base de datos de un **ciclo escolar ya cerrado**, para usar como datos de prueba (incluye info real de deudores y pagos históricos).
  2. Los Excels con las **tablas completas de becas/promociones** por nivel y grado.
- Proceso manual actual (contexto para diseño): la escuela lleva todo en un Excel por ciclo, con una pestaña por grado/nivel, marcando en negritas los meses que aún no aplican cobro (ej. julio en plan de 12 meses), y anotando observaciones manuales para casos especiales de alumnos con atrasos crónicos.
- **Prioridad explícita pedida por la escuela:** arreglar y estabilizar lo que ya existe antes de seguir agregando funciones nuevas — aunque en la misma sesión surgieron varias solicitudes nuevas (abonos, convenios, alerta de deudor desde mes 1, concepto "libros", matriz de becas). Vale la pena acordar con el equipo qué de esto entra en el alcance inmediato y qué queda para una siguiente iteración.
- Próxima reunión: la escuela pidió agendar con más frecuencia durante el periodo vacacional actual para iterar más rápido antes de que inicie el próximo ciclo (agosto).

---

## 4. Lista de pendientes accionables (para el equipo)

1. **Corregir** la lógica del pago doble del plan de 12 meses: diciembre + julio, no diciembre + enero.
2. **Rediseñar** el catálogo de becas como matriz Promoción × Nivel × Grado → Porcentaje (esperar Excels de la escuela).
3. **Agregar** el concepto de pago "libros" y evaluar un campo abierto "otros" para conceptos no catalogados.
4. **Definir con el equipo/la escuela** si la suspensión de servicio por adeudo debe ser manual en vez de automática a los 3 meses, y agregar alerta visual desde el primer mes de atraso.
5. **Agregar** soporte de abonos/pagos parciales al registro de pagos.
6. **Evaluar** un módulo o apartado simple de "convenios de pago" (monto adeudado + fecha compromiso).
7. **Completar la boleta**: agregar nombre del alumno, grado, grupo, ciclo escolar y nombre del maestro por materia; coordinar con la escuela la corrección de datos institucionales (logo, firmas).
8. **Agregar exportación** al reporte de ingresos mensuales.
9. **Agregar** al reporte de deudores la opción de mostrar también a quienes ya pagaron.
10. **Traducir** la etiqueta "Dashboard" a "Panel Principal".
11. **Revisar/simplificar o quitar** el autollenado de CURP (no funciona bien y no es indispensable, ya que todo se puede capturar manual).
12. **Preparar el empaquetado** del sistema como ejecutable/instalable para pruebas piloto vía USB.
13. Confirmar la regla de "no doble beca" quede reflejada en la lógica (sibling discount vs. promociones de inscripción son mutuamente excluyentes).
14. Dejar documentado (sin implementar aún) el caso pendiente de "reprobar examen extraordinario", ya que la escuela no tiene definida la regla.
