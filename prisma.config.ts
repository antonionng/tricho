import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// .env.local wins over .env (dotenv never overrides a value already set),
// so local development points at the local database, never the live one.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
