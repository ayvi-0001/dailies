/* NOTE: by default, NOT NULL is not enforced on PRIMARY KEY columns in sqlite due to a bug in early versions. */

CREATE TABLE IF NOT EXISTS "users" (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created DATETIME NOT NULL DEFAULT (DATETIME(CURRENT_TIMESTAMP, 'localtime')),
  updated DATETIME NOT NULL DEFAULT (DATETIME(CURRENT_TIMESTAMP, 'localtime')),
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "types" (
  id TEXT NOT NULL UNIQUE,
  name TEXT NULL,
  description TEXT NULL,
  available BOOLEAN NOT NULL DEFAULT 0, -- Flag to include/exclude type in front-end.
  styles TEXT DEFAULT '{}', -- JSON value containing tailwind classes.
  CONSTRAINT types_pk PRIMARY KEY (id)
)
WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS "quest_chains" (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  chain TEXT NOT NULL, -- Quest chain display name.
  sequence INTEGER NOT NULL DEFAULT 0, -- Order to display quest chain in. Not Currently Used.
  FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "quests" (
  id TEXT NOT NULL UNIQUE CHECK(LENGTH(id) = 40), -- sha1 hash of the user name, quest name, and quest chain, delimited by `_`.
  user_id INTEGER NOT NULL, -- User name joined and used for generating quest id.
  sequence INTEGER NOT NULL, -- Order to display dailies in.
  chain TEXT NOT NULL, -- Group, used for generating quest id.
  name TEXT NOT NULL, -- Quest display name.
  type_id TEXT NOT NULL, -- Daily type, determines default behaviour for value/new records.
  weight REAL NOT NULL CHECK (weight > 0), -- Weight of quest points when calculating weighted average.
  total REAL NOT NULL CHECK (total > 0), -- Daily value = points / total.
  default_points REAL NOT NULL CHECK (default_points <= total) DEFAULT 0, -- Default value of points on a new day.
  accepted DATETIME NOT NULL DEFAULT (DATE(CURRENT_TIMESTAMP, 'localtime')), -- Date started.
  archived DATETIME NULL, -- Archived quests still get added daily with a null point value.
  streak_target INTEGER NULL, -- Target for streaks, only continues if points / total = 1.
  requirements ANY NULL, -- Variable, effect depends on quest type.
  time_start TIME NULL, -- Start of time window where points apply.
  time_end TIME NULL, -- End of time window where points apply.
  days TEXT NULL, -- JSON<Vec<i64>> - Active days of the week.
  description TEXT NULL, -- Optional description.
  updated DATETIME NOT NULL DEFAULT (DATETIME(CURRENT_TIMESTAMP, 'localtime')), -- Local time record last updated.
  CONSTRAINT quests_pk PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE RESTRICT,
  FOREIGN KEY (type_id) REFERENCES "types" (id) ON DELETE RESTRICT ON UPDATE CASCADE
)
WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS "points" (
  id TEXT NOT NULL UNIQUE CHECK(LENGTH(id) = 40), -- sha1 hash of quest id, and date, delimited by `_`.
  quest_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT (DATE(CURRENT_TIMESTAMP, 'localtime')),
  points REAL NULL,
  weight REAL NOT NULL CHECK (weight > 0),
  total REAL NOT NULL CHECK (total > 0), -- Daily value = points / total.
  streak_target INTEGER NULL, -- Target for streaks, only continues if points / total = 1.
  requirements ANY NULL, -- Variable, effect depends on quest type.
  time_start TIME NULL, -- Start of time window where points apply.
  time_end TIME NULL, -- End of time window where points apply.
  note TEXT NULL, -- Optional note on a specific day, separate from quest description.
  updated DATETIME NOT NULL DEFAULT (DATETIME(CURRENT_TIMESTAMP, 'localtime')), -- Local time record last updated.
  CONSTRAINT points_pk PRIMARY KEY (id),
  FOREIGN KEY (quest_id) REFERENCES "quests" (id) ON DELETE CASCADE
)
WITHOUT ROWID;

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
  CAST(CAST(points AS REAL) / CAST(point.total AS REAL) AS REAL) AS complete,
  point.weight,
  point.streak_target,
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
  user.id = quest.user_id
ORDER BY
  user.name,
  point.date DESC,
  quest.sequence;

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
    WHERE
      streak_target IS NOT NULL
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
          ELSE NULL
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
      CASE WHEN _complete = 1 THEN CAST(streak AS REAL) / CAST(streak_target AS REAL) ELSE NULL END
      AS REAL
    ),
    1
  ) AS complete
FROM
  "streak_lengths"
ORDER BY
  date DESC;

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

-- Triggers

CREATE TRIGGER IF NOT EXISTS before_update_quest_chain
  BEFORE UPDATE ON "quests" FOR EACH ROW
WHEN NOT EXISTS (SELECT 1 FROM "quest_chains" WHERE user_id = NEW.user_id AND chain = NEW.chain)
BEGIN
  INSERT INTO "quest_chains" (user_id, chain) VALUES (NEW.user_id, NEW.chain);
END;

CREATE TRIGGER IF NOT EXISTS after_update_quest_chain
  AFTER UPDATE ON "quests" FOR EACH ROW
WHEN NOT EXISTS (SELECT 1 FROM "quests" WHERE user_id = OLD.user_id AND chain = OLD.chain)
BEGIN
  DELETE FROM "quest_chains" WHERE user_id = OLD.user_id AND chain = OLD.chain;
END;

CREATE TRIGGER IF NOT EXISTS insert_quest_chain
  BEFORE INSERT ON "quests" FOR EACH ROW
WHEN NOT EXISTS (SELECT 1 FROM "quest_chains" WHERE user_id = NEW.user_id AND chain = NEW.chain)
BEGIN
  INSERT INTO "quest_chains" (user_id, chain) VALUES (NEW.user_id, NEW.chain);
END;

CREATE TRIGGER IF NOT EXISTS delete_quest_chain
  AFTER DELETE ON "quests" FOR EACH ROW
WHEN NOT EXISTS (SELECT 1 FROM "quests" WHERE user_id = OLD.user_id AND chain = OLD.chain)
BEGIN
  DELETE FROM "quest_chains" WHERE user_id = OLD.user_id AND chain = OLD.chain;
END;

CREATE TRIGGER IF NOT EXISTS quests_updated
  AFTER UPDATE ON "quests" FOR EACH ROW
  WHEN OLD.updated = NEW.updated
BEGIN
  UPDATE
    "quests"
  SET
    updated = DATETIME(CURRENT_TIMESTAMP, 'localtime')
  WHERE
    id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS points_updated
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

CREATE TRIGGER IF NOT EXISTS update_dailies
INSTEAD OF UPDATE ON "dailies" FOR EACH ROW
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
