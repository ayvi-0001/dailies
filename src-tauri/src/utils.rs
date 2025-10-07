use tauri::Emitter;

pub fn emit_app_error(app: &tauri::AppHandle, event: &str, error: &dyn std::error::Error) {
    app.emit(
        event,
        crate::messages::ErrorMessage { message: &error.to_string() },
    )
    .unwrap()
}
