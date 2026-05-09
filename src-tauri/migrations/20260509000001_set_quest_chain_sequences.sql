/*
feat(sql): set initial quest chain sequences for sorting
*/

UPDATE
  "quest_chains" AS qc
SET
  sequence = s.new_sequence
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id) AS new_sequence
  FROM
    "quest_chains"
) AS s
WHERE
  qc.id = s.id;
