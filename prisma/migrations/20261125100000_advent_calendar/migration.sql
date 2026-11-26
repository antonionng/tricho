-- 12 Days of Christmas: claims and daily door statistics. Additive only.
CREATE TABLE "AdventClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "door" INTEGER NOT NULL,
    "source" TEXT,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdventClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdventStat" (
    "id" TEXT NOT NULL,
    "door" INTEGER NOT NULL,
    "day" DATE NOT NULL,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "claims" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdventStat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdventClaim_userId_door_key" ON "AdventClaim"("userId", "door");
CREATE INDEX "AdventClaim_door_createdAt_idx" ON "AdventClaim"("door", "createdAt");
CREATE UNIQUE INDEX "AdventStat_door_day_key" ON "AdventStat"("door", "day");
