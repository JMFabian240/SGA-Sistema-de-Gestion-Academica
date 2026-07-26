# RF-68e: Almacenar comprobante offline en servidor LAN

| Campo | Descripción |
| :---- | ----- |
| **Autor** | José Manuel Fabian Hernández |
| **Nombre** | RF-68e: Almacenar comprobante offline en servidor LAN |
| **Actor** | Administrador y Gestor Administrativo (Sistema automático) |
| **Objetivo** | Guardar en el disco duro local del servidor LAN institucional los archivos digitales de comprobante de pago e imágenes de transferencia mediante un UUID para operar 100% offline sin servicios cloud. |
| **Flujo Principal** | 1. El actor adjunta un archivo PDF o imagen al registrar un pago en caja.<br>2. El sistema recibe el archivo, le asigna un identificador único (UUID) y lo guarda en el directorio local configurado vía `StorageAdapter`.<br>3. El sistema registra la ruta local en la base de datos.<br>4. Al consultar un comprobante posterior, el servidor lee el archivo local en disco y lo transforma en cadena Base64 para visualizarlo sin requerir internet. |
| **Flujo Alterno** | <b>A.</b> Archivo corrupto o no soportado:<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Si el archivo no es un PDF o imagen válida, el sistema rechaza la subida y pide un formato compatible. |
| **Precondiciones** | El servidor LAN debe contar con permisos de escritura en la carpeta local de almacenamiento. |
| **Postcondiciones** | El comprobante digital queda accesible localmente y asociado al registro de pago. |
| **Reglas de negocio involucradas** | • Evita colisiones de nombres de archivo mediante UUID.<br>• Garantiza soberanía de datos e independencia de conectividad exterior al colegio. |
