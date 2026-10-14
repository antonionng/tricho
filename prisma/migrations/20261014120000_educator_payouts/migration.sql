-- Educator payouts: Stripe Connect accounts on educator profiles, and a
-- record of every paid course place and the money movements behind it.
CREATE TYPE "SaleStatus" AS ENUM ('paid', 'partially_refunded', 'refunded', 'disputed');

ALTER TABLE "EducatorProfile" ADD COLUMN     "connectUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "transfersActive" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CourseSale" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "versionId" TEXT,
    "educatorId" TEXT,
    "priceType" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "gross" INTEGER NOT NULL,
    "sharePct" INTEGER NOT NULL DEFAULT 0,
    "platformAmount" INTEGER NOT NULL,
    "educatorAmount" INTEGER NOT NULL,
    "stripeFee" INTEGER,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeTransferId" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'paid',
    "refundedAmount" INTEGER NOT NULL DEFAULT 0,
    "reversedAmount" INTEGER NOT NULL DEFAULT 0,
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseSale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "stripeObjectId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseSale_enrolmentId_key" ON "CourseSale"("enrolmentId");

CREATE UNIQUE INDEX "CourseSale_stripePaymentIntentId_key" ON "CourseSale"("stripePaymentIntentId");

CREATE UNIQUE INDEX "CourseSale_stripeChargeId_key" ON "CourseSale"("stripeChargeId");

CREATE INDEX "CourseSale_educatorId_createdAt_idx" ON "CourseSale"("educatorId", "createdAt");

CREATE INDEX "CourseSale_courseSlug_idx" ON "CourseSale"("courseSlug");

CREATE INDEX "LedgerEntry_saleId_idx" ON "LedgerEntry"("saleId");

CREATE UNIQUE INDEX "LedgerEntry_type_stripeObjectId_key" ON "LedgerEntry"("type", "stripeObjectId");

CREATE UNIQUE INDEX "EducatorProfile_stripeAccountId_key" ON "EducatorProfile"("stripeAccountId");

ALTER TABLE "CourseSale" ADD CONSTRAINT "CourseSale_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "CourseEnrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseSale" ADD CONSTRAINT "CourseSale_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "EducatorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "CourseSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

