-- Charities we support free of charge, with their own colour, banner and gallery.

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "accentColor" TEXT,
ADD COLUMN     "charityNumber" TEXT,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'brand';
