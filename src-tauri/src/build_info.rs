#[tauri::command()]
pub fn vergen_git_describe() -> String {
    format!(
        "{}{}",
        env!("VERGEN_GIT_DESCRIBE"),
        if env!("VERGEN_GIT_DIRTY") == "true" {
            format!("-dev+{}-{}", env!("GIT_INSERTIONS"), env!("GIT_DELETIONS"))
        } else {
            "".into()
        }
    )
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
pub fn vergen_build_date() -> String {
    env!("VERGEN_BUILD_DATE").into()
}

#[tauri::command()]
pub fn vergen_build_timestamp() -> String {
    env!("VERGEN_BUILD_TIMESTAMP").into()
}
