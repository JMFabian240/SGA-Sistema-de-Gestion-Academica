# Estrategia de Despliegue y Modelo de Negocio para el SGA

Este documento sintetiza las estrategias arquitectónicas, técnicas y comerciales discutidas para llevar el Sistema de Gestión Académica (SGA) del entorno local (desarrollo/escolar) a un entorno de producción real, protegiendo tanto el trabajo del equipo de desarrollo (propiedad intelectual) como los intereses del cliente.

---

## 1. Modelos de Despliegue: ¿Dónde vivirá el SGA?

### 1.1 Modelo SaaS (Software como Servicio) - **El Camino Óptimo** 🌟
Ustedes asumen el control total de la infraestructura en la nube y el cliente paga una **suscripción mensual/anual** por acceder al sistema.

*   **¿Cómo se hace a bajo costo (ideal para estudiantes)?**
    *   **Frontend (React/Vite):** Desplegado en [Vercel](https://vercel.com/) (Gratis).
    *   **Backend (Node.js):** Desplegado en [Render](https://render.com/) o [Railway](https://railway.app/) (Gratis/Muy barato).
    *   **Base de Datos (PostgreSQL):** Alojada en [Supabase](https://supabase.com/) o [Neon](https://neon.tech/) (Capa gratuita generosa).
*   **Ventajas para el desarrollador:** Ustedes tienen el control absoluto. El cliente nunca toca el código fuente. Genera ingresos recurrentes y garantiza que si hay un problema, el cliente dependa técnica y económicamente de ustedes.
*   **Ventajas para el cliente:** No necesitan departamento de TI, ni comprar servidores caros. Solo inician sesión en la web.

### 1.2 Modelo "On-Premise" en Nube Privada (Para clientes que exigen confidencialidad)
El cliente quiere que el sistema viva en servidores que ellos paguen directamente (para sentir que los datos son 100% suyos).

*   **El Enfoque Correcto:** El cliente abre cuentas en servicios de nube (AWS, DigitalOcean, Vercel) y pone su tarjeta de crédito. Los invita a ustedes como "Colaboradores Técnicos".
*   **Despliegue con Docker:** Para evitar entregar el código fuente crudo (carpetas y archivos que otros programadores puedan robar o editar), empaquetan el SGA usando **Docker**. Instalan "imágenes" compiladas en los servidores del cliente. Funciona perfecto, pero el código está ofuscado.
*   **Modelo de cobro:** Se cobra una cuota alta inicial por la instalación, y se debe vender una **Póliza de Mantenimiento** (mensual/anual) para soporte.

### 1.3 Ejecutables Locales (.exe) o Servidores Físicos en la Escuela - **Lo que NO debemos hacer** 🚫
Consiste en instalar el sistema directamente en la computadora de la recepcionista o en un servidor viejo en el cuarto de intendencia.

*   **¿Por qué es poco práctico y peligroso?**
    *   Pierdes todo el control. El cliente "secuestra" físicamente el sistema.
    *   Si se va la luz, se daña el disco duro o entra un virus, perderán toda la base de datos de la escuela, y **los culparán a ustedes**.
    *   Si hay un *bug*, tendrás que ir físicamente a la escuela con una USB para actualizar el software.
    *   Solo se justifica si la escuela está en una zona rural sin acceso a Internet.

---

## 2. Recomendaciones Comerciales y Legales ⚖️

Como estudiantes haciendo la transición a profesionales/agencia, la parte legal es tan importante como el código. Si van a regalar o cobrar muy poco por la primera versión del sistema para ganar experiencia, asegúrense de no perder los derechos de su trabajo.

### 2.1 La Licencia (No vendas tu Copyright)
Nunca firmen un contrato que diga "Desarrollo de Software a la Medida con cesión de derechos". 
*   Ustedes deben vender una **Licencia de Uso Exclusivo/No Exclusivo**.
*   Esto significa: *"El SGA es propiedad intelectual de nosotros (los desarrolladores). Les otorgamos al Colegio X el permiso para usarlo perpetuamente en sus instalaciones, pero el Colegio X no puede venderle copias a otros colegios ni modificar el código base."*

### 2.2 El Contrato de Soporte (SLA - Service Level Agreement)
El contrato inicial debe tener un límite claro. Una vez entregado el sistema funcionando, cualquier cosa fuera del acuerdo es trabajo nuevo.
*   **Límites claros:** *"La entrega incluye el sistema X con funciones Y. Si el proveedor de nube se cae, no es culpa del software."*
*   **Ofrece una póliza de Mantenimiento:** *"El sistema requiere actualizaciones de seguridad, respaldos de base de datos mensuales y monitoreo. Esta póliza cuesta $X al mes. Si deciden no contratarla, cualquier corrección o visita técnica futura se cobrará por hora a tarifa de consultoría independiente."*

### 2.3 Asesoría Legal (Básica pero necesaria)
1.  **Protege tu marca/código:** Si el SGA tiene un nombre comercial, consideren registrarlo (IMPI en México, etc.). 
2.  **Busquen plantillas profesionales:** No redacten contratos desde cero. Busquen plantillas de "Contrato de Prestación de Servicios de Software como Servicio (SaaS)" y adáptenlas, o idealmente, paguen una hora de consulta con un abogado especializado en tecnología o derechos de autor para que valide su documento base.
3.  **Cláusula de Confidencialidad (NDA):** Firmen un acuerdo de confidencialidad donde ustedes se comprometen a no divulgar los datos financieros y personales de los alumnos de la escuela. Esto le dará muchísima paz mental al cliente, justificando por qué ustedes alojan los servidores de manera segura.

---

## 3. Resumen del "Camino Óptimo" para el Equipo

1.  Acepten el proyecto (aunque paguen poco) para usarlo como **Caso de Éxito**. Un sistema real funcionando en una escuela vale muchísimo para su currículum y para conseguir a su siguiente cliente (al que sí le cobrarán completo).
2.  Desplieguen en la nube bajo **sus propias cuentas** usando Vercel + Supabase + Render. No gastarán dinero usando los Free Tiers.
3.  Fijen reglas claras en un contrato sencillo: *"Nosotros somos dueños del código, ustedes tienen derecho a usarlo. Si necesitan nuevas funciones, se cotizarán por separado."*
4.  Si la escuela quiere acceso absoluto a la BD por privacidad, instalen el SGA en la nube de la escuela usando Docker, pero amarren su trabajo a una póliza de mantenimiento recurrente.
