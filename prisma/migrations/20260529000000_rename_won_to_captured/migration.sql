-- Rename developer-facing lead capture language in the live database.
ALTER TABLE "Lead" RENAME COLUMN "wonValueCents" TO "capturedValueCents";

UPDATE "Lead"
SET "status" = 'CAPTURED'
WHERE "status" = 'WON';
