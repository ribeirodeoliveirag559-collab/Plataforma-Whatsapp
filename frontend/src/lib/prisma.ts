import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function buildUrl(base: string | undefined) {
  if (!base) return base
  // Limita a 1 conexão por instância serverless; PgBouncer cuida do pool real
  const sep = base.includes('?') ? '&' : '?'
  return base.includes('connection_limit') ? base : `${base}${sep}connection_limit=1&pool_timeout=10`
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    datasources: { db: { url: buildUrl(process.env.DATABASE_URL) } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
