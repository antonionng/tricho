-- Educator members: pay yearly to write and sell courses, approved by the team
-- after they join. A course can belong to an educator.
CREATE TYPE "EducatorStatus" AS ENUM ('pending_review', 'approved', 'rejected', 'suspended', 'lapsed');

CREATE TABLE "EducatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "credentials" TEXT NOT NULL DEFAULT '',
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "website" TEXT,
    "photoFileId" TEXT,
    "status" "EducatorStatus" NOT NULL DEFAULT 'pending_review',
    "sharePct" INTEGER NOT NULL DEFAULT 70,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "termsVersion" TEXT,
    "termsAcceptedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EducatorProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EducatorProfile_userId_key" ON "EducatorProfile"("userId");

CREATE UNIQUE INDEX "EducatorProfile_slug_key" ON "EducatorProfile"("slug");

CREATE UNIQUE INDEX "EducatorProfile_stripeSubscriptionId_key" ON "EducatorProfile"("stripeSubscriptionId");

CREATE INDEX "EducatorProfile_status_idx" ON "EducatorProfile"("status");

ALTER TABLE "Course" ADD CONSTRAINT "Course_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "EducatorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EducatorProfile" ADD CONSTRAINT "EducatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

