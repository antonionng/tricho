-- AlterTable
ALTER TABLE "DirectoryListing" ADD COLUMN     "inviteToken" TEXT;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'premium',
    "category" TEXT NOT NULL,
    "logoUrl" TEXT,
    "blurb" TEXT NOT NULL,
    "website" TEXT,
    "perk" TEXT,
    "contactEmail" TEXT,
    "isFounding" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE INDEX "Partner_published_tier_idx" ON "Partner"("published", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "DirectoryListing_inviteToken_key" ON "DirectoryListing"("inviteToken");

