-- AlterTable
ALTER TABLE "Business" ADD COLUMN "reviewDiscountEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "reviewDiscountOffer" TEXT NOT NULL DEFAULT '';
