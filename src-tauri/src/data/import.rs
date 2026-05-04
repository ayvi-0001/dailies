use anyhow::Result;
use serde::Serialize;
use sqlx::{Acquire, Sqlite, SqliteConnection, Transaction, pool::PoolConnection, sqlite::SqliteQueryResult};
use tauri::{Manager, Wry};
use tokio::sync::{Mutex, MutexGuard};

use crate::{data::structs::UserExportData, db::user::User, errors::{DataImportError, Error}, state};

#[derive(Debug, Default, Serialize)]
pub struct UserImportDataSummary {
    pub quest_chains_inserted: usize,
    pub quests_inserted: usize,
    pub points_inserted: usize,
    pub data_path: String,
}

pub async fn insert_user_export_data(
    app_handle: &tauri::AppHandle<Wry>,
    user: &User,
    data: UserExportData,
) -> Result<UserImportDataSummary, crate::errors::Error> {
    let state = app_handle.state::<Mutex<state::AppState>>();
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let mut summary = UserImportDataSummary::default();

    let mut tx: Transaction<'_, Sqlite> = conn.begin().await?;

    for chain in data.quest_chains {
        let result: SqliteQueryResult = sqlx::query!(
            r#"
                INSERT INTO "quest_chains"(user_id, chain, sequence, collapsed)
                SELECT $1, $2, $3, $4
                WHERE NOT EXISTS (
                    SELECT 1 FROM "quest_chains" WHERE user_id = $1 AND chain = $2
                );
            "#,
            user.id,
            chain.chain,
            chain.sequence,
            chain.collapsed,
        )
        .execute(&mut *tx)
        .await?;

        summary.quest_chains_inserted += result.rows_affected() as usize;
    }

    // TODO(ayvi): check quest/point id hashes. http://ayvi:3000/ayvi/dailies/issues/223
    for quest in data.quests {
        let result: SqliteQueryResult = sqlx::query!(
            r#"
                INSERT OR IGNORE INTO "quests"(
                    id,
                    user_id,
                    sequence,
                    chain,
                    name,
                    type_id,
                    weight,
                    total,
                    default_points,
                    accepted,
                    archived,
                    streak_target,
                    requirements,
                    time_start,
                    time_end,
                    days,
                    description,
                    updated
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
                );
            "#,
            quest.id,
            user.id,
            quest.sequence,
            quest.chain,
            quest.name,
            quest.type_id,
            quest.weight,
            quest.total,
            quest.default_points,
            quest.accepted,
            quest.archived,
            quest.streak_target,
            quest.requirements,
            quest.time_start,
            quest.time_end,
            quest.days,
            quest.description,
            quest.updated,
        )
        .execute(&mut *tx)
        .await?;

        summary.quests_inserted += result.rows_affected() as usize;
    }

    for point in data.points {
        let result: SqliteQueryResult = sqlx::query!(
            r#"
                INSERT OR IGNORE INTO "points"(
                    id,
                    quest_id,
                    date,
                    points,
                    weight,
                    total,
                    streak_target,
                    requirements,
                    time_start,
                    time_end,
                    note,
                    updated
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                );
            "#,
            point.id,
            point.quest_id,
            point.date,
            point.points,
            point.weight,
            point.total,
            point.streak_target,
            point.requirements,
            point.time_start,
            point.time_end,
            point.note,
            point.updated,
        )
        .execute(&mut *tx)
        .await?;

        summary.points_inserted += result.rows_affected() as usize;
    }

    tx.commit().await?;

    Ok(summary)
}

#[cfg(target_os = "android")]
#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn import_user_data(
    app_handle: tauri::AppHandle<Wry>,
    path: Option<&str>, // unused, to keep function signature consistent with windows version
    user: User,
) -> std::result::Result<Option<UserImportDataSummary>, crate::errors::Error> {
    use tauri_plugin_android_fs::{AndroidFsExt, FileUri, PublicGeneralPurposeDir, api::api_async::AndroidFs};

    let api: &AndroidFs<Wry> = app_handle.android_fs_async();

    let uri: Option<FileUri> = api
        .file_picker()
        .pick_file(None, &["application/json", "*/*"], false)
        .await
        .map_err(|e| {
            crate::errors::emit_app_error(&app_handle, "tauri://error", &e);
            std::io::Error::other(e.to_string())
        })?;

    let Some(uri) = uri else {
        log::info!("Android import JSON: file picker cancelled");
        return Ok(None);
    };

    let name: String = api.get_name(&uri).await.map_err(|e| {
        crate::errors::emit_app_error(&app_handle, "tauri://error", &e);
        std::io::Error::other(e.to_string())
    })?;
    let bytes: Vec<u8> = api.read(&uri).await.map_err(|e| {
        crate::errors::emit_app_error(&app_handle, "tauri://error", &e);
        std::io::Error::other(e.to_string())
    })?;

    let data: UserExportData = serde_json::from_slice(&bytes)
        .map_err(|e| std::io::Error::other(format!("`{name}` is not a valid JSON data: {e}")))?;

    let state = app_handle.state::<Mutex<state::AppState>>();
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let app_version: semver::Version =
        semver::Version::parse(&app_handle.package_info().version.to_string()).unwrap();
    let data_export_app_version: semver::Version = semver::Version::parse(&data.app_version)
        .map_err(|e| {
            std::io::Error::other(format!(
                "cannot parse app version from user data export: {}",
                e
            ))
        })?;

    let current_sqlite_user_ver: i64 = sqlx::query_scalar!("PRAGMA user_version;")
        .fetch_one(&mut *conn)
        .await?
        .unwrap_or(0_i64);

    // TODO(ayvi): add proper version checks. http://ayvi:3000/ayvi/dailies/issues/224
    if data_export_app_version.major < app_version.major {
        Err(Error::DataImport(DataImportError::IncompatibleAppVersion(
            data_export_app_version,
            app_version,
        )))
    } else if data.sqlite_user_version < current_sqlite_user_ver {
        Err(Error::DataImport(
            DataImportError::IncompatibleSqliteUserVersion(
                data.sqlite_user_version,
                current_sqlite_user_ver,
            ),
        ))
    } else {
        std::mem::drop(guard);

        let mut summary: UserImportDataSummary =
            insert_user_export_data(&app_handle, &user, data).await?;

        let uri_object: String = uri.to_json_string().unwrap_or_default();
        let uri_value: serde_json::Value =
            serde_json::from_str(&uri_object).expect("Invalid json string.");
        let output_path = uri_value
            .get("uri")
            .map_or_else(|| uri_object, |u| u.as_str().unwrap_or_default().to_owned());

        summary.data_path = output_path;

        log::info!("{:?}", summary);

        Ok(Some(summary))
    }
}

#[cfg(target_os = "windows")]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn import_user_data(
    app_handle: tauri::AppHandle<Wry>,
    user: User,
    path: Option<&str>,
) -> Result<Option<UserImportDataSummary>, crate::errors::Error> {
    use std::{fs::File, path::PathBuf};

    use tauri_plugin_dialog::DialogExt;

    let in_path: PathBuf = match path.filter(|p| !p.is_empty()) {
        Some(p) => PathBuf::from(p),
        None => {
            let (tx, rx) = tokio::sync::oneshot::channel();
            app_handle
                .dialog()
                .file()
                .set_title("Select Dailies user data export")
                .add_filter("JSON", &["json"])
                .pick_file(move |file_path| {
                    let _ = tx.send(file_path);
                });

            let picked = rx
                .await
                .map_err(|e| std::io::Error::other(format!("file dialog channel error: {e}")))?;

            let Some(file_path) = picked else {
                log::info!("Windows import JSON: file picker cancelled");
                return Ok(None);
            };

            file_path.into_path().map_err(|e| {
                std::io::Error::other(format!("failed to resolve picked file path: {e}"))
            })?
        }
    };

    if !in_path.is_file() {
        return Err(crate::errors::Error::Io(std::io::Error::other(format!(
            "import path is not a file: {}",
            in_path.display()
        ))));
    }

    let mut file: File = File::open(&in_path)?;
    let mut buf: Vec<u8> = Vec::new();
    std::io::Read::read_to_end(&mut file, &mut buf)?;

    let data: UserExportData = serde_json::from_slice(&buf)
        .map_err(|e| std::io::Error::other(format!("invalid JSON export: {e}")))?;

    let state = app_handle.state::<Mutex<state::AppState>>();
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let app_version: semver::Version =
        semver::Version::parse(&app_handle.package_info().version.to_string()).unwrap();
    let data_export_app_version: semver::Version = semver::Version::parse(&data.app_version)
        .map_err(|e| {
            std::io::Error::other(format!(
                "cannot parse app version from user data export: {}",
                e
            ))
        })?;

    let current_sqlite_user_ver: i64 = sqlx::query_scalar!("PRAGMA user_version;")
        .fetch_one(&mut *conn)
        .await?
        .unwrap_or(0_i64);

    // TODO(ayvi): add proper version checks. http://ayvi:3000/ayvi/dailies/issues/224
    if data_export_app_version.major < app_version.major {
        Err(Error::DataImport(DataImportError::IncompatibleAppVersion(
            data_export_app_version,
            app_version,
        )))
    } else if data.sqlite_user_version < current_sqlite_user_ver {
        Err(Error::DataImport(
            DataImportError::IncompatibleSqliteUserVersion(
                data.sqlite_user_version,
                current_sqlite_user_ver,
            ),
        ))
    } else {
        std::mem::drop(guard);

        let mut summary: UserImportDataSummary =
            insert_user_export_data(&app_handle, &user, data).await?;
        summary.data_path = in_path.display().to_string();

        log::info!("{:?}", summary);

        Ok(Some(summary))
    }
}
