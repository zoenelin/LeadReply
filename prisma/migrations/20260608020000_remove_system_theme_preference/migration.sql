UPDATE "User"
SET "themePreference" = 'LIGHT'
WHERE "themePreference" = 'SYSTEM';

ALTER TABLE "User"
ALTER COLUMN "themePreference" SET DEFAULT 'LIGHT';
