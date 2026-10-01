-- AlterTable
ALTER TABLE "DirectoryListing" ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "signupSource" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_postId_reporterId_key" ON "Report"("postId", "reporterId");

