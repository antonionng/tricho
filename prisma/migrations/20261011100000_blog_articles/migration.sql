-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('writing', 'draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "BlogArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "BlogStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'consultations',
    "audience" TEXT NOT NULL DEFAULT 'both',
    "tags" TEXT[],
    "author" TEXT NOT NULL DEFAULT 'editorial',
    "image" TEXT NOT NULL DEFAULT 'hairDetail',
    "standfirst" TEXT NOT NULL DEFAULT '',
    "answer" TEXT NOT NULL DEFAULT '',
    "takeaways" TEXT[],
    "body" TEXT NOT NULL DEFAULT '',
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "sources" JSONB NOT NULL DEFAULT '[]',
    "related" JSONB,
    "reviewer" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "targetQuery" TEXT NOT NULL DEFAULT '',
    "brief" TEXT,
    "sourceUrls" TEXT[],
    "ai" JSONB,
    "origin" TEXT NOT NULL DEFAULT 'studio',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogArticle_slug_key" ON "BlogArticle"("slug");

-- CreateIndex
CREATE INDEX "BlogArticle_status_publishedAt_idx" ON "BlogArticle"("status", "publishedAt");
