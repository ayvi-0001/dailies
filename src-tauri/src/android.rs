#![cfg(target_os = "android")]

use futures::TryFutureExt;
use tauri::{Emitter, Wry};
use tauri_plugin_android_fs::{AndroidFsExt, PublicGeneralPurposeDir, Result, api::api_async::AndroidFs};
use tokio::sync::{Mutex, MutexGuard};

use crate::{errors::ErrorMessage, state};

#[allow(unused_must_use)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn export_db(
    app: tauri::AppHandle<Wry>,
    state: tauri::State<'_, Mutex<state::AppState>>,
) -> Result<()> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let api: &AndroidFs<Wry> = app.android_fs_async();

    let relative_path: &str = "Dailies/export";

    if let Err(e) = api
        .public_storage()
        .create_dir_all(None, PublicGeneralPurposeDir::Download, relative_path)
        .await
    {
        app.emit("tauri://error", ErrorMessage::new(&e.to_string()));
        return Err(e);
    };

    sqlx::query(&format!(
        r#"
            ATTACH DATABASE '{}' AS "export_db";
            CREATE TABLE "export_db.quests" AS SELECT * FROM quests;
            CREATE TABLE "export_db.points" AS SELECT * FROM points;
            DETACH DATABASE "export_db";
        "#,
        &format!("/storage/emulated/0/Download/{relative_path}/dailies.db")
    ))
    .execute(&state.db.pool)
    .map_err(|e| crate::errors::emit_app_error(&app, "tauri://error", &e))
    .await;

    Ok(())
}

#[allow(unused_must_use)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn import_db() {
    todo!() // TODO(ayvi): import db fn http://ayvi:3000/ayvi/dailies/issues/128
}
