INSERT INTO "config" ("user_id", "key", "type", "boolean")
SELECT
  id,
  'quest-list--is-quest-chains-collapsed' AS "key",
  0 AS "type",
  FALSE AS "boolean"
FROM
  "users"
WHERE
  NOT EXISTS (
    SELECT 1 FROM "config" WHERE "key" = 'quest-list--is-quest-chains-collapsed' AND user_id = "users".id
  );
