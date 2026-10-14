-- The course builder: courses written on the site, each with a working draft
-- and immutable versions that go through review. Enrolments and certificates
-- remember which approved version a learner studied.
CREATE TYPE "CourseState" AS ENUM ('draft', 'in_review', 'published', 'unlisted');

CREATE TYPE "CourseVersionStatus" AS ENUM ('submitted', 'approved', 'changes_requested', 'rejected', 'superseded');

ALTER TABLE "CourseEnrolment" ADD COLUMN     "versionId" TEXT;

ALTER TABLE "Certificate" ADD COLUMN     "educatorName" TEXT,
ADD COLUMN     "versionId" TEXT;

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "educatorId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "audience" TEXT NOT NULL DEFAULT '',
    "discipline" TEXT NOT NULL DEFAULT 'everyone',
    "format" TEXT NOT NULL DEFAULT '',
    "hours" INTEGER NOT NULL DEFAULT 1,
    "priceGBP" INTEGER NOT NULL DEFAULT 0,
    "memberPriceGBP" INTEGER NOT NULL DEFAULT 0,
    "imageKey" TEXT NOT NULL,
    "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sharePct" INTEGER,
    "draft" JSONB NOT NULL,
    "status" "CourseState" NOT NULL DEFAULT 'draft',
    "publishedVersionId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseVersion" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "meta" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "status" "CourseVersionStatus" NOT NULL DEFAULT 'submitted',
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "CourseVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

CREATE UNIQUE INDEX "Course_publishedVersionId_key" ON "Course"("publishedVersionId");

CREATE INDEX "Course_status_idx" ON "Course"("status");

CREATE INDEX "Course_educatorId_idx" ON "Course"("educatorId");

CREATE INDEX "CourseVersion_status_submittedAt_idx" ON "CourseVersion"("status", "submittedAt");

CREATE UNIQUE INDEX "CourseVersion_courseId_number_key" ON "CourseVersion"("courseId", "number");

ALTER TABLE "CourseVersion" ADD CONSTRAINT "CourseVersion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

