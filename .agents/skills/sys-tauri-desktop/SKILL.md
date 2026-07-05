---
name: sys-tauri-desktop
description: Reglas y patrones para desarrollar en el paquete @sga/app-tauri. Activar al modificar la lógica de orquestación de escritorio en Rust.
---

# App-Tauri Skill (@sga/app-tauri)

Guía para la configuración del orquestador y la ventana del contenedor.

## Tecnologías Principales

- **Tauri v2** y **Rust**.
- **WebView2** (en Windows) para renderizar `@sga/front-end`.

## Convenciones y Orquestación de Sidecars

- Todos los binarios externos (`initdb`, `postgres`, `pg_ctl`, `back`) deben colocarse en `src-tauri/binaries/` con el sufijo de plataforma correcto.
- Deben declararse en el `tauri.conf.json` en `tauri.bundle.externalBin`.
- Usa el API de `Command::new_sidecar` proporcionado por Tauri para arrancar procesos, en vez del genérico `std::process::Command` (excepto en casos específicos donde TauriCommand falle para limpieza, como `taskkill`).

### Orden Correcto de Arranque

1. (Opcional, en primer arranque) Inicializar el clúster de datos en AppData usando `initdb`.
2. Iniciar la base de datos PostgreSQL (`postgres` sidecar).
3. Iniciar el Backend (`back` sidecar), que se conectará a la BD local.
4. Renderizar la ventana (ocurre automáticamente al terminar el `setup`).

### Apagado Seguro

Es crítico interceptar el cerrado de la ventana (`tauri::WindowEvent::Destroyed` o similar) para apagar la base de datos limpiamente (con `pg_ctl stop -m fast`) y matar el backend.

## Reglas y Prohibiciones

- **PROHIBIDO**: Incluir lógica de negocio o interactuar con la base de datos directamente desde Rust. Tauri es SOLO un orquestador.
- **PROHIBIDO**: Importar lógica de back-end o data-access en el contenedor Rust.

## Ejemplo Mínimo de Configuración de Sidecar

**Fragmento de `main.rs` en el `setup`**

```rust
use tauri::api::process::Command as TauriCommand;

tauri::Builder::default()
    .setup(|app| {
        // ... Lógica para inicializar y levantar base de datos ...

        // Levantar el Sidecar del Backend
        println!("Levantando Backend Fastify...");
        let (_rx, back_child) = TauriCommand::new_sidecar("back")
            .expect("Failed to create back command")
            .envs(vec![
                ("DATABASE_URL".to_string(), "postgresql://sga:sga@localhost:5433/sga_db".to_string()),
                ("TRPC_PORT".to_string(), "3000".to_string())
            ].into_iter().collect())
            .spawn()
            .expect("Failed to spawn backend");
        
        let back_pid = back_child.pid();
        
        // Almacenar PIDs en el State para matar procesos al cerrar...

        Ok(())
    })
```
