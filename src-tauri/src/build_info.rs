#[tauri::command()]
pub fn vergen_git_describe() -> String {
    env!("VERGEN_GIT_DESCRIBE").into()
}

#[tauri::command()]
pub fn vergen_git_dirty() -> Option<String> {
    if env!("VERGEN_GIT_DIRTY") == "true" {
        Some(format!(
            "-dev+{}-{}",
            env!("GIT_INSERTIONS"),
            env!("GIT_DELETIONS")
        ))
    } else {
        None
    }
}

#[tauri::command()]
pub fn vergen_cargo_target_triple() -> String {
    env!("VERGEN_CARGO_TARGET_TRIPLE").into()
}

#[tauri::command()]
pub fn vergen_git_branch() -> String {
    env!("VERGEN_GIT_BRANCH").into()
}

#[tauri::command()]
pub fn vergen_git_sha() -> String {
    env!("VERGEN_GIT_SHA").into()
}

#[tauri::command()]
pub fn vergen_build_date() -> String {
    env!("VERGEN_BUILD_DATE").into()
}

#[tauri::command()]
pub fn vergen_build_timestamp() -> String {
    let build_timestamp: chrono::DateTime<chrono::FixedOffset> =
        chrono::DateTime::parse_from_rfc3339(env!("VERGEN_BUILD_TIMESTAMP")).unwrap_or_else(|_| {
            panic!(
                "vergen build script failed to run, missing env var: {}",
                "VERGEN_BUILD_TIMESTAMP"
            )
        });

    build_timestamp
        .with_timezone(&chrono::Local)
        .format("%Y-%m-%dT%H:%M:%S%z")
        .to_string()
}
