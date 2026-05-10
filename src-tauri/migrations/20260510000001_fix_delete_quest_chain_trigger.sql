/*
fix(sql): ambiguous id column in delete_quest_chain trigger
*/

DROP TRIGGER IF EXISTS delete_quest_chain;
CREATE TRIGGER IF NOT EXISTS delete_quest_chain
  AFTER DELETE ON "quests" FOR EACH ROW
WHEN NOT EXISTS (SELECT 1 FROM "quests" WHERE user_id = OLD.user_id AND chain = OLD.chain)
BEGIN
  DELETE FROM "quest_chains" WHERE user_id = OLD.user_id AND chain = OLD.chain;
  UPDATE
    "quest_chains"
  SET
    sequence = s.new_sequence
  FROM (
    SELECT
      *,
      ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY sequence) AS new_sequence
    FROM
      "quest_chains"
    WHERE
      user_id = OLD.user_id
  ) AS s
  WHERE
    "quest_chains".id = s.id;
END;
