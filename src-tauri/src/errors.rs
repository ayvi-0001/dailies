use anyhow::Result;
use tauri::Emitter;

use crate::state::app_handle;

#[derive(Debug, thiserror::Error)]
pub(crate) enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("failed to parse date: {0}")]
    Chrono(#[from] chrono::ParseError),
    #[error("database error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("error hashing password: {0}")]
    Argon2(#[from] argon2::password_hash::Error),
    #[error("{0}")]
    User(#[from] self::UserError),
    #[error("{0}")]
    DataImport(#[from] self::DataImportError),
    #[error("tauri error: {0}")]
    Tauri(#[from] tauri::Error),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer, {
        let error_message = self.to_string();
        if let Some(handle) = app_handle() {
            emit_app_error(handle, "tauri://error", &self);
        } else {
            log::error!("App handle not available to emit error: {error_message}");
        }
        let error_kind = match self {
            // TODO(ayvi): custom errors/titles
            Self::Io(_) => ErrorKind::Io(error_message),
            Self::Chrono(_) => ErrorKind::Chrono(error_message),
            Self::Sqlx(_) => ErrorKind::Sqlx(error_message),
            Self::Argon2(_) => ErrorKind::Argon2(error_message),
            Self::User(_) => ErrorKind::User(error_message),
            Self::DataImport(_) => ErrorKind::DataImport(error_message),
            Self::Tauri(_) => ErrorKind::Tauri(error_message),
        };
        error_kind.serialize(serializer)
    }
}

#[derive(serde::Serialize)]
#[serde(tag = "kind", content = "message")]
#[serde(rename_all = "camelCase")]
enum ErrorKind {
    Io(String),
    Chrono(String),
    Sqlx(String),
    Argon2(String),
    User(String),
    DataImport(String),
    Tauri(String),
}

#[derive(Debug, thiserror::Error)]
pub(crate) enum UserError {
    #[error("Incorrect password")]
    IncorrectPassword,
    #[error("Username not found")]
    UnknownUser,
}

#[derive(Debug, thiserror::Error)]
pub(crate) enum DataImportError {
    #[error("Data export app version `{0}` is incompatible with current app version `{1}`")]
    IncompatibleAppVersion(semver::Version, semver::Version),
    #[error(
        "Data export sqlite user_version `{0}` is incompatible with current database version `{1}`"
    )]
    IncompatibleSqliteUserVersion(i64, i64),
}

#[derive(Clone, serde::Serialize)]
pub struct ErrorMessage<'a> {
    pub message: &'a str,
}

impl<'a> ErrorMessage<'a> {
    pub fn new(message: &'a str) -> Self {
        Self { message }
    }
}

pub fn emit_app_error<T>(app: &tauri::AppHandle, event: &str, error: &T)
where
    T: std::error::Error + std::string::ToString, {
    let binding = error.to_string();
    let payload = ErrorMessage::new(&binding);
    if let Err(e) = app.emit(event, payload) {
        log::error!("Failed to emit app error event: {e}");
    }
}
