PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO "types" (id, name, description, available, styles)
VALUES
  ('q-d', 'Daily', 'Quest is required daily. Starts with a point value of $DEFAULT_POINTS / $TOTAL).', TRUE, '{"typeBadgeClass":"bg-blue-400/80","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}'),
  ('q-w', 'Weekly', 'Quest is available on select days ($DAYS). Starts with a point value of $DEFAULT_POINTS / $TOTAL).', TRUE, '{"typeBadgeClass":"bg-yellow-400/80","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}'),
  ('q-dm', 'Daily/Maintenance', 'Quest is required daily. The point value is carried over from the previous day.', TRUE, '{"typeBadgeClass":"bg-blue-700/60","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}'),
  ('q-w-s', 'Weekly [S]', 'If the quest is completed each available day over the last `N` ($REQUIREMENTS) days then quest is not required (NULL) the following day.', TRUE, '{"typeBadgeClass":"bg-orange-400/80","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}'),
  ('q-w-m', 'Weekly [M]', "If the maximum points over any of the last `N` ($REQUIREMENTS) days is equal to the quest's total ($TOTAL, '{}'), then the quest is not required (NULL) the following day.", TRUE, '{"typeBadgeClass":"bg-orange-400/80","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}'),
  ('q-r', 'Raid', 'Quest is available on select days ($DAYS), and only within the available time window ($START -> $END). Starts with a point value of $DEFAULT_POINTS / $TOTAL).', TRUE, '{"typeBadgeClass":"bg-red-400/80","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}'),
  ('q-o', 'Optional', "Quest always starts as not required (NULL). If points are assigned, then this quest's value contributes to daily/total exp.", TRUE, '{"typeBadgeClass":"bg-green-400/80","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}'),
  /* Not Implemented Yet */
  ('q-p', 'Persistent', NULL, FALSE, '{"typeBadgeClass":"bg-violet-400/80","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}'),
  ('q-m', 'Monthly', NULL, FALSE, '{"typeBadgeClass":"bg-teal-400/80","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}'),
  ('q-e', 'Event', NULL, FALSE, '{"typeBadgeClass":"bg-teal-400/80","borderClass":"border-yellow-500/70","bgClass":"bg-yellow-400/80"}')
;
