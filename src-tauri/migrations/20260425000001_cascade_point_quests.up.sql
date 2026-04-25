/*
feat(sql): update points foreign key constraint

On `quests` reference, cascade updates.
*/

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS "points_new" (
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
  FOREIGN KEY (quest_id) REFERENCES "quests" (id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "points_new"
SELECT
  points.id,
  points.quest_id,
  points.date,
  points.points,
  points.weight,
  points.total,
  points.streak_target,
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
  quest_user_ids.id = quest_id;

DROP TABLE "points";

PRAGMA legacy_alter_table = ON;

ALTER TABLE "points_new" RENAME TO "points";

PRAGMA legacy_alter_table = OFF;

-- Rebuild existing indexes.
CREATE INDEX idx_point_quest_id ON "points"(quest_id);
CREATE INDEX idx_point_date ON "points"("date");

-- Rebuild triggers.
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

PRAGMA foreign_key_check;

PRAGMA foreign_keys = ON;
