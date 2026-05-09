use std::{collections::HashMap, str::FromStr};

use anyhow::Result;
use chrono::{DateTime, Duration, Local, NaiveDate, NaiveDateTime, NaiveTime};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde_with::serde_as;
use sqlx::{Acquire, Sqlite, SqliteConnection, Transaction, pool::PoolConnection, sqlite::SqliteQueryResult, types::Json};
use tauri::Manager;
use tokio::sync::{Mutex, MutexGuard};

crate::mod_pub!(daily, enums, quest, point, requirements);

use crate::{dailies::{daily::Daily, enums::SortDirection, point::TotalPointEval, quest::{NewQuest, QuestChain, QuestSequence, QuestType, QuestTypeRecord, QuestTypeStyles, WeeklyQuestStats}, requirements::Requirements}, db::user::User, state, state::app_handle, utils};

#[tauri::command(async, rename_all = "snake_case")]
pub async fn query_dailies(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user: Option<&str>,
    quest_id: Option<&str>,
    start_date: &str,
    end_date: &str,
) -> Result<Vec<Daily>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    let start_date = NaiveDate::from_str(start_date)?;
    let end_date = NaiveDate::from_str(end_date)?;
    let user = user.unwrap_or("");
    let quest_id = quest_id.unwrap_or("");

    let rows: Result<Vec<Daily>, sqlx::Error> = sqlx::query_as!(
        Daily,
        r#"
            SELECT
                user AS "user!",
                date AS "date!",
                point_id AS "point_id!",
                quest_id AS "quest_id!",
                sequence AS "sequence!",
                chain AS "chain!",
                name AS "name!",
                type AS "type!: QuestType",
                points AS "points: f64",
                default_points AS "default_points!: f64",
                total AS "total!: f64",
                weight AS "weight!: f64",
                streak_target AS "streak_target: i64",
                requirements AS "requirements: Requirements",
                time_start AS "time_start: NaiveTime",
                time_end AS "time_end: NaiveTime",
                accepted AS "accepted!: NaiveDateTime",
                archived AS "archived: NaiveDateTime",
                days AS "days: Json<Vec<i64>>",
                description,
                note,
                streak AS "streak: i64",
                previous_streak AS "previous_streak: i64",
                complete AS "complete: f64",
                points_weighted AS "points_weighted: f64"
            FROM
                "dailies_weighted"
            WHERE
                user = $1
                AND ($2 = "" OR quest_id = $2)
                AND date >= $3
                AND date <= $4
            ORDER BY
                date DESC,
                sequence;
        "#,
        user,
        quest_id,
        start_date,
        end_date
    )
    .fetch_all(&state.db.pool)
    .await;

    Ok(rows?)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn query_quest_chains(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
) -> Result<Vec<QuestChain>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    let rows = sqlx::query_as!(
        QuestChain,
        r#"
            SELECT
              id AS "id!: i64",
              user_id AS "user_id!: i64",
              chain AS "chain!: String",
              sequence AS "sequence!: i64",
              collapsed AS "collapsed!: bool"
            FROM
              "quest_chains"
            WHERE
              user_id = $1
            ORDER BY
              chain;
        "#,
        // TODO(ayvi): add sorting to quest chains
        user_id,
    )
    .fetch_all(&state.db.pool)
    .await;

    Ok(rows?)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_total_points(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user: Option<&str>,
    date: &str,
) -> Result<TotalPointEval, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    let user = user.unwrap_or("");
    let date = NaiveDate::from_str(date)?;

    let row: Result<TotalPointEval, sqlx::Error> = sqlx::query_as!(
        TotalPointEval,
        r#"
            SELECT
               COALESCE(SUM(points_weighted), 0) AS "total_points!: f64",
               SUM(weight) AS "total_weight!: f64"
             FROM
               "dailies_weighted"
             WHERE
               user = $1
               AND date = $2
               AND points IS NOT NULL;
        "#,
        user,
        date,
    )
    .fetch_one(&state.db.pool)
    .await;

    Ok(row?)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_quest_types(
    state: tauri::State<'_, Mutex<state::AppState>>,
) -> Result<Vec<QuestTypeRecord>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    let row: Result<Vec<QuestTypeRecord>, sqlx::Error> = sqlx::query_as!(
        QuestTypeRecord,
        r#"
            SELECT
              id AS "id!: String",
              name AS "name!: String",
              description AS "description!: String",
              available AS "available!: bool",
              styles AS "styles!: Json<QuestTypeStyles>"
            FROM
              "types";
        "#,
    )
    .fetch_all(&state.db.pool)
    .await;

    Ok(row?)
}

/// This function doesn't get called unless the value change is valid.
#[tauri::command(async, rename_all = "snake_case")]
pub async fn handle_point_change(
    state: tauri::State<'_, Mutex<state::AppState>>,
    daily: Daily,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    if let Some(points) = daily.points {
        sqlx::query!(
            r#"UPDATE "dailies" SET points = $1 WHERE point_id = $2;"#,
            points,
            daily.point_id
        )
        .execute(&state.db.pool)
        .await?
    } else {
        sqlx::query!(
            r#"UPDATE "dailies" SET points = NULL WHERE point_id = $1;"#,
            daily.point_id,
        )
        .execute(&state.db.pool)
        .await?
    };

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn delete_daily(
    state: tauri::State<'_, Mutex<state::AppState>>,
    point_id: &str,
) -> Result<(), crate::errors::Error> {
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;
    let mut tx: Transaction<'_, Sqlite> = conn.begin().await?;

    sqlx::query!(r#"DELETE FROM "points" WHERE id = $1;"#, point_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn insert_quest(
    state: tauri::State<'_, Mutex<state::AppState>>,
    quest: NewQuest,
) -> Result<(), crate::errors::Error> {
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    guard
        .db
        .register_sqlite_sha1_functions(conn)
        .await?;

    let mut tx: Transaction<'_, Sqlite> = conn.begin().await?;

    sqlx::query(
        r#"
            INSERT INTO "quests" (
                id,
                sequence,
                user_id,
                chain,
                name,
                type_id,
                weight,
                total,
                accepted,
                archived,
                streak_target,
                requirements,
                time_start,
                time_end,
                days,
                description,
                updated
            )
            VALUES
                (
                    LOWER(SHA1_HEX((SELECT name FROM "users" WHERE id = $1 LIMIT 1) || "_" || $2 || "_" || $3)),
                    (SELECT COALESCE((SELECT MAX(sequence) + 1 FROM "quests" WHERE user_id = $1 AND chain = $2 GROUP BY chain), 1)),
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                );
        "#)
        .bind(quest.user_id)
        .bind(quest.chain)
        .bind(quest.name)
        .bind(quest.type_id)
        .bind(quest.weight)
        .bind(quest.total)
        .bind(quest.accepted)
        .bind(quest.archived)
        .bind(quest.streak_target)
        .bind(quest.requirements)
        .bind(quest.time_start)
        .bind(quest.time_end)
        .bind(quest.days)
        .bind(quest.description)
        .bind(quest.updated)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    std::mem::drop(guard);

    let app_handle: &tauri::AppHandle = app_handle().ok_or_else(|| {
        crate::errors::Error::Io(std::io::Error::other("App handle not available"))
    })?;
    let current_datetime: DateTime<Local> = Local::now();

    insert_dailies(app_handle.clone(), current_datetime).await?;

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_chain(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: String,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    sqlx::query!(
        r#"
            UPDATE "quests"
            SET
                chain = $3,
                sequence = (SELECT COALESCE((SELECT MAX(sequence) + 1 FROM "quests" WHERE user_id = $1 AND chain = $3 GROUP BY chain), 1))
            WHERE id = $2;
        "#,
        user_id,
        quest_id,
        value,
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_days(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: Option<Json<Vec<i64>>>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    match value {
        Some(days) => {
            sqlx::query!(
                r#"UPDATE "quests" SET days = $1 WHERE id = $2;"#,
                days,
                quest_id,
            )
            .execute(pool)
            .await?;
        }
        None => {
            sqlx::query!(
                r#"UPDATE "quests" SET days = NULL WHERE id = $1;"#,
                quest_id,
            )
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_name(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: String,
) -> Result<(), crate::errors::Error> {
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    guard
        .db
        .register_sqlite_sha1_functions(conn)
        .await?;

    let mut tx: Transaction<'_, Sqlite> = conn.begin().await?;

    let temp_table_name = format!("target_points_{}", utils::generate_random_string(16, None));

    let result: Result<SqliteQueryResult, sqlx::Error> = sqlx::query(
        &format!(
            r#"
                UPDATE "quests" SET name = $1 WHERE id = $2;

                CREATE TEMP TABLE
                    "{temp_table_name}" AS
                SELECT id
                FROM
                    "points"
                WHERE
                    quest_id = $2;

                UPDATE
                    "quests" AS q
                SET
                    id = LOWER(SHA1_HEX((SELECT name FROM "users" AS u WHERE u.id = q.user_id) || "_" || q.chain || "_" || q.name))
                WHERE
                    id = $2;

                UPDATE
                    "points"
                SET
                    id = LOWER(SHA1_HEX(quest_id || date))
                WHERE
                    id IN (SELECT id FROM "{temp_table_name}");
            "#,
        )
    )
    .bind(value)
    .bind(quest_id)
    .execute(&mut *tx)
    .await;

    match result {
        Ok(_) => {
            tx.commit().await?;
            std::mem::drop(guard);
            Ok(())
        }
        Err(e) => {
            tx.rollback().await?;
            std::mem::drop(guard);
            log::error!("{:?}", e);
            Err(crate::errors::Error::Sqlx(e))
        }
    }
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_type_id(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: QuestType,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    sqlx::query!(
        r#"UPDATE "quests" SET type_id = $1 WHERE id = $2;"#,
        value,
        quest_id,
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_weight(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: f64,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    sqlx::query!(
        r#"UPDATE "dailies" SET weight = $1 WHERE quest_id = $2 AND point_id = $3;"#,
        value,
        quest_id,
        point_id,
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_description(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: Option<String>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    match value {
        Some(description) => {
            sqlx::query!(
                r#"UPDATE "quests" SET description = $1 WHERE id = $2;"#,
                description,
                quest_id,
            )
            .execute(pool)
            .await?;
        }
        None => {
            sqlx::query!(
                r#"UPDATE "quests" SET description = NULL WHERE id = $1;"#,
                quest_id
            )
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_note(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: Option<String>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    match value {
        Some(note) => {
            sqlx::query!(
                r#"UPDATE "dailies" SET note = $1 WHERE point_id = $2;"#,
                note,
                point_id,
            )
            .execute(pool)
            .await?;
        }
        None => {
            sqlx::query!(
                r#"UPDATE "dailies" SET note = NULL WHERE point_id = $2;"#,
                point_id,
            )
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_time_start(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: Option<NaiveTime>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    match value {
        Some(time_start) => {
            sqlx::query!(
                r#"UPDATE "dailies" SET time_start = $1 WHERE quest_id = $2 AND point_id = $3;"#,
                time_start,
                quest_id,
                point_id,
            )
            .execute(pool)
            .await?;
        }
        None => {
            sqlx::query!(
                r#"UPDATE "dailies" SET time_start = NULL WHERE quest_id = $1 AND point_id = $2;"#,
                quest_id,
                point_id,
            )
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_time_end(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: Option<NaiveTime>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    match value {
        Some(time_end) => {
            sqlx::query!(
                r#"UPDATE "dailies" SET time_end = $1 WHERE quest_id = $2 AND point_id = $3;"#,
                time_end,
                quest_id,
                point_id,
            )
            .execute(pool)
            .await?;
        }
        None => {
            sqlx::query!(
                r#"UPDATE "dailies" SET time_end = NULL WHERE quest_id = $1 AND point_id = $2;"#,
                quest_id,
                point_id,
            )
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_requirements(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: Option<Json<Value>>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    match value {
        Some(requirements) => {
            sqlx::query!(
                r#"UPDATE "dailies" SET requirements = $1 WHERE quest_id = $2 AND point_id = $3;"#,
                requirements,
                quest_id,
                point_id,
            )
            .execute(pool)
            .await?;
        }
        None => {
            sqlx::query!(
                r#"UPDATE "dailies" SET requirements = NULL WHERE quest_id = $1 AND point_id = $2;"#,
                quest_id,
                point_id,
            )
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_total(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: f64,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    sqlx::query!(
        r#"UPDATE "dailies" SET total = $3 WHERE quest_id = $1 AND point_id = $2;"#,
        quest_id,
        point_id,
        value,
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_default_points(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: f64,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    sqlx::query!(
        r#"UPDATE "dailies" SET default_points = $1 WHERE quest_id = $2 AND point_id = $3;"#,
        value,
        quest_id,
        point_id,
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_streak_target(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: Option<f64>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    match value {
        Some(streak_target) => {
            sqlx::query!(
                r#"UPDATE "dailies" SET streak_target = $1 WHERE quest_id = $2 AND point_id = $3;"#,
                streak_target,
                quest_id,
                point_id,
            )
            .execute(pool)
            .await?;
        }
        None => {
            sqlx::query!(
                r#"UPDATE "dailies" SET streak_target = NULL WHERE quest_id = $1 AND point_id = $2;"#,
                quest_id,
                point_id,
            )
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_archived(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    quest_id: String,
    point_id: String,
    value: Option<NaiveDateTime>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    match value {
        Some(archived) => {
            sqlx::query!(
                r#"UPDATE "dailies" SET archived = $1 WHERE quest_id = $2;"#,
                archived,
                quest_id,
            )
            .execute(pool)
            .await?;
        }
        None => {
            sqlx::query!(
                r#"UPDATE "dailies" SET archived = NULL WHERE quest_id = $1;"#,
                quest_id,
            )
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_sequence(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    chain: String,
    quest_id: String,
    sequence: i64,
    sort_direction: SortDirection,
) -> Result<Vec<QuestSequence>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    state
        .db
        .register_sqlite_sha1_functions(conn)
        .await?;

    let mut tx: Transaction<'_, Sqlite> = conn.begin().await?;

    sqlx::query!(
        r#"UPDATE "quests" SET sequence = $1 WHERE id = $2;"#,
        sequence,
        quest_id,
    )
    .execute(&mut *tx)
    .await?;

    match sort_direction {
        SortDirection::Up => {
            sqlx::query!(
                r#"
                    UPDATE "quests" AS q
                    SET
                        sequence = n.row_n
                    FROM (
                        SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id, chain ORDER BY q.sequence, q.updated DESC) row_n
                        FROM
                            quests q
                        WHERE
                            chain = $1
                            AND user_id = $2
                        ORDER BY
                            chain,
                            row_n
                    ) AS n
                    WHERE
                        n.id = q.id;
                "#,
                chain,
                user_id,
            )
            .execute(&mut *tx)
            .await?;
        }
        SortDirection::Down => {
            sqlx::query!(
                r#"
                    UPDATE "quests" AS q
                    SET
                        sequence = n.row_n
                    FROM (
                        SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id, chain ORDER BY q.sequence, q.updated ASC) row_n
                        FROM
                            quests q
                        WHERE
                            chain = $1
                            AND user_id = $2
                        ORDER BY
                            chain,
                            row_n
                    ) AS n
                    WHERE
                        n.id = q.id;
                "#,
                chain,
                user_id,
            )
            .execute(&mut *tx)
            .await?;
        }
    }

    let rows: Result<Vec<QuestSequence>, sqlx::Error> = sqlx::query_as!(
        QuestSequence,
        r#"
            SELECT
                id,
                sequence
            FROM
                "quests"
            WHERE
                chain = $1
                AND user_id = $2
            ORDER BY
                sequence;
        "#,
        chain,
        user_id,
    )
    .fetch_all(&mut *tx)
    .await;

    tx.commit().await?;

    Ok(rows?)
}

#[tauri::command(async)]
pub async fn insert_dailies(
    app_handle: tauri::AppHandle,
    datetime: DateTime<Local>,
) -> Result<(), crate::errors::Error> {
    let state = app_handle.state::<Mutex<state::AppState>>();
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let date: NaiveDate = datetime.date_naive();

    guard
        .db
        .register_sqlite_sha1_functions(conn)
        .await?;

    let mut tx: Transaction<'_, Sqlite> = conn.begin().await?;

    sqlx::query!(
        r#"
            DROP TABLE IF EXISTS _staging_dailies_added;
            CREATE TABLE IF NOT EXISTS _staging_dailies_added AS
            SELECT quest_id
            FROM
              "points"
            WHERE
              date = $1
        "#,
        date,
    )
    .execute(&mut *tx)
    .await?;

    sqlx::query!(
        r#"
            DROP TABLE IF EXISTS _staging_dailies_missing;
            CREATE TABLE IF NOT EXISTS _staging_dailies_missing AS
            SELECT *
            FROM
              "quests"
            WHERE
              id NOT IN (
                SELECT quest_id
                FROM
                  _staging_dailies_added
              );
        "#,
    )
    .execute(&mut *tx)
    .await?;

    sqlx::query!(
        r#"
            DROP TABLE IF EXISTS _staging_dailies_to_add;
            CREATE TABLE IF NOT EXISTS _staging_dailies_to_add AS
            SELECT
              LOWER(SHA1_HEX(id || STRFTIME('%Y-%m-%d', $1))) AS point_id,
              id AS quest_id,
              $1 AS date,
              CASE
                WHEN archived IS NOT NULL THEN NULL
                WHEN type_id = 'q-o' THEN NULL
                /*                                             Fixed Monday week start                     */
                WHEN type_id IN ('q-w', 'q-r') AND INSTR(days, (STRFTIME('%w', 'now') + 6) % 7) < 1 THEN NULL
                WHEN type_id IN ('q-d', 'q-w', 'q-r') THEN default_points
                WHEN type_id IN ('q-dm') THEN (
                  SELECT COALESCE(points, 0)
                  FROM
                    "points" AS p1
                  WHERE
                    "p1".quest_id = q.id
                    AND "p1".date = DATE($1, '-1 days')
                  LIMIT 1
                )
                WHEN type_id = 'q-w-m' THEN (
                  WITH
                    p2 AS (
                      SELECT MAX(CASE WHEN points IS NOT NULL THEN points ELSE 0 END) AS points
                      FROM
                        "points"
                      WHERE
                        quest_id = "q".id
                        AND date >= DATE(
                          $1, '-'
                          || CAST(COALESCE(CAST(requirements ->> '$' AS INT), 0) AS TEXT)
                          || ' days'
                        )
                    )
                  SELECT CASE
                      WHEN "p2".points / "q".total = 1
                      THEN NULL ELSE "q".default_points
                    END
                  FROM
                    "p2"
                )
                WHEN type_id = 'q-w-s' THEN (
                  WITH
                    p3 AS (
                      SELECT SUM(CASE WHEN points IS NOT NULL THEN points ELSE 0 END) AS points
                      FROM
                        "points"
                      WHERE
                        quest_id = "q".id
                        -- In current week
                        AND "date" >= DATE($1, 'weekday 1', '-7 days')
                        AND "date" <= DATE($1, 'weekday 6', '+1 days')
                    )
                  SELECT CASE
                      WHEN CAST("p3".points AS REAL) >= CAST(requirements ->> '$' AS REAL)
                      THEN NULL ELSE "q".default_points
                    END
                  FROM
                    "p3"
                )
                /*
                -- Type does not exist yet
                WHEN type_id = 'q-w-?' THEN (
                  WITH
                    p4 AS (
                      SELECT SUM(CASE WHEN points IS NOT NULL THEN points ELSE 0 END) AS points
                      FROM
                        "points"
                      WHERE
                        quest_id = "q".id
                        -- Over last 7 days
                        AND date >= DATE($1, '-7 days')
                    )
                  SELECT CASE
                      WHEN CAST("p4".points AS REAL) >= CAST(requirements ->> '$' AS REAL)
                      THEN NULL ELSE "q".default_points
                    END
                  FROM
                    "p4"
                )
                */
              END AS points,
              weight,
              total,
              streak_target,
              requirements,
              time_start,
              time_end,
              NULL AS note,
              $2 AS updated
            FROM
              _staging_dailies_missing AS q
            ORDER BY
              "q".sequence;
        "#,
        date,
        datetime,
    )
    .execute(&mut *tx)
    .await?;

    sqlx::query!(r#"INSERT INTO "points" SELECT * FROM _staging_dailies_to_add;"#,)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    std::mem::drop(guard);

    Ok(())
}

#[tauri::command(async)]
pub async fn backfill_dailies(app_handle: tauri::AppHandle) -> Result<(), crate::errors::Error> {
    let state = app_handle.state::<Mutex<state::AppState>>();

    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let users: Vec<User> =
        sqlx::query_as!(User, r#"SELECT id, name, created, updated FROM "users";"#,)
            .fetch_all(&mut *conn)
            .await?;

    std::mem::drop(guard);

    let current_datetime: DateTime<Local> = Local::now();
    let current_date = current_datetime.date_naive();

    for user in users {
        let guard: MutexGuard<'_, state::AppState> = state.lock().await;
        let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
        let conn: &mut SqliteConnection = pool.acquire().await?;

        let last_point_date: Option<NaiveDate> = sqlx::query_scalar!(
            r#"
                SELECT DISTINCT date
                FROM "points"
                LEFT JOIN
                    "quests"
                ON
                    "quests".id = "points".quest_id
                WHERE
                    "quests".user_id  = $1
                ORDER BY
                    date DESC
                LIMIT 1 OFFSET 1;
            "#,
            user.id,
        )
        .fetch_optional(&mut *conn)
        .await?;

        if let Some(date) = last_point_date {
            let target_date = current_date - Duration::days(1);

            if target_date == date {
                continue;
            };

            let mut missing_date = date;

            std::mem::drop(guard);

            while missing_date < current_date {
                missing_date += Duration::days(1);

                let local_dt = match missing_date
                    .and_time(NaiveTime::default())
                    .and_local_timezone(Local)
                    .earliest()
                {
                    Some(dt) => dt,
                    None => {
                        log::error!(
                            "Failed to convert date {} to local timezone, skipping backfill",
                            missing_date
                        );
                        continue;
                    }
                };

                let duration = std::time::Duration::from_secs(20);
                let insert_dailies_future = insert_dailies(app_handle.clone(), local_dt);
                match tokio::time::timeout(duration, insert_dailies_future).await {
                    Ok(_) => {
                        log::debug!(
                            "Backfilled points for user {0} on {1}",
                            user.id,
                            missing_date
                        )
                    }
                    Err(_) => {
                        log::error!(
                            "Timed out on backfill for user {0} on {1}",
                            user.id,
                            missing_date
                        )
                    }
                }
            }
        }
    }

    Ok(())
}

#[allow(clippy::upper_case_acronyms)]
#[derive(Debug, Deserialize)]
pub(crate) enum GraphType {
    YTD,
    Last365,
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_dailies_graph_data(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user: &str,
    graph_type: GraphType,
) -> Result<Vec<Vec<Option<f64>>>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    const WEEKS: usize = 53;
    const DAYS_PER_WEEK: usize = 7;

    let mut matrix: Vec<Vec<Option<f64>>> = vec![vec![None; DAYS_PER_WEEK]; WEEKS];

    let values: Vec<Option<f64>> = match graph_type {
        GraphType::YTD => {
            sqlx::query_scalar!(
                r#"
                    WITH RECURSIVE date_range("date") AS (
                      VALUES(DATE(DATE(CURRENT_TIMESTAMP, 'localtime'), 'start of year'))
                      UNION ALL
                      SELECT DATE("date", '+1 day')
                      FROM
                        date_range
                      WHERE
                        "date" < DATE(DATE(CURRENT_TIMESTAMP, 'localtime'), 'start of year', '+12 months', '-1 day')
                    )
                    SELECT SUM(dw.points_weighted) / SUM(dw.weight) AS "value: f64"
                    FROM
                      date_range dr
                    LEFT JOIN
                        dailies_weighted dw
                    ON
                        dw.date = dr.date
                    WHERE
                        user = $1
                        AND points IS NOT NULL
                    GROUP BY
                        dr.date
                    ORDER BY
                        dr.date DESC;
                "#,
                user,
            )
            .fetch_all(&mut *conn)
            .await?
        }
        GraphType::Last365 => {
            sqlx::query_scalar!(
                r#"
                    WITH RECURSIVE date_range("date") AS (
                      VALUES(DATE(DATE(CURRENT_TIMESTAMP, 'localtime') - '365 day'))
                      UNION ALL
                      SELECT DATE("date", '+1 day')
                      FROM
                        date_range
                      WHERE
                        "date" <= DATE(CURRENT_TIMESTAMP, 'localtime')
                    )
                    SELECT SUM(dw.points_weighted) / SUM(dw.weight) AS "value: f64"
                    FROM
                      date_range dr
                    LEFT JOIN
                        dailies_weighted dw
                    ON
                        dw.date = dr.date
                    WHERE
                        user = $1
                        AND points IS NOT NULL
                    GROUP BY
                        dr.date
                    ORDER BY
                        dr.date DESC
                    LIMIT 365;
                "#,
                user,
            )
            .fetch_all(&mut *conn)
            .await?
        }
    };

    // let chunks: Vec<Vec<f64>> = values
    //     .chunks_exact(7)
    //     .map(|s| s.to_vec())
    //     .collect();

    let chunks: Vec<&[Option<f64>]> = values.chunks(7).collect();

    for (column_idx, chunk) in chunks.iter().enumerate() {
        for (row_idx, value) in chunk.iter().enumerate() {
            if let Some(v) = value {
                let mut owned_value = v.to_owned();
                owned_value *= 100.0;
                matrix[column_idx][row_idx] = Some(owned_value);
            }
        }
    }

    Ok(matrix)
}

#[derive(
    Debug, Default, Clone, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow,
)]
#[serde_as]
pub struct QuestChainsCompleteDataPoint {
    pub date: NaiveDate,
    pub chain: String,
    pub value: f64,
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn query_quest_chains_complete(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user: &str,
    start_date: &str,
    end_date: &str,
) -> Result<HashMap<String, Vec<QuestChainsCompleteDataPoint>>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let start_date = NaiveDate::from_str(start_date)?;
    let end_date = NaiveDate::from_str(end_date)?;

    let rows: Vec<QuestChainsCompleteDataPoint> = sqlx::query_as!(
        QuestChainsCompleteDataPoint,
        r#"
            SELECT
                date,
                chain,
                SUM(points_weighted) / SUM(weight) AS "value!: f64"
            FROM
                "dailies_weighted"
            WHERE
                user = $1
                AND points IS NOT NULL
                AND date >= $2
                AND date <= $3
            GROUP BY
                date,
                chain
            ORDER BY
                date DESC;
        "#,
        user,
        start_date,
        end_date
    )
    .fetch_all(&mut *conn)
    .await?;

    let grouped: HashMap<String, Vec<QuestChainsCompleteDataPoint>> =
        rows.iter().fold(HashMap::new(), |mut acc, e| {
            acc.entry(e.chain.to_owned())
                .or_insert(Vec::new());
            acc.entry(e.chain.to_owned())
                .or_insert(Vec::new())
                .push(e.to_owned());
            acc
        });

    Ok(grouped)
}

#[derive(Default, Serialize, Deserialize, sqlx::Decode, sqlx::Encode, sqlx::FromRow)]
#[serde_as]
pub struct DailiesCompleteDataPoint {
    pub date: NaiveDate,
    pub value: f64,
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn query_dailies_complete(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user: &str,
    start_date: &str,
    end_date: &str,
) -> Result<Vec<DailiesCompleteDataPoint>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let start_date = NaiveDate::from_str(start_date)?;
    let end_date = NaiveDate::from_str(end_date)?;

    let rows: Result<Vec<DailiesCompleteDataPoint>, sqlx::Error> = sqlx::query_as!(
        DailiesCompleteDataPoint,
        r#"
            SELECT
                date,
                SUM(points_weighted) / SUM(weight) AS "value!: f64"
            FROM
                "dailies_weighted"
            WHERE
                user = $1
                AND points IS NOT NULL
                AND date >= $2
                AND date <= $3
            GROUP BY
                date
            ORDER BY
                date DESC;
        "#,
        user,
        start_date,
        end_date
    )
    .fetch_all(&mut *conn)
    .await;

    Ok(rows?)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_quest_chain_collapsed(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    chain: &str,
) -> Result<bool, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let value: bool = sqlx::query_scalar!(
        r#"SELECT collapsed AS "collapsed!: bool" FROM "quest_chains" WHERE user_id = $1 AND chain = $2;"#,
        user_id,
        chain,
    )
    .fetch_one(&mut *conn)
    .await?;

    Ok(value)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn set_quest_chain_collapsed(
    state: tauri::State<'_, Mutex<state::AppState>>,
    user_id: i64,
    chain: &str,
    value: bool,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    sqlx::query!(
        r#"UPDATE "quest_chains" SET collapsed = $1 WHERE user_id = $2 AND chain = $3;"#,
        value,
        user_id,
        chain,
    )
    .execute(&mut *conn)
    .await?;

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_weekly_sum_type_stats(
    state: tauri::State<'_, Mutex<state::AppState>>,
    quest_id: &str,
    requirements: i64,
    date: &str,
) -> Result<WeeklyQuestStats, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let parsed_date = NaiveDate::from_str(date)?;

    let row: WeeklyQuestStats = sqlx::query_as!(
        WeeklyQuestStats,
        r#"
            WITH dailies_L AS (
              SELECT
                date,
                quest_id,
                point_id,
                requirements,
                LAST_VALUE(CASE WHEN complete = 1 THEN date ELSE NULL END) OVER(
                  PARTITION BY quest_id ORDER BY date DESC
                ) AS last_complete_date
              FROM
                "dailies"
              WHERE
                quest_id = $1
              ),
              weekly_sum_requirements as (
                SELECT
                  point_id,
                  date,
                  SUM(CASE WHEN points IS NOT NULL THEN points ELSE 0 END) OVER(ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS weekly_sum_rolling
                FROM
                  "dailies"
                WHERE
                  quest_id = $1
              )
            SELECT
              "d".date AS "date!: NaiveDate",
              "d".quest_id AS "quest_id!: String",
              "d".point_id AS "point_id!: String",
              CAST("d".requirements ->> '$' AS REAL) AS "requirements!: f64",
              (
                SELECT MAX(last_complete_date)
                FROM
                  "dailies_L"
                WHERE
                  quest_id = "d".quest_id
                  AND date <= "d".date
              ) AS "latest_complete_date!: Option<NaiveDate>",
              "wsr".weekly_sum_rolling AS "rolling_points!: f64",
              "wsr".weekly_sum_rolling >= CAST("d".requirements ->> '$' AS REAL) AS "is_weekly_requirement_complete!: bool"
            FROM
              "dailies_L" AS "d"
            LEFT JOIN
            	weekly_sum_requirements "wsr"
            ON
              "d".point_id = "wsr".point_id
              AND "wsr".date >= DATE("d".date, '-7 days')
            WHERE
              "d".date = $2;
        "#,
        quest_id,
        parsed_date,
    )
    .fetch_one(&mut *conn)
    .await?;

    Ok(row)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_weekly_max_type_stats(
    state: tauri::State<'_, Mutex<state::AppState>>,
    quest_id: &str,
    requirements: i64,
    date: &str,
) -> Result<WeeklyQuestStats, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let parsed_date = NaiveDate::from_str(date)?;

    let row: WeeklyQuestStats = sqlx::query_as(
        &format!(
            r#"
                WITH dailies_L AS (
                  SELECT
                    date,
                    quest_id,
                    point_id,
                    total,
                    requirements,
                    LAST_VALUE(CASE WHEN complete = 1 THEN date ELSE NULL END) OVER(
                      PARTITION BY quest_id ORDER BY date DESC
                    ) AS last_complete_date,
                    MAX(CASE WHEN points IS NOT NULL THEN points ELSE 0 END) OVER(ORDER BY date ROWS BETWEEN {} PRECEDING AND CURRENT ROW) AS rolling_points
                  FROM
                    "dailies"
                  WHERE
                    quest_id = $1
                  )
                SELECT
                  "d".date,
                  "d".quest_id,
                  "d".point_id,
                  CAST("d".requirements ->> '$' AS REAL) AS requirements,
                  (
                    SELECT MAX(last_complete_date)
                    FROM
                      "dailies_L"
                    WHERE
                      quest_id = "d".quest_id
                      AND date <= "d".date
                  ) AS latest_complete_date,
                  CAST("d".rolling_points AS REAL) AS rolling_points,
                  CAST("d".rolling_points AS REAL) = CAST("d".total AS REAL) AS is_weekly_requirement_complete
                FROM
                  "dailies_L" AS "d"
                WHERE
                  "d".date = $2
            "#,
            requirements,
        )
    )
    .bind(quest_id)
    .bind(parsed_date)
    .fetch_one(&mut *conn)
    .await?;

    Ok(row)
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_daily_last_completed_date(
    state: tauri::State<'_, Mutex<state::AppState>>,
    quest_id: &str,
) -> Result<NaiveDate, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    let value: NaiveDate = sqlx::query_scalar!(
        r#"
            SELECT DISTINCT FIRST_VALUE(date) OVER(
                PARTITION BY quest_id
                ORDER BY
                    CASE WHEN date IS NULL THEN 1 ELSE 0 END,
                    CASE WHEN complete = 1 THEN 0 ELSE 1 END,
                    date desc) AS "last_complete_date!: NaiveDate"
            FROM
                "dailies"
            WHERE
                quest_id = $1
            LIMIT 1;
        "#,
        quest_id,
    )
    .fetch_one(&mut *conn)
    .await?;

    Ok(value)
}
