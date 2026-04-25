use std::path::PathBuf;

use tauri::Manager;
use tokio::sync::Mutex;

pub(crate) mod macros;
crate::mod_flat!(config, dailies, state, db, errors, build_info, utils);

#[cfg(target_os = "android")]
mod android;

lazy_static::lazy_static! {
    pub static ref JWT_SECRET: &'static str = env!("JWT_SECRET");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Must be mutable if either of the following 2 cfg's apply.
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init());

    #[cfg(test)]
    {
        builder = builder.plugin(tauri_plugin_devtools::init());
    }

    #[cfg(target_os = "android")]
    {
        builder = builder.plugin(tauri_plugin_android_fs::init());
    }

    builder
        .plugin(
            tauri_plugin_log::Builder::default()
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .max_file_size(50_000 /* bytes */)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(10_usize))
                .clear_targets()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir { file_name: Some("dailies".to_string()) },
                ))
                .build(),
        )
        .setup(move |app: &mut tauri::App| {
            let _ = state::APP_HANDLE.set(app.app_handle().to_owned());

            let app_dir: PathBuf = app
                .path()
                .app_data_dir()
                .expect("failed to get app dir");

            std::fs::create_dir_all(&app_dir).expect("failed to ensure app dir");

            #[cfg(desktop)]
            {
                let window: tauri::WebviewWindow = app.get_webview_window("main").unwrap();
                window.center()?;

                #[cfg(debug_assertions)]
                {
                    window.open_devtools();
                    window.close_devtools();
                }
            }

            tauri::async_runtime::block_on(async {
                let database = db::Database::new(app_dir.clone())
                    .await
                    .expect("failed to initialize database");

                let state = state::AppState::new(database, JWT_SECRET.to_string());
                app.manage(Mutex::new(state));

                #[allow(unused_must_use)]
                dailies::insert_dailies(app.app_handle().to_owned(), chrono::Local::now()).await;
            });

            #[allow(unused_must_use)]
            tauri::async_runtime::spawn(dailies::backfill_dailies(app.app_handle().to_owned()));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            #[cfg(target_os = "android")]
            android::export_db,
            #[cfg(target_os = "android")]
            android::import_db,
            build_info::vergen_build_date,
            build_info::vergen_build_timestamp,
            build_info::vergen_cargo_target_triple,
            build_info::vergen_git_branch,
            build_info::vergen_git_describe,
            config::get_key_as_bool,
            config::get_key_as_float,
            config::get_key_as_int,
            config::get_key_as_json,
            config::get_key_as_string,
            config::set_key_as_bool,
            config::set_key_as_float,
            config::set_key_as_int,
            config::set_key_as_json,
            config::set_key_as_string,
            dailies::delete_daily,
            dailies::get_dailies_graph_data,
            dailies::get_daily_last_completed_date,
            dailies::get_quest_chain_collapsed,
            dailies::get_quest_types,
            dailies::get_total_points,
            dailies::get_weekly_max_type_stats,
            dailies::get_weekly_sum_type_stats,
            dailies::handle_point_change,
            dailies::insert_dailies,
            dailies::insert_quest,
            dailies::query_dailies,
            dailies::query_dailies_complete,
            dailies::query_quest_chains,
            dailies::query_quest_chains_complete,
            dailies::set_quest_chain_collapsed,
            dailies::update_archived,
            dailies::update_chain,
            dailies::update_days,
            dailies::update_default_points,
            dailies::update_description,
            dailies::update_name,
            dailies::update_note,
            dailies::update_requirements,
            dailies::update_sequence,
            dailies::update_streak_target,
            dailies::update_time_end,
            dailies::update_time_start,
            dailies::update_total,
            dailies::update_type,
            dailies::update_weight,
            db::create_user,
            db::delete_session,
            db::get_session,
            db::get_user,
            db::save_session,
            db::truncate_sessions,
            db::verify_user,
            state::get_jwt_secret,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
