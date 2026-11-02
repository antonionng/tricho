-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "refKey" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "announcedAt" TIMESTAMP(3),
ADD COLUMN     "presenters" TEXT,
ADD COLUMN     "sponsorPartnerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_refKey_key" ON "Notification"("refKey");

-- CreateIndex
CREATE INDEX "Event_sponsorPartnerId_idx" ON "Event"("sponsorPartnerId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sponsorPartnerId_fkey" FOREIGN KEY ("sponsorPartnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

