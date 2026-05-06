/*
refactor(sql): missing streak/streak groups

When 0 < `complete` < 1, or points > total.
Line 22 changed from = 1 to > 0
Line 38 changed from = 1 to > 0
Line 51 changed from = 1 to >= 1
*/

DROP VIEW IF EXISTS dailies_weighted;
CREATE VIEW IF NOT EXISTS dailies_weighted AS
WITH
  "lagged_points" AS (
    SELECT
      *,
      CAST(LAG(complete) OVER(PARTITION BY quest_id ORDER BY date) AS REAL) AS prev_points
    FROM
      "dailies"
  ),
  "streak_groups" AS (
    SELECT
      *,
      CAST(
        CASE
          WHEN complete > 0
          THEN SUM(complete = 1 AND (prev_points IS NULL OR prev_points = 0))
            OVER(PARTITION BY quest_id ORDER BY date)
        END
        AS INTEGER
      ) AS streak_group
    FROM
      "lagged_points"
  ),
  "streak_lengths" AS (
    SELECT
      *,
      CAST(
        CASE
          WHEN complete > 0 THEN ROW_NUMBER() OVER(PARTITION BY quest_id, streak_group ORDER BY date)
          ELSE 0
        END
        AS REAL
      ) AS streak
    FROM
      "streak_groups"
  ),
  "streaks" AS (
    SELECT
      *,
      CAST(
        MIN(
          CASE WHEN complete >= 1 THEN
            CAST(streak AS REAL) / CAST(streak_target AS REAL)
          ELSE
            CAST(complete AS REAL) / CAST(streak_target AS REAL)
          END,
          1
        )
        AS REAL
      ) AS streak_complete
    FROM
      "streak_lengths"
  )
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
  total,
  default_points,
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
  streak,
  CAST(LAG(streak, 1) OVER(PARTITION BY quest_id ORDER BY date) AS INTEGER) AS previous_streak,
  CAST(COALESCE(streak_complete, complete) AS REAL) AS complete,
  CAST(
    CASE
      WHEN streak_complete IS NOT NULL THEN streak_complete * weight
      ELSE complete * weight
    END
    AS REAL
  ) AS points_weighted
FROM
  streaks;
