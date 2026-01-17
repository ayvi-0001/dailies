/*
refactor(sql): show streaks on all quests regardless of `streak_target`

Removed filter on first CTE where `streak_target` is NULL.
Set default `streak_length` to 0 instead of NULL.
*/

DROP VIEW IF EXISTS "daily_streaks";
CREATE VIEW IF NOT EXISTS "daily_streaks" AS
WITH
  "lagged_values" AS (
    SELECT
      user,
      date,
      point_id,
      quest_id,
      sequence,
      chain,
      name,
      type,
      points,
      default_points,
      total,
      complete AS _complete,
      weight,
      streak_target,
      requirements,
      time_start,
      time_end,
      accepted,
      archived,
      days,
      description,
      note,
      CAST(LAG(complete) OVER (PARTITION BY quest_id ORDER BY date) AS REAL) AS lagged_value
    FROM
      "dailies"
  ),
  "streak_groups" AS (
    SELECT
      *,
      CAST(
        CASE
          WHEN _complete = 1 THEN SUM((_complete = 1 AND (lagged_value IS NULL OR lagged_value = 0))) OVER (PARTITION BY quest_id ORDER BY date)
          ELSE NULL
        END
        AS REAL
      ) AS streak_group
    FROM
      "lagged_values"
  ),
  "streak_lengths" AS (
    SELECT
      *,
      CAST(
        CASE
          WHEN _complete = 1 THEN ROW_NUMBER() OVER (PARTITION BY quest_id, streak_group ORDER BY date)
          ELSE 0
        END
        AS INTEGER
      ) AS streak
    FROM
      "streak_groups"
  )
SELECT
  *,
  MIN(
    CAST(
      CASE WHEN _complete = 1 THEN
        CAST(streak AS REAL) / CAST(streak_target AS REAL)
      ELSE
        CAST(_complete AS REAL) / CAST(streak_target AS REAL) END
      AS REAL
    ),
    1
  ) AS complete
FROM
  "streak_lengths"
ORDER BY
  date DESC;
