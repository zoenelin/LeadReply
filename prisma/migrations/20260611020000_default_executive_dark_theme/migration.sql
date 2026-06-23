UPDATE "User"
SET "themePreference" = 'DARK'
WHERE "themePreference" = 'LIGHT';

ALTER TABLE "User"
ALTER COLUMN "themePreference" SET DEFAULT 'DARK';
