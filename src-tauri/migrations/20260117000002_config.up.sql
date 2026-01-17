CREATE TABLE IF NOT EXISTS "config" (
  user_id INTEGER NOT NULL,
  "key" TEXT NOT NULL,
  "type" INTEGER NOT NULL,
  "boolean" INTEGER NULL CHECK ("boolean" IN (0, 1)),
  "integer" INTEGER NULL,
  "float" REAL NULL,
  "string" TEXT NULL,
  "json" TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE
);
