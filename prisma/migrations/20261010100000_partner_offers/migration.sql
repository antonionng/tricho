-- CreateTable
CREATE TABLE "PartnerOffer" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Something else',
    "website" TEXT,
    "contactName" TEXT,
    "email" TEXT NOT NULL,
    "priceGBP" INTEGER NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'year',
    "fixedPrice" BOOLEAN NOT NULL DEFAULT true,
    "isFounding" BOOLEAN NOT NULL DEFAULT true,
    "inclusions" JSONB NOT NULL,
    "accentColor" TEXT,
    "tagline" TEXT,
    "logoUrl" TEXT,
    "heroUrl" TEXT,
    "personalNote" TEXT,
    "firstMasterclass" TEXT,
    "firstFeature" TEXT,
    "foundingNumber" INTEGER,
    "legalNameHint" TEXT,
    "companyNumberHint" TEXT,
    "addressHint" TEXT,
    "specialTerms" TEXT,
    "paymentUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'sent',
    "createdBy" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "signerName" TEXT,
    "signerRole" TEXT,
    "legalName" TEXT,
    "companyNumber" TEXT,
    "address" TEXT,
    "accountEmail" TEXT,
    "acceptedIp" TEXT,
    "userAgent" TEXT,
    "snapshot" JSONB,
    "signature" TEXT,
    "contractFileId" TEXT,
    "contractSha256" TEXT,
    "paymentMethod" TEXT,
    "checkoutSessionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "invoiceUrl" TEXT,
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerOffer_token_key" ON "PartnerOffer"("token");

-- CreateIndex
CREATE INDEX "PartnerOffer_status_createdAt_idx" ON "PartnerOffer"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerOffer_email_idx" ON "PartnerOffer"("email");

-- CreateIndex
CREATE INDEX "PartnerOffer_stripeSubscriptionId_idx" ON "PartnerOffer"("stripeSubscriptionId");
