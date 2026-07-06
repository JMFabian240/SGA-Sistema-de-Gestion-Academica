# Requisitos del Sistema

*Proyecto:* **Proyecto Colegio San Diego**

---

## 1. Requisitos Funcionales

### Módulo 1 — Acceso y Gestión de Usuarios

| ID | Descripción | Tipo |
|---|---|---|
| RF-01 | El administrador debe crear una cuenta, ingresando nombre, rol (Administrador, Gestor,Docente) y contraseña, para registrar a un nuevo colaborador en el sistema. | Usuario |
| RF-02 | El administrador debe habilitar el acceso al sistema, seleccionando la cuenta creada, para aplicar los permisos correspondientes a su nivel. | Usuario |
| RF-03 | El administrador debe consultar el listado de usuarios, ingresando a la vista general, para visualizar el nombre, rol, estado y último acceso de cada colaborador. | Usuario |
| RF-04 | El administrador debe modificar los permisos de acceso de un empleado, seleccionando la cuenta y el tipo de acceso (lectura, escritura o nulo) por módulo, para actualizar su nivel de privilegios. | Usuario |
| RF-05 | El sistema debe aplicar los cambios de permisos, utilizando los datos modificados, para restringir o habilitar el acceso del empleado inmediatamente. | Sistema |
| RF-06 | El gestor administrativo debe consultar el panel administrativo, ingresando a la vista principal, para realizar revisiones y emitir reportes. | Usuario |
| RF-07 | El gestor administrativo debe registrar pagos diarios, ingresando los datos financieros (monto, concepto, método de pago, fecha, alumno), para mantener el cotejo de información al día. | Usuario |
| RF-08 | El docente debe consultar los datos básicos de un alumno, ingresando nombre, grado o grupo, para visualizar nombre, grado, grupo y personas autorizadas. | Usuario |
| RF-09 | El usuario (administrador, gestor o docente) debe cerrar sesión, seleccionando la opción correspondiente, para finalizar su acceso activo. | Usuario |
| RF-10 | El sistema debe redirigir a la pantalla de inicio, eliminando los datos de la sesión activa, para asegurar la cuenta del usuario. | Sistema |
| RF-11 | El administrador debe eliminar(desactivar) la cuenta de un colaborador, seleccionando el usuario por nombre o rol, para darlo de baja del plantel. | Usuario |
| RF-12 | El sistema debe revocar el acceso del colaborador al desactivarlo, utilizando la acción de eliminación, para impedir su ingreso al sistema de forma inmediata. | Sistema |
| RF-13 | El administrador debe restablecer la contraseña de una cuenta de gestor o docente, ingresando una nueva clave temporal desde su panel, para restaurar el acceso en caso de olvido. | Usuario |
| RF-14 | El sistema debe permitir el restablecimiento de la contraseña de la cuenta Administrador (Root) únicamente mediante la ejecución de un comando desde la terminal del servidor (CLI), para garantizar la recuperación exclusiva con acceso físico. | Sistema |

### Módulo 2 — Seguridad y Bitácora

| ID | Descripción | Tipo |
|---|---|---|
| RF-15 | El sistema debe registrar cada acción crítica (creación, modificación, eliminación, acceso), almacenando  fecha, hora, usuario, rol, acción realizada, registro afectado, detalle(antes->después), para mantener el historial de auditoría. | Sistema |
| RF-16 | El administrador debe consultar el historial de la bitácora, ingresando a la bitácora pudiendo filtrar por fecha, usuario, rol, accion, para visualizar los registros de acciones ordenados cronológicamente. | Usuario |
| RF-17 | El administrador debe exportar el historial de la bitácora, seleccionando el rango de fechas y/o el usuario, para obtener un archivo estructurado (Excel o CSV). | Usuario |

### Módulo 3 — Gestión de Padres/Tutores

| ID | Descripción | Tipo |
|---|---|---|
| RF-18 | El usuario autorizado (Administrador/Gestor) debe registrar el perfil de un padre/tutor, ingresando datos personales como nombre completo, numero,  telefono, correo, direccion, tipo de metodo de pago habitual, y/o datos fiscales como RFC, regimen fiscal, uso de CFDI, codigo postal fiscal, direccion fiscal, correo para CFDI, CURP de el/los alumno(s) asociado(s), para guardarlo en la base de datos. | Usuario |
| RF-19 | El usuario autorizado (Administrador/Gestor) debe indicar el requerimiento de datos fiscales del tutor, seleccionando la opción en el perfil, para solicitar los datos fiscales al padre/tutor. | Usuario |
| RF-20 | El usuario autorizado (Administrador/Gestor) debe vincular a un padre/tutor con uno o mas alumnos, ingresando al perfil de padre/tutor y seleccionando los alumnos, para asociarlos a un único perfil de pagos. | Usuario |
| RF-21 | El usuario autorizado (Administrador/Gestor) debe modificar los datos de un padre/tutor, ingresando la información corregida (datos personales, académicos o tutores vinculados), para reflejar los cambios sin afectar el historial previo. | Usuario |
| RF-22 | El usuario autorizado (Administrador/Gestor) debe eliminar(desactivar) el perfil de un padre/tutor, seleccionando la opción de eliminar, para darlo de baja del sistema. | Usuario |
| RF-23 | El usuario autorizado (Administrador/Gestor) debe reactivar el perfil de un padre/tutor, seleccionando la opción de activar, para darlo de alta en el sistema. | Usuario |

### Módulo 4 — Gestión de Alumnos

| ID | Descripción | Tipo |
|---|---|---|
| RF-24 | El usuario autorizado (Administrador/Gestor) debe registrar a un alumno a mitad de ciclo, ingresando la fecha de ingreso y conceptos aplicables (inscripción, material, uniforme, colegiatura proporcional), para incorporarlo al ciclo escolar con estatus 'Activo'. | Usuario |
| RF-25 | El sistema debe calcular el cobro proporcional, utilizando el tiempo restante del ciclo, para generar el calendario de pagos ajustado. | Sistema |
| RF-26 | El usuario autorizado (Administrador/Gestor) debe revertir la baja temporal de un alumno, ingresando el expediente y motivo (ej. pago de deuda crítica, fin de incapacidad médica, corrección de error, regreso al plantel), para restaurar su estatus de 'Baja Temporal' a 'Activo'. | Usuario |
| RF-27 | El sistema debe reactivar la generación de colegiaturas, aplicando la tarifa regular al 100%, para reanudar los cobros sin becas previas perdidas. | Sistema |
| RF-28 | El usuario autorizado (Administrador/Gestor) debe consultar el expediente de un alumno, ingresando nombre, matrícula o CURP, para desplegar todos sus datos registrados. | Usuario |
| RF-29 | El usuario autorizado (Administrador/Gestor) debe modificar los datos de un alumno, ingresando la información corregida (datos personales, académicos o tutores vinculados), para reflejar los cambios en el sistema inmediatamente. | Usuario |
| RF-30 | El usuario autorizado (Administrador/Gestor) debe filtrar el listado de alumnos, ingresando criterios combinados (nivel, grado, grupo), para desplegar únicamente las coincidencias. | Usuario |
| RF-31 | El usuario autorizado (Administrador/Gestor) debe registrar el retiro voluntario de un alumno, cambiando su estatus a 'Baja Definitiva', para sacarlo del ciclo activo conservando su historial. | Usuario |
| RF-32 | El usuario autorizado (Administrador/Gestor) debe procesar el reingreso de un alumno, buscándolo por CURP en el padrón inactivo, para cambiar su estatus de 'Baja Definitiva' o 'Egresado' a 'Activo' y asignarlo a un nuevo ciclo escolar, conservando su historial previo. | Usuario |
| RF-33 | El usuario autorizado (Administrador/Gestor) debe registrar ciclos escolares, definiendo su periodicidad como Anual o Semestral, para estructurar los periodos activos. | Usuario |
| RF-34 | El usuario autorizado (Administrador/Gestor) debe modificar ciclos escolares, actualizando sus fechas (inicio, fin) o estatus (activo, inactivo), para mantener la estructura académica vigente. | Usuario |
| RF-35 | El usuario autorizado (Administrador/Gestor) debe iniciar la transición masiva de ciclo, seleccionando el nivel educativo (Preescolar,Primaria,Secundaria,Bachillerato), para listar alumnos a promover. | Usuario |
| RF-36 | El sistema debe sugerir el siguiente ciclo aplicable (Anual para básicos, Semestral para Bachillerato), para guiar la promoción masiva correcta. | Sistema |
| RF-37 | El sistema debe validar el estado financiero y académico de los alumnos, consultando adeudos y verificando reprobaciones de cualquier tipo de materia (curricular, extracurricular/especial o taller), para retener a los alumnos irregulares cambiando su estatus a 'Transición Pendiente'. | Sistema |
| RF-38 | El sistema debe promover a los alumnos regulares (aquellos sin adeudos financieros y sin materias reprobadas de ningún tipo) al nuevo ciclo sugerido, actualizando su grado o nivel y confirmando su estatus 'Activo', para generar la estructura de cobros correspondientes. | Sistema |
| RF-39 | El usuario autorizado (Administrador/Gestor) debe ejecutar la baja definitiva de un alumno, seleccionando un expediente en 'Baja Temporal' sin acuerdo, para cambiar su estatus a 'Baja Definitiva' y cerrar su participación en el ciclo vigente. | Usuario |
| RF-40 | El usuario autorizado (Administrador/Gestor) debe registrar alumnos de nuevo ingreso mediante un flujo guiado (Wizard) que permita seleccionar a un tutor existente o registrar uno nuevo, seguido de la captura de los datos del alumno y la generación de su primer adeudo, unificando el proceso. | Usuario |
| RF-41 | El usuario autorizado (Administrador/Gestor) debe excluir individualmente a alumnos específicos del panel interactivo de transición de ciclo masiva, deseleccionando sus registros, para gestionar casos de repetición de grado o bajas programadas. | Usuario |
| RF-42 | El usuario autorizado (Administrador/Gestor) debe gestionar los grupos académicos, organizándolos por grado y grupo (secciones A, B, etc.) para Preescolar/Primaria y por número de semestre para Bachillerato, para mantener la estructura organizativa de las clases en el sistema. | Usuario |

### Módulo 5 — Gestión de Becas y Promociones

| ID | Descripción | Tipo |
|---|---|---|
| RF-43 | El administrador debe registrar promociones estacionales y becas, ingresando nombre y configurando una matriz de porcentajes de descuento basados en Promoción × Nivel Educativo × Grado (excepto para Beca de Hermanos que maneja un 30% fijo), para almacenarlas en el catálogo del sistema. | Usuario |
| RF-44 | El administrador debe consultar los tipos de beca y promociones, seleccionando por nombre, para visualizar los descuentos y matrices de porcentajes disponibles. | Usuario |
| RF-45 | El administrador debe modificar tipos de beca y promociones, actualizando el criterio o la matriz de porcentajes, para aplicarlos a inscripciones futuras sin alterar ciclos activos. | Usuario |
| RF-46 | El administrador debe asignar una beca o promoción a un alumno (de forma mutuamente excluyente entre Beca de Hermanos y promociones de inscripción), seleccionando la opción correspondiente y registrando de forma opcional un motivo o recomendación, para aplicar el descuento en su calendario de pagos. | Usuario |
| RF-47 | El sistema debe generar una 'Solicitud Pendiente' si la asignación es hecha por un Gestor, reteniendo el descuento, para esperar autorización superior. | Sistema |
| RF-48 | El administrador debe gestionar las solicitudes de beca, ingresando al panel de autorizaciones, para Aprobar o Rechazar las peticiones de los Gestores. | Usuario |
| RF-49 | El sistema debe recalcular los cobros del alumno, utilizando la aprobación del Administrador, para aplicar los cambios financieros inmediatamente. | Sistema |
| RF-50 | El administrador debe retirar una beca asignada, ingresando el expediente y motivo (ej. bajo rendimiento, adeudos, retiro voluntario), para actualizar la colegiatura al valor completo en el futuro. | Usuario |
| RF-51 | El sistema debe generar una 'Solicitud de Retiro Pendiente', si la acción es hecha por un Gestor, para esperar la evaluación del Administrador. | Sistema |
| RF-52 | El sistema debe retirar la beca automáticamente, detectando 3 meses consecutivos de adeudo, para recalcular montos sin descuento previo a un cambio académico. | Sistema |
| RF-53 | El usuario autorizado (Administrador/Gestor) debe configurar una promoción por inscripción temprana, ingresando fechas y beneficio, para aplicarla a pagos puntuales. | Usuario |
| RF-54 | El sistema debe otorgar automáticamente la 'Beca por tiempo de inscripción' a los alumnos, detectando que el pago de su inscripción se liquida durante el periodo promocional configurado (ej. enero y febrero), para aplicar el beneficio sin intervención manual. | Sistema |

### Módulo 6 — Gestión de Colegiaturas y Conceptos

| ID | Descripción | Tipo |
|---|---|---|
| RF-55 | El usuario autorizado (Administrador/Gestor) debe configurar las tarifas de colegiaturas e inscripciones, ingresando el ciclo, nivel educativo y los montos correspondientes, para aplicarlas a nuevos registros. | Usuario |
| RF-56 | El usuario autorizado (Administrador/Gestor) debe registrar conceptos de cobro adicionales, seleccionando de una lista estándar (Inscripción, Arancel, Material, Uniforme, Libros) o ingresando una descripción abierta ("Otros") con su monto correspondiente, para mantener flexible y estandarizado el catálogo de ventas. | Usuario |
| RF-57 | El usuario autorizado (Administrador/Gestor) debe asignar el plan de pago (10 meses corridos sin cobro doble, o 12 meses con cobro doble en diciembre correspondiente a diciembre y julio de vacaciones), seleccionando el plan al registrar al alumno, para definir sus plazos. | Usuario |
| RF-58 | El sistema debe generar el calendario de vencimientos, utilizando el plan seleccionado (distribuyendo las mensualidades o aplicando el cargo de diciembre y julio de forma concentrada en diciembre para el plan de 12 meses), para programar los cargos del alumno. | Sistema |
| RF-59 | El sistema debe aplicar un recargo de $400 MXN, contabilizando 5 días hábiles posteriores al vencimiento, para reflejar la penalización en el historial. | Sistema |

### Módulo 7 — Registro y Control de Pagos

| ID | Descripción | Tipo |
|---|---|---|
| RF-60 | El usuario autorizado (Administrador/Gestor) debe registrar un pago (completo o abono parcial), ingresando el tipo de cobro, monto, fecha y método (Transferencia, Tarjeta de Crédito, Tarjeta de Débito, o Depósito), para actualizar el saldo pendiente y el estado del adeudo del alumno. | Usuario |
| RF-60b | El usuario autorizado (Administrador/Gestor) debe registrar un convenio de pago escrito por rezago, ingresando el monto consolidado adeudado y una fecha límite compromiso de pago, para formalizar el acuerdo en el sistema. | Usuario |
| RF-61 | El usuario autorizado (Administrador/Gestor) debe registrar múltiples conceptos en un solo pago, seleccionando el adeudo, colegiatura o artículo adicional, para emitir un único comprobante unificado (ej. Colegiatura + Libros). | Usuario |
| RF-62 | El usuario autorizado (Administrador/Gestor) debe adjuntar un comprobante digital, cargando el archivo correspondiente al pago, para permitir su consulta futura. | Usuario |
| RF-63 | El usuario autorizado (Administrador/Gestor) debe registrar un pago adelantado, ingresando número de meses, monto y método, para liquidar colegiaturas futuras y evitar recargos erróneos. | Usuario |
| RF-64 | El usuario autorizado (Administrador/Gestor) debe modificar un recargo aplicado, ingresando el registro de pago y motivo de modificación (ej. error de captura, condonación parcial), para reflejar el ajuste en la deuda total. | Usuario |
| RF-65 | El sistema debe generar alertas visuales automáticas de color rojo en el expediente del alumno inmediatamente al transcurrir el primer día después de la fecha de vencimiento de un pago, para advertir al personal administrativo desde el primer mes de atraso. | Sistema |
| RF-66 | El usuario autorizado (Administrador/Gestor) debe aplicar manualmente la suspensión de servicio a un alumno con rezago acumulado, cambiando su estatus a 'Baja Temporal' o restringiendo sus evaluaciones desde el panel del alumno, para suspender sus privilegios académicos de forma discrecional. | Usuario |
| RF-67 | El sistema debe suspender la generación automática de colegiaturas del alumno al registrar que su estatus cambió a 'Baja Temporal' (por suspensión manual), para mantener intacto el adeudo previo. | Sistema |
| RF-68 | El sistema debe generar alertas visuales automáticas y resúmenes de morosidad, detectando vencimientos próximos o pérdida de becas, para informar al personal en el Panel Principal. | Sistema |

### Módulo 8 — Historial de Pagos

| ID | Descripción | Tipo |
|---|---|---|
| RF-69 | El usuario autorizado (Administrador/Gestor) debe consultar el historial de pagos de un tutor, ingresando nombre del alumno o tutor, para visualizar fechas, estados y saldos en una línea de tiempo. | Usuario |
| RF-70 | El usuario autorizado (Administrador/Gestor) debe consultar el estado de cuenta consolidado, buscando por tutor, para visualizar la deuda total de la familia desglosada por alumno. | Usuario |
| RF-71 | El usuario autorizado (Administrador/Gestor) debe distribuir un único comprobante de pago, asignándolo entre conceptos pendientes de distintos hermanos, para registrarlos simultáneamente. | Usuario |

### Módulo 9 — Reportes

| ID | Descripción | Tipo |
|---|---|---|
| RF-72 | El usuario autorizado (Administrador/Gestor) debe generar un reporte de pagos diarios, solicitando la extracción del día actual, para exportar un desglose (Excel/PDF) con sumatoria total. | Usuario |
| RF-73 | El usuario autorizado (Administrador/Gestor) debe generar y exportar el reporte de ingresos mensuales, seleccionando mes y año, para obtener el desglose detallado de cobros del periodo en un formato estructurado (Excel/CSV). | Usuario |
| RF-74 | El usuario autorizado (Administrador/Gestor) debe generar un reporte financiero por ciclo escolar, seleccionando el ciclo, para exportar el resumen de ingresos y alumnos activos. | Usuario |
| RF-75 | El usuario autorizado (Administrador/Gestor) debe consultar la lista de alumnos según estado de pago (deudores o pagados), filtrando por mes y estatus de cobro, para visualizar los adeudos consolidados por familia y días de retraso o confirmar los cobros liquidados. | Usuario |
| RF-76 | El usuario autorizado (Administrador/Gestor) debe consultar la lista de alumnos con examen restringido, indicando el periodo de evaluación, para identificar a los afectados por adeudos. | Usuario |
| RF-77 | El usuario autorizado (Administrador/Gestor) debe generar un reporte de requerimientos de facturación, solicitando el listado, para exportar los datos fiscales de los padres aplicables. | Usuario |

### Módulo 10 — Registro de Calificaciones

| ID | Descripción | Tipo |
|---|---|---|
| RF-78 | El usuario autorizado (Administrador/Gestor/Docente) debe registrar la evaluación trimestral de preescolar, ingresando observaciones y recomendaciones en texto, para guardarla vinculada al ciclo activo. | Usuario |
| RF-79 | El usuario autorizado (Administrador/Gestor/Docente) debe registrar calificaciones numéricas de primaria, ingresando notas por trimestre y materia, para generar el promedio del ciclo. | Usuario |
| RF-80 | El usuario autorizado (Administrador/Gestor/Docente) debe registrar calificaciones de secundaria, ingresando notas por bloque y calificación final, para guardarlas vinculadas al expediente. | Usuario |
| RF-81 | El usuario autorizado (Administrador/Gestor/Docente) debe registrar calificaciones de bachillerato, ingresando notas por bimestre, para guardarlas en el perfil del alumno en curso. | Usuario |
| RF-82 | El usuario autorizado (Administrador/Gestor/Docente) debe registrar la calificación de clubes extracurriculares, ingresando la nota del periodo en el club correspondiente, para su inclusión separada en la boleta. | Usuario |
| RF-83 | El usuario autorizado (Administrador/Gestor/Docente) debe registrar la evaluación de la materia Taller, ingresando una escala cualitativa (A/NA), para guardarla en el historial sin afectar promedios numéricos. | Usuario |
| RF-84 | El usuario autorizado (Administrador/Gestor/Docente) debe modificar una calificación registrada, ingresando la corrección (nueva calificación) y el motivo (ej. error de captura, revisión de examen), para actualizar la boleta y registrar el cambio en la bitácora. | Usuario |

### Módulo 11 — Generación y Consulta de Boletas

| ID | Descripción | Tipo |
|---|---|---|
| RF-85 | El usuario autorizado (Administrador/Gestor/Docente) debe consultar calificaciones de un alumno, ingresando nombre o matrícula, para visualizar únicamente el periodo activo sin datos fiscales ni pagos. | Usuario |
| RF-86 | El sistema debe emitir la boleta de calificaciones en formato PDF de manera dinámica, incorporando el nombre del alumno, grado, grupo, ciclo escolar, materias cursadas con el nombre de sus respectivos docentes y datos institucionales inalterables (logo y firmas), para entregar un documento formal completo según el nivel educativo. | Sistema |
| RF-87 | El sistema debe generar una alerta de restricción de examen, cruzando el estado de pagos con el periodo activo, para advertir al administrador que el alumno tiene deudas. | Sistema |

### Módulo 12 — Historial Académico

| ID | Descripción | Tipo |
|---|---|---|
| RF-88 | El usuario autorizado (Administrador/Gestor/Docente) debe consultar el historial de calificaciones, ingresando nombre o matrícula, para visualizar las notas ordenadas por ciclo, periodo y materia. | Usuario |
| RF-89 | El usuario autorizado (Administrador/Gestor/Docente) debe consultar el historial académico completo (múltiples ciclos), ingresando el expediente, para visualizar todas las etapas del alumno, incluidos egresados. | Usuario |

### Módulo 13 — Configuración de Sistema

| ID | Descripción | Tipo |
|---|---|---|
| RF-90 | El administrador debe modificar los umbrales de morosidad, ingresando la cantidad de días o meses para alertas y bajas, para flexibilizar la política de cobranza de la institución. | Usuario |
| RF-91 | El administrador debe modificar los días de anticipación para las notificaciones SMTP, ingresando los nuevos umbrales numéricos, para personalizar el calendario de avisos. | Usuario |

### Módulo 14 — Notificaciones Automatizadas

| ID | Descripción | Tipo |
|---|---|---|
| RF-92 | El sistema debe ejecutar un proceso de verificación diario, consultando la base de datos de pagos pendientes, para identificar aquellos próximos a vencer. | Sistema |
| RF-93 | El sistema debe enviar un recordatorio por correo electrónico (SMTP), identificando los pagos que coincidan con el primer umbral configurado (por defecto 5 días previos), para alertar preventivamente al padre/tutor. | Sistema |
| RF-94 | El sistema debe enviar un recordatorio por correo electrónico (SMTP), identificando los pagos que coincidan con el segundo umbral configurado (por defecto 3 días previos), para alertar al padre/tutor. | Sistema |
| RF-95 | El sistema debe enviar un último aviso por correo electrónico (SMTP), identificando los pagos que coincidan con el tercer umbral configurado (por defecto 1 día previo), para requerir el pago inminente al padre/tutor. | Sistema |
| RF-96 | El sistema debe enviar un aviso por correo electrónico (SMTP), identificando los adeudos de inscripción o materiales que estén exactamente a 5 días de cumplir su plazo máximo de 60 días naturales, para requerir su liquidación. | Sistema |
| RF-97 | El sistema debe registrar internamente cada notificación enviada, vinculándola al adeudo correspondiente, para prevenir el envío de correos duplicados por error. | Sistema |

---

## 2. Requisitos No Funcionales

### Módulo 1 — Rendimiento
| ID | Descripción | Tipo |
|---|---|---|
| RNF-01 | El sistema debe completar la carga inicial de la aplicación y presentar la pantalla principal en un tiempo no mayor a 5 segundos, garantizando su viabilidad en equipos de escritorio con hardware básico (procesador de doble núcleo, 4 GB de RAM) y sin conexión a internet requerida. | Producto |
| RNF-02 | El sistema debe responder a cualquier acción del usuario (clic, búsqueda, filtro o navegación entre pantallas) en un tiempo máximo de 3 segundos, evitando percepciones de lentitud durante el uso cotidiano del sistema administrativo. | Producto |
| RNF-03 | El sistema debe generar y mostrar cualquier reporte (diario, mensual o por ciclo escolar) en un tiempo no mayor a 10 segundos cuando la base de datos contenga hasta 200 alumnos activos; en caso de superar ese tiempo, el sistema muestra un indicador de progreso al usuario. | Producto |

### Módulo 2 — Capacidad y Escalabilidad
| ID | Descripción | Tipo |
|---|---|---|
| RNF-04 | La arquitectura de la base de datos debe estar diseñada para soportar al menos 5,000 expedientes de alumnos y 50,000 registros de pagos, permitiendo el crecimiento sostenido de la institución a lo largo de múltiples ciclos escolares sin requerir cambios estructurales ni pérdida de rendimiento. | Producto |
| RNF-05 | El sistema debe soportar al menos 5 usuarios con sesiones activas de forma simultánea sin presentar errores, bloqueos ni pérdida de datos, considerando el número actual de personal administrativo del colegio. | Producto |

### Módulo 3 — Disponibilidad y Confiabilidad
| ID | Descripción | Tipo |
|---|---|---|
| RNF-06 | El sistema debe operar en su totalidad —carga de datos, registro de pagos, generación de reportes y gestión de expedientes— sin requerir ningún tipo de conexión a internet activa, garantizando su funcionamiento continuo independientemente de la conectividad del plantel. | Producto |
| RNF-07 | El sistema debe preservar la integridad de los archivos de datos ante un cierre abrupto de la aplicación o un corte de energía, asegurando que ningún registro de pago o expediente quede en estado corrupto o incompleto. | Producto |
| RNF-08 | El administrador debe poder generar un respaldo manual completo de la base de datos, exportando los archivos necesarios a una ruta local o dispositivo externo (USB), de forma que la información pueda restaurarse en caso de fallo del equipo. | Organizacional |
| RNF-09 | El sistema debe conservar de forma permanente los registros históricos de todos los ciclos escolares. Los alumnos egresados o dados de baja se desactivan, pero sus expedientes académicos y financieros no se eliminan, garantizando su disponibilidad para auditorías futuras. | Organizacional |
| RNF-10 | Los archivos de comprobantes de pago cargados (imágenes y PDF) deben almacenarse de forma persistente en el sistema, vinculados al expediente del alumno, sin depender de medios físicos externos como memorias USB. | Producto |
| RNF-11 | El sistema debe renombrar automáticamente cada archivo de comprobante subido por los usuarios, asignándole un identificador único universal (UUID) antes de almacenarlo en el disco del servidor, para evitar colisiones de nombres o sobreescrituras accidentales en la red local. | Producto |
| RNF-12 | El sistema debe procesar todas las operaciones financieras (registro de pagos, adeudos, generación de colegiaturas) utilizando transacciones atómicas (ACID) en la base de datos, para garantizar que no queden registros corruptos o incompletos en caso de interrupciones o fallos. | Producto |
| RNF-13 | El sistema debe generar los archivos de respaldo bajo demanda (.zip con pg_dump) de manera que puedan ser almacenados y sincronizados directamente por servicios de almacenamiento en la nube locales (ej. Google Drive o OneDrive), habilitando un esquema de respaldo híbrido. | Producto |

### Módulo 4 — Seguridad
| ID | Descripción | Tipo |
|---|---|---|
| RNF-14 | El sistema debe requerir usuario y contraseña para acceder a cualquier funcionalidad. Las contraseñas se almacenan cifradas mediante un algoritmo de hash seguro (bcrypt) y el sistema bloquea el acceso tras 5 intentos de inicio de sesión fallidos consecutivos, notificando al usuario administrador. | Producto |
| RNF-15 | El sistema debe garantizar que cada usuario solo pueda acceder a las funcionalidades correspondientes a su rol asignado, impidiendo técnicamente —no solo visualmente— que un usuario estándar realice acciones reservadas al administrador. | Producto |
| RNF-16 | El sistema debe proteger los datos personales y fiscales de los padres de familia (RFC, dirección, régimen fiscal, CURP) conforme a los principios de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), limitando su visualización únicamente a usuarios con nivel de acceso administrativo. | Externo |
| RNF-17 | El sistema debe registrar un log de auditoría de todas las operaciones críticas (registro de pagos, asignación o retiro de becas, baja de alumnos, modificación de permisos, modificación de los montos de pago), indicando fecha, hora y nombre del usuario que realizó la acción. Este log solo es visible para el usuario administrador. | Organizacional |
| RNF-18 | El sistema debe cerrar la sesión del usuario automáticamente, detectando 10 minutos de inactividad, para proteger la información en caso de abandono del equipo. | Producto |

### Módulo 5 — Usabilidad
| ID | Descripción | Tipo |
|---|---|---|
| RNF-19 | El sistema debe presentar una interfaz clara y sin saturación visual, utilizando íconos reconocibles, etiquetas descriptivas y flujos de navegación simples, de forma que personal administrativo con nivel básico de manejo tecnológico pueda operar el sistema sin requerir capacitación extensa. | Producto |
| RNF-20 | El sistema debe utilizar los colores institucionales del Colegio San Diego (azul marino RGB(5,14,119), rojo RGB(249,3,0) y blanco) y mostrar el escudo oficial en las pantallas principales, manteniendo coherencia con la imagen del plantel en toda la interfaz. | Producto |
| RNF-21 | El sistema debe mostrar mensajes claros de confirmación antes de ejecutar acciones irreversibles (eliminar, desactivar, borrar) y mensajes descriptivos de error cuando una operación no pueda completarse, indicando la causa y la acción sugerida al usuario. | Producto |
| RNF-22 | El sistema debe presentar las consultas y KPIs más frecuentes (Panel Principal con total de alumnos, ingresos del día, alumnos con beca, deudores y resumen de pagos del día) como accesos directos visibles desde la pantalla de inicio, de forma que el usuario acceda a cualquiera de ellas en no más de dos clics desde el inicio de sesión. | Producto |

### Módulo 6 — Portabilidad y Mantenibilidad
| ID | Descripción | Tipo |
|---|---|---|
| RNF-23 | El sistema debe poder instalarse en distintas computadoras de escritorio mediante un archivo ejecutable o copiando los archivos necesarios desde un dispositivo USB, sin requerir configuraciones avanzadas ni instalación de dependencias externas. Debe ser compatible con Windows 10 u 11. | Producto |
| RNF-24 | El sistema debe contar con documentación técnica suficiente (diagrama entidad-relación, diccionario de datos, descripción de módulos y guía de instalación) entregada junto con el sistema, que permita a un desarrollador externo realizar tareas de mantenimiento o ampliación sin necesidad de contactar al equipo original. | Organizacional |
| RNF-25 | El sistema debe operar bajo un modelo híbrido cliente-servidor LAN vía navegador: el Administrador utiliza una app de escritorio (Tauri) que actúa como servidor; el personal administrativo y docentes acceden al sistema a través de un navegador web estándar mediante la dirección IP del servidor en un puerto fijo, sin requerir internet. | Producto |
| RNF-26 | El sistema debe estar construido estrictamente sobre el stack tecnológico definido: frontend con React, TypeScript, Vite, CSS Modules, TanStack Query y React Router; backend empaquetado con Fastify, tRPC, Zod y Prisma ORM sobre PostgreSQL Portable; todo orquestado mediante Tauri (Rust) como contenedor de escritorio. | Producto |

### Módulo 7 — Exportación e Interoperabilidad
| ID | Descripción | Tipo |
|---|---|---|
| RNF-27 | El sistema debe permitir exportar cualquier reporte generado tanto en formato Excel (.xlsx, compatible con Microsoft Excel 2016 o posterior) como en PDF (compatible con Adobe Acrobat Reader), garantizando que el contenido sea idéntico en ambos formatos y que el PDF sea directamente imprimible. | Producto |
| RNF-28 | El sistema debe proporcionar una plantilla Excel estandarizada y una funcionalidad de carga masiva que valide la integridad de los datos (CURPs únicas, estructura de niveles, asociación Padre-Hijo) antes de la inserción, rechazando el archivo si detecta errores críticos para garantizar la consistencia en el 'Año Cero'. | Organizacional |
| RNF-29 | Todos los reportes tabulares y listados generados por el sistema, haciendo especial énfasis en el Directorio Fiscal y el Historial de Pagos, deben ser exportables nativamente en formatos estructurados estándar (.csv y .xlsx). Esta exportación debe preservar la integridad de las columnas (cabeceras y tipos de datos) para garantizar su compatibilidad directa e importación masiva en software contable de terceros (ej. CONTPAQi, Aspel COI) sin requerir transformaciones manuales previas por parte del usuario. | Producto |
