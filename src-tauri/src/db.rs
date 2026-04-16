use std::path::PathBuf;

extern crate argon2;

use anyhow::Result;
use argon2::{Argon2, password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng}};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlite_hashes::{register_sha1_functions, rusqlite::Connection};
use sqlx::{Acquire, Pool, Sqlite, SqliteConnection, pool::PoolConnection, sqlite::{LockedSqliteHandle, SqliteConnectOptions, SqlitePool, SqlitePoolOptions, SqliteQueryResult}};
use tokio::sync::{Mutex, MutexGuard};

use crate::{errors::{Error, UserError}, state};

pub struct Database {
    pub pool: Pool<Sqlite>,
}

impl Database {
    const NAME: &str = "dailies";
    const MAX_CONNECTIONS: u32 = 8;

    pub async fn new(app_dir: PathBuf) -> Result<Self> {
        let db_path: PathBuf = app_dir.join(format!("{}.db", Database::NAME));

        log::info!("Initializing database at: {:?}", db_path);

        let connection_options = SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true)
            .foreign_keys(true)
            .auto_vacuum(sqlx::sqlite::SqliteAutoVacuum::Full)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
            .optimize_on_close(true, None);

        let pool: SqlitePool = SqlitePoolOptions::new()
            .max_connections(Database::MAX_CONNECTIONS)
            .idle_timeout(std::time::Duration::from_secs(300))
            .max_lifetime(std::time::Duration::from_secs(1800))
            .test_before_acquire(true)
            .connect_with(connection_options)
            .await?;

        if let Err(migrate_result) = sqlx::migrate!().run(&pool).await {
            // TODO(ayvi): handle if migration fails
            log::error!("Sqlx migration error: {:?}", migrate_result.to_string());
        };

        Ok(Self { pool })
    }

    pub async fn register_sqlite_sha1_functions(
        &self,
        sqlx_conn: &mut SqliteConnection,
    ) -> Result<(), Error> {
        let mut handle_lock: LockedSqliteHandle<'_> = sqlx_conn
            .lock_handle()
            .await
            .map_err(Error::Sqlx)?;
        let handle = handle_lock.as_raw_handle().as_ptr();
        let rusqlite_conn: Connection = unsafe { Connection::from_handle(handle) }
            .map_err(|e| Error::Io(std::io::Error::other(e.to_string())))?;

        register_sha1_functions(&rusqlite_conn)
            .map_err(|e| Error::Io(std::io::Error::other(e.to_string())))?;

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
pub struct User {
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
pub async fn get_user<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
    username: Option<&'a str>,
) -> Result<Option<User>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let user: Option<User> = sqlx::query_as!(
        User,
        r#"SELECT id, name, created, updated FROM "users" WHERE name = $1 LIMIT 1;"#,
        username
    )
    .fetch_optional(conn)
    .await?;

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
                Err(_) => Err(Error::User(UserError::InvalidPassword)),
            }
        }
        Err(e) => Err(e),
    }
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn save_session<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
    user: &'a str,
    session_id: &'a str,
) -> Result<(), crate::errors::Error> {
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

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_session<'a>(
    state: tauri::State<'a, Mutex<state::AppState>>,
) -> Result<Option<String>, crate::errors::Error> {
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
) -> Result<(), crate::errors::Error> {
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
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let result: SqliteQueryResult = sqlx::query!(r#"DELETE FROM "sessions";"#)
        .execute(conn)
        .await?;

    log::info!("{result:?}");

    Ok(())
}
