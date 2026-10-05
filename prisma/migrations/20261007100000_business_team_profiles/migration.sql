-- Team members on a business plan can be introduced on the business's public page.
ALTER TABLE "BusinessSeat" ADD COLUMN "name" TEXT,
ADD COLUMN "role" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "photoFileId" TEXT,
ADD COLUMN "showOnPage" BOOLEAN NOT NULL DEFAULT true;
