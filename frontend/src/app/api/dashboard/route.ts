import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [pending, open, closedToday, closedMonth, byQueue] = await Promise.all([
    prisma.ticket.count({ where: { status: 'PENDING' } }),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count({
      where: { status: 'CLOSED', closedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
    }),
    prisma.ticket.count({ where: { status: 'CLOSED', closedAt: { gte: startOfMonth } } }),
    prisma.queue.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            tickets: { where: { status: { in: ['OPEN', 'PENDING'] } } }
          }
        }
      }
    })
  ])

  return NextResponse.json({ pending, open, closedToday, closedMonth, byQueue })
}
