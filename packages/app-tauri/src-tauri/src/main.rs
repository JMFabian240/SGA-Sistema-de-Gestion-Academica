#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{Manager, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use postgres::{Client, NoTls};
use std::os::windows::process::CommandExt;

fn clean_path(path: &std::path::Path) -> std::path::PathBuf {
    std::path::PathBuf::from(path.to_str().unwrap().trim_start_matches(r"\\?\"))
}

struct AppState {
    db_process: Option<u32>,
    back_process: Option<u32>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Directorios
            let path_resolver = app.path();
            let app_data_dir = clean_path(&path_resolver.app_data_dir().unwrap());
            let db_dir = app_data_dir.join("pgdata");
            let logs_dir = app_data_dir.join("logs");

            if !logs_dir.exists() {
                std::fs::create_dir_all(&logs_dir).unwrap();
            }

            // Crear ventana splash
            let splash_window = tauri::WebviewWindowBuilder::new(
                app,
                "splash",
                tauri::WebviewUrl::App("splashscreen.html".into())
            )
            .title("SGA - Iniciando")
            .inner_size(400.0, 300.0)
            .center()
            .decorations(false)
            .build()
            .unwrap();

            let main_window = app.get_webview_window("main").unwrap();
            main_window.hide().unwrap();
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let show_error_and_exit = {
                    let app_handle_clone = app_handle.clone();
                    move |msg: &str| {
                        use tauri_plugin_dialog::DialogExt;
                        app_handle_clone.dialog()
                            .message(msg)
                            .title("Error Crítico")
                            .kind(tauri_plugin_dialog::MessageDialogKind::Error)
                            .blocking_show();
                        std::process::exit(1);
                    }
                };

                // FASE A — Inicializar PostgreSQL
                let pg_version_file = db_dir.join("PG_VERSION");
                if !pg_version_file.exists() {
                    let _ = splash_window.emit("splash-state", "Inicializando base de datos...");
                    // Si el directorio existe pero no tiene PG_VERSION, lo borramos para asegurar que initdb no falle por "directorio no vacío"
                    if db_dir.exists() {
                        let _ = std::fs::remove_dir_all(&db_dir);
                    }
                    if let Err(e) = std::fs::create_dir_all(&db_dir) {
                        show_error_and_exit(&format!("Error al crear directorio db_dir: {}", e));
                    }
                    
                    let pgsql_dir = clean_path(&app_handle.path().resource_dir().unwrap()).join("pgsql");
                    let initdb_path = pgsql_dir.join("bin").join("initdb.exe");
                    
                    let output = std::process::Command::new(initdb_path)
                        .args([
                            "--pgdata",
                            db_dir.to_str().unwrap(),
                            "--username=sga",
                            "--encoding=UTF8",
                            "--auth=trust"
                        ])
                        .creation_flags(0x08000000)
                        .output();
                        
                    let output = match output {
                        Ok(o) => o,
                        Err(e) => {
                            show_error_and_exit(&format!("Fallo al ejecutar initdb.exe: {}", e));
                            return;
                        }
                    };
                    
                    if !output.status.success() {
                        let stderr = String::from_utf8_lossy(&output.stderr);
                        let stdout = String::from_utf8_lossy(&output.stdout);
                        let error_msg = format!("Fallo al inicializar el clúster de base de datos.\nError: {}\nSalida: {}", stderr, stdout);
                        show_error_and_exit(&error_msg);
                    }
                }

                // FASE B — Levantar PostgreSQL
                let _ = splash_window.emit("splash-state", "Iniciando motor de base de datos...");
                
                let pgsql_dir = clean_path(&app_handle.path().resource_dir().unwrap()).join("pgsql");
                let postgres_path = pgsql_dir.join("bin").join("postgres.exe");

                let db_child = std::process::Command::new(postgres_path)
                    .args([
                        "-D",
                        db_dir.to_str().unwrap(),
                        "-p",
                        "5433"
                    ])
                    .creation_flags(0x08000000)
                    .spawn();
                    
                let db_child = match db_child {
                    Ok(c) => c,
                    Err(e) => {
                        show_error_and_exit(&format!("Fallo al ejecutar postgres.exe: {}", e));
                        return;
                    }
                };
                
                let db_pid = db_child.id();

                // Esperar hasta que PostgreSQL esté listo (timeout 30s)
                let mut db_ready = false;
                for _ in 0..60 { 
                    if std::net::TcpStream::connect("127.0.0.1:5433").is_ok() {
                        db_ready = true;
                        break;
                    }
                    tokio::time::sleep(Duration::from_millis(500)).await;
                }

                if !db_ready {
                    show_error_and_exit("PostgreSQL no inició en 30 segundos o el puerto 5433 está ocupado.");
                }

                // Verificar y crear base de datos "sga_db"
                match Client::connect("postgresql://sga@localhost:5433/postgres", NoTls) {
                    Ok(mut client) => {
                        match client.query("SELECT datname FROM pg_database WHERE datname = 'sga_db'", &[]) {
                            Ok(rows) => {
                                if rows.is_empty() {
                                    if let Err(e) = client.execute("CREATE DATABASE sga_db OWNER sga", &[]) {
                                        show_error_and_exit(&format!("Error al crear base de datos sga_db: {}", e));
                                    }
                                }
                            },
                            Err(e) => show_error_and_exit(&format!("Error consultando pg_database: {}", e))
                        }
                    },
                    Err(_) => {
                        show_error_and_exit("No se pudo conectar a PostgreSQL para verificar sga_db.");
                    }
                }

                // FASE C y D — Levantar Backend (las migraciones se ejecutan automáticamente en start del backend)
                let _ = splash_window.emit("splash-state", "Aplicando actualizaciones e iniciando servicios...");
                
                let sidecar = app_handle.shell().sidecar("sga-back");
                let sidecar = match sidecar {
                    Ok(s) => s,
                    Err(e) => {
                        show_error_and_exit(&format!("Error al crear sidecar sga-back: {}", e));
                        return;
                    }
                };
                
                let back_spawn = sidecar
                    .envs(vec![
                        ("DATABASE_URL".to_string(), "postgresql://sga@localhost:5433/sga_db".to_string()),
                        ("TRPC_PORT".to_string(), "3000".to_string()),
                        ("NODE_ENV".to_string(), "production".to_string()),
                        ("RUN_MIGRATIONS".to_string(), "true".to_string())
                    ])
                    .spawn();
                    
                let (_, back_child) = match back_spawn {
                    Ok(b) => b,
                    Err(e) => {
                        show_error_and_exit(&format!("Error al ejecutar backend sga-back: {}", e));
                        return;
                    }
                };
                
                let back_pid = back_child.pid();

                // Guardar PIDs
                app_handle.manage(Arc::new(Mutex::new(AppState {
                    db_process: Some(db_pid),
                    back_process: Some(back_pid),
                })));

                let client = reqwest::Client::builder()
                    .timeout(Duration::from_secs(2))
                    .build()
                    .unwrap();
                    
                // Esperar a que el backend esté listo (GET /health) (timeout 15s)
                let mut back_ready = false;
                for _ in 0..30 { // 15 segundos
                    if let Ok(resp) = client.get("http://localhost:3000/health").send().await {
                        if resp.status().is_success() {
                            back_ready = true;
                            break;
                        }
                    }
                    tokio::time::sleep(Duration::from_millis(500)).await;
                }

                if !back_ready {
                    show_error_and_exit("El backend no respondió en 15 segundos o el puerto 3000 está ocupado.");
                }

                // FASE E — Abrir la ventana
                let _ = splash_window.emit("splash-state", "Cargando aplicación...");
                tokio::time::sleep(Duration::from_millis(500)).await; // Pequeña pausa para fluidez
                
                splash_window.close().unwrap();
                main_window.show().unwrap();
            });

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::Destroyed => {
                if window.label() == "main" {
                    // FASE F — Apagado seguro al cerrar la app principal
                    let state: tauri::State<Arc<Mutex<AppState>>> = window.state();
                    let mut state = state.lock().unwrap();

                    if let Some(back_pid) = state.back_process.take() {
                        let _ = std::process::Command::new("taskkill")
                            .args(["/F", "/PID", &back_pid.to_string()])
                            .status();
                    }

                    if let Some(_db_pid) = state.db_process.take() {
                        let path_resolver = window.app_handle().path();
                        let app_data_dir = clean_path(&path_resolver.app_data_dir().unwrap());
                        let db_dir = app_data_dir.join("pgdata");
                        let resource_dir = clean_path(&path_resolver.resource_dir().unwrap());
                        let pgsql_dir = resource_dir.join("pgsql");
                        let pg_ctl_path = pgsql_dir.join("bin").join("pg_ctl.exe");
                        
                        let _ = std::process::Command::new(pg_ctl_path)
                            .args(["stop", "-D", db_dir.to_str().unwrap(), "-m", "fast"])
                            .creation_flags(0x08000000)
                            .spawn();
                    }
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
