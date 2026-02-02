/*
feat(sql): add `previous_streak` field to dailies view
*/

DROP VIEW IF EXISTS dailies_weighted;
CREATE VIEW IF NOT EXISTS dailies_weighted AS
SELECT
  d.user,
  d.date,
  d.point_id,
  d.quest_id,
  d.sequence,
  d.chain,
  d.name,
  d.type,
  d.points,
  d.total,
  d.default_points,
  d.weight,
  d.streak_target,
  d.requirements,
  d.time_start,
  d.time_end,
  d.accepted,
  d.archived,
  d.days,
  d.description,
  d.note,
  ds.streak,
  LAG(ds.streak, 1) OVER(PARTITION BY ds.quest_id ORDER BY ds.date) AS previous_streak,
  CAST(
    CASE WHEN ds.complete IS NOT NULL THEN ds.complete ELSE d.complete END
    AS REAL
  ) AS complete,
  CAST(
    CASE
      WHEN ds.complete IS NOT NULL THEN CAST(ds.complete AS REAL) * CAST(ds.weight AS REAL)
      ELSE CAST(d.complete AS REAL) * CAST(d.weight AS REAL)
    END
    AS REAL
  ) AS points_weighted
FROM
  dailies AS d
LEFT JOIN
  daily_streaks AS ds
ON
  ds.point_id = d.point_id;
