-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "detailsCloseAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EventAttendee" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dietary" TEXT,
    "accessNeeds" TEXT,
    "isBuyer" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "checkedInById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "refundedPence" INTEGER,
    "stripeRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendee_code_key" ON "EventAttendee"("code");

-- CreateIndex
CREATE INDEX "EventAttendee_eventId_idx" ON "EventAttendee"("eventId");

-- CreateIndex
CREATE INDEX "EventAttendee_ticketId_idx" ON "EventAttendee"("ticketId");

-- CreateIndex
CREATE INDEX "EventAttendee_email_idx" ON "EventAttendee"("email");

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "EventTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

