import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function databaseUrl() {
  const raw = process.env.DATABASE_URL ?? "";
  // pg v8 treats sslmode=require as verify-full, which rejects the Supabase pooler chain.
  return raw.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl(),
  ssl: { rejectUnauthorized: false },
});

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
