-- Referral codes and rewards, client referral details, retention signals, partner page stats, public brand contact details and event tickets.

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('pending', 'banked', 'credited', 'void');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('pending', 'paid', 'refunded', 'cancelled');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "sellTickets" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "publicEmail" TEXT,
ADD COLUMN     "publicPhone" TEXT;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "clientContext" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "responseNote" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPaymentFailedAt" TIMESTAMP(3),
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredByCode" TEXT,
ADD COLUMN     "referredById" TEXT;

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT,
    "referredEmail" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'pending',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "plan" TEXT,
    "checkoutSessionId" TEXT,
    "stripeBalanceTxnId" TEXT,
    "note" TEXT,
    "earnedAt" TIMESTAMP(3),
    "creditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerStat" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "perkViews" INTEGER NOT NULL DEFAULT 0,
    "perkClaims" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTicket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "priceType" TEXT NOT NULL DEFAULT 'guest',
    "status" "TicketStatus" NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_checkoutSessionId_key" ON "ReferralReward"("checkoutSessionId");

-- CreateIndex
CREATE INDEX "ReferralReward_referrerId_status_idx" ON "ReferralReward"("referrerId", "status");

-- CreateIndex
CREATE INDEX "ReferralReward_referredEmail_idx" ON "ReferralReward"("referredEmail");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerStat_partnerId_day_key" ON "PartnerStat"("partnerId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "EventTicket_stripeSessionId_key" ON "EventTicket"("stripeSessionId");

-- CreateIndex
CREATE INDEX "EventTicket_eventId_status_idx" ON "EventTicket"("eventId", "status");

-- CreateIndex
CREATE INDEX "EventTicket_email_idx" ON "EventTicket"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerStat" ADD CONSTRAINT "PartnerStat_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

