use chrono::{NaiveDate, NaiveTime};
use rust_decimal::{Decimal, prelude::ToPrimitive};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use sqlx::{Decode, Encode, Executor, FromRow};
use tauri::{Emitter, State};
use tokio::sync::{Mutex, MutexGuard};

use crate::{messages, state};

#[derive(Debug, Default, Serialize, Deserialize, Decode, Encode, FromRow)]
#[serde(rename_all = "camelCase")]
#[serde_as]
pub struct Daily {
    pub value_id: String,
    pub routine_id: String,
    pub name: String,
    pub group: String,
    pub r#type: String,
    pub max_value: i64,
    pub weight: f64,
    pub notes: Option<String>,
    pub weekdays: Option<String>,
    #[serde_as(as = "Option<NaiveDate>")]
    pub date: Option<NaiveDate>,
    #[serde_as(as = "Option<NaiveDate>")]
    pub date_started: Option<NaiveDate>,
    #[serde_as(as = "Option<NaiveDate>")]
    pub date_archived: Option<NaiveDate>,
    #[serde_as(as = "Option<Decimal>")]
    pub value: Option<Decimal>,
    #[serde_as(as = "Option<Decimal>")]
    pub weighted_value: Option<Decimal>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_min: Option<NaiveTime>,
    #[serde_as(as = "Option<NaiveTime>")]
    pub time_max: Option<NaiveTime>,
    // pub ordinal_pos: Option<i64>,
    // n_days: Option<f64>, // TODO: change to integer
    // time_bucket_min: Option<f64>, // TODO: change to integer
    // time_bucket_max: Option<f64>, // TODO: change to integer
    // external_source: Option<String>,
    // dt_modified: Option<NaiveDateTime>,
    // related_routines: Option<String>,
    // r_increment: Option<i64>,
}

#[tauri::command(async)]
pub async fn get_routines(
    app: tauri::AppHandle, state: State<'_, Mutex<state::AppState>>,
) -> Result<Vec<Daily>, ()> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    let rows: Result<Vec<Daily>, sqlx::Error> = sqlx::query_as::<_, Daily>(
        "SELECT
           value_id,
           routine_id,
           name,
           date,
           \"group\",
           type,
           max_value,
           weight,
           date_started,
           date_archived,
           value,
           weighted_value,
           time_min,
           time_max,
           notes,
           weekdays
         FROM
           dailies.weighted_values
         WHERE
           date = '2025-10-03'
         ORDER BY
           ordinal_pos;",
    )
    .fetch_all(&state.connection_pool)
    .await;

    let mut dailies: Vec<Daily> = vec![];

    match rows {
        Ok(r) => dailies.extend(r),
        Err(e) => app
            .emit(
                "tauri://error",
                messages::ErrorMessage { message: &e.to_string() },
            )
            .unwrap(),
    }

    Ok(dailies)
}

/// This function doesn't get called unless the value change is valid.
#[tauri::command(async, rename_all = "snake_case")]
#[allow(unused_must_use)] // TODO(ayvi): toast if query errors
pub async fn handle_value_change(
    state: State<'_, Mutex<state::AppState>>, routine: Daily,
) -> Result<(), ()> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    if let Some(value) = routine.value {
        state
            .connection_pool
            .execute(sqlx::query!(
                "UPDATE dailies.values SET value = $1 WHERE value_id = $2",
                value.to_f64().unwrap(),
                routine.value_id
            ))
            .await
            .unwrap()
    } else {
        state
            .connection_pool
            .execute(
                sqlx::query!("UPDATE dailies.values SET value = NULL WHERE value_id = $1", routine.value_id)
            )
            .await
            // TODO(ayvi): map err to app.emit
            .unwrap()
    };

    Ok(())
}
