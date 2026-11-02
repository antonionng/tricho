-- Courses: enrolments (bought through Stripe or free for members), lesson
-- progress with private notes, the final assessment and certificates.
CREATE TYPE "EnrolmentStatus" AS ENUM ('pending', 'active', 'refunded', 'cancelled');

CREATE TABLE "CourseEnrolment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "status" "EnrolmentStatus" NOT NULL DEFAULT 'pending',
    "priceType" TEXT NOT NULL DEFAULT 'guest',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "lastLessonSlug" TEXT,
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseEnrolment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "checkScore" INTEGER,
    "checkTotal" INTEGER,
    "notes" TEXT,
    "reflection" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "hours" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "showOnProfile" BOOLEAN NOT NULL DEFAULT true,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "withdrawnNote" TEXT,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseEnrolment_stripeSessionId_key" ON "CourseEnrolment"("stripeSessionId");
CREATE UNIQUE INDEX "CourseEnrolment_userId_courseSlug_key" ON "CourseEnrolment"("userId", "courseSlug");
CREATE INDEX "CourseEnrolment_courseSlug_status_idx" ON "CourseEnrolment"("courseSlug", "status");
CREATE INDEX "CourseEnrolment_stripePaymentIntentId_idx" ON "CourseEnrolment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "LessonProgress_enrolmentId_lessonSlug_key" ON "LessonProgress"("enrolmentId", "lessonSlug");
CREATE INDEX "AssessmentAttempt_enrolmentId_createdAt_idx" ON "AssessmentAttempt"("enrolmentId", "createdAt");
CREATE UNIQUE INDEX "Certificate_enrolmentId_key" ON "Certificate"("enrolmentId");
CREATE UNIQUE INDEX "Certificate_userId_courseSlug_key" ON "Certificate"("userId", "courseSlug");

ALTER TABLE "CourseEnrolment" ADD CONSTRAINT "CourseEnrolment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "CourseEnrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "CourseEnrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "CourseEnrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
