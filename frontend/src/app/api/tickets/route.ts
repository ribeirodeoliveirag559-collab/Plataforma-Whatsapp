import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const payload = verifyToken(token) as { id: number; isManager?: boolean } | null
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status  = searchParams.get('status')?.toUpperCase()
  const showAll = searchParams.get('showAll') === 'true'   // toggle "ver todas"
  const page    = Number(searchParams.get('pageNumber') || 1)
  const pageSize = 20
  const skip     = (page - 1) * pageSize

  // Filas do usuário logado
  const userQueues = await prisma.userQueue.findMany({
    where:  { userId: payload.id },
    select: { queueId: true },
  })
  const userQueueIds = userQueues.map(q => q.queueId)

  let where: Record<string, unknown> = {}

  if (status === 'PENDING') {
    // Pendentes: tickets das filas do usuário (ou todos se sem fila atribuída)
    where = {
      status: 'PENDING',
      OR: [
        ...(userQueueIds.length > 0 ? [{ queueId: { in: userQueueIds } }] : []),
        { queueId: null },   // sem fila: visível para todos
      ],
    }
    // Gestores veem tudo
    if (payload.isManager || userQueueIds.length === 0) {
      where = { status: 'PENDING' }
    }
  } else if (status === 'OPEN') {
    if (showAll || payload.isManager) {
      // Ver todas as conversas abertas
      where = { status: 'OPEN' }
    } else {
      // Só minhas conversas
      where = { status: 'OPEN', userId: payload.id }
    }
  } else if (status === 'CLOSED') {
    where = { status: 'CLOSED' }
    // Não-gestores veem só as suas
    if (!payload.isManager && !showAll) {
      where = { status: 'CLOSED', userId: payload.id }
    }
  } else if (status) {
    where = { status }
  }

  const [tickets, count] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, number: true, profilePicUrl: true, company: true } },
        queue:   { select: { id: true, name: true, color: true } },
        user:    { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ])

  return NextResponse.json({ tickets, count, hasMore: skip + pageSize < count })
}

export async function POST(req: NextRequest) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()

  const ticket = await prisma.ticket.create({
    data: {
      contactId: body.contactId,
      queueId:   body.queueId || null,
      userId:    body.userId  || null,
      status:    'PENDING',
    },
    include: {
      contact: true,
      queue:   true,
      user:    { select: { id: true, name: true, avatar: true } },
    },
  })
  return NextResponse.json(ticket, { status: 201 })
}
