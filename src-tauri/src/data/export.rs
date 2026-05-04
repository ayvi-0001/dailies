use anyhow::Result;
use chrono::Local;
use serde::Serialize;
use sqlx::{Acquire, Sqlite, SqliteConnection, pool::PoolConnection};
use tauri::{Manager, Wry};
use tokio::sync::{Mutex, MutexGuard};

use crate::{dailies::{point::Point, quest::{Quest, QuestChain}}, data::structs::UserExportData, db::user::User, state};

#[derive(Debug, Default, Serialize)]
pub struct UserExportDataSummary {
    pub app_version: String,
    pub quest_chains: usize,
    pub quests: usize,
    pub points: usize,
    pub output_path: String,
}

pub async fn fetch_user_export_data(
    app_handle: &tauri::AppHandle<Wry>,
    user: &User,
) -> Result<UserExportData, crate::errors::Error> {
    let state = app_handle.state::<Mutex<state::AppState>>();
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let quest_chains: Vec<QuestChain> = sqlx::query_as(
        r#"
            SELECT *
            FROM
                "quest_chains"
            WHERE
                user_id IN ($1)
            ORDER BY
                sequence;
        "#,
    )
    .bind(user.id)
    .fetch_all(&mut *conn)
    .await?;

    let quests: Vec<Quest> = sqlx::query_as(
        r#"
            SELECT q.*
            FROM
                "quests" AS q
            LEFT JOIN
                "quest_chains" AS qc
            ON
                qc.chain = q.chain
            WHERE
                q.user_id IN ($1)
            ORDER BY
                qc.sequence,
                q.sequence;
        "#,
    )
    .bind(user.id)
    .fetch_all(&mut *conn)
    .await?;

    let points: Vec<Point> = sqlx::query_as(
        r#"
            SELECT p.*
            FROM
                "points" AS p
            INNER JOIN
                "quests" AS q
            ON
                q.id = p.quest_id
            WHERE
                q.user_id IN ($1)
            ORDER BY
                p.date DESC,
                q.sequence;
        "#,
    )
    .bind(user.id)
    .fetch_all(&mut *conn)
    .await?;

    let app_version = app_handle.package_info().version.to_string();

    let sqlite_user_version: i64 = sqlx::query_scalar!("PRAGMA user_version;")
        .fetch_one(&mut *conn)
        .await?
        .unwrap_or(0_i64);

    Ok(UserExportData {
        app_version,
        sqlite_user_version,
        user: user.clone(),
        quest_chains,
        quests,
        points,
    })
}

#[cfg(target_os = "android")]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn export_user_data(
    app_handle: tauri::AppHandle<Wry>,
    user: User,
    relative_path: Option<String>,
) -> std::result::Result<Option<UserExportDataSummary>, crate::errors::Error> {
    use tauri_plugin_android_fs::{AndroidFsExt, FileUri, PublicGeneralPurposeDir, api::api_async::AndroidFs};

    let api: &AndroidFs<Wry> = app_handle.android_fs_async();

    let data: UserExportData = fetch_user_export_data(&app_handle, &user).await?;
    let bytes: Vec<u8> =
        serde_json::to_vec_pretty(&data).map_err(|e| std::io::Error::other(e.to_string()))?;

    let uri: FileUri = match relative_path.filter(|p| !p.is_empty()) {
        Some(sub_dir) => {
            let rel: String = format!("{sub_dir}/dailies.json");
            api.public_storage()
                .write_new(
                    None,
                    PublicGeneralPurposeDir::Download,
                    &rel,
                    Some("application/json"),
                    &bytes,
                )
                .await
                .map_err(|e| {
                    crate::errors::emit_app_error(&app_handle, "tauri://error", &e);
                    std::io::Error::other(e.to_string())
                })?
        }
        None => {
            let dir_uri: Option<FileUri> = api
                .file_picker()
                .pick_dir(None, false)
                .await
                .map_err(|e| {
                    crate::errors::emit_app_error(&app_handle, "tauri://error", &e);
                    std::io::Error::other(e.to_string())
                })?;

            let Some(dir_uri) = dir_uri else {
                log::info!("Android export JSON: folder picker cancelled");
                return Ok(None);
            };

            let filename = format!(
                "dailies-user-{}-{}.json",
                user.name,
                Local::now().format("%Y%m%d%H%M%S")
            );

            let file_uri: FileUri = api
                .create_new_file(&dir_uri, &filename, Some("application/json"))
                .await
                .map_err(|e| {
                    crate::errors::emit_app_error(&app_handle, "tauri://error", &e);
                    std::io::Error::other(e.to_string())
                })?;

            api.write(&file_uri, &bytes).await.map_err(|e| {
                crate::errors::emit_app_error(&app_handle, "tauri://error", &e);
                std::io::Error::other(e.to_string())
            })?;

            file_uri
        }
    };

    let uri_object: String = uri.to_json_string().unwrap_or_default();
    let uri_value: serde_json::Value =
        serde_json::from_str(&uri_object).expect("Invalid json string.");
    let output_path = uri_value
        .get("uri")
        .map_or_else(|| uri_object, |u| u.as_str().unwrap_or_default().to_owned());

    let summary = UserExportDataSummary {
        app_version: data.app_version,
        quest_chains: data.quest_chains.len(),
        quests: data.quests.len(),
        points: data.points.len(),
        output_path,
    };

    log::info!("{:?}", summary);

    Ok(Some(summary))
}

#[cfg(target_os = "windows")]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn export_user_data(
    app_handle: tauri::AppHandle<Wry>,
    user: User,
    dir: Option<&str>,
) -> Result<Option<UserExportDataSummary>, crate::errors::Error> {
    use std::{fs::File, io::{BufWriter, Write}, path::PathBuf};

    use tauri_plugin_dialog::DialogExt;

    let mut out_path: PathBuf = match dir.filter(|d| !d.is_empty()) {
        Some(d) => PathBuf::from(d),
        None => {
            let (tx, rx) = tokio::sync::oneshot::channel();
            app_handle
                .dialog()
                .file()
                .set_title("Select destination folder for Dailies user data export")
                .pick_folder(move |folder_path| {
                    let _ = tx.send(folder_path);
                });

            let picked = rx
                .await
                .map_err(|e| std::io::Error::other(format!("folder dialog channel error: {e}")))?;

            let Some(folder_path) = picked else {
                log::info!("Windows export JSON: folder picker cancelled");
                return Ok(None);
            };

            folder_path.into_path().map_err(|e| {
                std::io::Error::other(format!("failed to resolve picked folder path: {e}"))
            })?
        }
    };

    std::fs::create_dir_all(&out_path)?;

    let filename = format!(
        "dailies-user-{}-{}.json",
        user.name,
        Local::now().format("%Y%m%d%H%M%S")
    );

    out_path.push(filename);

    let data: UserExportData = fetch_user_export_data(&app_handle, &user).await?;
    let bytes: Vec<u8> =
        serde_json::to_vec_pretty(&data).map_err(|e| std::io::Error::other(e.to_string()))?;

    let file: File = File::create(&out_path)?;
    let mut w: BufWriter<File> = BufWriter::new(file);
    w.write_all(&bytes)?;
    w.flush()?;

    let summary = UserExportDataSummary {
        app_version: data.app_version,
        quest_chains: data.quest_chains.len(),
        quests: data.quests.len(),
        points: data.points.len(),
        output_path: out_path.into_os_string().display().to_string(),
    };

    log::info!("{:?}", summary);

    Ok(Some(summary))
}
