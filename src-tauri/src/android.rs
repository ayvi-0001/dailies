#![cfg(target_os = "android")]

use futures::TryFutureExt;
use tauri::{Emitter, Wry};
use tauri_plugin_android_fs::{AndroidFsExt, PublicGeneralPurposeDir, Result, api::api_async::AndroidFs};
use tokio::sync::{Mutex, MutexGuard};

use crate::{errors::ErrorMessage, state};

#[tauri::command(async, rename_all = "snake_case")]
pub async fn export_db(
    app: tauri::AppHandle<Wry>,
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
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
            ATTACH DATABASE '{0}' AS "export_db";
            CREATE TABLE "export_db".quests AS SELECT * FROM quests WHERE user_id = {1};
            CREATE TABLE "export_db".points AS SELECT * FROM points WHERE quest_id IN ( SELECT id FROM "export_db".quests WHERE user_id = {1});
            DETACH DATABASE "export_db";
        "#,
        &format!("/storage/emulated/0/Download/{relative_path}/dailies.db"),
        user_id,
    ))
    .execute(&state.db.pool)
    .map_err(|e| crate::errors::emit_app_error(&app, "tauri://error", &e))
    .await;

    Ok(())
}

// TODO(ayvi): fix permission issues with imported db http://ayvi:3000/ayvi/dailies/issues/128
#[tauri::command(async, rename_all = "snake_case")]
pub async fn import_db(
    app: tauri::AppHandle<Wry>,
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
) -> Result<()> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let api: &AndroidFs<Wry> = app.android_fs_async();

    let relative_path: &str = "Dailies/import";

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
            ATTACH DATABASE '{0}' AS "import_db";
            INSERT OR IGNORE INTO "quests" SELECT * FROM "import_db".quests WHERE user_id = {1};
            INSERT OR IGNORE INTO "points" SELECT * FROM "import_db".points WHERE quest_id IN ( SELECT id FROM "import_db".quests WHERE user_id = {1});
            DETACH DATABASE "import_db";
        "#,
        &format!("/storage/emulated/0/Download/{relative_path}/dailies.db"),
        user_id,
    ))
    .execute(&state.db.pool)
    .map_err(|e| app.emit("tauri://error", ErrorMessage::new(&e.to_string())))
    .await;

    Ok(())
}
