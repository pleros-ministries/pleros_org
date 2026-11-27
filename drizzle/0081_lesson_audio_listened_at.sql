-- Monthly calendar (Pastor, 25 November 2026): when a lesson's teaching was
-- first marked listened, so a Doctrinal learner's listening shows on the day it
-- happened. Earlier listens have no time recorded and stay null. Nothing is rewritten.
ALTER TABLE "student_progress" ADD COLUMN "audio_listened_at" timestamp with time zone;
