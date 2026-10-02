-- Owner console: staff roles, audit log, member access, community rooms and moderation, Trichozette editions and podcast episodes.


-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('owner', 'editor', 'events', 'moderator', 'support');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('active', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "EditionStatus" AS ENUM ('generating', 'draft', 'scheduled', 'published', 'withdrawn');

-- CreateEnum
CREATE TYPE "EpisodeStatus" AS ENUM ('planning', 'draft', 'published', 'withdrawn');

-- DropIndex
DROP INDEX "Report_postId_reporterId_key";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenReason" TEXT;

-- AlterTable
ALTER TABLE "CommunityPost" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenReason" TEXT;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "aiVerdict" JSONB,
ADD COLUMN     "commentId" TEXT,
ADD COLUMN     "resolution" TEXT,
ADD COLUMN     "resolvedById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessReason" TEXT,
ADD COLUMN     "accessStatus" "AccessStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "accessUntil" TIMESTAMP(3),
ADD COLUMN     "compPlan" "Plan",
ADD COLUMN     "compUntil" TIMESTAMP(3),
ADD COLUMN     "mutedUntil" TIMESTAMP(3),
ADD COLUMN     "staffRole" "StaffRole";

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityRoom" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "professionalOnly" BOOLEAN NOT NULL DEFAULT false,
    "noBrands" BOOLEAN NOT NULL DEFAULT false,
    "aiModeration" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GazetteEdition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL DEFAULT 0,
    "series" TEXT NOT NULL DEFAULT 'current',
    "status" "EditionStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "fade" TEXT NOT NULL DEFAULT '',
    "theme" TEXT NOT NULL DEFAULT '',
    "standfirst" TEXT NOT NULL DEFAULT '',
    "coverImageKey" TEXT,
    "coverTone" TEXT NOT NULL DEFAULT 'light',
    "audience" TEXT[],
    "period" TEXT,
    "focus" TEXT,
    "pages" JSONB NOT NULL DEFAULT '[]',
    "sources" JSONB,
    "newsTopics" TEXT[],
    "brief" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GazetteEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GazetteRevision" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "authorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GazetteRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastEpisode" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "number" INTEGER,
    "season" INTEGER,
    "status" "EpisodeStatus" NOT NULL DEFAULT 'planning',
    "title" TEXT NOT NULL,
    "fade" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "showNotes" TEXT NOT NULL DEFAULT '',
    "keyMoments" JSONB,
    "quotes" TEXT[],
    "guestName" TEXT,
    "guestRole" TEXT,
    "guestBio" TEXT,
    "guestUserId" TEXT,
    "topic" TEXT,
    "audioUrl" TEXT,
    "embedUrl" TEXT,
    "externalId" TEXT,
    "durationSec" INTEGER,
    "coverImageKey" TEXT,
    "transcript" TEXT,
    "transcriptStatus" TEXT NOT NULL DEFAULT 'none',
    "plan" JSONB,
    "membersOnly" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_createdAt_idx" ON "AuditLog"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "MemberNote_userId_createdAt_idx" ON "MemberNote"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GazetteEdition_slug_key" ON "GazetteEdition"("slug");

-- CreateIndex
CREATE INDEX "GazetteEdition_status_publishedAt_idx" ON "GazetteEdition"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "GazetteRevision_editionId_createdAt_idx" ON "GazetteRevision"("editionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisode_slug_key" ON "PodcastEpisode"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisode_externalId_key" ON "PodcastEpisode"("externalId");

-- CreateIndex
CREATE INDEX "PodcastEpisode_status_publishedAt_idx" ON "PodcastEpisode"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Report_postId_reporterId_idx" ON "Report"("postId", "reporterId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberNote" ADD CONSTRAINT "MemberNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberNote" ADD CONSTRAINT "MemberNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GazetteRevision" ADD CONSTRAINT "GazetteRevision_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "GazetteEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Existing admins join the team. The two owners from OWNER_EMAILS become owners, everyone else an editor.
-- role = 'admin' stays for now: billing reads it to keep staff from being downgraded.
UPDATE "User" SET "staffRole" = 'owner'
  WHERE "role" = 'admin' AND lower("email") IN ('ag@experrt.com', 'karley@trichollective.net');
UPDATE "User" SET "staffRole" = 'editor'
  WHERE "role" = 'admin' AND "staffRole" IS NULL;

-- The rooms the community has today, so nothing changes until the team edits them.
INSERT INTO "CommunityRoom" ("id", "label", "blurb", "prompt", "professionalOnly", "noBrands", "aiModeration", "position", "updatedAt") VALUES
  ('lounge', 'The Lounge', 'Everyday conversation across the whole collective.', 'What''s on your mind this week?', false, false, false, 0, CURRENT_TIMESTAMP),
  ('introductions', 'Introductions', 'New here? Say hello and tell us what you do.', 'Tell us who you are, where you practise and what you''d love to learn.', false, false, false, 1, CURRENT_TIMESTAMP),
  ('head-spa', 'Head Spa & Scalp Care', 'Techniques, routines, products and the craft of scalp care.', 'Share a technique, a question or something you''ve noticed in the treatment room.', false, false, false, 2, CURRENT_TIMESTAMP),
  ('hair-loss', 'Hair Loss & Trichology', 'Shedding, thinning and scalp conditions, discussed carefully.', 'Ask a question or share what''s working in your practice.', false, true, false, 3, CURRENT_TIMESTAMP),
  ('case-room', 'Case Room', 'Anonymised cases for verified professionals. Never share anything that identifies a client.', 'Describe the case without names, photos of faces or anything identifying.', true, true, true, 4, CURRENT_TIMESTAMP),
  ('devices', 'Devices & Technology', 'Scopes, LED and UV devices, and the evidence behind them.', 'Which device are you asking about, and what do you want to know?', false, false, false, 5, CURRENT_TIMESTAMP),
  ('business', 'Business & Marketing', 'Pricing, menus, marketing and running a practice.', 'What''s a business question you''d like help with?', false, false, false, 6, CURRENT_TIMESTAMP),
  ('wins', 'Wins', 'Good news, big and small. Celebrate each other.', 'Share something that went well.', false, false, false, 7, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
