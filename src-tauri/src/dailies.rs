use std::str::FromStr;

use anyhow::Result;
use chrono::{NaiveDate, NaiveTime};
use serde_json::Value;
use sqlx::{Acquire, Sqlite, SqliteConnection, Transaction, pool::PoolConnection, types::Json};
use tokio::sync::{Mutex, MutexGuard};

crate::mod_flat!(daily, enums);

use crate::{dailies::{daily::{Daily, TotalPointEval}, enums::DailyType}, state};

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
                type AS "type!: DailyType",
                points AS "points: f64",
                total AS "total!: f64",
                weight AS "weight!: f64",
                streak_target AS "streak_target: i64",
                requirements AS "requirements: Json<Value>",
                time_min AS "time_min: NaiveTime",
                time_max AS "time_max: NaiveTime",
                accepted,
                archived,
                days AS "days: Json<Vec<i64>>",
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
        r#"SELECT
           COALESCE(SUM(points_weighted), 0) AS "total_points!: f64",
           SUM(weight) AS "total_weight!: f64"
         FROM
           "dailies_weighted"
         WHERE
           user = $1
           AND date = $2
        "#,
        user,
        date,
    )
    .fetch_one(&state.db.pool)
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
            r#"UPDATE "dailies" SET points = $1 WHERE point_id = $2"#,
            points,
            daily.point_id
        )
        .execute(&state.db.pool)
        .await?
    } else {
        sqlx::query!(
            r#"UPDATE "dailies" SET points = NULL WHERE point_id = $1"#,
            daily.point_id,
        )
        .execute(&state.db.pool)
        .await?
    };

    Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn update_daily(
    state: tauri::State<'_, Mutex<state::AppState>>,
    original_daily: Daily,
    new_daily: Daily,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let pool: &sqlx::Pool<sqlx::Sqlite> = &state.db.pool;

    if !original_daily.sequence.eq(&new_daily.sequence) {
        sqlx::query!(
            r#"UPDATE "quests" SET sequence = $1 WHERE id = $2"#,
            new_daily.sequence,
            original_daily.quest_id,
        )
        .execute(pool)
        .await?;
    }

    if !original_daily.name.eq(&new_daily.name) {
        sqlx::query!(
            r#"UPDATE "quests" SET name = $1 WHERE id = $2"#,
            new_daily.name,
            original_daily.quest_id,
        )
        .execute(pool)
        .await?;
    }

    if !original_daily.chain.eq(&new_daily.chain) {
        sqlx::query!(
            r#"UPDATE "quests" SET chain = $1 WHERE id = $2"#,
            new_daily.chain,
            original_daily.quest_id,
        )
        .execute(pool)
        .await?;
    }

    if !original_daily.r#type.eq(&new_daily.r#type) {
        sqlx::query!(
            r#"UPDATE "dailies" SET type = $1 WHERE quest_id = $2 AND date = $3"#,
            new_daily.r#type,
            original_daily.quest_id,
            original_daily.date,
        )
        .execute(pool)
        .await?;
    }

    if !original_daily.total.eq(&new_daily.total) {
        sqlx::query!(
            r#"UPDATE "quests" SET total = $1 WHERE id = $2"#,
            new_daily.total,
            original_daily.quest_id,
        )
        .execute(pool)
        .await?;
        sqlx::query!(
            r#"UPDATE "dailies" SET total = $1 WHERE point_id = $2"#,
            new_daily.total,
            original_daily.point_id,
        )
        .execute(pool)
        .await?;
    }

    if !original_daily.weight.eq(&new_daily.weight) {
        sqlx::query!(
            r#"UPDATE "quests" SET weight = $1 WHERE id = $2"#,
            new_daily.weight,
            original_daily.quest_id,
        )
        .execute(pool)
        .await?;
        sqlx::query!(
            r#"UPDATE "dailies" SET weight = $1 WHERE point_id = $2"#,
            new_daily.weight,
            original_daily.point_id,
        )
        .execute(pool)
        .await?;
    }

    match original_daily.note {
        Some(note) => {
            if let Some(new_note) = new_daily.note
                && !note.eq(&new_note)
            {
                sqlx::query!(
                    r#"UPDATE "quests" SET note = $1 WHERE id = $2"#,
                    new_note,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
            }
        }
        None => {
            if let Some(new_note) = new_daily.note {
                sqlx::query!(
                    r#"UPDATE "quests" SET note = $1 WHERE id = $2"#,
                    new_note,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
            }
        }
    }

    match original_daily.requirements {
        Some(requirements) => {
            if let Some(new_requirements) = new_daily.requirements
                && !requirements.eq(&new_requirements)
            {
                sqlx::query!(
                    r#"UPDATE "quests" SET requirements = $1 WHERE id = $2"#,
                    new_requirements,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
                sqlx::query!(
                    r#"UPDATE "dailies" SET requirements = $1 WHERE point_id = $2"#,
                    new_requirements,
                    original_daily.point_id,
                )
                .execute(pool)
                .await?;
            }
        }
        None => {
            if let Some(new_requirements) = new_daily.requirements {
                sqlx::query!(
                    r#"UPDATE "quests" SET requirements = $1 WHERE id = $2"#,
                    new_requirements,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
                sqlx::query!(
                    r#"UPDATE "dailies" SET requirements = $1 WHERE point_id = $2"#,
                    new_requirements,
                    original_daily.point_id,
                )
                .execute(pool)
                .await?;
            }
        }
    }

    match original_daily.days {
        Some(days) => {
            if let Some(new_days) = new_daily.days
                && !days.eq(&new_days)
            {
                sqlx::query!(
                    r#"UPDATE "quests" SET days = $1 WHERE id = $2"#,
                    new_days,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
            }
        }
        None => {
            if let Some(new_weekdays) = new_daily.days {
                sqlx::query!(
                    r#"UPDATE "quests" SET days = $1 WHERE id = $2"#,
                    new_weekdays,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
            }
        }
    }

    match original_daily.archived {
        Some(archived) => {
            if let Some(new_archived) = new_daily.archived
                && !archived.eq(&new_archived)
            {
                sqlx::query!(
                    r#"UPDATE "quests" SET archived = $1 WHERE id = $2"#,
                    new_archived,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
            }
        }
        None => {
            if let Some(new_archived) = new_daily.archived {
                sqlx::query!(
                    r#"UPDATE "quests" SET archived = $1 WHERE id = $2"#,
                    new_archived,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
            }
        }
    }

    match original_daily.time_min {
        Some(time_min) => {
            if let Some(new_time_min) = new_daily.time_min
                && !time_min.eq(&new_time_min)
            {
                sqlx::query!(
                    r#"UPDATE "quests" SET time_min = $1 WHERE id = $2"#,
                    new_time_min,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
                sqlx::query!(
                    r#"UPDATE "dailies" SET time_min = $1 WHERE point_id = $2"#,
                    new_time_min,
                    original_daily.point_id,
                )
                .execute(pool)
                .await?;
            }
        }
        None => {
            if let Some(new_time_min) = new_daily.time_min {
                sqlx::query!(
                    r#"UPDATE "quests" SET time_min = $1 WHERE id = $2"#,
                    new_time_min,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
                sqlx::query!(
                    r#"UPDATE "dailies" SET time_min = $1 WHERE point_id = $2"#,
                    new_time_min,
                    original_daily.point_id,
                )
                .execute(pool)
                .await?;
            }
        }
    }

    match original_daily.time_max {
        Some(time_max) => {
            if let Some(new_time_max) = new_daily.time_max
                && !time_max.eq(&new_time_max)
            {
                sqlx::query!(
                    r#"UPDATE "quests" SET time_max = $1 WHERE id = $2"#,
                    new_time_max,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
                sqlx::query!(
                    r#"UPDATE "dailies" SET time_max = $1 WHERE point_id = $2"#,
                    new_time_max,
                    original_daily.point_id,
                )
                .execute(pool)
                .await?;
            }
        }
        None => {
            if let Some(new_time_max) = new_daily.time_max {
                sqlx::query!(
                    r#"UPDATE "quests" SET time_max = $1 WHERE id = $2"#,
                    new_time_max,
                    original_daily.quest_id,
                )
                .execute(pool)
                .await?;
                sqlx::query!(
                    r#"UPDATE "dailies" SET time_max = $1 WHERE point_id = $2"#,
                    new_time_max,
                    original_daily.point_id,
                )
                .execute(pool)
                .await?;
            }
        }
    }

    Ok(())
}

#[tauri::command(async)]
pub async fn insert_dailies(
    state: tauri::State<'_, Mutex<state::AppState>>,
) -> Result<(), crate::errors::Error> {
    let state: MutexGuard<'_, state::AppState> = state.lock().await;
    let mut pool: PoolConnection<Sqlite> = state.db.pool.acquire().await?;
    let conn: &mut SqliteConnection = pool.acquire().await?;

    state
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
              date = DATE(CURRENT_TIMESTAMP, 'localtime');
        "#,
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
              LOWER(SHA1_HEX(id || STRFTIME('%Y-%m-%d', DATE(CURRENT_TIMESTAMP, 'localtime')))) AS point_id,
              id AS quest_id,
              DATE(CURRENT_TIMESTAMP, 'localtime') AS date,
              CASE
                WHEN archived IS NOT NULL THEN NULL
                WHEN type_id LIKE "q-x" THEN NULL
                WHEN type_id LIKE "q-w-%" AND INSTR(days, STRFTIME('%w', 'now')) < 1 THEN NULL
                WHEN type_id LIKE '%-n' THEN 1
                WHEN type_id = 'q-d-cy' THEN (
                  SELECT COALESCE(points, 0)
                  FROM
                    "points" AS p1
                  WHERE
                    p1.quest_id = q.id
                    AND p1.date = DATE(DATE(CURRENT_TIMESTAMP, 'localtime'), '-1 days')
                  LIMIT 1
                )
                WHEN (type_id LIKE 'q-d-%' OR type_id LIKE 'q-w-%') THEN 0
                WHEN type_id LIKE 'q-ln-%' THEN (
                  CASE
                    WHEN type_id LIKE '%-b' THEN (
                      WITH
                        p2 AS (
                          SELECT
                            points,
                            total
                          FROM
                            "points"
                          WHERE
                            quest_id = q.id
                            AND date > DATE(
                              DATE(CURRENT_TIMESTAMP, 'localtime'), '-'
                              || CAST(COALESCE(CAST(q.requirements AS INT), 0) + 1 AS TEXT)
                              || ' days'
                            )
                        )
                      SELECT CASE WHEN MAX(p2.points) / MAX(p2.total) = 1 THEN NULL ELSE 0 END
                      FROM
                        p2
                    )
                    WHEN type_id LIKE '%-n' THEN (
                      WITH
                        p2 AS (
                          SELECT
                            points,
                            total
                          FROM
                            "points"
                          WHERE
                            quest_id = q.id
                            AND date > DATE(
                              DATE(CURRENT_TIMESTAMP, 'localtime'), '-'
                              || CAST(COALESCE(CAST(q.requirements AS INT), 0) + 1 AS TEXT)
                              || ' days'
                            )
                        )
                      SELECT CASE WHEN SUM(p2.points) / SUM(p2.total) = 1 THEN NULL ELSE 1 END
                      FROM
                        p2
                    )
                  END
                )
                ELSE NULL
              END AS points,
              weight,
              total,
              streak_target,
              requirements,
              time_min,
              time_max,
              DATETIME(CURRENT_TIMESTAMP, 'localtime') AS updated
            FROM
              _staging_dailies_missing AS q
            ORDER BY
              q.sequence;
        "#,
    )
    .execute(&mut *tx)
    .await?;

    sqlx::query!(r#"INSERT INTO "points" SELECT * FROM _staging_dailies_to_add;"#,)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(())
}
