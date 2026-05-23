import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL ?? `file:${path.join(__dirname, "data", "portfolio.db")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
    ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}),
  },
});
