use std::path::PathBuf;

use tauri::Manager;
use tokio::sync::Mutex;

pub(crate) mod macros;
crate::mod_flat!(dailies, state, db, errors);

lazy_static::lazy_static! {
    pub static ref JWT_SECRET: String = std::env::var("JWT_SECRET")
        .expect("Env var `JWT_SECRET` should be set.");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();

    #[cfg(test)]
    {
        builder = builder.plugin(tauri_plugin_devtools::init());
    }

    builder
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .setup(move |app: &mut tauri::App| {
            state::APP_HANDLE
                .set(app.app_handle().to_owned())
                .unwrap();

            let app_dir: PathBuf = app
                .path()
                .app_data_dir()
                .expect("failed to get app dir");

            std::fs::create_dir_all(&app_dir).expect("failed to ensure app dir");

            let window: tauri::WebviewWindow = app.get_webview_window("main").unwrap();

            #[cfg(desktop)]
            window.center()?;

            #[cfg(debug_assertions)]
            {
                window.open_devtools();
                window.close_devtools();
            }

            tauri::async_runtime::block_on(async {
                let database = db::Database::new(app_dir.clone())
                    .await
                    .expect("failed to initialize database");

                app.manage(Mutex::new(state::AppState::new(
                    database,
                    JWT_SECRET.to_string(),
                )));
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            dailies::get_total_points,
            dailies::handle_point_change,
            dailies::query_dailies,
            dailies::update_daily,
            db::create_user,
            db::delete_session,
            db::get_session,
            db::get_user,
            db::save_session,
            db::truncate_sessions,
            db::verify_user,
            state::get_jwt_secret,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
