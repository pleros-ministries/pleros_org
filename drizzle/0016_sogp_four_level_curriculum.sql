DO $$
DECLARE
  source_count integer;
BEGIN
  SELECT count(*)
  INTO source_count
  FROM "lessons"
  WHERE "level_id" = 3
    AND "lesson_number" BETWEEN 1 AND 9;

  IF source_count <> 9 THEN
    RAISE EXCEPTION 'SOGP curriculum migration expected 9 Level 3 lessons, found %', source_count;
  END IF;
END $$;--> statement-breakpoint
UPDATE "lessons" AS lesson
SET
  "title" = curriculum."title",
  "updated_at" = now()
FROM (
  VALUES
    (1, 'Baptism of the Holy Ghost'),
    (2, 'Discipline – The Foundation of the Pursuit of Purpose'),
    (3, 'The Walk of Faith'),
    (4, 'The Life of Prayer'),
    (5, 'Believer’s Authority'),
    (6, 'Healing in the Newness of Life'),
    (7, 'Natural Assignment in the Newness of Life'),
    (8, 'Spiritual Assignment in the Newness of Life'),
    (9, 'Supernatural in the Newness of Life')
) AS curriculum("lesson_number", "title")
WHERE lesson."level_id" = 3
  AND lesson."lesson_number" = curriculum."lesson_number";
