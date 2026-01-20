/*
feat(sql): user_version=1, add `collapsed` field to quest_chains

Note: column is added by altering sqlite_schema rather than
an ALTER TABLE statement so as to not cause errors if migrations
run multiple times.
*/

-- BEGIN TRANSACTION;

PRAGMA user_version;

PRAGMA writable_schema=ON;

UPDATE sqlite_schema
SET
  sql = 'CREATE TABLE "quest_chains" (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  chain TEXT NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  collapsed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE RESTRICT
)'
WHERE
  type = 'table'
  AND name = 'quest_chains'
  AND NOT EXISTS ( SELECT 1 FROM PRAGMA_TABLE_INFO('quest_chains') WHERE name = 'collapsed' );

PRAGMA writable_schema=OFF;

PRAGMA user_version=1;

PRAGMA integrity_check;

-- COMMIT TRANSACTION;
