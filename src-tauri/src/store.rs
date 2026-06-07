use std::sync::Arc;

use serde_json::json;
use tauri_plugin_store::{Store, StoreExt};

pub fn init_store<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    store_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let store = app.store(store_path)?;

    // Default set to true so an already logged in user doesn't get logged out.
    set_key_if_missing(&store, "stay-logged-in", json!({"value": true}))?;
    // Default background initially set to "night".
    set_key_if_missing(&store, "background", json!({"source": "night"}))?;

    Ok(())
}

pub fn set_key_if_missing<R: tauri::Runtime>(
    store: &Arc<Store<R>>,
    key: &str,
    default: serde_json::Value,
) -> Result<(), Box<dyn std::error::Error>> {
    if !store.has(key) {
        store.set(key, default);
        store.save()?;
    }

    Ok(())
}
