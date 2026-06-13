UPDATE "types"
SET
  description = CASE id
    WHEN 'q-d' THEN 'Quest is required daily. Starts with a point value of $default_points / $total.'
    WHEN 'q-dm' THEN 'Quest is required daily. The point value is carried over from the previous day.'
    WHEN 'q-w' THEN 'Quest is required on select days ($days). Starts with a point value of $default_points / $total.'
    WHEN 'q-r' THEN 'Quest is required on select days ($days), and only within the available time window ($start -> $end). Starts with a point value of $default_points / $total.'
    WHEN 'q-w-s' THEN 'If the quest is completed each required day over the last `n` ($requirements) days then quest is not required the following day.'
    WHEN 'q-w-m' THEN "If the quest is completed over any of the last `n` ($requirements) days, then the quest is not required the following day."
    WHEN 'q-o' THEN "Quest always starts as not required. If a point value is assigned, then the quest's weight contributes to the daily/total exp."
  END
WHERE
  TRUE;
