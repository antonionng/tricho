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

const url = databaseUrl();
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

const adapter = new PrismaPg({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  // One connection per serverless instance: the Supabase pooler caps the total,
  // and many instances start at once when a page is busy.
  max: Number(process.env.DATABASE_POOL_MAX ?? (isLocal ? 10 : 1)),
  idleTimeoutMillis: isLocal ? 10_000 : 5_000,
});

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
