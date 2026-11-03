-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
ADD COLUMN     "venueAddress" TEXT;

-- AlterTable
ALTER TABLE "EventTicket" ADD COLUMN     "ticketTypeId" TEXT;

-- CreateTable
CREATE TABLE "EventTicketType" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "pricePence" INTEGER NOT NULL,
    "memberPricePence" INTEGER,
    "membersOnly" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "salesStart" TIMESTAMP(3),
    "salesEnd" TIMESTAMP(3),
    "maxPerOrder" INTEGER NOT NULL DEFAULT 4,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTicketType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventTicketType_eventId_sortOrder_idx" ON "EventTicketType"("eventId", "sortOrder");

-- CreateIndex
CREATE INDEX "EventTicket_ticketTypeId_idx" ON "EventTicket"("ticketTypeId");

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "EventTicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicketType" ADD CONSTRAINT "EventTicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

