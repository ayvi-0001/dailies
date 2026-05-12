extern crate argon2;

use anyhow::Result;
use argon2::{Argon2, password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng}};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::{Acquire, Sqlite, SqliteConnection, pool::PoolConnection, sqlite::SqliteQueryResult};
use tauri::Manager;
use tokio::sync::{Mutex, MutexGuard};

use crate::{errors::{Error, UserError}, state};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
pub(crate) struct User {
    pub id: i64,
    pub name: String,
    pub created: NaiveDateTime,
    pub updated: NaiveDateTime,
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn create_user<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
    name: &'a str,
    password: &'a str,
) -> Result<User, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string();

    let result: SqliteQueryResult = sqlx::query!(
        r#"INSERT INTO "users" (name, password) VALUES ($1, $2);"#,
        name,
        password_hash
    )
    .execute(&state.db.pool)
    .await?;

    log::info!("{result:?}");

    let user: User = sqlx::query_as!(
        User,
        r#"SELECT id, name, created, updated FROM "users" WHERE name = $1 LIMIT 1;"#,
        name
    )
    .fetch_one(&state.db.pool)
    .await?;

    let result: SqliteQueryResult = sqlx::query_file!("queries/new-user-config.sql", user.id,)
        .execute(&state.db.pool)
        .await?;

    log::info!("{result:?}");

    Ok(user)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_user(
    app_handle: tauri::AppHandle,
    name: Option<&str>,
    id: Option<i64>,
) -> Result<Option<User>, crate::errors::Error> {
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
        .fetch_optional(conn)
        .await?
    } else if let Some(id) = id {
        sqlx::query_as!(
            User,
            r#"SELECT id, name, created, updated FROM "users" WHERE id = $1 LIMIT 1;"#,
            id
        )
        .fetch_optional(conn)
        .await?
    } else {
        None
    };

    Ok(user)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn verify_user<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
    username: &'a str,
    password: &'a str,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let stored_hash: Result<String, Error> = sqlx::query_scalar!(
        r#"SELECT password AS "password!" FROM "users" WHERE name = $1 LIMIT 1;"#,
        username
    )
    .fetch_one(conn)
    .await
    .map_err(|_| Error::User(UserError::UnknownUser));

    let argon2 = Argon2::default();

    match stored_hash {
        Ok(hash) => {
            let password_hash = PasswordHash::new(&hash).map_err(Error::Argon2)?;
            match argon2.verify_password(password.as_bytes(), &password_hash) {
                Ok(_) => Ok(()),
                Err(_) => Err(Error::User(UserError::IncorrectPassword)),
            }
        }
        Err(e) => Err(e),
    }
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_password<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
    user_id: i64,
    current_password: &'a str,
    new_password: &'a str,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let stored_hash: Result<String, Error> = sqlx::query_scalar!(
        r#"SELECT password AS "password!" FROM "users" WHERE id = $1 LIMIT 1;"#,
        user_id
    )
    .fetch_one(&mut *conn)
    .await
    .map_err(|_| Error::User(UserError::UnknownUser));

    let argon2 = Argon2::default();

    match stored_hash {
        Ok(hash) => {
            let stored_password_hash = PasswordHash::new(&hash).map_err(Error::Argon2)?;
            match argon2.verify_password(current_password.as_bytes(), &stored_password_hash) {
                Ok(_) => {
                    let salt = SaltString::generate(&mut OsRng);
                    let argon2 = Argon2::default();
                    let new_password_hash = argon2
                        .hash_password(new_password.as_bytes(), &salt)?
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
                Err(_) => Err(Error::User(UserError::IncorrectPassword)),
            }
        }
        Err(e) => Err(e),
    }
}
