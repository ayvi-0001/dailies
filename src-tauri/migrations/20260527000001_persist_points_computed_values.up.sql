/*
feat!(sql): user_version=2, persist point streaks/complete values

- Add fields to `points` table: user_id, points_weighted, complete, streak, previous_streak.
- Persist quest/point computed values through triggers.
- Remove `dailies_weighted` view.
*/

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS "points_new" (
  id TEXT NOT NULL UNIQUE CHECK(LENGTH(id) = 40),
  quest_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT (DATE(CURRENT_TIMESTAMP, 'localtime')),
  points REAL NULL,
  total REAL NOT NULL CHECK (total > 0),
  complete REAL NULL,
  weight REAL NOT NULL CHECK (weight > 0),
  points_weighted REAL NULL,
  streak_target INTEGER NULL,
  streak INTEGER NULL,
  previous_streak INTEGER NULL,
  requirements ANY NULL,
  time_start TIME NULL,
  time_end TIME NULL,
  note TEXT NULL,
  updated DATETIME NOT NULL DEFAULT (DATETIME(CURRENT_TIMESTAMP, 'localtime')),
  CONSTRAINT points_pk PRIMARY KEY (id),
  FOREIGN KEY (quest_id) REFERENCES "quests" (id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Using the current `dailies_weighted` view query to update the computed values
-- in the newly built points table. Re-creating as a temp view incase this migration
-- ever re-runs on the same database of a later version where this view no longer exists.
CREATE TEMP VIEW IF NOT EXISTS _dailies_weighted AS
WITH
  "lagged_points" AS (
    SELECT *, CAST(LAG(complete) OVER(PARTITION BY quest_id ORDER BY date) AS REAL) AS prev_points
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

INSERT INTO "points_new"
SELECT
  points.id,
  points.quest_id,
  quest_user_ids.user_id,
  points.date,
  points.points,
  points.total,
  _dailies_weighted.complete AS complete,
  points.weight,
  _dailies_weighted.points_weighted AS points_weighted,
  points.streak_target,
  _dailies_weighted.streak AS streak,
  _dailies_weighted.previous_streak AS previous_streak,
  points.requirements,
  points.time_start,
  points.time_end,
  points.note,
  points.updated
FROM
  "points"
LEFT JOIN (
  SELECT
    id,
    user_id
  FROM
    "quests"
) AS quest_user_ids
ON
  quest_user_ids.id = points.quest_id
LEFT JOIN
  _dailies_weighted
ON
  _dailies_weighted.point_id = points.id;

-- Drop temp view.
DROP VIEW IF EXISTS _dailies_weighted;
-- Drop original view if exists,
-- Don't need this view anymore as it will be replaced by "dailies".
DROP VIEW IF EXISTS dailies_weighted;

PRAGMA legacy_alter_table = ON;
DROP TABLE "points";
ALTER TABLE "points_new" RENAME TO "points";
PRAGMA legacy_alter_table = OFF;

CREATE INDEX IF NOT EXISTS idx_point_user_quest ON "points"(user_id, quest_id);

PRAGMA foreign_key_check;

PRAGMA foreign_keys = ON;

CREATE TRIGGER IF NOT EXISTS points_updated_timestamp
  AFTER UPDATE ON "points" FOR EACH ROW
  WHEN OLD.updated = NEW.updated
BEGIN
  UPDATE
    "points"
  SET
    updated = DATETIME(CURRENT_TIMESTAMP, 'localtime')
  WHERE
    id = NEW.id;
END;

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
          CASE WHEN NEW.points IS NULL THEN NULL ELSE NEW.complete END AS base
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

DROP TRIGGER IF EXISTS points_after_update;
CREATE TRIGGER IF NOT EXISTS points_after_update
AFTER UPDATE OF points, total, weight, streak_target ON "points" FOR EACH ROW
WHEN
  OLD.quest_id = NEW.quest_id
  AND OLD.points IS NOT NEW.points
BEGIN
  -- Update current row.
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
          CASE WHEN NEW.points IS NULL THEN NULL ELSE NEW.complete END AS base
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
  -- Cascade forward through later rows of same quest_id.
  -- Early exit if no rows exist after NEW.date for this quest,
  -- the recursive CTE materializes nothing and the UPDATE is a no-op.
  UPDATE "points"
  SET
    previous_streak = fd.previous_streak,
    streak = fd.streak,
    complete = CASE
      WHEN fd.base IS NULL THEN NULL
      WHEN NEW.streak_target IS NULL THEN fd.base
      WHEN fd.base >= 1 THEN MIN(CAST(fd.streak / NEW.streak_target AS REAL), 1.0)
      ELSE MIN(fd.base / CAST(NEW.streak_target AS REAL), 1.0)
    END,
    points_weighted = CAST(fd.weight_v AS REAL) * CASE
      WHEN fd.base IS NULL THEN NULL
      WHEN NEW.streak_target IS NULL THEN fd.base
      WHEN fd.base >= 1 THEN MIN(CAST(fd.streak / NEW.streak_target AS REAL), 1.0)
      ELSE MIN(fd.base / CAST(NEW.streak_target AS REAL), 1.0)
    END
  FROM (
    WITH RECURSIVE
      ordered AS (
        SELECT
          p.id,
          p."date",
          p.points,
          p.total,
          p.weight,
          p.streak_target,
          ROW_NUMBER() OVER (ORDER BY p."date") AS rn
        FROM
          "points" AS p
        WHERE
          p.quest_id = NEW.quest_id
          AND p."date" > NEW."date"
      ),
      forward(id, rn, base, weight_v, streak_target_v, previous_streak, streak, complete, points_weighted) AS (
        SELECT
          o.id,
          o.rn,
          CASE WHEN o.points IS NULL THEN NULL ELSE CAST(o.points AS REAL) / CAST(o.total AS REAL) END AS base,
          o.weight,
          o.streak_target,
          ( SELECT streak FROM "points" WHERE id = NEW.id ) AS previous_streak,
          CASE
            WHEN o.points IS NULL THEN 0
            WHEN CAST(o.points AS REAL) / CAST(o.total AS REAL) > 0 THEN (SELECT streak FROM "points" WHERE id = NEW.id) + 1
            ELSE 0
          END AS streak,
          NULL AS complete,
          NULL AS points_weighted
        FROM
          ordered AS o
        WHERE
          o.rn = 1
        UNION ALL
        SELECT
          o.id,
          o.rn,
          CASE WHEN o.points IS NULL THEN NULL ELSE CAST(o.points AS REAL) / CAST(o.total AS REAL) END AS base,
          o.weight,
          o.streak_target,
          f.streak AS previous_streak,
          CASE
            WHEN o.points IS NULL THEN 0
            WHEN CAST(o.points AS REAL) / CAST(o.total AS REAL) > 0 THEN f.streak + 1
            ELSE 0
          END AS streak,
          NULL AS complete,
          NULL AS points_weighted
        FROM
          ordered AS o
        INNER JOIN
          forward AS f
        ON
          o.rn = f.rn + 1
      )
      SELECT * FROM forward
  ) AS fd
  WHERE
    points.id = fd.id;
END;

DROP VIEW IF EXISTS "dailies";
CREATE VIEW IF NOT EXISTS "dailies" AS
SELECT
  user.name AS user,
  point."date",
  point.id AS point_id,
  quest.id AS quest_id,
  quest.sequence,
  quest.chain,
  quest.name,
  quest.type_id AS "type",
  point.points,
  quest.default_points,
  point.total,
  point.complete,
  point.weight,
  point.streak_target,
  point.streak,
  point.previous_streak,
  point.points_weighted,
  point.requirements,
  point.time_start,
  point.time_end,
  quest.accepted,
  quest.archived,
  quest.days,
  quest.description,
  point.note
FROM
  "points" AS point
LEFT JOIN
  "quests" AS quest
ON
  quest.id = point.quest_id
LEFT JOIN
  "users" AS user
ON
  user.id = point.user_id
  AND user.id = quest.user_id;

DROP TRIGGER IF EXISTS "update_dailies";
CREATE TRIGGER IF NOT EXISTS "update_dailies"
INSTEAD OF UPDATE ON "dailies" FOR EACH ROW
WHEN
  OLD.quest_id = NEW.quest_id
  OR OLD.point_id = NEW.point_id
BEGIN
  UPDATE "quests"
    SET
      sequence = NEW.sequence,
      chain = NEW.chain,
      type_id = NEW.type,
      name = NEW.name,
      default_points = NEW.default_points,
      weight = NEW.weight,
      total = NEW.total,
      archived = NEW.archived,
      streak_target = NEW.streak_target,
      requirements = NEW.requirements,
      time_start = NEW.time_start,
      time_end = NEW.time_end,
      days = NEW.days,
      description = NEW.description
  WHERE
    id = NEW.quest_id;
  UPDATE "points"
    SET
      points = NEW.points,
      complete = NEW.complete,
      weight = NEW.weight,
      total = NEW.total,
      streak_target = NEW.streak_target,
      requirements = NEW.requirements,
      time_start = NEW.time_start,
      time_end = NEW.time_end,
      note = NEW.note
  WHERE
    id = NEW.point_id;
END;

DROP TABLE IF EXISTS _staging_dailies_added;
DROP TABLE IF EXISTS _staging_dailies_missing;
DROP TABLE IF EXISTS _staging_dailies_to_add;

PRAGMA user_version=2;

PRAGMA integrity_check;
