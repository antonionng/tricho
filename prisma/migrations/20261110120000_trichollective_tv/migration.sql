-- CreateEnum
CREATE TYPE "TvKind" AS ENUM ('masterclass', 'case_round', 'podcast', 'video');

-- CreateTable
CREATE TABLE "TvVideo" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "TvKind" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "presenters" TEXT,
    "provider" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "durationMin" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "professionalOnly" BOOLEAN NOT NULL DEFAULT false,
    "eventId" TEXT,
    "podcastEpisodeId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "postId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TvVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TvVideo_slug_key" ON "TvVideo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TvVideo_eventId_key" ON "TvVideo"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TvVideo_podcastEpisodeId_key" ON "TvVideo"("podcastEpisodeId");

-- CreateIndex
CREATE UNIQUE INDEX "TvVideo_postId_key" ON "TvVideo"("postId");

-- CreateIndex
CREATE INDEX "TvVideo_published_recordedAt_idx" ON "TvVideo"("published", "recordedAt");

-- AddForeignKey
ALTER TABLE "TvVideo" ADD CONSTRAINT "TvVideo_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvVideo" ADD CONSTRAINT "TvVideo_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvVideo" ADD CONSTRAINT "TvVideo_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

