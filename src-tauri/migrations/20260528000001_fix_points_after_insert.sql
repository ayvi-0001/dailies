/*
fix(sql): fix `complete` value on points insert

Trigger did not compute `complete` value.
*/

DROP TRIGGER IF EXISTS points_after_insert;
CREATE TRIGGER IF NOT EXISTS points_after_insert
AFTER INSERT ON "points" FOR EACH ROW
BEGIN
  UPDATE "points"
  SET
    previous_streak = src.previous_streak,
    streak = src.streak,
    complete = src.complete,
    points_weighted = src.points_weighted
  FROM (
    WITH
      prev AS (
        SELECT COALESCE((
          SELECT streak FROM "points"
          WHERE quest_id = NEW.quest_id AND "date" < NEW."date"
          ORDER BY "date" DESC LIMIT 1
        ), 0) AS previous_streak
      ),
      step AS (
        SELECT
          prev.previous_streak,
          CASE WHEN NEW.points IS NULL THEN NULL ELSE CAST(NEW.points AS REAL) / CAST(NEW.total AS REAL) END AS base
        FROM
          prev
      ),
      final AS (
        SELECT
          step.previous_streak,
          step.base,
          CASE
            WHEN step.base IS NULL THEN 0
            WHEN step.base > 0 THEN step.previous_streak + 1
            ELSE 0
          END AS streak
        FROM
          step
      )
    SELECT
      f.previous_streak,
      f.streak,
      CASE
        WHEN f.base IS NULL THEN NULL
        WHEN NEW.streak_target IS NULL THEN f.base
        WHEN f.base >= 1 THEN MIN(CAST(f.streak / NEW.streak_target AS REAL), 1.0)
        ELSE MIN(f.base / CAST(NEW.streak_target AS REAL), 1.0)
      END AS complete,
      CAST(NEW.weight AS REAL) * CASE
        WHEN f.base IS NULL THEN NULL
        WHEN NEW.streak_target IS NULL THEN f.base
        WHEN f.base >= 1 THEN MIN(CAST(f.streak / NEW.streak_target AS REAL), 1.0)
        ELSE MIN(f.base / CAST(NEW.streak_target AS REAL), 1.0)
      END AS points_weighted
    FROM
      final AS f
  ) AS src
  WHERE points.id = NEW.id;
END;
