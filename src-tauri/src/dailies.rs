use std::str::FromStr;

use anyhow::Result;
use chrono::{DateTime, Duration, Local, NaiveDate, NaiveDateTime, NaiveTime};
use serde::Deserialize;
use serde_json::Value;
use sqlx::{Acquire, Sqlite, SqliteConnection, Transaction, pool::PoolConnection, types::Json};
use tauri::Manager;
use tokio::sync::{Mutex, MutexGuard};

crate::mod_flat!(daily, enums, quest, points);

use crate::{dailies::{daily::Daily, enums::SortDirection, points::TotalPointEval, quest::{Quest, QuestSequence, QuestType, QuestTypeRecord, QuestTypeStyles}}, db::User, state, state::app_handle};

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
                chain,
                name AS "name!",
                type AS "type!: QuestType",
                points AS "points: f64",
                default_points AS "default_points!: f64",
                total AS "total!: f64",
                weight AS "weight!: f64",
                streak_target AS "streak_target: i64",
                requirements AS "requirements: Json<Value>",
                time_start AS "time_start: NaiveTime",
                time_end AS "time_end: NaiveTime",
                accepted,
                archived,
                days AS "days: Json<Vec<i64>>",
                description,
                note,
                streak AS "streak: i64",
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
) -> Result<Vec<String>, crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;

    let rows = sqlx::query_scalar!(
        r#"
            SELECT chain AS "chain!: String"
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
    quest: Quest,
) -> Result<(), crate::errors::Error> {
    let guard: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = guard.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    guard
        .db
        .register_sqlite_sha1_functions(conn)
        .await;

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

    let app_handle: &tauri::AppHandle = app_handle();
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
    value: Json<Vec<i64>>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    sqlx::query!(
        r#"UPDATE "quests" SET days = $1 WHERE id = $2;"#,
        value,
        quest_id,
    )
    .execute(pool)
    .await?;

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
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    sqlx::query!(
        r#"UPDATE "quests" SET name = $1 WHERE id = $2;"#,
        value,
        quest_id,
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[allow(unused_variables)]
#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_type(
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
    value: Option<NaiveTime>,
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
        .await;

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
        .await;

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
                WHEN type_id = "q-o" THEN NULL
                WHEN type_id = "q-w" AND INSTR(days, STRFTIME('%w', 'now')) < 1 THEN NULL
                WHEN type_id IN ("q-d", "q-w") THEN default_points
                WHEN type_id = 'q-dm' THEN (
                  SELECT COALESCE(points, 0)
                  FROM
                    "points" AS p1
                  WHERE
                    p1.quest_id = q.id
                    AND p1.date = DATE($1, '-1 days')
                  LIMIT 1
                )
                WHEN type_id LIKE 'q-w-%' THEN (
                  WITH
                    p2 AS (
                      SELECT
                        points,
                        total
                      FROM
                        "points"
                      WHERE
                        quest_id = q.id AND date > DATE(
                          $1, '-'
                          || CAST(COALESCE(CAST(q.requirements AS INT), 0) + 1 AS TEXT)
                          || ' days'
                        )
                    )
                  SELECT CASE
                      WHEN type_id LIKE '%-m'
                        THEN CASE WHEN MAX(p2.points) / p2.total = 1 THEN NULL ELSE default_points END
                      WHEN type_id LIKE '%-s'
                        THEN CASE WHEN SUM(p2.points) / SUM(p2.total) = 1 THEN NULL ELSE default_points END
                    END
                  FROM
                    p2
                )
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
              q.sequence;
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

    let current_datetime: DateTime<Local> = chrono::Local::now();
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

                let local_dt = missing_date
                    .and_time(NaiveTime::default())
                    .and_local_timezone(Local)
                    .earliest()
                    .unwrap();

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
