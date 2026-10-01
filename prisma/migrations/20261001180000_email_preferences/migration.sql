-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "emailActivity" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "to" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_ref_key" ON "EmailLog"("ref");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
