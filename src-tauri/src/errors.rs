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
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer, {
        let error_message = self.to_string();
        let error_kind = match self {
            // TODO(ayvi): custom errors/titles
            Self::Io(_) => {
                emit_app_error(app_handle(), "tauri://error", &self);
                ErrorKind::Io(error_message)
            }
            Self::Chrono(_) => {
                emit_app_error(app_handle(), "tauri://error", &self);
                ErrorKind::Chrono(error_message)
            }
            Self::Sqlx(_) => {
                emit_app_error(app_handle(), "tauri://error", &self);
                ErrorKind::Sqlx(error_message)
            }
            Self::Argon2(_) => {
                emit_app_error(app_handle(), "tauri://error", &self);
                ErrorKind::Argon2(error_message)
            }
            Self::User(_) => {
                emit_app_error(app_handle(), "tauri://error", &self);
                ErrorKind::User(error_message)
            }
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
}

#[derive(Debug, thiserror::Error)]
pub(crate) enum UserError {
    #[error("Invalid password")]
    InvalidPassword,
    #[error("Username not found")]
    UnknownUser,
}

#[derive(Clone, serde::Serialize)]
pub struct ErrorMessage<'a> {
    pub message: &'a str,
}

pub fn emit_app_error<T>(app: &tauri::AppHandle, event: &str, error: &T)
where
    T: std::error::Error + std::string::ToString, {
    let payload = ErrorMessage { message: &error.to_string() };
    app.emit(event, payload).unwrap()
}
