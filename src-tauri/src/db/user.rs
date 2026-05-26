extern crate argon2;

use anyhow::{Result, anyhow};
use argon2::{Argon2, password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng}};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::{Acquire, Sqlite, SqliteConnection, pool::PoolConnection, sqlite::SqliteQueryResult};
use tauri::Manager;
use tokio::sync::{Mutex, MutexGuard};

use crate::state;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
pub(crate) struct User {
    pub id: i64,
    pub name: String,
    pub created: NaiveDateTime,
    pub updated: NaiveDateTime,
}

#[derive(Debug, thiserror::Error)]
pub(crate) enum UserError {
    #[error("Incorrect password")]
    IncorrectPassword(#[from] argon2::password_hash::Error),
    #[error("User not found")]
    UnknownUser,
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn create_user<'a>(
    app_handle: tauri::AppHandle,
    name: &'a str,
    password: &'a str,
) -> Result<User, crate::AppError> {
    let state = app_handle.state::<Mutex<state::AppState>>();
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow!(e.to_string()))?
        .to_string();

    let result: SqliteQueryResult = sqlx::query!(
        r#"INSERT INTO "users" (name, password) VALUES ($1, $2);"#,
        name,
        password_hash
    )
    .execute(&mut *conn)
    .await?;

    log::info!("{result:?}");

    let user: User = sqlx::query_as!(
        User,
        r#"SELECT id, name, created, updated FROM "users" WHERE name = $1 LIMIT 1;"#,
        name
    )
    .fetch_one(&mut *conn)
    .await?;

    let result: SqliteQueryResult = sqlx::query_file!("queries/new-user-config.sql", user.id,)
        .execute(&mut *conn)
        .await?;

    log::info!("{result:?}");

    std::mem::drop(guard);

    Ok(user)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_user(
    app_handle: tauri::AppHandle,
    name: Option<&str>,
    id: Option<i64>,
) -> Result<Option<User>, crate::AppError> {
    let state = app_handle.state::<Mutex<state::AppState>>();
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let user: Option<User> = if let Some(name) = name {
        sqlx::query_as!(
            User,
            r#"SELECT id, name, created, updated FROM "users" WHERE name = $1 LIMIT 1;"#,
            name
        )
        .fetch_optional(&mut *conn)
        .await?
    } else if let Some(id) = id {
        sqlx::query_as!(
            User,
            r#"SELECT id, name, created, updated FROM "users" WHERE id = $1 LIMIT 1;"#,
            id
        )
        .fetch_optional(&mut *conn)
        .await?
    } else {
        None
    };

    std::mem::drop(guard);

    Ok(user)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn verify_user(
    app_handle: tauri::AppHandle,
    name: Option<&str>,
    id: Option<i64>,
    password: &str,
) -> Result<User, crate::AppError> {
    let user = get_user(app_handle.clone(), name, id)
        .await?
        .ok_or(UserError::UnknownUser)?;

    let state = app_handle.state::<Mutex<state::AppState>>();
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let stored_hash: String = sqlx::query_scalar!(
        r#"SELECT password AS "password!" FROM "users" WHERE id = $1 LIMIT 1;"#,
        user.id
    )
    .fetch_one(&mut *conn)
    .await
    .map_err(|_| UserError::UnknownUser)?;

    std::mem::drop(guard);

    let password_hash = PasswordHash::new(&stored_hash).map_err(|e| anyhow!(e))?;

    Argon2::default()
        .verify_password(password.as_bytes(), &password_hash)
        .map_err(UserError::IncorrectPassword)?;

    Ok(user)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_password<'a>(
    app_handle: tauri::AppHandle,
    user_id: i64,
    current_password: &'a str,
    new_password: &'a str,
) -> Result<(), crate::AppError> {
    verify_user(app_handle.clone(), None, Some(user_id), current_password).await?;

    let state = app_handle.state::<Mutex<state::AppState>>();
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let salt = SaltString::generate(&mut OsRng);
    let new_password_hash = Argon2::default()
        .hash_password(new_password.as_bytes(), &salt)
        .map_err(|e| anyhow!(e.to_string()))?
        .to_string();

    let result: SqliteQueryResult = sqlx::query!(
        r#"UPDATE "users" SET password = $1 WHERE id = $2;"#,
        new_password_hash,
        user_id,
    )
    .execute(&mut *conn)
    .await?;

    log::info!("{result:?}");

    Ok(())
}
