/*
feat: quest chain sorting
*/

DROP TRIGGER IF EXISTS insert_quest_chain;
CREATE TRIGGER IF NOT EXISTS insert_quest_chain
  BEFORE INSERT ON "quests" FOR EACH ROW
WHEN NOT EXISTS (SELECT 1 FROM "quest_chains" WHERE user_id = NEW.user_id AND chain = NEW.chain)
BEGIN
  INSERT INTO "quest_chains" (user_id, chain, sequence)
  VALUES(
    NEW.user_id,
    NEW.chain,
    (SELECT COALESCE((SELECT MAX(sequence) + 1 FROM "quest_chains" WHERE user_id = NEW.user_id), 1))
  );
END;

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
    id = s.id;
END;
