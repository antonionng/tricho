-- CreateEnum
CREATE TYPE "CourseBuildTier" AS ENUM ('tailor', 'build', 'build_film');

-- CreateEnum
CREATE TYPE "CourseQuoteStatus" AS ENUM ('none', 'draft', 'sent', 'paid', 'waived', 'withdrawn');

-- AlterTable
ALTER TABLE "CourseRequest" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "quoteAmount" INTEGER,
ADD COLUMN     "quoteNote" TEXT,
ADD COLUMN     "quoteSentAt" TIMESTAMP(3),
ADD COLUMN     "quoteStatus" "CourseQuoteStatus" NOT NULL DEFAULT 'none',
ADD COLUMN     "sharePct" INTEGER,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "tier" "CourseBuildTier",
ADD COLUMN     "waivedReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CourseRequest_stripeCheckoutSessionId_key" ON "CourseRequest"("stripeCheckoutSessionId");

