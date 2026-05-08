/*
fix: remove streak targets from quest types q-w-s/q-w-m
*/

UPDATE
  "quests"
SET
  streak_target = NULL
WHERE
  type_id IN ('q-w-s', 'q-w-m');

UPDATE
  "points"
SET
  streak_target = NULL
WHERE
  quest_id IN (
    SELECT id
    FROM
      "quests"
    WHERE
      type_id IN ('q-w-s', 'q-w-m')
  );
