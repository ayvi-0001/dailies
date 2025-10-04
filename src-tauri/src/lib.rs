use sqlx::{Pool, Postgres, postgres::PgPoolOptions};
use tauri::Manager;
use tokio::sync::Mutex;

pub(crate) mod macros;
crate::mod_flat!(messages, routines, state);

lazy_static::lazy_static! {
    // TODO(ayvi): decide how db credentials will be passed to application
    // http://ayvi:3000/ayvi/dailies/issues/20
    // This is a temporary solution for development only.
    pub static ref CONN_STRING: String = {
        let path_to_askconn: String = std::env::var("DAILIES_ASKCONN")
            .expect("Env var DAILIES_ASKCONN should be set.");
        let mut command = std::process::Command::new("bash");
        let stdout = command.arg(path_to_askconn).output().unwrap().stdout;
        String::from_utf8_lossy(&stdout).into_owned()
    };
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let connection_pool: Pool<Postgres> = PgPoolOptions::new()
        .max_connections(20)
        .connect(&CONN_STRING)
        .await
        .unwrap();

    println!("Connection pool opts: {:?}", connection_pool.options());

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            };
            app.manage(Mutex::new(state::AppState { connection_pool }));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            routines::get_routines,
            routines::handle_value_change,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
