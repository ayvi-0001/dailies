INSERT INTO "config" ("user_id", "key", "type", "boolean")
SELECT
  id,
  'quest-list--is-archived-quests-filtered' AS "key",
  0 AS "type",
  FALSE AS "boolean"
FROM
  "users"
WHERE
  NOT EXISTS (
    SELECT 1 FROM "config" WHERE "key" = 'quest-list--is-archived-quests-filtered' AND user_id = "users".id
  );

INSERT INTO "config" ("user_id", "key", "type", "boolean")
SELECT
  id,
  'quest-list--is-completed-quests-filtered' AS "key",
  0 AS "type",
  FALSE AS "boolean"
FROM
  "users"
WHERE
  NOT EXISTS (
    SELECT 1 FROM "config" WHERE "key" = 'quest-list--is-completed-quests-filtered' AND user_id = "users".id
  );

INSERT INTO "config" ("user_id", "key", "type", "boolean")
SELECT
  id,
  'quest-list--is-optional-quests-filtered' AS "key",
  0 AS "type",
  FALSE AS "boolean"
FROM
  "users"
WHERE
  NOT EXISTS (
    SELECT 1 FROM "config" WHERE "key" = 'quest-list--is-optional-quests-filtered' AND user_id = "users".id
  );
