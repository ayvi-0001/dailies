use std::path::PathBuf;

extern crate argon2;

use anyhow::{Result, anyhow};
use sqlite_hashes::{register_sha1_functions, rusqlite::Connection};
use sqlx::{Pool, Sqlite, SqliteConnection, sqlite::{LockedSqliteHandle, SqliteConnectOptions, SqlitePool, SqlitePoolOptions}};

crate::mod_pub!(user, session);
crate::mod_pub!(query);

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
    ) -> Result<(), crate::AppError> {
        let mut handle_lock: LockedSqliteHandle<'_> = sqlx_conn.lock_handle().await?;
        let handle = handle_lock.as_raw_handle().as_ptr();
        let rusqlite_conn: Connection =
            unsafe { Connection::from_handle(handle) }.map_err(|e| anyhow!(e))?;

        Ok(register_sha1_functions(&rusqlite_conn).map_err(|e| anyhow!(e))?)
    }
}
