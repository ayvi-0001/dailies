-- "_staging_dailies_added" definition

DROP TABLE IF EXISTS _staging_dailies_added;
CREATE TABLE _staging_dailies_added(quest_id TEXT);

-- "_staging_dailies_missing" definition

DROP TABLE IF EXISTS _staging_dailies_missing;
CREATE TABLE _staging_dailies_missing(
  id TEXT,
  user_id INT,
  sequence INT,
  chain TEXT,
  name TEXT,
  type_id TEXT,
  weight REAL,
  total REAL,
  accepted NUM,
  archived NUM,
  streak_target INT,
  requirements NUM,
  time_start NUM,
  time_end NUM,
  days TEXT,
  note TEXT,
  updated NUM
);

-- "_staging_dailies_to_add" definition

DROP TABLE IF EXISTS _staging_dailies_to_add;
CREATE TABLE _staging_dailies_to_add(
  point_id,
  quest_id TEXT,
  date,
  points,
  weight REAL,
  total REAL,
  streak_target INT,
  requirements NUM,
  time_start NUM,
  time_end NUM,
  note,
  updated
);
