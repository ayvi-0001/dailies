#[derive(Debug, thiserror::Error)]
pub(crate) enum UserDataError {
    #[error("Folder picker cancelled")]
    Cancelled,
    #[error("Folder picker dialog failed: {0}")]
    Dialog(String),
    #[error("Failed to resolve path: {0}")]
    Path(String),
    #[error("Export app version `{0}` is incompatible with current app version `{1}`")]
    IncompatibleAppVersion(semver::Version, semver::Version),
    #[error("Export sqlite user_version `{0}` is incompatible with current database version `{1}`")]
    IncompatibleSqliteUserVersion(i64, i64),
}
