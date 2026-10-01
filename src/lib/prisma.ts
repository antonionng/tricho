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
  // Small pools: serverless functions and parallel build workers each hold their own.
  max: Number(process.env.DATABASE_POOL_MAX ?? (isLocal ? 10 : 3)),
});

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
