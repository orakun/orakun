import path from "path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const DB_PATH = path.join(process.cwd(), "data", "portfolio.db");

function createPrismaClient() {
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  const adapter = new PrismaBetterSqlite3({ url: `file:${DB_PATH}` });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return parseFloat(String(val));
}
