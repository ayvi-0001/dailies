INSERT INTO "config" ("user_id", "key", "type", "boolean")
VALUES
  ($1, 'quest-list--is-archived-quests-filtered', 0, FALSE),
  ($1, 'quest-list--is-completed-quests-filtered', 0, FALSE),
  ($1, 'quest-list--is-optional-quests-filtered', 0, FALSE),
  ($1, 'quest-list--is-quest-chains-collapsed', 0, FALSE)
;
