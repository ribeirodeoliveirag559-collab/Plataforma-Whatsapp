import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status  = searchParams.get('status')?.toUpperCase()
  const showAll = searchParams.get('showAll') === 'true'
  const page    = Number(searchParams.get('pageNumber') || 1)
  const pageSize = 20
  const skip     = (page - 1) * pageSize

  // Busca dados do usuário (isManager não está no JWT)
  const dbUser = await prisma.user.findUnique({
    where:  { id: payload.id },
    select: { isManager: true },
  })
  const isManager = dbUser?.isManager ?? false

  // Filas do usuário logado
  let userQueueIds: number[] = []
  try {
    const userQueues = await prisma.userQueue.findMany({
      where:  { userId: payload.id },
      select: { queueId: true },
    })
    userQueueIds = userQueues.map(q => q.queueId)
  } catch {
    // Tabela user_queues ainda não existe no banco — trata como sem filas
    userQueueIds = []
  }

  let where: Record<string, unknown> = {}

  if (status === 'PENDING') {
    if (isManager || userQueueIds.length === 0) {
      // Gestores e usuários sem fila veem tudo
      where = { status: 'PENDING' }
    } else {
      // Filtra pelas filas do usuário
      where = {
        status: 'PENDING',
        OR: [
          { queueId: { in: userQueueIds } },
          { queueId: null },
        ],
      }
    }
  } else if (status === 'OPEN') {
    where = (showAll || isManager)
      ? { status: 'OPEN' }
      : { status: 'OPEN', userId: payload.id }
  } else if (status === 'CLOSED') {
    where = (showAll || isManager)
      ? { status: 'CLOSED' }
      : { status: 'CLOSED', userId: payload.id }
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
