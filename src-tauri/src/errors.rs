use anyhow::Result;
use serde_json::to_value;
use strum::EnumIter;
use tauri::Emitter;

#[derive(Debug, thiserror::Error)]
#[error(transparent)]
pub(crate) enum AppError {
    Any(#[from] anyhow::Error),
    Chrono(#[from] chrono::ParseError),
    Io(#[from] std::io::Error),
    Sqlx(#[from] sqlx::Error),
    Tauri(#[from] tauri::Error),
    User(#[from] crate::db::user::UserError),
    UserData(#[from] crate::data::errors::UserDataError),
}

#[derive(Default, Clone, serde::Serialize)]
pub struct ErrorContent {
    pub title: Option<String>,
    pub content: String,
}

impl ErrorContent {
    fn new(content: String) -> Self {
        Self { content, ..Default::default() }
    }

    fn with_title<'a>(mut self, title: &'a str) -> Self {
        self.title = Some(title.to_owned());
        self
    }
}

#[derive(serde::Serialize, EnumIter)]
#[serde(tag = "kind")]
#[serde(rename_all = "camelCase")]
enum ErrorKind<T = ErrorContent>
where
    T: Default, {
    Any(T),
    Chrono(T),
    Io(T),
    Sqlx(T),
    Tauri(T),
    User(T),
    UserData(T),
}

impl ErrorKind {
    fn get_title(&self) -> Option<String> {
        // TODO(ayvi): easier way to do this?
        use ErrorKind::*;
        match self {
            Any(c) => c.title.clone(),
            Chrono(c) => c.title.clone(),
            Io(c) => c.title.clone(),
            Sqlx(c) => c.title.clone(),
            Tauri(c) => c.title.clone(),
            User(c) => c.title.clone(),
            UserData(c) => c.title.clone(),
        }
    }
}

impl Default for ErrorKind {
    fn default() -> ErrorKind {
        ErrorKind::Any(ErrorContent::default())
    }
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer, {
        let err_msg = self.to_string();

        use AppError::*;
        let error_kind = match self {
            Any(_) => ErrorKind::Any(ErrorContent::new(err_msg)),
            Chrono(_) => ErrorKind::Chrono(ErrorContent::new(err_msg)),
            Io(_) => ErrorKind::Io(ErrorContent::new(err_msg)),
            Sqlx(_) => ErrorKind::Sqlx(ErrorContent::new(err_msg).with_title("Sqlx")),
            Tauri(_) => ErrorKind::Tauri(ErrorContent::new(err_msg).with_title("Tauri")),
            User(_) => ErrorKind::User(ErrorContent::new(err_msg).with_title("User")),
            UserData(_) => {
                ErrorKind::UserData(ErrorContent::new(err_msg).with_title("Data Import/Export"))
            }
        };

        match self {
            Self::Any(_) | Self::UserData(_) => { /* Don't emit event for these errors */ }
            // Emit event for all other errors
            _ => {
                if let Some(handle) = crate::state::app_handle() {
                    #[allow(unused_must_use)]
                    emit_app_error(
                        handle,
                        "tauri://error",
                        error_kind.get_title().as_deref(),
                        &self,
                    )
                    .map_err(|e| log::error!("Failed to emit app error event: {e}"));
                }
            }
        };

        error_kind.serialize(serializer)
    }
}

pub fn emit_app_error<'a, T>(
    app: &tauri::AppHandle,
    event: &'a str,
    title: Option<&'a str>,
    content: &T,
) -> Result<(), tauri::Error>
where
    T: ToString, {
    let mut payload = serde_json::Map::new();
    payload.insert("title".to_string(), to_value(title)?);
    payload.insert("content".to_string(), to_value(content.to_string())?);
    app.emit(event, payload)
}
