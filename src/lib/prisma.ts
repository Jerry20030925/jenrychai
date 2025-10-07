import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 配置 Prisma 以使用 Supabase PostgreSQL
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.SUPABASE_DATABASE_URL || "postgresql://postgres:k7p0azBccg7saihX@db.bsqsvmldrjyasgitprik.supabase.co:5432/postgres?sslmode=require",
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };