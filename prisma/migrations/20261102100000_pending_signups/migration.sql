-- AlterTable
ALTER TABLE "User" ADD COLUMN "heardFrom" TEXT;

-- CreateTable
CREATE TABLE "PendingSignup" (
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "profession" "Profession",
    "practiceName" TEXT,
    "city" TEXT,
    "country" TEXT,
    "heardFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingSignup_pkey" PRIMARY KEY ("email")
);
