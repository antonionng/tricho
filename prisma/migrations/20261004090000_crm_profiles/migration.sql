-- CRM: organisations, contacts and notes; uploaded files; verification requests; richer member profiles.

-- CreateEnum
CREATE TYPE "OrgStage" AS ENUM ('lead', 'contacted', 'proposal', 'won', 'customer', 'lost', 'churned');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "teamNote" TEXT;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "logoFileId" TEXT;

-- AlterTable
ALTER TABLE "TrichologistProfile" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "memberships" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "photoFileId" TEXT,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "practiceName" TEXT,
ADD COLUMN     "qualifications" JSONB,
ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "showAddress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showPhone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socials" JSONB,
ADD COLUMN     "specialisms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "yearsInPractice" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "crmOwnerId" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "name" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "data" BYTEA,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'brand',
    "category" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "companyNumber" TEXT,
    "vatNumber" TEXT,
    "size" TEXT,
    "description" TEXT,
    "logoFileId" TEXT,
    "socials" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stage" "OrgStage" NOT NULL DEFAULT 'lead',
    "source" TEXT,
    "interest" TEXT,
    "valueGBP" INTEGER,
    "followUpAt" TIMESTAMP(3),
    "ownerStaffId" TEXT,
    "accountEmail" TEXT,
    "partnerId" TEXT,
    "intake" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationContact" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganisationContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationNote" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "authorId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'note',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganisationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileId" TEXT,
    "note" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoredFile_ownerId_kind_idx" ON "StoredFile"("ownerId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_partnerId_key" ON "Organisation"("partnerId");

-- CreateIndex
CREATE INDEX "Organisation_stage_updatedAt_idx" ON "Organisation"("stage", "updatedAt");

-- CreateIndex
CREATE INDEX "Organisation_accountEmail_idx" ON "Organisation"("accountEmail");

-- CreateIndex
CREATE INDEX "OrganisationContact_organisationId_idx" ON "OrganisationContact"("organisationId");

-- CreateIndex
CREATE INDEX "OrganisationContact_email_idx" ON "OrganisationContact"("email");

-- CreateIndex
CREATE INDEX "OrganisationNote_organisationId_createdAt_idx" ON "OrganisationNote"("organisationId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_createdAt_idx" ON "VerificationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationRequest_userId_idx" ON "VerificationRequest"("userId");

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationContact" ADD CONSTRAINT "OrganisationContact_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationContact" ADD CONSTRAINT "OrganisationContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationNote" ADD CONSTRAINT "OrganisationNote_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Every brand page already on the platform gets a CRM record.
INSERT INTO "Organisation" ("id", "name", "kind", "category", "website", "email", "description", "stage", "source", "interest", "accountEmail", "partnerId", "updatedAt")
SELECT 'org_' || p."id", p."name", 'brand', p."category", p."website", p."contactEmail", p."blurb",
       CASE WHEN p."published" AND NOT p."hidden" THEN 'customer'::"OrgStage" ELSE 'won'::"OrgStage" END,
       'partner-page', p."tier", p."ownerEmail", p."id", CURRENT_TIMESTAMP
FROM "Partner" p
ON CONFLICT DO NOTHING;

INSERT INTO "OrganisationContact" ("id", "organisationId", "name", "email", "isPrimary")
SELECT 'orgc_' || p."id", 'org_' || p."id", split_part(p."ownerEmail", '@', 1), p."ownerEmail", true
FROM "Partner" p WHERE p."ownerEmail" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Partner applications and enquiries waiting in the inbox become leads.
INSERT INTO "Organisation" ("id", "name", "kind", "category", "website", "email", "stage", "source", "interest", "intake", "createdAt", "updatedAt")
SELECT 'org_' || d."id",
       COALESCE(NULLIF(d."payload"->>'company', ''), NULLIF(d."payload"->>'name', ''), d."title"),
       'brand', NULLIF(d."payload"->>'category', ''), NULLIF(d."payload"->>'website', ''), d."payload"->>'email',
       CASE WHEN d."status" = 'rejected' THEN 'lost'::"OrgStage" WHEN d."status" = 'draft' THEN 'lead'::"OrgStage" ELSE 'contacted'::"OrgStage" END,
       CASE WHEN (d."payload"->>'application') = 'true' THEN 'application' ELSE 'enquiry' END,
       NULLIF(d."payload"->>'interest', ''), d."payload", d."createdAt", CURRENT_TIMESTAMP
FROM "Draft" d
WHERE d."kind" = 'partner_enquiry' AND d."payload" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "OrganisationContact" ("id", "organisationId", "name", "email", "title", "isPrimary")
SELECT 'orgc_' || d."id", 'org_' || d."id", COALESCE(NULLIF(d."payload"->>'name', ''), d."payload"->>'email'), d."payload"->>'email', NULLIF(d."payload"->>'role', ''), true
FROM "Draft" d
WHERE d."kind" = 'partner_enquiry' AND d."payload" IS NOT NULL AND COALESCE(d."payload"->>'email', '') <> ''
ON CONFLICT DO NOTHING;

-- The member profile becomes the source of truth: copy what the directory already holds.
UPDATE "TrichologistProfile" tp SET
  "city" = COALESCE(tp."city", l."city", tp."location"),
  "country" = COALESCE(tp."country", l."country"),
  "headline" = COALESCE(tp."headline", l."headline"),
  "services" = CASE WHEN cardinality(tp."services") = 0 THEN l."services" ELSE tp."services" END
FROM "DirectoryListing" l
WHERE l."userId" = tp."userId";
UPDATE "TrichologistProfile" SET "city" = "location" WHERE "city" IS NULL AND "location" IS NOT NULL;
