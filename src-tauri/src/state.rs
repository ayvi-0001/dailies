use std::sync::OnceLock;

use tokio::sync::{Mutex, MutexGuard};

use crate::db::Database;

pub static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

pub struct AppState {
    pub db: Database,
    pub jwt_secret: String,
}

impl AppState {
    pub fn new(db: Database, jwt_secret: String) -> Self {
        AppState { db, jwt_secret }
    }
}

pub fn app_handle<'a>() -> Option<&'a tauri::AppHandle> {
    APP_HANDLE.get()
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_jwt_secret<'a>(
    state: tauri::State<'a, Mutex<AppState>>,
) -> Result<String, crate::AppError> {
    let state: MutexGuard<'_, AppState> = state.lock().await;
    Ok(state.jwt_secret.to_owned())
}
