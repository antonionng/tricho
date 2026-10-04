-- Showcase profiles: richer partner pages, a clinic cover photo for members, and photo galleries for both.

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "gallery",
ADD COLUMN     "coverFileId" TEXT,
ADD COLUMN     "ctaLabel" TEXT,
ADD COLUMN     "ctaUrl" TEXT,
ADD COLUMN     "highlights" JSONB,
ADD COLUMN     "offerings" JSONB,
ADD COLUMN     "sections" JSONB,
ADD COLUMN     "story" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "TrichologistProfile" ADD COLUMN     "coverFileId" TEXT;

-- CreateTable
CREATE TABLE "ProfilePhoto" (
    "id" TEXT NOT NULL,
    "fileId" TEXT,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "partnerId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfilePhoto_partnerId_sortOrder_idx" ON "ProfilePhoto"("partnerId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProfilePhoto_userId_sortOrder_idx" ON "ProfilePhoto"("userId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProfilePhoto" ADD CONSTRAINT "ProfilePhoto_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePhoto" ADD CONSTRAINT "ProfilePhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

