import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const queues = await prisma.queue.findMany({
    where: { deletedAt: null },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { tickets: { where: { status: { in: ['OPEN', 'PENDING'] } } } } }
    }
  })
  return NextResponse.json(queues)
}
