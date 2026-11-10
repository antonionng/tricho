-- CreateEnum
CREATE TYPE "EventTicketKind" AS ENUM ('attendee', 'package', 'addon');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "stageSlots" INTEGER,
ADD COLUMN     "standSpaces" INTEGER;

-- AlterTable
ALTER TABLE "EventAttendee" ADD COLUMN     "awaitingName" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "EventTicket" ADD COLUMN     "packageTicketId" TEXT;

-- AlterTable
ALTER TABLE "EventTicketType" ADD COLUMN     "addonForTypeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "includesStageSlot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "includesStand" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kind" "EventTicketKind" NOT NULL DEFAULT 'attendee',
ADD COLUMN     "placesIncluded" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "EventExhibitor" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "website" TEXT,
    "invoiceAddress" TEXT NOT NULL,
    "vatNumber" TEXT,
    "manageCode" TEXT NOT NULL,
    "logoFileId" TEXT,
    "logoUrl" TEXT,
    "bookletBlurb" TEXT,
    "standNumber" TEXT,
    "stageSlotAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventExhibitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventExhibitor_ticketId_key" ON "EventExhibitor"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "EventExhibitor_manageCode_key" ON "EventExhibitor"("manageCode");

-- CreateIndex
CREATE INDEX "EventExhibitor_eventId_idx" ON "EventExhibitor"("eventId");

-- CreateIndex
CREATE INDEX "EventTicket_packageTicketId_idx" ON "EventTicket"("packageTicketId");

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_packageTicketId_fkey" FOREIGN KEY ("packageTicketId") REFERENCES "EventTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExhibitor" ADD CONSTRAINT "EventExhibitor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExhibitor" ADD CONSTRAINT "EventExhibitor_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "EventTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

