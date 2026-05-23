import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./data/portfolio.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return parseFloat(String(val));
}
