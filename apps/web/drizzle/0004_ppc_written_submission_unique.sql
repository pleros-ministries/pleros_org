CREATE UNIQUE INDEX IF NOT EXISTS "written_submissions_user_lesson_unique_idx" ON "written_submissions" USING btree ("user_id","lesson_id");
