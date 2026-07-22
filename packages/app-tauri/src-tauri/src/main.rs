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
            let app_data_dir = path_resolver.app_data_dir().unwrap();
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
                    std::fs::create_dir_all(&db_dir).unwrap();
                    
                    let (mut rx, _) = app_handle
                        .shell()
                        .sidecar("initdb")
                        .expect("Failed to create initdb sidecar")
                        .args([
                            "--pgdata",
                            db_dir.to_str().unwrap(),
                            "--username=sga",
                            "--encoding=UTF8",
                            "--locale=es_MX.UTF-8"
                        ])
                        .spawn()
                        .expect("Failed to spawn initdb");
                    
                    let mut success = false;
                    while let Some(event) = rx.recv().await {
                        if let CommandEvent::Terminated(payload) = event {
                            if payload.code.unwrap_or(1) == 0 {
                                success = true;
                            }
                        }
                    }
                    if !success {
                        show_error_and_exit("Fallo al inicializar el clúster de base de datos.");
                    }
                }

                // FASE B — Levantar PostgreSQL
                let _ = splash_window.emit("splash-state", "Iniciando motor de base de datos...");
                
                let (_, db_child) = app_handle
                    .shell()
                    .sidecar("postgres")
                    .expect("Failed to create postgres command")
                    .args([
                        "-D",
                        db_dir.to_str().unwrap(),
                        "-p",
                        "5433"
                    ])
                    .spawn()
                    .expect("Failed to spawn postgres");
                
                let db_pid = db_child.pid();

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
                        let rows = client.query("SELECT datname FROM pg_database WHERE datname = 'sga_db'", &[]).unwrap();
                        if rows.is_empty() {
                            let _ = client.execute("CREATE DATABASE sga_db OWNER sga", &[]);
                        }
                    },
                    Err(_) => {
                        show_error_and_exit("No se pudo conectar a PostgreSQL para verificar sga_db.");
                    }
                }

                // FASE C y D — Levantar Backend (las migraciones se ejecutan automáticamente en start del backend)
                let _ = splash_window.emit("splash-state", "Aplicando actualizaciones e iniciando servicios...");
                
                let (_, back_child) = app_handle
                    .shell()
                    .sidecar("sga-back")
                    .expect("Failed to create sga-back sidecar")
                    .envs(vec![
                        ("DATABASE_URL".to_string(), "postgresql://sga@localhost:5433/sga_db".to_string()),
                        ("TRPC_PORT".to_string(), "3000".to_string()),
                        ("NODE_ENV".to_string(), "production".to_string()),
                        ("RUN_MIGRATIONS".to_string(), "true".to_string())
                    ])
                    .spawn()
                    .expect("Failed to spawn backend");
                
                let back_pid = back_child.pid();

                // Guardar PIDs
                app_handle.manage(Arc::new(Mutex::new(AppState {
                    db_process: Some(db_pid),
                    back_process: Some(back_pid),
                })));

                // Esperar a que el backend esté listo (GET /health) (timeout 15s)
                let mut back_ready = false;
                for _ in 0..30 { // 15 segundos
                    if let Ok(resp) = reqwest::get("http://localhost:3000/health").await {
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

                    if let Some(db_pid) = state.db_process.take() {
                        let path_resolver = window.app_handle().path();
                        let db_dir = path_resolver.app_data_dir().unwrap().join("pgdata");
                        
                        let _ = window.app_handle()
                            .shell()
                            .sidecar("pg_ctl")
                            .expect("Failed to create pg_ctl command")
                            .args(["stop", "-D", db_dir.to_str().unwrap(), "-m", "fast"])
                            .spawn();
                    }
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
