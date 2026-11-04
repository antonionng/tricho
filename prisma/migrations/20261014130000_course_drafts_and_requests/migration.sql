-- AI drafts of courses from an author's own material, and educators' requests
-- for the team to build or tailor a course for them.
CREATE TYPE "CourseRequestStatus" AS ENUM ('new', 'scoping', 'building', 'with_educator', 'done', 'declined');

ALTER TABLE "Course" ADD COLUMN     "builtById" TEXT;

CREATE TABLE "AiDraftRun" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "input" JSONB NOT NULL,
    "plan" JSONB,
    "step" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiDraftRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseRequest" (
    "id" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT '',
    "timeline" TEXT NOT NULL DEFAULT '',
    "fileIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CourseRequestStatus" NOT NULL DEFAULT 'new',
    "assignedToId" TEXT,
    "notes" TEXT,
    "courseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiDraftRun_userId_createdAt_idx" ON "AiDraftRun"("userId", "createdAt");

CREATE INDEX "AiDraftRun_courseId_idx" ON "AiDraftRun"("courseId");

CREATE INDEX "CourseRequest_status_createdAt_idx" ON "CourseRequest"("status", "createdAt");

CREATE INDEX "CourseRequest_educatorId_idx" ON "CourseRequest"("educatorId");

ALTER TABLE "AiDraftRun" ADD CONSTRAINT "AiDraftRun_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseRequest" ADD CONSTRAINT "CourseRequest_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "EducatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseRequest" ADD CONSTRAINT "CourseRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

