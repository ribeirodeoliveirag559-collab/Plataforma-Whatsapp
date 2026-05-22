import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

// Categorias mapeadas pelos IDs dos departamentos
const CATEGORIES: Record<string, number[]> = {
  Vendas:              [1],
  Suporte:             [3, 4],
  'Assistência Técnica': [5, 6],
  Financeiro:          [2],
  Outros:              [7, 8],
}

export async function GET(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Contadores gerais
  const [pending, open, closedToday, closedMonth] = await Promise.all([
    prisma.ticket.count({ where: { status: 'PENDING' } }),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count({
      where: { status: 'CLOSED', closedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
    }),
    prisma.ticket.count({ where: { status: 'CLOSED', closedAt: { gte: startOfMonth } } }),
  ])

  // Últimos 6 meses de dados por categoria
  const months: { label: string; start: Date; end: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    })
  }

  // Para cada mês, buscar contagem por categoria
  const monthlyData = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const counts: Record<string, number> = {}
      await Promise.all(
        Object.entries(CATEGORIES).map(async ([cat, ids]) => {
          counts[cat] = await prisma.ticket.count({
            where: {
              queueId: { in: ids },
              createdAt: { gte: start, lte: end },
            },
          })
        })
      )
      return { label, ...counts }
    })
  )

  // Totais do mês atual por categoria
  const currentMonthByCategory = await Promise.all(
    Object.entries(CATEGORIES).map(async ([cat, ids]) => {
      const count = await prisma.ticket.count({
        where: { queueId: { in: ids }, createdAt: { gte: startOfMonth } }
      })
      return { category: cat, count }
    })
  )

  // Departamentos com contagem em aberto
  const byQueue = await prisma.queue.findMany({
    where: { deletedAt: null },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { tickets: { where: { status: { in: ['OPEN', 'PENDING'] } } } } }
    }
  })

  return NextResponse.json({
    pending, open, closedToday, closedMonth,
    monthlyData,
    currentMonthByCategory,
    byQueue,
  })
}
