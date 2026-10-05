-- Job posts from businesses on the Business or Premium plan.
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "employment" TEXT NOT NULL,
    "workplace" TEXT NOT NULL DEFAULT 'on_site',
    "location" TEXT NOT NULL,
    "country" TEXT,
    "pay" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "applyUrl" TEXT,
    "applyEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Job_slug_key" ON "Job"("slug");
CREATE INDEX "Job_status_expiresAt_idx" ON "Job"("status", "expiresAt");
CREATE INDEX "Job_partnerId_idx" ON "Job"("partnerId");

ALTER TABLE "Job" ADD CONSTRAINT "Job_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
