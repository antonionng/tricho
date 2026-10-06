import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function databaseUrl() {
  // DATABASE_POOL_URL, when set, points at the transaction-mode pooler (port 6543),
  // which shares connections across serverless instances instead of capping them.
  const raw = process.env.DATABASE_POOL_URL || process.env.DATABASE_URL || "";
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

/** Every new notification also goes to the member's phones. Loaded lazily to avoid an import cycle. */
const pushNotification = (n: { userId: string; title: string; href?: string | null }) =>
  import("@/lib/mobile/push").then(({ pushToUser }) => pushToUser(n.userId, n)).catch(() => {});

function createClient(): PrismaClient {
  // The extension only adds a side effect, so the client keeps its plain type.
  const client = new PrismaClient({ adapter }).$extends({
    query: {
      notification: {
        async create({ args, query }) {
          const row = await query(args);
          const n = row as { userId?: string; title?: string; href?: string | null };
          if (n.userId && n.title) await pushNotification({ userId: n.userId, title: n.title, href: n.href });
          return row;
        },
        async createMany({ args, query }) {
          const result = await query(args);
          const rows = Array.isArray(args.data) ? args.data : [args.data];
          await Promise.all(rows.map((n) => pushNotification(n)));
          return result;
        },
      },
    },
  });
  return client as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
