use std::str::FromStr;

use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use sqlx::{Executor, Pool, Postgres};
use tauri::State;
use tokio::sync::{Mutex, MutexGuard};

crate::mod_flat!(daily, enums);

use daily::Daily;

use crate::{state, utils};

// https://docs.rs/sqlx/0.5.13/sqlx/macro.query.html#type-overrides-output-columns

#[tauri::command(async)]
pub async fn get_routines(
    app: tauri::AppHandle,
    state: State<'_, Mutex<state::AppState>>,
) -> Result<Vec<Daily>, ()> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    // TODO(ayvi): pulling fixed date for dev
    // let date: NaiveDate = chrono::Local::now().date_naive();
    let date: NaiveDate = chrono::NaiveDate::from_str("2025-10-03").unwrap();

    let rows: Result<Vec<Daily>, sqlx::Error> = sqlx::query_as!(
        Daily,
        r#"SELECT
           date AS "date!",
           name AS "name!",
           type AS "type!",
           "group" AS "group!",
           value,
           ordinal_pos AS "ordinal_pos!",
           value_id AS "value_id!",
           routine_id AS "routine_id!",
           max_value AS "max_value!",
           weight AS "weight!",
           date_started AS "date_started!",
           date_archived,
           weighted_value,
           time_min,
           time_max,
           time_bucket_min,
           time_bucket_max,
           notes,
           weekdays,
           n_days,
           streak
         FROM
           dailies.weighted_values
         WHERE
           date = $1
         ORDER BY
           ordinal_pos;"#,
        date
    )
    .fetch_all(&state.connection_pool)
    .await;

    let mut dailies: Vec<Daily> = vec![];

    match rows {
        Ok(r) => dailies.extend(r),
        Err(e) => utils::emit_app_error(&app, "tauri://error", &e),
    }

    Ok(dailies)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn query_routine_history(
    app: tauri::AppHandle,
    state: State<'_, Mutex<state::AppState>>,
    routine_id: &str,
    start_date: &str,
    end_date: &str,
) -> Result<Vec<Daily>, ()> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    let rows: Result<Vec<Daily>, sqlx::Error> = sqlx::query_as!(
        Daily,
        r#"SELECT
           date AS "date!",
           name AS "name!",
           type AS "type!",
           "group" AS "group!",
           value,
           ordinal_pos AS "ordinal_pos!",
           value_id AS "value_id!",
           routine_id AS "routine_id!",
           max_value AS "max_value!",
           weight AS "weight!",
           date_started AS "date_started!",
           date_archived,
           weighted_value,
           time_min,
           time_max,
           time_bucket_min,
           time_bucket_max,
           notes,
           weekdays,
           n_days,
           streak
         FROM
           dailies.weighted_values
         WHERE
           routine_id = $1
           AND date >= $2
           AND date <= $3
         ORDER BY
           date DESC"#,
        routine_id,
        NaiveDate::from_str(start_date).unwrap(),
        NaiveDate::from_str(end_date).unwrap()
    )
    .fetch_all(&state.connection_pool)
    .await;

    let mut dailies: Vec<Daily> = vec![];

    match rows {
        Ok(r) => dailies.extend(r),
        Err(e) => utils::emit_app_error(&app, "tauri://error", &e),
    }

    Ok(dailies)
}

#[derive(Default, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde_as]
pub struct WeightedEval {
    #[serde_as(as = "Decimal")]
    pub weighted_total: Decimal,
    #[serde_as(as = "Decimal")]
    pub total_weight: Decimal,
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_weighted_eval(
    app: tauri::AppHandle,
    state: State<'_, Mutex<state::AppState>>,
    date: &str,
) -> Result<WeightedEval, ()> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    let row: Result<WeightedEval, sqlx::Error> = sqlx::query_as!(
        WeightedEval,
        r#"SELECT
           SUM(weighted_value) AS "weighted_total!",
           SUM(weight) AS "total_weight!"
         FROM
           dailies.weighted_values
         WHERE
           date = $1"#,
        NaiveDate::from_str(date).unwrap(),
    )
    .fetch_one(&state.connection_pool)
    .await;

    row.map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
}

/// This function doesn't get called unless the value change is valid.
#[tauri::command(async, rename_all = "snake_case")]
pub async fn handle_value_change(
    app: tauri::AppHandle,
    state: State<'_, Mutex<state::AppState>>,
    routine: Daily,
) -> Result<(), ()> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    if let Some(value) = routine.value {
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.values SET value = $1 WHERE value_id = $2",
                value,
                routine.value_id
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap()
    } else {
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.values SET value = NULL WHERE value_id = $1",
                routine.value_id,
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap()
    };

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_daily(
    app: tauri::AppHandle,
    state: State<'_, Mutex<state::AppState>>,
    original_daily: Daily,
    new_daily: Daily,
) -> Result<(), ()> {
    println!("Received updated event");
    println!("original_daily: {:?}", original_daily);
    println!("new_daily: {:?}", new_daily);

    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    if !original_daily
        .ordinal_pos
        .eq(&new_daily.ordinal_pos)
    {
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.routines SET ordinal_pos = $1 WHERE routine_id = $2",
                new_daily.ordinal_pos,
                original_daily.routine_id,
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap();
    }

    if !original_daily.name.eq(&new_daily.name) {
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.routines SET name = $1 WHERE routine_id = $2",
                new_daily.name,
                original_daily.routine_id,
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap();
    }

    if !original_daily.group.eq(&new_daily.group) {
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.routines SET \"group\" = $1 WHERE routine_id = $2",
                std::convert::Into::<&str>::into(new_daily.group),
                original_daily.routine_id,
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap();
    }

    if !original_daily.r#type.eq(&new_daily.r#type) {
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.routines SET type = $1 WHERE routine_id = $2",
                std::convert::Into::<&str>::into(new_daily.r#type),
                original_daily.routine_id,
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap();
    }

    if !original_daily.max_value.eq(&new_daily.max_value) {
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.routines SET max_value = $1 WHERE routine_id = $2",
                new_daily.max_value,
                original_daily.routine_id,
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap();
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.values SET max_value = $1 WHERE value_id = $2",
                new_daily.max_value,
                original_daily.value_id,
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap();
    }

    if !original_daily.weight.eq(&new_daily.weight) {
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.routines SET weight = $1 WHERE routine_id = $2",
                new_daily.weight,
                original_daily.routine_id,
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap();
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.values SET weight = $1 WHERE value_id = $2",
                new_daily.weight,
                original_daily.value_id,
            ))
            .await
            .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
            .unwrap();
    }

    match original_daily.notes {
        Some(notes) => {
            if let Some(new_notes) = new_daily.notes {
                if !notes.eq(&new_notes) {
                    state
                        .connection_pool
                        .execute(sqlx::query!(
                            "UPDATE dailies.routines SET notes = $1 WHERE routine_id = $2",
                            new_notes,
                            original_daily.routine_id,
                        ))
                        .await
                        .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                        .unwrap();
                }
            }
        }
        None => {
            if let Some(new_notes) = new_daily.notes {
                state
                    .connection_pool
                    .execute(sqlx::query!(
                        "UPDATE dailies.routines SET notes = $1 WHERE routine_id = $2",
                        new_notes,
                        original_daily.routine_id,
                    ))
                    .await
                    .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                    .unwrap();
            }
        }
    }

    match original_daily.n_days {
        Some(n_days) => {
            if let Some(new_n_days) = new_daily.n_days {
                if !n_days.eq(&new_n_days) {
                    state
                        .connection_pool
                        .execute(sqlx::query!(
                            "UPDATE dailies.routines SET n_days = $1 WHERE routine_id = $2",
                            new_n_days,
                            original_daily.routine_id,
                        ))
                        .await
                        .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                        .unwrap();
                    state
                        .connection_pool
                        .execute(sqlx::query!(
                            "UPDATE dailies.values SET n_days = $1 WHERE value_id = $2",
                            new_n_days,
                            original_daily.value_id,
                        ))
                        .await
                        .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                        .unwrap();
                }
            }
        }
        None => {
            if let Some(new_n_days) = new_daily.n_days {
                state
                    .connection_pool
                    .execute(sqlx::query!(
                        "UPDATE dailies.routines SET n_days = $1 WHERE routine_id = $2",
                        new_n_days,
                        original_daily.routine_id,
                    ))
                    .await
                    .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                    .unwrap();
                state
                    .connection_pool
                    .execute(sqlx::query!(
                        "UPDATE dailies.values SET n_days = $1 WHERE value_id = $2",
                        new_n_days,
                        original_daily.value_id,
                    ))
                    .await
                    .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                    .unwrap();
            }
        }
    }

    match original_daily.weekdays {
        Some(weekdays) => {
            if let Some(new_weekdays) = new_daily.weekdays {
                if !weekdays.eq(&new_weekdays) {
                    state
                        .connection_pool
                        .execute(sqlx::query!(
                            "UPDATE dailies.routines SET weekdays = $1 WHERE routine_id = $2",
                            new_weekdays,
                            original_daily.routine_id,
                        ))
                        .await
                        .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                        .unwrap();
                }
            }
        }
        None => {
            if let Some(new_weekdays) = new_daily.weekdays {
                state
                    .connection_pool
                    .execute(sqlx::query!(
                        "UPDATE dailies.routines SET weekdays = $1 WHERE routine_id = $2",
                        new_weekdays,
                        original_daily.routine_id,
                    ))
                    .await
                    .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                    .unwrap();
            }
        }
    }

    match original_daily.date_archived {
        Some(date_archived) => {
            if let Some(new_date_archived) = new_daily.date_archived {
                if !date_archived.eq(&new_date_archived) {
                    state
                        .connection_pool
                        .execute(sqlx::query!(
                            "UPDATE dailies.routines SET date_archived = $1 WHERE routine_id = $2",
                            new_date_archived,
                            original_daily.routine_id,
                        ))
                        .await
                        .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                        .unwrap();
                }
            }
        }
        None => {
            if let Some(new_date_archived) = new_daily.date_archived {
                state
                    .connection_pool
                    .execute(sqlx::query!(
                        "UPDATE dailies.routines SET date_archived = $1 WHERE routine_id = $2",
                        new_date_archived,
                        original_daily.routine_id,
                    ))
                    .await
                    .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                    .unwrap();
            }
        }
    }

    match original_daily.time_min {
        Some(time_min) => {
            if let Some(new_time_min) = new_daily.time_min {
                if !time_min.eq(&new_time_min) {
                    state
                        .connection_pool
                        .execute(sqlx::query!(
                            "UPDATE dailies.routines SET time_min = $1 WHERE routine_id = $2",
                            new_time_min,
                            original_daily.routine_id,
                        ))
                        .await
                        .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                        .unwrap();
                    state
                        .connection_pool
                        .execute(sqlx::query!(
                            "UPDATE dailies.values SET time_min = $1 WHERE value_id = $2",
                            new_time_min,
                            original_daily.value_id,
                        ))
                        .await
                        .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                        .unwrap();
                }
            }
        }
        None => {
            if let Some(new_time_min) = new_daily.time_min {
                state
                    .connection_pool
                    .execute(sqlx::query!(
                        "UPDATE dailies.routines SET time_min = $1 WHERE routine_id = $2",
                        new_time_min,
                        original_daily.routine_id,
                    ))
                    .await
                    .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                    .unwrap();
                state
                    .connection_pool
                    .execute(sqlx::query!(
                        "UPDATE dailies.values SET time_min = $1 WHERE value_id = $2",
                        new_time_min,
                        original_daily.value_id,
                    ))
                    .await
                    .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                    .unwrap();
            }
        }
    }

    match original_daily.time_max {
        Some(time_max) => {
            if let Some(new_time_max) = new_daily.time_max {
                if !time_max.eq(&new_time_max) {
                    state
                        .connection_pool
                        .execute(sqlx::query!(
                            "UPDATE dailies.routines SET time_max = $1 WHERE routine_id = $2",
                            new_time_max,
                            original_daily.routine_id,
                        ))
                        .await
                        .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                        .unwrap();
                    state
                        .connection_pool
                        .execute(sqlx::query!(
                            "UPDATE dailies.values SET time_max = $1 WHERE value_id = $2",
                            new_time_max,
                            original_daily.value_id,
                        ))
                        .await
                        .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                        .unwrap();
                }
            }
        }
        None => {
            if let Some(new_time_max) = new_daily.time_max {
                state
                    .connection_pool
                    .execute(sqlx::query!(
                        "UPDATE dailies.routines SET time_max = $1 WHERE routine_id = $2",
                        new_time_max,
                        original_daily.routine_id,
                    ))
                    .await
                    .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                    .unwrap();
                state
                    .connection_pool
                    .execute(sqlx::query!(
                        "UPDATE dailies.values SET time_max = $1 WHERE value_id = $2",
                        new_time_max,
                        original_daily.value_id,
                    ))
                    .await
                    .map_err(|e| utils::emit_app_error(&app, "tauri://error", &e))
                    .unwrap();
            }
        }
    }

    Ok(())
}
