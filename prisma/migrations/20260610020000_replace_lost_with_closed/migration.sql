UPDATE "Lead"
SET "status" = 'CONTACTED',
    "closedAt" = NULL
WHERE "status" = 'LOST';

UPDATE "Lead"
SET "status" = 'CLOSED',
    "closedAt" = COALESCE("closedAt", NOW())
WHERE "status" = 'CAPTURED'
  AND EXISTS (
    SELECT 1
    FROM "ReviewRequest"
    WHERE "ReviewRequest"."leadId" = "Lead"."id"
      AND "ReviewRequest"."status" = 'RECEIVED'
  );
