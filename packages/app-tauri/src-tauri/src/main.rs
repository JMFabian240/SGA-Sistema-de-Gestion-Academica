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

async fn startup_sequence(app_handle: tauri::AppHandle, splash_window: tauri::WebviewWindow, main_window: tauri::WebviewWindow) -> Result<(), String> {
    let path_resolver = app_handle.path();
    let app_data_dir = clean_path(&path_resolver.app_data_dir().map_err(|e| e.to_string())?);
    let db_dir = app_data_dir.join("pgdata");
    
    // FASE A — Inicializar PostgreSQL
    let pg_version_file = db_dir.join("PG_VERSION");
    if !pg_version_file.exists() {
        let _ = splash_window.emit("splash-state", "Inicializando base de datos...");
        if db_dir.exists() {
            let _ = std::fs::remove_dir_all(&db_dir);
        }
        std::fs::create_dir_all(&db_dir).map_err(|e| format!("Error al crear directorio db_dir: {}", e))?;
        
        let resource_dir = clean_path(&path_resolver.resource_dir().map_err(|e| e.to_string())?);
        let pgsql_dir = resource_dir.join("pgsql");
        let initdb_path = pgsql_dir.join("bin").join("initdb.exe");
        
        let output = std::process::Command::new(initdb_path)
            .args([
                "--pgdata",
                db_dir.to_str().ok_or("Ruta db_dir no es UTF8")?,
                "--username=sga",
                "--encoding=UTF8",
                "--auth=trust"
            ])
            .creation_flags(0x08000000)
            .stdin(std::process::Stdio::null())
            .output()
            .map_err(|e| format!("Fallo al ejecutar initdb.exe: {}", e))?;
            
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);
            return Err(format!("Fallo al inicializar clúster de BD.\nError: {}\nSalida: {}", stderr, stdout));
        }
    }

    // FASE B — Levantar PostgreSQL
    let _ = splash_window.emit("splash-state", "Iniciando motor de base de datos...");
    let resource_dir = clean_path(&app_handle.path().resource_dir().map_err(|e| e.to_string())?);
    let pgsql_dir = resource_dir.join("pgsql");
    let postgres_path = pgsql_dir.join("bin").join("postgres.exe");

    let db_child = std::process::Command::new(postgres_path)
        .args(["-D", db_dir.to_str().ok_or("Ruta db no es UTF8")?, "-p", "5433"])
        .creation_flags(0x08000000)
        .stdin(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("Fallo al ejecutar postgres.exe: {}", e))?;
        
    let db_pid = db_child.id();

    // Esperar hasta que PostgreSQL esté listo (timeout 30s)
    let mut db_ready = false;
    for _ in 0..60 { 
        if let Ok(_) = tokio::time::timeout(Duration::from_millis(100), tokio::net::TcpStream::connect("127.0.0.1:5433")).await {
            db_ready = true;
            break;
        }
        tokio::time::sleep(Duration::from_millis(400)).await;
    }

    if !db_ready {
        return Err("PostgreSQL no inició en 30 segundos o el puerto 5433 está bloqueado.".to_string());
    }

    // Verificar y crear base de datos "sga_db"
    let init_sql_path = app_handle.path().resource_dir().map_err(|e| e.to_string())?.join("pgsql").join("init_db.sql");
    tokio::task::spawn_blocking(move || -> Result<(), String> {
        let mut config = postgres::Config::new();
        config.user("sga");
        config.host("127.0.0.1");
        config.port(5433);
        config.dbname("postgres");
        config.connect_timeout(Duration::from_secs(5));
        
        let mut client_opt = None;
        for _ in 0..10 { // Reintentar por hasta ~10-15 segundos
            match config.connect(postgres::NoTls) {
                Ok(c) => {
                    client_opt = Some(c);
                    break;
                },
                Err(_) => {
                    std::thread::sleep(Duration::from_millis(1000));
                }
            }
        }
        
        let mut client = client_opt.ok_or("No se pudo conectar a PostgreSQL (timeout): error communicating with the server")?;
            
        let rows = client.query("SELECT datname FROM pg_database WHERE datname = 'sga_db'", &[])
            .map_err(|e| format!("Error consultando pg_database: {}", e))?;
            
        if rows.is_empty() {
            client.execute("CREATE DATABASE sga_db OWNER sga", &[])
                .map_err(|e| format!("Error al crear base de datos sga_db: {}", e))?;
                
            let mut db_config = config.clone();
            db_config.dbname("sga_db");
            let mut sga_client = db_config.connect(postgres::NoTls)
                .map_err(|e| format!("Error al conectar a sga_db para migraciones: {}", e))?;
                
            if init_sql_path.exists() {
                let init_sql = std::fs::read_to_string(&init_sql_path)
                    .map_err(|e| format!("Error leyendo init_db.sql: {}", e))?;
                if !init_sql.trim().is_empty() {
                    sga_client.batch_execute(&init_sql)
                        .map_err(|e| format!("Error ejecutando init_db.sql: {}", e))?;
                }
            }
        }
        Ok(())
    }).await.map_err(|e| format!("Error en hilo de postgres: {}", e))??;

    // FASE C y D — Levantar Backend
    let _ = splash_window.emit("splash-state", "Aplicando actualizaciones e iniciando servicios...");
    let sidecar = app_handle.shell().sidecar("sga-back")
        .map_err(|e| format!("Error al crear sidecar sga-back: {}", e))?;
        
    let resource_dir = clean_path(&app_handle.path().resource_dir().map_err(|e| e.to_string())?);
    let engine_path = resource_dir.join("binaries").join("query_engine-windows.dll.node");
    
    let (_, back_child) = sidecar
        .envs(vec![
            ("DATABASE_URL".to_string(), "postgresql://sga@localhost:5433/sga_db".to_string()),
            ("TRPC_PORT".to_string(), "3000".to_string()),
            ("NODE_ENV".to_string(), "production".to_string()),
            ("PRISMA_QUERY_ENGINE_LIBRARY".to_string(), engine_path.to_string_lossy().to_string()),
            ("PRISMA_CLI_QUERY_ENGINE_TYPE".to_string(), "library".to_string())
        ])
        .spawn()
        .map_err(|e| format!("Error al ejecutar backend sga-back: {}", e))?;
        
    let back_pid = back_child.pid();

    app_handle.manage(Arc::new(Mutex::new(AppState {
        db_process: Some(db_pid),
        back_process: Some(back_pid),
    })));

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|e| e.to_string())?;
        
    let mut back_ready = false;
    for _ in 0..120 { // 60 segundos de timeout
        if let Ok(resp) = client.get("http://localhost:3000/health").send().await {
            if resp.status().is_success() {
                back_ready = true;
                break;
            }
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    if !back_ready {
        return Err("El backend no respondió en 60 segundos o falló al iniciar.".to_string());
    }

    // FASE E — Abrir la ventana
    let _ = splash_window.emit("splash-state", "Cargando aplicación...");
    tokio::time::sleep(Duration::from_millis(500)).await;
    
    splash_window.close().map_err(|e| e.to_string())?;
    main_window.show().map_err(|e| e.to_string())?;

    Ok(())
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
                if let Err(e) = startup_sequence(app_handle.clone(), splash_window, main_window).await {
                    use tauri_plugin_dialog::DialogExt;
                    app_handle.dialog()
                        .message(&e)
                        .title("Error Crítico")
                        .kind(tauri_plugin_dialog::MessageDialogKind::Error)
                        .show(move |_| {
                            app_handle.exit(1);
                        });
                }
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
