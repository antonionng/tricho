-- Brand portal: owners manage their partner page, upload a logo and give five team members Professional.
ALTER TABLE "Partner" ADD COLUMN "ownerEmail" TEXT;
ALTER TABLE "Partner" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "Partner_ownerEmail_key" ON "Partner"("ownerEmail");

CREATE TABLE "PartnerLogo" (
    "partnerId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PartnerLogo_pkey" PRIMARY KEY ("partnerId")
);
ALTER TABLE "PartnerLogo" ADD CONSTRAINT "PartnerLogo_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BusinessSeat" (
    "id" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BusinessSeat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessSeat_ownerEmail_email_key" ON "BusinessSeat"("ownerEmail", "email");
CREATE INDEX "BusinessSeat_email_idx" ON "BusinessSeat"("email");
