use serde_json::Value;
use sqlx::{Acquire, Sqlite, SqliteConnection, pool::PoolConnection, types::Json};
use tokio::sync::{Mutex, MutexGuard};

use crate::state;

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_key_as_bool(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
) -> Result<Option<bool>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let value = sqlx::query_scalar!(
        r#"SELECT "boolean" AS "boolean!: bool" FROM "config" WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key
    )
    .fetch_optional(&mut *conn)
    .await?;

    Ok(value)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn set_key_as_bool(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
    value: bool,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    sqlx::query!(
        r#"UPDATE "config" SET "boolean" = $3 WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key,
        value,
    )
    .execute(&mut *conn)
    .await?;

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_key_as_int(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
) -> Result<Option<i64>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let value = sqlx::query_scalar!(
        r#"SELECT "integer" AS "integer!: i64" FROM "config" WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key
    )
    .fetch_optional(&mut *conn)
    .await?;

    Ok(value)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn set_key_as_int(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
    value: i64,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    sqlx::query!(
        r#"UPDATE "config" SET "integer" = $3 WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key,
        value,
    )
    .execute(&mut *conn)
    .await?;

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_key_as_float(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
) -> Result<Option<f64>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let value = sqlx::query_scalar!(
        r#"SELECT "float" AS "float!: f64" FROM "config" WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key
    )
    .fetch_optional(&mut *conn)
    .await?;

    Ok(value)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn set_key_as_float(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
    value: f64,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    sqlx::query!(
        r#"UPDATE "config" SET "float" = $3 WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key,
        value,
    )
    .execute(&mut *conn)
    .await?;

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_key_as_string(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
) -> Result<Option<String>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let value = sqlx::query_scalar!(
        r#"SELECT "string" AS "string!: String" FROM "config" WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key
    )
    .fetch_optional(&mut *conn)
    .await?;

    Ok(value)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn set_key_as_string(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
    value: String,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    sqlx::query!(
        r#"UPDATE "config" SET "string" = $3 WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key,
        value,
    )
    .execute(&mut *conn)
    .await?;

    Ok(())
}
#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_key_as_json(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
) -> Result<Option<Json<Value>>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let value = sqlx::query_scalar!(
        r#"SELECT "json" AS "json!: Json<Value>" FROM "config" WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key
    )
    .fetch_optional(&mut *conn)
    .await?;

    Ok(value)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn set_key_as_json(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    key: String,
    value: Json<Value>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    sqlx::query!(
        r#"UPDATE "config" SET "json" = $3 WHERE user_id = $1 AND key = $2;"#,
        user_id,
        key,
        value,
    )
    .execute(&mut *conn)
    .await?;

    Ok(())
}
