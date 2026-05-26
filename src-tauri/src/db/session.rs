use anyhow::Result;
use sqlx::{Acquire, Sqlite, SqliteConnection, pool::PoolConnection, sqlite::SqliteQueryResult};
use tokio::sync::{Mutex, MutexGuard};

use crate::state;

#[tauri::command(async, rename_all = "snake_case")]
pub async fn save_session<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
    user: &'a str,
    session_id: &'a str,
) -> Result<String, crate::AppError> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let result: SqliteQueryResult = sqlx::query!(
        r#"INSERT INTO "sessions" (user, session_id) VALUES ($1, $2);"#,
        user,
        session_id
    )
    .execute(conn)
    .await?;

    log::info!("{result:?}");

    Ok(session_id.into())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_session<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
) -> Result<Option<String>, crate::AppError> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let session: Option<String> = sqlx::query_scalar!(
        r#"SELECT session_id AS id FROM "sessions" ORDER BY id DESC LIMIT 1;"#,
    )
    .fetch_optional(conn)
    .await?;

    Ok(session)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn delete_session<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
    id: Option<i64>,
) -> Result<(), crate::AppError> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let result: SqliteQueryResult = sqlx::query!(r#"DELETE FROM "sessions" WHERE id = ?1;"#, id)
        .execute(conn)
        .await?;

    log::info!("{result:?}");

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn truncate_sessions<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
) -> Result<(), crate::AppError> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let result: SqliteQueryResult = sqlx::query!(r#"DELETE FROM "sessions";"#)
        .execute(conn)
        .await?;

    log::info!("{result:?}");

    Ok(())
}
